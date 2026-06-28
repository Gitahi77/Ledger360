// src/lib/intelligence.ts
// AI-like financial insight engine.
// Key fixes vs. previous version:
//  1. Month keys are year-aware (YYYY-M) — prevents Jan 2024 + Jan 2025 merging
//  2. Anomaly detection keys by categoryId not name — safe against renames
//  3. Recurring bill detection is case-insensitive
//  4. Cashflow forecast shows even when income = 0 (expense-only warning)
//  5. Category currency uses the user's currency from session (passed in)
import { prisma } from './prisma';
import {
  startOfMonth, subMonths, getDate, getDaysInMonth,
} from 'date-fns';
import { getLoansForUser } from './queries/loans';
import { toMajor } from '@/lib/money';
import type { Transaction, Category, Goal, Transfer } from '@prisma/client';

export type Insight = {
  id: string;
  type: 'anomaly' | 'recurring' | 'forecast' | 'achievement' | 'info' | 'endowment' | 'fresh-start';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success' | 'danger';
};

/** Year-aware month key — YYYY-M — prevents cross-year bucket collisions. */
function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

export async function generateInsights(userId: string, currency = 'KES'): Promise<Insight[]> {
  const prefs = await prisma.userPreferences.findUnique({ where: { userId } });
  const insights: Insight[] = [];
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const threeMonthsAgo = subMonths(thisMonthStart, 3);

  // 1. Fetch last 3 months of transactions
  const transactions: (Transaction & { category: Category })[] = await prisma.transaction.findMany({
    where: { userId, date: { gte: threeMonthsAgo } },
    include: { category: true },
    orderBy: { date: 'asc' },
  });

  if (transactions.length < 5) {
    return [{
      id: 'not-enough-data',
      type: 'info',
      title: 'Still learning your patterns…',
      description: 'Add a few more transactions and your AI insights will start appearing here.',
      severity: 'info',
    }];
  }

  const currentMonthTx = transactions.filter(t => t.date >= thisMonthStart);
  const pastMonthsTx   = transactions.filter(t => t.date <  thisMonthStart);

  // -- ACTIVE GOALS (For Anomalies & Goal Progress) ---------------------------
  let activeGoals: (Goal & { transfers: Transfer[] })[] = [];
  if (prefs?.notifGoals !== false) {
    activeGoals = await prisma.goal.findMany({ 
      where: { userId, targetAmountMinor: { gt: 0 } },
      include: { transfers: true } 
    });
  }
  
  const incompleteGoals = activeGoals.filter(g => {
    const currentAmountMinor = g.transfers.reduce((sum, t) => sum + Number(t.baseAmountMinor), 0);
    return currentAmountMinor < g.targetAmountMinor;
  });
  const topGoal = incompleteGoals[0] || null;

  // -- ENDOWMENT FRAMING (MONEY KEPT) -----------------------------------------
  const transfersThisMonth = await prisma.transfer.findMany({
    where: {
      userId,
      date: { gte: thisMonthStart },
      loanId: null,
      OR: [
        { goalId: { not: null } },
        { toAccount: { type: { in: ['SAVINGS', 'BROKERAGE', 'CRYPTO', 'SACCO_DEPOSIT'] } } }
      ]
    },
    include: { toAccount: true }
  });
  
  const savedThisMonthMinor = transfersThisMonth.reduce((acc, t) => acc + Number(t.baseAmountMinor), 0);
  if (savedThisMonthMinor > 0) {
    insights.push({
      id: 'endowment-money-kept',
      type: 'endowment',
      title: 'Money kept this month',
      description: `You've successfully secured ${currency} ${Math.round(toMajor(savedThisMonthMinor)).toLocaleString()} for yourself this month. That's real money kept for your future.`,
      severity: 'success',
    });
  }

  // -- FRESH START ------------------------------------------------------------
  if (getDate(now) <= 5) {
    const previousMonthStart = subMonths(thisMonthStart, 1);
    const lastMonthTx = pastMonthsTx.filter(t => t.date >= previousMonthStart && t.date < thisMonthStart);
    
    if (lastMonthTx.length > 0) {
      const lastMonthByCategory: Record<string, { totalAmt: number; name: string }> = {};
      lastMonthTx.filter(t => t.type === 'expense').forEach(t => {
        if (!lastMonthByCategory[t.categoryId]) {
          lastMonthByCategory[t.categoryId] = { totalAmt: 0, name: t.category.name };
        }
        lastMonthByCategory[t.categoryId].totalAmt += Number(t.baseAmountMinor);
      });

      const essentialRegex = /\b(rent|housing|mortgage|utility|utilities|electricity|water|loan|debt|health|medical|hospital|education|school|tuition|fees|insurance|sha|nhif|nssf)\b/i;

      let topDiscretionary = null;
      let maxAmt = 0;
      for (const [catId, cat] of Object.entries(lastMonthByCategory)) {
        if (!essentialRegex.test(cat.name) && cat.totalAmt > maxAmt) {
          maxAmt = cat.totalAmt;
          topDiscretionary = cat;
        }
      }

      if (topDiscretionary && maxAmt > 0) {
        insights.push({
          id: 'fresh-start',
          type: 'fresh-start',
          title: 'A fresh start',
          description: `It's a new month! Last month, your largest expense was ${topDiscretionary.name} at ${currency} ${Math.round(toMajor(maxAmt)).toLocaleString()}. Could you find a small way to reduce that this month?`,
          severity: 'info',
        });
      } else {
        insights.push({
          id: 'fresh-start-soft',
          type: 'fresh-start',
          title: 'A fresh start',
          description: `It's a new month! A great time to review your upcoming expenses and stay on top of your financial goals.`,
          severity: 'info',
        });
      }
    }
  }

  // -- SMALL LEAKS (WO-17) ----------------------------------------------------
  const SMALL_LEAK_LIMIT_MINOR = 50000;      // Max 500 major units per tx
  const SMALL_LEAK_MIN_COUNT = 5;            // At least 5 transactions
  const SMALL_LEAK_MIN_TOTAL_MINOR = 150000; // Total must be >= 1500 major units

  const currentMonthExpenses = currentMonthTx.filter(t => t.type === 'expense');
  const smallTxByCategory: Record<string, { count: number; totalAmt: number; name: string }> = {};

  currentMonthExpenses.forEach(t => {
    if (t.baseAmountMinor <= SMALL_LEAK_LIMIT_MINOR) {
      if (!smallTxByCategory[t.categoryId]) {
        smallTxByCategory[t.categoryId] = { count: 0, totalAmt: 0, name: t.category.name };
      }
      smallTxByCategory[t.categoryId].count += 1;
      smallTxByCategory[t.categoryId].totalAmt += Number(t.baseAmountMinor);
    }
  });

  for (const [catId, leak] of Object.entries(smallTxByCategory)) {
    if (leak.count >= SMALL_LEAK_MIN_COUNT && leak.totalAmt >= SMALL_LEAK_MIN_TOTAL_MINOR) {
      insights.push({
        id: `small-leaks-${catId}`,
        type: 'info',
        title: 'Frequent small expenses',
        description: `You made ${leak.count} small ${leak.name} purchases this month totaling ${currency} ${Math.round(toMajor(leak.totalAmt)).toLocaleString()}.`,
        severity: 'info',
      });
    }
  }

  // -- ANOMALY DETECTION ------------------------------------------------------
  // Key by categoryId (stable) instead of category name (can be renamed).
  // Track which months each category had spend so the average is per-month.
  const pastByCategory: Record<string, { totalAmt: number; months: Set<string> }> = {};
  pastMonthsTx.filter(t => t.type === 'expense').forEach(t => {
    if (!pastByCategory[t.categoryId]) {
      pastByCategory[t.categoryId] = { totalAmt: 0, months: new Set() };
    }
    pastByCategory[t.categoryId].totalAmt += Number(t.baseAmountMinor);
    pastByCategory[t.categoryId].months.add(monthKey(t.date));
  });

  const currentByCategory: Record<string, { totalAmt: number; name: string }> = {};
  currentMonthTx.filter(t => t.type === 'expense').forEach(t => {
    if (!currentByCategory[t.categoryId]) {
      currentByCategory[t.categoryId] = { totalAmt: 0, name: t.category.name };
    }
    currentByCategory[t.categoryId].totalAmt += Number(t.baseAmountMinor);
  });

  for (const [catId, current] of Object.entries(currentByCategory)) {
    if (prefs?.notifOverbudget === false) break;
    const past = pastByCategory[catId];
    if (!past || past.months.size === 0) continue;
    const avgMonthlySpend = past.totalAmt / past.months.size;
    if (avgMonthlySpend > 1000) {
      const ratio = current.totalAmt / avgMonthlySpend;
      if (ratio > 1.4) {
        const pct = Math.round((ratio - 1) * 100);
        const overspend = current.totalAmt - avgMonthlySpend;
        let description = `Your ${current.name} spending is ${pct}% above your typical monthly average.`;
        
        if (topGoal && overspend >= 0.01 * Number(topGoal.targetAmountMinor)) {
          const goalPct = Math.round((overspend / Number(topGoal.targetAmountMinor)) * 100);
          description += ` That difference is about ${goalPct}% of your ${topGoal.name} target.`;
        }

        insights.push({
          id:          `anomaly-${catId}`,
          type:        'anomaly',
          title:       'Higher than usual',
          description,
          severity:    'warning',
        });
      }
    }
  }

  // -- RECURRING BILL DETECTION -----------------------------------------------
  // Case-insensitive name matching so "Netflix" and "NETFLIX" are the same bill.
  const pastExpenses = pastMonthsTx.filter(t => t.type === 'expense');
  const nameGroups: Record<string, typeof pastExpenses> = {};
  pastExpenses.forEach(t => {
    const key = t.name.trim().toLowerCase();
    if (!nameGroups[key]) nameGroups[key] = [];
    nameGroups[key].push(t);
  });

  for (const [nameKey, matches] of Object.entries(nameGroups)) {
    if (prefs?.notifBills === false) break;
    // Must appear in at least 2 distinct months to be considered recurring
    const distinctMonths = new Set(matches.map(t => monthKey(t.date)));
    if (distinctMonths.size < 2) continue;

    // Check if it's already been paid this month (case-insensitive)
    const paidThisMonth = currentMonthTx.some(t =>
      t.name.trim().toLowerCase() === nameKey
    );
    if (paidThisMonth) continue;

    // Predict by average day-of-month
    const avgDate = Math.round(matches.reduce((acc, t) => acc + getDate(t.date), 0) / matches.length);
    const todayDate = getDate(now);

    if (todayDate >= avgDate - 5 && todayDate <= avgDate + 5) {
      const avgAmountMinor = matches.reduce((acc, t) => acc + Number(t.baseAmountMinor), 0) / matches.length;
      const displayName = matches[0].name; // use original casing for display
      insights.push({
        id:          `recurring-${nameKey}`,
        type:        'recurring',
        title:       'Upcoming recurring payment',
        description: `"${displayName}" usually arrives around the ${avgDate}th (~${currency} ${Math.round(toMajor(avgAmountMinor)).toLocaleString()}).`,
        severity:    'info',
      });
    }
  }

  // -- CASHFLOW FORECAST ------------------------------------------------------
  // Show expense-side warning even when income = 0 (e.g. student / new user).
  const currentIncomeMinor  = currentMonthTx.filter(t => t.type === 'income').reduce((a, b) => a + Number(b.baseAmountMinor), 0);
  const currentExpenseMinor = currentMonthTx.filter(t => t.type === 'expense').reduce((a, b) => a + Number(b.baseAmountMinor), 0);

  const daysPassed     = Math.max(getDate(now), 1);
  const daysInMonth    = getDaysInMonth(now);
  const dailyBurnRateMinor  = currentExpenseMinor / daysPassed;
  const projectedExpenseMinor = dailyBurnRateMinor * daysInMonth;

  if (prefs?.notifInsights !== false) {
    if (currentIncomeMinor > 0) {
      const projectedSavingsMinor = currentIncomeMinor - projectedExpenseMinor;
      if (projectedSavingsMinor > 0) {
        insights.push({
          id:          'forecast-positive',
          type:        'forecast',
          title:       'On pace to save this month',
          description: `At your daily spend of ${currency} ${Math.round(toMajor(dailyBurnRateMinor)).toLocaleString()}, you could save ~${currency} ${Math.round(toMajor(projectedSavingsMinor)).toLocaleString()} by month-end.`,
          severity:    'success',
        });
      } else {
        insights.push({
          id:          'forecast-negative',
          type:        'forecast',
          title:       'Spending running ahead of income',
          description: `At your current rate you may exceed income by ~${currency} ${Math.round(Math.abs(toMajor(projectedSavingsMinor))).toLocaleString()} this month. Consider reviewing your expenses.`,
          severity:    'warning',
        });
      }
    } else if (currentExpenseMinor > 0) {
      // No income recorded yet this month — still useful to show burn rate
      insights.push({
        id:          'forecast-no-income',
        type:        'forecast',
        title:       'No income recorded yet this month',
        description: `You're spending ~${currency} ${Math.round(toMajor(dailyBurnRateMinor)).toLocaleString()}/day. Record your income to see your full cashflow forecast.`,
        severity:    'info',
      });
    }
  }

  // -- GOAL PROGRESS ALERTS ---------------------------------------------------
  if (prefs?.notifGoals !== false) {
    for (const goal of activeGoals) {
      const currentAmountMinor = goal.transfers.reduce((sum, t) => sum + Number(t.baseAmountMinor), 0);
      const targetMinor = Number(goal.targetAmountMinor);
      if (currentAmountMinor >= targetMinor) {
        insights.push({
          id: `goal-met-${goal.id}`,
          type: 'achievement',
          title: 'Goal Achieved! 🎉',
          description: `You have reached your goal for ${goal.name}! (${currency} ${toMajor(targetMinor).toLocaleString()})`,
          severity: 'success',
        });
      } else {
        const pct = Math.round((currentAmountMinor / targetMinor) * 100);
        if (pct === 50 || pct === 75 || pct === 90) {
          insights.push({
            id: `goal-prog-${goal.id}-${pct}`,
            type: 'achievement',
            title: 'Goal Milestone',
            description: `You are ${pct}% of the way to your ${goal.name} goal. Keep it up!`,
            severity: 'info',
          });
        }
      }
    }
  }

  // -- LOAN DUE ALERTS --------------------------------------------------------
  if (prefs?.notifLoanDue !== false) {
    const { getLoansForUser } = await import('@/lib/queries/loans');
    const allLoans = await getLoansForUser(userId);
    const activeLoans = allLoans.filter(l => Number(l.balanceMinor) > 0);
    for (const loan of activeLoans) {
      const dueDate = new Date(loan.nextDue);
      const diffTime = dueDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 0 && diffDays <= 3) {
        insights.push({
          id: `loan-due-${loan.id}`,
          type: 'recurring',
          title: 'Upcoming Loan Payment',
          description: `Your payment of ${currency} ${toMajor(loan.monthlyPaymentMinor).toLocaleString()} for ${loan.name} is due in ${diffDays} day(s).`,
          severity: 'warning',
        });
      } else if (diffDays < 0) {
        insights.push({
          id: `loan-overdue-${loan.id}`,
          type: 'anomaly',
          title: 'Overdue Loan Payment',
          description: `Your payment for ${loan.name} is overdue by ${Math.abs(diffDays)} day(s)!`,
          severity: 'danger',
        });
      }
    }
  }

  // Sort: danger > warning > success > info, then return top 4
  const severityOrder: Record<string, number> = { danger: 0, warning: 1, success: 2, info: 3 };
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  return insights.slice(0, 4);
}
