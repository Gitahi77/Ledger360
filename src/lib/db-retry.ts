import { Prisma } from '@prisma/client';
import { logger } from './logger';
import { getRetryCollector } from './metrics/RetryCollector';

interface RetryOptions {
  maxRetries?: number;
  maxElapsedMs?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  operationName?: string;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  maxElapsedMs: 2000,
  baseDelayMs: 100,
  maxDelayMs: 700,
  operationName: 'db_transaction',
};

/**
 * Executes a database operation with exponential backoff and jitter.
 * ONLY retries transient errors (P2034 - Deadlock/Write Conflict).
 * Note: P2024 (Pool Timeout) is NOT retried by default until instrumented and proven transient.
 * 
 * Generic Infrastructure Constraint: 
 * This wrapper must remain generic infrastructure. It must never contain business logic, 
 * modify transaction contents, suppress exceptions, or bypass database consistency checks.
 * Retries must preserve the original idempotency key, request hash, and correlation ID 
 * across attempts.
 * 
 * @param operation The database operation to execute. MUST be an async function.
 * @param options Retry options (maxRetries, maxElapsedMs, delays, etc.)
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let attempt = 1;
  const startTime = Date.now();

  while (true) {
    try {
      getRetryCollector().recordAttempt();
      const result = await operation();
      
      const elapsedMs = Date.now() - startTime;
      getRetryCollector().recordSuccess(attempt, elapsedMs);

      if (attempt > 1) {
        logger.info({
          component: 'db-retry',
          action: 'retry_succeeded',
          message: `Operation ${config.operationName} succeeded after ${attempt - 1} retries`,
          metadata: { attempt, operationName: config.operationName, elapsedMs: Date.now() - startTime }
        });
      }
      
      return result;
    } catch (error) {
      if (!isTransientError(error)) {
        // Business errors, validations, duplicate keys, etc.
        // Also record this as a failure so it counts towards total ops and latency
        getRetryCollector().recordFailure(attempt, Date.now() - startTime);
        throw error; 
      }

      const elapsedMs = Date.now() - startTime;
      
      if (attempt > config.maxRetries || elapsedMs >= config.maxElapsedMs) {
        getRetryCollector().recordFailure(attempt, elapsedMs);
        logger.error({
          component: 'db-retry',
          action: 'retry_exhausted',
          message: `Operation ${config.operationName} failed after ${attempt - 1} retries or budget exceeded`,
          error,
          metadata: { maxRetries: config.maxRetries, maxElapsedMs: config.maxElapsedMs, elapsedMs, operationName: config.operationName },
        });
        throw error;
      }

      const delayMs = calculateJitteredDelay(attempt, config.baseDelayMs, config.maxDelayMs);
      
      // Ensure we don't sleep past the maxElapsedMs budget
      const timeRemaining = config.maxElapsedMs - (Date.now() - startTime);
      const actualDelayMs = Math.min(delayMs, timeRemaining);
      
      if (actualDelayMs <= 0) {
        getRetryCollector().recordFailure(attempt, elapsedMs);
        logger.error({
          component: 'db-retry',
          action: 'retry_exhausted',
          message: `Operation ${config.operationName} retry budget exceeded`,
          error,
          metadata: { maxElapsedMs: config.maxElapsedMs, operationName: config.operationName },
        });
        throw error;
      }

      logger.warn({
        component: 'db-retry',
        action: 'transient_failure_retry',
        message: `Transient DB failure (Attempt ${attempt}/${config.maxRetries}). Retrying in ${actualDelayMs}ms...`,
        error,
        metadata: { attempt, delayMs: actualDelayMs, elapsedMs, operationName: config.operationName },
      });

      await new Promise((resolve) => setTimeout(resolve, actualDelayMs));
      attempt++;
    }
  }
}

function isTransientError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P2034: Transaction failed due to a write conflict or a deadlock.
    if (error.code === 'P2034') {
      getRetryCollector().recordP2034();
      return true;
    }
    
    // P2024: Pool timeout. We log/instrument this, but DO NOT automatically retry
    // until we perform RCAs on pool exhaustion limits.
    if (error.code === 'P2024') {
      getRetryCollector().recordP2024();
      logger.warn({
        component: 'db-retry',
        action: 'pool_exhaustion_detected',
        message: 'P2024 Pool Timeout detected. Not retrying by default.',
        error,
      });
      return false;
    }
  }
  return false;
}

function calculateJitteredDelay(attempt: number, baseDelayMs: number, maxDelayMs: number): number {
  // Exponential backoff: baseDelay * 2^(attempt - 1)
  const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
  
  // Add 0-50% jitter
  const jitter = exponentialDelay * 0.5 * Math.random();
  
  const finalDelay = Math.floor(exponentialDelay + jitter);
  
  return Math.min(finalDelay, maxDelayMs);
}
