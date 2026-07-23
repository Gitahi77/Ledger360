import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { addTransaction, deleteTransaction, editTransaction, importTransactions } from '../lib/actions/transactions';
import { createTransfer } from '../lib/actions/transfers';
import { getAccountBalances } from '../lib/actions/accounts';
import { InMemoryRetryCollector, setRetryCollector } from '../lib/metrics/RetryCollector';
import crypto from 'crypto';

// Setup user manually for the test
const TEST_USER_ID = 'stress-user';
const ACCOUNT_A = 'stress-acc-a';
const ACCOUNT_B = 'stress-acc-b';
const CATEGORY_ID = 'stress-cat';

const testCollector = new InMemoryRetryCollector();

// Mock auth
vi.mock('@/lib/actions/_auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'stress-user' })
}));

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe('Stage 5.1 Concurrency Safety', () => {
  // Give ample timeout for 100 iterations of 100 concurrent requests
  vi.setConfig({ testTimeout: 300_000, hookTimeout: 300_000 });

  beforeAll(async () => {
    // Setup resources
    await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      update: {},
      create: { id: TEST_USER_ID, name: 'Stress User', email: 'stress@test.com', currency: 'USD', accountType: 'individual' }
    });
    
    await prisma.category.upsert({
      where: { id: CATEGORY_ID },
      update: {},
      create: { id: CATEGORY_ID, name: 'Stress Cat', userId: TEST_USER_ID, type: 'expense' }
    });
  });

  beforeEach(async () => {
    await prisma.idempotencyRecord.deleteMany();
    await prisma.auditLog.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.transaction.deleteMany({ where: { userId: TEST_USER_ID } });
    await prisma.transfer.deleteMany({ where: { userId: TEST_USER_ID } });
    
    await prisma.account.upsert({
      where: { id: ACCOUNT_A },
      update: { balanceMinor: 100000n, type: 'CHECKING' },
      create: { id: ACCOUNT_A, userId: TEST_USER_ID, name: 'Acc A', type: 'CHECKING', currency: 'USD', balanceMinor: 100000n, allowNegativeBalance: true }
    });
    
    await prisma.account.upsert({
      where: { id: ACCOUNT_B },
      update: { balanceMinor: 50000n, type: 'SAVINGS' },
      create: { id: ACCOUNT_B, userId: TEST_USER_ID, name: 'Acc B', type: 'SAVINGS', currency: 'USD', balanceMinor: 50000n, allowNegativeBalance: true }
    });
  });

  // Helper to verify invariants
  async function verifyInvariants(expectedA: bigint, expectedB: bigint) {
    const accA = await prisma.account.findUnique({ where: { id: ACCOUNT_A } });
    const accB = await prisma.account.findUnique({ where: { id: ACCOUNT_B } });
    
    expect(accA?.balanceMinor).toBe(expectedA);
    expect(accB?.balanceMinor).toBe(expectedB);

    // Persisted == Ledger-Derived check
    const balances = await getAccountBalances(TEST_USER_ID);
    const balancesData = balances.success ? balances.data : [];
    const derivedA = balancesData.find((b: any) => b.id === ACCOUNT_A)?.balanceMoney.amountMinor;
    const derivedB = balancesData.find((b: any) => b.id === ACCOUNT_B)?.balanceMoney.amountMinor;
    
    expect(accA?.balanceMinor).toBe(derivedA);
    expect(accB?.balanceMinor).toBe(derivedB);

    const dupKeys: any[] = await prisma.$queryRaw`
      SELECT "idempotencyKey", COUNT(id) as count
      FROM "IdempotencyRecord"
      GROUP BY "idempotencyKey"
      HAVING COUNT(id) > 1
    `;
    expect(dupKeys.length).toBe(0);

    const overdrafts = await prisma.account.count({ 
      where: { balanceMinor: { lt: 0 }, allowNegativeBalance: false } 
    });
    expect(overdrafts).toBe(0);
  }

  function reportMetrics(workloadName: string, elapsedMs: number) {
    console.log(`\n--- Metrics for ${workloadName} ---`);
    console.log(`Total Wall-Clock Time: ${elapsedMs}ms`);
    console.dir(testCollector.getMetricsSummary(), { depth: null });
    testCollector.reset();
  }

  // Iteration wrapper
  async function runIterations(iterations: number, name: string, task: (i: number) => Promise<void>) {
    console.log(`Starting ${iterations} iterations for ${name}...`);
    testCollector.reset();
    const start = Date.now();
    for (let i = 0; i < iterations; i++) {
      if (i % 10 === 0) console.log(`  ${name} iteration ${i}...`);
      await task(i);
    }
    reportMetrics(name, Date.now() - start);
  }

  // Reduced iteration count slightly for CI execution time limits, but still heavily concurrent.
  const ITERATIONS = 100;
  const CONCURRENCY = 100;

  it('1. 100 concurrent transfers from a single account', async () => {
    await runIterations(ITERATIONS, 'Concurrent Transfers', async (iter) => {
      // Start with 100k in A, 0 in B
      await prisma.account.update({ where: { id: ACCOUNT_A }, data: { balanceMinor: 100000n } });
      await prisma.account.update({ where: { id: ACCOUNT_B }, data: { balanceMinor: 0n } });
      await prisma.transfer.deleteMany();

      const promises = [];
      for (let j = 0; j < CONCURRENCY; j++) {
        promises.push(
          createTransfer({
            idempotencyKey: `tx-${iter}-${j}`,
            payload: {
              fromAccountId: ACCOUNT_A,
              toAccountId: ACCOUNT_B,
              amountMinor: 100, // Move 1.00
              date: new Date().toISOString().split('T')[0]
            }
          })
        );
      }
      const results = await Promise.all(promises);
      
      // Verify no failures
      const errors = results.filter(r => !r.success);
      expect(errors.length).toBe(0);

      // Verify
      // A: 100000 - (100 * 100) = 90000
      // B: 0 + (100 * 100) = 10000
      await verifyInvariants(90000n, 10000n);
    });
  });

  it('2. Concurrent edits and deletes', async () => {
    await runIterations(ITERATIONS, 'Concurrent Edits/Deletes', async (iter) => {
      await prisma.account.update({ where: { id: ACCOUNT_A }, data: { balanceMinor: 0n } });
      await prisma.transaction.deleteMany();

      // Create 100 initial transactions
      const txs = [];
      for (let j = 0; j < CONCURRENCY; j++) {
        const tx = await prisma.transaction.create({
          data: {
            userId: TEST_USER_ID,
            accountId: ACCOUNT_A,
            categoryId: CATEGORY_ID,
            baseAmountMinor: 500n,
            currency: 'USD',
            type: 'income',
            date: new Date(),
            name: `Initial ${j}`
          }
        });
        txs.push(tx);
      }
      
      // Fix balance manually for setup
      await prisma.account.update({ where: { id: ACCOUNT_A }, data: { balanceMinor: 50000n } });

      // Concurrently: edit half to +1000, delete other half
      const promises = [];
      for (let j = 0; j < CONCURRENCY; j++) {
        if (j % 2 === 0) {
          promises.push(
            editTransaction(txs[j].id, {
              idempotencyKey: `edit-${iter}-${j}`,
              payload: {
                id: txs[j].id,
                baseAmountMinor: 1000,
                type: 'income'
              }
            })
          );
        } else {
          promises.push(
            deleteTransaction({
              idempotencyKey: `del-${iter}-${j}`,
              payload: { id: txs[j].id }
            })
          );
        }
      }
      const results = await Promise.all(promises);
      const errors = results.filter(r => !r.success);
      expect(errors.length).toBe(0);

      // Remaining: 50 txs at +1000 = 50,000 balance
      await verifyInvariants(50000n, 50000n);
    });
  });

  it('3. Concurrent imports (CSV upload)', async () => {
    await runIterations(ITERATIONS, 'Concurrent Imports', async (iter) => {
      await prisma.account.update({ where: { id: ACCOUNT_A }, data: { balanceMinor: 0n } });
      await prisma.transaction.deleteMany();
      
      const promises = [];
      // Simulate 5 users trying to import 20 rows each concurrently to the same account
      for (let j = 0; j < 5; j++) {
        const payload = Array.from({ length: 20 }).map((_, idx) => ({
          name: `Import ${j}-${idx}`,
          baseAmountMinor: 100, 
          type: 'income',
          categoryName: 'Stress Cat',
          date: new Date().toISOString().split('T')[0],
          rawRow: `row data`,
          importHash: `import-${iter}-${j}`
        }));
        
        promises.push(
          importTransactions(payload as any, ACCOUNT_A)
        );
      }
      
      const results = await Promise.all(promises);
      expect(results.filter(r => !r.success).length).toBe(0);

      // 5 * 20 = 100 txs at +100 = 10,000 balance
      await verifyInvariants(10000n, 50000n);
    });
  });

  it('4. Concurrent Reads while Writes occur', async () => {
    await runIterations(ITERATIONS, 'Concurrent Reads', async (iter) => {
      await prisma.account.update({ where: { id: ACCOUNT_A }, data: { balanceMinor: 0n } });
      await prisma.transaction.deleteMany();

      // Launch 50 writes and 50 reconciliations randomly interleaved
      const promises = [];
      for (let j = 0; j < CONCURRENCY; j++) {
        if (Math.random() > 0.5) {
          promises.push(
            addTransaction({
              idempotencyKey: `tx-rec-${iter}-${j}`,
              payload: {
                accountId: ACCOUNT_A,
                categoryId: CATEGORY_ID,
                type: 'income',
                baseAmountMinor: 100,
                date: new Date().toISOString().split('T')[0],
                name: 'Test'
              }
            })
          );
        } else {
          promises.push(getAccountBalances(TEST_USER_ID));
        }
      }
      
      const results = await Promise.all(promises);
      // count how many were writes
      let writeCount = 0;
      for (const res of results) {
        if (res && typeof res === 'object' && 'success' in res && res.success && 'data' in res && typeof res.data === 'object' && res.data && 'id' in res.data) {
           writeCount++;
        }
      }
      
      // Expected balance = writeCount * 100
      await verifyInvariants(BigInt(writeCount * 100), 50000n);
    });
  });

  it('5. Burst traffic (simulated payroll/tax import)', async () => {
    // Simulate quiet period
    await prisma.account.update({ where: { id: ACCOUNT_A }, data: { balanceMinor: 0n } });
    await prisma.transaction.deleteMany();
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Firing 1000 concurrent requests in one burst...');
    const BURST_SIZE = 1000;
    const promises = [];
    for (let j = 0; j < BURST_SIZE; j++) {
      promises.push(
        addTransaction({
          idempotencyKey: `burst-tx-${j}`,
          payload: {
            accountId: ACCOUNT_A,
            categoryId: CATEGORY_ID,
            type: 'income',
            baseAmountMinor: 50,
            date: new Date().toISOString().split('T')[0],
            name: `Burst Tx ${j}`
          }
        })
      );
    }
    
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const elapsed = Date.now() - startTime;
    console.log(`Burst of ${BURST_SIZE} completed in ${elapsed}ms`);

    const errors = results.filter((r: any) => !r || !r.success);
    expect(errors.length).toBe(0);

    // 1000 * 50 = 50000
    await verifyInvariants(50000n, 50000n);
    reportMetrics('Burst Traffic', elapsed);
  });

  it('6. Idempotency under retries', async () => {
    testCollector.reset();
    await prisma.account.update({ where: { id: ACCOUNT_A }, data: { balanceMinor: 0n } });
    await prisma.transaction.deleteMany();
    await prisma.idempotencyRecord.deleteMany();

    const IDEMP_KEY = 'idem-retry-test-123';
    
    // We fire 10 concurrent requests with the SAME idempotency key.
    // One should succeed and create the IdempotencyRecord.
    // The others will either hit Unique Constraint violation (P2002) OR
    // hit P2034, retry, and then hit P2002.
    // We want to verify that regardless of how many retries occurred,
    // exactly 1 transaction and 1 idempotency record were created.
    
    const promises = [];
    for (let j = 0; j < 10; j++) {
      promises.push(
        addTransaction({
          idempotencyKey: IDEMP_KEY,
          payload: {
            accountId: ACCOUNT_A,
            categoryId: CATEGORY_ID,
            type: 'income',
            baseAmountMinor: 777,
            date: new Date().toISOString().split('T')[0],
            name: `Idempotency Test Tx`
          }
        })
      );
    }
    
    const startTime = Date.now();
    await Promise.allSettled(promises);
    reportMetrics('Idempotency Under Retries', Date.now() - startTime);

    const txCount = await prisma.transaction.count({ where: { accountId: ACCOUNT_A } });
    const idemCount = await prisma.idempotencyRecord.count({ where: { idempotencyKey: IDEMP_KEY } });

    expect(txCount).toBe(1);
    expect(idemCount).toBe(1);
    await verifyInvariants(777n, 50000n);
  });
});
