import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getRequestId } from '@/lib/request-context';

export async function GET() {
  const requestId = await getRequestId();
  const started = performance.now();

  try {
    // A simple fast query that proves the database is connected
    await prisma.$queryRaw`SELECT 1`;
    
    const durationMs = Math.round(performance.now() - started);
    logger.info({
      requestId,
      action: 'health_ready',
      durationMs,
      outcome: 'success',
      message: 'Database is reachable',
    });

    return NextResponse.json({ status: 'ready' }, { status: 200 });
  } catch (error) {
    const durationMs = Math.round(performance.now() - started);
    logger.error({
      requestId,
      action: 'health_ready',
      durationMs,
      outcome: 'failure',
      errorCode: 'DATABASE',
      message: 'Database connection failed',
      error,
    });

    return NextResponse.json(
      { status: 'error', message: 'Service Unavailable' },
      { status: 503 }
    );
  }
}
