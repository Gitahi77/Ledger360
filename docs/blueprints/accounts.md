# Phase 6C: Accounts Visual Blueprint & Interaction Contract

This document defines the layout, component hierarchy, and interaction rules for the Accounts domain, strictly consuming the `AccountsIntelligenceDTO`.

## 1. Layout Structure

### Desktop Experience
- **Header:** Features a large, reassuring display of the `totalPosition` in the user's reporting currency.
- **Data Freshness:** A subtle, tertiary indicator near the header showing `dataFreshness.lastUpdatedAt`.
- **Main Grid:** Desktop may use a single-column or two-column layout, provided the authoritative group order remains visually deterministic and understandable. It must not use a masonry algorithm that causes the semantic group sequence to become ambiguous.
- **Archived Section:** A visually subdued, collapsible section at the bottom for `archivedAccounts`.

### Mobile Experience (Strict Vertical Stack)
- **Top:** High-visibility `totalPosition`.
- **Health/Alerts:** Health attention is rendered contextually from each account's DTO-provided `health.status` and `health.message`. No aggregate health/attention list is derived in React.
- **Groups:** Rendered sequentially in a single column. Group labels are sticky headers.
- **Cards:** Compact `AccountCard` components optimized for touch.
- **Actions:** Mobile account actions use the standard `...` capability menu. Swipe gestures must not be required to discover or access an action.

## 2. Component Hierarchy & DTO Mapping

The UI is constructed from these domain-specific components:

- `AccountsClient` (The entry point, receives `AccountsIntelligenceDTO`)
  - `AccountsHeader`
    - Renders `dto.totalPosition`
    - Renders `dto.dataFreshness`
  - `AccountsOnboarding`
    - Rendered ONLY if `dto.domainState === 'onboarding'` (does NOT infer onboarding simply from zero balances).
    - Uses OS primitive `EmptyState`. The CTA connects to the existing `?action=new` account-creation flow.
  - `AccountGroupList`
    - Iterates over `dto.accountGroups` in exact provided order.
    - `AccountCard` (Iterates over `group.accounts`)
      - **Left:** Icon/Color based on `type`, Account `name`.
      - **Right:** `reportingBalance` (primary), `nativeBalance` (secondary, if different currency).
      - **Indicators:** Small visual badge for `health.status` (if not healthy), and an arrow/sparkline for `trajectory.direction`.
      - `AccountActionsMenu`
        - Consumes the `capabilities` block. Renders "Edit", "Archive", "Delete", or "Transfer" strictly if the respective boolean is `true`.
  - `ArchivedAccountsList`
    - Collapsible section iterating over `dto.archivedAccounts`.
    - Distinctly lower contrast to enforce visual separation from active liquidity.

## 3. Strict Interaction Rules (The Contract)

### Ordering & Grouping
- **Invariant:** React MUST NOT sort `accountGroups`. It iterates `dto.accountGroups` blindly.
- **Invariant:** React MUST NOT sort the accounts within a group. It iterates `group.accounts` blindly.

### Financial Formatting
- **Invariant:** Every monetary value must be passed through `formatCurrency()` from the finance layer. 
- **Invariant:** React performs zero currency conversions. If an account is native EUR and the reporting currency is KES, React displays both `nativeBalance` and `reportingBalance` as provided by the DTO.

### Trajectory & Health
- **Invariant:** React MUST NOT guess trends. If `trajectory.direction === 'unavailable'`, the trend indicator is hidden.
- **Invariant:** React MUST NOT flag an account as overdrawn simply by checking `< 0`. It must read `health.status === 'overdrawn'`, as some accounts (like credit cards) are expected to carry a negative native balance.

### Actions & Capabilities
- **Invariant:** The UI cannot hardcode a "Transfer" button. It must read `capabilities.canTransfer`. If false, the button does not exist in the DOM.
- **Invariant:** Destructive actions (`canDelete`, `canArchive`) must have appropriate confirmation/error handling behavior before triggering server actions.

### Freshness & Synchronization
- **Invariant:** React MUST NOT calculate `Date.now() - lastUpdatedAt` to infer staleness. It must strictly read `dataFreshness.status === 'stale'`.
- **Invariant:** A stale presentation does not imply a connection error unless explicitly provided by the backend (currently unsupported).

### URL State & Navigation
- **Invariant:** State must be URL-driven where appropriate: `?action=new` for the onboarding CTA, `?action=edit&accountId=...` for editing, and `?accountId=cuid` opens/selects the account detail state where supported.
- **Invariant:** No unnecessary dashboard-style local state or drawers are introduced if a URL-driven modal or page exists. Selection/detail state must remain restorable through the URL.

### OS Boundary Rule
- **Invariant:** Account-specific concepts (`AccountCard`, `AccountGroupList`) remain local to the `(dashboard)/accounts` route. They are NOT promoted to `src/components/os/` primitives merely because they are visually cohesive. We reuse global primitives (like `EmptyState`) but keep domain concepts isolated.

## 4. Coffee Shop Test Alignment
- **Where is my money?** -> Answered by reading the `AccountGroupList` headers.
- **How much in total?** -> Answered instantly by the `AccountsHeader` (Top left on desktop, Top center on mobile).
- **What needs attention?** -> Answered by `health.status` badges on specific cards.
- **Where to act?** -> Answered by the capability menu on the specific account.

## Verification Gate
Before proceeding to Phase 6D (Implementation), this blueprint must be approved. No React code will be written until the UX/UI mapping is finalized.
