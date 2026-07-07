# ADR 003: Financial Invariants

## Status
Accepted

## Context
A financial platform must guarantee mathematical correctness. If bugs occur, the system must never spontaneously create or destroy value. We need an automated way to verify these invariants.

## Decision
We will implement property-based tests and a `FinancialIntegrityService` that asserts the following non-negotiable invariants:
- **Money Conservation**: The sum of all derived balances across all accounts and loans must perfectly equal the sum of all raw income/expense transactions.
- **Double Entry Matching**: Every transfer must debit and credit equivalent base amounts.
- **Negative Conservation**: Assets cannot drop below zero unless explicitly typed as a `CREDIT` liability or authorized for overdraft.

## Alternatives Considered
- Periodic manual reconciliation (error-prone).
- Reliance on Prisma foreign keys alone (insufficient for mathematical assertions).

## Consequences
- Testing complexity increases.
- Requires building a standalone integrity verifier.

## Future Considerations
Running the integrity checker as a nightly CRON job.
