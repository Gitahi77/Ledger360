import type { AdvisorResult } from '../../types/intelligence';
import type { ForecastState } from './forecast-engine';

export interface ResolvedState extends ForecastState {
  advisor: AdvisorResult | null;
}

export function resolve(state: ForecastState): ResolvedState {
  let advisor: AdvisorResult | null = null;

  if (state.recommendations.length > 0) {
    const topRec = state.recommendations[0];
    advisor = {
      priority: topRec.evaluation.severity,
      title: 'Attention Required',
      explanation: topRec.text,
      recommendation: topRec.text,
      confidence: topRec.confidence ?? topRec.evaluation.confidence
    };
  } else if (state.insights.length > 0) {
    const topInsight = state.insights[0];
    advisor = {
      priority: 50,
      title: 'Financial Update',
      explanation: topInsight.explanation,
      recommendation: null,
      confidence: 0.8
    };
  } else {
    advisor = {
      priority: 0,
      title: 'All Systems Normal',
      explanation: 'Your finances are tracking as expected.',
      recommendation: null,
      confidence: 1.0
    };
  }

  return {
    ...state,
    observations: [...state.observations],
    insights: [...state.insights],
    timeline: [...state.timeline],
    correlations: [...state.correlations],
    recommendations: [...state.recommendations],
    moduleRisks: [...state.moduleRisks],
    moduleForecasts: [...state.moduleForecasts],
    advisor
  };
}
