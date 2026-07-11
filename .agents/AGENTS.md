# Ledger360 Agent Rules

The following rules apply to all AI agents and subagents working in this workspace.

## Permanent Principle: Deployable State
> **Every phase should leave Ledger360 in a deployable state.**
> Each work order should be small enough that, if it passes all verification gates, you could confidently deploy it independently. This keeps changes easy to review, reduces risk, and makes it much simpler to isolate regressions if one ever slips through.

## Strict Verification Workflow

**CRITICAL RULE:** Before confirming to the user that a fix, feature, or refactor has been implemented, you MUST automatically run a strict and thorough audit of the changes you have made. 

You must follow these steps before ending your turn or declaring success:
1. **Self-Review:** Manually review the diff of your changes. Check for:
   - Security vulnerabilities (e.g., IDOR, missing auth, XSS).
   - Data integrity issues (e.g., missing `$transaction` wrappers for multi-step mutations).
   - Edge cases (e.g., handling `null`, `NaN`, or empty states).
2. **Type Checking:** Run `npx tsc --noEmit` to ensure your changes haven't broken the TypeScript build.
3. **Linting:** Run `npm run lint` (or equivalent) if configured. Use `eslint --fix --dry-run` first to preview changes safely. Do not run blind auto-fixes.
4. **Testing:** Run relevant automated tests if they exist for the modified modules.
5. **Report:** In your response to the user, include a brief "Verification Summary" explicitly stating what audits and tests you ran to prove the fix works. Do not claim a task is "done" without evidence.

## Mandatory Engineering Workflow (The 8 Gates)

Every work order MUST follow these gates in order. Do not skip any gate.

### GATE 0 — Problem Definition (No Coding)
**Rule:** Do not modify a single line of code. First produce a report containing:
- Symptoms
- Scope
- Files involved
- Reproduction steps
- Initial hypotheses
- Confidence level for each hypothesis

### GATE 1 — Evidence Collection
Gather evidence: stack traces, server logs, Prisma query output, failing payloads, browser console, network requests, SQL output, runtime values. Every hypothesis must be tested. State evidence clearly (e.g., "Stack trace shows TypeError at BigInt arithmetic").

### GATE 2 — Root Cause Proof
Before writing code, answer: "Why exactly did this fail?" Provide a clear, step-by-step trace of the failure mechanism (e.g., Object A -> returned X -> Object B -> returned Y -> operation failed).

### GATE 3 — Minimal Fix First
Never perform a refactor first. Always perform the minimum code change to fix the issue. Deploy, verify. If fixed, stop. Professional engineers prioritize a **small blast radius**.

### GATE 3.5 — Type Quality Review
Before testing, measure the net improvement of the type architecture:
```text
Removed any: X
Introduced unknown: X
Introduced interfaces: X
Introduced generics: X
Introduced utility types: X
Assertions introduced: X
Non-null assertions introduced: X
Double assertions introduced: X
Net improvement: PASS/FAIL
```

### GATE 4 — Regression Prevention
After every bug fix, ask: "Why didn't CI catch this?" Then create a unit test, integration test, or regression test. No exceptions. Every production bug becomes a permanent test.

### GATE 5 — Architecture Review
Did this work expose:
- duplicated logic?
- hidden coupling?
- circular dependencies?
- inconsistent patterns?
- missing abstractions?
- future scaling risks?
- performance bottlenecks?
- test blind spots?
- missing runtime validation?
(Document these as architectural work items, not immediate production fixes.)

### GATE 6 — Scalability Review
Would this code fail if:
- 100 users use it simultaneously?
- 10 million rows exist?
- Postgres returns BigInt?
- Redis cache is unavailable?
- an API times out?
- authentication fails?
- network latency increases?
- another developer extends this feature?
(If yes—document it. Do not fix it. Those become future work orders.)

### GATE 6.5 — External CI Validation
This gate occurs after local testing.
A work order cannot be marked complete until all external validation succeeds.

Mandatory checklist:
- `npm run lint`
- `npm test`
- `npm run build`
- `npx tsc`
- GitHub Actions PASS
- Vercel Preview PASS
- Manual smoke test PASS

If even ONE fails: `WORK ORDER = NOT COMPLETE`.

#### CI Failure Protocol
When CI fails, do **not** fix things immediately. Investigate first:
- STOP. Do not edit code.
- Read every CI error.
- Group them by root cause.
- Determine whether they are the same bug, unrelated bugs, or cascade errors.
- Estimate blast radius.
- Present repair plan.
- Wait for approval.

### GATE 6.8 — Diff Review
Before considering the work order complete, you must produce a change summary:
```text
Files touched: X
Imports removed: X
Variables removed: X
Functions removed: X
Behavior changes: NONE
Logic changes: NONE
Runtime changes: NONE
Architecture changes: NONE
Risk: LOW
```
If you cannot honestly say "Behavior changes: NONE" (when it was purely a cleanup/lint task), then you have exceeded the scope.

### GATE 7 — Post-Merge Verification
This should happen after **every** merged work order.

Checklist:
- Merge PR
- Wait for Vercel production deployment
- Smoke test production
- Compare production with Preview
- Review logs
- Close work order

Example checklist:
```text
WORK ORDER CLOSED

✓ GitHub Actions passed
✓ Vercel Preview passed
✓ Vercel Production deployed
✓ Manual smoke test completed
✓ Runtime logs clean
✓ No regression detected
✓ Lessons learned documented
```
Production is always the final authority.

## Type Architecture Principles

### Type Source Hierarchy
Always prefer authoritative sources of truth over inventing interfaces or falling back to `unknown`.
1. Library exported type (e.g., from `yahoo-finance2`)
2. Prisma generated types
3. NextAuth types
4. Next.js types
5. React types
6. Zod inference
7. Internal interface
8. `unknown` (only at true trust boundaries, narrow immediately)
9. NEVER use `any`

### No Assertion Escalation
You are explicitly forbidden from using the following to silence type errors, unless rigorously justified:
- `as any`
- `as unknown as Foo`
- Non-null assertions (`foo!`)

### Type Complexity Budget
Do not let type safety make code unreadable. If replacing an `any` introduces massive generic chains or mapped types, state the before/after complexity and justify the trade-off.

## Mandatory Pre-Execution Checks

Before beginning execution of any work order, you must produce:

### 1. Risk Matrix
Example:
```text
Risk Matrix
Files: 18
Runtime Risk: LOW
Authentication: No
Database: No
Prisma: No
Next.js Routing: No
React: No
Migration: No
Public API Changes: No
Expected CI Changes: ESLint only
Rollback Difficulty: Very Easy
```

### 2. Dependency Mapping
Before changing anything, map its dependencies:
```text
Function -> Who calls this? -> Who depends on it? -> Tests covering it? -> Runtime routes? -> Blast radius?
```

## Mandatory Post-Execution Documentation

### 1. Architecture Notes
After every work order, document:
- Observed patterns/weaknesses
- New recommendations for future phases

### 2. Technical Debt Register
Maintain a living backlog of observations (e.g., remaining any types, missing Zod schemas, BigInt strategies).

### 3. Architecture Delta
At the end of every phase, produce an Architecture Delta report:
```text
Architecture Delta

New interfaces created: X
Interfaces reused: X
Duplicate interfaces removed: X
Generics introduced: X
Assertions removed: X
Type coverage improved: YES
Behavior changed: NO
Runtime changed: NO
External API changed: NO
Database changed: NO
```

### Work Order Completion Requirements
**No work order is considered complete until it includes:**
1. A root cause analysis
2. A regression test
3. An architecture impact assessment
4. A scalability review
5. Evidence-backed verification (including external CI)
6. A "Lessons Learned" section.
7. Architecture Notes
8. Architecture Delta

End every work order with the following structured "Definition of Done":

```text
WORK ORDER COMPLETE

Root cause proven
YES

Regression test added
YES / N/A

TypeScript
PASS

ESLint
PASS (or expected remaining warnings listed)

Vitest
PASS

Production build
PASS

GitHub Actions
PASS

Vercel Preview
PASS

Manual smoke test
PASS

Architecture review completed
YES

Scalability review completed
YES

Remaining technical debt
Listed explicitly

Confidence
Root Cause: xx%
Fix: xx%
Regression Prevention: xx%
Deployment Confidence: xx%
```

**Rule for Confidence:**
Never say "100% confidence" unless GitHub PASS, Vercel PASS, and Manual browser verification PASS are all true. Otherwise, Deployment Confidence must state "Unknown until Vercel passes."
