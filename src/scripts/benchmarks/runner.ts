/* eslint-disable */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { BenchmarkReport, HttpMetrics, LedgerMetrics, DatabaseMetrics, BenchmarkMetadata } from './types';

// Constants
const TARGET_URL = process.env.BENCHMARK_TARGET || 'http://localhost:3000';
const REPORTS_DIR = path.join(__dirname, 'reports');
const BASELINES_DIR = path.join(__dirname, 'baselines');
const SCENARIOS_DIR = path.join(__dirname, 'scenarios');

// Initialize dirs
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
if (!fs.existsSync(BASELINES_DIR)) fs.mkdirSync(BASELINES_DIR, { recursive: true });
if (!fs.existsSync(SCENARIOS_DIR)) fs.mkdirSync(SCENARIOS_DIR, { recursive: true });

function getK6Path(): string {
  if (process.env.BENCHMARK_K6_PATH) return process.env.BENCHMARK_K6_PATH;
  try {
    execSync('k6 version', { stdio: 'ignore' });
    return 'k6';
  } catch {
    const localK6 = path.join(process.cwd(), 'k6-bin', 'k6-v0.49.0-windows-amd64', 'k6.exe');
    if (fs.existsSync(localK6)) return localK6;
    throw new Error('Could not find k6. Ensure it is in PATH, BENCHMARK_K6_PATH, or k6-bin/');
  }
}

function getMetadata(scenarioName: string, vus: number): BenchmarkMetadata {
  let gitCommit = 'unknown';
  try {
    gitCommit = execSync('git rev-parse HEAD').toString().trim();
  } catch (_e) {}

  return {
    gitCommit,
    nodeVersion: process.version,
    database: process.env.DATABASE_URL ? 'configured' : 'unknown',
    benchmarkTarget: TARGET_URL,
    timestamp: new Date().toISOString(),
    scenario: scenarioName,
    hardware: `${os.cpus()[0].model} (${os.cpus().length} cores), ${Math.round(os.totalmem() / 1024 / 1024 / 1024)}GB RAM`,
    vus,
  };
}

async function fetchMetrics(): Promise<any> {
  const secret = process.env.TELEMETRY_SECRET || 'test-secret';
  try {
    const res = await fetch(`${TARGET_URL}/api/metrics`, {
      headers: { 'x-telemetry-secret': secret }
    });
    if (!res.ok) {
      console.warn(`Failed to fetch metrics from ${TARGET_URL}/api/metrics. Status: ${res.status}`);
      return null;
    }
    const json = await res.json();
    return json.data;
  } catch (_error) {
    console.warn(`Could not connect to ${TARGET_URL}/api/metrics. Ensure the server is running.`);
    return null;
  }
}

function computeMetricsDelta(before: any, after: any): any {
  if (!before || !after) return null;

  const delta: any = {};
  for (const group of Object.keys(after)) {
    delta[group] = {};
    for (const key of Object.keys(after[group])) {
      const b = before[group]?.[key] || 0;
      const a = after[group][key];
      delta[group][key] = a - b;
    }
  }
  return delta;
}

function parseK6Output(output: string): HttpMetrics {
  const parseVal = (regex: RegExp, fallback = 0) => {
    const m = output.match(regex);
    return m ? parseFloat(m[1]) : fallback;
  };

  return {
    p50LatencyMs: parseVal(/http_req_duration\.*:\s*avg=[^\s]+\s*min=[^\s]+\s*med=([^\s]+)/),
    p95LatencyMs: parseVal(/http_req_duration\.*:\s*avg=[^\s]+\s*min=[^\s]+\s*med=[^\s]+\s*max=[^\s]+\s*p\(90\)=[^\s]+\s*p\(95\)=([^\s]+)/),
    p99LatencyMs: parseVal(/http_req_duration\.*:\s*avg=[^\s]+\s*min=[^\s]+\s*med=[^\s]+\s*max=[^\s]+\s*p\(90\)=[^\s]+\s*p\(95\)=[^\s]+\s*p\(99\)=([^\s]+)/, parseVal(/http_req_duration\.*:\s*avg=[^\s]+\s*min=[^\s]+\s*med=[^\s]+\s*max=[^\s]+\s*p\(90\)=[^\s]+\s*p\(95\)=([^\s]+)/)), // Fallback to p95 if p99 not present
    requestsPerSecond: parseVal(/http_reqs\.*:\s*\d+\s*([^\s]+)\/s/),
    failureRate: parseVal(/http_req_failed\.*:\s*([^\s]+)%/, 0)
  };
}

async function runScenario(scenarioFile: string) {
  const scenarioName = path.basename(scenarioFile, '.js');
  console.log(`\n=========================================`);
  console.log(`Running Scenario: ${scenarioName}`);
  console.log(`=========================================`);

  const k6Path = getK6Path();
  const fullPath = path.join(SCENARIOS_DIR, scenarioFile);

  // Hardcode 10 VUs for baseline test unless specified
  const vus = 10;
  const metadata = getMetadata(scenarioName, vus);

  // 1. Fetch metrics before
  const beforeMetrics = await fetchMetrics();

  // 2. Run k6
  const start = performance.now();
  let k6Output = '';
  let status: 'passed' | 'failed' | 'degraded' = 'passed';
  
  try {
    k6Output = execSync(`${k6Path} run ${fullPath}`, { encoding: 'utf8', env: { ...process.env, TARGET_URL } });
  } catch (error: any) {
    status = 'failed';
    k6Output = error.stdout || error.message;
    console.error(`K6 run failed: ${error.message}`);
  }
  
  const durationSeconds = (performance.now() - start) / 1000;

  // 3. Fetch metrics after
  const afterMetrics = await fetchMetrics();
  const delta = computeMetricsDelta(beforeMetrics, afterMetrics);

  // 4. Parse outputs
  const httpMetrics = parseK6Output(k6Output);
  
  const ledgerMetrics: LedgerMetrics = {
    driftDetected: delta?.financial?.ledger_drift_detections_total || 0,
    deadlocks: delta?.prisma?.ledger_db_deadlocks_total || 0,
    lockContentionRate: delta?.jobs?.ledger_jobs_lock_contention_total || 0,
    retryRate: delta?.financial?.ledger_transaction_retries_total || 0,
    p2034Count: delta?.prisma?.ledger_prisma_errors_total || 0, // Simplified mapping
    p2024Count: 0 // Track connection timeouts if we had a specific metric
  };

  const dbMetrics: DatabaseMetrics = {
    activeConnections: 0, // Hard to capture without direct pg query
    cacheHitRatio: 0,
    totalQueries: delta?.prisma?.ledger_db_query_total || 0
  };

  const systemMetrics = {
    peakMemoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
    cpuUtilization: 0
  };

  // Functional correctness checks
  if (ledgerMetrics.driftDetected > 0 || ledgerMetrics.deadlocks > 0) {
    status = 'failed';
    console.error(`CRITICAL: Correctness assertions failed! Drifts: ${ledgerMetrics.driftDetected}, Deadlocks: ${ledgerMetrics.deadlocks}`);
  }

  const report: BenchmarkReport = {
    schemaVersion: 1,
    metadata,
    scenario: scenarioName,
    summary: {
      status,
      durationSeconds,
      iterations: delta?.http?.ledger_http_requests_total || 0,
      errors: delta?.http?.ledger_http_errors_total || 0
    },
    http: httpMetrics,
    database: dbMetrics,
    ledger: ledgerMetrics,
    system: systemMetrics
  };

  // Save report
  const filename = `${scenarioName}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(path.join(REPORTS_DIR, filename), JSON.stringify(report, null, 2));

  // Compare against baseline if exists
  const baselinePath = path.join(BASELINES_DIR, `${scenarioName}.json`);
  if (fs.existsSync(baselinePath)) {
    const baseline: BenchmarkReport = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    if (httpMetrics.p95LatencyMs > baseline.http.p95LatencyMs * 1.2) {
      console.warn(`⚠️ DEGRADATION DETECTED: p95 latency increased from ${baseline.http.p95LatencyMs}ms to ${httpMetrics.p95LatencyMs}ms`);
      report.summary.status = 'degraded';
    }
  } else {
    // Optionally save as new baseline if this is the first run
    // fs.writeFileSync(baselinePath, JSON.stringify(report, null, 2));
  }

  console.log(`\nReport saved to reports/${filename}`);
  console.log(`Status: ${report.summary.status}`);
  console.log(`p95 Latency: ${httpMetrics.p95LatencyMs}ms`);
  console.log(`Throughput: ${httpMetrics.requestsPerSecond} req/s`);
  console.log(`Lock Contention: ${ledgerMetrics.lockContentionRate}`);
}

async function main() {
  const args = process.argv.slice(2);
  const scenarios = fs.readdirSync(SCENARIOS_DIR).filter(f => f.endsWith('.js') || f.endsWith('.ts'));
  
  if (args.includes('--all')) {
    for (const s of scenarios) {
      if (s.endsWith('.js')) {
        await runScenario(s);
      } else {
        // Run TypeScript native scenarios directly
        console.log(`\n=========================================`);
        console.log(`Running TS Scenario: ${s}`);
        console.log(`=========================================`);
        execSync(`npx tsx --env-file=.env ${path.join(SCENARIOS_DIR, s)}`, { stdio: 'inherit' });
      }
    }
  } else {
    console.log('Use --all to run the suite.');
  }
}

main().catch(console.error);
