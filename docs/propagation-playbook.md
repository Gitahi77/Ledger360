# Ledger360 Propagation Playbook

This playbook defines the exact boundary between globally reusable OS primitives and domain-specific implementations. It enforces the sequence and rules for propagating the UI Operating System across the remaining domains of Ledger360.

## 1. Core Philosophy: The UI Operating System

Ledger360 is a cohesive financial operating system, not a collection of CRUD screens sharing a sidebar. 

**The Rule of Transactions:**
> No domain may be considered a propagation of Transactions. Transactions is the reference implementation for the UI Operating System, not the reference implementation for domain UX. Every domain must earn its own information hierarchy from its Product Brief.

> The Transactions reference implementation proves the UI Operating System (the components, interaction patterns, semantic colors, and typography). It does **NOT** dictate the UX or information hierarchy of other domains.

## 2. Global vs. Domain-Specific Boundaries

### A. Globally Reusable (The OS Primitives)
These components reside in `src/components/os/` and define the global design language. They should be reused across all domains.
- `PageShell` & `SectionHeader` (Layout & Page Structure)
- `MetricBlock` (Standardized KPI presentation)
- `AdvisoryCard` (Intelligence surfacing)
- `FilterBar` & `FilterGroup` (Standardized exploration controls)
- `EmptyState` (Coaching and onboarding)
- `Drawer` (Standardized mutation surfaces)
- **Tokens & Conventions:**
  - Typography (Tabular numbers for currency)
  - Spacing (Generous, intentional whitespace)
  - Semantic Colors (Positive/Negative used *only* for semantic meaning, never decoration)
  - Interaction states (Hover explains, click commits, animation confirms)
  - Deep-link URL state management (via `nuqs`)
  - Strict DTO/React separation (React displays; Backend calculates)

### B. Domain-Specific Implementations
These components belong in their respective `src/app/(dashboard)/[domain]/` directories. They must use the OS Primitives for their structure but provide domain-specific UX.
- Custom list rows (e.g., `TransactionRow`, `AccountRow`)
- Domain-specific filters and actions
- Domain-specific forms and mutations
- Domain-specific intelligence presentation

### C. Creating New OS Primitives
A new component should only be added to `src/components/os/` if:
1. It is required by at least two distinct domains.
2. It solves a generalized layout or interaction problem, independent of specific financial data.
3. It passes the design bar for Financial Calm (generous spacing, clear hierarchy).

## 3. The Strict Propagation Pipeline

Every remaining domain must traverse this exact pipeline before a single line of React code is written:

```text
[DOMAIN NAME]
      ↓
1. Product Brief (Defines the job, questions, and boundaries)
      ↓
2. Product/UX Review (Approval gate)
      ↓
3. DTO/Data Contract Definition (Backend capabilities)
      ↓
4. Visual Blueprint (Component mapping)
      ↓
5. Implementation (Coding Phase)
      ↓
6. Interaction Audit (Destructive actions, state)
      ↓
7. Engineering Audit (tsc, lint, tests, build)
      ↓
8. Visual/Responsive Audit (Desktop & Mobile fidelity)
      ↓
9. Coffee Shop Test (<10 sec comprehension)
      ↓
10. Engineering GREEN + Product GREEN
      ↓
DONE
```

## 4. Anti-Patterns & Prohibitions
- **DO NOT** blindly copy the Transactions information hierarchy into other domains. (e.g., Accounts is "Where is my money?", not "What happened?").
- **DO NOT** perform financial math in React components. Route everything through the domain DTOs.
- **DO NOT** use `useState` for state that should be URL-addressable (e.g., active tabs, search queries, open drawers).
- **DO NOT** create "Dashboard creep" (see Dashboard Product Brief).

## 5. Source of Truth Rule (Orchestration over Recreation)

> **Every Dashboard (or cross-domain) value must have an identifiable authoritative domain source. Dashboard aggregation may synthesize domain facts, but must never independently recreate financial calculations already owned by another domain.**

For example:
- Cash balance is owned by `Accounts`.
- Transactions/flow is owned by `Transactions`.
- Budget health is owned by `Budgets`.
- Goal progress is owned by `Goals`.
- Debt position is owned by `Loans`.
- Net worth is owned by `Net Worth`.

The Dashboard acts as an **orchestrator** of these facts, not a second implementation of them.
