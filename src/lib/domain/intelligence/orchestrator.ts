import type { 
  IntelligenceModuleOutput, 
  OSIntelligenceDTO, 
  Observation, 
  Insight, 
  TimelineEvent,
  RiskResult,
  ForecastResult
} from '../../types/intelligence';
import { correlate } from './correlation-engine';
import { generateRecommendations } from './recommendation-engine';
import { evaluate } from './evaluation-engine';
import { generateForecasts } from './forecast-engine';
import { resolve, type ResolvedState } from './resolution-engine';

export interface OrchestratorInput {
  modules: IntelligenceModuleOutput<unknown>[];
}

export interface CollectedState {
  observations: Observation[];
  insights: Insight[];
  timeline: TimelineEvent[];
  moduleRisks: RiskResult[];
  moduleForecasts: ForecastResult[];
}

export type NormalizedState = CollectedState;

export function runPipeline(input: OrchestratorInput): OSIntelligenceDTO {
  // 1. Collect
  const collected = collect(input.modules);
  
  // 2. Normalize
  const normalized = normalize(collected);
  
  // 3. Correlate
  const correlated = correlate(normalized);
  
  // 4. Recommend (deterministic generation of recommendations from evidence)
  const recommended = generateRecommendations(correlated);

  // 5. Evaluate (scoring severity, urgency, confidence)
  const evaluated = evaluate(recommended);
  
  // 6. Forecast
  const forecasted = generateForecasts(evaluated);

  // 7. Resolve (conflict resolution for final advisor)
  const resolved = resolve(forecasted);
  
  // 8. Present
  return present(resolved);
}

function collect(modules: IntelligenceModuleOutput<unknown>[]): CollectedState {
  const observations: Observation[] = [];
  const insights: Insight[] = [];
  const timeline: TimelineEvent[] = [];
  const moduleRisks: RiskResult[] = [];
  const moduleForecasts: ForecastResult[] = [];
  
  for (const mod of modules) {
    observations.push(...mod.observations);
    insights.push(...mod.insights);
    timeline.push(...mod.timeline);
    if (mod.risks) moduleRisks.push(mod.risks);
    if (mod.forecasts) moduleForecasts.push(mod.forecasts);
  }

  // Immutable return
  return Object.freeze({ observations, insights, timeline, moduleRisks, moduleForecasts });
}

function normalize(collected: CollectedState): NormalizedState {
  // Deduplicate and standardize shape
  const uniqueObservations = Array.from(new Map(collected.observations.map(o => [o.id, o])).values());
  const uniqueInsights = Array.from(new Map(collected.insights.map(i => [i.id, i])).values());
  
  // Sort timeline chronologically
  const sortedTimeline = [...collected.timeline].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return Object.freeze({
    observations: uniqueObservations,
    insights: uniqueInsights,
    timeline: sortedTimeline,
    moduleRisks: [...collected.moduleRisks],
    moduleForecasts: [...collected.moduleForecasts]
  });
}

function present(resolved: ResolvedState): OSIntelligenceDTO {
  return Object.freeze({
    pipelineVersion: 'v1',
    advisor: resolved.advisor ? { ...resolved.advisor } : null,
    risks: { ...resolved.risks },
    forecasts: { ...resolved.forecasts },
    recommendations: [...resolved.recommendations],
    insights: [...resolved.insights],
    timeline: [...resolved.timeline]
  });
}
