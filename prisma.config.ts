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
    // We append connect_timeout=30 to allow Neon databases to wake up from scale-to-zero
    url: (() => {
      const dbUrl = process.env['DIRECT_DATABASE_URL'] ?? process.env['DATABASE_URL'] ?? '';
      if (!dbUrl) return '';
      try {
        const urlObj = new URL(dbUrl);
        if (!urlObj.searchParams.has('connect_timeout')) {
          urlObj.searchParams.set('connect_timeout', '30');
        }
        return urlObj.toString();
      } catch {
        return dbUrl;
      }
    })(),
  },
});
