# Sprint 2 Implementation Backlog

| ID | Title | Description | Priority | Dependencies | Est. Effort | Acceptance Criteria |
|---|---|---|---|---|---|---|
| **L360-201** | Standardized Empty States | Build `<EmptyState />` component and apply it to Transactions, Accounts, and Goals lists. | P1 | None | 2 pts | Empty state renders graphic, description, and primary CTA. |
| **L360-202** | Guided Onboarding Flow | Build `/onboarding` wizard (Welcome -> Connect -> Goal). Route new users here automatically. | P1 | None | 5 pts | New users cannot access `/dashboard` until `onboarded` flag is true. |
| **L360-203** | M-Pesa Parser UX | Add `isParsing` skeleton animation to `MpesaSmsInput.tsx`. | P2 | None | 2 pts | UI visually transitions from "Pasting" -> "Extracting" -> "Confirm". |
| **L360-204** | Global Success Toasts | Integrate accessible toast notifications for all major CRUD actions. | P2 | None | 1 pt | Saving a transaction fires a green toast with screen-reader `aria-live` announcement. |
| **L360-205** | Dashboard De-clutter | Remove `DashboardCharts.tsx` from root `/dashboard`. Add NetWorth Hero. | P1 | Sprint 1 | 3 pts | Dashboard visual footprint reduced by 60%. |
| **L360-206** | Historical Budget Suggestions | Create `/api/budgets/suggest` to average last 90 days of category spend. | P3 | None | 3 pts | UI "Auto-fill" button populates budget form within 500ms. |

## Definition of Done
- Engineering requirements fully met.
- Acceptance criteria verified via automated tests (Playwright/Jest).
- UX meets WCAG AA standards.
- PDC final sign-off.
