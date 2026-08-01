import type { AdvisorResult, Observation, Insight, Recommendation } from '@/lib/types/intelligence';

export function generateAdvisorNote(
  observations: Observation[],
  insights: Insight[],
  actions: Recommendation[],
  transactionCount: number
): AdvisorResult | null {

  if (transactionCount === 0) {
    return null;
  }

  // Pool everything together with their priorities
  const candidates: Array<{
    priority: number;
    title: string;
    explanation: string;
    recommendation: string | null;
    confidence: number;
  }> = [];

  // Actions map to critical recommendations
  for (const action of actions) {
    candidates.push({
      priority: action.priority,
      title: 'Attention Required',
      explanation: action.reason,
      recommendation: action.directive,
      confidence: action.confidence
    });
  }

  // Insights map to behavioural shifts
  for (const insight of insights) {
    candidates.push({
      priority: insight.priority,
      title: 'Behaviour Shift',
      explanation: insight.explanation,
      recommendation: null, // Recommendations come from actions, but we can leave this null
      confidence: insight.confidence
    });
  }

  // Observations map to unusual activity
  for (const obs of observations) {
    let title = 'General Observation';
    if (obs.priority >= 80) title = 'Unusual Activity';
    else if (obs.priority >= 50) title = 'Spending Pattern';

    candidates.push({
      priority: obs.priority,
      title,
      explanation: obs.description,
      recommendation: null,
      confidence: obs.confidence
    });
  }

  // If no candidates, return stable cash flow
  if (candidates.length === 0) {
    return {
      priority: 30, // General Observation
      title: 'Stable Cash Flow',
      explanation: 'Nothing unusual happened during this period.',
      recommendation: 'Continue your current spending habits.',
      confidence: 1.0
    };
  }

  // Deterministic sorting: 
  // 1. Highest priority
  // 2. Tie breaker: Highest confidence
  candidates.sort((a, b) => {
    if (b.priority !== a.priority) {
      return b.priority - a.priority;
    }
    return b.confidence - a.confidence;
  });

  return candidates[0];
}
