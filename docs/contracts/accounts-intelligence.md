# Phase 6B: Accounts Intelligence DTO Contract

This document defines the strict data contract (`AccountsIntelligenceDTO`) between the Intelligence Engine and the Accounts UI React components.

## Core Architectural Principle
> **The `AccountsIntelligenceDTO` must represent the current capabilities of Ledger360, while remaining extensible for future connected-account functionality without requiring a frontend architectural rewrite.**

## Explicit Decisions
1. **No mocked connected-account/sync fields:** The DTO models only manual accounts as they exist today. Future fields (`isSynced`, `connectionStatus`, `lastSyncTime`) can be added to the account object without breaking the top-level structure.
2. **Backend owns account grouping:** The UI no longer uses a hardcoded mapping. The backend returns a grouped array (`accountGroups`), and the frontend simply iterates over it.
3. **Backend owns account trajectory calculation:** The intelligence layer is responsible for determining if an account is growing or declining based on historical transactions. If there is insufficient data, it explicitly returns `trajectory.direction = 'unavailable'`.
4. **No assumed actions:** The DTO explicitly exposes a `capabilities` block for each account. The UI only renders actionable buttons (Edit, Archive, Delete, Transfer) if the backend confirms the account and current system state support them.

## The Contract Structure
The DTO guarantees the following fields:

### Global Domain Properties
- `domainState`: `ready | onboarding` (Determines if the EmptyState or main cockpit is shown).
- `totalPosition`: The aggregated total of all un-archived accounts in the user's primary reporting currency.
- `dataFreshness`: A structured object containing `status` (`current | stale`) and `lastUpdatedAt`.

### Account Groups
An array of group objects defining the semantic portfolio distribution.
- `id`: Internal identifier (e.g., `cash`).
- `label`: Human-readable label (e.g., `Cash & Equivalents`).
- `order`: Deterministic display order.
- `accounts`: An array of individual account representations.

### Individual Account Identity & State
- `id`, `name`, `type`: The base identity.
- `actionableState`: `active | archived`.
- `nativeBalance`: The balance in the account's original currency.
- `reportingBalance`: The balance converted to the user's base reporting currency (used for rolling up into `totalPosition`).
- `trajectory`: An object containing the trend direction (`improving | stable | deteriorating | unavailable`).
- `health`: An object containing the health status (`healthy | overdrawn | needs_reconciliation | missing_opening_balance`) and an optional explanatory message.
- `capabilities`: Booleans indicating which actions the frontend is allowed to offer.

### Archived Accounts
Separated from the active groups to ensure archived accounts are never accidentally mixed into active liquidity displays.

## DTO Invariants

1. `totalPosition` includes only active accounts.
2. `totalPosition.currency` is the reporting currency.
3. `reportingBalance.currency` equals `totalPosition.currency`.
4. `nativeBalance` remains in the account's native currency.
5. Archived accounts never appear in `accountGroups`.
6. Group order is authoritative and must not be changed by React.
7. Account order within each group is authoritative and must not be changed by React.
8. `trajectory.direction` is backend-derived; React never infers it.
9. `health.status` is backend-derived; React never infers it from balances.
10. Capabilities are authoritative; React never assumes unsupported actions.
11. `dataFreshness.status` is backend-derived; React never calculates staleness.
12. No monetary arithmetic, FX conversion, grouping, sorting, trend calculation, or health classification occurs in React.

## Verification Gate
Before proceeding to Phase 6C (Visual Blueprint), this contract must be approved. The UI will be constructed strictly against this JSON shape, avoiding any local percentage, trend, grouping, or status calculations.
