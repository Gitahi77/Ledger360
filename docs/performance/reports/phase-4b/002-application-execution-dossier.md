# Phase 4B: Application Execution Dossier

### Objective
Isolate the application-level execution profile of the `addTransaction` endpoint under a 50 VU write-heavy benchmark to determine why p95 latency degraded despite database SQL optimization.

### Baseline
- **p95 Latency:** ~45.61 s
- **SQL Execution Time:** ~5.6 ms (after composite index)
- **Heap Growth:** +14.2 MB per request.

### Evidence
- Traces show `BalanceService.getEnrichedAccounts()` takes 6-25 seconds, while raw SQL takes 5.6 ms.
- The Node.js event loop stalls for up to 36 seconds due to massive row materialization and `Promise.all` overhead.
- Profiler call graph shows every write triggers full-world recomputation (all transactions across all accounts).

### Change
*This dossier captures the investigation phase. No code change was made during this specific experiment.*

### Result
Identified that `addTransaction` involves an architectural flaw: "recalculate everything to validate one thing."

### Regression Check
N/A (Investigatory)

### Complexity Budget
| Complexity Type | Current | Proposed |
| --------------- | ------- | -------- |
| Runtime         | O(N)    | N/A      |
| State           | 1 source| N/A      |
| Operational     | Low     | N/A      |
| Rollback        | N/A     | N/A      |
| Lifetime        | N/A     | N/A      |

### Rollback
N/A

### Decision
**Escalate:** Do not implement Persisted Balances yet. First, implement Request Scope Reduction by targeting only the affected account during validation.

### Next Experiment
Implement `getSingleAccountBalance` to reduce query scope, verify financial parity, and re-run benchmarks to observe if Node.js event loop saturation is resolved.
