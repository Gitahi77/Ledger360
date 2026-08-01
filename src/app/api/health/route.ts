import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Redis } from '@upstash/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const timestamp = new Date().toISOString();
  
  // Vercel exposes the commit sha here
  const version = process.env.VERCEL_GIT_COMMIT_SHA || 'dev';
  
  let database = 'ok';
  let redisStatus = 'ok';
  
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    database = 'error';
  }

  try {
    const url = process.env.UPSTASH_REDIS_REST_URL ?? "";
    const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
    
    if (url.length > 0 && token.length > 0 && !url.includes("dummy")) {
      const redis = Redis.fromEnv();
      await redis.ping();
    } else {
      redisStatus = 'skipped';
    }
  } catch {
    redisStatus = 'error';
  }

  const status = (database === 'ok' && (redisStatus === 'ok' || redisStatus === 'skipped')) ? 'ok' : 'degraded';

  return NextResponse.json({
    status,
    version,
    database,
    redis: redisStatus,
    timestamp
  }, {
    status: status === 'ok' ? 200 : 503
  });
}
