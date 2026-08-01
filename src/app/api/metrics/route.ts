import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMetrics } from '@/lib/metrics/MetricsRegistry';

export async function GET(req: NextRequest) {
  try {
    // 1. Auth Check: Either session auth OR TELEMETRY_SECRET header
    const session = await getServerSession(authOptions);
    const telemetrySecret = process.env.TELEMETRY_SECRET;
    const authHeader = req.headers.get('x-telemetry-secret') || req.headers.get('authorization')?.replace('Bearer ', '');

    const isAuthorized = !!session?.user || (!!telemetrySecret && authHeader === telemetrySecret);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized metrics access' }, { status: 401 });
    }

    // 2. Query param group filter
    const url = new URL(req.url);
    const group = url.searchParams.get('group') || undefined;

    const data = getMetrics().getGroupSummary(group);

    return NextResponse.json({
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      registry: (getMetrics() as any).target?.constructor?.name || 'SafeMetricsRegistryProxy',
      success: true,
      group: group || 'all',
      data
    });
  } catch {
    return NextResponse.json({ error: 'Failed to retrieve metrics' }, { status: 500 });
  }
}
