# Competitive Product Analysis

## 1. Executive Summary
An exhaustive teardown of Monarch, M-Pesa, Revolut, Nubank, YNAB, Google Wallet, Wise, and Splitwise to extract product philosophies. The goal is to benchmark excellence without copying interfaces, distilling these insights into actionable "Adopt, Adapt, Avoid" classifications for Ledger360.

## 2. Research
- **Monarch**: High-trust, calm visual hierarchy. Focuses heavily on passive cashflow insights.
- **M-Pesa**: The gold standard for reliability. USSD menus proved that low-latency, high-contrast typography trumps complex UIs.
- **Revolut / Nubank**: High-speed Neobanks. Instant notifications, rich categorization, but Revolut suffers from severe feature bloat (crypto, trading, etc.).
- **YNAB**: Exceptional financial clarity through strict zero-based budgeting, but steep learning curve causes early abandonment.

## 3. Findings
- **Problem**: Ledger360 currently lacks a distinct budgeting philosophy (unlike YNAB) and lacks the visual calm of Monarch.
- **Severity**: High. A finance app without an opinion becomes a generic spreadsheet.

## 4. Recommendations & Classification

### ADOPT
- **M-Pesa's Reliability Constraints**: The app must feel unbreakable. If offline, the app must still load cached net worth instantly (Service Workers). 
- **Nubank's Typography**: Large, bold, unapologetic typography for the primary balance.
- **Monarch's Calm Color Palette**: Eliminate harsh neons. Use deep forest greens, slates, and muted blues.

### ADAPT
- **YNAB's Allocation System**: Instead of strict zero-based budgeting which creates friction, adapt it to a "Soft Allocation" model. Unassigned money is grouped, but not penalized.
- **Splitwise's Shared Finance**: Adapt their math engine for Ledger360's future "Household" module, but avoid their overly casual UX.

### AVOID
- **Revolut's Feature Bloat**: Avoid carousels advertising new banking products, crypto, or unrelated up-sells.
- **Monarch's Complex Setup**: Avoid requiring 15 minutes of Bank Syncing before the user sees value.

### ORIGINAL LEDGER360
- **The Integrity Slide-Out**: Neither Monarch nor Neobanks prove their math to the user. Ledger360 will allow users to right-click any balance and see the exact ledger entries that sum to that number.

## 5. Product Design Council Review
- **Senior UX Researcher**: "YNAB's friction is a feature, not a bug, for their specific audience. If we use soft allocations, we must still clearly warn when budgets are exceeded."
- **Visual Design Director**: "Nubank's typography works because their UI is extremely sparse. We must heavily restrict dashboard elements to pull this off."
- **Final Decision**: Adopt the calm palette and sparse typography. Budgeting will use Soft Allocation (warn, don't block). 

## 6. Engineering Requirements
- **REQ-CA-01**: Implement a PWA Service Worker to cache the `DashboardSummary` query, enabling instant offline loads.
- **REQ-CA-02**: Typography system must establish a `Display-Hero` token reserved exclusively for the Total Net Worth.
- **REQ-CA-03**: Budgets must allow `allocated_amount > available_funds` but return a `WARN` flag to the UI.

## 7. Acceptance Criteria
- App scores 100 on Lighthouse PWA audit.
- Offline refresh returns cached Net Worth within 100ms.
