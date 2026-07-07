export type ActionErrorCode = 
  | 'VALIDATION_ERROR' 
  | 'NOT_FOUND' 
  | 'UNAUTHORIZED' 
  | 'FORBIDDEN'
  | 'CONFLICT' 
  | 'RATE_LIMIT' 
  | 'DEPENDENCY_FAILURE'
  | 'DATABASE_ERROR'
  | 'UNKNOWN';

export type ActionResult<T = void> = 
  | { success: true; data: T; warning?: string }
  | { success: false; code?: ActionErrorCode; message?: string; error?: string; errorId?: string };
