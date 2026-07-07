# ADR 009: Error Taxonomy

## Status
Accepted

## Context
Throwing generic `Error("Insufficient funds")` strings makes programmatic recovery impossible. Server Actions must parse strings to determine what UI element to show or what HTTP status code to return.

## Decision
All domain logic must throw strictly typed `DomainError` classes (e.g., `InsufficientFundsError`, `CurrencyMismatchError`). The Server Action layer catches these and maps them exclusively to standard `ActionResult` codes (e.g., `CONFLICT`, `VALIDATION_ERROR`).

## Alternatives Considered
- Using `Result` monads throughout the domain (rejected due to excessive boilerplate in TypeScript compared to Rust/Go).

## Consequences
- Requires defining custom error classes.
- Prevents raw stack traces from reaching the client.

## Future Considerations
N/A
