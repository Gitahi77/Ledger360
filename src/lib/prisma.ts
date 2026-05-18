// src/lib/prisma.ts
// Prisma 7 requires a driver adapter — we use @prisma/adapter-pg (PostgreSQL)
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Prisma 7 + local Prisma Postgres: use the direct postgres URL from env
  // The prisma+postgres:// URL is for the CLI; PrismaClient needs a plain pg URL
  const connectionString =
    process.env.DIRECT_DATABASE_URL ??
    // Fall back: decode the local dev URL from the Prisma Postgres URL
    'postgres://postgres:postgres@localhost:51214/template1?sslmode=disable';

  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
