# Ledger360 Benchmark Suite

This directory contains version-controlled, reproducible k6 benchmarks for Ledger360.
The goal of this suite is to track performance regressions over time (latency, throughput, memory, db queries) separate from functional correctness.

## Running Locally

To run the entire suite locally:
```bash
npm run benchmark -- --all
```

To run a specific scenario:
```bash
npm run benchmark -- --scenario payroll-burst.js
```

### Configuration
- `BENCHMARK_TARGET`: Target URL for the benchmarks. Defaults to `http://localhost:3000`. Set to a preview URL or production to run against deployed environments.
- `BENCHMARK_K6_PATH`: Absolute path to the k6 executable. Defaults to system `k6`, then falls back to local `./k6-bin/...`.
- `TELEMETRY_SECRET`: Used to fetch telemetry from the target's `/api/metrics` endpoint. Must match the target server's secret.

## CI Strategy

To maintain rapid development cycles without losing visibility into performance, we follow this CI strategy:

### Every Pull Request
- We **do not** run this benchmark suite on every PR, as load tests introduce significant flakiness on shared CI runners.
- Instead, PRs must pass **unit tests**, **integration tests**, and **stress correctness** tests (`npm run test:stress`).

### Nightly Builds
- The benchmark suite runs automatically on a dedicated nightly schedule against a deployed `staging` environment.
- Nightly runs produce a JSON report which is compared against the `baselines/staging.json` baseline. Alerts are sent if p95 latency degrades by more than 20% or if throughput drops.

### Releases
- Before a production release, the suite is executed manually or via release CI against a production-like database.
- Results are archived, and if significant changes have occurred, `baselines/production.json` is updated.

## Reporting & JSON Schema
Reports are automatically saved to `reports/run-<timestamp>.json`. They contain rich metadata, HTTP stats (from k6), DB stats (from pg_stat_activity), and Ledger-specific telemetry (lock contention, drifts, deadlocks). This unified JSON schema is designed to be easily ingested into external observability tools like Datadog or Grafana in the future.
