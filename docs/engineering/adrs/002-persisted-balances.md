# ADR 002: Persisted Balances & IPC Overhead

## Status
Proposed

## Context & Problem Statement
In Phase 4B, we isolated a critical performance bottleneck during concurrent transaction writes (`POST /api/v1/transactions`). The system experienced 50-second p95 latencies and Node.js Event Loop starvation under a load of 50 concurrent VUs.

Initially, we hypothesized the bottleneck was the $O(N)$ database execution time of aggregating the entire transaction history to validate overdrafts. However, our History-Depth Benchmark mathematically disproved this: PostgreSQL executed the full aggregation of 50,000 rows in <5ms with a flat latency curve ($O(1)$ scaling due to index scans and a 98% buffer hit ratio).

The true bottleneck is **Connection Pool Saturation & Node.js/Prisma IPC (Inter-Process Communication) Overhead**.
Currently, the write path requires 6 separate Prisma queries:
1. `account.findFirst`
2. `transaction.groupBy`
3. `transfer.aggregate (Out)`
4. `transfer.aggregate (In)`
5. `transaction.create` (inside an interactive `$transaction`)
6. `auditLog.create` (inside an interactive `$transaction`)

Each query incurs an IPC roundtrip between Node.js and the Prisma Rust engine. Furthermore, the interactive `$transaction` holds the database connection hostage while waiting for the Node.js Event Loop to schedule the next promise. Under high concurrency, these 6 IPC roundtrips per request completely stall the Node.js Event Loop.

To achieve our performance goals, we must eliminate these read queries from the critical write path and remove the interactive transaction.

## Considered Options
1. **Raw SQL Aggregation (Single Query):** Combine the 4 read queries into a single `$queryRaw` call. This reduces IPC but still requires an interactive transaction for the write phase (read balance -> check overdraft -> write tx).
2. **Persisted Balances (Denormalization):** Persist a `balanceMinor` column on the `Account` model. Update it transactionally alongside the `Transaction` insert.

## Decision
We will implement **Option 2: Persisted Balances (Denormalization)**.

By persisting the balance, we eliminate the need to scan the `Transaction` and `Transfer` tables during every write. 
The write path will be transformed into:
1. `account.update({ balanceMinor: { increment: X } })`
2. `transaction.create(...)`
3. `auditLog.create(...)`

These can be batched into a **Sequential Prisma Transaction** (`prisma.$transaction([...])`), which executes entirely in the Prisma Rust engine with exactly **1 IPC roundtrip**.

### Overdraft Validation Strategy
To prevent overdrafts without a preceding read query, we will rely on PostgreSQL's database-level constraints. We will add a `CHECK (balance_minor >= 0 OR allow_negative_balance = true)` constraint to the `Account` table. If a transaction causes an overdraft, the sequential transaction will fail at the database level, and Prisma will throw an error that we can catch and format for the user.

## Complexity Budget Impact
- **Runtime:** $O(N)$ -> $O(1)$. IPC roundtrips reduced from 6 to 1.
- **State:** 1 source of truth -> 2 sources of truth (Requires a migration script to backfill and synchronize).
- **Operational:** Low -> Medium (We must ensure every write path updating transactions/transfers also updates the account balance).
- **Rollback:** Medium (Requires dropping the column and reverting the write path).

## Next Steps (Phase 4C)
1. Generate Prisma migration to add `balanceMinor` to `Account`.
2. Write a backfill script to populate `balanceMinor` for all existing accounts using the Financial Correctness Suite logic.
3. Add a Postgres `CHECK` constraint for overdraft protection.
4. Refactor `addTransaction`, `editTransaction`, `deleteTransaction`, and `importTransactions` to use Sequential Transactions updating the `balanceMinor`.
5. Verify 100% parity using the `financial-correctness-suite.ts`.
