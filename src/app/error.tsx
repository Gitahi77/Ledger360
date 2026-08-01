'use client';
import { ErrorState } from '@/components/ui/error-state';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center w-full">
      <ErrorState 
        title="Something went wrong" 
        message={error.message || "An unexpected error occurred loading this view."}
        onRetry={reset}
      />
    </div>
  );
}
