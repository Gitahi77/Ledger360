# ADR 010: Concurrency Strategy

## Status
Accepted

## Context
When an account with a $100 balance processes two concurrent transfers of $100 simultaneously, both processes might read `$100`, authorize the transfer, and commit—resulting in an illegal -$100 balance. 

## Decision
We enforce sequential execution of overlapping transactions via explicit Postgres Row-Level Exclusive Write Locks. Inside a `prisma.$transaction`, we perform a dummy `updatedAt` mutation on the source `Account` row. Postgres queues any subsequent writes to that row until the first transaction commits or rolls back. 

## Alternatives Considered
- Application-level distributed locks (e.g., Redis). Rejected due to operational complexity and risk of deadlocks if the app crashes.

## Consequences
- Ensures strict financial consistency without over-engineering.

## Future Considerations
N/A
