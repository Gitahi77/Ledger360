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
});
