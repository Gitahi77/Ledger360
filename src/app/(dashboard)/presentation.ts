import { HeroSectionProps } from '@/components/finance/HeroSection';
import { AttentionSectionProps } from '@/components/finance/AttentionSection';
import { ReflectionSectionProps } from '@/components/finance/ReflectionSection';
import { ProgressSectionProps } from '@/components/finance/ProgressSection';
import { ActionSectionProps } from '@/components/finance/ActionSection';
import { FinancialSnapshot } from '@/lib/domain/snapshot';
import { formatCurrency } from '@/lib/finance/formatCurrency';

export interface DashboardPresentation {
  hero: HeroSectionProps;
  attention: AttentionSectionProps;
  reflection: ReflectionSectionProps;
  progress: ProgressSectionProps;
  action: ActionSectionProps;
}

/**
 * Transforms a pure FinancialSnapshot domain object into purely presentational UI props.
 * This function must remain entirely decoupled from Prisma, databases, and APIs.
 */
export function buildDashboardPresentation(snapshot: FinancialSnapshot): DashboardPresentation {
  
  // Helper for formatting
  const format = (amount: bigint) => 
    formatCurrency({ amountMinor: amount, currency: snapshot.metadata.baseCurrency }, { precision: 0 });
  const formatTx = (amount: bigint, currency: string) => 
    formatCurrency({ amountMinor: amount, currency }, { precision: 0 });

  // -- Hero --
  const safeToSpendVal = snapshot.metrics.safeToSpend;
  const isPositive = safeToSpendVal >= 0n;
  const formattedSafeToSpend = format(isPositive ? safeToSpendVal : -safeToSpendVal);
  
  const hero: HeroSectionProps = {
    metric: {
      label: 'Safe to Spend',
      value: `${isPositive ? '' : '-'}${formattedSafeToSpend}`,
      status: isPositive ? 'positive' : 'negative',
    },
    calculation: [
      { label: 'Monthly Income', value: format(snapshot.metrics.monthlyIncome) },
      { label: 'Committed / Spent', value: `-${format(snapshot.metrics.monthlyIncome - safeToSpendVal)}` },
    ],
  };

  // -- Attention --
  const insights = snapshot.alerts.map(a => ({
    severity: a.severity,
    title: a.title,
    content: a.content,
    actionLabel: a.actionLabel,
  }));

  if (snapshot.metrics.criticalBudgetCount > 0) {
    insights.push({
      severity: 'critical',
      title: `${snapshot.metrics.criticalBudgetCount} Budget${snapshot.metrics.criticalBudgetCount > 1 ? 's' : ''} Critical`,
      content: snapshot.metrics.highestRiskBudget 
        ? `${snapshot.metrics.highestRiskBudget.name} is at ${Math.round(snapshot.metrics.highestRiskBudget.percentage * 100)}% utilization.`
        : 'You have reached or exceeded the limit on one or more budgets.',
      actionLabel: 'Review Budgets',
    });
  } else if (snapshot.metrics.warningBudgetCount > 0) {
    insights.push({
      severity: 'warning',
      title: `${snapshot.metrics.warningBudgetCount} Budget${snapshot.metrics.warningBudgetCount > 1 ? 's' : ''} at Risk`,
      content: snapshot.metrics.highestRiskBudget
        ? `${snapshot.metrics.highestRiskBudget.name} is approaching its limit.`
        : 'One or more budgets are nearing their limit.',
      actionLabel: 'Review Spending',
    });
  }

  const attention: AttentionSectionProps = {
    insights,
  };

  // -- Reflection --
  // Group transactions by "Today", "Yesterday", or "Earlier"
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const txToday = snapshot.transactions.filter(t => t.date >= today);
  const txYesterday = snapshot.transactions.filter(t => t.date >= yesterday && t.date < today);
  
  const reflectionGroups = [];
  if (txToday.length > 0) {
    reflectionGroups.push({
      label: 'Today',
      items: txToday.map(t => {
        const isExp = t.type === 'expense';
        const absAmount = isExp ? -t.amountMinor : t.amountMinor;
        return {
          title: t.name,
          description: t.categoryId || 'General',
          value: `${isExp ? '-' : '+'}${formatTx(absAmount, t.currency)}`,
          time: t.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: isExp ? undefined : 'success' as const,
        };
      })
    });
  }
  if (txYesterday.length > 0) {
    reflectionGroups.push({
      label: 'Yesterday',
      items: txYesterday.map(t => {
        const isExp = t.type === 'expense';
        const absAmount = isExp ? -t.amountMinor : t.amountMinor;
        return {
          title: t.name,
          description: t.categoryId || 'General',
          value: `${isExp ? '-' : '+'}${formatTx(absAmount, t.currency)}`,
          time: t.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: isExp ? undefined : 'success' as const,
        };
      })
    });
  }

  const reflection: ReflectionSectionProps = {
    title: 'Recent Activity',
    groups: reflectionGroups,
  };

  // -- Progress --
  const progressItems: ProgressSectionProps['items'] = snapshot.goals.map(g => {
    const progressPct = g.targetAmountMinor > 0n 
      ? Number((g.savedAmountMinor * 100n) / g.targetAmountMinor) 
      : 0;
    
    return {
      type: 'story',
      props: {
        title: g.name,
        narrative: g.deadline ? `Target by ${g.deadline.toLocaleDateString()}` : 'Steady progress.',
        metric: format(g.targetAmountMinor),
        progress: Math.min(progressPct, 100),
        status: progressPct >= 100 ? 'positive' : (progressPct > 50 ? 'positive' : 'warning'),
      }
    };
  });

  // Add Net Worth Journey
  progressItems.push({
    type: 'journey',
    props: {
      title: 'Net Worth',
      primaryMetric: format(snapshot.metrics.netWorth),
      trendLabel: 'current balance',
      narrative: 'Assets minus liabilities.',
      trendDirection: snapshot.metrics.netWorth >= 0n ? 'positive' : 'negative',
    }
  });

  // Add Budget Utilization Journey
  if (snapshot.metrics.activeBudgetCount > 0) {
    progressItems.push({
      type: 'journey',
      props: {
        title: 'Budget Utilization',
        primaryMetric: `${Math.round(snapshot.metrics.aggregateBudgetUtilization)}%`,
        trendLabel: 'of all limits',
        narrative: snapshot.metrics.nextToExceedBudget 
          ? `Next up: ${snapshot.metrics.nextToExceedBudget.name} (${format(snapshot.metrics.nextToExceedBudget.remainingMinor)} left)`
          : 'All budgets are healthy.',
        trendDirection: snapshot.metrics.aggregateBudgetUtilization > 80 ? 'negative' : 'positive',
      }
    });
  }

  const progress: ProgressSectionProps = {
    title: 'Goals & Progress',
    items: progressItems,
  };

  // -- Action --
  let actionRec = undefined;
  if (snapshot.metrics.liquidCash > snapshot.metrics.monthlyExpenses * 2n && snapshot.metrics.monthlyExpenses > 0n) {
    actionRec = {
      title: 'Recommended Action',
      actionStatement: 'Optimize Excess Liquidity',
      narrative: 'You have more than 2 months of expenses in liquid cash. Consider moving a portion to a higher-yield investment.',
      actionLabel: 'Explore Investments',
      status: 'active' as const,
    };
  }

  const action: ActionSectionProps = {
    recommendation: actionRec,
  };

  return { hero, attention, reflection, progress, action };
}
