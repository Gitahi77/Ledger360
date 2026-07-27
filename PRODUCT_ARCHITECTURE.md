# Ledger360 Product Architecture

## Mission
Help people understand, control, and improve their financial lives. The goal is to build a trusted personal financial operating system.

## Design Philosophy
**40% M-Pesa / 60% Monarch**
- **M-Pesa:** Unwavering trust, operational clarity, predictable workflows, obvious actions, and speed. Financial accuracy is never compromised for aesthetics.
- **Monarch:** Calm typography, premium spacing, reassuring insights, beautiful budgeting, and intelligent summaries. Quiet assistance over loud AI.

## Core Abstractions
1. **Money:** The fundamental unit. Immutable, currency-aware, and precise (minor units).
2. **Finance UI Foundation:** A dedicated presentation layer (`src/components/finance` and `src/lib/finance`) responsible for all monetary, percentage, and trend presentation. No raw monetary formatting occurs in feature components.
3. **Ledger Entry:** The canonical record of financial movement. Transactions, transfers, loan payments, and interest are all just semantic variations of Ledger Entries.
4. **Account:** A collection of Ledger Entries that compute to a balance.
5. **Budget & Goal:** Planning primitives that monitor Ledger Entries against targets.
6. **Loan:** A liability primitive integrated directly into the unified Ledger.
7. **Insight & Report:** Read-only aggregations that provide reassurance and clarity.

## Non-Functional Goals
- **Reliability:** The system must never lose or silently corrupt a ledger entry. N+1 balance computations are prevented; state is strongly reconciled.
- **Correctness:** Double-entry principles apply where possible. No floating-point math for financial storage or boundary transport.
- **Accessibility:** Keyboard navigable, screen-reader ready, and WCAG AA compliant. Financial tools must be accessible to everyone.
- **Performance:** Sub-100ms API responses; strict boundaries on Client-Side JavaScript bundle sizes (< 150kB per route).
- **Maintainability:** Pure domain logic decoupled from the Prisma ORM and Next.js Server Components.

## Future Capabilities
- Multi-currency natively supported across all ledgers.
- Bank synchronization and automated statement importing.
- AI categorization with explicit confidence scoring (avoiding silent hallucination).
- Collaborative household ledgers.
- Recurring transactions and subscription forecasting.
- Investment tracking and wealth projection.
  
## Premium UX Principle  
New features should not be implemented by introducing bespoke layouts or styling. They must be composed from the shared design system (design tokens, UI primitives, finance primitives, and interaction patterns). This ensures that every feature inherits a consistent premium experience rather than creating isolated visual designs. 
