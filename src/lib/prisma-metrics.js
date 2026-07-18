"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordQueryMetrics = recordQueryMetrics;
const request_context_1 = require("./request-context");
const logger_1 = require("./logger");
const crypto_1 = __importDefault(require("crypto"));
function normalizeArgs(obj) {
    if (Array.isArray(obj)) {
        return obj.map(normalizeArgs);
    }
    else if (obj !== null && typeof obj === 'object') {
        const res = {};
        for (const key of Object.keys(obj)) {
            res[key] = normalizeArgs(obj[key]);
        }
        return res;
    }
    // Replace scalar values with '?'
    return '?';
}
function classifyQuery(operation) {
    if (['findUnique', 'findFirst', 'findMany', 'count'].includes(operation)) {
        return 'Read';
    }
    else if (['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany'].includes(operation)) {
        return 'Write';
    }
    else if (['aggregate', 'groupBy'].includes(operation)) {
        return 'Aggregation';
    }
    else if (operation.toLowerCase().includes('search')) {
        return 'Search';
    }
    return 'Unknown';
}
async function recordQueryMetrics(model, operation, args, durationMs, result) {
    try {
        const ctx = await (0, request_context_1.getRequestContext)();
        ctx.metrics.prismaTimeMs += durationMs;
        ctx.queryCount += 1;
        // Normalize args to detect shape
        const shape = {
            model,
            operation,
            args: normalizeArgs(args)
        };
        const shapeStr = JSON.stringify(shape);
        const queryHash = crypto_1.default.createHash('sha256').update(shapeStr).digest('hex').substring(0, 8);
        ctx.queries.push({ hash: queryHash, durationMs });
        // N+1 Detection: If this hash appears > 5 times, warn
        const countSameHash = ctx.queries.filter(q => q.hash === queryHash).length;
        if (countSameHash === 5) {
            logger_1.logger.warn({
                requestId: ctx.id,
                action: 'N+1_DETECTION',
                model,
                operation,
                queryHash,
                message: `N+1 Query Pattern Detected! Hash ${queryHash} executed ${countSameHash} times in this request.`,
                shape: shapeStr
            });
        }
        const rowsReturned = Array.isArray(result) ? result.length : (result ? 1 : 0);
        // Only log individually if slow (>50ms)
        if (durationMs > 50) {
            logger_1.logger.warn({
                requestId: ctx.id,
                action: 'SLOW_QUERY',
                model,
                operation,
                durationMs,
                rowsReturned,
                queryHash,
                classification: classifyQuery(operation),
                message: `Slow Database Query Detected (${durationMs}ms)`
            });
        }
    }
    catch (e) {
        // Outside request context
    }
}
