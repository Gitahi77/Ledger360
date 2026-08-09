# Product Brief: Dashboard

## 1. The Job of the Dashboard
The Dashboard is the financial cockpit of Ledger360. 
Its primary job is to answer the question: **"What needs my attention right now?"** 
It does not exist to provide deep historical analysis, granular transaction lists, or detailed budget tracking. It exists to synthesize the health of all domains into immediate, actionable intelligence.

## 2. Questions the Dashboard Must Answer
The information hierarchy and metrics shown on the Dashboard must directly answer these questions:
1. **Where do I stand right now?** (Current liquidity and net worth snapshot)
2. **Is my financial position healthy or deteriorating?** (Trajectory over the last 30 days)
3. **What changed recently?** (Key anomalies, large deposits, or unexpected expenses)
4. **What requires my attention?** (Over-budget warnings, upcoming large bills, low balances)
5. **What financial obligation is coming next?** (Upcoming recurring transfers/subscriptions)
6. **Am I on track with the plans I've made?** (Overall goal/budget pacing)
7. **What is the single most useful action I can take right now?** (Intelligence Engine recommendations)

## 3. Information Hierarchy (Top to Bottom)
1. **The Briefing (Hero Section):** A natural-language or highly concise summary of the user's immediate state. Must communicate **both financial capacity (Safe to Spend) and immediate risk (Attention Items)**, with the Intelligence Engine prioritizing whichever requires more urgency.
2. **Immediate Action Required (Advisory):** Critical intelligence alerts (e.g., overdraft risks, large outlier expenses). Hidden if zero.
3. **The Vital Signs (Metrics):** 4 high-level metrics (e.g., Total Cash, 30-Day Flow, Current Budget Burn Rate, Month-to-Date Savings).
4. **The Radar (Upcoming):** Anticipated near-term events (upcoming bills, incoming paychecks).
5. **Domain Summaries (Optional):** High-level health cards for connected domains (Accounts, Budgets, Goals).

## 4. The Coffee Shop Test
A user opens the Dashboard while waiting in line for coffee. Within **5 seconds**, they must be able to determine:
- **Am I safe to spend?** 
- **Is anything broken or demanding action?**
If they have to scroll, calculate, or interpret complex charts to answer these two questions, the design fails.

> **Guardrail: "Safe to Spend" Definition**
> The Dashboard must never infer financial safety from raw balances. If Ledger360 presents a "safe to spend" assessment, that assessment must be explicitly calculated and returned by the Intelligence/Domain layer (with its reasoning and confidence/context). It may mean available cash after known obligations, budget headroom, or discretionary cash, but it must be mathematically proven by the backend, not guessed by the frontend.

## 5. Desktop vs. Mobile Behavior
- **Desktop:** The cockpit leverages the wide viewport for a multi-column layout, perhaps showing the Radar and Vital Signs concurrently. 
- **Mobile:** The hierarchy must be strictly vertical. The "Immediate Action" advisory and "The Briefing" are pinned to the top. Domain summaries are compressed into scroll-snap cards.

## 6. The "Do Not Put Here" Boundary (Anti-Creep)
To maintain the Dashboard's focus, the following are strictly prohibited:
- **Detailed Historical Analysis:** Belongs in `Reports`.
- **Transaction Exploration/Lists:** Belongs in `Transactions`.
- **Account-Level Management/Reconciliation:** Belongs in `Accounts`.
- **Detailed Category Analysis:** Belongs in `Categories`.
- **Detailed Budget Management:** Belongs in `Budgets`.
- **Detailed Goal Management:** Belongs in `Goals`.
- **Detailed Loan Management:** Belongs in `Loans`.

*The Dashboard summarizes these domains; it does not replace them.*

## 7. DTO & Intelligence Requirements (Backend Contract)
To power this cockpit, the `DashboardIntelligenceDTO` must synthesize financial meaning, not UI components. It should be defined around domain facts:

```typescript
export type DashboardIntelligenceDTO = {
  // Global state
  dashboardState: 'ready' | 'onboarding' | 'partial';

  // 1. Where do I stand? (Source: Accounts)
  currentPosition: {
    totalCashMinor: number;
    currency: string; // Guaranteed by the Intelligence Engine to be the user's normalized reporting currency
  };

  dataFreshness: {
    status: 'fresh' | 'stale'; // Backend determines staleness (e.g., >24h sync delay)
    lastUpdated: string; // ISO-8601
  };

  // Guardrail: Safe to Spend (Source: Intelligence Engine)
  safeToSpend: {
    amountMinor: number | null; // null if uncalculatable (e.g., missing history)
    currency: string;
    status: 'available' | 'insufficient_data' | 'stale';
    reasoning: string; // Explains the math to the user (Trust Layer)
  };

  // 2. Is it healthy? (Source: Transactions)
  trajectory: {
    netFlow30DaysMinor: number;
    trend: 'improving' | 'stable' | 'deteriorating';
  };

  // Vital Signs Metrics (Source: Aggregated by Orchestrator)
  // Must provide 4 explicit KPIs for the 2x2 grid.
  vitalSigns: {
    totalCashMinor: number;
    netFlow30DaysMinor: number;
    burnRatePercentage: number | null;
    monthToDateSavingsMinor: number | null;
  };

  // 3, 4 & 7. Attention & Action (Source: Orchestrator)
  // MUST BE GUARANTEED: Returned in descending priority order. index[0] is the most urgent.
  // GUARDRAIL: The frontend must render the supplied order and must not re-sort, score, merge, or reinterpret attention items.
  attentionItems: Array<{
    id: string;
    severity: 'critical' | 'warning' | 'info';
    message: string;
    domainSource: 'budgets' | 'accounts' | 'transactions' | 'loans';
    actionableLink?: string; // Deep-link to resolve the issue
  }>;

  // 5. What's next? (Source: Orchestrator / Transactions)
  upcomingObligations: Array<{
    id: string;
    dueDate: string; // ISO-8601
    amountMinor: number;
    merchantName: string;
    confidencePercentage: number; // 0-100
  }>;

  // 6. Am I on track? (Source: Budgets & Goals)
  planHealth: {
    activeBudgetsCount: number;
    budgetsOnTrack: number;
    overallPacingPercentage: number; // e.g., 85 (meaning 15% under budget)
  } | null; // null if user hasn't set up planning features

  // The Hero Briefing
  briefing: {
    greeting: string;
    primaryInsight: string;
  };
};
```
