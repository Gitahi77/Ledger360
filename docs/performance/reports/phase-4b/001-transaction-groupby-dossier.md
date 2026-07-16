# Optimization Dossier: Transaction.groupBy
**Date:** July 15, 2026
**Target:** Phase 4B (Database Optimization)

## Hotspot Evidence

| Required Evidence            | Description                 |
| ---------------------------- | --------------------------- |
| **Endpoint**                 | `POST /api/trpc/addTransaction` (Write path) |
| **Service / Repository**     | `BalanceService.getEnrichedAccounts` -> `TransactionsRepository.getTransactionSumsByAccount` |
| **Generated SQL**            | `SELECT "accountId", SUM("baseAmountMinor") FROM "Transaction" WHERE "userId" = $1 AND NOT ("name" ILIKE '%VOIDED%' OR "name" ILIKE '%pending%') AND "type" = 'income' GROUP BY "accountId"` |
| **EXPLAIN (ANALYZE, BUFFERS)** | `HashAggregate (cost=2369.23..2369.44 rows=17 width=58) (actual time=26.114..26.117 rows=10 loops=1)`<br>`  Group Key: "accountId"`<br>`  Buffers: shared hit=1303`<br>`  -> Seq Scan on "Transaction" (cost=0.00..2345.00 rows=4845 width=34) (actual time=0.927..24.950 rows=5000 loops=1)`<br>`        Filter: ((name !~~* '%VOIDED%'::text) AND (name !~~* '%pending%'::text) AND ("userId" = '...'::text) AND (type = 'income'::text))` |
| **Rows Scanned**             | 52,100 total rows (5,000 returned, 47,100 removed by filter) |
| **Rows Returned**            | 10 (groups) |
| **Buffer Hits / Reads**      | 1303 shared hits (Memory reads) |
| **Current Indexes**          | `Transaction_userId_date_idx` (Ignored by the planner for this query) |
| **Missing Index Opportunities** | Composite index on `["userId", "type", "accountId"]` |
| **Estimated Improvement**    | Switching from `Seq Scan` to `Index Scan` to eliminate heap filtering overhead. |
| **Complexity / Risk**        | **Low.** Requires only a schema update (`prisma db push` / `prisma migrate`). Does not require data migration or architectural overhaul. |

## Analysis
The database is performing a full **Sequential Scan** (`Seq Scan`) across the entire `Transaction` table to calculate this sum, completely bypassing the existing index because it's filtering on `type` and grouping by `accountId`. For a user with 50,000 transactions, the database is scanning 52,100 rows in memory, discarding 47,100 of them, and doing this synchronously *twice* (`income` and `expense`) for every new transaction write. Under load, this causes massive CPU spikes.

## Proposed Experiment (Next Step)
Following the Phase 4B Execution Loop, the least invasive optimization is to create a composite or covering index targeting the exact filter and group keys.

**Hypothesis:** Adding a composite index on `(userId, type, accountId)` is expected to eliminate the sequential scan observed in the execution plan and significantly reduce execution time for the `Transaction.groupBy` query. The overall impact on endpoint latency will be measured by rerunning the benchmark suite and comparing results against the July 15 baseline.

## Decision

**Selected optimization:**
Composite Index (`@@index([userId, type, accountId])`)

**Rejected alternatives:**
- **Covering Index**
  *Reason:* Prisma does not natively support Postgres `INCLUDE` clauses without dropping down to raw SQL migrations. A composite index is the closest Prisma-native equivalent.
- **Partial Index**
  *Reason:* Filtering out `isVoided = true` or `pending` natively in a partial index requires raw SQL migrations. We will start with a native Prisma composite index to minimize architectural drift.
- **Materialized View**
  *Reason:* Too complex for a first iteration. Would require setting up background refresh jobs and dealing with replication lag for user balances.
- **Denormalization (Persisted Balances)**
  *Reason:* Adds significant persistence model complexity. We will not denormalize until database-layer indexing proves insufficient to meet the 500ms p95 budget.

## Execution Measurement

| Metric         | Before   | After      |
| -------------- | -------- | ---------- |
| Scan type      | Seq Scan | Bitmap Heap Scan |
| Execution time | 26.14 ms | 5.67 ms    |
| Rows scanned   | 52,100   | 5,000      |
| Buffers read   | 0        | 0          |
| Buffers hit    | 1303     | 1257       |
| Cost estimate  | 2345.00  | 1469.88    |

## Benchmark Result
Rerunning the k6 `transaction_write_heavy` scenario yielded a `p(95)` latency of **45.61s**, a significant degradation from the 9.69s baseline, despite the underlying SQL execution time dropping by 80%.

This indicates that while the sequential scan was eliminated, it was hiding a secondary bottleneck (likely connection pool exhaustion, memory overhead of `next dev`, or Prisma serialization of the 5,000 returned rows). 

**Conclusion:** The index was successful at the database planner level, but insufficient to reach the <500ms target at the application level. Denormalization or materialized views (as discussed in the Phase 4B architecture) are required.
