# ADR 0001: Strict Domain and Serialization Boundaries

## Status
Accepted

## Context
Ledger360 transitioned from a fast-iterating Next.js CRUD application to a robust financial ledger system. During this evolution, several architectural anti-patterns emerged:
- Server Actions returned raw Prisma records containing non-serializable objects (e.g., `BigInt`, `Date`, `Decimal`).
- UI logic was duplicating core validation rules (e.g., overdraft limits, zero-value filters).
- The `Money` representation was fragmented, with actions parsing strings into BigInts unpredictably.
- Financial logic lacked deterministic safety nets, leading to potential regressions during refactoring.

## Decision
We have established a layered architecture enforcing the following boundaries:

1. **Validation & Authorization Edge**
   - Zod schemas parse every incoming request exactly once at the edge.
   - The centralized `authz.ts` wrapper enforces `userId` boundaries; actions no longer rely on `req.session` internals directly.

2. **Domain Service Isolation**
   - Financial invariants (overpayment limits, interest rate caps, overdraft constraints) belong solely to the Domain layer (`lib/domain/`).
   - The Domain Layer assumes external inputs are malicious and never trusts the UI layer to enforce constraints.

3. **Strict Serialization (DTO) Boundary**
   - The edge Server Actions may ONLY return pure Data Transfer Objects (DTOs) wrapped in an `ActionResult<T>`.
   - DTOs strictly consist of serializable primitives: `string`, `number`, `boolean`, `null`, plain objects, and arrays.
   - Complex types (`Date`, `Decimal`, `BigInt`, `Prisma.JsonValue`) are explicitly mapped into serialized forms (e.g., ISO strings, base-10 numbers) before returning to the UI.

4. **Money Standardization**
   - Money is universally represented using `MoneyDTO { amountMinor: number, currency: CurrencyCode }`.
   - All internal arithmetic operates on integers to prevent floating-point anomalies.

5. **Prisma Isolation**
   - Prisma enums are not duplicated in the DTO layer. Shared types are defined in `domain.ts` and reused across the DTO boundary to prevent schema drift.
   - The `@prisma/client` is restricted to `repositories/` and `queries/`.

## Consequences
**Positive:**
- CI/CD regressions due to Next.js serialization warnings (`Only plain objects can be passed to Client Components`) are permanently eliminated.
- The UI layer is stateless regarding financial mathematics, making components drastically easier to unit test.
- Property-based tests via `fast-check` can aggressively fuzz financial invariants without executing full HTTP payloads.

**Negative:**
- Increased boilerplate: Every database query must run through a mapper function (`mapAccountToDTO`, `mapTransactionToDTO`) before returning to the Client.
- Type definitions require meticulous maintenance to ensure the `domain.ts` type layers align with Prisma structures.
