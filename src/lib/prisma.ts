// src/lib/prisma.ts
// Runtime queries MUST use the pooled connection (I-12). Direct connection is
// only for the Prisma CLI / migrations (configured separately in prisma.config.ts).
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL; // POOLED (was DIRECT_DATABASE_URL)
  if (!connectionString) {
    throw new Error('DATABASE_URL (pooled) is not set. Add it to .env.local / Vercel env.');
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
