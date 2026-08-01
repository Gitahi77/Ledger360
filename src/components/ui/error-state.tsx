import { AlertTriangle, RotateCcw } from 'lucide-react';
import React from 'react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ 
  title = "Something went wrong", 
  message = "An unexpected error occurred. Our team has been notified.", 
  onRetry, 
  className 
}: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-background rounded-xl border border-border/50 max-w-md mx-auto shadow-sm ${className || ''}`}>
      <div className="w-12 h-12 rounded-full bg-alert-terracotta/10 flex items-center justify-center mb-5">
        <AlertTriangle className="w-6 h-6 text-alert-terracotta" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry} 
          className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors border border-border"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
      )}
    </div>
  );
}
