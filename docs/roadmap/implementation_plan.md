# Phase 4B Final Gate: History-Depth Scaling & ADR Evidence (COMPLETED)

This plan defines the execution for the final decision gate of Phase 4B. The goal was to mathematically demonstrate whether `O(N)` historical aggregation is the definitive scaling bottleneck by measuring how latency scales with history depth, and to prove the bottleneck's location (Application vs PostgreSQL).

## User Review Required
> [!IMPORTANT]
> The benchmarks have been executed. The true bottleneck was proven to be **Node.js/Prisma IPC Overhead and Event Loop Saturation** caused by 6 independent queries in the write path, not database aggregation.
> ADR 002 for Persisted Balances has been drafted in `docs/engineering/adrs/002-persisted-balances.md`.
> Please review the findings in `004-history-depth-and-cardinality.md` and ADR 002. If you approve, I will proceed with Phase 4C.

## Institutional Engineering Principles (New)

### Work Elimination Hierarchy
Before introducing new persistent state, every hotspot must be evaluated in this order:
1. Remove unnecessary work.
2. Reduce request scope.
3. Consolidate queries.
4. Improve indexing.
5. Improve locality.
6. Batch or stream work.
7. Cache safely.
8. Introduce new persisted state.

### Standard Optimization Loop
1. Identify one hotspot.
2. Produce an optimization dossier.
3. Capture baseline metrics.
4. Form the smallest viable hypothesis.
5. Implement exactly one change.
6. Verify financial correctness.
7. Re-run benchmarks.
8. Measure complexity impact.
9. Decide whether to keep or revert.
10. Archive results.
11. Move to the next hotspot.

## Proposed Changes

### 1. Dossier Standardization
Refactor the existing Phase 4B execution dossiers (`002` and `003-pt2`) and all future dossiers to use the exact scientific template:
- Objective
- Baseline
- Evidence
- Change
- Result
- Regression check
- **Complexity impact (Runtime, State, Operational, Rollback, Lifetime)**
- Rollback
- Decision
- Next experiment

### 2. History-Depth Scaling Benchmark
Create `src/scripts/history-depth-benchmark.ts` to perform the following for each tier (100, 1,000, 5,000, 10,000, 50,000):
- Seed a test account with the exact number of historical transactions.
- Execute the `k6` concurrent write test (`write_only.js`).
- Record the `p95` latency and throughput.
- Clear the test account to prepare for the next tier.

### 3. Account Cardinality Benchmark
Measure whether the bottleneck is row count, account materialization, or grouping by testing two scenarios with identical row counts:
- 50 accounts × 100 transactions
- 1 account × 5,000 transactions

### 4. Focused PostgreSQL Profiling
Extend the benchmark script to capture raw PostgreSQL metrics via `prisma.$queryRaw` that strictly inform the architectural decision:
- Active connections
- Wait events
- CPU utilization
- Query duration

### 5. Financial Correctness Matrix
Expand the existing `parity-check.ts` into a comprehensive suite (`src/scripts/financial-correctness-suite.ts`) covering:
- **Ledger Integrity**: Account balance, Transfer conservation, Double-entry consistency.
- **Reporting Integrity**: Net worth, Cash flow, Income statement.
- **Budget Integrity**: Budget remaining, Budget variance.
- **Analytics Integrity**: Category totals, Trend reports, Monthly summaries.
- **Edge Cases**: Voided transactions, Pending transfers, Future-dated entries, Currency rounding, Closed accounts.

### 6. ADR Drafting (Conditional)
If the evidence proves that write latency scales linearly (or worse) with transaction history, and that lower-complexity optimizations cannot eliminate it:
- **Draft** `docs/adr/00X-persistent-account-balances.md`.
- Include the history-depth benchmark and complexity budget as empirical proof.
- *Wait for Architecture Review and Approval before any implementation begins.*

## Verification Plan
- The history-depth script will output a markdown table containing the `p95` latencies for each depth tier.
- The Financial Correctness Matrix will be run to ensure no data corruption occurred.
- Review the drafted ADR before Phase 4C implementation.
