import { logger } from '../logger';

/**
 * Wraps a repository function to automatically collect metrics
 * (latency, rows returned, errors).
 */
export function withMetric<T extends (...args: any[]) => any>(
  repositoryName: string,
  methodName: string,
  fn: T
): T {
  return async function (...args: any[]) {
    const start = performance.now();
    let success = true;
    let rowsReturned = 0;

    try {
      const result = await fn(...args);
      rowsReturned = Array.isArray(result) ? result.length : (result ? 1 : 0);
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const durationMs = Math.round(performance.now() - start);
      logger.info({
        action: 'REPOSITORY_METRIC',
        repository: repositoryName,
        method: methodName,
        durationMs,
        rowsReturned,
        success
      });
    }
  } as unknown as T;
}
