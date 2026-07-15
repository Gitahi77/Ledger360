export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'EVENT';

export interface LogPayload {
  requestId?: string | null;
  userId?: string | null;
  component?: string;
  action?: string;
  durationMs?: number;
  outcome?: 'success' | 'failure';
  errorCode?: string;
  metadata?: Record<string, unknown>;
  message?: string;
  error?: unknown;
  [key: string]: unknown;
}

/**
 * Centralized logging utility for Ledger360.
 * Emits strictly structured JSON logs intended for Datadog, Loki, etc.
 */
class Logger {
  private log(level: LogLevel, payload: LogPayload) {
    const timestamp = new Date().toISOString();
    
    let errorDetails;
    if (payload.error instanceof Error) {
      errorDetails = {
        message: payload.error.message,
        stack: payload.error.stack,
        name: payload.error.name,
      };
    } else if (payload.error !== undefined) {
      errorDetails = { message: String(payload.error) };
    }

    const structuredLog = {
      level,
      timestamp,
      environment: process.env.NODE_ENV,
      requestId: payload.requestId,
      userId: payload.userId,
      component: payload.component,
      action: payload.action,
      durationMs: payload.durationMs,
      outcome: payload.outcome,
      errorCode: payload.errorCode,
      message: payload.message,
      metadata: payload.metadata,
      error: errorDetails,
    };

    // Remove undefined fields
    const cleanLog = Object.fromEntries(Object.entries(structuredLog).filter(([_, v]) => v !== undefined && v !== null));

    const out = JSON.stringify(cleanLog);
    
    if (level === 'ERROR') {
      console.error(out);
    } else if (level === 'WARN') {
      console.warn(out);
    } else {
      console.log(out);
    }
  }

  public info(payload: LogPayload) {
    this.log('INFO', payload);
  }

  public warn(payload: LogPayload) {
    this.log('WARN', payload);
  }

  public error(payload: LogPayload) {
    this.log('ERROR', payload);
  }

  public event(eventName: string, payload: Omit<LogPayload, 'action' | 'message'> = {}) {
    this.log('EVENT', {
      ...payload,
      action: eventName,
    });
  }

  // Keeping backwards compatibility for unrefactored catch blocks
  public server(error: unknown, context?: Record<string, unknown>): string {
    const errorId = `LGR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    this.error({
      errorCode: 'INTERNAL',
      message: 'Unhandled server error',
      error,
      metadata: { errorId, ...context }
    });
    return errorId;
  }

  public client(error: unknown, context?: Record<string, unknown>): string {
    const errorId = `LGR-C-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    this.error({
      component: 'Client',
      message: 'Client error reported',
      error,
      metadata: { errorId, ...context }
    });
    return errorId;
  }
}

export const logger = new Logger();
