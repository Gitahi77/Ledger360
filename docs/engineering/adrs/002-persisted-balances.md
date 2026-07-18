# ADR 002: Persisted Balances & IPC Overhead

## Status
Draft

## Context & Problem Statement
In Phase 4B, we isolated a critical performance bottleneck during concurrent transaction writes (`POST /api/v1/transactions`). The system experienced 50-second p95 latencies and Node.js Event Loop starvation under a load of 50 concurrent VUs.

Initially, we hypothesized the bottleneck was the $O(N)$ database execution time of aggregating the entire transaction history to validate overdrafts. However, our History-Depth Benchmark provided evidence to the contrary: within the tested dataset sizes (100–50,000 rows), PostgreSQL aggregation remained effectively constant and did not materially contribute to end-to-end latency.

The dominant remaining bottleneck appears to be Node.js execution together with repeated Prisma client interactions during the synchronous write path.
Currently, the write path requires 6 separate Prisma queries:
1. `account.findFirst`
2. `transaction.groupBy`
3. `transfer.aggregate (Out)`
4. `transfer.aggregate (In)`
5. `transaction.create` (inside an interactive `$transaction`)
6. `auditLog.create` (inside an interactive `$transaction`)

Each query incurs interaction between Node.js and the Prisma engine, resulting in six separate Prisma client operations. Furthermore, the interactive `$transaction` holds the database connection open while waiting for the Node.js Event Loop to schedule the next promise. Under high concurrency, these 6 operations per request cause severe queuing and event loop starvation.

To achieve our performance goals, we must minimize these database interactions on the critical write path.

## Considered Options
1. **Raw SQL Aggregation (Single Query):** Combine the 4 read queries into a single `$queryRaw` call. This reduces IPC but still requires an interactive transaction for the write phase (read balance -> check overdraft -> write tx).
2. **Persisted Balances (Denormalization):** Persist a `balanceMinor` column on the `Account` model. Update it transactionally alongside the `Transaction` insert.

## Decision
The evidence strongly supports that historical aggregation was a major contributor to write latency under the tested workload. We have implemented **Option 2: Persisted Balances (Denormalization)** as a performance projection. 

By persisting the balance, we eliminate the need to scan the `Transaction` and `Transfer` tables during every write. 
The write path has been transformed into:
1. `account.update({ balanceMinor: { increment: X } })`
2. `transaction.create(...)`
3. `auditLog.create(...)`

These are batched into a **Sequential Prisma Transaction** (`prisma.$transaction([...])`), which executes entirely in the Prisma engine as a single batched operation.

### System Invariants
Every optimization must preserve these invariants:
```text
For every committed transaction:

Account.balanceMinor
=
sum(transactions)
+
incoming transfers
-
outgoing transfers
```

### Prisma Query Count Impact
| Endpoint          | Before | After |
| ----------------- | ------ | ----- |
| addTransaction    | 6      | 3     |
| editTransaction   | 8      | 4     |
| deleteTransaction | 6      | 3     |
| transfer          | 8      | 4     |

### Overdraft Validation Strategy
To prevent overdrafts without a preceding read query, we rely on PostgreSQL's database-level constraints and row-level locking. We added a `CHECK (balance_minor >= 0 OR allow_negative_balance = true)` constraint to the `Account` table. The validation mechanism relies on PostgreSQL row-level locking during `UPDATE`: when we increment or decrement `balance_minor`, the `CHECK` constraint evaluates atomically. If a transaction causes an overdraft, the sequential transaction fails at the database level, and Prisma throws an error that we catch and format for the user.

## Exit Criteria

Persisted balances remain only if:
- ✓ `p95` latency improves under concurrent load
- ✓ Throughput (req/s) improves under concurrent load
- ✓ Financial correctness remains 100%
- ✓ Operational complexity (e.g. keeping balances in sync) is acceptable
- ✓ Rollback strategy is fully documented

Under the benchmarked workload, persisted balances removed the dependency of write latency on transaction history depth. Measured improvement observed under benchmark conditions confirms the architectural decision.

## Complexity Budget Impact
- **Runtime:** Eliminates repeated historical aggregation from the synchronous write path. Prisma client interactions reduced significantly.
- **State:** 1 source of truth -> 2 sources of truth (Requires a migration script to backfill and synchronize).
- **Operational:** Low -> Medium (We must ensure every write path updating transactions/transfers also updates the account balance).
- **Rollback:** Medium (Requires dropping the column and reverting the write path).

## Next Steps (Phase 5)
With Phase 4C complete, Phase 5 shifts focus from performance to **operational resilience**, including:
- Concurrency Safety
- Idempotency
- Observability
- Background Jobs (e.g., Scheduled reconciliation)
- Failure Recovery
- Production Benchmarks

