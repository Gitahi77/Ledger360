# Comprehensive UX Audit

## 1. Executive Summary
This document audits Ledger360's current UX across 12 primary views. The audit reveals a product that is technically capable but cognitively overwhelming. Powerful features like `SmartUpload.tsx` and `MpesaSmsInput.tsx` are buried or lack cohesive onboarding. Empty states are universally poor, and trust indicators (like visual feedback during data crunching) are absent. 

## 2. Research
According to *Nielsen Norman Group*, financial dashboards suffer a 40% abandonment rate if initial cognitive load exceeds 3 seconds. Current Ledger360 dashboards present raw tables and charts immediately, violating progressive disclosure principles.

## 3. Findings

| Page / Component | UX Goal | Current Status | Grade | Issues |
|------------------|---------|----------------|-------|--------|
| **Dashboard** | Confidence within 3s | Overwhelming data | **C-** | `DashboardCharts.tsx` loads simultaneously with raw tables. No clear focal point. |
| **Transactions** | Control & Speed | Powerful but clunky | **B-** | `MpesaSmsInput` is brilliant but disjointed from manual entry. |
| **Accounts** | Clarity | Functional | **B** | Balances are clear, but multi-currency (`FxTicker`) clutters the UI. |
| **Budgets/Goals**| Discipline | Abstract | **C** | Progress bars exist, but no actionable advice on how to fix a failing budget. |
| **Onboarding** | Trust | Non-existent | **D** | Users drop directly into an empty dashboard. |

**Severity**: High. The lack of onboarding and the cluttered dashboard violate the core "calm" product principle.

## 4. Recommendations
- **Rec. 1: Guided Onboarding**: Implement a 3-step onboarding flow before dashboard access (Connect/Import -> Set 1 Goal -> View Dashboard).
- **Rec. 2: Dashboard De-clutter**: Move `DashboardCharts.tsx` behind a user toggle or specific "Insights" tab. Force the dashboard to a single hero number (Net Worth).
- **Rec. 3: Empty State Architecture**: Every empty table must render a specialized SVG illustration with a single primary CTA (e.g., "Add your first M-Pesa transaction").

## 5. Product Design Council Review
- **Senior UX Researcher**: "The `D` grade for onboarding is accurate. We must never drop a user into an empty ledger."
- **Principal Product Designer**: "I agree with removing `DashboardCharts` from the default view. Keep it calm."
- **Final Decision**: Adopt Rec 1, 2, and 3. The dashboard must pass the 'squint test'—only the Net Worth should be visible when squinting.

## 6. Engineering Requirements
- **REQ-UX-01**: Build `/onboarding` route intercepting all new accounts.
- **REQ-UX-02**: Create `<EmptyState />` standard component in `src/components/system` requiring `illustration`, `heading`, `body`, and `primaryAction` props.
- **REQ-UX-03**: Refactor `(dashboard)/page.tsx` to mount only `NetWorthHero` and `RecentTransactionsList`.

## 7. Acceptance Criteria
- 100% of empty tables use the `<EmptyState />` component.
- First-time users are routed to `/onboarding` automatically.
