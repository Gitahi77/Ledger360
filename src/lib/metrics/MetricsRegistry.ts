/**
 * Finance-Grade Observability Metrics System for Ledger360.
 * Follows Prometheus / OpenTelemetry naming conventions.
 * Strictly non-blocking and isolated: exceptions in metrics collection NEVER crash financial transactions.
 */

export interface MetricSummary {
  name: string;
  type: 'counter' | 'histogram' | 'gauge';
  value?: number;
  count?: number;
  p50?: number;
  p90?: number;
  p95?: number;
  p99?: number;
  avg?: number;
  metadata?: Record<string, unknown>;
}

export interface MetricsGroupSummary {
  financial: Record<string, unknown>;
  database: Record<string, unknown>;
  api: Record<string, unknown>;
  retry: Record<string, unknown>;
  business: Record<string, unknown>;
  health: Record<string, unknown>;
}

export interface MetricsRegistry {
  incrementCounter(name: string, value?: number, labels?: Record<string, string>): void;
  recordHistogram(name: string, valueMs: number, labels?: Record<string, string>): void;
  getGroupSummary(group?: string): Record<string, unknown>;
  getAllSummaries(): MetricsGroupSummary;
  reset(): void;
}

export class NoOpMetricsRegistry implements MetricsRegistry {
  incrementCounter(): void {}
  recordHistogram(): void {}
  getGroupSummary(): Record<string, unknown> { return {}; }
  getAllSummaries(): MetricsGroupSummary {
    return { financial: {}, database: {}, api: {}, retry: {}, business: {}, health: {} };
  }
  reset(): void {}
}

const RING_BUFFER_SIZE = 1000;

class RingBuffer {
  private buffer: number[] = new Array(RING_BUFFER_SIZE);
  private head = 0;
  private count = 0;
  public overwrites = 0;

  push(val: number): void {
    if (this.count >= RING_BUFFER_SIZE) {
      this.overwrites++;
    }
    this.buffer[this.head] = val;
    this.head = (this.head + 1) % RING_BUFFER_SIZE;
    if (this.count < RING_BUFFER_SIZE) {
      this.count++;
    }
  }

  getValues(): number[] {
    if (this.count < RING_BUFFER_SIZE) {
      return this.buffer.slice(0, this.count);
    }
    return [...this.buffer.slice(this.head), ...this.buffer.slice(0, this.head)];
  }

  get Stats() {
    const vals = this.getValues().sort((a, b) => a - b);
    if (vals.length === 0) {
      return { count: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
    }
    const sum = vals.reduce((acc, v) => acc + v, 0);
    return {
      count: vals.length,
      avg: Math.round((sum / vals.length) * 100) / 100,
      p50: vals[Math.floor(vals.length * 0.50)] || 0,
      p90: vals[Math.floor(vals.length * 0.90)] || 0,
      p95: vals[Math.floor(vals.length * 0.95)] || 0,
      p99: vals[Math.floor(vals.length * 0.99)] || 0,
    };
  }

  reset(): void {
    this.head = 0;
    this.count = 0;
    this.overwrites = 0;
  }

  get utilization(): number {
    return Math.round((this.count / RING_BUFFER_SIZE) * 100);
  }
}

export class InMemoryMetricsRegistry implements MetricsRegistry {
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, RingBuffer> = new Map();
  public droppedEvents = 0;

  private tryRecord(fn: () => void): void {
    try {
      fn();
    } catch {
      this.droppedEvents++;
    }
  }

  incrementCounter(name: string, value = 1): void {
    this.tryRecord(() => {
      const current = this.counters.get(name) || 0;
      this.counters.set(name, current + value);
    });
  }

  recordHistogram(name: string, valueMs: number): void {
    this.tryRecord(() => {
      let buf = this.histograms.get(name);
      if (!buf) {
        buf = new RingBuffer();
        this.histograms.set(name, buf);
      }
      buf.push(valueMs);
    });
  }

  reset(): void {
    this.counters.clear();
    this.histograms.forEach(buf => buf.reset());
    this.histograms.clear();
    this.droppedEvents = 0;
  }

  private getHistogramStats(name: string) {
    const buf = this.histograms.get(name);
    if (!buf) return { count: 0, avg: 0, p50: 0, p90: 0, p95: 0, p99: 0 };
    return buf.Stats;
  }

  getAllSummaries(): MetricsGroupSummary {
    let totalOverwrites = 0;
    let totalBufferCount = 0;
    this.histograms.forEach(buf => {
      totalOverwrites += buf.overwrites;
      totalBufferCount += buf.utilization;
    });
    const avgBufferUtilization = this.histograms.size > 0 
      ? Math.round(totalBufferCount / this.histograms.size) 
      : 0;

    return {
      financial: {
        ledger_transactions_created_total: this.counters.get('ledger_transactions_created_total') || 0,
        ledger_transfers_created_total: this.counters.get('ledger_transfers_created_total') || 0,
        ledger_loan_repayments_total: this.counters.get('ledger_loan_repayments_total') || 0,
        ledger_reconciliations_total: this.counters.get('ledger_reconciliations_total') || 0,
        ledger_drift_detections_total: this.counters.get('ledger_drift_detections_total') || 0,
        ledger_balance_rebuilds_total: this.counters.get('ledger_balance_rebuilds_total') || 0,
      },
      database: {
        ledger_db_query_duration_ms: this.getHistogramStats('ledger_db_query_duration_ms'),
        ledger_lock_wait_ms: this.getHistogramStats('ledger_lock_wait_ms'),
        ledger_transaction_duration_ms: this.getHistogramStats('ledger_transaction_duration_ms'),
        ledger_slow_queries_total: this.counters.get('ledger_slow_queries_total') || 0,
      },
      api: {
        ledger_api_requests_total: this.counters.get('ledger_api_requests_total') || 0,
        ledger_api_errors_total: this.counters.get('ledger_api_errors_total') || 0,
        ledger_api_latency_ms: this.getHistogramStats('ledger_api_latency_ms'),
      },
      retry: {
        ledger_retry_attempts_total: this.counters.get('ledger_retry_attempts_total') || 0,
        ledger_retry_successes_total: this.counters.get('ledger_retry_successes_total') || 0,
        ledger_retry_exhausted_total: this.counters.get('ledger_retry_exhausted_total') || 0,
        ledger_retry_aborted_total: this.counters.get('ledger_retry_aborted_total') || 0,
        ledger_p2034_total: this.counters.get('ledger_p2034_total') || 0,
        ledger_p2024_total: this.counters.get('ledger_p2024_total') || 0,
      },
      business: {
        ledger_imports_completed_total: this.counters.get('ledger_imports_completed_total') || 0,
        ledger_imports_failed_total: this.counters.get('ledger_imports_failed_total') || 0,
        ledger_duplicate_imports_total: this.counters.get('ledger_duplicate_imports_total') || 0,
        ledger_idempotency_hits_total: this.counters.get('ledger_idempotency_hits_total') || 0,
        ledger_idempotency_misses_total: this.counters.get('ledger_idempotency_misses_total') || 0,
      },
      health: {
        ledger_metrics_registry_status: 'healthy',
        ledger_metrics_dropped_events_total: this.droppedEvents,
        ledger_metrics_buffer_overwrites_total: totalOverwrites,
        ledger_metrics_buffer_utilization_pct: avgBufferUtilization,
      }
    };
  }

  getGroupSummary(group?: string): Record<string, unknown> {
    const all = this.getAllSummaries();
    if (group && group in all) {
      return (all as any)[group];
    }
    return all as any;
  }
}

/**
 * Proxy wrapper around any MetricsRegistry to guarantee that exceptions thrown
 * by underlying registry implementations never propagate to calling application code.
 */
class SafeMetricsRegistryProxy implements MetricsRegistry {
  constructor(private target: MetricsRegistry) {}

  private safeCall(fn: () => void) {
    try {
      fn();
    } catch {
      // Swallowed safely to guarantee financial operations are immune to telemetry errors
    }
  }

  incrementCounter(name: string, value?: number, labels?: Record<string, string>): void {
    this.safeCall(() => this.target.incrementCounter(name, value, labels));
  }

  recordHistogram(name: string, valueMs: number, labels?: Record<string, string>): void {
    this.safeCall(() => this.target.recordHistogram(name, valueMs, labels));
  }

  getGroupSummary(group?: string): Record<string, unknown> {
    try {
      return this.target.getGroupSummary(group);
    } catch {
      return {};
    }
  }

  getAllSummaries(): MetricsGroupSummary {
    try {
      return this.target.getAllSummaries();
    } catch {
      return { financial: {}, database: {}, api: {}, retry: {}, business: {}, health: {} };
    }
  }

  reset(): void {
    this.safeCall(() => this.target.reset());
  }
}

/**
 * Singleton MetricsProvider.
 * Returns a cached safety proxy wrapping the active registry implementation.
 * The proxy is only recreated when the registry is swapped via setMetricsRegistry().
 */
let activeRegistry: MetricsRegistry = new InMemoryMetricsRegistry();
let cachedProxy: MetricsRegistry = new SafeMetricsRegistryProxy(activeRegistry);

export function getMetrics(): MetricsRegistry {
  return cachedProxy;
}

export function setMetricsRegistry(registry: MetricsRegistry): void {
  activeRegistry = registry;
  cachedProxy = new SafeMetricsRegistryProxy(registry);
}
