import { ZodError, ZodSchema } from 'zod';
import { NextResponse } from 'next/server';
import { ActionResult, ActionErrorCode } from './types/action-result';
import { AuthorizationError } from './authz';

/**
 * Standardized API validation error response (for Route Handlers)
 */
export function respondValidationError(error: ZodError, context: string): NextResponse {
  console.warn(`[Validation Error] ${context}:`, error.flatten().fieldErrors);
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: error.flatten().fieldErrors,
    },
    { status: 400 }
  );
}

/**
 * Standardized API error response (for Route Handlers)
 */
export function respondError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Standardized Server Action validation error response
 */
export function actionValidationError(error: ZodError, context: string): ActionResult<never> {
  console.warn(`[Validation Error] ${context}:`, error.flatten().fieldErrors);
  // Flattening or picking first error message for simple client display
  const firstError = error.issues[0]?.message || 'Invalid input';
  return { success: false, code: 'VALIDATION', error: firstError, message: firstError };
}

/**
 * Validates input against a Zod schema.
 * Throws a formatted ZodError if validation fails, which should be caught and
 * passed to `respondValidationError` or `actionValidationError`.
 */
export function validate<T>(schema: ZodSchema<T>, input: unknown, context: string): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    console.warn(`[Validation Failed] ${context}`, parsed.error.flatten().fieldErrors);
    throw parsed.error;
  }
  return parsed.data;
}

import { AppError } from './errors';
import { logger } from './logger';
import { getRequestId, getRequestContext } from './request-context';
import { getMetrics } from './metrics/MetricsRegistry';

/**
 * Safe validate helper that returns a Result tuple instead of throwing.
 * Useful for Server Actions to avoid try/catch boilerplate.
 */
export function safeValidate<T>(schema: ZodSchema<T>, input: unknown, context: string): { success: true; data: T } | { success: false; error: ActionResult<never> } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: actionValidationError(parsed.error, context) };
  }
  return { success: true, data: parsed.data };
}

import { checkIdempotency, hashPayload, lockIdempotencyKey, saveIdempotencyResponse, releaseIdempotencyLock } from './api/idempotency';

export interface ActionOptions<TInput, TResult> {
  actionName: string;
  idempotencyKey?: string;
  input?: TInput;
  handler: () => Promise<ActionResult<TResult>>;
}

/**
 * Standardized wrapper for Server Actions.
 * Handles performance timing, error mapping, structured operational logging, and idempotency.
 */
export async function withAction<TInput, TResult>(
  options: ActionOptions<TInput, TResult>
): Promise<ActionResult<TResult>> {
  const { actionName, idempotencyKey, input, handler } = options;
  const started = performance.now();
  const requestId = await getRequestId();
  
  let holdsLock = false;
  let fullIdempotencyKey: string | null = null;
  let phash = '';

  try {
    logger.info({ requestId, action: actionName, message: 'Action started' });

    if (idempotencyKey) {
      phash = hashPayload(input);
      fullIdempotencyKey = `idemp:${actionName}:${idempotencyKey}`;
      
      const existing = await checkIdempotency(fullIdempotencyKey);
      if (existing) {
        if (existing.processingStatus === 'PROCESSING') {
          return { success: false, code: 'CONFLICT', message: 'Request already in progress' };
        }
        if (existing.processingStatus === 'COMPLETED') {
          if (existing.requestHash !== phash) {
            return { success: false, code: 'CONFLICT', message: 'Idempotency key reused with different payload' };
          }
          return existing.serializedResponse as ActionResult<TResult>;
        }
      }

      const locked = await lockIdempotencyKey(fullIdempotencyKey, phash);
      if (!locked) {
        return { success: false, code: 'CONFLICT', message: 'Request already in progress' };
      }
      holdsLock = true;
    }

    const result = await handler();
    
    if (holdsLock && fullIdempotencyKey && result.success) {
      const resourceId = (result.data as Record<string, unknown>)?.id as string | undefined;
      await saveIdempotencyResponse(fullIdempotencyKey, phash, 200, result, resourceId);
    }
    
    // Only release lock if there was a transient failure? Wait, if it fails predictably (validation), we should release the lock so they can retry.
    // If it fails, we release the lock.
    if (holdsLock && fullIdempotencyKey && !result.success) {
      await releaseIdempotencyLock(fullIdempotencyKey);
    }

    const durationMs = Math.round(performance.now() - started);
    getMetrics().incrementCounter('ledger_api_requests_total');
    getMetrics().recordHistogram('ledger_api_latency_ms', durationMs);

    if (!result.success) {
      getMetrics().incrementCounter('ledger_api_errors_total');
    }
    
    let metrics = {};
    let poolMetrics = {};
    try {
      const ctx = await getRequestContext();
      metrics = {
        metrics: ctx.metrics,
        dbQueries: ctx.queryCount,
      };

      if (ctx.queryCount > 0) {
        try {
          const { prisma } = await import('@/lib/prisma');
          const pMetrics = await (prisma as unknown as { $metrics: { json: () => Promise<{ gauges: { key: string; value: number }[]; counters: { key: string; value: number }[] }> } }).$metrics.json();
          const activeConnections = pMetrics.gauges.find((g) => g.key === 'prisma_pool_connections_busy')?.value || 0;
          const idleConnections = pMetrics.gauges.find((g) => g.key === 'prisma_pool_connections_idle')?.value || 0;
          const waitCount = pMetrics.counters.find((c) => c.key === 'prisma_client_queries_wait')?.value || 0;
          
          poolMetrics = {
            poolActive: activeConnections,
            poolIdle: idleConnections,
            poolWaitCount: waitCount,
          };
        } catch {}
      }
    } catch {
      // Outside request context fallback
    }

    // Try to stringify payload for size
    let payloadSize = 0;
    try { payloadSize = input ? JSON.stringify(input).length : 0; } catch {}

    let responseSize = 0;
    try { responseSize = result ? JSON.stringify(result).length : 0; } catch {}

    logger.info({
      requestId,
      action: actionName,
      durationMs,
      payloadSize,
      responseSize,
      ...metrics,
      ...poolMetrics,
      outcome: result.success ? 'success' : 'failure',
      errorCode: result.success ? undefined : result.code,
      message: result.success ? 'Action completed successfully' : 'Action completed with failure'
    });
    
    return result;
  } catch (error) {
    const durationMs = Math.round(performance.now() - started);
    getMetrics().incrementCounter('ledger_api_requests_total');
    getMetrics().incrementCounter('ledger_api_errors_total');
    getMetrics().recordHistogram('ledger_api_latency_ms', durationMs);

    if (holdsLock && fullIdempotencyKey) {
      await releaseIdempotencyLock(fullIdempotencyKey);
    }
    
    let appError: AppError;
    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof AuthorizationError) {
      appError = AppError.Authorization(error.message);
    } else {
      appError = AppError.Internal(error instanceof Error ? error.message : 'An unexpected error occurred');
    }

    logger.error({
      requestId,
      action: actionName,
      durationMs,
      outcome: 'failure',
      errorCode: appError.code,
      message: appError.message,
      error,
    });

    return { success: false, code: appError.code as ActionErrorCode, message: appError.message };
  }
}
