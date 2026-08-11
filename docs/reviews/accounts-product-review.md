# Phase 6A: Accounts Product & UX Review

## Product North Star
> **"Where is my money?"**
Accounts is the geographic map of the user's financial life, clarifying liquidity, allocation, and account health. It is not a generic CRUD table.

## Core User Questions
1. Where is my money currently held?
2. How much is available in each account?
3. What is my total position across all accounts?
4. Which accounts are growing or declining?
5. Which accounts require attention?
6. What type of accounts do I have?
7. Where should I go to manage or reconcile a specific account?

## Information Hierarchy
1. Overall Account Position (Aggregated)
2. Account Health / Attention (Domain-specific alerts)
3. Account Portfolio / List (Grouped)
4. Account-Level Information (Name, balance, trend)
5. Account Actions (Reconcile, Edit, Transfer)
6. Secondary Information (Archived status)

## Domain Boundaries
* **Transactions:** Detailed exploration of activity.
* **Dashboard:** Global financial attention and "Safe to Spend".
* **Reports:** Historical analysis.
* **Accounts:** Strictly liquidity, allocation, and account health.

## Edge Cases
* Zero / One / Many accounts
* Manual vs. Connected (Sync status)
* Archived / Inactive
* Stale / Negative / Zero balances
* Multiple currencies

## Coffee Shop Test
Within 5-10 seconds, the user must know:
1. Where their money is.
2. How much they have (total).
3. Which accounts need attention.
4. Where to tap to act.

## Phase 6A Decisions (Approved)
1. **Sync / Connected Accounts:** Do not mock connected/synced accounts. The DTO focuses on manual accounts as they exist today, but remains extensible.
2. **Account Grouping:** Backend intelligence layer owns account grouping and sort order. The frontend React layer purely maps the provided groups.
3. **Trends:** Backend calculates trajectory based on history. If history is insufficient, returns an explicit `unavailable` state.
4. **Account Actions:** The UI will not assume the presence of actions (e.g., transfers) unless explicitly enabled by the DTO's capabilities flag (WO-8 dependent).

## Approval Gates for Next Phase (6C)
- [ ] Approve the `AccountsIntelligenceDTO` data contract.
