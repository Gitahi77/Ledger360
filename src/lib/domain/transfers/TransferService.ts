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
  idempotencyKey?: string | null;
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

    // 2. Orchestrate within an atomic Database Transaction
    const { withRetry } = await import('@/lib/db-retry');
    const result = await withRetry(() => prisma.$transaction(async (tx) => {
      
      // Step A & C: Optimistic Locking via row-level write lock & Balance Update
      const fromAccount = await tx.account.update({
        where: { id: req.fromAccountId, userId: req.userId },
        data: { balanceMinor: { decrement: req.amountMinor }, updatedAt: new Date() }
      });

      const toAccount = req.toAccountId 
        ? await tx.account.update({ 
            where: { id: req.toAccountId, userId: req.userId }, 
            data: { balanceMinor: { increment: req.amountMinor }, updatedAt: new Date() } 
          })
        : null;

      // Step B: Validation
      TransferValidator.validateAccounts(fromAccount, toAccount);

      // Check Overdraft Rules
      if (!TransferPolicy.canOverdraft(fromAccount)) {
        if (fromAccount.balanceMinor < 0n) {
          throw new Error(`Not enough money in ${fromAccount.name}. Available: ${fromAccount.currency} ${toMajor(Number(fromAccount.balanceMinor) + req.amountMinor)}.`);
        }
      }
      
      const currentSourceBalance = Number(fromAccount.balanceMinor) + req.amountMinor;

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
    }), { operationName: 'executeTransfer' });

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

  // O(N) computeAccountBalance was removed as part of Phase 4C
}
