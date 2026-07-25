import { TransactionNormalizer, RawTransaction } from '../transactions/TransactionNormalizer';
import { Money } from '../money/Money';
import { Transaction, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { getMetrics } from '@/lib/metrics/MetricsRegistry';

export class TransactionService {
  /**
   * INVARIANT 9: Ledger Append-Only
   * Instead of deleting, we void by creating a reversing entry.
   */
  static async voidTransaction(
    userId: string,
    transactionId: string,
    idempotencyKey: string
  ) {
    // 1. Validate input
    if (!transactionId) throw AppError.Validation('Transaction ID required');

    // 2. Validate business rules
    const original = await prisma.transaction.findFirst({
      where: { id: transactionId, userId }
    });
    if (!original) throw AppError.NotFound('Transaction not found');
    if (original.name.includes('[VOID]')) throw AppError.FinancialInvariant('Cannot void a voiding transaction');
    
    const alreadyVoided = await prisma.transaction.findFirst({
      where: { reference: transactionId, userId, name: { contains: '[VOID]' } }
    });
    if (alreadyVoided) throw AppError.FinancialInvariant('Transaction is already voided');

    // 3. Check Idempotency
    const existing = await prisma.idempotencyRecord.findUnique({ where: { idempotencyKey } });
    if (existing) return existing; // Handle properly in action

    // 4. Execute atomic transaction
    return await prisma.$transaction(async (tx) => {
      // Create compensating entry
      const reversalDelta = original.type === 'income' ? -BigInt(original.baseAmountMinor) : BigInt(original.baseAmountMinor);
      const newType = original.type === 'income' ? 'expense' : 'income';

      const compensatingTx = await tx.transaction.create({
        data: {
          userId,
          accountId: original.accountId,
          categoryId: original.categoryId,
          type: newType,
          baseAmountMinor: original.baseAmountMinor,
          currency: original.currency,
          date: new Date(),
          name: `[VOID] Reversal of ${original.id}`,
          note: `Auto-generated reversal for ${original.id}`,
          reference: original.id
        }
      });

      // Update balance
      await tx.account.update({
        where: { id: original.accountId },
        data: { balanceMinor: { increment: reversalDelta } }
      });

      // Mark idempotency
      await tx.idempotencyRecord.create({
        data: {
          idempotencyKey,
          requestHash: 'void',
          responseStatus: 200,
          processingStatus: 'COMPLETED',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      return compensatingTx;
    });
  }

  static async createTransaction(
    userId: string,
    accountId: string,
    categoryId: string | undefined,
    baseAmountMinor: number,
    type: 'income' | 'expense',
    name: string,
    date: Date,
    note: string | undefined,
    idempotencyKey: string
  ) {
    // 1. Validate Input (already done via z.schema in action, but we check here too)
    if (!accountId || !name || baseAmountMinor <= 0) throw AppError.Validation('Invalid transaction parameters');

    // 2. Validate Business Rules
    const acc = await prisma.account.findFirst({ where: { id: accountId, userId } });
    if (!acc) throw AppError.NotFound('Account not found or unauthorized');

    let resolvedCategoryId = categoryId;
    
    const { persistencePayload } = this.processNewTransaction(
      accountId,
      Money.fromMinor(baseAmountMinor, acc.currency),
      type,
      name,
      date,
      note,
      undefined
    );

    if (type === 'expense' && acc.type !== 'CREDIT_CARD') {
      const projectedBalance = Number(acc.balanceMinor) - baseAmountMinor;
      if (projectedBalance < 0 && !acc.allowNegativeBalance) {
        throw AppError.FinancialInvariant(`Insufficient funds: ${acc.name} does not allow negative balances.`);
      }
    }

    // 3. Check Idempotency
    const existing = await prisma.idempotencyRecord.findUnique({ where: { idempotencyKey } });
    if (existing) return { created: false, transaction: null, record: existing };

    // 4. Execute single database transaction
    return await prisma.$transaction(async (tx) => {
      // Resolve category
      if (!resolvedCategoryId) {
        let cat = await tx.category.findFirst({ where: { name: 'Uncategorized', userId } });
        if (!cat) cat = await tx.category.create({ data: { name: 'Uncategorized', type, userId } });
        resolvedCategoryId = cat.id;
      }

      const delta = type === 'income' ? BigInt(baseAmountMinor) : -BigInt(baseAmountMinor);

      const createdTx = await tx.transaction.create({
        data: {
          userId,
          accountId,
          categoryId: resolvedCategoryId,
          type,
          baseAmountMinor: BigInt(baseAmountMinor),
          currency: acc.currency,
          date,
          name: persistencePayload.name,
          note: persistencePayload.note
        }
      });

      await tx.account.update({
        where: { id: accountId },
        data: { balanceMinor: { increment: delta } }
      });

      await tx.idempotencyRecord.create({
        data: {
          idempotencyKey,
          requestHash: 'createTransaction',
          responseStatus: 200,
          processingStatus: 'COMPLETED',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      // 5. Emit events (audit log)
      await tx.auditLog.create({
        data: {
          userId,
          action: 'CREATE_LEDGER_ENTRY',
          resource: 'Transaction',
          metadata: { txId: createdTx.id, amount: baseAmountMinor, name },
        }
      });

      // 6. Return immutable result
      return { created: true, transaction: createdTx };
    });
  }

  static processNewTransaction(
    accountId: string,
    amount: Money,
    type: 'income' | 'expense',
    merchantName: string,
    date: Date,
    notes?: string,
    categoryHint?: string
  ) {
    const raw: RawTransaction = {
      accountId,
      amount,
      type,
      rawMerchantName: merchantName,
      date,
      notes,
      originalCategoryHint: categoryHint
    };

    const verified = TransactionNormalizer.process(raw);

    return {
      persistencePayload: {
        accountId: verified.accountId,
        baseAmountMinor: BigInt(verified.amount.minorUnits),
        currency: verified.amount.currency,
        type: verified.type,
        name: verified.rawMerchantName,
        note: verified.notes,
        date: verified.date,
        categoryHint: verified.classification.categoryNameHint,
      },
      metadata: {
        normalizedMerchantName: verified.normalizedMerchantName,
        merchantConfidence: verified.classification.merchantConfidence,
        categoryConfidence: verified.classification.categoryConfidence,
        isVerified: verified.isVerified,
        categoryHint: verified.classification.categoryNameHint
      }
    };
  }

  static enrichExistingTransaction(dbTx: Transaction & { category?: { name: string } | null }, currency: string) {
    const raw: RawTransaction = {
      accountId: dbTx.accountId,
      amount: Money.fromMinor(Number(dbTx.baseAmountMinor), currency),
      type: dbTx.type as 'income' | 'expense',
      rawMerchantName: dbTx.name,
      date: dbTx.date,
      notes: dbTx.note || undefined,
      originalCategoryHint: dbTx.category?.name
    };

    const verified = TransactionNormalizer.process(raw);

    return {
      dbTx,
      metadata: {
        normalizedMerchantName: verified.normalizedMerchantName,
        merchantConfidence: verified.classification.merchantConfidence,
        categoryConfidence: verified.classification.categoryConfidence,
        isVerified: verified.isVerified,
      }
    };
  }
}
