import * as React from 'react';
import { DesignTokensInspector } from '../../_components/DesignTokensInspector';

export const metadata = {
  title: 'Color Foundations | Ledger360',
};

export default function ColorFoundationPage() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Color Language</h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          The Semantic palette. Color is reserved for state communication, not decoration. A premium interface relies on contrast and typography, applying color only when a user's attention is demanded.
        </p>
      </div>

      <div className="space-y-8">
        <DesignTokensInspector
          title="Backgrounds (The Canvas)"
          category="Color / Surface"
          tokens={[
            { label: 'Background', value: 'hsl(var(--background))' },
            { label: 'Foreground', value: 'hsl(var(--foreground))' },
            { label: 'Secondary Surface', value: 'hsl(var(--secondary))' },
            { label: 'Secondary Text', value: 'hsl(var(--secondary-foreground))' },
            { label: 'Muted Surface', value: 'hsl(var(--muted))' },
            { label: 'Muted Text', value: 'hsl(var(--muted-foreground))' },
          ]}
        >
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-full border bg-background flex items-center justify-center shadow-sm">
              <span className="w-4 h-4 rounded-full bg-foreground" />
            </div>
            <div className="w-16 h-16 rounded-full border bg-secondary flex items-center justify-center">
              <span className="w-4 h-4 rounded-full bg-secondary-foreground" />
            </div>
            <div className="w-16 h-16 rounded-full border bg-muted flex items-center justify-center">
              <span className="w-4 h-4 rounded-full bg-muted-foreground" />
            </div>
          </div>
        </DesignTokensInspector>

        <DesignTokensInspector
          title="Primary (The Brand/Action)"
          category="Color / Action"
          tokens={[
            { label: 'Primary', value: 'hsl(var(--primary))' },
            { label: 'Primary Foreground', value: 'hsl(var(--primary-foreground))' },
            { label: 'Usage', value: 'Primary CTAs, active states, and selection boundaries.' },
          ]}
        >
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-md">
            <span className="w-4 h-4 rounded-full bg-primary-foreground" />
          </div>
        </DesignTokensInspector>

        <DesignTokensInspector
          title="Success (The Progress)"
          category="Color / Semantic"
          tokens={[
            { label: 'Success', value: 'hsl(var(--success))' },
            { label: 'Success Foreground', value: 'hsl(var(--success-foreground))' },
            { label: 'Usage', value: 'Positive milestones, income, budget compliance.' },
          ]}
        >
          <div className="w-16 h-16 rounded-full bg-[#10b981] flex items-center justify-center shadow-md">
            <span className="w-4 h-4 rounded-full bg-white" />
          </div>
        </DesignTokensInspector>

        <DesignTokensInspector
          title="Warning (The Nudge)"
          category="Color / Semantic"
          tokens={[
            { label: 'Warning', value: 'hsl(var(--warning))' },
            { label: 'Warning Foreground', value: 'hsl(var(--warning-foreground))' },
            { label: 'Usage', value: 'Approaching budget limits, delayed transfers.' },
          ]}
        >
          <div className="w-16 h-16 rounded-full bg-[#f5a623] flex items-center justify-center shadow-md">
            <span className="w-4 h-4 rounded-full bg-white" />
          </div>
        </DesignTokensInspector>

        <DesignTokensInspector
          title="Destructive (The Critical)"
          category="Color / Semantic"
          tokens={[
            { label: 'Destructive', value: 'hsl(var(--destructive))' },
            { label: 'Destructive Foreground', value: 'hsl(var(--destructive-foreground))' },
            { label: 'Usage', value: 'Over budget, missed payments, destructive actions.' },
          ]}
        >
          <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center shadow-md">
            <span className="w-4 h-4 rounded-full bg-destructive-foreground" />
          </div>
        </DesignTokensInspector>
      </div>
    </div>
  );
}
