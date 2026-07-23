import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getMetrics, 
  setMetricsRegistry, 
  InMemoryMetricsRegistry, 
  NoOpMetricsRegistry,
  MetricsRegistry 
} from '@/lib/metrics/MetricsRegistry';

describe('Stage 5.4 — Finance-Grade Observability', () => {
  let registry: InMemoryMetricsRegistry;

  beforeEach(() => {
    registry = new InMemoryMetricsRegistry();
    setMetricsRegistry(registry);
  });

  describe('Core Metrics & Ring Buffer Calculations', () => {
    it('calculates p50, p90, p95, and p99 percentiles correctly', () => {
      // Record 100 latency samples: 1ms to 100ms
      for (let i = 1; i <= 100; i++) {
        getMetrics().recordHistogram('ledger_api_latency_ms', i);
      }

      const summaries = getMetrics().getAllSummaries();
      const apiStats: any = summaries.api.ledger_api_latency_ms;

      expect(apiStats.count).toBe(100);
      expect(apiStats.p50).toBe(51);
      expect(apiStats.p90).toBe(91);
      expect(apiStats.p95).toBe(96);
      expect(apiStats.p99).toBe(100);
    });

    it('enforces bounded ring buffer memory (max 1000 samples) and tracks overwrites', () => {
      // Push 1500 samples
      for (let i = 1; i <= 1500; i++) {
        getMetrics().recordHistogram('ledger_db_query_duration_ms', i);
      }

      const summaries = getMetrics().getAllSummaries();
      const dbStats: any = summaries.database.ledger_db_query_duration_ms;
      const healthStats: any = summaries.health;

      // Ring buffer retains exactly 1000 samples
      expect(dbStats.count).toBe(1000);
      // Overwrites count is 500
      expect(healthStats.ledger_metrics_buffer_overwrites_total).toBe(500);
    });
  });

  describe('Metrics Isolation (Critical Invariant)', () => {
    it('guarantees financial operations continue successfully even if the metrics registry throws', () => {
      // Broken registry that throws on every call
      class ThrowingRegistry implements MetricsRegistry {
        incrementCounter(): void {
          throw new Error('Metrics DB connection failed');
        }
        recordHistogram(): void {
          throw new Error('Metrics storage disk full');
        }
        getGroupSummary(): Record<string, unknown> { return {}; }
        getAllSummaries(): any { return {}; }
        reset(): void {}
      }

      const brokenRegistry = new ThrowingRegistry();
      setMetricsRegistry(brokenRegistry);

      // Financial operation simulation wrapped in safe metric execution
      let operationExecuted = false;
      const executeFinancialMutation = () => {
        // Business logic
        operationExecuted = true;
        // Metric recording inside application code
        getMetrics().incrementCounter('ledger_transactions_created_total');
        getMetrics().recordHistogram('ledger_transaction_duration_ms', 45);
        return { success: true, transactionId: 'TX-12345' };
      };

      // Execution MUST NOT throw, and operation MUST complete
      expect(() => {
        const result = executeFinancialMutation();
        expect(result.success).toBe(true);
        expect(result.transactionId).toBe('TX-12345');
      }).not.toThrow();

      expect(operationExecuted).toBe(true);
    });
  });

  describe('Group Summary Filtering', () => {
    it('filters metrics by group correctly', () => {
      getMetrics().incrementCounter('ledger_transactions_created_total', 5);
      getMetrics().recordHistogram('ledger_lock_wait_ms', 12);
      getMetrics().incrementCounter('ledger_p2034_total', 2);

      const financialGroup = getMetrics().getGroupSummary('financial');
      const retryGroup = getMetrics().getGroupSummary('retry');

      expect(financialGroup.ledger_transactions_created_total).toBe(5);
      expect(retryGroup.ledger_p2034_total).toBe(2);
    });
  });

  describe('Provider Swapping Regression', () => {
    it('only the new registry receives events after setMetricsRegistry()', () => {
      // Start with NoOp — events should be silently dropped
      const noOpRegistry = new NoOpMetricsRegistry();
      setMetricsRegistry(noOpRegistry);

      getMetrics().incrementCounter('ledger_transactions_created_total', 10);

      // NoOp always returns empty summaries
      const noOpSummaries = getMetrics().getAllSummaries();
      expect(noOpSummaries.financial).toEqual({});

      // Swap to InMemory — only new events should appear
      const inMemoryRegistry = new InMemoryMetricsRegistry();
      setMetricsRegistry(inMemoryRegistry);

      getMetrics().incrementCounter('ledger_transactions_created_total', 3);
      getMetrics().incrementCounter('ledger_retry_attempts_total', 7);

      const summaries = getMetrics().getAllSummaries();
      // Should only have the 3 recorded after swap, not the 10 from NoOp
      expect(summaries.financial.ledger_transactions_created_total).toBe(3);
      expect(summaries.retry.ledger_retry_attempts_total).toBe(7);
    });
  });

  describe('Edge Cases', () => {
    it('returns sensible defaults for partially filled ring buffers', () => {
      // Only 3 samples — less than buffer size
      getMetrics().recordHistogram('ledger_api_latency_ms', 10);
      getMetrics().recordHistogram('ledger_api_latency_ms', 20);
      getMetrics().recordHistogram('ledger_api_latency_ms', 30);

      const summaries = getMetrics().getAllSummaries();
      const apiStats: any = summaries.api.ledger_api_latency_ms;

      expect(apiStats.count).toBe(3);
      expect(apiStats.avg).toBe(20);
      // With 3 samples sorted [10, 20, 30], all percentiles resolve to valid values
      expect(apiStats.p50).toBeGreaterThanOrEqual(10);
      expect(apiStats.p99).toBeGreaterThanOrEqual(10);
    });

    it('returns zero defaults when no samples recorded', () => {
      const summaries = getMetrics().getAllSummaries();
      const apiStats: any = summaries.api.ledger_api_latency_ms;

      expect(apiStats.count).toBe(0);
      expect(apiStats.avg).toBe(0);
      expect(apiStats.p50).toBe(0);
      expect(apiStats.p90).toBe(0);
      expect(apiStats.p95).toBe(0);
      expect(apiStats.p99).toBe(0);
    });
  });
});
