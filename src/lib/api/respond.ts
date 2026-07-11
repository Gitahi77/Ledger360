// src/lib/api/respond.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkLimit } from '@/lib/rateLimit';
import { z } from 'zod';
import { checkIdempotency, lockIdempotencyKey, saveIdempotencyResponse, releaseIdempotencyLock } from './idempotency';

type RouteHandler<T, U> = (
  req: NextRequest,
  context: {
    userId: string;
    body: T;
  }
) => Promise<U>;

export type ApiResponse<T> = {
  data: T | null;
  error: {
    code: 'UNAUTHORIZED' | 'VALIDATION_ERROR' | 'RATE_LIMITED' | 'NOT_FOUND' | 'INTERNAL' | 'CONFLICT';
    message: string;
    details?: unknown;
  } | null;
  meta: {
    requestId: string;
    [key: string]: unknown;
  };
};

function createResponse<T>(
  data: T | null, 
  error: ApiResponse<T>['error'], 
  status: number, 
  requestId: string
) {
  return NextResponse.json(
    { data, error, meta: { requestId } } as ApiResponse<T>,
    { status }
  );
}

export function apiRoute<T = unknown, U = unknown>(
  schema: z.ZodType<T> | null,
  handler: RouteHandler<T, U>
) {
  return async function(req: NextRequest): Promise<NextResponse> {
    const requestId = crypto.randomUUID();

    try {
      // 1. Authentication Seam
      // TODO (WO-12 Deferred): Add support for Bearer token extraction here when token issuance is built.
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return createResponse(null, { code: 'UNAUTHORIZED', message: 'Authentication required' }, 401, requestId);
      }
      const userId = session.user.id;

      // 2. Rate Limiting (I-14)
      const limit = await checkLimit('api', `api:${userId}`);
      if (!limit.ok) {
        return createResponse(null, { code: 'RATE_LIMITED', message: 'Too many requests' }, 429, requestId);
      }

      // 3. Idempotency Check (I-23)
      const method = req.method;
      const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
      const clientKey = req.headers.get('idempotency-key');
      let idempotencyKey: string | null = null;
      let holdsLock = false;

      if (isMutation && clientKey) {
        // Strict namespace to prevent collisions
        idempotencyKey = `idemp:${userId}:${method}:${req.nextUrl.pathname}:${clientKey}`;
        
        const existing = await checkIdempotency(idempotencyKey);
        
        if (existing) {
          if (existing.status === 'PROCESSING') {
            return createResponse(
              null, 
              { code: 'CONFLICT', message: 'Request already in progress' }, 
              409, 
              requestId
            );
          }
          if (existing.status === 'COMPLETED') {
            // Note: cached response is the exact JSON structure we returned previously
            return NextResponse.json(existing.response, { status: 200 });
          }
        }

        // Try to acquire lock
        const locked = await lockIdempotencyKey(idempotencyKey);
        if (!locked) {
          // Lost the race condition to another identical request
          return createResponse(
            null, 
            { code: 'CONFLICT', message: 'Request already in progress' }, 
            409, 
            requestId
          );
        }
        holdsLock = true;
      }

      // 4. Validation (I-7)
      let bodyData: T = {} as T;
      if (schema) {
        try {
          const rawBody = await req.json();
          bodyData = schema.parse(rawBody);
        } catch (err) {
          if (holdsLock && idempotencyKey) await releaseIdempotencyLock(idempotencyKey);
          
          if (err instanceof z.ZodError) {
            return createResponse(
              null, 
              { code: 'VALIDATION_ERROR', message: 'Invalid input', details: (err as z.ZodError<unknown>).issues }, 
              400, 
              requestId
            );
          }
          return createResponse(
            null, 
            { code: 'VALIDATION_ERROR', message: 'Invalid JSON payload' }, 
            400, 
            requestId
          );
        }
      }

      // 5. Execution (Scoped to userId via the action inherently)
      const result = await handler(req, { userId, body: bodyData });

      // 6. Response & Idempotency Save
      const envelope = { data: result, error: null, meta: { requestId } };
      
      if (holdsLock && idempotencyKey) {
        await saveIdempotencyResponse(idempotencyKey, envelope);
      }

      return NextResponse.json(envelope, { status: 200 });

    } catch (error: unknown) {
      console.error(`[API Error] ${req.method} ${req.nextUrl.pathname}:`, error);

      // If we errored internally, release the idempotency lock so they can retry
      // We only do this if it's an unexpected error, allowing a clean retry
      const method = req.method;
      const clientKey = req.headers.get('idempotency-key');
      const session = await getServerSession(authOptions);
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && clientKey && session?.user?.id) {
        const idempotencyKey = `idemp:${session.user.id}:${method}:${req.nextUrl.pathname}:${clientKey}`;
        await releaseIdempotencyLock(idempotencyKey);
      }

      // Map specific error messages from actions to structured codes where possible
      let code: ApiResponse<unknown>['error'] = { code: 'INTERNAL', message: 'Internal server error' };
      let status = 500;

      if (error instanceof Error) {
        if (error.message.includes('not found') || error.message.includes('unauthorized')) {
          code = { code: 'NOT_FOUND', message: 'Resource not found or unauthorized' };
          status = 404;
        } else if (error.message.includes('Cannot delete')) {
          code = { code: 'CONFLICT', message: error.message };
          status = 409;
        } else if (error.message.includes('Invalid') || error.message.includes('missing')) {
          code = { code: 'VALIDATION_ERROR', message: error.message };
          status = 400;
        }
      }

      return createResponse(null, code, status, requestId);
    }
  };
}
