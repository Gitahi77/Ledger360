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
- **Financial Rule 1:** Feature components must not format monetary values directly. All monetary rendering must go through `src/components/finance`.
- **Financial Rule 2:** No component outside `src/lib/finance` should call `Intl.NumberFormat`.
- **Financial Rule 3:** Feature components must not manually concatenate "$", "%", "+", or "-".
- **Financial Rule 4:** Feature components must not determine semantic financial colors. They should pass tones (e.g. `positive`, `negative`) to the finance layer.
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

<!-- BEGIN:repository-governance -->
# Ledger360 Engineering Constitution Amendment
## Repository Governance & Roadmap Enforcement (Permanent)
This directive becomes part of the permanent engineering workflow. From this point forward, **every implementation must begin and end with a Repository Governance Pass.** No feature work may begin until Repository Health is acceptable.

## Objective
Ledger360 is transitioning from rapid feature development into production engineering. The repository must remain clean, minimal, scalable, understandable, and roadmap-driven. The repository itself is now considered a production asset. Every file must justify its existence.

## PART A — Repository Health Gate
Before ANY new Stage begins:
1. Run knip
2. Run depcheck
3. Run madge
4. Run eslint
5. Run tsc
6. Run unit tests
7. Run build

Produce: Repository Health Score, Technical Debt Budget, Cleanup Plan, and Delta vs previous stage. If technical debt increases without justification, new feature work pauses until resolved.

## PART B — AI Context Hygiene & Root Directory
Temporary planning artifacts, transcripts, implementation notes, generated scripts, scratch files, and debugging outputs must remain inside designated agent working directories (e.g., `.gemini/`, `.antigravity/`, `scratch/`) and must never accumulate in the project root. Only permanent project artifacts belong in version control.

## PART C — Evidence-Backed Code Audit
- **Dead Code:** 0 *unexplained* dead exports. Classify each item:
  - **Dead** – no references, no roadmap owner, remove.
  - **Dormant** – belongs to a future approved roadmap stage, move to an appropriate feature branch or archive if necessary.
  - **Framework/Public API** – retain with documented justification.
  Do not remove code solely because a static analysis tool reports it as unused. Provide the list and explanation before removal.
- **Dependencies:** Verify each dependency through runtime imports, build config, CI config, deployment config, and docs. Only uninstall after proving it has no current or planned role in the approved roadmap.
- **Temporary Scripts:** Classify as reusable engineering tool (move to `/tools`), one-time migration (archive), or obsolete (delete).

## PART D — Repository Ownership
Every repository artifact must belong to exactly one owner.
Examples: `/src` (Production code), `/tests` (Verification), `/docs` (Documentation), `/tools` (Reusable utilities), `/scripts` (Operational scripts), `/.gemini` (AI workspace), `/public` (Static assets), `/prisma` (Database).
Unknown owner = FAIL. If a file has no owner or purpose, it must be archived or deleted.

## PART E — Architectural Conformance
Follow the existing architecture. New code must conform to the established domain structure rather than introducing a competing organizational pattern.
- Server Actions may NOT query Prisma directly.
- UI may NOT perform financial calculations.

## PART F — Roadmap Discipline & Stage Locking
The roadmap is authoritative. The agent SHALL NOT implement future stages, create placeholder services, scaffold future APIs/schemas/folders, implement "while we're here" improvements, or build features outside the active work order.
**Stage Locking Rule:** Only work allowed in the Current Active Stage may be executed. Stage changes require an approved Stage Exit Report.

## PART G — Cleanup Constraint
Repository cleanup shall NOT redesign architecture, rename modules unnecessarily, change public APIs, change financial logic, or change business behaviour. Cleanup is restricted to hygiene, documentation, dead code, dependencies, repository organization, and architecture compliance.

## PART H — Technical Debt & Repository Growth Budget
Maintain a permanent Repository Budget tracking: TS files, Components, Hooks, Repositories, Services, Dependencies, Assets, Documentation, Temporary Files. Every stage must report Deltas. The repository should never grow simply because scaffolding was generated.

## PART I — Stage Transition Rule & Stage Gates
Before transitioning from one stage to the next, produce a **Stage Exit Report** evaluating the repository against three gate levels. The Stage Gate depends entirely on objective engineering evidence.

**Stage Gate = GREEN when ALL are true:**
- lint passes
- types pass
- tests pass
- production build passes
- financial correctness preserved
- no architecture regressions
- no critical security findings
- repository hygiene delta is acceptable

*Note: Repository Health Score is Informational only.*

### 🟢 Green — Proceed
- All objective criteria met.
- Stage may begin.

### 🟡 Yellow — Proceed with conditional cleanup
- Hygiene issues (temporary scripts, unused exports, dormant roadmap types, unused dependencies, root clutter).
- *Do not block feature development.* Technical Debt Budget increases and next cleanup milestone becomes mandatory.
- **Dormant Code Rule:** Do NOT blindly delete dormant roadmap artifacts (e.g. schemas for future approved stages). Archive, document, or tag them instead.

### 🔴 Red — Block Stage
- Failing build, failing tests, failing financial invariants.
- Circular dependencies, broken architecture, security/data risk.
- *Stage is strictly blocked until resolved.*

## PART J — Stage Baseline Freeze
Every completed stage freezes its baseline metrics. Future stages may exceed these values ONLY if new functionality justifies the increase, the increase is documented in the Stage Exit Report, and the Technical Debt Budget remains non-positive.

**Stage 3.5 Baseline (Frozen)**
- TS Files: 413
- Dependencies: 36
- Components: 84
- Repositories: 17
- Services: 21
- First Load JS: 102 kB
- Build Time: 42s

## PART K — Pre-Implementation Report
Before beginning execution of any work order, the agent must confirm the repository is in the expected state by producing a brief automated report:
- Current Stage and Phase
- Git status (clean/dirty)
- Technical Debt Delta since last stage
- Health checks (lint, build, tests, tsc)
- Approved work order reference
- Roadmap violation check (PASS/FAIL)

No code may be written until this report shows all checks passing.

## PART L — Dormant Code Registry
Every item classified as "Dormant" (rather than "Dead") must have:
- An owning roadmap stage
- A brief justification for preservation
- A review date (re-evaluate at the start of its owning stage)

If a dormant item's owning stage is removed from the roadmap, it becomes Dead and must be removed.
<!-- END:repository-governance -->
