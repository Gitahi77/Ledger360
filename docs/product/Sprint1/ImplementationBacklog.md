# Sprint 1 Implementation Backlog

| ID | Title | Description | Priority | Dependencies | Est. Effort | Acceptance Criteria |
|---|---|---|---|---|---|---|
| **L360-101** | PWA Offline Support | Configure `next-pwa` and Service Workers to cache the Dashboard read model. | P1 | None | 3 pts | Offline refresh loads `/dashboard` in < 100ms. |
| **L360-102** | Dashboard Widget Constraint | Refactor `/dashboard` to accept a maximum of 3 widget slots. Remove all raw data tables. | P1 | None | 5 pts | Dashboard renders exactly 3 widgets. TTFB < 500ms. |
| **L360-103** | Semantic Color Tokens | Update `tailwind.config.ts` with `--color-neutral-expense` and `--color-hero-balance`. Remove pure reds for expected expenses. | P2 | None | 2 pts | Expenses render in neutral tones. WCAG AA contrast met. |
| **L360-104** | FAB Touch Targets | Standardize all mobile action buttons (e.g., "Add Transaction") to min 48x48dp. | P1 | None | 1 pt | Lighthouse Accessibility score > 98. |
| **L360-105** | Integrity Slide-Out Hook | Build the `useLedgerReplay` hook to fetch the derivation of any balance. | P2 | Phase 2D+ ReplayService | 5 pts | Hook returns array of ledger transactions summing to exact balance. |
| **L360-106** | Soft Allocation Engine | Update Budget domain to allow over-allocation, emitting a `WARN` domain state instead of throwing an error. | P3 | Phase 2E | 3 pts | Budgets accept overages; API returns HTTP 200 with `warning` metadata. |

## Definition of Done
- TypeScript compiles without warnings.
- Unit tests cover all acceptance criteria.
- Design tokens applied natively without inline styles.
- PR approved by Product Council simulation.
