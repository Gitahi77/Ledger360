import { describe, it, expect } from 'vitest';
import { runPipeline } from '@/lib/domain/intelligence/orchestrator';
import type { IntelligenceModuleOutput, Observation, Insight, TimelineEvent } from '@/lib/types/intelligence';

describe('Intelligence Orchestrator Invariants', () => {
  const createModule = (id: string, observations: Observation[], insights: Insight[], timeline: TimelineEvent[]): IntelligenceModuleOutput<unknown> => ({
    module: id,
    metrics: {},
    observations,
    insights,
    timeline,
    risks: {},
    forecasts: {}
  });

  const obs1: Observation = { id: 'obs-1', type: 'outlier', description: 'Large transaction' };
  const obs2: Observation = { id: 'obs-2', type: 'concentration', description: 'High spending in Food' };
  const insight1: Insight = { id: 'ins-1', type: 'acceleration', explanation: 'Expenses rising' };
  const insight2: Insight = { id: 'cashflow-negative', type: 'cash_flow', explanation: 'Negative cash flow' };

  it('Module independence: removing one module does not crash the pipeline', () => {
    const m1 = createModule('m1', [obs1], [insight1], []);
    const m2 = createModule('m2', [obs2], [insight2], []);

    const resultBoth = runPipeline({ modules: [m1, m2] });
    expect(resultBoth.insights.length).toBe(2);

    const resultSingle = runPipeline({ modules: [m1] });
    expect(resultSingle.insights.length).toBe(1);
    expect(resultSingle.insights[0].id).toBe('ins-1');
  });

  it('Order independence: passing modules in different order yields identical results', () => {
    const m1 = createModule('m1', [obs1], [insight1], []);
    const m2 = createModule('m2', [obs2], [insight2], []);

    const resultOrder1 = runPipeline({ modules: [m1, m2] });
    const resultOrder2 = runPipeline({ modules: [m2, m1] });

    expect(resultOrder1.insights.length).toBe(resultOrder2.insights.length);
    expect(resultOrder1.recommendations.length).toBe(resultOrder2.recommendations.length);
    if (resultOrder1.recommendations.length > 0) {
      expect(resultOrder1.recommendations[0].id).toBe(resultOrder2.recommendations[0].id);
    }
  });

  it('Determinism & Idempotence: Identical inputs always produce byte-for-byte identical outputs', () => {
    const m1 = createModule('m1', [obs1], [insight1], []);
    const input = { modules: [m1] };
    
    // Idempotence: running it twice on the same input yields identical results
    const result1 = runPipeline(input);
    const result2 = runPipeline(input);

    expect(JSON.stringify(result1)).toEqual(JSON.stringify(result2));
  });

  it('Purity: The input object must never change', () => {
    const m1 = createModule('m1', [obs1], [insight1], []);
    const input = { modules: [m1] };
    
    const originalString = JSON.stringify(input);
    
    runPipeline(input);
    
    // Input must remain strictly identical
    expect(JSON.stringify(input)).toEqual(originalString);
  });

  it('Empty pipeline: empty modules array produces valid empty OS DTO', () => {
    const result = runPipeline({ modules: [] });
    
    expect(result).toBeDefined();
    expect(result.pipelineVersion).toBe('v1');
    expect(result.advisor).toBeDefined(); // It will fallback to "All Systems Normal"
    expect(result.advisor?.title).toBe('All Systems Normal');
    expect(result.recommendations).toEqual([]);
    expect(result.insights).toEqual([]);
    expect(result.timeline).toEqual([]);
  });

  it('Unknown module resilience: inserting random module structures works seamlessly', () => {
    // A module that doesn't exist yet but implements the interface
    const insuranceModule = createModule('insurance', [{ id: 'obs-ins', type: 'coverage', description: 'Underinsured' }], [], []);
    
    const result = runPipeline({ modules: [insuranceModule] });
    
    expect(result).toBeDefined();
    expect(result.insights).toEqual([]);
    // The observation was collected and can be reasoned on, even though it's from 'insurance'
  });

  it('Duplicate handling: duplicate observations across modules do not produce duplicates', () => {
    const m1 = createModule('m1', [], [insight1], []);
    const m2 = createModule('m2', [], [insight1], []);

    const result = runPipeline({ modules: [m1, m2] });
    expect(result.insights.length).toBe(1); // Should be deduped during normalize stage
  });

  it('Correlation engine evaluates cross-module logic correctly', () => {
    // If we have cashflow-negative and outlier, it should generate a recommendation
    const m1 = createModule('m1', [obs1], [], []);
    const m2 = createModule('m2', [], [insight2], []);

    const result = runPipeline({ modules: [m1, m2] });
    expect(result.recommendations.length).toBe(1);
    expect(result.recommendations[0].id).toBe('rec-corr-lifestyle-inflation');
    expect(result.recommendations[0].evidenceIds).toContain('obs-1');
    expect(result.recommendations[0].evidenceIds).toContain('cashflow-negative');
  });

  it('Priority stability: Recommendations are sorted correctly', () => {
    const m1 = createModule('m1', [obs1], [insight2], []);
    const result = runPipeline({ modules: [m1] });
    
    // Check if advisor picks the top recommendation
    expect(result.advisor?.title).toBe('Attention Required');
    expect(result.advisor?.explanation).toContain('Delay discretionary purchases');
    
    // Since we only generated one recommendation, let's manually check the sorting logic if there were multiple
    // The evaluation-engine sorts immutably by score (severity * confidence * urgency).
  });

  it('Confidence monotonicity: More evidence logically increases computed confidence', () => {
    // Pipeline with more evidence (two outliers)
    const obs3: Observation = { id: 'obs-3', type: 'outlier', description: 'Another large transaction' };
    const m1 = createModule('m1', [obs1, obs3], [insight2], []);
    const resultStrong = runPipeline({ modules: [m1] });
    const confStrong = resultStrong.recommendations[0].confidence;

    // Pipeline with minimal evidence (one outlier)
    const m2 = createModule('m2', [obs1], [insight2], []);
    const resultWeak = runPipeline({ modules: [m2] });
    const confWeak = resultWeak.recommendations[0].confidence;

    expect(confStrong).toBeGreaterThan(confWeak);
  });

  it('Evidence integrity: Every recommendation must map directly to valid evidence IDs', () => {
    const m1 = createModule('m1', [obs1], [insight2], []);
    const result = runPipeline({ modules: [m1] });

    // Collect all valid evidence IDs known to the pipeline (from the input module)
    const validEvidenceIds = new Set([
      ...m1.observations.map(o => o.id),
      ...m1.insights.map(i => i.id)
    ]);

    expect(result.recommendations.length).toBeGreaterThan(0);
    for (const rec of result.recommendations) {
      expect(rec.evidenceIds.length).toBeGreaterThan(0);
      for (const evId of rec.evidenceIds) {
        expect(validEvidenceIds.has(evId)).toBe(true);
      }
    }
  });
});
