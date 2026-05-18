// prisma.config.ts
// Prisma 7: connection URLs live here, not in schema.prisma.
// DATABASE_URL     = pooled connection (runtime queries)
// DIRECT_DATABASE_URL = direct non-pooled (migrations, db push)
import 'dotenv/config';
import { defineConfig } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // For Prisma CLI (db push, migrate): use DIRECT_DATABASE_URL (non-pooled)
    url: process.env['DIRECT_DATABASE_URL'] ?? process.env['DATABASE_URL'] ?? '',
  },
});
