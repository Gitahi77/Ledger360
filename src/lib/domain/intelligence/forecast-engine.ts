import type { ForecastResult } from '../../types/intelligence';
import type { EvaluatedState } from './evaluation-engine';

export interface ForecastState extends EvaluatedState {
  forecasts: ForecastResult;
}

export function generateForecasts(state: EvaluatedState): ForecastState {
  // Aggregate forecasts from individual modules.
  // The orchestrator forecast engine synthesizes module-level forecasts into a unified OS forecast.

  const unifiedForecast: ForecastResult = {
    next7Days: null,
    next30Days: null,
    expectedCashflow: null,
    confidenceBand: 0
  };

  let totalConfidence = 0;
  let forecastCount = 0;

  // Simple aggregation for now
  for (const moduleForecast of state.moduleForecasts) {
    if (moduleForecast.next7Days) {
      unifiedForecast.next7Days = moduleForecast.next7Days;
    }
    if (moduleForecast.next30Days) {
      unifiedForecast.next30Days = moduleForecast.next30Days;
    }
    if (moduleForecast.expectedCashflow) {
      unifiedForecast.expectedCashflow = moduleForecast.expectedCashflow;
    }
    if (moduleForecast.confidenceBand !== undefined) {
      totalConfidence += moduleForecast.confidenceBand;
      forecastCount++;
    }
  }

  if (forecastCount > 0) {
    unifiedForecast.confidenceBand = totalConfidence / forecastCount;
  } else {
    unifiedForecast.confidenceBand = 0.5; // Default generic confidence
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
    forecasts: unifiedForecast
  };
}
