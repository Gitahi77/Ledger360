"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// src/lib/prisma.ts
// Runtime queries MUST use the pooled connection (I-12). Direct connection is
// only for the Prisma CLI / migrations (configured separately in prisma.config.ts).
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const globalForPrisma = globalThis;
const prisma_metrics_1 = require("./prisma-metrics");
function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL; // POOLED (was DIRECT_DATABASE_URL)
    if (!connectionString) {
        throw new Error('DATABASE_URL (pooled) is not set. Add it to .env.local / Vercel env.');
    }
    const adapter = new adapter_pg_1.PrismaPg({ connectionString });
    const baseClient = new client_1.PrismaClient({
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
                    await (0, prisma_metrics_1.recordQueryMetrics)(model, operation, args, duration, result);
                    return result;
                }
            }
        }
    });
}
exports.prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
