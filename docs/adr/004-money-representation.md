# ADR 004: Money Representation

## Status
Accepted

## Context
Floating point arithmetic in JavaScript introduces severe rounding errors (e.g., `0.1 + 0.2 = 0.30000000000000004`). In a financial system, this leads to fractional drift and reconciliation failures.

## Decision
All monetary values in the database must be stored as `BigInt` representing the "minor" unit of the currency (e.g., cents for USD, pennies for GBP, whole shillings for KES). In the domain layer, these are encapsulated in a strict `Money` Value Object.

## Alternatives Considered
- Using `Decimal.js` (computationally heavier, harder to serialize natively).
- Using Postgres `NUMERIC` everywhere (pushes too much math to the DB layer).

## Consequences
- The client UI cannot natively consume `BigInt`; the DTO layer must downcast safely to `number` exclusively for read-only rendering.
- All domain arithmetic must be isolated to the `Money` object.

## Future Considerations
Multi-currency arithmetic requiring precise FX rate persistence.
