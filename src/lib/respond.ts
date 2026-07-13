import { ZodError, ZodSchema } from 'zod';
import { NextResponse } from 'next/server';
import { ActionResult } from './types/action-result';
import { AuthorizationError } from './authz';

/**
 * Standardized API validation error response (for Route Handlers)
 */
export function respondValidationError(error: ZodError, context: string): NextResponse {
  console.warn(`[Validation Error] ${context}:`, error.flatten().fieldErrors);
  return NextResponse.json(
    {
      error: 'Validation failed',
      details: error.flatten().fieldErrors,
    },
    { status: 400 }
  );
}

/**
 * Standardized API error response (for Route Handlers)
 */
export function respondError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Standardized Server Action validation error response
 */
export function actionValidationError(error: ZodError, context: string): ActionResult<never> {
  console.warn(`[Validation Error] ${context}:`, error.flatten().fieldErrors);
  // Flattening or picking first error message for simple client display
  const firstError = error.issues[0]?.message || 'Invalid input';
  return { success: false, code: 'VALIDATION_ERROR', error: firstError, message: firstError };
}

/**
 * Validates input against a Zod schema.
 * Throws a formatted ZodError if validation fails, which should be caught and
 * passed to `respondValidationError` or `actionValidationError`.
 */
export function validate<T>(schema: ZodSchema<T>, input: unknown, context: string): T {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    console.warn(`[Validation Failed] ${context}`, parsed.error.flatten().fieldErrors);
    throw parsed.error;
  }
  return parsed.data;
}

/**
 * Safe validate helper that returns a Result tuple instead of throwing.
 * Useful for Server Actions to avoid try/catch boilerplate.
 */
export function safeValidate<T>(schema: ZodSchema<T>, input: unknown, context: string): { success: true; data: T } | { success: false; error: ActionResult<never> } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: actionValidationError(parsed.error, context) };
  }
  return { success: true, data: parsed.data };
}

/**
 * Executes a server action block and standardizes the error response.
 * Automatically catches AuthorizationError and generic errors.
 */
export async function withErrorHandling<T>(
  action: () => Promise<ActionResult<T>>
): Promise<ActionResult<T>> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { success: false, code: 'FORBIDDEN', message: error.message };
    }
    console.error('[Action Error]', error);
    const msg = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
    return { success: false, code: 'UNKNOWN', message: msg };
  }
}
