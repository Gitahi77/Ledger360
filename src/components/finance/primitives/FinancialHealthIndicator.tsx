import React from 'react';

type FinancialHealthIndicatorProps = {
  score: number;
  label: 'Excellent' | 'Good' | 'Fair' | 'Needs Attention';
};

export function FinancialHealthIndicator({ score, label }: FinancialHealthIndicatorProps) {
  let colorClass = 'text-green-500';
  if (score < 80) colorClass = 'text-teal-500';
  if (score < 60) colorClass = 'text-yellow-500';
  if (score < 40) colorClass = 'text-red-500';

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-2xl shadow-sm text-center">
      <span className="text-sm font-medium text-gray-500 tracking-wide uppercase mb-2">Financial Health</span>
      <div className={`text-6xl font-light ${colorClass} tracking-tight`}>
        {score}
        <span className="text-3xl text-gray-300">/100</span>
      </div>
      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-full text-sm font-medium text-gray-600">
        <div className={`w-2 h-2 rounded-full ${colorClass.replace('text-', 'bg-')}`} />
        {label}
      </div>
    </div>
  );
}
