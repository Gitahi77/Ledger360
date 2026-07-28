'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function Animations() {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState(false);

  const triggerAnimation = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <section className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-2 border-b pb-2">ANIMATIONS</h3>
        <p className="text-muted-foreground">Motion primitives and interaction feedback.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <h4 className="text-lg font-semibold border-b pb-2">Micro-Interactions</h4>
          <div className="flex gap-4">
            <Button className="transition-transform active:scale-95">Press Me (Scale)</Button>
            <Button variant="secondary" className="transition-all hover:-translate-y-1 hover:shadow-md">Hover Me (Lift)</Button>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold border-b pb-2">State Feedback</h4>
          <div className="flex gap-4 items-center">
            <Button 
              onClick={() => triggerAnimation(setLoading)}
              disabled={loading}
              className="w-32"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load Data'}
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={() => triggerAnimation(setSuccess)}
              className={`w-32 transition-colors ${success ? 'bg-success/20 text-success border-success/50' : ''}`}
            >
              {success ? 'Success!' : 'Save'}
            </Button>

            <Button 
              variant="danger" 
              onClick={() => triggerAnimation(setError)}
              className={`w-32 ${error ? 'animate-shake' : ''}`}
            >
              {error ? 'Failed' : 'Delete'}
            </Button>
          </div>
        </div>

        <div className="space-y-4 md:col-span-2">
          <h4 className="text-lg font-semibold border-b pb-2">Loading Patterns</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="text-sm font-medium">Shimmer (Text/Blocks)</div>
              <div className="space-y-2">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-5/6 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="text-sm font-medium">Skeleton (Complex UI)</div>
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-4 w-4/5 bg-muted animate-pulse rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
