import * as React from 'react';

export interface ActivityFeedProps {
  /** Optional section title (defaults to 'Recent Activity') */
  title?: string;
  /** The TimelineGroup components */
  children: React.ReactNode;
}

export function ActivityFeed({ title = 'Recent Activity', children }: ActivityFeedProps) {
  return (
    <section className="p-6 md:p-8 border border-border bg-card rounded-3xl shadow-sm">
      <h2 className="text-xl font-bold tracking-tight mb-8">
        {title}
      </h2>
      <div className="space-y-8">
        {children}
      </div>
    </section>
  );
}
