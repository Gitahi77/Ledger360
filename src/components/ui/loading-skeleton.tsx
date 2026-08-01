import { Loader2 } from 'lucide-react';
import React from 'react';

export function LoadingPulse({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-full w-full min-h-[200px]">
      <Loader2 className="w-8 h-8 text-muted-foreground/50 animate-spin mb-4" />
      <p className="text-xs font-bold text-muted-foreground/70 tracking-widest uppercase">{text}</p>
    </div>
  );
}

export function LoadingSkeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-secondary/60 rounded-md ${className}`} />
  );
}
