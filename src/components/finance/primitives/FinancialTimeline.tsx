import React from 'react';

type FinancialTimelineEvent = {
  title: string;
  description: string;
  date?: string;
  isPositive?: boolean;
};

type FinancialTimelineProps = {
  events: FinancialTimelineEvent[];
};

export function FinancialTimeline({ events }: FinancialTimelineProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className="relative border-l border-gray-100 ml-3 py-2 space-y-6">
      {events.map((event, i) => {
        let dotColor = 'bg-gray-200 border-white';
        if (event.isPositive === true) dotColor = 'bg-emerald-500 border-white';
        else if (event.isPositive === false) dotColor = 'bg-rose-500 border-white';

        return (
          <div key={i} className="relative pl-6">
            <div className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 shadow-sm ${dotColor}`} />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-gray-900">{event.title}</span>
              <span className="text-sm text-gray-500">{event.description}</span>
              {event.date && (
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide mt-1">
                  {event.date}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
