import { prisma } from '../lib/prisma';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DEPTHS = [100, 1000, 5000, 10000, 50000];
const TEST_ACCOUNT_ID = 'test-history-account-1';
const TEST_CATEGORY_ID = 'test-history-category-1';
const TEST_USER_ID = 'test-history-user-1';

async function setupTestData() {
  console.log('Setting up test user, account, and category...');
  await prisma.user.upsert({
    where: { id: TEST_USER_ID },
    update: {},
    create: { id: TEST_USER_ID, name: 'History Test User', email: 'history@test.com', currency: 'KES', accountType: 'individual' }
  });
  await prisma.account.upsert({
    where: { id: TEST_ACCOUNT_ID },
    update: {},
    create: { id: TEST_ACCOUNT_ID, userId: TEST_USER_ID, name: 'History Test Account', type: 'CHECKING', currency: 'KES' }
  });
  await prisma.category.upsert({
    where: { name_userId: { name: 'History Test Category', userId: TEST_USER_ID } },
    update: {},
    create: { id: TEST_CATEGORY_ID, name: 'History Test Category', userId: TEST_USER_ID, type: 'expense' }
  });
}

async function seedTransactions(count: number) {
  console.log(`Seeding ${count} transactions...`);
  await prisma.transaction.deleteMany({ where: { accountId: TEST_ACCOUNT_ID } });

  const batchSize = 5000;
  for (let i = 0; i < count; i += batchSize) {
    const chunk = Math.min(batchSize, count - i);
    const data = Array.from({ length: chunk }).map((_, j) => ({
      userId: TEST_USER_ID,
      accountId: TEST_ACCOUNT_ID,
      categoryId: TEST_CATEGORY_ID,
      type: 'expense',
      name: `Test Tx ${i + j}`,
      baseAmountMinor: 100n,
      date: new Date(),
    }));
    await prisma.transaction.createMany({ data });
  }
  console.log(`Finished seeding ${count} transactions.`);
}

async function getPgMetrics() {
  // Capture active connections
  const activity: any[] = await prisma.$queryRaw`
    SELECT count(*) as count, state 
    FROM pg_stat_activity 
    WHERE datname = current_database() 
    GROUP BY state;
  `;
  const activeCount = Number(activity.find(a => a.state === 'active')?.count || 0);

  // Capture DB stats
  const dbStats: any[] = await prisma.$queryRaw`
    SELECT blks_hit, blks_read, tup_returned, tup_fetched
    FROM pg_stat_database 
    WHERE datname = current_database();
  `;
  return {
    activeConnections: activeCount,
    blksHit: Number(dbStats[0]?.blks_hit || 0),
    blksRead: Number(dbStats[0]?.blks_read || 0)
  };
}

async function runBenchmark(depth: number) {
  console.log(`\n--- Running benchmark for depth: ${depth} ---`);
  await seedTransactions(depth);

  const preMetrics = await getPgMetrics();

  console.log(`Running k6...`);
  // Update scenarios to target the test account
  // Note: we can just run the generic write_only.js but it randomly picks an account.
  // We need to modify write_only.js or pass an ENV to force it to use TEST_ACCOUNT_ID.
  
  // Create a temporary k6 script that hardcodes this test account
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
  const payload = JSON.stringify({
    userId: '${TEST_USER_ID}',
    accountId: '${TEST_ACCOUNT_ID}',
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
  const scriptPath = path.join(process.cwd(), 'scripts', 'benchmarks', 'history_depth.js');
  fs.writeFileSync(scriptPath, k6Script);

  try {
    const k6Cmd = 'cmd.exe /c "k6-bin\\k6-v0.49.0-windows-amd64\\k6.exe run scripts\\benchmarks\\history_depth.js"';
    const output = execSync(k6Cmd, { encoding: 'utf8', stdio: 'pipe' });
    
    // Parse p95 latency
    const match = output.match(/http_req_duration\.*:\s*avg=([^ ]+)\s*min=([^ ]+)\s*med=([^ ]+)\s*max=([^ ]+)\s*p\(90\)=([^ ]+)\s*p\(95\)=([^ ]+)/);
    const p95 = match ? match[6] : 'Unknown';
    
    // Parse req/s
    const reqMatch = output.match(/http_reqs\.*:\s*(\d+)\s*([^ ]+)\/s/);
    const iters = reqMatch ? reqMatch[1] : '0';

    const postMetrics = await getPgMetrics();
    
    return {
      depth,
      p95,
      iters,
      activeConnections: postMetrics.activeConnections,
      cacheHitRatio: (postMetrics.blksHit / (postMetrics.blksHit + postMetrics.blksRead) * 100).toFixed(2) + '%'
    };
  } catch (error: any) {
    // If threshold fails, execSync throws. We can still extract stdout.
    const output = error.stdout || '';
    const match = output.match(/http_req_duration\.*:\s*avg=([^ ]+)\s*min=([^ ]+)\s*med=([^ ]+)\s*max=([^ ]+)\s*p\(90\)=([^ ]+)\s*p\(95\)=([^ ]+)/);
    const p95 = match ? match[6] : 'Unknown';
    const reqMatch = output.match(/http_reqs\.*:\s*(\d+)\s*([^ ]+)\/s/);
    const iters = reqMatch ? reqMatch[1] : '0';
    const postMetrics = await getPgMetrics();
    
    return {
      depth,
      p95,
      iters,
      activeConnections: postMetrics.activeConnections,
      cacheHitRatio: (postMetrics.blksHit / (postMetrics.blksHit + postMetrics.blksRead) * 100).toFixed(2) + '%'
    };
  }
}

async function main() {
  await setupTestData();
  
  const results = [];
  for (const depth of DEPTHS) {
    const res = await runBenchmark(depth);
    results.push(res);
  }

  console.log('\n================================================');
  console.log('   HISTORY-DEPTH SCALING BENCHMARK RESULTS      ');
  console.log('================================================\n');
  console.log('| Transactions | p95 Latency | Throughput (Iters) | DB Active Conns | Buffer Hit |');
  console.log('| ------------ | ----------- | ------------------ | --------------- | ---------- |');
  for (const r of results) {
    console.log(`| ${r.depth.toString().padEnd(12)} | ${r.p95.padEnd(11)} | ${r.iters.padEnd(18)} | ${r.activeConnections.toString().padEnd(15)} | ${r.cacheHitRatio.padEnd(10)} |`);
  }
  
  process.exit(0);
}

main().catch(console.error);
