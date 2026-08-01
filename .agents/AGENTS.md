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
5. Evidence-backed verification (including external CI and command output logs)
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

Verification Evidence

tsc
Command: npx tsc --noEmit
Exit Code: [Exit Code]
Summary: [Summary or exact output]

----------------
Vitest
Command: npm test
Exit Code: [Exit Code]
Summary: [Summary or exact output]

----------------
ESLint
Command: npm run lint
Exit Code: [Exit Code]
Summary: [Summary or exact output]

----------------
Build
Command: npm run build
Exit Code: [Exit Code]
Summary: [Summary or exact output]

----------------
GitHub CI
Status: PASS/FAIL

----------------
Vercel
Status: PASS/FAIL

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

## Core Operational Rules

1. **Never push directly to `main`.** All changes must go through feature branches (`feature/*`, `bugfix/*`, `hotfix/*`), CI, and a pull request before merging. Only the human may merge into main.
2. **Never report `PASS` without evidence.** The AI is forbidden from declaring any verification step PASS unless:
   - The command actually completed.
   - Exit code == 0.
Files touched: X
Imports removed: X
Variables removed: X
Functions removed: X
Behavior changes: NONE
Logic changes: NONE
Runtime changes: NONE
Architecture changes: NONE
Risk: LOW

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
5. Evidence-backed verification (including external CI and command output logs)
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

Verification Evidence

tsc
Command: npx tsc --noEmit
Exit Code: [Exit Code]
Summary: [Summary or exact output]

----------------
Vitest
Command: npm test
Exit Code: [Exit Code]
Summary: [Summary or exact output]

----------------
ESLint
Command: npm run lint
Exit Code: [Exit Code]
Summary: [Summary or exact output]

----------------
Build
Command: npm run build
Exit Code: [Exit Code]
Summary: [Summary or exact output]

----------------
GitHub CI
Status: PASS/FAIL

----------------
Vercel
Status: PASS/FAIL

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

## Core Operational Rules

1. **Never push directly to `main`.** All changes must go through feature branches (`feature/*`, `bugfix/*`, `hotfix/*`), CI, and a pull request before merging. Only the human may merge into main.
2. **Never report `PASS` without evidence.** The AI is forbidden from declaring any verification step PASS unless:
   - The command actually completed.
   - Exit code == 0.
   - The output has been inspected.
   - The output is included in the completion report.
   If any verification command is still running, the work order status must remain PENDING. Never infer, assume, or estimate success.
3. **Never declare a work order complete until local verification, GitHub Actions, and the Vercel production build have all passed.**

## Mandatory Product Design Rule (The OS Mindset)

Stop thinking like a frontend engineer and start thinking like a product designer. You are no longer redesigning software. You are designing a financial companion. Every feature should reduce uncertainty, improve confidence, and encourage one better financial decision. Code quality, architecture, and visual polish are expected—but they are not the product. The product is the feeling the user has after closing the app. If they leave feeling calmer, more informed, and more optimistic than when they opened it, the feature succeeds. If they merely saw their data in a prettier layout, it fails.

### Immutable Product Principles
1. **Every screen answers ONE question.** (e.g., Dashboard = "Am I okay?", Accounts = "Where is my money?", Budgets = "Am I staying on course?")
2. **Every screen recommends ONE action.** Every page should end with a decision ("Here's what I'd do"), not just data.
3. **Never make the user calculate.** Always perform the mental work (e.g., "You saved 21% this month").
4. **Explain before visualizing.** Narrative first. Charts support the story; they are never the story.
5. **Decision Cards over Data Cards.** Cards should show decisions and next steps, not just balances.
6. **Introduce Time & Velocity.** Everything should answer "When?" and show the rate of change (e.g., "Growing KES 740/day").
7. **Every Module Needs a Signature Experience.** (e.g., Dashboard = Morning Brief, Accounts = Cash Command Center, Transactions = Financial Timeline).
8. **Financial Calm Design System:** Large whitespace, warm greys, soft greens, subtle gradients, slow purposeful motion, narrative copywriting. Reassure, don't stress.
9. **Progressive Disclosure:** Three things for new users. Advanced analytics via Cmd+K and hover for power users.
10. **Conversational UI:** Dashboards should read like a briefing from a trusted advisor.

### The Product Brief
Before implementing any screen, you MUST produce a Product Brief containing:
1. **Design North Star:** (e.g. "If a user records just one transaction and opens Ledger360 the next morning, they should immediately feel: 1. This app understands my financial situation. 2. This app already knows what I should do next. 3. This app is helping me build wealth.")
2. The user's emotional state on arrival.
3. The single most important question the screen must answer.
4. The primary action the user should take.
5. The "wow moment" that makes the experience memorable.
6. Three benchmark products and what Ledger360 should learn from each.
7. The information hierarchy, interaction flow, accessibility considerations, and motion language.
8. A feature parity checklist proving that no existing functionality is removed—only elevated.
9. **UX Success Metric:** (e.g., "Within 5 seconds, can the user answer: Am I safe? What changed? What next? without scrolling.")
10. **Product Review Gate:** Why would someone choose Ledger360 over Monarch, Copilot, or YNAB? (Answer must be based on coaching and calm, not UI aesthetics).

This brief must be approved by the user before any UI code is written. Every redesign should leave users thinking, "This app understands my money better than I do."

### Interaction Manifesto
Every interaction must follow these rules:
1. **Hover teaches.** (Explain what will happen).
2. **Click commits.** (Take action confidently).
3. **Animation confirms.** (Visual feedback for every state change).
4. **Color reassures.** (Use semantic emotional colors, not just bright primary colors).
5. **Sound celebrates.** (Optional, but milestones should feel rewarding).
6. **Motion never delays work.** (Animations must be quick and purposeful, ~150ms-300ms).
7. **No modal unless necessary.** (Keep users in context).
8. **Keyboard first.** (Power users navigate via Cmd+K).
9. **Undo before confirm.** (Allow graceful recovery instead of friction-heavy warnings).
10. **Progressive disclosure always.** (Start simple, reveal complexity on demand).

### Product Metrics
Do not just measure engineering metrics. Measure product success:
- **Time to reassurance:** How quickly does a user know "I'm okay" after opening the app?
- **Recommendation acceptance rate:** What percentage of Catalyst actions are completed?
- **Return frequency:** Do users come back because the insights are valuable?
- **Savings improvement:** Are users increasing their savings rate over time?
- **Budget recovery rate:** How often do users recover after an overspend warning?
- **Task completion time:** How quickly can users perform common financial tasks?
- **Trust indicators:** How often do users expand "Why?" explanations on recommendations?

### Product Review Gate
Every phase must pass this review before completion:
✓ Can a first-time user understand this?
✓ Does it reduce anxiety?
✓ Does it reduce clicks?
✓ Does it recommend an action?
✓ Does it feel premium?
✓ Does it feel uniquely Ledger360?
✓ Would we ship this if Apple built it?

### Permanent Principle: No Empty Screens
Every empty state should teach. Every zero state should coach.
**Never** show a dead end (e.g., "You have no transactions.").
**Always** show an invitation (e.g., "Let's record your first expense. Once you do, I'll begin learning your spending habits and generate your first Financial Brief.").

### Permanent Principle: The Coffee Shop Test
A user opens Ledger360 while standing in a coffee shop deciding whether to buy something.
**If the screen does not help them make a better decision in under 10 seconds, the design fails.** This test must be applied to every feature before implementation.

### Permanent Principle: The Trust Layer
Users trust systems that explain themselves. Never create a black box. Every recommendation must explain:
1. **Why?** (Because your checking account holds 3 months of expenses)
2. **Expected Gain** (KES 1,180/year)
3. **Confidence** (94%)
4. **Calculation** (Show the math)

### Permanent Principle: Separation of Concerns
Pages own layout. Experiences own behavior. Engines own intelligence. Components own presentation. Events own state changes.

### Permanent Principle: Mockups are Specifications
**Approved design concepts are implementation specifications, not inspiration.** During execution, the assistant must reproduce the approved mockups with high visual fidelity before introducing new interpretations or architectural optimizations. Engineering decisions must support the approved experience, not replace it.

### Permanent Principle: No Placeholder UI
Once a screen has been approved visually, no subsequent implementation phase may replace premium components with generic placeholders. Dynamic data must be integrated into the approved visual structure, not the other way around. Every approved mockup is treated as a functional specification. Missing implementation details must be inferred to preserve the visual language, not replaced with generic UI.

### Permanent Principle: Product Trumps Codebase
**The user is commissioning a product, not a codebase. Every implementation decision must optimize for perceived quality before architectural elegance. If there is ever a conflict between preserving an abstraction and reproducing the approved Ledger360 experience, the product experience wins, provided security, correctness, and maintainability are not compromised.**

### Permanent Principle: Screen Replacement Rule
No phase may be considered complete if the old screen still exists underneath. Every redesigned screen must fully replace its predecessor. Not coexist with it. No `-v2`, `New`, or `Experimental` routes unless explicitly approved as a temporary cutover with a strict deadline. The production route must always be the target, preventing UI accumulation and enforcing direct replacement.

### Permanent Principle: Performance Gate
Premium products feel fast. No redesign may introduce performance regressions. Measurable targets:
- CLS (Cumulative Layout Shift) < 0.05
- LCP (Largest Contentful Paint) < 2.5s
- INP (Interaction to Next Paint) < 200ms
- 60 FPS animations
- No layout shift during page transitions
- No material increase in JS bundle size
- No animation jank or blocked interaction

### Permanent Principle: Financial Calm Defined
A screen achieves Financial Calm only if it passes this checklist:
- One dominant action
- Maximum three competing focal points
- Generous whitespace
- Calm color hierarchy (minimal warning colors)
- Clear reading order
- Immediate reassurance
- No unnecessary visual noise
- Every number has context
- User knows what to do within three seconds

### Permanent Principle: The Consistency Rule
Every new screen must be recognizable as Ledger360 even if the logo is removed. This means all pages share the same spacing, typography, shadows, motion, elevation, and interaction language.

### Permanent Principle: Strict Feature Parity
Existing feature parity is mandatory. No redesign may remove any existing feature unless explicitly approved. Everything must still exist, including but not limited to:
- Search
- Sort
- Filter
- Pagination
- Bulk actions
- Keyboard shortcuts
- Exports
- Imports
- Permissions
- Responsive behavior
- Accessibility
- Loading states
- Error states
- Empty states

### Permanent Principle: No New Abstractions (Anti-Overengineering)
**If a visual goal can be achieved without introducing a new abstraction, do not introduce one.** No new architecture or intelligence work will be undertaken until the approved visual product has been implemented across the production application. Existing architecture may only be modified when required to support the visual transformation or preserve feature parity.

### Permanent Principle: Definition of Replace
**Replace means delete, not supersede.** When replacing a screen or component, "replace" explicitly means:
- delete unused components
- delete obsolete CSS
- delete obsolete routes
- delete obsolete utilities
- update imports
- zero dead code remains
No feature flags, no duplicate primitives (e.g., leaving `OldCard.tsx` next to `Card.tsx`).

### Permanent Principle: Evidence Before Claims Rule
The assistant may not state that a redesign, implementation, or feature is "complete" unless it can provide concrete evidence of the result. For UI work, this means actual artifact screenshots (PNG files) or a running implementation demonstrating the requested design. Passing builds, successful linting, new abstractions, or code additions are NOT evidence that a product transformation is complete.

### Permanent Principle: Component Completion Definition
A primitive component (e.g., Button, Input, Card) is not complete simply because it "looks nice." It is complete only after the following states/variants have been explicitly styled, tested, and visually verified:
- normal
- hover
- active
- keyboard focus
- disabled
- loading
- icon-left / icon-right
- destructive / warning states
- mobile / touch targets
- dark mode
- accessibility contrast

### Permanent Principle: Consistency QA Gate
Every new UI change must pass a consistency audit to prevent design-system entropy. Ask:
- Does this introduce a new border radius?
- Does this introduce a new spacing rule?
- Does this introduce another shadow?
- Does this introduce another animation?
- Does this introduce another font size?
If yes to any of the above, justify why an existing token was not used. If there is no strong justification, revert and use existing tokens.

### Permanent Principle: Financial Calm OS Alpha (Architecture Contract)
Status: ACTIVE
This design system is now the canonical presentation layer for Ledger360.
Every new feature and every UI reskin MUST use these shared primitives unless an Architecture Review explicitly approves the creation of a new primitive.
No page-specific visual component should duplicate existing Financial Calm primitives.

### Permanent Principle: Ledger360 Intelligence Hierarchy
Every Command Center must implement the following 5-level hierarchy:
- **Level 1 (Immediate Answer):** Advisor Note
- **Level 2 (Executive Summary):** Hero Metrics
- **Level 3 (Behaviour Analysis):** Health, Trend, Pacing, Velocity
- **Level 4 (Deep Analytics):** Charts, comparisons, forecasts
- **Level 5 (Exploration):** Tables, filters, CRUD

### Permanent Principle: Financial Calm Review Checklist (UX Gates)
Every screen must satisfy this checklist before being considered complete:
- [ ] Coffee Shop Test (Helps user make a decision in < 10 seconds)
- [ ] Immediate Answer visible in <5 seconds
- [ ] No financial calculations performed in UI
- [ ] Uses shared primitives
- [ ] Progressive disclosure
- [ ] Responsive
- [ ] Empty state designed
- [ ] Semantic colour system
- [ ] Accessibility reviewed
- [ ] Typography hierarchy verified
- [ ] Motion under 60fps budget
- [ ] No duplicated UI patterns

### Permanent Principle: Intelligence Layer Rule
Every intelligence engine must remain deterministic.
Specifically:
- identical inputs must always produce identical outputs
- intelligence engines must never read clocks directly
- intelligence engines must never read Prisma directly
- intelligence engines must never read React state
- intelligence engines must never perform I/O
- intelligence engines remain pure functions
That single rule preserves testability forever.
