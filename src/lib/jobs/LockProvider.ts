import { Redis } from '@upstash/redis';
import { logger } from '@/lib/logger';
import { getMetrics } from '@/lib/metrics/MetricsRegistry';

export interface LockProvider {
  /**
   * Attempts to acquire a lock.
   * @param lockKey The unique identifier for the lock.
   * @param token The lease token uniquely identifying the lock owner.
   * @param ttlMs Time-to-live for the lock in milliseconds.
   * @returns true if acquired, false if held by someone else.
   */
  acquire(lockKey: string, token: string, ttlMs: number): Promise<boolean>;

  /**
   * Attempts to release a lock. Must only release if the current token matches the held token.
   * @param lockKey The unique identifier for the lock.
   * @param token The lease token of the owner trying to release.
   */
  release(lockKey: string, token: string): Promise<void>;
}

/**
 * Production Redis-based distributed lock provider.
 * Enforces mutual exclusion across serverless functions via SET NX PX and Lua script releases.
 */
export class RedisLockProvider implements LockProvider {
  private redis: Redis;

  constructor(redis?: Redis) {
    if (redis) {
      this.redis = redis;
    } else {
      if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        throw new Error('RedisLockProvider requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in production.');
      }
      this.redis = Redis.fromEnv();
    }
  }

  async acquire(lockKey: string, token: string, ttlMs: number): Promise<boolean> {
    const start = Date.now();
    try {
      const result = await this.redis.set(lockKey, token, {
        nx: true,
        px: ttlMs,
      });
      getMetrics().incrementCounter('ledger_lock_acquire_total');
      const success = result === 'OK';
      if (!success) {
        getMetrics().incrementCounter('ledger_lock_acquire_failed_total');
      }
      return success;
    } catch (error) {
      getMetrics().incrementCounter('ledger_lock_acquire_failed_total');
      logger.error({
        component: 'redis_lock_provider',
        action: 'lock_acquire_failed',
        message: `Failed to communicate with Redis for lock ${lockKey}`,
        error,
      });
      return false; // Fail safe
    } finally {
      getMetrics().recordHistogram('ledger_lock_wait_ms', Date.now() - start);
    }
  }

  async release(lockKey: string, token: string): Promise<void> {
    try {
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      await this.redis.eval(script, [lockKey], [token]);
      getMetrics().incrementCounter('ledger_lock_release_total');
    } catch (error) {
      logger.error({
        component: 'redis_lock_provider',
        action: 'lock_release_failed',
        message: `Failed to release lock ${lockKey}`,
        error,
        metadata: { lockKey },
      });
    }
  }
}

/**
 * In-memory lock provider for unit tests.
 * Satisfies the LockProvider contract strictly (mutual exclusion, token validation, TTL)
 * without attempting to be a full Redis emulator.
 */
export class InMemoryLockProvider implements LockProvider {
  private locks = new Map<string, { token: string; expiresAt: number }>();

  async acquire(lockKey: string, token: string, ttlMs: number): Promise<boolean> {
    getMetrics().incrementCounter('ledger_lock_acquire_total');
    const now = Date.now();
    const existing = this.locks.get(lockKey);

    if (existing) {
      if (existing.expiresAt > now) {
        // Lock is held and valid
        getMetrics().incrementCounter('ledger_lock_acquire_failed_total');
        return false;
      }
      // Lock expired, purge it before acquiring
      this.locks.delete(lockKey);
      getMetrics().incrementCounter('ledger_lock_timeout_total');
    }

    // Acquire lock
    this.locks.set(lockKey, { token, expiresAt: now + ttlMs });
    return true;
  }

  async release(lockKey: string, token: string): Promise<void> {
    const existing = this.locks.get(lockKey);
    if (!existing) {
      return; // Releasing nonexistent lock is harmless
    }

    if (existing.token === token) {
      this.locks.delete(lockKey);
      getMetrics().incrementCounter('ledger_lock_release_total');
    }
    // Wrong token cannot release (enforces ownership)
  }
}

// Global accessor singleton
let lockProvider: LockProvider | null = null;

export function initializeLockProvider(provider?: LockProvider) {
  if (lockProvider) return; // Already initialized

  if (provider) {
    lockProvider = provider;
  } else {
    lockProvider = new RedisLockProvider();
  }
}

export function getLockProvider(): LockProvider {
  if (!lockProvider) {
    throw new Error('LockProvider has not been initialized. Call initializeLockProvider() first.');
  }
  return lockProvider;
}

export function setLockProvider(provider: LockProvider) {
  lockProvider = provider;
}
