// src/lib/prisma.ts
// Runtime queries MUST use the pooled connection (I-12). Direct connection is
// only for the Prisma CLI / migrations (configured separately in prisma.config.ts).
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

import { recordQueryMetrics } from './prisma-metrics';

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL; // POOLED (was DIRECT_DATABASE_URL)
  if (!connectionString) {
    throw new Error('DATABASE_URL (pooled) is not set. Add it to .env.local / Vercel env.');
  }
  const adapter = new PrismaPg({ connectionString });
  
  const baseClient = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ operation, model, args, query }) {
          const start = performance.now();
          const result = await query(args);
          const duration = Math.round(performance.now() - start);
          
          await recordQueryMetrics(model, operation, args, duration, result);
          
          return result;
        }
      }
    }
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient() as any;
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
