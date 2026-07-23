import { NextRequest, NextResponse } from 'next/server';
import { JobRegistry } from '@/lib/jobs';
import { JobRunner } from '@/lib/jobs/JobRunner';

/**
 * Scheduled Vercel Cron Endpoint (GET)
 * Runs all registered background jobs if invoked by Vercel Cron.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const jobs = JobRegistry.getAll();
  const results = [];

  for (const job of jobs) {
    const result = await JobRunner.execute(job);
    results.push({ job: job.name, ...result });
  }

  return NextResponse.json({
    success: true,
    message: `Scheduled ${jobs.length} jobs`,
    results,
  });
}
