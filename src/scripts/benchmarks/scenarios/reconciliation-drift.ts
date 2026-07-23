import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { DriftDetectionJob } from '@/lib/jobs/driftDetection';
import { prisma } from '@/lib/prisma';
import { getMetrics } from '@/lib/metrics/MetricsRegistry';
import * as fs from 'fs';
import * as path from 'path';

async function seedData(numAccounts: number, txPerAccount: number) {
  console.log(`Seeding ${numAccounts} accounts with ${txPerAccount} transactions each...`);
  
  // Clear previous bench data safely
  await prisma.transaction.deleteMany({ where: { userId: 'bench-drift-user' } });
  await prisma.account.deleteMany({ where: { userId: 'bench-drift-user' } });
  await prisma.user.deleteMany({ where: { id: 'bench-drift-user' } });
  await prisma.category.deleteMany({ where: { userId: 'bench-drift-user' } });

  await prisma.user.create({
    data: { id: 'bench-drift-user', name: 'Drift Bench User', email: 'drift@bench.com', currency: 'KES', accountType: 'individual' }
  });

  await prisma.category.create({
    data: { id: 'bench-drift-cat', name: 'Drift Cat', userId: 'bench-drift-user', type: 'expense' }
  });

  for (let i = 0; i < numAccounts; i++) {
    const accountId = `bench-drift-acc-${i}`;
    await prisma.account.create({
      data: { id: accountId, userId: 'bench-drift-user', name: `Acc ${i}`, type: 'CHECKING', currency: 'KES' }
    });

    const txData = Array.from({ length: txPerAccount }).map((_, j) => ({
      userId: 'bench-drift-user',
      accountId: accountId,
      categoryId: 'bench-drift-cat',
      type: 'expense',
      amount: 1,
      baseAmountMinor: BigInt(100),
      currency: 'KES',
      name: `Tx ${j}`,
      date: new Date()
    }));
    await prisma.transaction.createMany({ data: txData });
    
    // Intentionally introduce drift in account 0
    if (i === 0) {
      await prisma.account.update({
        where: { id: accountId },
        data: { balanceMinor: BigInt(9999999) } // Drift!
      });
    } else {
      await prisma.account.update({
        where: { id: accountId },
        data: { balanceMinor: BigInt(100 * txPerAccount) }
      });
    }
  }
}

async function run() {
  const NUM_ACCOUNTS = 10;
  const TX_PER_ACCOUNT = 1000;
  
  await seedData(NUM_ACCOUNTS, TX_PER_ACCOUNT);

  console.log('Running DriftDetectionJob...');
  const start = performance.now();
  const startMem = process.memoryUsage().heapUsed;

  const result = await DriftDetectionJob.execute({ jobId: 'bench', correlationId: 'bench' });

  const durationMs = performance.now() - start;
  const peakMemMB = Math.round((process.memoryUsage().heapUsed - startMem) / 1024 / 1024);
  
  const metrics = getMetrics().getAllSummaries();
  const drifts = metrics.financial.ledger_drift_detections_total || 0;

  console.log(`Duration: ${durationMs.toFixed(2)}ms`);
  console.log(`Accounts scanned/sec: ${((NUM_ACCOUNTS / durationMs) * 1000).toFixed(2)}`);
  console.log(`Transactions scanned/sec: ${(((NUM_ACCOUNTS * TX_PER_ACCOUNT) / durationMs) * 1000).toFixed(2)}`);
  console.log(`Peak memory used: ${peakMemMB}MB`);
  console.log(`Drifts detected: ${drifts}`);

  if (drifts !== 1) {
    console.error(`Expected 1 drift, found ${drifts}. Correctness assertion failed!`);
    process.exit(1);
  }

  // Save partial report output so the runner can consume it if needed
  const report = {
    accountsScannedPerSec: (NUM_ACCOUNTS / durationMs) * 1000,
    txScannedPerSec: ((NUM_ACCOUNTS * TX_PER_ACCOUNT) / durationMs) * 1000,
    peakMemoryMB: peakMemMB,
    driftsDetected: drifts,
    executionTimeMs: durationMs
  };

  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(reportsDir, `reconciliation-drift-${new Date().toISOString().replace(/[:.]/g, '-')}.json`), JSON.stringify(report, null, 2));

  console.log('Benchmark passed successfully.');
}

run().catch(console.error);
