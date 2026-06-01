// src/lib/prisma.ts
// Prisma 7 requires a driver adapter — we use @prisma/adapter-pg (PostgreSQL)
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const connectionString = process.env.DIRECT_DATABASE_URL;

  // Fail fast at startup if the DB URL is missing — prevents silent connection
  // to wrong/default databases in production (CWE-798 mitigation).
  if (!connectionString) {
    throw new Error(
      'DIRECT_DATABASE_URL environment variable is not set. ' +
      'Add it to your .env.local (development) or Vercel environment variables (production).'
    );
  }

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
