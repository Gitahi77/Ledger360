"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
/**
 * Centralized logging utility for Ledger360.
 * Emits strictly structured JSON logs intended for Datadog, Loki, etc.
 */
class Logger {
    log(level, payload) {
        const timestamp = new Date().toISOString();
        let errorDetails;
        if (payload.error instanceof Error) {
            errorDetails = {
                message: payload.error.message,
                stack: payload.error.stack,
                name: payload.error.name,
            };
        }
        else if (payload.error !== undefined) {
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
            ...Object.fromEntries(Object.entries(payload).filter(([k]) => !['level', 'timestamp', 'environment', 'requestId', 'userId', 'component', 'action', 'durationMs', 'outcome', 'errorCode', 'message', 'metadata', 'error'].includes(k)))
        };
        // Remove undefined fields
        const cleanLog = Object.fromEntries(Object.entries(structuredLog).filter(([_, v]) => v !== undefined && v !== null));
        const out = JSON.stringify(cleanLog);
        if (level === 'ERROR') {
            console.error(out);
        }
        else if (level === 'WARN') {
            console.warn(out);
        }
        else {
            console.log(out);
        }
    }
    info(payload) {
        this.log('INFO', payload);
    }
    warn(payload) {
        this.log('WARN', payload);
    }
    error(payload) {
        this.log('ERROR', payload);
    }
    event(eventName, payload = {}) {
        this.log('EVENT', {
            ...payload,
            action: eventName,
        });
    }
    // Keeping backwards compatibility for unrefactored catch blocks
    server(error, context) {
        const errorId = `LGR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        this.error({
            errorCode: 'INTERNAL',
            message: 'Unhandled server error',
            error,
            metadata: { errorId, ...context }
        });
        return errorId;
    }
    client(error, context) {
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
exports.logger = new Logger();
