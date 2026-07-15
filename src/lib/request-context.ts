import { headers } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { cache } from 'react';

/**
 * Lazily retrieves or generates a Correlation ID for the current request.
 * It first checks for 'x-request-id' in the incoming headers.
 * If not present, it generates a new UUID.
 * 
 * Uses React's `cache` to ensure the same UUID is returned 
 * consistently throughout a single server request lifecycle.
 */
export const getRequestId = cache(async () => {
  try {
    const headersList = await headers();
    const existingId = headersList.get('x-request-id');
    if (existingId) {
      return existingId;
    }
  } catch (error) {
    // headers() throws if called outside of a request context
    // We swallow the error and just generate a new ID
  }

  return `REQ-${uuidv4().substring(0, 8).toUpperCase()}`;
});
