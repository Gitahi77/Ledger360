export type ErrorCode = 
  | 'VALIDATION'
  | 'AUTHORIZATION'
  | 'AUTHENTICATION'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'FINANCIAL_INVARIANT'
  | 'DATABASE'
  | 'EXTERNAL_SERVICE'
  | 'INTERNAL';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly status: number;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, code: ErrorCode = 'INTERNAL', status: number = 500, context?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.context = context;
    
    // Capture stack trace, excluding the constructor call from it.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  static Validation(message: string, context?: Record<string, unknown>) {
    return new AppError(message, 'VALIDATION', 400, context);
  }

  static Authorization(message: string = 'Forbidden', context?: Record<string, unknown>) {
    return new AppError(message, 'AUTHORIZATION', 403, context);
  }

  static Authentication(message: string = 'Unauthorized', context?: Record<string, unknown>) {
    return new AppError(message, 'AUTHENTICATION', 401, context);
  }

  static NotFound(message: string = 'Not Found', context?: Record<string, unknown>) {
    return new AppError(message, 'NOT_FOUND', 404, context);
  }

  static Conflict(message: string = 'Conflict', context?: Record<string, unknown>) {
    return new AppError(message, 'CONFLICT', 409, context);
  }

  static RateLimited(message: string = 'Too Many Requests', context?: Record<string, unknown>) {
    return new AppError(message, 'RATE_LIMITED', 429, context);
  }

  static FinancialInvariant(message: string, context?: Record<string, unknown>) {
    return new AppError(message, 'FINANCIAL_INVARIANT', 400, context);
  }

  static Database(message: string, context?: Record<string, unknown>) {
    return new AppError(message, 'DATABASE', 500, context);
  }

  static ExternalService(message: string, context?: Record<string, unknown>) {
    return new AppError(message, 'EXTERNAL_SERVICE', 502, context);
  }

  static Internal(message: string = 'Internal Server Error', context?: Record<string, unknown>) {
    return new AppError(message, 'INTERNAL', 500, context);
  }
}
  
/**  
 * Centralized error normalization for UI components.  
 */  
export function getErrorMessage(error: unknown): string {  
  if (error instanceof Error) return error.message;  
  if (typeof error === 'string') return error;  
  if (typeof error === 'object' && error !== null && 'message' in error) return String(error.message);  
  return 'An unexpected error occurred.';  
} 
