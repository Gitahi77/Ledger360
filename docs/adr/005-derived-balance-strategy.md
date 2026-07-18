# ADR 005: Derived Balance Strategy

## Status
Superseded by [ADR 011: Persisted Balances](011-persisted-balances.md)

## Context
Storing an account's balance as an explicit row column (`balance: 100`) leads to race conditions. If two concurrent transfers update the row simultaneously, one update may overwrite the other, destroying money.

## Decision
Account balances are derived directly from the immutable ledger. A balance is calculated as: `Opening Balance + Sum(Income) - Sum(Expense) + Sum(Transfers In) - Sum(Transfers Out)`.

## Alternatives Considered
- Updating a scalar `balance` field inside a strict transaction (creates heavily contended database locks on highly active accounts).
- Event Sourcing (over-engineered for the current phase).

## Consequences
- Reading a balance is computationally more expensive than a scalar read.
- Requires Phase 2F read-model optimizations (e.g., periodic snapshots) to scale.

## Future Considerations
Implementing materialized views in Postgres for lightning-fast balance aggregation.
