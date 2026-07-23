import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';
import { JobDefinition } from './JobRegistry';
import { logger } from '@/lib/logger';
import { getMetrics } from '@/lib/metrics/MetricsRegistry';

// Re-use the existing redis config pattern
const hasRedis = !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = hasRedis ? Redis.fromEnv() : null;

export class JobRunner {
  /**
   * Executes a job with a distributed lock and metrics tracking.
   */
  static async execute(job: JobDefinition, correlationId?: string): Promise<{ success: boolean; skipped: boolean }> {
    const jobId = uuidv4();
    const activeCorrelationId = correlationId || uuidv4();
    const lockKey = `job:lock:${job.name}`;
    const leaseToken = uuidv4();

    // 1. Configuration Validation
    if (job.timeoutMs >= job.lockTTLMs) {
      logger.error({
        component: 'job_runner',
        action: 'invalid_configuration',
        message: `Job ${job.name} misconfigured: timeoutMs (${job.timeoutMs}) must be strictly less than lockTTLMs (${job.lockTTLMs})`,
      });
      return { success: false, skipped: false };
    }

    if (!redis) {
      logger.warn({
        component: 'job_runner',
        action: 'redis_unavailable',
        message: 'Redis is not configured. Jobs will run without distributed locking. Do not use in multi-instance production.',
      });
    }

    // 2. Acquire Distributed Lock
    let locked = false;
    if (redis) {
      try {
        // SET key value NX PX ttl
        const result = await redis.set(lockKey, leaseToken, {
          nx: true,
          px: job.lockTTLMs,
        });
        locked = result === 'OK';
      } catch (error) {
        logger.error({
          component: 'job_runner',
          action: 'lock_acquire_failed',
          message: `Failed to communicate with Redis for job ${job.name}`,
          error,
        });
        return { success: false, skipped: false };
      }

      if (!locked) {
        // Lock is held by another instance. This is expected concurrency, not an error.
        getMetrics().incrementCounter('ledger_jobs_skipped_total');
        getMetrics().incrementCounter('ledger_jobs_lock_contention_total');
        logger.info({
          component: 'job_runner',
          action: 'job_skipped',
          message: `Job ${job.name} skipped because lock is held by another instance.`,
          metadata: { jobId, correlationId: activeCorrelationId },
        });
        return { success: true, skipped: true };
      }
    }

    // 3. Execution
    const startedAt = Date.now();
    getMetrics().incrementCounter('ledger_jobs_started_total');
    let outcome = 'unknown';

    try {
      logger.info({
        component: 'job_runner',
        action: 'job_started',
        message: `Starting job ${job.name}`,
        metadata: { jobId, correlationId: activeCorrelationId, startedAt },
      });

      // Implement timeout racing to prevent runaway functions
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Job ${job.name} timed out after ${job.timeoutMs}ms`)), job.timeoutMs)
      );

      await Promise.race([
        job.execute({ jobId, correlationId: activeCorrelationId }),
        timeoutPromise
      ]);

      outcome = 'success';
      getMetrics().incrementCounter('ledger_jobs_completed_total');
    } catch (error) {
      outcome = 'failure';
      getMetrics().incrementCounter('ledger_jobs_failed_total');
      logger.error({
        component: 'job_runner',
        action: 'job_failed',
        message: `Job ${job.name} failed`,
        error,
        metadata: { jobId, correlationId: activeCorrelationId },
      });
    } finally {
      const completedAt = Date.now();
      const duration = completedAt - startedAt;
      getMetrics().recordHistogram('ledger_job_duration_ms', duration);

      logger.info({
        component: 'job_runner',
        action: 'job_completed',
        message: `Job ${job.name} completed with outcome: ${outcome}`,
        metadata: { jobId, correlationId: activeCorrelationId, startedAt, completedAt, duration, outcome },
      });

      // 4. Release Distributed Lock Safely using Lua script
      if (redis && locked) {
        try {
          // Release only if the value still matches our lease token
          const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
              return redis.call("del", KEYS[1])
            else
              return 0
            end
          `;
          await redis.eval(script, [lockKey], [leaseToken]);
        } catch (error) {
          logger.error({
            component: 'job_runner',
            action: 'lock_release_failed',
            message: `Failed to release lock for job ${job.name}`,
            error,
            metadata: { lockKey },
          });
        }
      }
    }

    return { success: outcome === 'success', skipped: false };
  }
}
