import { NextRequest, NextResponse } from 'next/server';
import { JobRegistry } from '@/lib/jobs';
import { JobRunner } from '@/lib/jobs/JobRunner';
import { initializeLockProvider } from '@/lib/jobs/LockProvider';

/**
 * Manual Parameterized Runner Endpoint (POST)
 * Accepts a specific job name in the body to run manually.
 */
export async function POST(req: NextRequest) {
  // Initialize lock provider for production
  initializeLockProvider();
  
  // Use the same CRON_SECRET for manual triggering for now
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const jobName = body.job;

    if (!jobName) {
      return NextResponse.json({ error: 'Missing job parameter' }, { status: 400 });
    }

    const job = JobRegistry.get(jobName);
    if (!job) {
      return NextResponse.json({ error: `Job ${jobName} not found in registry` }, { status: 404 });
    }

    const result = await JobRunner.execute(job);

    return NextResponse.json({
      success: result.success,
      skipped: result.skipped,
      job: jobName,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
