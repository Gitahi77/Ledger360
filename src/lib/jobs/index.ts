import { JobRegistry } from './JobRegistry';
import { CleanupJob } from './cleanup';
import { DriftDetectionJob } from './driftDetection';
import { FinancialInvariantAuditJob } from './FinancialInvariantAuditJob';

// Register all jobs
JobRegistry.register(CleanupJob);
JobRegistry.register(DriftDetectionJob);
JobRegistry.register({
  name: 'FinancialInvariantAuditJob',
  scheduleHint: '0 0 * * *', // Daily at midnight
  timeoutMs: 600000, // 10 mins
  lockTTLMs: 600000,
  expectedDurationMs: 120000,
  execute: async () => { await FinancialInvariantAuditJob.execute(); }
});

export { JobRegistry };
