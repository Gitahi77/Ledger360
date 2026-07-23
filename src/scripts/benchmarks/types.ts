export interface BenchmarkMetadata {
  gitCommit: string;
  nodeVersion: string;
  database: string;
  benchmarkTarget: string;
  timestamp: string;
  scenario: string;
  hardware: string;
  vus: number;
}

export interface BenchmarkSummary {
  status: 'passed' | 'failed' | 'degraded';
  durationSeconds: number;
  iterations: number;
  errors: number;
}

export interface HttpMetrics {
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  requestsPerSecond: number;
  failureRate: number;
}

export interface DatabaseMetrics {
  activeConnections: number;
  cacheHitRatio: number;
  totalQueries: number;
}

export interface LedgerMetrics {
  driftDetected: number;
  deadlocks: number;
  lockContentionRate: number;
  retryRate: number;
  p2034Count: number;
  p2024Count: number;
}

export interface SystemMetrics {
  peakMemoryMB: number;
  cpuUtilization: number;
}

export interface BenchmarkReport {
  schemaVersion: 1;
  metadata: BenchmarkMetadata;
  scenario: string;
  summary: BenchmarkSummary;
  http: HttpMetrics;
  database: DatabaseMetrics;
  ledger: LedgerMetrics;
  system: SystemMetrics;
}
