import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/lib/logger';
import { AppError } from '@/lib/errors';
import { withAction } from '@/lib/respond';
import { getRequestId } from '@/lib/request-context';
import { AuthorizationError } from '@/lib/authz';

// Mock getRequestId to avoid importing next/headers which requires server context
vi.mock('@/lib/request-context', () => ({
  getRequestId: vi.fn().mockResolvedValue('REQ-TEST1234')
}));

// Mock Prisma to avoid DB connection during tests
vi.mock('@/lib/prisma', () => ({
  prisma: {}
}));

describe('Observability Foundation', () => {
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('AppError Taxonomy', () => {
    it('creates VALIDATION error with correct code and status', () => {
      const err = AppError.Validation('Invalid input');
      expect(err.code).toBe('VALIDATION');
      expect(err.status).toBe(400);
      expect(err.message).toBe('Invalid input');
    });

    it('creates INTERNAL error with correct code and status', () => {
      const err = AppError.Internal('Unexpected failure');
      expect(err.code).toBe('INTERNAL');
      expect(err.status).toBe(500);
    });
  });

  describe('Structured Logger', () => {
    it('emits structured JSON on info', () => {
      logger.info({
        requestId: 'REQ-123',
        action: 'testAction',
        durationMs: 42,
        outcome: 'success'
      });

      expect(consoleLogSpy).toHaveBeenCalledTimes(1);
      const logOutput = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      
      expect(logOutput.level).toBe('INFO');
      expect(logOutput.requestId).toBe('REQ-123');
      expect(logOutput.action).toBe('testAction');
      expect(logOutput.durationMs).toBe(42);
      expect(logOutput.outcome).toBe('success');
      expect(logOutput.timestamp).toBeDefined();
    });

    it('removes undefined and null fields from output', () => {
      logger.warn({
        requestId: null,
        userId: undefined,
        message: 'Something happened'
      });

      const logOutput = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
      expect(logOutput.requestId).toBeUndefined();
      expect(logOutput.userId).toBeUndefined();
      expect(logOutput.message).toBe('Something happened');
    });

    it('formats Error objects correctly', () => {
      const rawError = new Error('Database disconnected');
      rawError.stack = 'MockStack';
      
      logger.error({
        action: 'dbQuery',
        error: rawError
      });

      const logOutput = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(logOutput.error.message).toBe('Database disconnected');
      expect(logOutput.error.stack).toBe('MockStack');
    });
  });

  describe('withAction Wrapper (Request ID Propagation)', () => {
    it('propagates the same request ID through success flow', async () => {
      const action = async () => ({ success: true, data: 'OK' });
      
      const result = await withAction({ actionName: 'mockSuccess', handler: action });
      
      expect(result.success).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledTimes(2); // Started, Completed
      
      const startLog = JSON.parse(consoleLogSpy.mock.calls[0][0]);
      const endLog = JSON.parse(consoleLogSpy.mock.calls[1][0]);
      
      expect(startLog.requestId).toBe('REQ-TEST1234');
      expect(endLog.requestId).toBe('REQ-TEST1234');
      expect(endLog.durationMs).toBeDefined();
    });

    it('maps AuthorizationError to AppError internally and logs it', async () => {
      const action = async () => {
        throw new AuthorizationError('Not allowed');
      };

      const result = await withAction({ actionName: 'mockFail', handler: action });

      expect(result.success).toBe(false);
      // @ts-expect-error Checking failure result
      expect(result.code).toBe('AUTHORIZATION');
      
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      const errLog = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      
      expect(errLog.requestId).toBe('REQ-TEST1234');
      expect(errLog.errorCode).toBe('AUTHORIZATION');
      expect(errLog.outcome).toBe('failure');
    });
  });
});
