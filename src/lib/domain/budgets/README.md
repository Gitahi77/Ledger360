# Ledger360 Budget Domain Contract

This document defines the boundaries, responsibilities, and formulas for the Budget Domain.
It serves as the contract for Stage 5 and beyond.

## Core Principle
**What may NOT be calculated inside UI components:**
- Effective limits or rollovers
- Spent percentages or pacing
- Health scores
- Status classifications (e.g., "healthy", "warning")
- Safe-to-spend values

UI components must act as pure visualization layers that map domain models to CSS classes and text strings. All financial calculations must occur in `src/lib/domain/calculators/budget-engine.ts` (or equivalent domain modules) and be exposed via the query/repository layer.

---

## 1. Budget Lifecycle
1. **Creation**: A budget is created for a specific category and period (weekly, monthly, yearly).
2. **Evaluation**: Budgets are continuously evaluated against spending transactions for the current period.
3. **Rollover (Strict Envelope)**: If rollover is enabled, any unspent amount from previous periods (since budget creation) is added to the current period's limit.
4. **Archival/Deletion**: Deleting a budget stops tracking, but historical spending remains in transactions.

## 2. Budget Engine Responsibilities
- Calculate effective limits (including rollovers).
- Determine budget status thresholds.
- Compute pacing (spend vs. elapsed time).
- Calculate portfolio-level health scores.
- Calculate safe-to-spend metrics based on aggregate budget behavior.

## 3. Core Formulas

### Pacing Formula
Calculates whether spending is ahead of or behind the elapsed time in the period.
```
PercentTimeElapsed = (Now - PeriodStart) / (PeriodEnd - PeriodStart)
ExpectedSpend = PercentTimeElapsed
PacingVariancePercent = PercentageSpent - ExpectedSpend

If PacingVariancePercent > 5% and PercentageSpent > 0:
    Status = "Ahead of Schedule" (Bad)
Else if PacingVariancePercent < 0:
    Status = "Behind Schedule" (Good)
```

### Health Score Formula
Calculates a portfolio health score (0-100) based on size-weighted limits.
```
TotalWeight = Sum(MAX(Limit, 100000))
TotalDeduction = 0

For each budget:
    If Exceeded: Deduction += 1.0 * Weight
    If Critical: Deduction += 0.8 * Weight
    If Warning:  Deduction += 0.4 * Weight
    If Ahead of Schedule: Deduction += 0.2 * Weight

HealthScore = 100 - ((TotalDeduction / TotalWeight) * 100)
```

### Safe-to-Spend Formula
Calculates uncommitted, unspent disposable income for the current budget period.
```
Income = Total income for the period
TotalBudgeted = Sum of all active budget limits (including rollovers)
TotalBudgetSpend = Sum of spend across all tracked budgets
TotalUncategorizedSpend = Total expenses NOT covered by any budget

CommittedFunds = TotalBudgeted - TotalBudgetSpend
TotalRemaining = Income - (TotalBudgetSpend + TotalUncategorizedSpend)

SafeToSpend = TotalRemaining - CommittedFunds
(Floor at 0)
```
*Note: Transfers are excluded from all income/expense calculations unless explicitly categorized.*
