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
          reference: original.id,
          status: 'VOIDED'
        }
      });

      // Update original transaction
      await tx.transaction.update({
        where: { id: original.id },
        data: { status: 'VOIDED' }
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

  static async splitTransaction(
    userId: string,
    parentId: string,
    children: { baseAmountMinor: number; categoryId: string; note?: string }[],
    idempotencyKey: string
  ) {
    if (!parentId || children.length < 2) throw AppError.Validation('At least two splits required');

    const parent = await prisma.transaction.findFirst({
      where: { id: parentId, userId }
    });
    if (!parent) throw AppError.NotFound('Transaction not found');
    if (parent.status === 'VOIDED') throw AppError.FinancialInvariant('Cannot split a voided transaction');
    if (parent.parentId) throw AppError.FinancialInvariant('Cannot split an already split child transaction');

    const { validateSplitTotal } = await import('@/lib/finance/transactions');
    if (!validateSplitTotal(parent.baseAmountMinor, children)) {
      throw AppError.FinancialInvariant('Split amounts must equal the parent amount');
    }

    const existing = await prisma.idempotencyRecord.findUnique({ where: { idempotencyKey } });
    if (existing) return existing;

    return await prisma.$transaction(async (tx) => {
      // Create children
      for (const child of children) {
        await tx.transaction.create({
          data: {
            userId,
            accountId: parent.accountId,
            categoryId: child.categoryId,
            type: parent.type,
            baseAmountMinor: BigInt(child.baseAmountMinor),
            currency: parent.currency,
            date: parent.date,
            name: `${parent.name} (Split)`,
            note: child.note,
            parentId: parent.id,
            status: 'ACTIVE'
          }
        });
      }

      // Hide parent from normal accounting by archiving it (wait, it's still ACTIVE for accounting? 
      // Actually, if we keep the parent ACTIVE, then the sum is 2x. 
      // A split transaction parent should not contribute to sums if its children do.
      // So the parent should be ARCHIVED (hidden from UI, and we exclude ARCHIVED from sums, wait.
      // If we exclude ARCHIVED from sums, then the children provide the sum.
      // Let's mark parent as ARCHIVED so it's not double-counted.)
      await tx.transaction.update({
        where: { id: parent.id },
        data: { status: 'ARCHIVED', archivedAt: new Date() }
      });

      await tx.idempotencyRecord.create({
        data: {
          idempotencyKey,
          requestHash: 'splitTransaction',
          responseStatus: 200,
          processingStatus: 'COMPLETED',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      return { success: true };
    });
  }

  static async mergeSplitTransactions(
    userId: string,
    parentId: string,
    idempotencyKey: string
  ) {
    const parent = await prisma.transaction.findFirst({
      where: { id: parentId, userId },
      include: { children: true }
    });
    if (!parent) throw AppError.NotFound('Parent transaction not found');
    if (parent.children.length === 0) throw AppError.Validation('Transaction has no splits');

    if (parent.status === 'VOIDED') throw AppError.FinancialInvariant('Cannot merge a voided parent transaction');

    let childrenSum = 0n;
    for (const child of parent.children) {
      if (child.status === 'VOIDED') throw AppError.FinancialInvariant('Cannot merge because a child split is voided');
      childrenSum += BigInt(child.baseAmountMinor);
    }

    if (childrenSum !== BigInt(parent.baseAmountMinor)) {
      throw AppError.FinancialInvariant('Cannot merge: sum of splits does not equal parent amount');
    }

    const existing = await prisma.idempotencyRecord.findUnique({ where: { idempotencyKey } });
    if (existing) return existing;

    return await prisma.$transaction(async (tx) => {
      // Delete children (they were only splits, not original ledger entries)
      // Or we can void them. Wait, splits aren't physical bank transactions, they are user-defined classifications.
      // So deleting them is fine, or we can soft-delete them. Let's delete them for simplicity since they are just allocations of the parent.
      await tx.transaction.deleteMany({
        where: { parentId: parent.id }
      });

      // Restore parent
      await tx.transaction.update({
        where: { id: parent.id },
        data: { status: 'ACTIVE', archivedAt: null }
      });

      await tx.idempotencyRecord.create({
        data: {
          idempotencyKey,
          requestHash: 'mergeTransactions',
          responseStatus: 200,
          processingStatus: 'COMPLETED',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      });

      return { success: true };
    });
  }
}
