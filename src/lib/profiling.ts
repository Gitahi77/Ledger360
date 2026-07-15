import { getRequestContext } from './request-context';

type PhaseName = 'validationTimeMs' | 'authorizationTimeMs' | 'businessLogicTimeMs' | 'serializationTimeMs';

/**
 * Wraps a synchronous or asynchronous function to measure its execution time,
 * adding the duration to the current RequestContext metrics.
 */
export async function measure<T>(phase: PhaseName, fn: () => T | Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = Math.round(performance.now() - start);
    try {
      const ctx = await getRequestContext();
      ctx.metrics[phase] += duration;
    } catch (e) {
      // Ignore if outside request context
    }
  }
}
