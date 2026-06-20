'use client';
// src/app/error.tsx — Global error boundary
// Shows friendly, human-readable messages — never raw JS error strings.
import Link from 'next/link';

/** Maps known technical error patterns to plain-English explanations. */
function toFriendlyMessage(raw: string | undefined): string {
  if (!raw) return 'Something unexpected happened. Please try again.';

  // Network / data fetching
  if (raw.includes('fetch') || raw.includes('network') || raw.includes('NetworkError'))
    return 'We couldn\'t reach the server. Check your internet connection and try again.';

  // FX / rates (the specific crash that prompted this fix)
  if (raw.includes('USD') || raw.includes('rates') || raw.includes('FxRates') || raw.includes('Frankfurter'))
    return 'Exchange rate data is temporarily unavailable. Your balances and transactions are unaffected.';

  // Auth
  if (raw.includes('UNAUTHORIZED') || raw.includes('401') || raw.includes('session'))
    return 'Your session has expired. Please sign in again.';

  // Prisma / DB
  if (raw.includes('PrismaClient') || raw.includes('prisma') || raw.includes('database'))
    return 'A database error occurred. Please try again in a moment.';

  // Zod / validation
  if (raw.includes('ZodError') || raw.includes('validation') || raw.includes('Invalid'))
    return 'The data you submitted was invalid. Please check your entries and try again.';

  // Generic JS property errors — never show these raw
  if (raw.includes('Cannot read') || raw.includes('undefined') || raw.includes('null'))
    return 'Something unexpected happened. Our team has been notified. Please try again.';

  // Fallback: show if reasonably short and safe, otherwise generic
  if (raw.length < 120 && !raw.includes('at ') && !raw.includes('\n'))
    return raw;

  return 'Something unexpected happened. Please try again or contact support.';
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const friendlyMessage = toFriendlyMessage(error.message);

  return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '2rem',
    }}>
      <div className="card" style={{ maxWidth: 440, width: '100%', textAlign: 'center', padding: '2.5rem' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          Something went wrong
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          {friendlyMessage}
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={reset}
            style={{ flex: 1, minWidth: 120, justifyContent: 'center' }}
          >
            Try Again
          </button>
          <Link
            href="/"
            className="btn btn-outline"
            style={{ flex: 1, minWidth: 120, justifyContent: 'center' }}
          >
            Go to Dashboard
          </Link>
        </div>
        {process.env.NODE_ENV === 'development' && error.message && (
          <details style={{ marginTop: '1.5rem', textAlign: 'left' }}>
            <summary style={{ fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer' }}>Technical details (dev only)</summary>
            <pre style={{ fontSize: '0.65rem', color: 'var(--danger)', marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {error.message}
              {error.digest ? `\nDigest: ${error.digest}` : ''}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
