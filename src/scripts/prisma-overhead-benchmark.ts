import { prisma } from '../lib/prisma';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function setupTestData() {
  const userId = 'test-user';
  const accountId = 'test-account';
  
  await prisma.user.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId, name: 'Test User', email: 'overhead@test.com', currency: 'KES', accountType: 'individual' }
  });
  
  await prisma.account.upsert({
    where: { id: accountId },
    update: {},
    create: { id: accountId, userId, name: 'Test Account', type: 'CHECKING', currency: 'KES' }
  });
  
  // Clear any existing transactions for this account
  await prisma.transaction.deleteMany({ where: { accountId } });
}

async function runBenchmark(mode: string) {
  console.log(`\n--- Running Prisma Overhead Benchmark: Mode = ${mode} ---`);
  await setupTestData();

  const k6Script = `
import http from 'k6/http';
import { check } from 'k6';
export const options = {
  scenarios: {
    write: { executor: 'constant-vus', vus: 50, duration: '10s' }
  },
  thresholds: { http_req_duration: ['p(95)<10000'] }
};
export default function () {
  const url = 'http://localhost:3001/api/v1/benchmarks/prisma-overhead?mode=${mode}';
  const res = http.post(url, '{}', { headers: { 'Content-Type': 'application/json' } });
  check(res, { 'is status 200': (r) => r.status === 200 });
}
  `;
  const scriptPath = path.join(process.cwd(), 'scripts', 'benchmarks', 'overhead.js');
  if (!fs.existsSync(path.dirname(scriptPath))) {
    fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
  }
  fs.writeFileSync(scriptPath, k6Script);

  try {
    const k6Cmd = 'cmd.exe /c "k6-bin\\k6-v0.49.0-windows-amd64\\k6.exe run scripts\\benchmarks\\overhead.js"';
    const output = execSync(k6Cmd, { encoding: 'utf8', stdio: 'pipe' });
    
    const match = output.match(/http_req_duration\.*:\s*avg=([^ ]+)\s*min=([^ ]+)\s*med=([^ ]+)\s*max=([^ ]+)\s*p\(90\)=([^ ]+)\s*p\(95\)=([^ ]+)/);
    const p95 = match ? match[6] : 'Unknown';
    const reqMatch = output.match(/http_reqs\.*:\s*(\d+)\s*([^ ]+)\/s/);
    const iters = reqMatch ? reqMatch[1] : '0';
    return { mode, p95, iters };
  } catch (error: any) {
    const output = error.stdout || '';
    const match = output.match(/http_req_duration\.*:\s*avg=([^ ]+)\s*min=([^ ]+)\s*med=([^ ]+)\s*max=([^ ]+)\s*p\(90\)=([^ ]+)\s*p\(95\)=([^ ]+)/);
    const p95 = match ? match[6] : 'Unknown';
    const reqMatch = output.match(/http_reqs\.*:\s*(\d+)\s*([^ ]+)\/s/);
    const iters = reqMatch ? reqMatch[1] : '0';
    return { mode, p95, iters };
  }
}

async function main() {
  const results = [];
  results.push(await runBenchmark('separate'));
  results.push(await runBenchmark('sequential'));
  results.push(await runBenchmark('raw'));

  console.log('\n================================================');
  console.log('   PRISMA OVERHEAD BENCHMARK RESULTS            ');
  console.log('================================================\n');
  console.log('| Mode            | p95 Latency | Throughput (Iters) |');
  console.log('| --------------- | ----------- | ------------------ |');
  for (const r of results) {
    console.log(`| ${r.mode.padEnd(15)} | ${r.p95.padEnd(11)} | ${r.iters.padEnd(18)} |`);
  }
  process.exit(0);
}

main().catch(console.error);
