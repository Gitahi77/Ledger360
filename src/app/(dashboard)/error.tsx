'use client';

import { useEffect } from 'react';
import { Surface } from '@/components/ui/surface/Surface';
import { Button } from '@/components/ui/button/Button';
import { AlertCircle } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Dashboard Error Boundary Caught]:', error);
    }
  }, [error]);

  return (
    <div className="p-6 md:p-8 flex-1 flex flex-col items-center justify-center min-h-[400px]">
      <Surface className="p-8 flex flex-col items-center justify-center text-center max-w-lg mx-auto border-red-100 dark:border-red-900/30">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-white">Failed to load content</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
          {process.env.NODE_ENV === 'development' 
            ? error.message || 'An unexpected error occurred.'
            : 'We encountered an issue loading this section. Please try again.'}
        </p>
        <Button onClick={() => reset()} variant="primary">
          Try again
        </Button>
      </Surface>
    </div>
  );
}
