# Ledger360 Engineering Recovery Manual (Canonical Edition)

**Project:** Ledger360

**Version:** Phase 4 Recovery

**Status:** Canonical Engineering Source of Truth

**Audience**
This document is intended for any engineer (human or AI) joining Ledger360 after loss of chat history.

The repository on the local machine is the source of truth.

This document explains **why the project looks the way it does**, **what has already been decided**, **what mistakes have already been made**, **what is frozen**, and **how future work must proceed**.

---

# 1. Project Vision

Ledger360 is **not** another expense tracker.

It is intended to become a calm personal financial operating system.

The product is designed around one fundamental question:

> **Does this help the user feel more confident and in control of their money today?**

Every feature, every screen and every engineering decision should support this objective.

---

# 2. Product Philosophy

Ledger360 intentionally avoids becoming:

* another spreadsheet
* another banking app
* another budgeting app

Instead it combines:

* M-Pesa's trust
* Monarch's clarity
* Revolut's polish
* YNAB's intentionality

while preserving its own identity.

The application should feel:

* calm
* deliberate
* trustworthy
* mathematically transparent

rather than flashy.

---

# 3. Technology Stack

Current stack

* Next.js App Router
* React
* TypeScript
* PostgreSQL
* Prisma
* TailwindCSS
* NextAuth
* Storybook
* Vitest
* ESLint

Design System additions

* class-variance-authority
* sonner
* framer-motion
* react-hotkeys-hook

---

# 4. Architecture

The architecture is frozen.

Every feature follows

```
Repository

↓

Service

↓

DTO

↓

Server Component

↓

Client Component
```

Rules

Repositories

* Database only

Services

* Business logic only

DTOs

* Presentation contracts

Server Components

* Data loading

Client Components

* Rendering
* Interaction

No Client Component should ever import Prisma.

No UI component should ever perform financial calculations.

---

# 5. Phase History

## Phase 1

Backend architecture

Major work

* Repository layer
* Services
* DTOs
* Financial engine
* Ledger replay
* Net worth engine
* Budget engine
* Loan engine
* Forecast engine

Result

Backend considered mature.

---

## Phase 2

Architecture hardening.

Performance.

Validation.

Data integrity.

Eventually stopped because improvements were producing diminishing returns.

Decision:

Backend frozen.

---

## Phase 3

Product Transformation.

This was not coding.

This was product research.

Four design sprints.

---

### Sprint 1

Identity

Studied

* Monarch
* M-Pesa
* Revolut
* Nubank
* Copilot
* Wise
* Splitwise
* Google Wallet

Outcome

Every recommendation classified as

Adopt

Adapt

Avoid

Nothing copied blindly.

---

### Sprint 2

UX Audit

Discovered

Application technically powerful.

UX cognitively overwhelming.

Major decisions

Mandatory onboarding.

Universal empty states.

Skeleton loading.

Meaningful next actions.

---

### Sprint 3

Design System

Major rules

No hardcoded colors.

Semantic tokens only.

Typography tokens.

Spacing tokens.

Motion tokens.

Optimistic UI only where financially safe.

---

### Sprint 4

Transformation Plan

Every page redesigned before coding.

Dashboard reduced to answering

How much money do I have?

Am I improving?

What needs attention?

What should I do next?

Everything else removed.

---

# 6. Phase 4

Current phase.

Presentation only.

Business logic frozen.

Migration strategy

Strangler Fig.

Never rewrite entire application.

Replace page-by-page.

Every page passes

A Audit

B Proposal

C Review

D Engineering Plan

E Implementation

F Verification

G Final Audit

Only then proceed.

---

# 7. Wave 1A

Foundation

Completed.

Included

Semantic CSS variables

Typography

Spacing

Theme

Sonner

Framer Motion

Hotkey infrastructure

Provider cleanup

No visual redesign.

---

# 8. Wave 1B

Design System

Completed.

New directories

```
components/

layout/

ui/

finance/

feedback/
```

Utilities

```
lib/ui

cn.ts

motion.ts

focus-ring.ts

variants.ts
```

Introduced

Button

Card

Badge

Surface

Grid

Stack

Input

Label

CurrencyDisplay

PercentageChange

DeltaIndicator

TrendChip

StatusBadge

ProgressBar

FinancialMetric

EmptyState

Primitive APIs intentionally frozen before widespread adoption.

---

# 9. Dashboard Transformation

Completed.

Dashboard rewritten using primitives.

ForecastCard removed.

Reason

Violates

5-second comprehension rule.

Dashboard should never become the place every feature competes for attention.

---

# 10. Storybook

Decision made.

Do NOT build custom "/design".

Storybook is official component catalog.

Stories include

Positive

Negative

Loading

Missing

Hero

USD

KES

Dark mode

Accessibility

Storybook is now part of engineering workflow.

---

# 11. Financial Formatting Standards

Never display

```
1234
```

Always

```
KES 1,234.00
```

Negative values

```
−KES 540.00
```

NOT

```
KES -540
```

Percentages

```
+4.2%
```

NOT

```
4.2 %
```

Always

Tabular numerals.

Semantic colors.

---

# 12. Important Engineering Decisions

These decisions are frozen.

## Business Logic Freeze

No repository modifications.

No service modifications.

No schema changes.

No validation changes.

No financial calculations.

Only UI.

---

## Component First

Never duplicate UI.

If duplication exceeds three repeated visual elements

Extract primitive.

---

## Design System First

Never hardcode

colors

spacing

animation

z-index

typography

Everything comes from tokens.

---

## Accessibility

Release blocker.

Keyboard.

Focus.

ARIA.

Dark mode.

Reduced motion.

Required.

---

## Performance

Every dependency justified.

Dashboard

<1.5s

LCP

<2.5s

TTFB

<1s

---

# 13. Biggest Mistakes Already Made

These mistakes must never be repeated.

## Mistake 1

Inventing component APIs.

Solution

Always inspect actual component.

Never assume props.

---

## Mistake 2

Testing only with

```
npm test
```

Vitest hid type errors.

Solution

Always run

```
tsc --noEmit
```

before commit.

---

## Mistake 3

Using Jest typing.

Project uses Vitest.

Never use

```
global.jest.Mock
```

Always use

```
vi.mocked()
```

---

## Mistake 4

Large pushes.

Large pushes caused

hard debugging

large regressions

failed CI

Solution

Small milestone commits.

---

# 14. Git Strategy

Never again use

One massive feature commit.

Instead

```
main

↓

feature/phase4

↓

feature/wave1-foundation

↓

feature/wave1-dashboard

↓

feature/wave2-transactions

↓

...
```

Each milestone

Build

Lint

Typecheck

Tests

Storybook

before merge.

---

# 15. CI Pipeline

GitHub Actions is source of truth.

Before push

Run

```
npm install

npx prisma generate

npx tsc --noEmit

npm run lint

npm run test

npm run build

npm run build-storybook
```

Only push after all pass.

---

# 16. Vercel

If deployment fails

Check

Environment variables

Prisma generation

Authentication

Middleware

Build logs

Never debug UI before verifying deployment.

---

# 17. Current Status

Completed

✅ Backend architecture

✅ Product Transformation

✅ Wave 1A

✅ Wave 1B

✅ Dashboard redesign

✅ Storybook

✅ Finance primitives

Current blocker

CI stabilization.

GitHub Actions must return green.

Next milestone

Transactions redesign.

---

# 18. Long-Term Roadmap

After Transactions

Accounts

Transfers

Budgets

Goals

Loans

Reports

Insights

Settings

Onboarding

Help

Every page follows

Audit

Proposal

Review

Plan

Implementation

Verification

Final Audit

---

# 19. Definition of Done

A task is **not complete** because it works locally.

A task is complete only when all of the following pass:

* TypeScript (`tsc --noEmit`)
* ESLint
* Unit tests
* Production build
* Storybook build
* Accessibility (WCAG AA)
* Responsive layouts
* Dark mode
* No hydration warnings
* No console errors
* Performance budget met
* GitHub Actions CI passes
* Vercel preview deploys successfully (when applicable)

---

# 20. Instructions to Any Future AI

1. Read the existing code before proposing changes.
2. Do not invent APIs or assume component contracts.
3. Respect the Repository → Service → DTO → Server → Client architecture.
4. Do not modify business logic during Phase 4 without explicit approval.
5. Build reusable primitives before page-specific components.
6. Mirror the CI pipeline locally before every commit.
7. Keep commits small, reviewable, and independently deployable.
8. Preserve Ledger360's identity as a calm, trustworthy financial operating system rather than imitating any single competitor.
