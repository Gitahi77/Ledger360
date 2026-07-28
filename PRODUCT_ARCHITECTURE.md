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

## Responsive-first Principle
**Every UI component, layout, and screen introduced or modified from Phase 9 onward must be designed, implemented, and verified simultaneously for mobile, tablet, and desktop.** 

A task is not complete until it meets the acceptance criteria for all supported breakpoints. The mobile web and desktop UI are not separate products; they are the same application rendered responsively. Mobile layouts should prioritize the most important information, simplify interactions, and optimize for one-handed use instead of merely mirroring or shrinking the desktop arrangement.

### Supported Viewport Matrix
Every major screen must be verified against this matrix:

| Device         |      Width |
| -------------- | ---------: |
| Small phone    |     320 px |
| Standard phone |     375 px |
| Large phone    | 390–430 px |
| Small tablet   |     768 px |
| Large tablet   |    1024 px |
| Laptop         |    1280 px |
| Desktop        |   1440 px+ |

## Screen Acceptance Reviews (Phase 9B)
Before freezing any redesigned screen in Phase 9B, it must pass this non-negotiable checklist:

- [ ] Visual consistency
- [ ] Responsive behavior (320–1440 px)
- [ ] Accessibility
- [ ] Keyboard navigation
- [ ] Performance
- [ ] Information hierarchy
- [ ] Empty states
- [ ] Loading states
- [ ] Error states
- [ ] Animation quality
## Design Quality Gate
Every new screen must complete the following lifecycle before implementation is considered finished:

1. **User questions:** What exact questions does this screen answer?
2. **User journey:** What should the user feel in the first 10 seconds?
3. **High-fidelity Design Boards:** Produce static HTML prototypes or design mockups (No ASCII wireframes).
4. **Interaction map:** Every tap, hover, expansion, keyboard shortcut, and transition.
5. **Component reuse audit:** Which existing primitives are reused? Which truly need to be new?
6. **Pixel QA Gate:** Verify alignment, spacing rhythm, typography scale, whitespace, touch targets, and above-the-fold hierarchy via mocks/screenshots at exactly 320px, 390px, 768px, 1024px, and 1440px. 
7. **Interaction QA Gate:** Verify: Can it be understood without clicking? Does hover teach? Does pressing reward? Does motion reduce cognitive load? Is it keyboard accessible?
8. **Accessibility review:** Keyboard navigation, focus order, contrast, screen reader behavior, reduced motion.
9. **Self-critique:** Identify weaknesses before implementation.
10. **Design review:** Formally critiqued and approved by the Lead Product Designer.
11. **Implementation:** Only after approval. During coding, it is explicitly forbidden to tweak layout, invent spacing, change hierarchy, add widgets, change copy, or improve design. It must be a mechanical translation.
12. **Post-implementation review:** Compare the finished screen against the approved design and reject any visual or UX regressions.

## Strict Implementation Rules
Once a design is approved, the following non-negotiable rules apply during implementation:
1. **Do not improvise the UI.** Implement exactly what has been approved.
2. **Reuse existing primitives first.** New components require explicit justification.
3. **Mobile is not a stacked desktop.** Design it independently while sharing the same design tokens and primitives.
4. **Every widget must answer one user question and end with either a clear action or a clear reassurance.**
5. **Whitespace is a feature.** Resist filling every gap with more metrics or charts.
6. **Motion must communicate state, not decorate.** Every animation should have a purpose.
7. **Every empty state must teach or encourage the next step.**
8. **Every metric should explain itself.** Avoid "mystery numbers."
9. **Every implementation must be verified with screenshots** across the viewport matrix (320px–1440px) and a self-review against the approved proposal.
10. **If the implemented UI looks like a generic admin dashboard, stop and redesign** before adding more features.
11. **No Placeholder Thinking:** Never use generic copy ("Lorem", "Card Title"). Every mock must use realistic financial narratives.
12. **Every Screen Must Have a Hero:** Identify the one element that deserves attention in the first 3 seconds. No competing focal points above the fold.
13. **Every Metric Must Answer "Why?":** Every synthesized score or recommendation must be explainable in one tap.
14. **One Primary Action:** Each screen may have many actions, but only one visually dominant primary action.
15. **Remove Before Adding:** During design reviews, remove at least one UI element before adding another. Simplicity is an active decision.
16. **Narrative Integrity Rule:** Every sentence shown to the user must be derivable from real user data or explicitly labeled as a projection or recommendation. The UI must never fabricate stories to make the dashboard feel intelligent.

## The "Three Directions" Rule
> Before any React code is written for a major screen, you must produce **three competing design directions** (e.g., Editorial, Minimal Luxury, Operational) in your low-fidelity proposal. This prevents locking onto the first idea and forces exceptional, rather than conventional, UX thinking.

## The "Delete Test" Rule
> Before approving any screen, you must delete **one** section from the mockup and ask: "Is the screen now better?" If the answer is yes, that section never deserved to exist. Simplicity is an active design decision.

## Component Creation Rule
> **Never create a component because a screen needs it. Create components because multiple future screens will naturally need them.** Every component must be backed by a product principle (e.g., Journey Cards exist because long-term objects must communicate movement rather than static balance).

## Primitive Completion Rule
> **A primitive cannot be considered complete until it has been demonstrated in isolation.** If it doesn't look premium by itself, it won't magically become premium inside a dashboard. Primitives must be certified against the Primitive Certification Checklist before being assembled.

## The Dumb Primitive Rule
> **Primitives must be intentionally "dumb."** A `HeroMetric` must never know about loans, budgets, or dashboards. It only knows label, value, status, and animation. A `StoryCard` only knows narrative, progress, and action. This guarantees reusability across the entire product.

## The Assembly Rule & Composition Tests
> **Screens are assemblies. They are never invention.** A dashboard is `Dashboard Hero + Activity Feed + Financial Health + Progress Section`. No screen-specific hacks. No new design decisions allowed during assembly. 
> **Composition Test:** Before a screen is assembled, the composition of its sections must be proven using *only* certified primitives and *zero* custom CSS. If custom CSS is required, the primitive is unfinished.

## Variant Matrix & Anti-Patterns Rule
Every primitive must have a defined variant matrix covering only intentional states (e.g., HeroMetric doesn't need an Error state if it never handles errors). 
Every primitive must explicitly document its **Anti-patterns** (e.g., "Correct: HeroMetric as page focal point. Incorrect: HeroMetric inside a small card.").

## Principle-Based Benchmarking
During Phase 9B, do not benchmark interactions solely against finance apps, and do not blend inspirations into a generic aesthetic. Benchmark **principles**, not appearances:
* Learn **clarity** from Stripe.
* Learn **motion restraint** from Arc.
* Learn **focus** from Linear.
* Learn **typography rhythm** from Apple.
* Learn **information architecture** from Notion.
* Learn **command interactions** from Raycast.

## Design Language Checklist
Every screen must be reviewed against this language:
- **Emotional:** Does it reduce anxiety? Increase confidence? Encourage action without pressure? Feel calm?
- **Visual:** Is there only one dominant focal point? Is whitespace intentional? Is typography doing hierarchy instead of color? Is color communicating meaning rather than decoration?
- **Interaction:** Does every tap have obvious value? Is animation purposeful? Is motion under 400ms? Can every interaction be explained?
- **Narrative:** Does every sentence come from real data? Can every insight be explained? Is uncertainty acknowledged?
- **Product:** Does this screen answer one primary question? Is there one primary action? If I removed one component, would the screen improve?

## Pixel QA Scorecard (Target: 90+/100)
Before any React code is written, a responsive HTML prototype must pass this 100-point scorecard:
1. **Visual hierarchy (10):** Can I identify the Hero in under 2 seconds?
2. **Rhythm (10):** Are spacing intervals mathematically consistent?
3. **Typography (10):** Is there a clear reading order?
4. **Whitespace (10):** Does the interface breathe?
5. **Accessibility (10):** Keyboard, contrast, touch targets, reduced motion.
6. **Motion (10):** Nothing unnecessary. Nothing abrupt.
7. **Narrative (10):** Does every sentence sound human?
8. **Trust (10):** Can every number be explained?
9. **Responsiveness (10):** Nothing feels like a resized desktop.
10. **Emotional outcome (10):** Do I feel calmer after looking at the screen?

## Primitive Certification Checklist & Performance Gate
A primitive is only certified when it passes:
- **Purpose:** Answers one problem; clear when to use/not use.
- **Visual:** Balanced at all viewports; uses strictly approved tokens; no magic numbers.
- **Interaction:** Hover, Focus, Active, Disabled, Loading handled natively.
- **Accessibility:** Keyboard-only, WCAG contrast, reduced motion respected.
- **Engineering:** No duplicated styling, no hardcoded colors, no screen-specific logic, fully typed props.
- **Performance Gate:** Server Component by default, minimal JS, CSS-driven animation, zero layout shift.

## Component System Archetypes
Think in systems, not screens. Reuse these patterns across the app:
* **Hero Metrics**: Every screen has one dominant metric with luxurious whitespace.
* **Story Cards**: Narrative cards that explain change (e.g. "Highest in 8 months").
* **Action Cards**: Cards that end with a clear next step.
* **Insight Cards**: Cards with varying physical size based on severity and recommended action.
* **Journey Cards**: Cards showing progress over time with emotional resonance.

## Widget Architecture Rule
> **Every widget must justify its existence by answering a single user question. If two widgets answer the same question, they should be merged or redesigned.**

### Phase 9B Design Requirement
> **No Phase 9B screen redesign may begin until the Competitive UX Audit and Information Architecture deliverables are completed and formally critiqued by the Lead Product Designer (User). Every new screen must be composed entirely from approved design tokens and shared primitives, and must pass the Screen Acceptance Review.**
