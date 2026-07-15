import { Redis } from '@upstash/redis';
import crypto from 'crypto';

// We share the same Upstash Redis instance as the rate limiter
const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = hasRedis ? Redis.fromEnv() : null;

export type IdempotencyStatus = 'PROCESSING' | 'COMPLETED';

export interface IdempotencyRecord {
  status: IdempotencyStatus;
  payloadHash: string;
  owner?: string;
  startedAt?: number;
  response?: unknown;
}

export function hashPayload(payload: unknown): string {
  if (payload === undefined || payload === null) return '';
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHash('sha256').update(str).digest('hex');
}

export async function checkIdempotency(key: string): Promise<IdempotencyRecord | null> {
  if (!redis) return null;
  try {
    const cached = await redis.get<IdempotencyRecord | string>(key);
    
    if (cached === null) {
      return null;
    }
    
    // Fallback for old 'PROCESSING' strings left over from Phase 4A
    if (cached === 'PROCESSING' || cached === '"PROCESSING"') {
      return { status: 'PROCESSING', payloadHash: '' };
    }
    
    // If it's a legacy cached response without our new wrapper
    if (typeof cached === 'object' && !('status' in cached)) {
      return { status: 'COMPLETED', payloadHash: '', response: cached };
    }
    
    return cached as IdempotencyRecord;
  } catch (error) {
    console.error('Idempotency Redis check failed:', error);
    throw new Error('Internal error checking idempotency key');
  }
}

export async function lockIdempotencyKey(key: string, payloadHash: string): Promise<boolean> {
  if (!redis) return true; // Fail open if no redis
  try {
    const owner = crypto.randomUUID();
    const record: IdempotencyRecord = {
      status: 'PROCESSING',
      payloadHash,
      owner,
      startedAt: Date.now(),
    };
    // nx: true ensures this only sets if the key does NOT exist
    const result = await redis.set(key, record, { nx: true, ex: 86400 });
    return result === 'OK';
  } catch (error) {
    console.error('Idempotency Redis lock failed:', error);
    return false; // Treat as failed lock to be safe
  }
}

export async function saveIdempotencyResponse(key: string, payloadHash: string, response: unknown): Promise<void> {
  if (!redis) return;
  try {
    const record: IdempotencyRecord = {
      status: 'COMPLETED',
      payloadHash,
      response,
    };
    // Overwrite the 'PROCESSING' lock with the actual response, keep 24h expiry
    await redis.set(key, record, { ex: 86400 });
  } catch (error) {
    console.error('Idempotency Redis save failed:', error);
  }
}

export async function releaseIdempotencyLock(key: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Idempotency Redis delete failed:', error);
  }
}
