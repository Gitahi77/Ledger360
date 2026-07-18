import { prisma } from '../lib/prisma';
import { v4 as uuidv4 } from 'uuid';

async function explainAnalyze() {
  const accountId = 'test-history-account-1';
  
  // 1. Account Lookup
  console.log('--- EXPLAIN ANALYZE: SELECT Account ---');
  const explainSelect: any = await prisma.$queryRaw`EXPLAIN ANALYZE SELECT "id", "balanceMinor", "allowNegativeBalance" FROM "Account" WHERE "id" = ${accountId}`;
  console.log(explainSelect.map((r: any) => r['QUERY PLAN']).join('\n'));

  // 2. Transaction Insert
  const txId = uuidv4();
  console.log('\n--- EXPLAIN ANALYZE: INSERT Transaction ---');
  const explainInsert: any = await prisma.$queryRaw`EXPLAIN ANALYZE INSERT INTO "Transaction" ("id", "userId", "accountId", "categoryId", "type", "name", "baseAmountMinor", "currency", "date") VALUES (${txId}, 'test-history-user-1', ${accountId}, 'test-history-category-1', 'expense', 'Test EXPLAIN', 100, 'KES', NOW())`;
  console.log(explainInsert.map((r: any) => r['QUERY PLAN']).join('\n'));

  // 3. Account Update
  console.log('\n--- EXPLAIN ANALYZE: UPDATE Account ---');
  const explainUpdate: any = await prisma.$queryRaw`EXPLAIN ANALYZE UPDATE "Account" SET "balanceMinor" = "balanceMinor" + 100 WHERE "id" = ${accountId}`;
  console.log(explainUpdate.map((r: any) => r['QUERY PLAN']).join('\n'));
}

explainAnalyze().catch(console.error).finally(() => process.exit(0));
