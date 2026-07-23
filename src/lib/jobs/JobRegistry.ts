import { logger } from '@/lib/logger';

export interface JobDefinition {
  name: string;
  scheduleHint: string; // e.g. '0 0 * * *'
  timeoutMs: number;
  lockTTLMs: number;
  expectedDurationMs?: number;
  execute: (metadata: { jobId: string; correlationId: string }) => Promise<void>;
}

class Registry {
  private jobs = new Map<string, JobDefinition>();

  register(job: JobDefinition) {
    if (this.jobs.has(job.name)) {
      throw new Error(`Job ${job.name} is already registered.`);
    }
    this.jobs.set(job.name, job);
    logger.info({
      component: 'job_registry',
      action: 'job_registered',
      message: `Registered background job: ${job.name}`,
    });
  }

  get(name: string): JobDefinition | undefined {
    return this.jobs.get(name);
  }

  getAll(): JobDefinition[] {
    return Array.from(this.jobs.values());
  }
}

export const JobRegistry = new Registry();
