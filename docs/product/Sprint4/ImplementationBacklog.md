# Sprint 4 Implementation Backlog

| ID | Title | Description | Priority | Dependencies | Est. Effort | Acceptance Criteria |
|---|---|---|---|---|---|---|
| **L360-401** | UI Component Factory | Scaffold `NetWorthHero`, `CashflowBar`, and `EmptyState` using Sprint 3 tokens. | P1 | Sprint 3 | 3 pts | Components exist in Storybook/catalog with passing accessibility tests. |
| **L360-402** | The Onboarding Wizard | Build the `/onboarding` route with Framer Motion transitions and focus trapping. | P1 | L360-401 | 5 pts | Wizard routes natively, captures state, and correctly flags user as onboarded. |
| **L360-403** | The Command Dashboard | Refactor `/dashboard` to remove charts and mount the 3 core widgets. | P1 | Sprint 1 PWA | 5 pts | Page loads in < 100ms offline. Only 3 widgets present. |
| **L360-404** | Transaction Data Grid | Implement `@tanstack/react-virtual` list for `/transactions`. | P2 | None | 4 pts | List scrolls 500+ items cleanly at 60fps. |
| **L360-405** | Integrity Slide-Out Integration | Connect the `useLedgerReplay` hook (Sprint 1) to the Net Worth Hero on click. | P2 | L360-105 | 3 pts | Clicking Net Worth opens a right-side drawer detailing the exact derivation. |

## Definition of Done
- All Sprints 1-4 completed.
- Code merged to `main`.
- Product Design Council final sign-off.
- Zero accessibility regressions.
