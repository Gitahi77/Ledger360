# ADR 008: Transfer Idempotency

## Status
Accepted

## Context
Mobile networks drop, browsers freeze, and users tap the "Transfer" button twice. Financial systems must ensure that receiving the exact same command twice only executes it once.

## Decision
Every transfer must include a deterministic `idempotencyKey`. We will persist this key in a dedicated `IdempotencyRecord` table within the Postgres database, committing it within the same atomic transaction as the Transfer. Identical subsequent requests will return the originally stored response.

## Alternatives Considered
- Using Redis with a TTL (creates distributed consistency risks if Redis falls out of sync with Postgres).
- Catching unique index errors on the Transfer table (fails to return the original response payload transparently).

## Consequences
- Increases the size of the database minimally.
- Provides absolute transactional safety.

## Future Considerations
Archiving old idempotency keys to cold storage after 30 days.
