import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

async function setupTestData() {
  const userId = 'test-overhead-user';
  const accountId = 'test-overhead-account';
  const categoryId = 'test-overhead-category';
  
  const testEmail = `overhead-${Date.now()}@test.com`;
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, name: 'Test User', email: testEmail, currency: 'KES', accountType: 'individual' }
  });

  await prisma.category.upsert({
    where: { name_userId: { name: 'Test Overhead Category', userId } },
    update: {},
    create: { id: categoryId, name: 'Test Overhead Category', userId, type: 'expense' }
  });
  
  await prisma.account.upsert({
    where: { id: accountId },
    update: {},
    create: { id: accountId, userId, name: 'Test Account', type: 'CHECKING', currency: 'KES' }
  });
  
  await prisma.transaction.deleteMany({ where: { accountId } });
  
  return { userId, accountId, categoryId };
}

async function runBenchmark(mode: 'separate' | 'sequential' | 'raw', { userId, accountId, categoryId }: any) {
  console.log(`\n--- Running Prisma Overhead Benchmark: Mode = ${mode} ---`);
  
  const CONCURRENCY = 50;
  const ITERATIONS_PER_VU = 10;
  
  const startTime = performance.now();
  
  const worker = async () => {
    for (let i = 0; i < ITERATIONS_PER_VU; i++) {
      const txId = uuidv4();
      const auditId = uuidv4();
      const date = new Date();
      
      if (mode === 'separate') {
        await prisma.account.findFirst({ where: { id: accountId } });
        await prisma.transaction.groupBy({ by: ['type'], where: { accountId }, orderBy: { type: 'asc' }, _sum: { baseAmountMinor: true } });
        await prisma.transfer.aggregate({ where: { fromAccountId: accountId }, _sum: { amountMinor: true } });
        await prisma.transfer.aggregate({ where: { toAccountId: accountId }, _sum: { baseAmountMinor: true } });
        await prisma.transaction.create({
          data: { id: txId, userId, accountId, categoryId, name: 'Test', type: 'expense', baseAmountMinor: 100n, date, currency: 'KES' }
        });
        await prisma.auditLog.create({
          data: { id: auditId, userId, action: 'CREATE', resource: 'Tx', metadata: {} }
        });
      } else if (mode === 'sequential') {
        await prisma.$transaction([
          prisma.account.findFirst({ where: { id: accountId } }),
          prisma.transaction.groupBy({ by: ['type'], where: { accountId }, orderBy: { type: 'asc' }, _sum: { baseAmountMinor: true } }),
          prisma.transfer.aggregate({ where: { fromAccountId: accountId }, _sum: { amountMinor: true } }),
          prisma.transfer.aggregate({ where: { toAccountId: accountId }, _sum: { baseAmountMinor: true } }),
          prisma.transaction.create({
            data: { id: txId, userId, accountId, categoryId, name: 'Test', type: 'expense', baseAmountMinor: 100n, date, currency: 'KES' }
          }),
          prisma.auditLog.create({
            data: { id: auditId, userId, action: 'CREATE', resource: 'Tx', metadata: {} }
          })
        ]);
      } else if (mode === 'raw') {
        await prisma.$executeRawUnsafe(`
          BEGIN;
          SELECT id FROM "Account" WHERE id = '${accountId}' LIMIT 1;
          SELECT type, SUM("baseAmountMinor") FROM "Transaction" WHERE "accountId" = '${accountId}' GROUP BY type;
          SELECT SUM("amountMinor") FROM "Transfer" WHERE "fromAccountId" = '${accountId}';
          SELECT SUM("baseAmountMinor") FROM "Transfer" WHERE "toAccountId" = '${accountId}';
          INSERT INTO "Transaction" (id, "userId", "accountId", "categoryId", name, type, "baseAmountMinor", date, currency, "createdAt", "updatedAt") 
          VALUES ('${txId}', '${userId}', '${accountId}', '${categoryId}', 'Test', 'expense', 100, NOW(), 'KES', NOW(), NOW());
          INSERT INTO "AuditLog" (id, "userId", action, resource, metadata, "createdAt") 
          VALUES ('${auditId}', '${userId}', 'CREATE', 'Tx', '{}', NOW());
          COMMIT;
        `);
      }
    }
  };

  const promises = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    promises.push(worker());
  }

  await Promise.all(promises);
  
  const endTime = performance.now();
  const durationMs = endTime - startTime;
  const iters = CONCURRENCY * ITERATIONS_PER_VU;
  const throughput = (iters / (durationMs / 1000)).toFixed(2);
  
  return { mode, durationMs: durationMs.toFixed(2) + 'ms', throughput };
}

async function main() {
  const data = await setupTestData();
  
  const results = [];
  results.push(await runBenchmark('separate', data));
  results.push(await runBenchmark('sequential', data));
  results.push(await runBenchmark('raw', data));

  console.log('\n================================================');
  console.log('   PRISMA OVERHEAD BENCHMARK RESULTS            ');
  console.log('================================================\n');
  console.log('| Mode            | Duration   | Throughput (Iters/s) |');
  console.log('| --------------- | ---------- | -------------------- |');
  for (const r of results) {
    console.log(`| ${r.mode.padEnd(15)} | ${r.durationMs.padEnd(10)} | ${r.throughput.padEnd(20)} |`);
  }
  process.exit(0);
}

main().catch(console.error);
