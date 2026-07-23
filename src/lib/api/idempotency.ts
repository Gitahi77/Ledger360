import { Redis } from '@upstash/redis';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// We share the same Upstash Redis instance as the rate limiter
const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = hasRedis ? Redis.fromEnv() : null;

export type IdempotencyStatus = 'PROCESSING' | 'COMPLETED';

export interface IdempotencyRecord {
  idempotencyKey: string;
  requestHash: string;
  responseStatus: number;
  serializedResponse?: unknown;
  resourceId?: string;
  createdAt: number;
  expiresAt: number;
  processingStatus: IdempotencyStatus;
}

export function hashPayload(payload: unknown): string {
  if (payload === undefined || payload === null) return '';
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHash('sha256').update(str).digest('hex');
}

export async function checkIdempotency(key: string): Promise<IdempotencyRecord | null> {
  // 1. Try Redis fast path
  if (redis) {
    try {
      const cached = await redis.get<IdempotencyRecord | string>(key);
      if (cached !== null) {
        if (cached === 'PROCESSING' || cached === '"PROCESSING"') {
          return { idempotencyKey: key, requestHash: '', responseStatus: 202, createdAt: Date.now(), expiresAt: Date.now() + 86400000, processingStatus: 'PROCESSING' };
        }
        if (typeof cached === 'object' && !('processingStatus' in cached) && !('status' in cached)) {
          return { idempotencyKey: key, requestHash: '', responseStatus: 200, serializedResponse: cached, createdAt: Date.now(), expiresAt: Date.now() + 86400000, processingStatus: 'COMPLETED' };
        }
        const record = cached as any;
        if (record.status) {
          return { idempotencyKey: key, requestHash: record.payloadHash || '', responseStatus: record.status === 'COMPLETED' ? 200 : 202, serializedResponse: record.response, createdAt: record.startedAt || Date.now(), expiresAt: Date.now() + 86400000, processingStatus: record.status };
        }
        return cached as IdempotencyRecord;
      }
    } catch (error) {
      console.warn('Idempotency Redis check failed, falling back to DB:', error);
    }
  }

  // 2. Try Database fallback
  try {
    const dbRecord = await prisma.idempotencyRecord.findUnique({ where: { idempotencyKey: key } });
    if (dbRecord) {
      return {
        idempotencyKey: dbRecord.idempotencyKey,
        requestHash: dbRecord.requestHash,
        responseStatus: dbRecord.responseStatus,
        serializedResponse: dbRecord.serializedResponse ? (dbRecord.serializedResponse as any) : undefined,
        resourceId: dbRecord.resourceId || undefined,
        createdAt: dbRecord.createdAt.getTime(),
        expiresAt: dbRecord.expiresAt.getTime(),
        processingStatus: dbRecord.processingStatus as IdempotencyStatus,
      };
    }
  } catch (error) {
    console.error('Idempotency DB check failed:', error);
  }

  return null;
}

export async function lockIdempotencyKey(key: string, requestHash: string): Promise<boolean> {
  const now = Date.now();
  const expiresAtMs = now + 86400000; // 24 hours
  
  // 1. Enforce lock in DB (Strong consistency)
  try {
    await prisma.idempotencyRecord.create({
      data: {
        idempotencyKey: key,
        requestHash,
        responseStatus: 202,
        processingStatus: 'PROCESSING',
        createdAt: new Date(now),
        expiresAt: new Date(expiresAtMs)
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      // Concurrent request beat us to it
      return false; 
    }
    console.error('Idempotency DB lock failed:', error);
    return false; // Fail safe
  }

  // 2. Cache in Redis
  if (redis) {
    try {
      const record: IdempotencyRecord = {
        idempotencyKey: key,
        requestHash,
        responseStatus: 202,
        createdAt: now,
        expiresAt: expiresAtMs,
        processingStatus: 'PROCESSING',
      };
      await redis.set(key, record, { ex: 86400 });
    } catch (error) {
      console.warn('Idempotency Redis lock sync failed:', error);
    }
  }

  return true;
}

export async function saveIdempotencyResponse(key: string, requestHash: string, responseStatus: number, serializedResponse: unknown, resourceId?: string): Promise<void> {
  const now = Date.now();
  const expiresAtMs = now + 86400000;

  // 1. Update DB Record
  try {
    await prisma.idempotencyRecord.update({
      where: { idempotencyKey: key },
      data: {
        responseStatus,
        serializedResponse: serializedResponse === undefined ? Prisma.DbNull : (serializedResponse as any),
        resourceId,
        processingStatus: 'COMPLETED'
      }
    });
  } catch (error) {
    console.error('Idempotency DB save failed:', error);
  }

  // 2. Update Redis Cache
  if (redis) {
    try {
      const record: IdempotencyRecord = {
        idempotencyKey: key,
        requestHash,
        responseStatus,
        serializedResponse,
        resourceId,
        createdAt: now,
        expiresAt: expiresAtMs,
        processingStatus: 'COMPLETED',
      };
      await redis.set(key, record, { ex: 86400 });
    } catch (error) {
      console.warn('Idempotency Redis save sync failed:', error);
    }
  }
}

export async function releaseIdempotencyLock(key: string): Promise<void> {
  // Only delete if it's still PROCESSING, so we don't delete completed records
  try {
    await prisma.idempotencyRecord.deleteMany({
      where: { 
        idempotencyKey: key,
        processingStatus: 'PROCESSING'
      }
    });
  } catch (error) {
    console.error('Idempotency DB release failed:', error);
  }

  if (redis) {
    try {
      await redis.del(key);
    } catch (error) {
      console.warn('Idempotency Redis release sync failed:', error);
    }
  }
}
