# Performance Validation Report: Persisted Balances

## Problem Statement
During Phase 4B, Ledger360 experienced critical performance degradation under concurrent write load (`POST /api/v1/transactions`). `p95` latency degraded to 50 seconds, resulting in Event Loop starvation and transaction timeouts. The initial hypothesis pointed to $O(N)$ database execution time caused by aggregating the entire transaction history to validate overdrafts.

## Original Measurements (Before Optimization)
A history-depth benchmark using `k6` revealed that write latency increased proportionally with an account's transaction depth:

| Depth (Transactions) | Latency (p95) |
| -------------------- | ------------- |
| 100                  | ~81ms         |
| 1,000                | ~119ms        |
| 5,000                | ~192ms        |
| 10,000               | ~240ms        |
| 50,000               | ~524ms        |

Additionally, the write path required 6 separate Prisma queries (`account.findFirst`, `transaction.groupBy`, `transfer.aggregate (Out)`, `transfer.aggregate (In)`, `transaction.create`, `auditLog.create`).

## Alternative Approaches Considered
1. **Raw SQL Aggregation (Single Query):** Combining the 4 read queries into a single `$queryRaw` call. This reduces IPC but still requires an interactive transaction for the write phase, leaving the $O(N)$ execution time in the database.
2. **Event Sourcing:** Reconstructing balances from an event stream. Deemed over-engineered for the current phase and scale of Ledger360.
3. **Persisted Balances (Denormalization) [SELECTED]:** Persisting `balanceMinor` on the `Account` model and updating it transactionally alongside the `Transaction` insert.

## Benchmark Methodology
- **Tooling:** Node.js execution wrapper orchestrating `k6` load tests.
- **Data Scaling:** Transactions seeded in buckets of 100, 1000, 5000, 10000, and 50000 transactions per account.
- **Measurement:** `p95` Latency and Request Throughput on `POST /api/v1/transactions`.
- **Infrastructure:** Neon Serverless PostgreSQL running via Vercel Edge/Serverless functions.

## Results: Before/After Comparison

Under the benchmarked workload, persisted balances removed the dependency of write latency on transaction history depth.

| Transactions | p95 Latency (Before) | p95 Latency (After) | Throughput (After) | Improvement Factor |
| ------------ | -------------------- | ------------------- | ------------------ | ------------------ |
| 100          | ~81ms                | **74.14ms**         | 2471 req/s         | 1.09x              |
| 1000         | ~119ms               | **57.01ms**         | 2580 req/s         | 2.08x              |
| 5000         | ~192ms               | **74.06ms**         | 2374 req/s         | 2.59x              |
| 10000        | ~240ms               | **70.49ms**         | 2292 req/s         | 3.40x              |
| 50000        | ~524ms               | **92.88ms**         | 612 req/s          | **5.64x**          |

## EXPLAIN ANALYZE Output

The optimization successfully replaced the $O(N)$ historical read with an $O(1)$ update:

```text
--- EXPLAIN ANALYZE: SELECT Account ---
Index Scan using Account_pkey on "Account"  (cost=0.14..8.16 rows=1 width=14) (actual time=0.038..0.040 rows=1 loops=1)
Planning Time: 0.218 ms
Execution Time: 0.058 ms

--- EXPLAIN ANALYZE: INSERT Transaction ---
Insert on "Transaction"  (cost=0.00..0.03 rows=0 width=0) (actual time=0.300..0.301 rows=0 loops=1)
Execution Time: 0.914 ms

--- EXPLAIN ANALYZE: UPDATE Account ---
Update on "Account"  (cost=0.00..2.90 rows=0 width=0) (actual time=0.115..0.115 rows=0 loops=1)
Execution Time: 0.195 ms
```

**Total combined database execution time:** ~1.167 ms per transaction.

## ADR Reference
- [ADR 002: Persisted Balances & IPC Overhead](../engineering/adrs/002-persisted-balances.md)

## Risks Introduced
- **Data Drift:** We now have two sources of truth (the aggregated ledger vs. the persisted `Account.balanceMinor`).
- **Concurrency Overwrites:** Rapid, simultaneous writes to the same account could result in "lost updates" if the sequential transaction is not perfectly isolated.

## Mitigations
- **Reconciliation Tooling:** `detectBalanceDrift()` and `repairBalances()` were built to programmatically identify and repair drift using the ledger as the ultimate source of truth.
- **Database-Level Constraints:** Added a `CHECK (balance_minor >= 0 OR allow_negative_balance = true)` constraint, relying on Postgres row-level locking to prevent overdrafts.

## Remaining Limitations
- While read-aggregation is solved, high-throughput concurrent writes to the *same* account may still face database lock contention or race conditions if strict isolation is not explicitly configured.

## Future Work (Phase 5)
- Implement Scheduled Reconciliation to run `detectBalanceDrift()` hourly or nightly.
- Implement Optimistic Locking (e.g., `updatedAt` checks or `version INT`) to protect against lost updates.
- Prove concurrency correctness via high-contention benchmark tests (e.g., 100 simultaneous withdrawals).
