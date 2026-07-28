import * as React from 'react';

export interface StoryStackProps {
  /** The section title */
  title: string;
  children: React.ReactNode;
}

export function StoryStack({ title, children }: StoryStackProps) {
  return (
    <section className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight px-1">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </section>
  );
}
