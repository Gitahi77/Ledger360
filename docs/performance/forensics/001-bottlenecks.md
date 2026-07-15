# Performance Forensics Report: v4.2 Baseline

**Date:** July 2026
**Environment:** `production` (k6 local benchmark)

## Executive Summary

The Phase 4A.6 baseline load tests using `k6` revealed severe performance degradation under high write load. While the system successfully processed 100% of requests without dropping any (0.00% `http_req_failed` following the fix to validation/auth bottlenecks), the p(95) duration skyrocketed to **9.69 seconds**. 

The root cause is an architectural bottleneck in how Ledger360 evaluates account balances.

## Ranked Bottlenecks

### 1. `BalanceService.getEnrichedAccounts` synchronously aggregates all history
**Severity:** CRITICAL
**Log Evidence:** 
- `Transfer.groupBy` generated **474 SLOW_QUERY** warnings (~900-1100ms each).
- `Transaction.groupBy` generated **434 SLOW_QUERY** warnings (~1100-1300ms each).

**Root Cause Analysis:**
Currently, `addTransaction` validates the request by querying `BalanceService.getEnrichedAccounts(userId)`. 
`getEnrichedAccounts` executes a full historical sum of all `Transaction` and `Transfer` records for the user (`getTransferSumsByAccount` and `getTransactionSumsByAccount`). 
For a "heavy user" with 100,000 transactions, every single new transaction forces the database to re-aggregate 100,000 rows. When 50 Virtual Users attempt this concurrently, the database CPU/IO spikes and query times degrade into the multi-second range.

### 2. Missing aggregate-optimized indexes
**Severity:** HIGH
**Log Evidence:** `SLOW_QUERY` on `classification: "Aggregation"`
**Root Cause Analysis:**
Prisma executes: `SELECT accountId, SUM(baseAmountMinor) FROM "Transaction" WHERE userId = ? AND NOT (...) GROUP BY accountId`.
The current index on `Transaction` is `@@index([userId, date(sort: Desc)])`. Postgres uses this to filter by `userId`, but must then fetch the rows from the heap to find the `accountId` (for grouping) and `baseAmountMinor` (for summing). As data volume grows, the heap lookup cost dominates.

### 3. Connection Pool Saturation / Cascading Latency
**Severity:** MEDIUM
**Log Evidence:** 
- `Account.findMany` generated **217 SLOW_QUERY** warnings.
- `User.findUnique` generated **40 SLOW_QUERY** warnings.

**Root Cause Analysis:**
A simple `Account.findMany` (fetching 5-10 accounts) should take <5ms. However, because the `groupBy` queries hold connections in the Prisma connection pool for >1000ms, subsequent lightweight queries are blocked waiting for a connection, or slowed down by database-level CPU contention. This cascading failure inflates all response times.

## Architectural Recommendations for Phase 4B (Optimization)

As per the roadmap, this phase is strictly for measurement. No optimization was performed. However, for Phase 4B, the evidence supports the following interventions:

1. **Balance Caching/Denormalization:** We must move away from on-the-fly historical aggregations. Balances should be stored (e.g., in a `balances` table or `Account.balanceMinor`) and updated incrementally via triggers or background jobs, completely decoupling historical summation from the critical write path.
2. **Covering Indexes:** If real-time aggregation is required for specific views, composite indexes (e.g., `[userId, accountId]`) should be explored.
3. **Optimistic Writes:** `addTransaction` can use an optimistic approach or a smaller constrained validation rather than fetching the full enriched account state.
