import { JobDefinition } from './JobRegistry';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getMetrics } from '@/lib/metrics/MetricsRegistry';

export const DriftDetectionJob: JobDefinition = {
  name: 'driftDetection',
  scheduleHint: '0 0 * * *', // Run daily at midnight
  timeoutMs: 120000,         // 2 minutes max execution (could be long if many accounts)
  lockTTLMs: 180000,         // 3 minutes lock
  
  execute: async ({ jobId, correlationId }) => {
    logger.info({
      component: 'drift_detection_job',
      action: 'started',
      message: 'Scanning accounts for cache drift against immutable ledger',
      metadata: { jobId, correlationId },
    });

    // Fetch all accounts and their current balances
    // In a massive system, this would need cursor-based pagination.
    // For Ledger360 Stage 5, doing this in one batch or iterating over chunks is fine.
    const accounts = await prisma.account.findMany({
      select: {
        id: true,
        userId: true,
        openingMinor: true,
        balanceMinor: true,
      }
    });

    let driftCount = 0;

    for (const account of accounts) {
      // Calculate sum of transactions
      const aggregation = await prisma.transaction.aggregate({
        where: { accountId: account.id },
        _sum: {
          baseAmountMinor: true,
        },
      });

      const transactionSum = BigInt(aggregation._sum.baseAmountMinor?.toString() || '0');
      const expectedBalance = account.openingMinor + transactionSum;

      if (account.balanceMinor !== expectedBalance) {
        driftCount++;
        getMetrics().incrementCounter('ledger_drift_detections_total');
        
        logger.error({
          component: 'drift_detection_job',
          action: 'drift_detected',
          message: `CRITICAL: Balance drift detected in account ${account.id}`,
          metadata: {
            jobId,
            correlationId,
            accountId: account.id,
            userId: account.userId,
            expectedBalance: expectedBalance.toString(),
            actualBalance: account.balanceMinor.toString(),
            driftAmount: (account.balanceMinor - expectedBalance).toString(),
          }
        });
        
        // As per the rule: Background jobs may detect inconsistencies but must never mutate financial data automatically.
        // We DO NOT auto-repair here. We only log and alert.
      }
    }

    logger.info({
      component: 'drift_detection_job',
      action: 'completed',
      message: `Drift detection completed. Scanned ${accounts.length} accounts. Found ${driftCount} drifts.`,
      metadata: {
        jobId,
        correlationId,
        scannedAccounts: accounts.length,
        driftCount,
      },
    });
  },
};
