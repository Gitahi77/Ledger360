import { prisma } from '../lib/prisma';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TOTAL_ROWS = 5000;
const TEST_USER_ID = 'test-cardinality-user-1';
const TEST_CATEGORY_ID = 'test-cardinality-category-1';

async function setupTestData(accountsCount: number, txPerAccount: number) {
  console.log(`Setting up test user with ${accountsCount} accounts (${txPerAccount} tx each)...`);
  await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: {},
    create: { id: TEST_USER_ID, name: 'Cardinality Test User', email: 'cardinality@test.com', currency: 'KES', accountType: 'individual' }
  });
  await prisma.category.upsert({
    where: { name_userId: { name: 'Cardinality Test Category', userId: TEST_USER_ID } },
    update: {},
    create: { id: TEST_CATEGORY_ID, name: 'Cardinality Test Category', userId: TEST_USER_ID, type: 'expense' }
  });

  // Clear existing accounts & transactions
  await prisma.account.deleteMany({ where: { userId: TEST_USER_ID } });

  // Create accounts
  const accountsData = Array.from({ length: accountsCount }).map((_, i) => ({
    id: `test-card-account-${i}`,
    userId: TEST_USER_ID,
    name: `Card Account ${i}`,
    type: 'CHECKING' as any,
    currency: 'KES'
  }));
  await prisma.account.createMany({ data: accountsData });

  // Seed transactions
  for (const acc of accountsData) {
    const txData = Array.from({ length: txPerAccount }).map((_, j) => ({
      userId: TEST_USER_ID,
      accountId: acc.id,
      categoryId: TEST_CATEGORY_ID,
      type: 'expense',
      name: `Test Tx`,
      baseAmountMinor: 100n,
      date: new Date(),
    }));
    await prisma.transaction.createMany({ data: txData });
  }
}

async function runBenchmark(name: string, accountsCount: number, txPerAccount: number) {
  console.log(`\n--- Running benchmark: ${name} (${accountsCount} accounts x ${txPerAccount} tx) ---`);
  await setupTestData(accountsCount, txPerAccount);

  console.log(`Running k6...`);
  const k6Script = `
import http from 'k6/http';
import { check } from 'k6';
export const options = {
  scenarios: {
    write: { executor: 'constant-vus', vus: 10, duration: '10s' }
  },
  thresholds: { http_req_duration: ['p(95)<10000'] }
};
export default function () {
  const url = 'http://localhost:3000/api/v1/transactions';
  // Pick a random account out of the available ones
  const accountIndex = Math.floor(Math.random() * ${accountsCount});
  const accountId = 'test-card-account-' + accountIndex;
  
  const payload = JSON.stringify({
    userId: '${TEST_USER_ID}',
    accountId: accountId,
    categoryId: '${TEST_CATEGORY_ID}',
    type: 'expense',
    amount: 10,
    currency: 'KES',
    name: 'K6 Test Tx',
    date: new Date().toISOString()
  });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);
  check(res, { 'is status 200': (r) => r.status === 200 });
}
  `;
  const scriptPath = path.join(process.cwd(), 'scripts', 'benchmarks', 'cardinality.js');
  fs.writeFileSync(scriptPath, k6Script);

  try {
    const k6Cmd = 'cmd.exe /c "k6-bin\\k6-v0.49.0-windows-amd64\\k6.exe run scripts\\benchmarks\\cardinality.js"';
    const output = execSync(k6Cmd, { encoding: 'utf8', stdio: 'pipe' });
    
    const match = output.match(/http_req_duration\.*:\s*avg=([^ ]+)\s*min=([^ ]+)\s*med=([^ ]+)\s*max=([^ ]+)\s*p\(90\)=([^ ]+)\s*p\(95\)=([^ ]+)/);
    const p95 = match ? match[6] : 'Unknown';
    const reqMatch = output.match(/http_reqs\.*:\s*(\d+)\s*([^ ]+)\/s/);
    const iters = reqMatch ? reqMatch[1] : '0';
    return { name, p95, iters };
  } catch (error: any) {
    const output = error.stdout || '';
    const match = output.match(/http_req_duration\.*:\s*avg=([^ ]+)\s*min=([^ ]+)\s*med=([^ ]+)\s*max=([^ ]+)\s*p\(90\)=([^ ]+)\s*p\(95\)=([^ ]+)/);
    const p95 = match ? match[6] : 'Unknown';
    const reqMatch = output.match(/http_reqs\.*:\s*(\d+)\s*([^ ]+)\/s/);
    const iters = reqMatch ? reqMatch[1] : '0';
    return { name, p95, iters };
  }
}

async function main() {
  const results = [];
  results.push(await runBenchmark('Broad (50x100)', 50, 100));
  results.push(await runBenchmark('Deep (1x5000)', 1, 5000));

  console.log('\n================================================');
  console.log('   ACCOUNT CARDINALITY BENCHMARK RESULTS        ');
  console.log('================================================\n');
  console.log('| Scenario        | Total Rows | p95 Latency | Throughput (Iters) |');
  console.log('| --------------- | ---------- | ----------- | ------------------ |');
  for (const r of results) {
    console.log(`| ${r.name.padEnd(15)} | ${TOTAL_ROWS.toString().padEnd(10)} | ${r.p95.padEnd(11)} | ${r.iters.padEnd(18)} |`);
  }
  process.exit(0);
}

main().catch(console.error);
