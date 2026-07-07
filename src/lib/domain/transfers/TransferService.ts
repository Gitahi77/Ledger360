import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { TransferResultDTO } from '@/lib/mappers/transfers';
import { TransferValidator } from './TransferValidator';
import { TransferPolicy } from './TransferPolicy';
import { TransferReferenceGenerator } from './TransferReferenceGenerator';
import { LoanRepaymentCalculator } from '../loans/LoanRepaymentCalculator';
import { getTransferByIdempotencyKey } from '@/lib/repositories/transfers';
import { EventBus } from '../events';
import { toMajor } from '@/lib/money';

export type TransferRequest = {
  idempotencyKey: string;
  userId: string;
  fromAccountId: string;
  toAccountId?: string | null;
  amountMinor: number;
  date: Date;
  note?: string | null;
  goalId?: string | null;
  loanId?: string | null;
  interestMinor?: number; // Override auto-interest
};

export class TransferService {

  static async executeTransfer(req: TransferRequest): Promise<TransferResultDTO> {
    if (!TransferPolicy.canTransfer(req.amountMinor)) {
      throw new Error('Transfer amount must be greater than zero.');
    }

    // 1. Transparent Idempotency Check (Outside transaction for speed)
    const existing = await getTransferByIdempotencyKey(req.userId, req.idempotencyKey);
    if (existing) {
      return {
        status: 'completed',
        transferId: existing.id,
        amountMinor: Number(existing.amountMinor),
        interestMinor: Number(existing.interestMinor),
        referenceNumber: existing.idempotencyKey ?? undefined, // Fallback for legacy
      };
    }

    // 2. Orchestrate within an atomic Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      
      // Step A: Optimistic Locking via row-level write lock on the Source Account
      // This forces any concurrent transfers from the same account to queue up sequentially.
      const fromAccount = await tx.account.update({
        where: { id: req.fromAccountId, userId: req.userId },
        data: { updatedAt: new Date() } // Trigger lock
      });

      const toAccount = req.toAccountId 
        ? await tx.account.update({ where: { id: req.toAccountId, userId: req.userId }, data: { updatedAt: new Date() } })
        : null;

      // Step B: Validation
      TransferValidator.validateAccounts(fromAccount, toAccount);

      // Step C: Check Overdraft Rules (must compute derived balance inside the locked transaction)
      let currentSourceBalance = 0;
      if (!TransferPolicy.canOverdraft(fromAccount)) {
        currentSourceBalance = await this.computeAccountBalance(tx, req.fromAccountId, req.userId, Number(fromAccount.openingMinor));
        if (currentSourceBalance - req.amountMinor < 0) {
          throw new Error(`Not enough money in ${fromAccount.name}. Available: ${fromAccount.currency} ${toMajor(currentSourceBalance)}.`);
        }
      }

      // Step D: Calculate Loan Repayment if applicable
      let finalInterestMinor = 0;
      let remainingLoanBalanceMinor: number | undefined;

      if (req.loanId) {
        // Lock the loan row as well
        const loan = await tx.loan.update({
          where: { id: req.loanId, userId: req.userId },
          data: { updatedAt: new Date() }
        });
        
        if (!loan) throw new Error('Loan not found.');

        const allocation = LoanRepaymentCalculator.allocateRepayment(loan, req.amountMinor, req.interestMinor);
        finalInterestMinor = allocation.interestMinor;
        remainingLoanBalanceMinor = allocation.remainingLoanBalanceMinor;

        // Apply repayment to loan balance in the ledger
        await tx.loan.update({
          where: { id: req.loanId },
          data: { balanceMinor: BigInt(remainingLoanBalanceMinor) }
        });
      }

      // Step E: Goal Funding check
      if (req.goalId) {
        const goal = await tx.goal.findFirst({ where: { id: req.goalId, userId: req.userId } });
        if (!goal) throw new Error('Goal not found.');
      }

      // Step F: Create the Ledger Entry
      const referenceNumber = TransferReferenceGenerator.generate();
      
      const transferRecord = await tx.transfer.create({
        data: {
          userId: req.userId,
          fromAccountId: req.fromAccountId,
          toAccountId: req.toAccountId || null,
          amountMinor: req.amountMinor,
          currency: fromAccount.currency,
          baseAmountMinor: req.amountMinor, // Assuming same-currency for now
          fxRate: 1,
          date: req.date, // Automatically UTC from Server Action parsing
          note: req.note,
          goalId: req.goalId || null,
          loanId: req.loanId || null,
          interestMinor: finalInterestMinor,
          source: 'MANUAL',
          idempotencyKey: req.idempotencyKey,
        }
      });

      // Step G: Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: req.userId,
          action: 'CREATE',
          resource: 'Transfer',
          metadata: JSON.stringify({ 
            transferId: transferRecord.id, 
            amount: req.amountMinor, 
            from: req.fromAccountId, 
            to: req.toAccountId ?? undefined, 
            goal: req.goalId ?? undefined, 
            loan: req.loanId ?? undefined,
            idempotencyKey: req.idempotencyKey
          }),
        }
      });

      return {
        status: 'completed' as const,
        transferId: transferRecord.id,
        amountMinor: req.amountMinor,
        interestMinor: finalInterestMinor,
        referenceNumber,
        remainingLoanBalanceMinor,
        updatedSourceBalanceMinor: currentSourceBalance - req.amountMinor,
      };
    });

    // 3. Dispatch Domain Events POST-COMMIT
    EventBus.dispatch({ type: 'TransferCompleted', payload: { transferId: result.transferId as string, referenceNumber: result.referenceNumber as string } });
    if (req.loanId) {
      EventBus.dispatch({ type: 'LoanRepaid', payload: { loanId: req.loanId, amountMinor: req.amountMinor } });
    }
    if (req.goalId) {
      EventBus.dispatch({ type: 'GoalFunded', payload: { goalId: req.goalId, amountMinor: req.amountMinor } });
    }

    return result;
  }

  /**
   * Computes the derived balance directly from the ledger within a transaction.
   * This guarantees consistent reads under our write-lock.
   */
  private static async computeAccountBalance(tx: Prisma.TransactionClient, accountId: string, userId: string, openingMinor: number): Promise<number> {
    const [inc, exp, transOut, transIn] = await Promise.all([
      tx.transaction.aggregate({ where: { accountId, userId, type: 'income' }, _sum: { baseAmountMinor: true } }),
      tx.transaction.aggregate({ where: { accountId, userId, type: 'expense' }, _sum: { baseAmountMinor: true } }),
      tx.transfer.aggregate({ where: { fromAccountId: accountId, userId }, _sum: { amountMinor: true } }),
      tx.transfer.aggregate({ where: { toAccountId: accountId, userId }, _sum: { baseAmountMinor: true } })
    ]);

    const totalInc = Number(inc._sum.baseAmountMinor ?? 0);
    const totalExp = Number(exp._sum.baseAmountMinor ?? 0);
    const totalTxOut = Number(transOut._sum.amountMinor ?? 0);
    const totalTxIn = Number(transIn._sum.baseAmountMinor ?? 0);

    return openingMinor + totalInc - totalExp + totalTxIn - totalTxOut;
  }
}
