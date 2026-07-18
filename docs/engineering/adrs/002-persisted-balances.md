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
The evidence suggests persisted balances are the leading architectural candidate, but two remaining hypotheses should be eliminated before approving a permanent second source of truth. If approved, we will implement **Option 2: Persisted Balances (Denormalization)**.

By persisting the balance, we eliminate the need to scan the `Transaction` and `Transfer` tables during every write. 
The write path will be transformed into:
1. `account.update({ balanceMinor: { increment: X } })`
2. `transaction.create(...)`
3. `auditLog.create(...)`

These can be batched into a **Sequential Prisma Transaction** (`prisma.$transaction([...])`), which executes entirely in the Prisma engine as a single batched operation.

### Overdraft Validation Strategy
To prevent overdrafts without a preceding read query, we will rely on PostgreSQL's database-level constraints and row-level locking. We will add a `CHECK (balance_minor >= 0 OR allow_negative_balance = true)` constraint to the `Account` table. The validation mechanism relies on PostgreSQL row-level locking during `UPDATE`: when we increment or decrement `balance_minor`, the `CHECK` constraint evaluates atomically. If a transaction causes an overdraft, the sequential transaction will fail at the database level, and Prisma will throw an error that we can catch and format for the user.

## Exit Criteria

Persisted balances remain only if:
- ✓ `p95` latency improves under concurrent load
- ✓ Throughput (req/s) improves under concurrent load
- ✓ Financial correctness remains 100%
- ✓ Operational complexity (e.g. keeping balances in sync) is acceptable
- ✓ Rollback strategy is fully documented

## Complexity Budget Impact
- **Runtime:** Eliminates repeated historical aggregation from the synchronous write path. Prisma client interactions reduced from 6 to 1.
- **State:** 1 source of truth -> 2 sources of truth (Requires a migration script to backfill and synchronize).
- **Operational:** Low -> Medium (We must ensure every write path updating transactions/transfers also updates the account balance).
- **Rollback:** Medium (Requires dropping the column and reverting the write path).

## Next Steps (Phase 4C)
1. Generate Prisma migration to add `balanceMinor` and the `CHECK` constraint.
2. Refactor the write paths (`addTransaction`) to use a Sequential Prisma Transaction updating the balance.
3. Write backfill scripts to initialize `balanceMinor` for existing accounts.
4. Build `recalculateBalances()` to recompute every account from the ledger.
5. Build `detectBalanceDrift()` to detect if the stored balance ever differs from the computed sum of transactions.
6. Run benchmarks and verify parity.
