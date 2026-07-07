/**
 * Structured JSON Telemetry Service.
 * Outputs to stdout for external log aggregators (e.g. OpenTelemetry, Datadog)
 * Avoids polluting the Postgres database with non-business data.
 */

export interface TelemetryLog {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  correlationId: string;
  actorId?: string;
  durationMs?: number;
  event: string;
  metadata?: Record<string, unknown>;
}

export class TelemetryService {
  private static log(level: TelemetryLog["level"], correlationId: string, event: string, metadata?: Record<string, unknown>, durationMs?: number, actorId?: string) {
    // Sanitize metadata to remove any PII or raw financial amounts
    const sanitizedMetadata = this.sanitize(metadata);

    const logEntry: TelemetryLog = {
      timestamp: new Date().toISOString(),
      level,
      correlationId,
      actorId,
      durationMs,
      event,
      metadata: sanitizedMetadata,
    };

    // Output strictly as JSON for external aggregators
    console.log(JSON.stringify(logEntry));
  }

  public static info(correlationId: string, event: string, metadata?: Record<string, unknown>, durationMs?: number, actorId?: string) {
    this.log("INFO", correlationId, event, metadata, durationMs, actorId);
  }

  public static error(correlationId: string, event: string, error: Error, metadata?: Record<string, unknown>) {
    this.log("ERROR", correlationId, event, { ...metadata, errorMessage: error.message, stack: error.stack });
  }

  public static warn(correlationId: string, event: string, metadata?: Record<string, unknown>) {
    this.log("WARN", correlationId, event, metadata);
  }

  private static sanitize(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!metadata) return undefined;
    const clean = { ...metadata };
    
    // Privacy Engineering: Redact sensitive keys
    const sensitiveKeys = ['amount', 'balance', 'email', 'name', 'accountNumber'];
    for (const key of Object.keys(clean)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        clean[key] = "[REDACTED]";
      }
    }
    return clean;
  }
}
