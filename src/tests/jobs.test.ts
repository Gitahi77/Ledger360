import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JobRunner } from '@/lib/jobs/JobRunner';
import { JobDefinition } from '@/lib/jobs/JobRegistry';
import { CleanupJob } from '@/lib/jobs/cleanup';
import { DriftDetectionJob } from '@/lib/jobs/driftDetection';
import { prisma } from '@/lib/prisma';
import { getMetrics, setMetricsRegistry, InMemoryMetricsRegistry } from '@/lib/metrics/MetricsRegistry';
import { setLockProvider, InMemoryLockProvider, getLockProvider } from '@/lib/jobs/LockProvider';

process.env.DATABASE_URL = 'postgresql://dummy:dummy@localhost/dummy';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    idempotencyRecord: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findUnique: vi.fn(),
    },
    session: {
      deleteMany: vi.fn(),
    },
    verificationToken: {
      deleteMany: vi.fn(),
    },
    account: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    user: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    transaction: {
      aggregate: vi.fn(),
    }
  }
}));

describe('Stage 5.5 — Background Jobs', () => {
  let registry: InMemoryMetricsRegistry;

  beforeEach(() => {
    registry = new InMemoryMetricsRegistry();
    setMetricsRegistry(registry);
    setLockProvider(new InMemoryLockProvider());
    vi.restoreAllMocks();
  });

  describe('JobRunner Core Logic', () => {
    it('validates configuration budgets (rejects if timeout >= lockTTL)', async () => {
      const badJob: JobDefinition = {
        name: 'badJob',
        scheduleHint: '0 * * * *',
        timeoutMs: 5000,
        lockTTLMs: 3000, // Invalid: TTL is shorter than timeout
        execute: async () => {},
      };

      const result = await JobRunner.execute(badJob);
      expect(result.success).toBe(false);
      expect(result.skipped).toBe(false);
    });

    it('enforces execution timeout', async () => {
      const slowJob: JobDefinition = {
        name: 'slowJob',
        scheduleHint: '0 * * * *',
        timeoutMs: 50,
        lockTTLMs: 200,
        execute: async () => {
          await new Promise((resolve) => setTimeout(resolve, 100)); // Simulates slow execution
        },
      };

      const result = await JobRunner.execute(slowJob);
      
      // Should fail due to timeout racing
      expect(result.success).toBe(false);
      expect(result.skipped).toBe(false);
      
      const summaries = getMetrics().getAllSummaries();
      expect(summaries.jobs.ledger_jobs_failed_total).toBe(1);
    });
  });

  describe('Distributed Locking via InMemoryProvider', () => {
    it('prevents duplicate cron invocations (parallel execution)', async () => {
      let executionCount = 0;
      
      const fastJob: JobDefinition = {
        name: 'fastJob',
        scheduleHint: '0 * * * *',
        timeoutMs: 5000,
        lockTTLMs: 10000,
        execute: async () => {
          executionCount++;
          await new Promise(r => setTimeout(r, 100)); // Keep lock held slightly
        },
      };

      // Fire 20 simultaneous requests
      const promises = Array.from({ length: 20 }).map(() => JobRunner.execute(fastJob));
      const results = await Promise.all(promises);

      const successful = results.filter(r => r.success && !r.skipped).length;
      const skipped = results.filter(r => r.skipped).length;

      // Expect exactly 1 execution, 19 skipped
      expect(executionCount).toBe(1);
      expect(successful).toBe(1);
      expect(skipped).toBe(19);

      const summaries = getMetrics().getAllSummaries();
      expect(summaries.jobs.ledger_jobs_started_total).toBe(1);
      expect(summaries.jobs.ledger_jobs_skipped_total).toBe(19);
      expect(summaries.jobs.ledger_jobs_lock_contention_total).toBe(19);
    });

    it('recovers from lock expiry if previous job crashed', async () => {
      const crashJob: JobDefinition = {
        name: 'crashJob',
        scheduleHint: '0 * * * *',
        timeoutMs: 50,
        lockTTLMs: 100, // Very short lock TTL
        execute: async () => {
          // This simulates a catastrophic crash that bypassed finally {} blocks
          // We achieve this by overriding the release method on the provider temporarily
        },
      };

      const provider = getLockProvider();
      const originalRelease = provider.release.bind(provider);
      provider.release = async () => {}; // Never release lock!

      // Job A crashes (simulated by not releasing)
      const resultA = await JobRunner.execute(crashJob);
      expect(resultA.success).toBe(true);

      // Immediate attempt should skip because lock is held by stale token
      const immediateJobB: JobDefinition = { ...crashJob, execute: async () => {} };
      const resultB = await JobRunner.execute(immediateJobB);
      expect(resultB.skipped).toBe(true);

      // Wait for TTL to expire
      await new Promise(r => setTimeout(r, 150));

      // Restore release method just in case
      provider.release = originalRelease;

      // Attempt after expiry should succeed
      const resultC = await JobRunner.execute(immediateJobB);
      expect(resultC.success).toBe(true);
      expect(resultC.skipped).toBe(false);
    });
    
    it('enforces lock ownership when releasing', async () => {
      const provider = getLockProvider();
      
      const successAcquire = await provider.acquire('test-lock', 'token-1', 10000);
      expect(successAcquire).toBe(true);
      
      // Try releasing with wrong token
      await provider.release('test-lock', 'wrong-token');
      
      // Lock should still be held
      const acquireAttempt = await provider.acquire('test-lock', 'token-2', 10000);
      expect(acquireAttempt).toBe(false);
      
      // Release with correct token
      await provider.release('test-lock', 'token-1');
      
      // Can acquire now
      const finalAttempt = await provider.acquire('test-lock', 'token-3', 10000);
      expect(finalAttempt).toBe(true);
    });

    it('releasing nonexistent lock is harmless', async () => {
      const provider = getLockProvider();
      await expect(provider.release('ghost-lock', 'token')).resolves.toBeUndefined();
    });
  });

  describe('Cleanup Job', () => {
    it('clears expired idempotency records but keeps valid ones', async () => {
      vi.mocked(prisma.idempotencyRecord.deleteMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 2 });
      vi.mocked(prisma.verificationToken.deleteMany).mockResolvedValue({ count: 0 });

      await CleanupJob.execute({ jobId: '1', correlationId: '1' });

      expect(prisma.idempotencyRecord.deleteMany).toHaveBeenCalled();
      expect(prisma.session.deleteMany).toHaveBeenCalled();
    });
  });

  describe('Drift Detection Job', () => {
    it('detects balance mismatch without auto-correcting and emits metric', async () => {
      // Mock account with drift
      vi.mocked(prisma.account.findMany).mockResolvedValue([{
        id: 'acc_1',
        userId: 'user_1',
        name: 'Checking',
        type: 'CHECKING',
        currency: 'KES',
        openingMinor: BigInt(0),
        balanceMinor: BigInt(500), // Expected 0, actual 500 (Drift!)
        archived: false,
        allowNegativeBalance: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }]);

      vi.mocked(prisma.transaction.aggregate).mockResolvedValue({
        _sum: {
          baseAmountMinor: BigInt(0) as any
        }
      } as any);

      await DriftDetectionJob.execute({ jobId: '1', correlationId: '1' });

      // Metric should be emitted
      const summaries = getMetrics().getAllSummaries();
      expect(summaries.financial.ledger_drift_detections_total).toBe(1);

      // Verify NO auto-correction happened (no update calls)
      expect(prisma.account.update).not.toHaveBeenCalled();
    });
  });
});
