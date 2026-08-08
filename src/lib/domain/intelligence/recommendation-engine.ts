import type { Recommendation } from '../../types/intelligence';
import type { CorrelatedState } from './correlation-engine';

export interface RecommendationState extends CorrelatedState {
  recommendations: Recommendation[];
}

export function generateRecommendations(state: CorrelatedState): RecommendationState {
  const recommendations: Recommendation[] = [];

  // Rules engine for deterministic recommendations based purely on correlations/insights
  for (const corr of state.correlations) {
    if (corr.type === 'lifestyle_inflation') {
      recommendations.push({
        id: `rec-${corr.id}`,
        text: 'Delay discretionary purchases until cash flow stabilizes.',
        evidenceIds: corr.evidenceIds,
        // Confidence and evaluation will be computed in evaluation-engine
        confidence: 0,
        evaluation: {
          severity: 80,
          urgency: 90,
          financialImpact: 1,
          recurrence: 0,
          stability: 0,
          confidence: 0
        },
        generatedBy: 'Orchestrator:RecommendationEngine'
      });
    }
  }

  // Adding basic rule: if cash flow is extremely positive, recommend saving
  const hasHighCashflow = state.insights.some(i => i.id === 'cashflow-positive-high');
  if (hasHighCashflow) {
    recommendations.push({
      id: 'rec-invest-surplus',
      text: 'Move excess cash flow to an interest-bearing account or investments.',
      evidenceIds: ['cashflow-positive-high'],
      confidence: 0,
      evaluation: {
        severity: 50,
        urgency: 40,
        financialImpact: 1,
        recurrence: 0,
        stability: 0,
        confidence: 0
      },
      generatedBy: 'Orchestrator:RecommendationEngine'
    });
  }

  return {
    ...state,
    observations: [...state.observations],
    insights: [...state.insights],
    timeline: [...state.timeline],
    correlations: [...state.correlations],
    moduleRisks: [...state.moduleRisks],
    moduleForecasts: [...state.moduleForecasts],
    recommendations
  };
}
