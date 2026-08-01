import React from 'react';

type VarianceIndicatorProps = {
  variance: number;
  status: 'Stable' | 'Variable' | 'Highly Volatile';
};

export function VarianceIndicator({ variance, status }: VarianceIndicatorProps) {
  let indicatorColor = 'bg-emerald-500';
  let trackColor = 'bg-emerald-100';
  
  if (status === 'Variable') {
    indicatorColor = 'bg-amber-500';
    trackColor = 'bg-amber-100';
  } else if (status === 'Highly Volatile') {
    indicatorColor = 'bg-rose-500';
    trackColor = 'bg-rose-100';
  }

  // Cap width at 100% for display purposes (variance is a percentage CV)
  const widthPct = Math.min(100, Math.max(5, variance));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-gray-700">{status}</span>
        <span className="text-gray-400 font-mono text-xs">{variance.toFixed(1)}% CV</span>
      </div>
      <div className={`w-full h-1.5 rounded-full ${trackColor} overflow-hidden`}>
        <div 
          className={`h-full rounded-full ${indicatorColor} transition-all duration-500 ease-out`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}
