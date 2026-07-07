# ADR-001: Data Transfer Object (DTO) Boundary Enforcement

## Status
Accepted

## Context
The Ledger360 application frequently experiences Next.js runtime crashes related to serialization. Server Actions fetch data via Prisma (which uses `BigInt` for database consistency and `Date` objects) and return these raw ORM models directly to Client Components. Next.js cannot natively serialize `BigInt` objects to JSON across the network boundary, resulting in a hydration crash. 

Additionally, the UI components are tightly coupled to the shape of the database tables, making database refactoring brittle and leading to "utility soup" DTOs designed ad-hoc per page (e.g., `DashboardOverviewDTO`).

## Decision
We enforce a strict serialization boundary using explicit Domain DTOs.
- No raw Prisma models may ever cross the Server/Client boundary.
- We introduce explicit domain mappers (`toAccountDTO`, `toTransactionDTO`) rather than generic serializers.
- All monetary values (`BigInt`) are strictly downcasted to safe JavaScript `Number` types inside the Mapper layer before leaving the server. (The application handles minor units, so `Number.MAX_SAFE_INTEGER` provides ~90 trillion units of runway, which is safe).
- DTOs represent the canonical Domain (e.g., `AccountDTO`), not the shape of the UI page consuming them.

## Consequences
- **Positive:** Complete elimination of hydration and BigInt serialization crashes.
- **Positive:** Client components and UI templates become decoupled from the Prisma schema.
- **Negative:** Increased boilerplate required for mapping data between layers.
