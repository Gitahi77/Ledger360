# Sprint 3 Implementation Backlog

| ID | Title | Description | Priority | Dependencies | Est. Effort | Acceptance Criteria |
|---|---|---|---|---|---|---|
| **L360-301** | Global CSS Tokens | Migrate `globals.css` to strict semantic Tailwind variables (`--color-surface`, `--color-finance-positive`). | P1 | None | 2 pts | `globals.css` updated; Tailwind config fully maps semantic variables. |
| **L360-302** | Borderless Architecture | Remove `border` classes from layout containers and replace with `shadow-sm` and padding. | P2 | L360-301 | 3 pts | Primary cards rely on elevation, not borders. |
| **L360-303** | Optimistic Metadata Hook | Implement `useOptimistic` for transaction category updating. | P1 | None | 3 pts | Category updates reflect instantly in the UI without waiting for DB. |
| **L360-304** | Global Action Shortcuts | Bind `/` to search and `T` to new transaction using `react-hotkeys-hook`. | P2 | None | 2 pts | Pressing `T` opens the transaction modal globally <100ms. |
| **L360-305** | Granular Skeleton Replacement | Audit and replace all `<Spinner>` usage with specialized `<Skeleton>` matching bounding boxes. | P2 | None | 4 pts | No full-page spinners exist for partial data loads. |

## Definition of Done
- Strict adherence to semantic variables (no hardcoded tailwind colors in components).
- Keyboard shortcuts accessible and discoverable.
- PDC final sign-off.
