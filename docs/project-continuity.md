# Ledger360 Continuity & Master Implementation Guide

## Project Recovery Document (Post Stage 4.5)

---

# 1. Project Identity

Ledger360 is **not** a budgeting app.
Ledger360 is a **Personal Financial Operating System**.
The objective is to become the financial equivalent of Notion.

Instead of simply storing transactions, Ledger360 should continuously answer:
> Where am I?
> Where am I heading?
> What deserves my attention today?
> What should I do next?

Every screen must reduce financial anxiety.
Every screen must answer a decision.
Every screen must make the user feel more in control.

The design philosophy is called:
# Financial Calm

Every page should feel like:
* Apple Health
* Linear
* Arc Browser
* Copilot Money
* Monarch Money
—not Excel.

---

# 2. Engineering Constitution

The repository constitution contained inside **AGENTS.md** is now authoritative.
Never bypass it.

Already implemented:
* Repository Governance
* Repository Ownership
* Evidence-backed cleanup
* Dormant Code Registry
* Stage Baseline Freeze
* Stage Gate Evidence
* Pre-Implementation Reports

Future work must continue using exactly this governance model.

---

# 3. Current Project Status

Completed
✅ Stage 1 Core Architecture
✅ Stage 2 Transactions, Transfers, Loans, Accounts
✅ Stage 3 Financial Snapshot Engine, Dashboard Intelligence, Morning Brief, Attention System, Financial Invariants, OS Components
✅ Stage 3.5 Governance, Repository Cleanup, Engineering Constitution, Baseline Freeze
✅ Stage 4.1 Repository Layer, Budget Architecture
✅ Stage 4.2 Budget Engine
✅ Stage 4.2.5 Budget Financial Invariants
✅ Stage 4.3 Safe To Spend
✅ Stage 4.4 Budget Alerts, Dashboard Integration
✅ Stage 4.5 Budget Command Center, Premium UI, Pacing Engine, Advisor Notes, Health Score, Course Correction

Current Status
START HERE
Work Order 4.6 Analytics Engine

---

# 4. UI Reskin Status

The UI Reskin was intentionally paused.
It must now continue until the ENTIRE application has one unified Financial Calm language.
This is **not optional**.
Every page should eventually use the same visual language introduced in the Budget Command Center.

---

# 5. Design Language

Every page must follow:
Financial Calm Principles
• large whitespace
• premium cards
• calm gradients
• semantic colours
• emotional hierarchy
• progressive disclosure
• advisor notes
• hero metrics
• calculation pills
• pacing
• course correction
• intelligence first

No page should resemble CRUD software.

---

# 6. The 10 Product Modules

The application contains ten major experiences. Every one of these must eventually receive the premium redesign.

## 1. Dashboard
Purpose: "What deserves my attention today?"
Contains: Morning Brief, Hero Metrics, Attention Section, Safe To Spend, Upcoming Bills, Cash Position, Advisor Notes.
Already premium. Needs only future enhancements.

## 2. Transactions
Purpose: "What happened?"
Needs redesign into Transaction Intelligence.
Features: Smart filters, Behaviour detection, Transaction explanations, Daily grouping, Merchant insights, Running balance, Projected cash flow.

## 3. Accounts
Purpose: "Where is my money?"
Future redesign: Institution cards, Cash allocation, Liquidity score, Net movement, Health indicators.

## 4. Budgets
Already redesigned. Budget Command Center. Completed. Acts as the design reference for the remaining modules.

## 5. Categories
Current: Simple CRUD.
Target: Category Analytics Command Center.
Should include: Trend, Velocity, Volatility, Moving average, Sparklines, Behaviour classification, Advisor insight.

## 6. Reports
Current: Basic analytics.
Target: Financial Intelligence Center.
Include: Income trends, Expense trends, Savings trends, Monthly comparison, Rolling averages, Category breakdowns, Spending velocity, Forecasts (future stage).

## 7. Goals
Future Stage. Purpose: "Where am I going?"
Will include: Progress, Probability of completion, Suggested contribution, Goal health, Projected finish date.

## 8. Loans
Already functional. Needs premium redesign.
Future: Debt payoff advisor, Interest optimization, Payment pacing, Snowball recommendations, Avalanche recommendations.

## 9. Investments
Future stage. Portfolio, Performance, Allocation, Dividend tracking, Risk, Net worth integration.

## 10. Settings
Must become Financial OS configuration.
Includes: Preferences, Currency, Themes, Import settings, Data export, Security, Notifications, AI preferences.

---

# 7. Global Design Requirements

Every module eventually needs: Advisor Note, Hero Metric, Progressive Disclosure, Health Indicator, Command Center, Empty State, Responsive layout, Coffee Shop Test, Premium typography, Financial Calm colour system.

---

# 8. Remaining Roadmap

Stage 4.6 Category Analytics (Completed)
Build: Category Analytics Engine, Moving averages, Trend detection, Velocity, Volatility, Sparklines, Behaviour insights. No Recharts. Use CSS + SVG.
Categories should become the **behavior analysis workspace**: category health, trends, volatility, velocity, sparklines, and CRUD.

Stage 4.7 Reports Intelligence (Completed)
Upgrade Reports page. Add: Savings rate, Month over month, Rolling averages, Velocity, Income vs Expense intelligence, Portfolio insights, Advisor summaries.
Reports should become the **cross-category intelligence workspace**: portfolio-wide trends, income vs. expense, savings rate, rolling averages, comparisons, and executive summaries.

Stage 4.8 Stage Exit
Verification: Financial invariants, Baseline freeze, Stage report, Metrics.

---

# Financial Calm OS Alpha (Architecture Contract)

**Status: ACTIVE**
This design system is now the canonical presentation layer for Ledger360.
Every new feature and every UI reskin MUST use these shared primitives unless an Architecture Review explicitly approves the creation of a new primitive.
No page-specific visual component should duplicate existing Financial Calm primitives.

Completed modules:
* ✅ Dashboard Intelligence Center
* ✅ Budget Command Center
* ✅ Category Command Center
* ✅ Financial Intelligence Center

Shared primitives now available:
* HeroMetric
* KPIHero
* AdvisorNote
* CalculationPills
* BudgetCard
* BudgetHealthIndicator
* FinancialHealthIndicator
* TrendBadge
* VarianceIndicator
* RollingAverageChart
* Sparkline
* FinancialTimeline
* MetricComparison
* CommandCenterHero

OS design language established. Future modules must consume these shared primitives.

---

# Ledger360 Intelligence Hierarchy

Every Command Center must implement the following 5-level hierarchy:

1. **Level 1 (Immediate Answer):** Advisor Note
2. **Level 2 (Executive Summary):** Hero Metrics
3. **Level 3 (Behaviour Analysis):** Health, Trend, Pacing, Velocity
4. **Level 4 (Deep Analytics):** Charts, comparisons, forecasts
5. **Level 5 (Exploration):** Tables, filters, CRUD

---

# Financial Calm Review Checklist (UX Gates)

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

---# UI Reskin Program (Continuous)
Transactions → Accounts → Loans → Goals → Investments → Settings

---

Stage 5 Goals
Goal engine, Goal projections, Contribution advisor, Goal dashboard, Probability engine, Premium UI.

Stage 6 Investments
Portfolio engine, Net worth, Asset allocation, Dividend history, Performance.

Stage 7 Forecasting
AI insights, Cash flow prediction, Budget prediction, Future balance, Risk engine, Behaviour modelling.

Stage 8 Automation
Import engine, Rules, Receipt OCR, Categorization, Bank sync preparation.

Stage 9 Financial Operating System
Cross-module intelligence. Everything begins talking together.
Example: Overspending automatically affects Goals, Safe To Spend, Reports, Morning Brief, Forecasts, Budget Health.

---

# 9. Architecture Rules

Never bypass: Actions ↓ Repositories ↓ Queries ↓ Prisma
Domain logic always remains pure.
No Prisma inside domain.
No UI calculations.
No duplicated financial logic.
Every calculation should be reusable.

---

# 10. Financial Invariants

Never break:
- Transfers never create money
- Loans preserve balances
- BigInt precision
- Budget rollover never creates money
- Income − Expenses = Cash movement
All new engines require invariant tests.

---

# 11. UI Component Strategy

Continue expanding the OS primitives. Avoid page-specific duplication. Prefer reusable components.
Examples: HeroMetric, CalculationPills, AdvisorNote, AttentionCard, BudgetCard, HealthIndicator, Sparkline, CommandCenterHero, InsightCard, TrendBadge, MetricGrid.

---

# 12. Development Workflow

Every Work Order follows:
1. Research current code.
2. Produce Pre-Implementation Report.
3. Identify architecture impact.
4. Identify risks.
5. Implement.
6. Run Lint, TypeScript, Tests, Build.
7. Produce Walkthrough.
8. Stage Exit.
Never skip verification.

---

# 13. Immediate Next Work Order

### Stage 4.8 — Stage Exit Report

**Completion Criteria:**
- [ ] Final Verification Gauntlet (`npm run verify`)
- [ ] Architecture Review
- [ ] Performance Review
- [ ] Bundle Review
- [ ] Financial Invariants Audit
- [ ] Baseline Delta Update
- [ ] Freeze Metrics
- [ ] Git commit

---

# 14. UI Reskin Master Checklist

## Active Reskin: Transactions
**Permanent Principles for Transactions:**
- Transactions is NOT a transaction ledger.
- Transactions is the behavioral timeline of the user's financial life.
- The page must answer: What happened? Why did it happen? Is this normal? Is anything unusual? What deserves attention?
- CRUD is Level 5. Insights are Levels 1–4.
- The transaction table should become the least visually dominant element on the page.

| Module       | Reskin Status    | Coffee Shop Test | Advisor Layer | Command Center |
| ------------ | ---------------- | ---------------- | ------------- | -------------- |
| Dashboard    | ✅ Complete       | ✅                | ✅             | ✅              |
| Budgets      | ✅ Complete       | ✅                | ✅             | ✅              |
| Categories   | ✅ Complete       | ✅                | ✅             | ✅              |
| Reports      | ✅ Complete       | ✅                | ✅             | ✅              |
| Transactions | ⏳ Pending        | ❌                | ❌             | ❌              |
| Accounts     | ⏳ Pending        | ❌                | ❌             | ❌              |
| Loans        | ⏳ Pending        | ❌                | ❌             | ❌              |
| Goals        | ⏳ Pending        | ❌                | ❌             | ❌              |
| Investments  | ⏳ Pending        | ❌                | ❌             | ❌              |
| Settings     | ⏳ Pending        | ❌                | ❌             | ❌              |

---

# 15. Product Philosophy — Ledger360 is an Operating System, not a Collection of Pages

Every screen must contribute to a single financial conversation.
Users should never feel like they are entering a different application when navigating between Dashboard, Budgets, Reports, Categories, Accounts, or Goals.

Instead:
Dashboard answers: > What deserves my attention today?
Budgets answer: > Am I staying on course?
Categories answer: > What habits are changing?
Reports answer: > What trends matter?
Accounts answer: > Where is my money?
Goals answer: > Am I getting closer?
Loans answer: > What debt deserves attention first?
Investments answer: > Is my wealth growing?
Settings answer: > How does Ledger360 work for me?

Every module should feel like another room inside the same operating system.

---

# 16. Intelligence Hierarchy (Mandatory)

Every Command Center should present information in exactly this order.

## Level 1
Immediate Answer. One sentence. Example: > You're comfortably on track this month.

## Level 2
Primary Metrics. Never more than 3–4 hero metrics.

## Level 3
Attention Required. Only show problems. Healthy items should never dominate the screen.

## Level 4
Detailed Breakdown. Expandable. Progressive disclosure only.

## Level 5
CRUD. Buttons always come last. Ledger360 is decision-first. Not CRUD-first.

---

# 17. Financial Calm Design Rules

These are mandatory across the application.
Every page must include:
✓ Hero
✓ Advisor
✓ Health
✓ Insight
✓ Progress
✓ Breakdown
✓ Action

Never start with tables.
Never start with forms.
Never start with CRUD.

---

# 18. UI Primitive Expansion Strategy

Budget introduced reusable primitives.
Future modules should extend—not duplicate—them.

Current OS primitives include:
HeroMetric, CalculationPills, AdvisorNote, AttentionCard, MorningBrief, BudgetCard, BudgetHealthIndicator, CommandCenterHero, Sparkline.

Future primitives:
TrendCard, InsightPanel, Timeline, ForecastRibbon, AllocationWheel, VelocityBadge, HealthGauge, DecisionCard, PortfolioHero, NetWorthHero, DebtAdvisor, CategoryCard, AnalyticsHero.

These should become the Ledger360 design system.

---

# 19. Cross-Module Intelligence (Extremely Important)

One of Ledger360's biggest differentiators is that modules are not isolated.
Eventually: Overspending ↓ Budget Health ↓ Safe to Spend ↓ Morning Brief ↓ Reports ↓ Goals ↓ Forecasts ↓ AI Insights

Every future feature should ask: > Which existing modules should react?
Never build isolated intelligence.

---

# 20. Financial Invariant Expansion

Current invariants are excellent. Expand them.
Every new financial engine must prove:
No money creation, No money destruction, BigInt precision maintained, Transfers remain neutral, Budgets preserve balances, Goals preserve contributions, Loan interest calculations remain deterministic, Forecasts never mutate historical data, Reports never modify financial state, Analytics are read-only.

---

# 21. Testing Philosophy

Every new engine requires:
Pure unit tests, Financial invariant tests, Integration tests, Snapshot tests (where applicable), Build verification, Type verification, Lint verification.
No feature is complete until the verification gauntlet passes.

---

# 22. UX Quality Gates

Every redesign should satisfy:
Coffee Shop Test: User understands screen in under 3 seconds.
Five Second Test: User remembers the page purpose after five seconds.
Attention Test: Most important information appears first.
Anxiety Test: Screen reduces stress rather than increasing it.
Decision Test: Every screen helps the user make one decision.

---

# 23. Performance Budget

Maintain strict limits unless a conscious exception is approved.
First Load JS ≤ 110 kB
No unnecessary dependencies
Prefer CSS/SVG over chart libraries
Prefer server components where appropriate
Avoid client-side financial calculations
No duplicated queries
No N+1 regressions

---

# 24. Stage Completion Definition

A work order is only complete when all of the following are true:
* Feature implemented
* Architecture preserved
* Domain logic remains pure
* Tests added
* Financial invariants validated
* `npm run lint` passes
* `npx tsc --noEmit` passes
* `npm test` passes
* `npm run build` passes
* Walkthrough produced
* Implementation plan updated
* Task checklist updated
* Baseline metrics reviewed if applicable

---

# 25. Remaining UI Reskin Roadmap

This gives Antigravity a clear sequence rather than just a checklist.

| Order | Module       | Target Experience                 |
| ----- | ------------ | --------------------------------- |
| ✅     | Dashboard    | Financial OS Home                 |
| ✅     | Budgets      | Budget Command Center             |
| 🔄    | Categories   | Category Analytics Command Center |
| 🔄    | Reports      | Financial Intelligence Center     |
| ⏳     | Transactions | Transaction Intelligence Center   |
| ⏳     | Accounts     | Cash & Liquidity Command Center   |
| ⏳     | Loans        | Debt Optimization Center          |
| ⏳     | Goals        | Goal Planning Center              |
| ⏳     | Investments  | Portfolio Intelligence Center     |
| ⏳     | Settings     | Financial OS Configuration Center |

This ordering matters because Categories and Reports will introduce analytics primitives that Transactions and Accounts can later reuse.
