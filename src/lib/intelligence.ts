import { prisma } from './prisma';
import { startOfMonth, subMonths, endOfMonth, differenceInDays, getDate, getDaysInMonth, isSameMonth } from 'date-fns';

export type Insight = {
  id: string;
  type: 'anomaly' | 'recurring' | 'forecast' | 'achievement' | 'info';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'success' | 'danger';
};

export async function generateInsights(userId: string): Promise<Insight[]> {
  const insights: Insight[] = [];
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const threeMonthsAgo = subMonths(thisMonthStart, 3);

  // 1. Fetch data
  const transactions = await prisma.transaction.findMany({
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
  const pastMonthsTx   = transactions.filter(t => t.date < thisMonthStart);

  // --- ANOMALY DETECTION ---
  // Compare this month's category spending to the average of the last 3 months
  const pastCategoryTotals: Record<string, number> = {};
  pastMonthsTx.filter(t => t.type === 'expense').forEach(t => {
    pastCategoryTotals[t.category.name] = (pastCategoryTotals[t.category.name] || 0) + t.amount;
  });
  
  // Average per month (over up to 3 past months)
  const pastMonthsCount = Array.from(new Set(pastMonthsTx.map(t => t.date.getMonth()))).length || 1;
  const avgCategorySpend = Object.fromEntries(
    Object.entries(pastCategoryTotals).map(([cat, total]) => [cat, total / pastMonthsCount])
  );

  const currentCategoryTotals: Record<string, number> = {};
  currentMonthTx.filter(t => t.type === 'expense').forEach(t => {
    currentCategoryTotals[t.category.name] = (currentCategoryTotals[t.category.name] || 0) + t.amount;
  });

  for (const [cat, currentSpend] of Object.entries(currentCategoryTotals)) {
    const avg = avgCategorySpend[cat];
    if (avg && avg > 1000) { // Only flag meaningful categories
      const ratio = currentSpend / avg;
      if (ratio > 1.4) {
        const percent = Math.round((ratio - 1) * 100);
        insights.push({
          id: `anomaly-${cat}`,
          type: 'anomaly',
          title: 'Higher than usual',
          description: `Your ${cat} spending looks ${percent}% above your typical pattern this month.`,
          severity: 'warning',
        });
      }
    }
  }

  // --- RECURRING BILL DETECTION ---
  // Look for expenses with the exact same name across multiple months
  const expenseNames = [...new Set(pastMonthsTx.filter(t => t.type === 'expense').map(t => t.name))];
  for (const name of expenseNames) {
    const matches = pastMonthsTx.filter(t => t.name === name);
    if (matches.length >= 2) {
      // Check if it's been paid this month
      const paidThisMonth = currentMonthTx.some(t => t.name === name);
      if (!paidThisMonth) {
        // Find average date of month it's usually paid
        const avgDate = Math.round(matches.reduce((acc, t) => acc + getDate(t.date), 0) / matches.length);
        const todayDate = getDate(now);
        
        if (todayDate >= avgDate - 5 && todayDate <= avgDate + 5) {
          const avgAmount = matches.reduce((acc, t) => acc + t.amount, 0) / matches.length;
          insights.push({
            id: `recurring-${name}`,
            type: 'recurring',
            title: 'Upcoming recurring payment',
            description: `${name} usually comes around the ${avgDate}th (~KES ${Math.round(avgAmount).toLocaleString()}).`,
            severity: 'info',
          });
        }
      }
    }
  }

  // --- CASHFLOW FORECASTING ---
  const currentIncome = currentMonthTx.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
  const currentExpense = currentMonthTx.filter(t => t.type === 'expense').reduce((a, b) => a + b.amount, 0);
  
  const daysPassed = getDate(now) || 1;
  const daysInMonth = getDaysInMonth(now);
  
  const dailyBurnRate = currentExpense / daysPassed;
  const projectedExpense = dailyBurnRate * daysInMonth;
  
  if (currentIncome > 0 && projectedExpense > 0) {
    const projectedSavings = currentIncome - projectedExpense;
    if (projectedSavings > 0) {
      insights.push({
        id: 'forecast-positive',
        type: 'forecast',
        title: 'On pace to save this month',
        description: `At your daily spend of KES ${Math.round(dailyBurnRate).toLocaleString()}, you could save ~KES ${Math.round(projectedSavings).toLocaleString()} by month-end.`,
        severity: 'success',
      });
    } else {
      insights.push({
        id: 'forecast-negative',
        type: 'forecast',
        title: 'Worth keeping an eye on',
        description: `Your spending this month is running a little ahead of income. About KES ${Math.round(Math.abs(projectedSavings)).toLocaleString()} to close the gap.`,
        severity: 'warning',
      });
    }
  }

  // Sort: danger > warning > success > info
  const severityOrder = { danger: 0, warning: 1, success: 2, info: 3 };
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return insights.slice(0, 3); // Return top 3 insights
}
