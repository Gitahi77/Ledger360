- `[x]` Pass `npx tsc --noEmit`
- `[x]` Pass `npm run build`

# Phase 4A: Observability Implementation

- `[x]` 1. Request ID Context: Implement lazy `getRequestId()` using React `cache` in `src/lib/request-context.ts`
- `[x]` 2. Error Taxonomy: Create `AppError` taxonomy with codes (`VALIDATION`, `AUTHORIZATION`, `INTERNAL`, etc.) in `src/lib/errors.ts`
- `[x]` 3. Structured Logging: Upgrade `logger` to output JSON locally and export `event` method for database persistence.
- `[x]` 4. Audit Log Data Model: Add `entityId` and metadata fields to `AuditLog` in Prisma schema.
- `[x]` 5. Auth Wrapper Interception: Update wrappers to handle timing (rounded `performance.now()`), request ID injection, error mapping, and logging.
- `[x]` 6. Health Endpoints: Implement `/api/health/live` (200 OK) and `/api/health/ready` (DB connection check)
- `[x]` 7. Regression Test: Write `observability.test.ts` to verify `requestId` propagation across nested calls and logs.
- `[x]` 8. Replace Prisma `include` with `select` for partial fetches.
- `[x]` 9. Final build verification.
- `[x]` 10. Remove stray `console.*` calls outside tests/scripts.
