# Ledger360 — The Definitive Build Specification (v2, audit-complete)

*Legal & Data-Protection Foundation: see Part 14. WO-19 is a launch-blocker.*

**This is the single source of truth for building and scaling Ledger360.** It is the result of a full, line-by-line audit of the repository. It contains: the product philosophy, a behavioral-finance engine (the reason people use the app), the accounting structure, the complete list of audit findings, the recommended scaling architecture and tools, an API design standard, the actual code to use, the immutable rules the AI must enforce, and the exact order of work.

It is written to be handed to an AI coding agent (Antigravity). The human's only job is in **Part 0** — paste two things and run one prompt. Everything else, the agent reads here.

> This version supersedes the earlier "Deep-Dive Review," "Master Spec," and "Complete Build Spec" documents.

---

# PART 0 — HOW THE HUMAN USES THIS (start here)

You do four simple things. You do not need to understand the technical parts.

1. **Install the rules.** Open the file `AGENTS.md` in your project's main folder and paste in the block from **Part 10.1** of this document (keep anything already there). Antigravity reads this file every session — it is what keeps the AI on-mission.
2. **Add this document to the project.** Save this file into the project as `docs/BUILD_SPEC.md` (make a `docs` folder if needed).
3. **Turn off "Turbo."** In Antigravity's Agent settings, set the terminal-command policy to **Auto** or **Off** (not **Turbo**), so it pauses for your approval before risky commands like database changes.
4. **Run the kickoff prompt** (also repeated at the very end):

```
Read docs/BUILD_SPEC.md in full, and the Ledger360 Constitution in AGENTS.md.

Do NOT implement the whole document. Implement ONLY the next un-completed Work
Order, in order, starting at WO-1.

First: restate the work order's objective in one sentence and list every file
you will create or change. Then WAIT for my approval before writing any code.

After I approve and you finish: output the files changed, a short diff summary,
any command I must run (e.g. a migration), then run the Self-Audit from Part 5
on your own change, and STOP. Do not begin the next work order.
```

After each work order, when you're happy, reply: `Approved. Proceed to the next work order under the same rules.`
If it ever changes things you didn't ask for, paste the drift-recovery line in **Part 5**.

---

# PART 1 — THE MISSION

Ledger360 is **the personal finance operating system that actually speaks M-Pesa** — built for how money truly moves in Kenya and East Africa, not retrofitted from a Western bank app. It does two things no competitor does well together:

1. It keeps a **rigorous, always-balancing ledger** of a person's entire financial life — M-Pesa, bank, cash, Sacco, loans, Fuliza, NSE holdings — in numbers the user can fully trust.
2. It uses **behavioral finance** to change financial behavior for the better, not just to record it.

Mint, YNAB, and Monarch record. Banking apps report. Ledger360 understands the user's psychology *and* the local money rails, and uses both to help people build wealth. That combination is the moat.

### The Prime Directive (overrides everything)

> The AI agent is an **implementer of this specification, not a redesigner of the product.** It builds exactly what the active work order asks. It does not refactor, rename, restyle, or "improve" anything outside that scope. When a work order is done, it summarizes the change and **stops**. If a task appears to require breaking a rule in Part 4, the agent **stops and asks the human**.

This is the rule that protects the mission across many sessions. Persuasive tangents are exactly how a product loses its way.

---

# PART 2 — THE BEHAVIORAL ENGINE (why people need this app)

A finance app that only records changes nothing — people already know they overspent. Ledger360's reason to exist is that it turns established behavioral-finance research into product behavior. This is the *soul*; the accounting in Part 3 is the *skeleton* that keeps it honest.

**The ethical guardrail (invariant B-0):** every nudge serves the **user's own stated goals**, transparently. No dark patterns, no manufactured anxiety, no engagement-for-engagement's-sake. The behavioral engine is a fiduciary, not a casino — and that restraint is itself a trust advantage.

**B-1 — Mental Accounting (Thaler).** People split money into mental buckets ("rent money," "savings") and spend each differently — which is exactly how Kenyans think about money in M-Pesa vs bank vs cash. → **Accounts and Envelopes are first-class** (WO-7, WO-14).

**B-2 — Loss Aversion (Kahneman & Tversky).** Losing KES 1,000 hurts about twice as much as gaining it feels good. → **Frame around what's protected and at risk**, not just what's spent: "You kept KES 12,400 this month" (WO-16).

**B-3 — Present Bias (Laibson).** People over-value now versus later, which is why saving is hard. → **Safe-to-Spend Today**: one honest number for today that respects future commitments (WO-14).

**B-4 — Pain of Paying & Salience (Prelec & Loewenstein; Soman).** Cash hurts to spend; mobile money is frictionless and therefore invisible — which drives overspending. → **Make invisible M-Pesa spending visible**: daily burn rate, "small leaks" totals (WO-17).

**B-5 — Commitment Devices & Defaults (Thaler & Benartzi "Save More Tomorrow"; Madrian & Shea).** People save far more when saving is automatic, pre-committed, and escalates in the future. → **Save-More-Tomorrow**: automatic, escalating savings (WO-15).

**B-6 — Goal-Gradient & Fresh-Start Effects (Hull; Dai, Milkman & Riis).** Motivation rises near a goal, and people adopt new habits at temporal landmarks (month start, new year). → **Goal momentum + a monthly fresh-start ritual** (WO-16).

**B-7 — Timely, Specific Feedback (Locke & Latham).** Vague advice does nothing; specific, goal-linked feedback changes behavior. → **Insights tied to the user's own goals and history** with concrete figures (WO-16).

**The pitch this adds up to:** Ledger360 mirrors how Kenyans already think about money (buckets), restores the friction mobile money removed (salience), makes the future feel present (safe-to-spend), and makes saving the path of least resistance (commitment + defaults) — all in honest numbers. That is why someone chooses it over a spreadsheet, a bank app, or a Western import.

---

# PART 3 — THE ACCOUNTING STRUCTURE (the honest skeleton)

The behavioral engine only works if the numbers are trustworthy. Four principles guarantee that.

**Principle 1 — Money is exact.** Counted in whole **minor units** (cents), never decimals/floats. This is how banks work; it is the difference between "institutional-grade" as a slogan and as a fact.

**Principle 2 — Every shilling lives in an Account.** Money is always somewhere (M-Pesa, bank, cash). The **Account** is the atom; a transaction moves money into, out of, or between accounts. This turns a list of expenses into a true ledger.

**Principle 3 — The books always balance:**
```
Net Worth = (Σ Account balances) + (Σ non-cash Asset values) − (Σ Liability balances)
Account balance = Opening + Σ income in − Σ expense out + Σ transfers in − Σ transfers out
```
A **transfer** (own money between own accounts, funding a goal, repaying a loan) is **never income and never expense** — it nets to zero. This fixes the most common distortion in finance apps (saving looking like "spending") and makes mental accounting honest.

**Principle 4 — Clarity is a feature.** The display doctrine in `src/lib/format.ts` and the README's "7-law interaction doctrine" are part of the product. Preserve them; do not reinvent them.

---

# PART 4 — THE CONSTITUTION (immutable invariants the agent enforces)

A change that breaks one of these is a defect even if it "works." Keep all true at all times.

**Behavioral**
- **B-0 — Nudges are fiduciary.** Every behavioral feature serves the user's stated goals, transparently. No dark patterns, no manufactured anxiety, no engagement-maximizing tricks.

**Data integrity**
- **I-1 — Money is integer minor units.** Every monetary DB value is `Int` minor units. Never `Float`, never `Decimal` in the DB, never fractional. (Rates/percentages are not money and may be `Float`.)
- **I-2 — One conversion boundary.** Minor↔major conversion happens only in `src/lib/money.ts`. `* 100` / `/ 100` for money appears nowhere else.
- **I-3 — Currency explicit, history fixed.** Every monetary row carries `currency` and a `baseAmountMinor` snapshot. Totals sum in base currency only. Live FX is never applied retroactively to past records.
- **I-4 — Transfers are net-zero.** A `transfer` is excluded from every income/expense total, savings rate, budget, safe-to-spend, and forecast.

**Security & privacy**
- **I-5 — Tenant isolation.** Every query touching user data is scoped by `userId`.
- **I-6 — Atomic ownership mutations.** Updates/deletes use one `updateMany`/`deleteMany` filtered by `{ id, userId }` and check `count`. Never `findFirst`-then-mutate.
- **I-7 — Validate at the boundary.** Every server action, API route, **and every LLM/AI response** is validated with a Zod schema before use.
- **I-8 — Trust only the server for security signals.** IP, rate-limit keys, identity come from server headers or the session — never client-supplied fields.
- **I-9 — Secrets hashed at rest.** Passwords and password-reset tokens are stored hashed.
- **I-10 — Data minimization to third parties.** Before any user financial text/document is sent to an external AI, personally identifying data (phone numbers, account numbers, full names where avoidable) is redacted, and the external service must be on a data-governed tier that does not train on the data. The user is told, in plain language, what leaves the app.
- **I-11 — No sensitive data in logs.** Never log raw financial text, parsed transaction contents, tokens, passwords, or PII.

**Infrastructure**
- **I-12 — Pooled at runtime, direct for migrations.** Runtime queries use the pooled connection (`DATABASE_URL`); only the Prisma CLI/migrations use the direct connection (`DIRECT_DATABASE_URL`).
- **I-13 — Schema changes ship via migrations.** Production applies `prisma migrate deploy`. `prisma db push` is local-development only and never in a build/deploy step.
- **I-14 — Rate-limit every public mutation and AI endpoint** using the shared distributed limiter.

**Architecture & anti-drift**
- **I-15 — Stay in scope.** Do not modify files outside a work order's declared scope; do not rename existing models, exported functions, routes, or env-var names.
- **I-16 — No unrequested dependencies.** Add an npm package only if the active work order names it.
- **I-17 — Categories stay a flat seeded array** (no enums/metadata/hierarchy). (Rule already in the code.)
- **I-18 — Reuse the formatting layer.** All money display goes through `format.ts`.
- **I-19 — Consistent API envelope.** Every JSON API responds `{ data, error, meta }` (Part 8).
- **I-20 — Preserve intent comments.** Keep philosophy/intent header comments; extend only when a task changes that intent.

**NEW INVARIANTS (I-21 to I-27)**
- **I-21 — Cross-border / AI consent.** No personal data is sent to a third-party or out of the user's jurisdiction (including any AI provider) without explicit, withdrawable, logged consent and a recorded lawful basis.
- **I-22 — Data-subject rights are real.** Export produces a complete, machine-readable copy of all the user's data; deletion genuinely erases or irreversibly anonymizes within a defined window. Both are exercisable in-app.
- **I-23 — Idempotent mutations.** Every mutating API endpoint accepts an idempotency key and is safe to retry without duplicating data.
- **I-24 — No restricted-permission lock-in.** No core feature may depend on a restricted mobile permission (e.g., READ_SMS) as its only path; a policy-compliant alternative always exists.
- **I-25 — Defined retention.** Every data type has a defined retention period enforced by a deletion job; nothing is kept indefinitely by default.
- **I-26 — No hardcoded user-facing copy.** All user-facing strings route through i18n (enables Swahili and future locales).
- **I-27 — Breach-ready.** A documented incident-response process exists that meets the 72-hour ODPC notification requirement.

---

# PART 5 — WORKING PROTOCOL

**The loop.** (1) Work one work order at a time, in order, lowest un-completed first. (2) Before coding, restate the objective in one sentence and list every file to be touched; wait for "go." (3) Implement only that work order. (4) Output files changed, a short diff summary, and any command the human must run. (5) Run the Self-Audit. (6) Stop; do not start the next work order.

**Definition of done (every work order):** compiles (`tsc --noEmit`), lints (`eslint`), no invariant in Part 4 violated, no out-of-scope file changed, no unrequested dependency added, acceptance criteria met.

**Self-Audit (agent runs on itself after each task):**
> List each invariant (by I-/B- number) your change touched and state in one line how you preserved it. Confirm no out-of-scope files changed and no unrequested dependencies added. If you violated anything, revert it now. Make no further changes.

**Drift recovery (human pastes if needed):**
> Stop. You are modifying things outside the active work order. Revert any change not required by the current task. Re-read the Constitution in AGENTS.md. We are implementing a fixed specification, not redesigning. Confirm the revert, then wait.

---

# PART 6 — COMPLETE AUDIT FINDINGS

Everything found in the audit, so nothing is lost. Each maps to a work order. Severity: 🔴 critical, 🟠 high, 🟡 medium, 🟢 low.

### Security & privacy
- 🔴 **Login rate-limit is bypassable.** `auth.ts` reads the client-supplied `credentials.ip`; an attacker sends a fake IP per request and the limit never trips. The `signup` route already does this correctly (reads `x-forwarded-for` server-side) — mirror it. → WO-4
- 🔴 **AI data privacy.** `gemini.ts` sends raw M-Pesa SMS (phone numbers, names, balances) and full bank-statement images to Google's **consumer** Gemini API, which by default may use submitted data to improve their products. No redaction, no consent, no data-governed tier. → WO-6
- 🟠 **Plaintext password-reset tokens.** `password.ts` stores `resetToken` raw and queries by it. A leaked DB hands over working tokens. Also 1-hour expiry (too long) and uses Resend's sandbox `onboarding@resend.dev` sender (won't deliver reliably at scale). → WO-4
- 🟠 **No rate limit / size cap on the SMS-parse endpoint.** `sms-parse/route.ts` is auth-gated but uncapped — a user can spam expensive Gemini calls with arbitrarily large input. → WO-5, WO-6
- 🟠 **Sensitive data in logs.** `gemini.ts` logs raw model output (financial data) via `console.error`; other routes log freely. → WO-5
- 🟡 **JWT callback hits the DB on every request** for session-version + currency sync — correct for security but a per-request DB round-trip that will cost at scale. → WO-5 (optimize), revisit in WO-18
- 🟡 **`bcryptjs`** (pure-JS) is slower/weaker than native bcrypt or argon2. → WO-4
- 🟡 **CSP allows `unsafe-inline`/`unsafe-eval`.** Acceptable for Next's inline bootstrap; nonce-based hardening is a future improvement. → not scheduled (noted)

#### Security Hardening for Scale (Reserved)
- **MFA / 2FA**: Expected for a finance app; reserved for future implementation (TOTP at minimum).
- **Encryption at rest**: Confirm Neon/Postgres encrypts at rest; treat financial data as highly sensitive.
- **API token & secret management**: Rotation, scoping, revocation; never long-lived unscoped tokens.
- **Certificate pinning** on mobile to resist MITM.
- **Multi-device session management**: List/revoke sessions across web + mobile (extends the existing session-version mechanism).
- **Rate limiting per user/token** for the API (extends the existing shared limiter to the mobile surface).

### Data integrity (financial correctness)
- 🔴 **Money stored as `Float`.** Every amount/balance/value/limit/target is floating-point — guaranteed rounding drift in a finance app. → WO-3
- 🔴 **No Account/wallet model.** Transactions don't link to a source account, so per-account balances and reconciliation are impossible; net worth is hand-entered. → WO-7
- 🟠 **No transfers.** Moving money to savings is recorded as income/expense, distorting totals. → WO-8
- 🟠 **No multi-currency.** FX and NSE features exist, but transactions/assets/loans have no `currency`; a USD holding can't be modeled. → WO-10
- 🟠 **No import deduplication.** `skipDuplicates` only catches unique-constraint hits and there is no content constraint, so re-importing a statement double-counts. → WO-11
- 🟡 **Goal/loan balances are hand-edited** rather than derived from money movements, so they drift from reality. → WO-9
- 🟡 **`Loan.daysOverdue` stored** but also recomputed — a stored time-dependent value goes stale. → WO-9

### Infrastructure & scaling
- 🔴 **Runtime DB uses the direct (non-pooled) connection.** `prisma.ts` reads `DIRECT_DATABASE_URL` at runtime; on serverless this exhausts database connections under load. Runtime must use the pooled `DATABASE_URL`. → WO-2
- 🔴 **Migration strategy is broken/mismatched.** `package.json` build runs `prisma db push` (can drop data); `vercel.json` build runs neither push nor migrate (so production schema can silently drift from code). Neither uses versioned migrations. → WO-2
- 🔴 **110MB `mingit/` folder committed** (343 files, `.exe` binaries) — bloats the repo, skews language stats, slows clones/deploys; unrelated to the app. → WO-1
- 🟠 **`isomorphic-git` is a dead dependency** — never imported anywhere in `src/`. → WO-1
- 🟠 **`xlsx` (SheetJS 0.18.5)** is used in the upload route despite known prototype-pollution issues and an outdated npm release; `exceljs` is already a dependency and should replace it. → WO-1 (remove direct use later finalized in WO-11)
- 🟠 **In-memory rate limiter** resets on every serverless cold start — ineffective in production. → WO-5
- 🟠 **No error monitoring.** 14 scattered `console.*` calls; no Sentry/observability for production. → WO-5
- 🟡 **No `.env.example`.** Nine required env vars are undocumented, making setup error-prone. → WO-1
- 🟡 **No tests, no CI.** Nothing guards the money math; no lint/type-check gate. → WO-13
- 🟡 **`next-auth` v4 on Next 16 / React 19.** v4 is in maintenance and predates the App Router; plan migration to Auth.js v5. → WO-18

### Correctness & hygiene
- 🟡 **No standard API contract.** Routes return ad-hoc shapes (`{error}`, `{transactions}`, `{stocks}`), making a future mobile client/integrations harder. → WO-12
- 🟢 **Stale comments.** `upload/route.ts` references `OPENAI_API_KEY`/"GPT-4o Vision" but uses Gemini. → WO-1
- 🟢 **README messaging mismatch.** README says "rule-based intelligence engine" while Gemini is used for parsing; align the public description honestly. → WO-6 (copy), not code-critical
- 🟢 **`autoCategory` treats "Savings" as income-type** — conceptually wrong; resolved once savings become transfers. → WO-8

---

# PART 7 — TARGET ARCHITECTURE & SCALING STACK

These are the tools and structures that let the app grow without breaking. Each is introduced by a specific work order — the agent does not adopt them ad hoc.

| Concern | Decision | Why | Introduced |
|---|---|---|---|
| Money representation | Integer minor units + single `money.ts` | Exactness; no float drift | WO-3 |
| Database (runtime) | Pooled connection (`DATABASE_URL`, e.g. Neon pooler / PgBouncer) | Serverless connection safety at scale | WO-2 |
| Database (migrations) | `prisma migrate deploy`, direct URL | Versioned, reversible, no data loss | WO-2 |
| Rate limiting & light caching | **Upstash Redis** + `@upstash/ratelimit` | Works across serverless instances | WO-5 |
| Error monitoring | **Sentry** (`@sentry/nextjs`) | Production visibility; replaces console noise | WO-5 |
| Password hashing | **argon2** (`@node-rs/argon2`) | Modern, recommended; replaces bcryptjs | WO-4 |
| Spreadsheet parsing | **exceljs** (already installed) | Removes vulnerable `xlsx` | WO-11 |
| AI data governance | Redaction + data-governed Gemini tier + configurable model | Privacy & trust (the moat) | WO-6 |
| Validation | **Zod** (already used) extended to all AI output | Never trust LLM shape | WO-6 |
| Testing | **Vitest** + **GitHub Actions** CI | Lock money math; gate every change | WO-13 |
| Public/mobile API | Versioned REST under `/api/v1` with a standard envelope | Future mobile app & integrations | WO-12 |
| Auth | Plan migration **next-auth v4 → Auth.js v5** | App Router/React 19 alignment | WO-18 |

**Folder conventions to keep:** server actions in `src/lib/actions/*` (internal app mutations), route handlers in `src/app/api/*` (HTTP surface), domain logic in `src/lib/*`, external integrations in `src/lib/api/*`, behavioral logic in a new `src/lib/behavioral.ts`. Do not introduce a new architectural paradigm (no tRPC, no GraphQL, no state-management library) unless a work order names it.

---

# PART 8 — API DESIGN STANDARD (the contract all endpoints follow)

To let a mobile app or integrations come later without rework, all HTTP JSON endpoints follow one standard. This is introduced in WO-12 and then applied to new endpoints.

**Versioning.** Public endpoints live under `/api/v1/...`. Existing internal routes (`/api/auth`, `/api/upload`, `/api/sms-parse`, `/api/fx-rates`, `/api/nse`) are left in place; new public resources use `/api/v1`.

**Response envelope (I-19).** Every JSON response is one of:
```jsonc
{ "data": <payload>, "error": null, "meta": { "requestId": "…" } }
{ "data": null, "error": { "code": "VALIDATION_ERROR", "message": "Human-readable." }, "meta": { "requestId": "…" } }
```
Error `code` is a stable machine string (`UNAUTHORIZED`, `VALIDATION_ERROR`, `RATE_LIMITED`, `NOT_FOUND`, `INTERNAL`). `message` is safe to show a user and never leaks internals.

**Every endpoint, in order:** (1) authenticate (session or, later, API token) → 401 `UNAUTHORIZED`; (2) rate-limit via the shared limiter (I-14) → 429 `RATE_LIMITED`; (3) validate input with Zod (I-7) → 400 `VALIDATION_ERROR`; (4) execute scoped by `userId` (I-5); (5) return the envelope.

**Resource catalog (build as the matching work orders land):** `GET/POST /api/v1/accounts`, `GET/POST /api/v1/transactions`, `POST /api/v1/transfers`, `GET/POST /api/v1/budgets`, `GET/POST /api/v1/goals`, `GET/POST /api/v1/loans`, `GET /api/v1/net-worth`, `GET /api/v1/insights`, `GET /api/v1/safe-to-spend`. Each obeys the standard above and reuses the same server-side logic the app's server actions use (no duplicated business logic).

---

# PART 9 — THE DATA MODEL (the destination)

Build toward this, sequenced across the work orders — not all at once.

```prisma
// ── Account: the atom of the ledger; a real "bucket" (B-1) ──
model Account {
  id            String   @id @default(cuid())
  userId        String
  name          String                       // "M-Pesa", "Equity Bank", "Cash", "Sacco"
  type          String                       // mobile_money | bank | cash | credit_card | savings | investment
  currency      String                       // ISO 4217; defaults to user's base
  openingMinor  Int      @default(0)
  archived      Boolean  @default(false)
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions  Transaction[]
  transfersFrom Transfer[] @relation("from")
  transfersTo   Transfer[] @relation("to")
  createdAt     DateTime @default(now())
  @@index([userId])
}

// ── Transaction: income or expense, single-sided. NEVER a transfer. ──
model Transaction {
  id              String   @id @default(cuid())
  userId          String
  accountId       String
  date            DateTime
  type            String                      // income | expense
  amountMinor     Int                         // I-1: integer minor units, positive
  currency        String
  baseAmountMinor Int                         // I-3: value in base currency at entry time
  fxRate          Float    @default(1)         // audit/display only
  name            String
  note            String?
  categoryId      String
  importHash      String?                     // dedup key (WO-11)
  importedAt      DateTime?
  account         Account  @relation(fields: [accountId], references: [id])
  category        Category @relation(fields: [categoryId], references: [id])
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt       DateTime @default(now())
  @@index([userId, date(sort: Desc)])
  @@unique([userId, importHash])
}

// ── Transfer: own-money movement. I-4: never income/expense. ──
model Transfer {
  id              String   @id @default(cuid())
  userId          String
  date            DateTime
  fromAccountId   String
  toAccountId     String
  amountMinor     Int
  currency        String
  baseAmountMinor Int
  fxRate          Float    @default(1)
  note            String?
  goalId          String?                      // set if it funds a goal
  loanId          String?                      // set if it repays a loan
  source          String   @default("manual")  // manual | save_more_tomorrow
  fromAccount     Account  @relation("from", fields: [fromAccountId], references: [id])
  toAccount       Account  @relation("to",   fields: [toAccountId],   references: [id])
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt       DateTime @default(now())
  @@index([userId, date(sort: Desc)])
}

model Category {
  id           String        @id @default(cuid())
  name         String
  type         String        // income | expense | savings
  icon         String?
  userId       String
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  transactions Transaction[]
  budgets      Budget[]
  @@unique([name, userId])
}

model Budget {
  id          String   @id @default(cuid())
  name        String
  period      String   @default("monthly")    // weekly | monthly | yearly
  limitMinor  Int                              // envelope size
  rollover    Boolean  @default(false)         // B-1 (WO-14)
  categoryId  String
  userId      String
  category    Category @relation(fields: [categoryId], references: [id])
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  @@unique([categoryId, period, userId])
}

model Goal {
  id           String    @id @default(cuid())
  name         String
  categoryId   String?                          // FK, replacing free-text category
  targetMinor  Int
  currentMinor Int       @default(0)             // computed from linked transfers (WO-9)
  currency     String
  deadline     DateTime?
  userId       String
  user         User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime  @default(now())
}

model Loan {
  id              String   @id @default(cuid())
  name            String
  lender          String
  type            String                        // Personal | Mortgage | Credit Card | Fuliza | Digital | Informal
  originalMinor   Int
  balanceMinor    Int
  annualRate      Float    @default(0)           // a percentage, NOT money — stays Float
  monthlyPmtMinor Int
  currency        String
  nextDue         DateTime
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt       DateTime @default(now())
  @@index([userId])
  // daysOverdue is COMPUTED at read time, never stored.
}

model Asset {
  id         String   @id @default(cuid())
  name       String
  category   String   // Property | Investment | Vehicle | Other — NON-cash only
  valueMinor Int
  currency   String
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  updatedAt  DateTime @updatedAt
  createdAt  DateTime @default(now())
  @@index([userId])
}

// ── SavingsPlan: Save-More-Tomorrow commitment device (B-5, WO-15) ──
model SavingsPlan {
  id             String   @id @default(cuid())
  userId         String   @unique
  fromAccountId  String
  toAccountId    String
  goalId         String?
  baseRatePct    Int      @default(10)
  escalationPct  Int      @default(1)
  maxRatePct     Int      @default(30)
  currentRatePct Int      @default(10)
  nextEscalation DateTime
  active         Boolean  @default(true)
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt      DateTime @default(now())
}
```

**Modelling rules:** `annualRate`, `fxRate`, `*Pct` are rates/percentages, **not money** — I-1 does not apply. **No double-counting net worth** — cash lives in `Account`, `Asset` is non-cash only. The NextAuth OAuth `Account` model is a **different thing** — do not merge it with the financial `Account`.

---

# PART 10 — THE CODE (drop-in foundations)

Written out so the exact, ambiguity-prone parts are unambiguous.

### 10.1 `AGENTS.md` block (human pastes once — Part 0 step 1)
```markdown
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

If a task seems to require breaking any rule above, STOP and ask the human.
<!-- END:ledger360-constitution -->
```

### 10.2 `src/lib/money.ts` (WO-3)
```typescript
// src/lib/money.ts
// SINGLE SOURCE OF TRUTH for money (Constitution I-1, I-2).
// The database stores every monetary value as an integer number of MINOR UNITS.
// KES 1,500.50 is stored as 150050. This is the ONLY place allowed to scale by
// the minor-unit factor. Never write *100 or /100 for money anywhere else.
// Assumption: supported currencies use 2 minor digits. Revisit only via an
// explicit work order if a 0- or 3-decimal currency is added.

const MINOR_PER_MAJOR = 100;

export function toMinor(major: number): number {
  if (!Number.isFinite(major)) throw new Error('toMinor: amount is not finite');
  return Math.round(major * MINOR_PER_MAJOR); // round kills float artefacts (19.99*100=1998.999)
}
export function fromMinor(minor: number): number {
  if (!Number.isInteger(minor)) throw new Error('fromMinor: minor units must be an integer');
  return minor / MINOR_PER_MAJOR;
}
export function sumMinor(values: number[]): number {
  return values.reduce((a, v) => a + v, 0);
}
export function toBaseMinor(major: number, fxRate: number): number {
  return Math.round(major * fxRate * MINOR_PER_MAJOR);
}
```

### 10.3 Pooled Prisma client (WO-2) — replaces the body of `src/lib/prisma.ts`
```typescript
// Runtime queries MUST use the pooled connection (I-12). Direct connection is
// only for the Prisma CLI / migrations (configured separately in prisma.config.ts).
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL; // POOLED (was DIRECT_DATABASE_URL)
  if (!connectionString) {
    throw new Error('DATABASE_URL (pooled) is not set. Add it to .env.local / Vercel env.');
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 10.4 PII redaction before AI (WO-6) — `src/lib/api/redact.ts`
```typescript
// src/lib/api/redact.ts
// Strip personally identifying data before sending text to an external AI (I-10).
// Kenyan phone formats, account/ID-like number runs, and M-Pesa codes are masked.
export function redactForAI(input: string): string {
  return input
    // Kenyan phone numbers: 07xx/01xx, +2547xx, 2547xx
    .replace(/(?:\+?254|0)[17]\d{8}\b/g, '[PHONE]')
    // Long digit runs (account/ID numbers, 6+ digits) — keep small amounts intact
    .replace(/\b\d{6,}\b/g, '[NUMBER]')
    // M-Pesa confirmation codes (10 alphanumerics, upper) — keep but mark optional
    .replace(/\b[A-Z0-9]{10}\b/g, '[REF]');
}
// NOTE: amounts and dates are intentionally preserved — they are needed for parsing
// and are not identifying on their own once names/phones/accounts are removed.
```

### 10.5 Distributed rate-limit helper (WO-5) — `src/lib/rateLimit.ts` (add, keep existing class as fallback)
```typescript
// Distributed limiter backed by Upstash Redis (I-14). Falls back to the existing
// in-memory limiter only when Redis env vars are absent (local dev).
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = hasRedis ? Redis.fromEnv() : null;

function make(max: number, windowSec: number) {
  if (!redis) return null;
  return new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(max, `${windowSec} s`) });
}
export const limiters = {
  login:  make(10, 15 * 60),
  signup: make(5, 60 * 60),
  upload: make(20, 60 * 60),
  ai:     make(15, 60 * 60), // sms-parse & AI document parsing
};
/** Returns { ok, retryAfter }. key should include a server-derived IP or userId. */
export async function checkLimit(name: keyof typeof limiters, key: string) {
  const rl = limiters[name];
  if (!rl) return { ok: true, retryAfter: 0 }; // dev fallback
  const r = await rl.limit(key);
  return { ok: r.success, retryAfter: r.success ? 0 : Math.ceil((r.reset - Date.now()) / 1000) };
}
```

### 10.6 API envelope helper (WO-12) — `src/lib/api/respond.ts`
```typescript
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
type ErrCode = 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'RATE_LIMITED' | 'NOT_FOUND' | 'INTERNAL';
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data, error: null, meta: { requestId: randomUUID() } }, { status });
}
export function fail(code: ErrCode, message: string, status: number) {
  return NextResponse.json(
    { data: null, error: { code, message }, meta: { requestId: randomUUID() } },
    { status }
  );
}
```

### 10.7 Account balance helper (WO-7) — in `src/lib/actions/accounts.ts`
```typescript
// Balances are DERIVED, never stored (Principle 3, I-4).
export async function getAccountBalances(userId: string) {
  const accounts = await prisma.account.findMany({ where: { userId } });
  return Promise.all(accounts.map(async (acc) => {
    const [inc, exp, tin, tout] = await Promise.all([
      prisma.transaction.aggregate({ _sum: { baseAmountMinor: true }, where: { userId, accountId: acc.id, type: 'income' } }),
      prisma.transaction.aggregate({ _sum: { baseAmountMinor: true }, where: { userId, accountId: acc.id, type: 'expense' } }),
      prisma.transfer.aggregate({ _sum: { baseAmountMinor: true }, where: { userId, toAccountId: acc.id } }),
      prisma.transfer.aggregate({ _sum: { baseAmountMinor: true }, where: { userId, fromAccountId: acc.id } }),
    ]);
    const balanceMinor = acc.openingMinor
      + (inc._sum.baseAmountMinor ?? 0) - (exp._sum.baseAmountMinor ?? 0)
      + (tin._sum.baseAmountMinor ?? 0) - (tout._sum.baseAmountMinor ?? 0);
    return { ...acc, balanceMinor };
  }));
}
```

### 10.8 Safe-to-Spend contract (WO-14) — in `src/lib/behavioral.ts`
```typescript
// Present-bias relief (B-3) via envelope budgeting (B-1). All amounts base-currency MINOR.
// Transfers excluded by construction (I-4).
//   discretionary = expectedIncome − Σ expense-budget limits − plannedSavings − loanDue
//   remaining     = discretionary − unbudgetedSpendThisPeriod
//   perDay        = max(0, remaining) / daysLeftInPeriod
// Returns { discretionaryMinor, remainingMinor, perDayMinor, daysLeft }.
export async function safeToSpend(userId: string, period?: 'weekly' | 'monthly' | 'yearly'):
  Promise<{ discretionaryMinor: number; remainingMinor: number; perDayMinor: number; daysLeft: number }> {
  // WO-14 fills the body to this exact contract.
  throw new Error('implement in WO-14');
}
```

### 10.9 `.env.example` (WO-1) — documents required configuration
```bash
# Database (Postgres / Neon)
DATABASE_URL=            # POOLED connection — used at runtime
DIRECT_DATABASE_URL=     # DIRECT connection — used only by Prisma CLI / migrations
# Auth
NEXTAUTH_SECRET=         # generate: openssl rand -base64 32
NEXTAUTH_URL=            # e.g. http://localhost:3000 (prod: your domain)
NEXT_PUBLIC_APP_URL=     # public base URL for emails/links
# Email (Resend)
RESEND_API_KEY=
# AI (Google Gemini — use a data-governed/paid tier; see WO-6)
GOOGLE_GENERATIVE_AI_API_KEY=
GEMINI_MODEL=            # configurable model id (see WO-6); do not hardcode in source
# Rate limiting / cache (Upstash Redis) — added in WO-5
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
# Error monitoring (Sentry) — added in WO-5
SENTRY_DSN=
```

---

# PART 11 — THE WORK ORDERS

One at a time, in order. "Do NOT" lists name the most likely drift for that task.

## Phase 0 — Stabilize & secure the foundation

### WO-19 — Compliance Foundation
**Objective:** Establish the legal and data-protection baseline required by the Kenya DPA before handling real users.
**Scope:** ODPC registration (founder action); Privacy Policy + ToS documents; cross-border safeguards mapping; defining a retention policy.
**Spec:** (1) Register as a Data Controller with the ODPC (this is mandatory for financial/high-risk data). (2) Draft a DPA-compliant Privacy Policy and ToS stating the lawful basis for processing, the AI/cross-border data transfer, retention windows, and data-subject rights. (3) Identify the lawful basis (consent + contract) for each processing activity. (4) Outline an Incident Response Runbook (Breach-ready, I-27) to meet the 72-hour notification rule. 
**Acceptance:** ODPC certificate acquired; Privacy Policy + ToS published and linked in-app; runbook drafted.
**Note:** This is a **LAUNCH-BLOCKER** (must be completed before any real-user launch). It is *not* a blocker for the next immediate code work order (WO-12).
**Commit:** `WO-19: Compliance foundation`

### WO-1 — Repo hygiene & configuration
**Objective:** Remove cruft and document configuration.
**Scope:** `.gitignore`; `package.json` (deps); new `.env.example`; stale comments in `src/app/api/upload/route.ts`.
**Spec:** (1) Add `mingit/` to `.gitignore`; `git rm -r --cached mingit/`; in the summary give the human the exact `git filter-repo --path mingit --invert-paths` command to purge history but do **not** run history rewrites yourself. (2) Remove the unused `isomorphic-git` dependency. (3) Add `.env.example` exactly as Part 10.9. (4) Fix the stale OpenAI/GPT-4o comment in the upload route to reflect Gemini. Do **not** touch `xlsx` yet (WO-11 handles the swap).
**Acceptance:** `git ls-files mingit/` empty; `isomorphic-git` gone from `package.json`; `.env.example` present; no OpenAI references remain in comments.
**Do NOT:** remove `xlsx` here; change app logic; rewrite git history yourself.
**Commit:** `WO-1: repo hygiene + .env.example`

### WO-2 — Database connection & migrations *(Confirm-first)*
**Objective:** Pooled runtime connection (I-12) and versioned migrations (I-13).
**Scope:** `src/lib/prisma.ts`; `package.json` scripts; `vercel.json`; ensure `prisma/migrations/` exists.
**Spec:** (1) Replace `prisma.ts` body with Part 10.3 (runtime uses pooled `DATABASE_URL`). (2) Build scripts: `"build": "prisma generate && next build"`; add `"migrate:deploy": "prisma migrate deploy"` and a dev-only `"db:push": "prisma db push"`; remove `db push` from any build/deploy. (3) `vercel.json` build runs `prisma generate && next build`; document that `prisma migrate deploy` runs as a deploy step (the human runs it or sets it as a Vercel deploy hook). (4) Generate an initial migration from the current schema if none exists.
**Acceptance:** runtime client reads `DATABASE_URL`; no build step runs `db push`; a baseline migration exists.
**Do NOT:** point runtime at the direct URL; run destructive resets on existing data.
**Commit:** `WO-2: pooled runtime DB + migrate deploy`

### WO-3 — Money as integer minor units *(Confirm-first)*
**Objective:** Replace every `Float` money field with `Int` minor units; all conversion via `money.ts`.
**Scope:** `prisma/schema.prisma`; new `src/lib/money.ts`; all `src/lib/actions/*`; `src/lib/intelligence.ts`; `src/app/api/upload/route.ts`; `src/app/api/sms-parse/route.ts`; `src/lib/api/gemini.ts`; `src/lib/validation.ts`; any client component submitting/displaying an amount.
**Spec:** (1) Create `money.ts` per Part 10.2. (2) Rename money fields to the `*Minor Int` names in Part 9 (`amount`→`amountMinor`, `limitAmt`→`limitMinor`, `value`→`valueMinor`, `balance`→`balanceMinor`, `originalAmt`→`originalMinor`, `monthlyPmt`→`monthlyPmtMinor`, `targetAmount`→`targetMinor`, `currentAmount`→`currentMinor`). `annualRate` stays `Float`. (3) Writes store `toMinor(validatedMajor)`; reads use `fromMinor(...)` immediately before `format.ts`. (4) Zod input stays major-unit; convert after validation. (5) Provide a migration (×100, round) for existing rows, or a clean migrate if no production data — state which.
**Acceptance:** `grep -n Float prisma/schema.prisma` shows only `annualRate`/`fxRate`; `grep -rEn "[*/] ?100" src/` matches only inside `money.ts`; KES 19.99 round-trips exactly.
**Do NOT:** use `Decimal`; change UI layout; alter `format.ts` signatures; touch security/AI logic here.
**Commit:** `WO-3: money as integer minor units`

### WO-4 — Auth & secret hardening
**Objective:** Close the login-IP and reset-token loopholes; modern hashing.
**Scope:** `src/lib/auth.ts`; the login form sending `credentials.ip`; `src/lib/actions/password.ts`; `package.json` (adds `@node-rs/argon2`).
**Spec:** (1) In `auth.ts`, derive the IP server-side from request headers (mirror `signup/route.ts`); remove the `ip` credential and stop reading/sending it. (2) In `password.ts`: hash the reset token (SHA-256) before storing; on use, hash the incoming token and query by the hash; shorten expiry to 30 minutes; clear the token after success (single-use). Note in the summary that the production sender should be a verified Resend domain, not `onboarding@resend.dev`. (3) Replace `bcryptjs` with `@node-rs/argon2` for hashing and verification in `auth.ts`, `signup/route.ts`, and `password.ts`; keep verifying existing bcrypt hashes if any users exist (detect by hash prefix) so current users can still log in.
**Acceptance:** `grep -rn credentials.ip src/` empty; stored reset tokens are hashes; argon2 used for new hashes; existing users still authenticate.
**Do NOT:** change session strategy or JWT lifetime; weaken the constant-time signup; touch rate-limiter internals here.
**Commit:** `WO-4: server-side IP, hashed reset tokens, argon2`

### WO-5 — Distributed rate limiting, monitoring & safe logging
**Objective:** Make rate limiting work in production; add observability; stop logging PII.
**Scope:** `src/lib/rateLimit.ts`; `src/app/api/sms-parse/route.ts`; `src/app/api/upload/route.ts`; `src/lib/api/gemini.ts`; new Sentry config; `package.json` (adds `@upstash/ratelimit`, `@upstash/redis`, `@sentry/nextjs`).
**Spec:** (1) Add the Upstash-backed limiter from Part 10.5; keep the in-memory class as the dev fallback. (2) Apply `checkLimit('ai', \`ai:${userId}\`)` to `sms-parse` and the AI path of `upload`; cap SMS input length (e.g. 8,000 chars) → 400. (3) Add `@sentry/nextjs` with `SENTRY_DSN`; capture server errors. (4) Audit all `console.*` calls: remove or redact any that log financial text, model output, tokens, or PII (I-11) — in `gemini.ts`, stop logging raw response text.
**Acceptance:** AI endpoints are rate-limited with server-derived keys; oversized SMS rejected; no `console.*` logs raw financial text/PII; Sentry captures a test error.
**Do NOT:** rip out the existing limiter class (keep as fallback); add caching logic beyond rate limiting.
**Commit:** `WO-5: Upstash rate limiting, Sentry, safe logging`

## Phase 1 — AI privacy & trust

### WO-6 — AI data governance
**Objective:** Stop leaking PII to the AI; make the model safe, current, and validated.
**Scope:** `src/lib/api/gemini.ts`; new `src/lib/api/redact.ts`; `src/app/api/sms-parse/route.ts`; `src/app/api/upload/route.ts`; a short consent/notice in the relevant UI (`SmartUpload.tsx`, `MpesaSmsInput.tsx`); README AI description.
**Spec:** (1) Add `redact.ts` (Part 10.4); apply `redactForAI()` to SMS text before sending to Gemini. (2) **Consent-gate ALL AI submissions.** For document/image parsing, explicitly require withdrawable user consent. Show a documented frontend notice stating that PDFs/images are sent in full and cannot be redacted. (3) Make the model configurable via `GEMINI_MODEL` (no hardcoded model string); you must use a **data-governed Gemini tier with a strict no-training guarantee** (verify the current tier/model name in Google's official docs at deploy time). (4) Validate every AI response with a Zod schema (I-7) — reject/skip malformed items instead of trusting `JSON.parse`. (5) Update the README so the AI description is accurate and transparent about what is sent externally.
**Acceptance:** ALL AI endpoints require recorded consent; SMS sent to Gemini contains no phone numbers/long account numbers; model id comes from env; AI output passes Zod before use; UI explicitly discloses full-document external processing; README is accurate.
**Note:** The consent and recorded lawful basis for cross-border transfer to Gemini must be live before any real users, since this AI transfer is already happening today.
**Do NOT:** remove the M-Pesa-aware prompts (they are the moat); send full names/phones unredacted; hardcode a model string.
**Commit:** `WO-6: AI data governance + validation`

## Phase 2 — The ledger

### WO-7 — Account model + computed balances *(B-1 foundation; Confirm-first)*
**Scope:** `prisma/schema.prisma`; new `src/lib/actions/accounts.ts`; `src/lib/actions/transactions.ts`; `src/lib/validation.ts`; signup seeding; transactions + dashboard UI; migration.
**Spec:** (1) Add `Account` (Part 9). Seed `M-Pesa` and `Cash` on signup beside category seeding. (2) Add required `accountId` to `Transaction`; migrate existing rows to a per-user default "M-Pesa" account. (3) Account CRUD following existing action patterns (requireAuth, Zod, atomic ownership, audit). (4) Implement `getAccountBalances` (Part 10.7) — computed, never stored. (5) Transaction UI gains an account selector defaulting to the first account.
**Acceptance:** every transaction has an `accountId`; deleting an account with transactions is blocked with a clear message; balances match the Part 3 formula.
**Do NOT:** merge with the NextAuth OAuth `Account`; store running balances.
**Commit:** `WO-7: Account model + computed balances`

### WO-8 — Transfers (net-zero)
**Scope:** `prisma/schema.prisma`; new `src/lib/actions/transfers.ts`; verify `transactions.ts` summaries ignore transfers; `src/lib/intelligence.ts`; transfer UI; the `autoCategory` "Savings" rule in the upload route.
**Spec:** (1) Add `Transfer` (Part 9). (2) Transfers affect balances but are excluded from income, expense, savings rate, breakdowns, budgets, safe-to-spend, forecast. (3) Fix the upload `autoCategory` so savings is treated as a transfer concept, not income. (4) UI: a "Transfer" action with two account pickers.
**Acceptance:** a transfer changes two balances and leaves period income/expense unchanged.
**Do NOT:** model a transfer as two opposing `Transaction` rows.
**Commit:** `WO-8: net-zero transfers`

### WO-9 — Goals & loans funded by transfers
**Scope:** `src/lib/actions/goals.ts`, `loans.ts`, `transfers.ts`; related UI.
**Spec:** (1) A transfer may carry `goalId`/`loanId`. (2) `Goal.currentMinor` computed from linked transfers; UI stops writing it. (3) Loan-repayment transfer reduces `Loan.balanceMinor` (clamped ≥0). (4) `daysOverdue` stays computed; remove any stored column.
**Acceptance:** funding a goal raises progress; repayment lowers loan balance; income/expense unchanged.
**Do NOT:** reintroduce a manually editable balance that can diverge from history.
**Commit:** `WO-9: goals & loans via transfers`

### WO-10 — Per-record currency + base snapshot
**Scope:** `prisma/schema.prisma` (fields in Part 9); all create paths; `src/lib/api/frankfurter.ts`; aggregation queries; net-worth action.
**Spec:** (1) On each monetary create, store `currency`, the `fxRate` to base at that moment, and `baseAmountMinor = toBaseMinor(major, fxRate)`. (2) Totals sum `baseAmountMinor`. (3) Never reprice history; live FX only estimates current value of held foreign balances/assets, clearly labelled.
**Acceptance:** a USD transaction for a KES-base user stores both amounts; changing today's FX does not change last month's totals.
**Do NOT:** apply live FX to historical totals; sum mixed currencies unconverted.
**Commit:** `WO-10: per-record currency + base snapshot`

## Phase 3 — Robustness

### WO-11 — Import dedup, preview & exceljs swap
**Scope:** `src/app/api/upload/route.ts`; `transactions.ts` (`importTransactions`); schema (`importHash` unique, Part 9); `SmartUpload.tsx`; `package.json` (remove `xlsx`).
**Spec:** (1) Replace the `xlsx` Excel parser with `exceljs` (already installed); remove `xlsx` from dependencies and `serverExternalPackages`. (2) Compute `importHash = sha256(userId + date + amountMinor + normalisedName)`; rely on `@@unique([userId, importHash])` to skip re-imports. (3) Upload returns a **preview** (new vs duplicate); DB write only after user confirmation. (4) Keep per-row Zod validation and the 10MB/500-row caps.
**Acceptance:** importing the same file twice creates no new rows the second time; preview shows duplicate count; `xlsx` gone.
**Do NOT:** rely on `skipDuplicates` without setting `importHash`.
**Commit:** `WO-11: import dedup + preview + exceljs`

### WO-12 — Versioned API layer
**Scope:** new `src/lib/api/respond.ts`; new `/api/v1/*` route handlers reusing existing action logic.
**Spec:** (1) Add the envelope helper (Part 10.6). (2) Build `/api/v1` resources per Part 8, each doing auth → rate-limit → Zod → userId-scoped logic → envelope, reusing the same functions the server actions use (no duplicated business logic). (3) Leave existing internal routes untouched.
**Acceptance:** new endpoints return `{ data, error, meta }`; enforce auth, rate limit, and validation; reuse shared logic.
**Do NOT:** duplicate business logic; change existing route shapes; add GraphQL/tRPC.
**Commit:** `WO-12: /api/v1 with standard envelope`

### WO-13 — Tests & CI
**Scope:** add `vitest`; `*.test.ts` files; new `.github/workflows/ci.yml`.
**Spec:** unit tests for `money.ts`; account-balance formula; transfer net-zero rule; savings/forecast math; CSV & M-Pesa SMS parser shape; base-currency conversion; safe-to-spend; PII redaction. CI runs `npm ci`, `prisma generate`, `eslint`, `tsc --noEmit`, `vitest run` on push/PR.
**Acceptance:** `npm test` green in CI; tests fail if Float money returns or a transfer is counted as expense.
**Do NOT:** add E2E/browser frameworks; chase coverage % over money logic.
**Commit:** `WO-13: tests + CI`

## Phase 4 — The behavioral engine (the reason to use the app)

### WO-14 — Safe-to-Spend + envelope budgeting *(B-1, B-3)*
**Scope:** new `src/lib/behavioral.ts`; `src/lib/actions/budgets.ts`; budgets + dashboard UI; schema (`Budget.rollover`).
**Spec:** (1) Implement `safeToSpend` to the exact contract in Part 10.8 (exclude transfers). (2) Budgets behave as envelopes; `rollover` carries unspent into the next period. (3) Dashboard shows "Safe to spend today" prominently and each envelope's remaining amount.
**Acceptance:** the figure equals income − envelopes − planned savings − loans due − unbudgeted spend, divided across days left; rollover increases next period's available amount.
**Do NOT:** count transfers/savings as spendable; redesign the budget model beyond `rollover`.
**Commit:** `WO-14: Safe-to-Spend + envelopes`

### WO-15 — Save-More-Tomorrow automation *(B-5)*
**Scope:** schema (`SavingsPlan`); new `src/lib/actions/savings.ts`; a trigger on income entry; settings UI.
**Spec:** (1) Add `SavingsPlan`. (2) User sets base rate, monthly escalation, cap; defaults from `UserPreferences.savingRate`. (3) On income (or a monthly tick), create a `Transfer` with `source = "save_more_tomorrow"` for `round(income × currentRatePct/100)`; bump `currentRatePct` by `escalationPct` (capped) at `nextEscalation`. (4) Every auto-save is transparent and reversible (B-0).
**Acceptance:** recording a salary generates a savings transfer at the current rate; the rate escalates monthly to the cap; the user can pause/undo.
**Do NOT:** move money invisibly/irreversibly; create real bank/M-Pesa payments (this is in-app modelling, not a payment integration).
**Commit:** `WO-15: Save-More-Tomorrow`

### WO-16 — Loss-framed, goal-linked, fresh-start feedback *(B-2, B-6, B-7)*
**Scope:** `src/lib/intelligence.ts`; `src/components/dashboard/InsightsFeed.tsx`.
**Spec:** (1) "Money kept this month" insight (B-2). (2) Frame anomalies as opportunity cost tied to the user's own goals (B-7). (3) Monthly "fresh start" insight at rollover inviting one improvement (B-6). (4) Keep goal-gradient milestone nudges (50/75/90%). All honest (B-0).
**Acceptance:** insights cite real goals/norms with specific figures; a fresh-start insight appears at month start.
**Do NOT:** add manipulative urgency; exceed the existing insight cap without reason.
**Commit:** `WO-16: behavioral feedback engine`

### WO-17 — Pain-of-paying salience layer *(B-4)*
**Scope:** `src/lib/intelligence.ts` or `behavioral.ts`; dashboard/transactions UI.
**Spec:** (1) Daily mobile-money burn rate. (2) "Small leaks": many small same-merchant/category charges aggregated into one visible total. (3) A tangible running daily-spend total. Honest, non-judgmental (B-0).
**Acceptance:** frequent small charges aggregate into one highlighted total; daily burn rate shown.
**Do NOT:** shame the user; surface facts, not judgments.
**Commit:** `WO-17: salience layer`

## Phase 5 — Platform maturity (later, optional)

### WO-18 — Migrate next-auth v4 → Auth.js v5 *(Confirm-first; large)*
**Scope:** `src/lib/auth.ts`; `middleware.ts`; `src/app/api/auth/[...nextauth]/route.ts`; session usages.
**Spec:** migrate to Auth.js v5 patterns for App Router/React 19; preserve the credentials provider, 7-day JWT, session-version invalidation, and currency sync. Optimize the per-request DB lookup (e.g. check `sessionVersion` on an interval or via a lightweight cache) while keeping password-reset invalidation working.
**Acceptance:** login/logout/reset all work; sessions invalidate on password reset; no per-request full-user fetch on the hot path.
**Do NOT:** attempt this before Phases 0–4 are stable; change the user-facing auth flow.
**Commit:** `WO-18: Auth.js v5 migration`

---

# PART 12 — POSITIONING (so the product stays on-mission)

When a work order touches user-facing copy, defaults, or onboarding, align with this — don't invent a new direction.

- **Identity:** *"The personal finance OS that actually speaks M-Pesa."* Built for how money moves in Kenya, not retrofitted from a US bank app.
- **Magic moment:** upload/forward an M-Pesa statement → see your whole financial life in under a minute. Onboarding drives toward this, not manual entry.
- **Native concepts are features, not edge cases:** M-Pesa, paybill/till, Fuliza, agent withdrawals, NSE, NHIF, chamas, informal loans. This is the moat.
- **Trust is the wedge:** the exactness, security, and AI-privacy work *is* the marketing. Pair it with an honest, in-product statement of what data leaves the app.
- **Earn the claim:** "institutional-grade" becomes true once WO-3 ships. Use the phrase after, not before.

---

# PART 13 — KICKOFF PROMPT (repeat of Part 0, step 4)

```
Read docs/BUILD_SPEC.md in full, and the Ledger360 Constitution in AGENTS.md.

Do NOT implement the whole document. Implement ONLY the next un-completed Work
Order, in order, starting at WO-1.

First: restate the work order's objective in one sentence and list every file
you will create or change. Then WAIT for my approval before writing any code.

After I approve and you finish: output the files changed, a short diff summary,
any command I must run (e.g. a migration), then run the Self-Audit from Part 5
on your own change, and STOP. Do not begin the next work order.
```

*Build the foundation first (Phases 0–3) so the numbers are true, then the behavioral engine (Phase 4) so the numbers change lives. Keep to the order, keep to the Constitution, and the mission holds across every session.*

---

# PART 14 — LEGAL & DATA-PROTECTION FOUNDATION
Ledger360 processes personal financial data in Kenya, triggering Data Controller obligations under the Data Protection Act (DPA), 2019. 
- **ODPC Registration**: Mandatory regardless of size exemptions, due to processing high-risk financial data. (Founder task; referenced in Privacy Policy).
- **Lawful Basis & Consent**: Every processing purpose (especially financial processing and AI transmission) requires explicit, granular, withdrawable, and auditable consent.
- **Cross-Border Transfers**: Using Gemini transfers data outside Kenya. This requires recorded safeguards, an explicit lawful basis (consent + governed agreement), and ODPC declaration.
- **DPIA (Data Protection Impact Assessment)**: Required before launching the behavioral/profiling engine (WO-14–17).
- **Data-Subject Rights**: In-app tools for complete, machine-readable export and genuine erasure (irreversible anonymization/hard deletion) within a defined window.
- **Breach Notification**: Must meet the 72-hour ODPC notification rule.
- **Retention Policy**: Data must not be kept indefinitely. Define and enforce deletion rules.
- **Privacy Policy + ToS**: Must plainly state the AI data handling, data rights, and controller details.

---

# PART 15 — MOBILE-READINESS ARCHITECTURE
These decisions shape WO-12 and prevent costly retrofitting for native mobile apps.
- **Mobile SMS-Capture Reality**: Native `READ_SMS` is largely blocked by Google Play policy (budgeting apps are routinely denied). Do not rely on background SMS capture. The compliant ingestion spine is **Share-to-App, SMS Paste, and Statement Uploads**.
- **Token-Based Auth**: The API must support bearer access tokens and refresh tokens. Cookie sessions alone are insufficient for mobile. As a prerequisite (e.g., in WO-18), all wrapped server actions must be refactored to accept an explicit `userId` (following the `getLoansForUser` pattern) rather than relying internally on `requireAuth()`, which is session-only.
- **Idempotency**: All mutating endpoints must accept an idempotency key to prevent double-posting on intermittent networks.
- **Offline & Sync Strategy (Reserved)**: Future mobile versions may require offline capability. The API data model must plan for `updatedAt` on all records, soft-delete semantics (`deletedAt`/`archived`), client-generatable IDs, and a conflict resolution strategy (e.g., last-write-wins). Do not implement `deletedAt` cascades yet, but reserve the design.
- **Push Notifications (FCM)**: Behavioral engine nudges will require FCM and a notification-preferences model.
- **Data Budgets**: Target low-end Android and metered connections via small payloads, pagination, and caching.

---

# PART 16 — OPERATIONAL & RELIABILITY
- **Backups & PITR**: Define backup cadence and Point-In-Time-Recovery (RPO/RTO) targets with Neon.
- **Incident Response Runbook**: Concrete steps + owners for a breach (tied to ODPC notification).
- **Retention & Deletion Jobs**: Scheduled cron/workers to enforce the retention policy.
- **AI Cost Controls**: Per-user and global spend caps/alerts on Gemini usage to prevent runaway costs from import loops.
- **Observability**: Beyond Sentry, ensure uptime and latency monitoring.
- **CI/CD Gate**: WO-13 tests, linting, and type-checks are required blockers for merges protecting money math.

---

# PART 17 — PRODUCT & REACH
- **Localization (i18n)**: English + Swahili from the start.
- **Accessibility (a11y)**: Baseline contrast, labels, and screen-reader support.
- **Recurring Transactions**: Anticipate rent/salary/subscriptions in the data model.
- **Categorization Ownership**: Long-term strategy to own the transaction categorization model in-house rather than renting extraction AI indefinitely.
