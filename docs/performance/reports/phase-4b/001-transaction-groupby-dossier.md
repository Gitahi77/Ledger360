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
| **Estimated Improvement**    | **~90% latency reduction.** Removing the `Seq Scan` completely and doing an `Index Only Scan` or targeted `Index Scan`. |
| **Complexity / Risk**        | **Low.** Requires only a schema update (`prisma db push` / `prisma migrate`). Does not require data migration or architectural overhaul. |

## Analysis
The database is performing a full **Sequential Scan** (`Seq Scan`) across the entire `Transaction` table to calculate this sum, completely bypassing the existing index because it's filtering on `type` and grouping by `accountId`. For a user with 50,000 transactions, the database is scanning 52,100 rows in memory, discarding 47,100 of them, and doing this synchronously *twice* (`income` and `expense`) for every new transaction write. Under load, this causes massive CPU spikes.

## Proposed Experiment (Next Step)
Following the Phase 4B Execution Loop, the least invasive optimization is to create a composite or covering index targeting the exact filter and group keys.

**Hypothesis:** Adding `@@index([userId, type, accountId])` will switch the planner from `Seq Scan` to `Index Scan`, reducing execution time from ~26ms to <2ms per query (and thereby dropping the 9.69s p95 duration under load to acceptable bounds).

If this experiment succeeds and brings the p95 duration below our 500ms target, we will not need to introduce Denormalization or an ADR.
