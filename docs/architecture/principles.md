# Ledger360 Architecture Principles

1. **Defense-in-Depth Validation & Auth**
   - **Validate once:** Zod strict parsing at the absolute edge (Server Actions).
   - **Authorize once:** Centralized `authz.ts` wrapper enforces `userId` scoping across all operations.

2. **Domain Layer & Financial Invariants**
   - **Financial invariants cannot be bypassed:** Overdrafts, zero-value filters, and money mathematics are strictly guarded by Domain logic, never relying on UI logic.
   - **Money is represented in minor units:** The strict `MoneyDTO` (`{ amountMinor: number, currency: CurrencyCode }`) is the only acceptable money representation across the app. `Decimal` and `Float` are forbidden in business logic.
   - **Property tests protect accounting identities:** Critical math paths (Net Worth, Interest Splits, Balances) are fuzz-tested with property-based testing.

3. **Serialization & API Boundaries**
   - **Only DTOs may cross the server/client boundary.**
   - **DTO Strictness:** DTOs must contain *only* serializable primitives (string, number, boolean, null, plain objects, arrays). `Date`, `BigInt`, `Decimal`, and `Prisma.JsonValue` are forbidden at the serialization boundary.
   - **Shared Domain Types:** Prisma enums are never manually duplicated in DTOs. Instead, shared types (e.g. `AccountType`) are extracted to a common `domain.ts` type layer.
   - **Query vs Action Contracts:** Internal queries return direct Domain DTOs (`AccountDTO[]`). Edge Server Actions return strictly wrapped API results (`ActionResult<T>`).
   
4. **Data Access**
   - **Repository Isolation:** Only `repositories/` and `queries/` are allowed to import `@prisma/client`. UI components, App Router paths, and Actions may never talk to the database directly.
   - **Scoping:** All database methods must aggressively filter by `userId`.
