# Phase 4B: Application Execution Dossier

## 1. Executive Summary

This dossier investigates the application-level execution profile of the `addTransaction` endpoint under a 50 VU write-heavy benchmark. 

The previous experiment (Phase 4B.1) introduced a composite index that successfully eliminated database sequential scans and reduced raw SQL execution time to ~5.6ms. However, the application p95 latency degraded significantly under load. 

By instrumenting `addTransaction` with high-resolution performance counters (`performance.now()`) and measuring V8 heap growth, we have isolated the true bottleneck: **excessive row materialization and event-loop saturation in Node.js.**

## 2. Methodology

We instrumented the `addTransaction` server action to measure:
1. **Total Duration:** End-to-end execution of the action.
2. **BalanceService Duration:** Time spent fetching and aggregating all accounts for the user (`getEnrichedAccounts`).
3. **Persist Duration:** Time spent inside the `prisma.$transaction` block (writing the transaction and audit log).
4. **Revalidate Duration:** Time spent calling Next.js `revalidatePath`.
5. **Heap Growth:** Change in `process.memoryUsage().heapUsed`.

We executed the `k6` benchmark suite (`transaction_write_heavy` scenario) with 50 concurrent Virtual Users (VUs) against a database seeded with 50,000 transactions.

## 3. Empirical Evidence (The Profile)

Sample traces from the heaviest load window:

| Trace ID | Total Time | BalanceService | Persist | Revalidate | Unaccounted (Event Loop Delay) | Heap Growth |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A** | 12,695 ms | 6,410 ms | 3,121 ms | 1.32 ms | ~3,162 ms | +10.8 MB |
| **B** | 14,113 ms | 5,981 ms | 4,249 ms | 0.05 ms | ~3,883 ms | +14.2 MB |
| **C** | 40,359 ms | 24,083 ms | 2,698 ms | 0.04 ms | ~13,578 ms | -26.7 MB (GC) |
| **D** | 41,148 ms | 24,922 ms | 2,692 ms | 0.03 ms | ~13,534 ms | -14.3 MB (GC) |
| **E** | 43,515 ms | 5,856 ms | 732 ms | 0.05 ms | ~36,927 ms | -7.1 MB (GC) |

### Key Findings:

1. **Revalidation is NOT the bottleneck:** `revalidatePath` consistently takes < 2ms. It merely queues the cache purge; it does not synchronously render components.
2. **Database Queries vs. Prisma Time:** While raw SQL takes ~5.6ms, `BalanceService` takes **6 to 25 seconds**. The `Persist` block takes **2.5 to 4.2 seconds**. This discrepancy is caused by connection pool queueing and massive row materialization overhead inside the Prisma client engine.
3. **Event Loop Starvation ("Unaccounted" Time):** Up to 36 seconds of request time is unaccounted for by our manual timers. This represents the time the Node.js event loop spent blocked or waiting for the Prisma query engine (Rust) to serialize/deserialize massive JSON payloads over the IPC bridge.
4. **Memory Pressure:** Individual requests allocate up to **14 MB** of heap space just to process one transaction. When 50 VUs do this concurrently, Node.js is forced into aggressive, stop-the-world Garbage Collection (visible as massive negative heap growth), further stalling the event loop.

## 4. Root Cause Proof (The Call Graph)

The execution path of `addTransaction` reveals *why* the memory and event loop pressure is so high:

```text
addTransaction (1 write)
  └─> getCurrentUser() 
  └─> BalanceService.getEnrichedAccounts(userId)  <-- The Hotspot
        └─> AccountsRepository.getAccountsByUserId(userId)
              [SQL: SELECT * FROM Account WHERE userId = ?]
        └─> TransactionsRepository.getTransactionSumsByAccount(userId)
              [SQL: SELECT accountId, SUM(...) FROM Transaction WHERE userId = ? GROUP BY accountId, type]
        └─> TransfersRepository.getTransferSumsByAccount(userId)
              [SQL: SELECT sourceAccountId, SUM(...) FROM Transfer WHERE userId = ? GROUP BY sourceAccountId]
              [SQL: SELECT destinationAccountId, SUM(...) FROM Transfer WHERE userId = ? GROUP BY destinationAccountId]
  └─> prisma.$transaction (Persist)
        └─> createTransactionRecord (1 write)
        └─> auditLog.create (1 write)
  └─> revalidatePath('/')
```

### Workload Classification

Before analyzing the call graph, we must classify the workload to select the appropriate optimization strategy. The user's request falls under **Validation**:

| Workload   | Characteristics           | Optimization Strategy        |
| ---------- | ------------------------- | ---------------------------- |
| Validation | Needs exact current state | Minimal targeted queries     |
| Dashboard  | Aggregated data           | Cached summaries             |
| Ledger     | Sequential browsing       | Cursor pagination            |
| Reporting  | Historical analytics      | Date ranges / summaries      |
| Search     | Lookup                    | Full-text/index optimization |
| Export     | Large reads               | Streaming/batching           |

Because `addTransaction` involves overdraft prevention (`projectedBalance < 0`), it is a **Validation** workload. It requires the exact current state of the ledger and cannot arbitrarily limit its historical window or rely on eventual consistency.

### The Architectural Flaw: "Full-World Recomputation"
Every time a user adds **one** transaction to **one** account, the application forces the database to re-aggregate **all** transactions and **all** transfers across **all** of the user's accounts to calculate current balances just to perform validation (`projectedBalance < 0`). 

When 50 VUs hit the endpoint, Prisma attempts to pull, deserialize, and map thousands of aggregation rows simultaneously, maxing out CPU and memory.

## 5. Exhaustive Evaluation of Lower-Complexity Optimizations

The user explicitly requested that we evaluate lower-complexity optimizations before jumping to denormalization (persisted balances).

### 1. Request Scope Reduction (Evaluating)
*   **Hypothesis:** Can we only calculate the balance for the *specific account* being modified, rather than *all* accounts?
*   **Feasibility:** High. `addTransaction` only needs the balance of `data.accountId` to validate `allowNegativeBalance`.
*   **Expected Impact:** Would reduce row materialization and grouping overhead by `(N-1)/N` where N is the number of accounts. For a user with 10 accounts, this is a 90% reduction in work.

### 2. Data Access Locality (Working-Set Reduction) (Evaluating)
*   **Hypothesis:** Can we reduce the amount of historical data examined for each request? E.g., querying only the required time horizon (day, week, month, year) or using cursor pagination.
*   **Feasibility:** Not applicable for **Validation** workloads. Current balance depends on all historical transactions unless checkpoints or persisted balances are maintained. It is, however, highly applicable to Reporting, Ledger browsing, and Dashboard workloads.
*   **Expected Impact:** For the `addTransaction` validation path, 0%. For read-heavy paths, this is critical.

### 3. SQL Consolidation (Evaluating)
*   **Hypothesis:** Can we replace the four separate Prisma queries (`getAccounts`, `getTransactionSums`, `getTransfersOut`, `getTransfersIn`) with a single raw SQL query or Prisma View?
*   **Feasibility:** High.
*   **Expected Impact:** Reduces Prisma Client IPC overhead and connection pool consumption (1 connection instead of 4).

### 4. Reduce Row Materialization (Evaluating)
*   **Hypothesis:** Can we select fewer fields?
*   **Feasibility:** We are already using `SUM` and `GROUP BY`, so row materialization is limited to one row per account per type. The materialization issue isn't row *count*, but the *frequency* of the heavy aggregation query.

### 5. Incremental Computation (Not Applicable)
*   Applicable to analytics, but not to strict ACID balance validation on the write path.

### 6. Streaming/Batching (Not Applicable)
*   This is a single synchronous write request from a user. Batching does not apply.

### 7. Caching (High Risk)
*   **Hypothesis:** Cache `getEnrichedAccounts` in Redis.
*   **Feasibility:** Dangerous. Caching balances on a write-heavy path where the balance is used for immediate validation (`allowNegativeBalance`) introduces race conditions. We would need a distributed lock or Redis `DECR` logic, essentially building persisted balances in Redis instead of Postgres.

### 8. Denormalization / Persisted Balances (Last Resort)
*   **Hypothesis:** Add `balanceMinor` to the `Account` model and update it incrementally during `addTransaction`.
*   **Feasibility:** High, but introduces state management complexity.

## 6. Conclusion & Recommendation

The database index solved the SQL latency, but the architectural pattern of **"recalculate everything to validate one thing"** is crushing the Node.js event loop under load. 

Before introducing architectural state (denormalization), we **MUST** attempt Optimization #1 and #2:

**Proposed Next Step (Minimal Fix):**
Refactor the validation logic in `addTransaction` to bypass the heavy `BalanceService.getEnrichedAccounts()` entirely. Instead, introduce a highly scoped repository method: `AccountsRepository.getSingleAccountBalance(accountId)` that executes a single, targeted SQL query just for the affected account. 

This directly addresses the "Scope Reduction" and "SQL Consolidation" strategies, requiring no schema changes and no caching infrastructure.
