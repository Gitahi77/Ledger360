import { ErrorCode } from '../errors';

export type ActionErrorCode = ErrorCode | 'UNKNOWN';

export type ActionResult<T = void> = 
  | { success: true; data: T; warning?: string }
  | { success: false; code?: ActionErrorCode; message?: string; error?: string; errorId?: string };
