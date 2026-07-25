/**
 * Ledger360 Deployment Verification Smoke Test
 * 
 * Run this immediately post-deployment to verify environment readiness.
 * Principles:
 * - GET only
 * - Read-only (never mutate production)
 * - Idempotent
 * - Safe to run repeatedly
 */

import { prisma } from '@/lib/prisma';
import { Redis } from '@upstash/redis';

async function verifyDeployment() {
  console.log('Starting Deployment Verification...');
  let hasErrors = false;

  // 1. Verify Environment Variables
  console.log('\n[1] Verifying Environment Variables...');
  const requiredEnvVars = ['DATABASE_URL', 'DIRECT_DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  let missingDeps = false;
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.error(`❌ ${envVar} missing`);
      missingDeps = true;
    } else {
      console.log(`✅ ${envVar} present`);
    }
  }
  
  if (missingDeps) {
    console.error('❌ Missing required environment dependencies. Halting verification.');
    process.exit(3);
  }

  // 2. Verify Database Connectivity (Prisma)
  console.log('\n[2] Verifying Database Connectivity...');
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed', error);
    hasErrors = true;
  }

  // 3. Verify Redis Connectivity (if enabled)
  console.log('\n[3] Verifying Redis Connectivity...');
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL ?? "";
  if (redisUrl && !redisUrl.includes("dummy")) {
    try {
      const redis = Redis.fromEnv();
      await redis.ping();
      console.log('✅ Redis connected');
    } catch (error) {
      console.error('❌ Redis connection failed', error);
      hasErrors = true;
    }
  } else {
    console.log('⚠️ Redis skipped (dummy or missing URL)');
  }

  // 4. Verify API Endpoints (Health & Auth)
  console.log('\n[4] Verifying API Endpoints...');
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  
  try {
    const healthStart = performance.now();
    const res = await fetch(`${baseUrl}/api/health`);
    const latency = performance.now() - healthStart;
    
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ /api/health returned 200 (Latency: ${Math.round(latency)}ms)`);
      console.log(`   Health Data:`, data);
      
      if (latency > 1000) {
        console.warn('⚠️ API latency is unusually high (>1000ms)');
      }
    } else {
      console.error(`❌ /api/health returned ${res.status}`);
      hasErrors = true;
    }
  } catch (error) {
    console.error('❌ /api/health fetch failed', error);
    hasErrors = true;
  }

  try {
    // Just a simple GET to verify the auth route is alive (NextAuth provides CSRF token here)
    const res = await fetch(`${baseUrl}/api/auth/csrf`);
    if (res.ok) {
      console.log('✅ /api/auth/csrf returned 200');
    } else {
      console.error(`❌ /api/auth/csrf returned ${res.status}`);
      hasErrors = true;
    }
  } catch (error) {
    console.error('❌ /api/auth fetch failed', error);
    hasErrors = true;
  }

  // Final Verdict
  console.log('\n=============================================');
  if (hasErrors) {
    console.error('❌ DEPLOYMENT VERIFICATION FAILED');
    process.exit(1);
  } else {
    console.log('✅ DEPLOYMENT VERIFICATION SUCCESSFUL');
    process.exit(0);
  }
}

verifyDeployment().catch(err => {
  console.error('Unexpected fatal error during verification:', err);
  process.exit(1);
});
