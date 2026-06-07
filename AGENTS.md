<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ledger360-constitution -->
# Ledger360 Constitution — non-negotiable rules

You are an implementer, not a redesigner. Implement only the active work order.
Do not refactor, rename, or "improve" anything outside its scope. When done,
summarise the diff, run a self-audit, and STOP. Work ONE work order at a time,
in order. Never start the next unprompted.

BEHAVIORAL
- Every nudge serves the user's own stated goals, transparently. No dark patterns.

DATA
- Money stored ONLY as integer minor units (cents). Never Float/Decimal in DB, never fractional.
- Convert minor<->major ONLY in src/lib/money.ts. Never *100 or /100 for money elsewhere.
- Every monetary row has `currency` + `baseAmountMinor`. Sum totals in base currency. Never reprice history with live FX.
- A `transfer` is NEVER income/expense; exclude it from all income/expense/savings/budget/safe-to-spend/forecast math.

SECURITY & PRIVACY
- Every query touching user data is scoped by userId.
- Updates/deletes use updateMany/deleteMany filtered by { id, userId } and check count.
- Validate every input AND every AI/LLM response with Zod before use.
- IP/rate-limit/identity come from server headers or the session, never client input.
- Passwords and reset tokens are hashed at rest.
- Redact PII (phone numbers, account numbers, names where possible) before sending anything to an external AI; use a data-governed tier; tell the user what leaves the app.
- Never log raw financial text, tokens, passwords, or PII.

INFRA
- Runtime DB uses the pooled DATABASE_URL; only migrations use DIRECT_DATABASE_URL.
- Schema changes ship via `prisma migrate deploy`. Never `prisma db push` in a build/deploy.
- Rate-limit every public mutation and AI endpoint via the shared limiter.

ARCHITECTURE / ANTI-DRIFT
- Do not modify files outside the work order's scope.
- Do not rename existing models, exported functions, routes, or env-var names.
- Do not add npm packages unless the work order names them.
- Keep DEFAULT_CATEGORIES a flat array (no enums/metadata/hierarchy).
- All money display goes through src/lib/format.ts.
- Every JSON API responds { data, error, meta }.
- Preserve existing philosophy/intent comments.

NEW INVARIANTS (I-21 to I-27)
- **I-21 — Cross-border / AI consent.** No personal data is sent to a third-party or out of the user's jurisdiction (including any AI provider) without explicit, withdrawable, logged consent and a recorded lawful basis.
- **I-22 — Data-subject rights are real.** Export produces a complete, machine-readable copy of all the user's data; deletion genuinely erases or irreversibly anonymizes within a defined window. Both are exercisable in-app.
- **I-23 — Idempotent mutations.** Every mutating API endpoint accepts an idempotency key and is safe to retry without duplicating data.
- **I-24 — No restricted-permission lock-in.** No core feature may depend on a restricted mobile permission (e.g., READ_SMS) as its only path; a policy-compliant alternative always exists.
- **I-25 — Defined retention.** Every data type has a defined retention period enforced by a deletion job; nothing is kept indefinitely by default.
- **I-26 — No hardcoded user-facing copy.** All user-facing strings route through i18n (enables Swahili and future locales).
- **I-27 — Breach-ready.** A documented incident-response process exists that meets the 72-hour ODPC notification requirement.

If a task seems to require breaking any rule above, STOP and ask the human.
<!-- END:ledger360-constitution -->
