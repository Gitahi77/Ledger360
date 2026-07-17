# Phase 4B: Request Scope Reduction & SQL Consolidation

### Objective
Eliminate the "Full-World Recomputation" in `BalanceService.getEnrichedAccounts()` during transaction writes, replacing it with `AccountsRepository.getSingleAccountBalance(accountId)` to validate overdrafts for only the affected account.

### Baseline
- **p95 Latency:** ~45.61 s (from previous dossier)
- **SQL Execution Time:** ~5.6 ms
- **Event Loop Stall:** Up to 36 seconds.

### Evidence
- The isolated concurrent benchmark (`write_only.js`) running only `POST /api/v1/transactions` with 50 concurrent VUs at 20 iterations/sec for 30s.
- With default Prisma pool: p95 = 48.55s, 41 iterations complete.
- With `connection_limit=50`: p95 = 49.05s, 65 iterations complete. Event loop still starved for 51 seconds.
- Prisma was issuing 150 parallel `SUM` aggregations simultaneously under 50 VU load, entirely saturating DB CPU despite scope reduction.

### Change
- Refactored `addTransaction` to bypass `getEnrichedAccounts()`.
- Introduced `AccountsRepository.getSingleAccountBalance(accountId)` using `$transaction` to fetch only the required account sums.

### Result
- **p95 Latency:** 49.05 s
- **Throughput:** ~2.1 iters/sec
- Scope reduction was insufficient to resolve the bottleneck because the query remains mathematically $O(N)$ with respect to account history depth. 

### Regression Check
- `parity-check.ts` execution confirmed 100% financial accuracy (19/19 accounts perfectly matched). Financial integrity preserved.

### Complexity Budget
| Complexity Type | Current | Proposed |
| --------------- | ------- | -------- |
| Runtime         | O(N)    | O(N)     |
| State           | 1 source| 1 source |
| Operational     | Low     | Low      |
| Rollback        | Low     | Low      |
| Lifetime        | Permanent| Permanent|

### Rollback
Revert `src/lib/actions/transactions.ts` to use `BalanceService.getEnrichedAccounts(userId)`. Not recommended, as the current change correctly isolated validation to the affected account.

### Decision
**Keep:** The change is kept because it properly narrows request scope (Optimization Step 2), reducing unnecessary multi-account aggregation.
**Escalate:** The empirical evidence shows this is not enough. Proceed to history-depth and cardinality scaling benchmarks to formally trigger an ADR for state changes.

### Next Experiment
Execute `history-depth-benchmark.ts` and `account-cardinality-benchmark.ts` to mathematically prove the performance degradation scales with transaction count per account.
