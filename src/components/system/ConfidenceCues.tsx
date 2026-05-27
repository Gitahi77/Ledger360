/**
 * Copyright (c) 2024–present Eric Gitahi. All rights reserved.
 * Ledger360 — Personal Financial Operating System
 * Proprietary and Confidential. Unauthorized use prohibited.
 */

/**
 * FinancialHealthBadge
 * Communicates the user's financial health state in a calm,
 * non-punitive way. Avoids alarming language.
 */

type HealthState = 'on-track' | 'needs-attention' | 'recovering';

interface FinancialHealthBadgeProps {
  savingRate: number;
  hasOverdueLoans?: boolean;
  budgetOverCount?: number;
}

const HEALTH_LABELS: Record<HealthState, string> = {
  'on-track':        'Your finances look healthy',
  'needs-attention': 'A few things to review',
  'recovering':      'Getting back on track',
};

function deriveHealthState(
  savingRate: number,
  hasOverdueLoans: boolean,
  budgetOverCount: number,
): HealthState {
  if (hasOverdueLoans || budgetOverCount >= 3) return 'needs-attention';
  if (savingRate >= 15 && budgetOverCount === 0)  return 'on-track';
  if (savingRate > 0)                             return 'recovering';
  return 'needs-attention';
}

export function FinancialHealthBadge({
  savingRate,
  hasOverdueLoans = false,
  budgetOverCount = 0,
}: FinancialHealthBadgeProps) {
  const state = deriveHealthState(savingRate, hasOverdueLoans, budgetOverCount);
  const label = HEALTH_LABELS[state];

  return (
    <span className={`health-badge ${state}`}>
      <span className="health-badge-dot" aria-hidden="true" />
      {label}
    </span>
  );
}


/**
 * SafeToSpend
 * Shows how much the user can spend today without jeopardising
 * their monthly savings goal. Calm, reassuring framing.
 */

import { Wallet } from 'lucide-react';

interface SafeToSpendProps {
  income: number;
  expenses: number;
  savingsGoal?: number; // target savings amount this month
}

export function SafeToSpend({
  income,
  expenses,
  savingsGoal = 0,
}: SafeToSpendProps) {
  const safeAmount = Math.max(0, income - expenses - savingsGoal);
  const formatted = new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(safeAmount);

  const message = safeAmount > 0
    ? 'available for discretionary spending'
    : 'You\'re within your essential budget';

  return (
    <div className="safe-to-spend">
      <div>
        <p className="safe-to-spend-label">Safe to Spend</p>
        <p className="safe-to-spend-value tabular" data-financial>{formatted}</p>
        <p className="safe-to-spend-sub">{message}</p>
      </div>
      <div className="safe-to-spend-icon" aria-hidden="true">
        <Wallet size={20} />
      </div>
    </div>
  );
}
