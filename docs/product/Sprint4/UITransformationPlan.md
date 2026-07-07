# UI Transformation Masterplan

## 1. Executive Summary
This document synthesizes the work of Sprints 1–3 into a concrete, page-by-page UI redesign masterplan. No code will be written until this document is strictly adhered to. We focus on the two highest-impact surfaces: The Onboarding Flow and The Dashboard.

## 2. Page 1: Guided Onboarding (`/onboarding`)

- **Current issues**: Does not exist. Users drop into an empty, confusing state.
- **UX goals**: Capture user intent (budgeting vs. tracking) and establish a single connected account or initial balance within 3 taps.
- **Wireframe description**: A centered, narrow card (`max-w-md`). Three steps: "Welcome", "Connect your bank / Set manual balance", "What is your main goal?".
- **Information hierarchy**: Step Title (Hero) > Action Buttons (Primary) > "Skip for now" (Tertiary, small text).
- **Components required**: `WizardLayout`, `ProgressBar`, `FeatureSelectorCard`.
- **Responsive behaviour**: Centers horizontally/vertically on desktop. Pins to bottom on mobile.
- **Animation strategy**: Slide-fade between steps using Framer Motion (`initial={{opacity: 0, x: 20}}`).
- **Accessibility requirements**: Auto-focus the first input on step change. Focus trap inside the wizard.
- **Performance requirements**: < 200ms transitions. Prefetch dashboard data on step 2.
- **Dependencies**: None.
- **Acceptance criteria**: User cannot access `/dashboard` without completing or explicitly skipping onboarding.
- **Estimated effort**: 5 days (Frontend + State Management).

## 3. Page 2: The Command Dashboard (`/dashboard`)

- **Current issues**: Cluttered with redundant charts and overwhelming raw data tables.
- **UX goals**: Instant status check. Only display Net Worth, Monthly Flow, and recent actions.
- **Wireframe description**: Three distinct widgets. Top: Net Worth Hero (massive typography). Middle: Monthly Cashflow bar (Progressive, soft colors). Bottom: "Last 5 Transactions" minimal list.
- **Information hierarchy**: Net Worth > Cashflow Health > Recent Transactions.
- **Components required**: `NetWorthHero`, `CashflowBar`, `RecentTransactionsCard`, `IntegritySlideOut`.
- **Responsive behaviour**: Desktop shows 3 columns. Mobile stacks Net Worth, then Cashflow, then Transactions.
- **Animation strategy**: Numbers count up from 0 on first load. Cashflow bar fills from left to right.
- **Accessibility requirements**: Net Worth hero text must announce as an `h1`.
- **Performance requirements**: Cached via PWA Service Worker for < 100ms load.
- **Dependencies**: Sprint 1 PWA caching layer. Sprint 3 Semantic Tokens.
- **Acceptance criteria**: Visual footprint is 3 widgets maximum. No pagination or deep scrolling allowed.
- **Estimated effort**: 8 days.

## 4. Page 3: Transaction Hub (`/transactions`)

- **Current issues**: Mixes manual entry and M-Pesa parsing without cohesive flow. Blocking API calls.
- **UX goals**: Lightning-fast categorization and editing.
- **Wireframe description**: Full-screen sortable list. Hovering over a row exposes quick-edit (Category, Note). Floating Action Button (FAB) permanently pinned to bottom right.
- **Information hierarchy**: Merchant Name > Amount > Category > Date.
- **Components required**: `TransactionDataGrid`, `EditableCell`, `Fab`, `MpesaBottomSheet`.
- **Responsive behaviour**: Desktop is a full table. Mobile collapses into `ListItems` where Date and Category move to secondary text lines.
- **Animation strategy**: `useOptimistic` row highlighting on edit.
- **Accessibility requirements**: Arrow-key navigation across the grid.
- **Performance requirements**: Render up to 500 rows using CSS content-visibility or React windowing.
- **Dependencies**: Sprint 3 Optimistic UI hooks.
- **Acceptance criteria**: Categorization occurs with 0ms visual latency.
- **Estimated effort**: 7 days.

## 5. Product Design Council Review
- **Frontend Architect**: "React windowing for the Transaction Hub is mandatory. If we render 500 rows, the DOM will choke."
- **Behavioral Finance Specialist**: "The Net Worth Hero must not turn red if it dips slightly. Only show red if net worth is negative."
- **Final Decision**: Masterplan approved. Windowing will be used for transactions.

## 6. Engineering Requirements
- **REQ-MP-01**: Implement `framer-motion` for onboarding route transitions.
- **REQ-MP-02**: Utilize `@tanstack/react-virtual` for the `TransactionDataGrid`.
- **REQ-MP-03**: Force route interception for `/dashboard` if `user.onboarding_completed === false`.
