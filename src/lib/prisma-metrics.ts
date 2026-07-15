import { getRequestContext } from './request-context';
import { logger } from './logger';
import crypto from 'crypto';

function normalizeArgs(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(normalizeArgs);
  } else if (obj !== null && typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      res[key] = normalizeArgs(obj[key]);
    }
    return res;
  }
  // Replace scalar values with '?'
  return '?';
}

function classifyQuery(operation: string): string {
  if (['findUnique', 'findFirst', 'findMany', 'count'].includes(operation)) {
    return 'Read';
  } else if (['create', 'createMany', 'update', 'updateMany', 'upsert', 'delete', 'deleteMany'].includes(operation)) {
    return 'Write';
  } else if (['aggregate', 'groupBy'].includes(operation)) {
    return 'Aggregation';
  } else if (operation.toLowerCase().includes('search')) {
    return 'Search';
  }
  return 'Unknown';
}

export async function recordQueryMetrics(model: string | undefined, operation: string, args: any, durationMs: number, result: any) {
  try {
    const ctx = await getRequestContext();
    ctx.metrics.prismaTimeMs += durationMs;
    ctx.queryCount += 1;

    // Normalize args to detect shape
    const shape = {
      model,
      operation,
      args: normalizeArgs(args)
    };
    const shapeStr = JSON.stringify(shape);
    const queryHash = crypto.createHash('sha256').update(shapeStr).digest('hex').substring(0, 8);

    ctx.queries.push({ hash: queryHash, durationMs });

    // N+1 Detection: If this hash appears > 5 times, warn
    const countSameHash = ctx.queries.filter(q => q.hash === queryHash).length;
    if (countSameHash === 5) {
      logger.warn({
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
      logger.warn({
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
  } catch (e) {
    // Outside request context
  }
}
