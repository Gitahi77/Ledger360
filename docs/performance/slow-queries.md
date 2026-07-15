# Slow Queries Baseline
**Date:** July 15, 2026

## 1. `Transfer.groupBy`
- **Frequency:** High (474 instances logged during load test)
- **Duration:** ~900ms - 1100ms
- **Trigger:** `BalanceService.getEnrichedAccounts` -> `getTransferSumsByAccount`
- **Root Cause:** Aggregating transfers over the entire user history synchronously on every transaction write. Lack of covering composite indexes (e.g., `[userId, accountId, baseAmountMinor]`).

## 2. `Transaction.groupBy`
- **Frequency:** High (434 instances logged during load test)
- **Duration:** ~1100ms - 1300ms
- **Trigger:** `BalanceService.getEnrichedAccounts` -> `getTransactionSumsByAccount`
- **Root Cause:** Aggregating transactions over the entire user history synchronously. The `@@index([userId, date(sort: Desc)])` index supports filtering but forces heap lookups for the grouping (`accountId`) and summing (`baseAmountMinor`) columns.

## 3. `Account.findMany` (Cascading Latency)
- **Frequency:** Moderate (217 instances logged during load test)
- **Duration:** Inflated due to connection starvation
- **Trigger:** Fetching account list
- **Root Cause:** While intrinsically fast (<5ms), this query suffers from connection pool saturation because the `groupBy` queries hold connections open for >1000ms.
