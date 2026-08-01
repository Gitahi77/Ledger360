import 'dotenv/config';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { prisma } from '../lib/prisma';
import { TransactionService } from '../lib/domain/services/TransactionService';
import { randomUUID } from 'crypto';

describe('Financial Invariants Suite (Stage 5.8)', () => {
  let testUserId: string;
  let testAccountId: string;

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `invariant-test-${randomUUID()}@example.com`,
        name: 'Invariant Tester',
        currency: 'KES',
      }
    });
    testUserId = user.id;

    const account = await prisma.account.create({
      data: {
        userId: user.id,
        name: 'Main Checking',
        type: 'CHECKING',
        currency: 'KES',
        allowNegativeBalance: false,
        openingMinor: 0n,
        balanceMinor: 0n
      }
    });
    testAccountId = account.id;
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { id: testUserId } });
  });

  it('I-01: Double-Entry Balance Integrity', async () => {
    const localAccountId = testAccountId;
    const localUserId = testUserId;
    // We use fast-check to generate random sequences of valid transactions
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            amount: fc.integer({ min: 1, max: 10000000 }),
            type: fc.constantFrom('income', 'expense') as fc.Arbitrary<'income' | 'expense'>,
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (txs) => {
          // Because allowNegativeBalance is false, we must sort or ensure we only run valid paths.
          // To avoid fighting the DB constraint during random generation, we will temporarily allow negative balances
          // for this specific test of pure mathematical integrity.
          await prisma.account.update({
            where: { id: localAccountId },
            data: { allowNegativeBalance: true, balanceMinor: 0n } // reset balance
          });
          
          await prisma.transaction.deleteMany({ where: { accountId: localAccountId } });

          let expectedBalance = 0n;

          for (const tx of txs) {
            const idempotencyKey = randomUUID();
            await TransactionService.createTransaction(
              localUserId,
              localAccountId,
              undefined,
              tx.amount,
              tx.type,
              'Random Tx',
              new Date(),
              undefined,
              idempotencyKey
            );

            if (tx.type === 'income') expectedBalance += BigInt(tx.amount);
            else expectedBalance -= BigInt(tx.amount);
          }

          const account = await prisma.account.findUniqueOrThrow({ where: { id: localAccountId } });
          expect(account.balanceMinor).toBe(expectedBalance);
          
          // Verify sum of transactions
          const aggregate = await prisma.transaction.aggregate({
            where: { accountId: localAccountId, type: 'income' },
            _sum: { baseAmountMinor: true }
          });
          const incomeSum = aggregate._sum.baseAmountMinor ?? 0n;
          
          const expAgg = await prisma.transaction.aggregate({
            where: { accountId: localAccountId, type: 'expense' },
            _sum: { baseAmountMinor: true }
          });
          const expSum = expAgg._sum.baseAmountMinor ?? 0n;

          expect(account.balanceMinor).toBe(incomeSum - expSum);
        }
      ),
      { numRuns: 3 } // keeping runs lower for CI speed, can be increased locally
    );
  }, 30000);

  it('I-03: Non-Negative Constraints (Database level)', async () => {
    await prisma.account.update({
      where: { id: testAccountId },
      data: { allowNegativeBalance: false, balanceMinor: 0n }
    });

    // Try to create an expense that would overdraw
    await expect(
      TransactionService.createTransaction(
        testUserId,
        testAccountId,
        undefined,
        5000,
        'expense',
        'Overdraft Tx',
        new Date(),
        undefined,
        randomUUID()
      )
    ).rejects.toThrow(/Insufficient funds|account_balance_non_negative_check/);
  });

  it('I-05: Idempotency and Retry Safety', async () => {
    const idempotencyKey = randomUUID();
    
    // First call succeeds
    const res1 = await TransactionService.createTransaction(
      testUserId, testAccountId, undefined, 1000, 'income', 'Salary', new Date(), undefined, idempotencyKey
    );
    expect(res1.created).toBe(true);

    // Second call with same key should skip
    const res2 = await TransactionService.createTransaction(
      testUserId, testAccountId, undefined, 1000, 'income', 'Salary', new Date(), undefined, idempotencyKey
    );
    expect(res2.created).toBe(false);

    // Balance should only reflect 1000
    const acc = await prisma.account.findUniqueOrThrow({ where: { id: testAccountId } });
    expect(acc.balanceMinor).toBe(1000n);
  });

  it('I-09: Transaction Immutability (Append-only)', async () => {
    const res = await TransactionService.createTransaction(
      testUserId, testAccountId, undefined, 5000, 'income', 'Bonus', new Date(), undefined, randomUUID()
    );
    const txId = res.transaction!.id;

    // Voiding it creates a reversal
    await TransactionService.voidTransaction(testUserId, txId, randomUUID());

    // Both transactions should exist
    const txs = await prisma.transaction.findMany({ where: { accountId: testAccountId }, orderBy: { createdAt: 'asc' } });
    expect(txs.length).toBe(2);
    expect(txs[0].baseAmountMinor).toBe(5000n);
    expect(txs[0].type).toBe('income');
    expect(txs[1].baseAmountMinor).toBe(5000n);
    expect(txs[1].type).toBe('expense');
    expect(txs[1].name).toContain('[VOID]');

    // Net balance is 0
    const acc = await prisma.account.findUniqueOrThrow({ where: { id: testAccountId } });
    expect(acc.balanceMinor).toBe(0n);
    
    // Trying to void again fails
    await expect(
      TransactionService.voidTransaction(testUserId, txId, randomUUID())
    ).rejects.toThrow(/already voided/);
  });

  it('I-10: Split and Merge Invariants', async () => {
    // 1. Create a parent transaction
    const res = await TransactionService.createTransaction(
      testUserId, testAccountId, undefined, 10000, 'expense', 'Supermarket', new Date(), undefined, randomUUID()
    );
    const parentId = res.transaction!.id;

    // 2. Setup categories for split
    const cat1 = await prisma.category.create({ data: { userId: testUserId, name: 'Groceries', type: 'expense' }});
    const cat2 = await prisma.category.create({ data: { userId: testUserId, name: 'Household', type: 'expense' }});

    // 3. Test invalid split (amounts do not add up)
    await expect(
      TransactionService.splitTransaction(
        testUserId,
        parentId,
        [
          { baseAmountMinor: 5000, categoryId: cat1.id },
          { baseAmountMinor: 4999, categoryId: cat2.id } // Off by 1
        ],
        randomUUID()
      )
    ).rejects.toThrow(/Split amounts must equal the parent amount/);

    // 4. Test valid split
    await TransactionService.splitTransaction(
      testUserId,
      parentId,
      [
        { baseAmountMinor: 5000, categoryId: cat1.id },
        { baseAmountMinor: 5000, categoryId: cat2.id }
      ],
      randomUUID()
    );

    // Parent should be ARCHIVED, children should be ACTIVE
    const parentAfterSplit = await prisma.transaction.findUniqueOrThrow({ where: { id: parentId }, include: { children: true } });
    expect(parentAfterSplit.status).toBe('ARCHIVED');
    expect(parentAfterSplit.children.length).toBe(2);
    expect(parentAfterSplit.children[0].status).toBe('ACTIVE');
    expect(parentAfterSplit.children[1].status).toBe('ACTIVE');
    expect(parentAfterSplit.children[0].baseAmountMinor + parentAfterSplit.children[1].baseAmountMinor).toBe(10000n);

    // 5. Void one child
    await TransactionService.voidTransaction(testUserId, parentAfterSplit.children[0].id, randomUUID());

    // 6. Test invalid merge (child is voided)
    await expect(
      TransactionService.mergeSplitTransactions(testUserId, parentId, randomUUID())
    ).rejects.toThrow(/Cannot merge because a child split is voided/);
  });

});
