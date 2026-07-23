import { JobRegistry } from './JobRegistry';
import { CleanupJob } from './cleanup';
import { DriftDetectionJob } from './driftDetection';

// Register all jobs
JobRegistry.register(CleanupJob);
JobRegistry.register(DriftDetectionJob);

export { JobRegistry };
