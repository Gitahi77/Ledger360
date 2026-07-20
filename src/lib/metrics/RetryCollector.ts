export interface RetryMetricsCollector {
  recordAttempt(): void;
  recordSuccess(attempt: number, latencyMs: number): void;
  recordFailure(attempt: number, latencyMs: number): void;
  recordP2034(): void;
  recordP2024(): void;
}

export class NoOpRetryCollector implements RetryMetricsCollector {
  recordAttempt(): void {}
  recordSuccess(attempt: number, latencyMs: number): void {}
  recordFailure(attempt: number, latencyMs: number): void {}
  recordP2034(): void {}
  recordP2024(): void {}
}

export class InMemoryRetryCollector implements RetryMetricsCollector {
  public attempts = 0;
  public success = 0;
  public failure = 0;
  public p2034Count = 0;
  public p2024Count = 0;
  public latencies: number[] = [];
  public retryHistogram: Record<number, number> = {};

  recordAttempt(): void {
    this.attempts++;
  }

  recordSuccess(attempt: number, latencyMs: number): void {
    this.success++;
    this.latencies.push(latencyMs);
    const retries = attempt - 1;
    this.retryHistogram[retries] = (this.retryHistogram[retries] || 0) + 1;
  }

  recordFailure(attempt: number, latencyMs: number): void {
    this.failure++;
    this.latencies.push(latencyMs);
    const retries = attempt - 1;
    this.retryHistogram[retries] = (this.retryHistogram[retries] || 0) + 1;
  }

  recordP2034(): void {
    this.p2034Count++;
  }

  recordP2024(): void {
    this.p2024Count++;
  }

  reset(): void {
    this.attempts = 0;
    this.success = 0;
    this.failure = 0;
    this.p2034Count = 0;
    this.p2024Count = 0;
    this.latencies = [];
    this.retryHistogram = {};
  }

  getMetricsSummary() {
    const totalRequests = this.success + this.failure;
    const avgLatency = this.latencies.length > 0 
      ? this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length 
      : 0;

    const sortedLatencies = [...this.latencies].sort((a, b) => a - b);
    const p50 = sortedLatencies.length > 0 ? sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] : 0;
    const p95 = sortedLatencies.length > 0 ? sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] : 0;
    const p99 = sortedLatencies.length > 0 ? sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] : 0;

    const histogramPercentages: Record<string, string> = {};
    for (const [retries, count] of Object.entries(this.retryHistogram)) {
      histogramPercentages[`${retries} retries`] = totalRequests > 0 
        ? `${((count / totalRequests) * 100).toFixed(1)}%` 
        : '0%';
    }

    return {
      totalRequests,
      success: this.success,
      failure: this.failure,
      p2034Count: this.p2034Count,
      p2024Count: this.p2024Count,
      latency: {
        avg: avgLatency,
        p50,
        p95,
        p99
      },
      retryHistogram: histogramPercentages
    };
  }
}

// Global registry for testing
let currentCollector: RetryMetricsCollector = new NoOpRetryCollector();

export function setRetryCollector(collector: RetryMetricsCollector) {
  currentCollector = collector;
}

export function getRetryCollector() {
  return currentCollector;
}
