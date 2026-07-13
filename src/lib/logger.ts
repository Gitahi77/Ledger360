import { v4 as uuidv4 } from 'uuid';

/**
 * Centralized logging utility for Ledger360.
 * In a real production environment, this would forward logs to Datadog, Sentry, or Logtail.
 */
class Logger {
  public server(error: unknown, context?: Record<string, unknown>): string {
    const errorId = `LGR-${uuidv4().substring(0, 8).toUpperCase()}`;
    const timestamp = new Date().toISOString();
    
    // Construct structured log
    const logPayload = {
      errorId,
      timestamp,
      level: 'ERROR',
      environment: process.env.NODE_ENV,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
    };

    // In production, send `logPayload` to external logging service here.
    // For now, we emit to stdout/stderr so hosting platforms (Vercel) capture it.
    console.error(JSON.stringify(logPayload, null, 2));

    return errorId;
  }

  public client(error: unknown, context?: Record<string, unknown>): string {
    const errorId = `LGR-C-${uuidv4().substring(0, 8).toUpperCase()}`;
    // In production, this would send to an ingest API for client errors.
    console.error(`[Client Error ${errorId}]`, error, context);
    return errorId;
  }
}

export const logger = new Logger();
