import type { RiskResult } from '../../types/intelligence';
import type { RecommendationState } from './recommendation-engine';

export interface EvaluatedState extends RecommendationState {
  risks: RiskResult;
}

export function evaluate(state: RecommendationState): EvaluatedState {
  const risks: RiskResult = {
    overdraftRisk: null,
    overspendingRisk: null,
    savingsRisk: null
  };

  // Evaluate module risks to synthesize global risks
  let maxOverspendingRisk = 0;
  for (const moduleRisk of state.moduleRisks) {
    if (moduleRisk.overspendingRisk !== undefined && moduleRisk.overspendingRisk !== null) {
      maxOverspendingRisk = Math.max(maxOverspendingRisk, moduleRisk.overspendingRisk);
    }
  }
  if (maxOverspendingRisk > 0) {
    risks.overspendingRisk = maxOverspendingRisk;
  }

  // Iterate over recommendations to compute confidence dynamically and adjust scores
  const evaluatedRecommendations = state.recommendations.map(rec => {
    // Standardize confidence. Confidence should always be computed. Not manually assigned.
    // Example inputs: supporting evidence count, correlation strength.
    let computedConfidence = 0.5; // Base confidence
    
    // Boost confidence based on evidence count
    if (rec.evidenceIds.length > 2) {
      computedConfidence += 0.3;
    } else if (rec.evidenceIds.length > 0) {
      computedConfidence += 0.2;
    }

    // Boost confidence if it maps to known strong insights
    const hasStrongInsight = state.insights.some(i => rec.evidenceIds.includes(i.id));
    if (hasStrongInsight) {
      computedConfidence += 0.1;
    }

    // Cap at 0.99
    computedConfidence = Math.min(computedConfidence, 0.99);

    return {
      ...rec,
      confidence: computedConfidence,
      evaluation: {
        ...rec.evaluation,
        confidence: computedConfidence
      }
    };
  });

  // Sort recommendations by score immutably
  const sortedRecommendations = [...evaluatedRecommendations].sort((a, b) => {
    const scoreA = a.evaluation.severity * a.evaluation.confidence * a.evaluation.urgency;
    const scoreB = b.evaluation.severity * b.evaluation.confidence * b.evaluation.urgency;
    return scoreB - scoreA;
  });

  return {
    ...state,
    observations: [...state.observations],
    insights: [...state.insights],
    timeline: [...state.timeline],
    correlations: [...state.correlations],
    moduleRisks: [...state.moduleRisks],
    moduleForecasts: [...state.moduleForecasts],
    risks,
    recommendations: sortedRecommendations
  };
}
