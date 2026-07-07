# Product Experience Architecture

## 1. Executive Summary
Ledger360 is transitioning from a backend engine to a world-class personal finance product. This foundation establishes Ledger360 as a "calm personal financial operating system." The objective is not novelty, but radical clarity. We establish strict boundaries for information hierarchy, cognitive load, and emotional response, ensuring every screen reduces financial anxiety and accelerates user confidence.

## 2. Research
**Behavioral Finance**: Users exhibit high cognitive load and anxiety when confronted with dense financial tables (source: *The Psychology of Money*).
**UX Principles**: Progressive disclosure is mandatory. Dashboards should answer "What is my status?" instantly, hiding granular ledgers behind a secondary click. 
**Mobile Patterns**: 80% of financial inputs occur on mobile devices during micro-moments. Actions must require one hand and < 250ms latency.

## 3. Findings
- **Problem**: The current Next.js CRUD UI lacks hierarchy. Users are presented with raw databases rather than insights.
- **Severity**: Critical. High cognitive load destroys retention.
- **Evidence**: Existing pages surface all transactions and all columns simultaneously without filtering or contextual summarization.

## 4. Recommendations
- **Rec. 1: Zero-Friction Entry**: Optimize the "Add Transaction" flow for one-handed, 3-tap completion. (Impact: massive trust/speed gain. Priority: High).
- **Rec. 2: Progressive Disclosure Dashboards**: The dashboard must only show Net Worth, Monthly Cashflow, and 5 Recent Transactions. (Impact: Usability. Priority: High).
- **Rec. 3: Absolute Explanation**: Every derived balance must be clickable, opening a "Ledger Replay" slide-out proving the math. (Impact: Trust. Priority: High).

## 5. Product Design Council Review
- **Principal Product Designer**: "Dashboard needs to breathe. Let's enforce a 3-widget maximum."
- **Behavioral Finance Specialist**: "We must avoid 'red' numbers for expected expenses. Red induces panic. Use neutral colors for planned spend."
- **Accessibility Specialist**: "Touch targets for the FAB (Floating Action Button) must be 48x48dp minimum."
- **Final Decision**: Adopt Rec 1, 2, and 3. Red colors are reserved *only* for overdrafts or missed goals. Planned expenses use a calm slate or dark monochrome.
- **Risks**: Oversimplifying the dashboard might alienate power users. 
- **Mitigation**: Power users can toggle an "Advanced Table View" on secondary pages.

## 6. Engineering Requirements
- **REQ-PF-01**: The Dashboard page (`/dashboard`) must limit data fetching to `net_worth_snapshot`, `monthly_summary`, and `limit 5` recent transactions.
- **REQ-PF-02**: All negative monetary values expected by a budget must render using CSS variable `--color-neutral-expense`, not `--color-error-red`.
- **REQ-PF-03**: Floating action buttons must have `min-height: 48px` and `min-width: 48px`.

## 7. Acceptance Criteria
- Dashboard TTFB < 500ms.
- Dashboard renders exactly 3 primary widgets.
- Color contrast for all financial text meets WCAG AA (4.5:1).
