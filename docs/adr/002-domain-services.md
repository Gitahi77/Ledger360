# ADR-002: Domain Services for Financial Logic

## Status
Accepted

## Context
Initially, the modernization plan proposed extracting Prisma logic into "Repositories". While this separated data fetching from Server Actions, it risked creating "God Repositories" that contained heavy financial business logic (such as dynamic net worth computation, interest accumulation, and loan amortization). 

If financial calculations live inside repositories, the repository layer cannot be easily mocked or replaced, and testing pure financial logic becomes unnecessarily entangled with database mocking.

## Decision
We adopt a tripartite Domain Architecture:
`Repository → Domain Service → Mapper`

1. **Repositories (`src/lib/repositories/`)**
   - Strictly responsible for Persistence (Create, Read, Update, Delete).
   - They contain Prisma queries but do not "know accounting."
   - Implemented as functional modules (`getAccounts()`), not classes.

2. **Domain Services (`src/lib/domain/`)**
   - Strictly responsible for Business Logic and Computations.
   - Example: `BalanceService` accepts an `AccountPersistenceModel` from the Repository and computes its running balance.
   - These modules are highly pure and unit-testable without Prisma overhead.

## Consequences
- **Positive:** Decouples financial algorithms from the persistence layer, drastically improving maintainability over a 5-10 year horizon.
- **Positive:** Unit testing financial logic (the most critical part of the application) becomes fast and deterministic.
- **Negative:** Adds a third architectural layer, requiring developers to distinguish between reading data (Repository) and aggregating it (Domain Service).
