import type { NormalizedState } from './orchestrator';

export interface Correlation {
  id: string;
  type: string;
  evidenceIds: string[];
  description: string;
}

export interface CorrelatedState extends NormalizedState {
  correlations: Correlation[];
}

export function correlate(state: NormalizedState): CorrelatedState {
  const correlations: Correlation[] = [];

  // Example correlation: Cash flow negative insight + Outlier expense observation
  const hasNegativeCashflow = state.insights.some(i => i.id === 'cashflow-negative');
  const outliers = state.observations.filter(o => o.type === 'outlier');

  if (hasNegativeCashflow && outliers.length > 0) {
    correlations.push({
      id: 'corr-lifestyle-inflation',
      type: 'lifestyle_inflation',
      description: 'Cash flow is negative and there are outlier expenses.',
      evidenceIds: ['cashflow-negative', ...outliers.map(o => o.id)]
    });
  }

  // Return immutable copy
  return {
    ...state,
    observations: [...state.observations],
    insights: [...state.insights],
    timeline: [...state.timeline],
    moduleRisks: [...state.moduleRisks],
    moduleForecasts: [...state.moduleForecasts],
    correlations
  };
}
