import { headers } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { cache } from 'react';

export interface RequestTiming {
  name: string;
  durationMs: number;
}

export interface RequestMetrics {
  validationTimeMs: number;
  authorizationTimeMs: number;
  businessLogicTimeMs: number;
  prismaTimeMs: number;
  serializationTimeMs: number;
}

export interface RequestContextStore {
  id: string;
  metrics: RequestMetrics;
  queryCount: number;
  queries: { hash: string, durationMs: number }[];
}

/**
 * Lazily retrieves or generates the context for the current request.
 * Uses React's `cache` to ensure the same object is returned 
 * consistently throughout a single server request lifecycle.
 */
export const getRequestContext = cache(async (): Promise<RequestContextStore> => {
  let id = '';
  try {
    const headersList = await headers();
    const existingId = headersList.get('x-request-id');
    if (existingId) {
      id = existingId;
    }
  } catch {
    // headers() throws if called outside of a request context
  }

  if (!id) {
    id = `REQ-${uuidv4().substring(0, 8).toUpperCase()}`;
  }

  return {
    id,
    queryCount: 0,
    queries: [],
    metrics: {
      validationTimeMs: 0,
      authorizationTimeMs: 0,
      businessLogicTimeMs: 0,
      prismaTimeMs: 0,
      serializationTimeMs: 0
    }
  };
});

/**
 * Helper to get just the ID for backwards compatibility
 */
export const getRequestId = async () => {
  const ctx = await getRequestContext();
  return ctx.id;
};
