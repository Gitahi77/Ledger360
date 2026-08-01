'use client';
import { ErrorState } from '@/components/ui/error-state';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground min-h-screen flex items-center justify-center">
        <ErrorState 
          title="Application Error" 
          message="A critical error occurred at the root layout level. Please refresh the page to continue."
          onRetry={reset}
        />
      </body>
    </html>
  );
}
