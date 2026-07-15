# Performance Documentation

This directory houses the empirical performance evidence for Ledger360. Following the philosophy of **Observe → Measure → Optimize**, no optimization may be written without a corresponding observation and baseline record in this directory.

## Current Baselines

- [Performance Baseline](./baseline.md)
- [Slow Endpoints](./slow-endpoints.md)
- [Slow Queries](./slow-queries.md)
- [Payload Analysis](./payload-analysis.md)
- [N+1 Analysis](./n-plus-one.md)

## Historical Records

- [Benchmark History](./benchmark-history/)
- [Archived Reports](./reports/) *(Will contain phase-specific snapshots like `phase-4a6/`, `phase-4b/`, etc.)*

## Optimization Workflow

Every optimization must be recorded in its respective phase report (e.g. `docs/performance/reports/phase-4b/`) and include a clear mapping back to the baseline evidence:

```markdown
Optimization:
Composite index added

Evidence:
docs/performance/slow-queries.md

Measured Before:
9.69 s

Measured After:
480 ms

Improvement:
95%
```
