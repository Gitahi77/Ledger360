// src/lib/api/idempotency.ts
import { Redis } from '@upstash/redis';

// We share the same Upstash Redis instance as the rate limiter
const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = hasRedis ? Redis.fromEnv() : null;

export type IdempotencyStatus = 'PROCESSING' | 'COMPLETED';

export async function checkIdempotency(key: string): Promise<{ status: IdempotencyStatus, response?: any } | null> {
  if (!redis) return null;
  try {
    const cached = await redis.get<any>(key);
    
    if (cached === null) {
      return null;
    }
    
    // Upstash Redis automatically JSON parses results if possible.
    // If it's the raw string "PROCESSING" (or JSON '"PROCESSING"'), handle it.
    if (cached === 'PROCESSING' || cached === '"PROCESSING"') {
      return { status: 'PROCESSING' };
    }
    
    return { status: 'COMPLETED', response: cached };
  } catch (error) {
    // If Redis fails, we should probably fail open or log it, 
    // but throwing is safer to avoid double processing in a strict financial context.
    console.error('Idempotency Redis check failed:', error);
    throw new Error('Internal error checking idempotency key');
  }
}

export async function lockIdempotencyKey(key: string): Promise<boolean> {
  if (!redis) return true; // Fail open if no redis
  try {
    // nx: true ensures this only sets if the key does NOT exist
    const result = await redis.set(key, 'PROCESSING', { nx: true, ex: 86400 });
    return result === 'OK';
  } catch (error) {
    console.error('Idempotency Redis lock failed:', error);
    return false; // Treat as failed lock to be safe
  }
}

export async function saveIdempotencyResponse(key: string, response: any): Promise<void> {
  if (!redis) return;
  try {
    // Overwrite the 'PROCESSING' lock with the actual response, keep 24h expiry
    await redis.set(key, response, { ex: 86400 });
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
