# ADR 006: Repository Pattern

## Status
Accepted

## Context
Server Actions and Domain Services were directly invoking Prisma commands (`prisma.transfer.create`). This coupled the domain logic rigidly to the ORM and made unit testing impossible without an actual Postgres database.

## Decision
We will define strict Repository Interfaces (e.g., `ITransferRepository`) in the domain layer. The infrastructure layer provides the implementations (`PrismaTransferRepository`). Domain services will depend entirely on the interfaces.

## Alternatives Considered
- Direct Prisma usage inside Services (violates Dependency Inversion Principle).
- Heavy Dependency Injection frameworks (e.g., NestJS, Inversify) — deemed over-engineered for our current phase.

## Consequences
- Requires writing boilerplate mappers and repository functions.
- Enables lightning-fast, mock-based unit testing of complex financial algorithms.

## Future Considerations
N/A
