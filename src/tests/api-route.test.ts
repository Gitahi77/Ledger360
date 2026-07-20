import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { apiRoute } from '@/lib/api/respond';
import { z } from 'zod';
import * as auth from 'next-auth';
import * as rateLimit from '@/lib/rateLimit';
import * as idempotency from '@/lib/api/idempotency';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}));

vi.mock('@/lib/auth', () => ({
  authOptions: {}
}));

vi.mock('@/lib/rateLimit', () => ({
  checkLimit: vi.fn()
}));

vi.mock('@/lib/api/idempotency', () => ({
  checkIdempotency: vi.fn(),
  lockIdempotencyKey: vi.fn(),
  saveIdempotencyResponse: vi.fn(),
  releaseIdempotencyLock: vi.fn(),
  hashPayload: vi.fn()
}));

describe('apiRoute Wrapper', () => {
  const dummySchema = z.object({
    name: z.string()
  });

  const dummyHandler = vi.fn().mockResolvedValue({ success: true });

  const route = apiRoute(dummySchema, dummyHandler);

  function createRequest(method: string, body?: any, headers: Record<string, string> = {}) {
    const reqHeaders = new Headers();
    Object.entries(headers).forEach(([k, v]) => reqHeaders.set(k, v));
    
    return {
      method,
      nextUrl: { pathname: '/api/v1/test' },
      headers: reqHeaders,
      json: vi.fn().mockResolvedValue(body)
    } as unknown as NextRequest;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(rateLimit.checkLimit).mockResolvedValue({ ok: true, retryAfter: 0 });
    vi.mocked(auth.getServerSession).mockResolvedValue({ user: { id: 'user-1' } } as any);
    vi.mocked(idempotency.checkIdempotency).mockResolvedValue(null);
    vi.mocked(idempotency.hashPayload).mockReturnValue('hash');
    vi.mocked(idempotency.lockIdempotencyKey).mockResolvedValue(true);
  });

  it('(a) success returns the standard envelope with a requestId', async () => {
    const req = createRequest('POST', { name: 'Test' });
    const res = await route(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toEqual({ success: true });
    expect(json.error).toBeNull();
    expect(json.meta.requestId).toBeDefined();
    
    // Verify handler was called
    expect(dummyHandler).toHaveBeenCalledWith(req, { userId: 'user-1', body: { name: 'Test' } });
  });

  it('(b) unauthenticated -> UNAUTHORIZED/401', async () => {
    vi.mocked(auth.getServerSession).mockResolvedValue(null);
    const req = createRequest('GET');
    const res = await route(req);
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error?.code).toBe('UNAUTHORIZED');
  });

  it('(c) invalid body -> VALIDATION_ERROR/400', async () => {
    const req = createRequest('POST', { wrongField: 123 });
    const res = await route(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error?.code).toBe('VALIDATION');
    expect(json.error?.details).toBeDefined();
  });

  it('(d) over-limit -> RATE_LIMITED/429', async () => {
    vi.mocked(rateLimit.checkLimit).mockResolvedValue({ ok: false, retryAfter: 10 });
    const req = createRequest('GET');
    const res = await route(req);
    const json = await res.json();

    expect(res.status).toBe(429);
    expect(json.error?.code).toBe('RATE_LIMITED');
  });

  it('(e) a second request with the same Idempotency-Key while the first is in flight -> 409 CONFLICT', async () => {
    vi.mocked(idempotency.checkIdempotency).mockResolvedValue({ processingStatus: 'PROCESSING', requestHash: 'hash' } as any);
    const req = createRequest('POST', { name: 'Test' }, { 'idempotency-key': 'key-1' });
    const res = await route(req);
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error?.code).toBe('CONFLICT');
    expect(json.error?.message).toBe('Request already in progress');
  });

  it('(f) a repeated completed key returns the exact cached envelope', async () => {
    const cachedEnvelope = { data: { success: true }, error: null, meta: { requestId: 'old-req-id' } };
    vi.mocked(idempotency.checkIdempotency).mockResolvedValue({ processingStatus: 'COMPLETED', requestHash: 'hash', serializedResponse: cachedEnvelope } as any);
    const req = createRequest('POST', { name: 'Test' }, { 'idempotency-key': 'key-1' });
    const res = await route(req);
    const json = await res.json();

    // Should return exact cached response
    expect(res.status).toBe(200);
    expect(json).toEqual(cachedEnvelope);
    
    // Handler should NOT be called
    expect(dummyHandler).not.toHaveBeenCalled();
  });

  it('(g) an execution error releases the lock so a retry can proceed', async () => {
    const erroringHandler = vi.fn().mockRejectedValue(new Error('Some internal failure'));
    const errorRoute = apiRoute(dummySchema, erroringHandler);
    
    const req = createRequest('POST', { name: 'Test' }, { 'idempotency-key': 'key-err' });
    const res = await errorRoute(req);
    const json = await res.json();

    // Should return INTERNAL error
    expect(res.status).toBe(500);
    expect(json.error?.code).toBe('INTERNAL');
    
    // Verify lock was acquired then released
    expect(idempotency.lockIdempotencyKey).toHaveBeenCalled();
    expect(idempotency.releaseIdempotencyLock).toHaveBeenCalledWith(
      `idemp:user-1:POST:/api/v1/test:key-err`
    );
  });
});
