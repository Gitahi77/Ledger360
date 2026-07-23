import { JobDefinition } from './JobRegistry';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export const CleanupJob: JobDefinition = {
  name: 'cleanup',
  scheduleHint: '0 * * * *', // Intended: Run hourly (On Vercel Hobby, runs daily)
  timeoutMs: 30000,          // 30 seconds max execution
  lockTTLMs: 60000,          // 60 seconds lock (must be > timeoutMs)
  expectedDurationMs: 5000,
  
  execute: async ({ jobId, correlationId }) => {
    logger.info({
      component: 'cleanup_job',
      action: 'started',
      message: 'Running cleanup tasks for ephemeral data',
      metadata: { jobId, correlationId },
    });

    const now = new Date();

    // 1. Clean up expired Idempotency Records
    const idempotencyResult = await prisma.idempotencyRecord.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    // 2. Clean up expired Sessions
    const sessionsResult = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: now,
        },
      },
    });

    // 3. Clean up expired Verification Tokens
    const verificationTokensResult = await prisma.verificationToken.deleteMany({
      where: {
        expires: {
          lt: now,
        },
      },
    });

    logger.info({
      component: 'cleanup_job',
      action: 'completed',
      message: 'Cleanup job completed successfully',
      metadata: {
        jobId,
        correlationId,
        deletedIdempotencyRecords: idempotencyResult.count,
        deletedSessions: sessionsResult.count,
        deletedVerificationTokens: verificationTokensResult.count,
      },
    });
  },
};
