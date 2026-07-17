# Performance Engineering Methodology

This document defines the frozen methodology for how Ledger360 performs optimization. Every future optimization—database, backend, caching, frontend, infrastructure—must adhere to this rigorous process to preserve financial correctness and prevent premature architectural shifts.

## Work Elimination Hierarchy

Before introducing new persistent state or complex caching mechanisms, every hotspot must be evaluated in this order:

1. **Remove unnecessary work:** Stop calculating data that isn't required.
2. **Reduce request scope:** Process only the single account/user affected instead of full-world.
3. **Consolidate queries:** Prevent N+1 queries by leveraging `IN` clauses or joins.
4. **Improve indexing:** Help the database find rows without sequential scans.
5. **Improve locality:** Reduce working sets through temporal filtering (e.g., this month's data only).
6. **Batch or stream work:** Group operations to avoid chatty network/DB calls.
7. **Cache safely:** Introduce temporary, invalidatable state.
8. **Introduce new persisted state:** (e.g., Persisted Balances). *Requires an Architecture Decision Record (ADR).*

## The Standard Optimization Loop

Every hotspot identified via production telemetry must pass through this rigorous loop:

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

## Experiment Success & Failure Gates

Every optimization must establish explicit decision criteria. 

> **CRITICAL RULE: If financial correctness regresses (Parity < 100%), the experiment automatically FAILS regardless of any performance gains.**

| Metric                | Before   | After            | Decision          |
| --------------------- | -------- | ---------------- | ----------------- |
| p95 latency           | baseline | ?                | Improve or revert |
| Throughput            | baseline | ?                | Improve or revert |
| Heap growth           | baseline | ?                | Improve or revert |
| CPU                   | baseline | ?                | Improve or revert |
| Query count           | baseline | ?                | Improve or revert |
| Financial correctness | 100%     | Must remain 100% | Mandatory         |

## Scientific Optimization Dossier Template

All optimization experiments must be documented using the following standard template:

### Objective
What hypothesis is being tested?

### Baseline
Metrics before the change (p95 latency, throughput, CPU, heap).

### Evidence
SQL logs, EXPLAIN ANALYZE outputs, profiler traces.

### Change
Exactly what was modified (code diff summary).

### Result
Metrics after the change. 

### Regression Check
Output of the Financial Correctness Suite confirming 100% parity.

### Complexity Budget
Every optimization must justify the complexity it buys:

| Complexity Type | Current | Proposed |
| --------------- | ------- | -------- |
| Runtime         | O(N)    | O(1)     |
| State           | 1 source| 2 sources|
| Operational     | Low     | Medium   |
| Rollback        | Low     | High     |
| Lifetime        | Permanent| Permanent|

### Rollback
Steps required to undo the change if issues arise in production.

### Decision
Keep, Revert, or Escalate to ADR.

### Next Experiment
Single next step only.

## Benchmark Methodology

When evaluating algorithmic complexity, do not rely on static benchmarks.
Produce a **Scaling Curve** by benchmarking across varied dimensions:
- **History Depth Sensitivity**: e.g., 100 vs 1,000 vs 5,000 vs 50,000 transactions.
- **Account Cardinality Sensitivity**: e.g., 50 accounts × 100 transactions vs 1 account × 5,000 transactions.

Graph the results to visualize if the system behaves as $O(1)$, $O(\log N)$, or $O(N)$.

## ADR Trigger Conditions

An Architecture Decision Record (ADR) is triggered **only** when empirical evidence (such as a Scaling Curve) mathematically proves that the current architecture is fundamentally bottlenecked (e.g., $O(N)$ growth on the write path), and lower-complexity optimizations (steps 1-7 in the Work Elimination Hierarchy) cannot eliminate it.

The workflow is:
1. **Evidence Gathering** (Scaling Benchmarks, PostgreSQL Profiling)
2. **Draft ADR**
3. **Architecture Review**
4. **Approval**
5. **Implementation**
