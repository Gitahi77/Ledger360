import * as React from 'react';
import { DesignTokensInspector } from '../../_components/DesignTokensInspector';

export const metadata = {
  title: 'Spacing Foundations | Ledger360',
};

export default function SpacingFoundationPage() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Spacing Language</h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          The Linear focus. Spacing is a design asset used to separate emotional states, not just pad divs. Built on a strict 4px/8px multiple baseline.
        </p>
      </div>

      <div className="space-y-8">
        <DesignTokensInspector
          title="Ultra Spacious (128px)"
          category="Spacing / Layout"
          tokens={[
            { label: 'CSS Variable / Tailwind', value: 'var(--space-32) / p-32, m-32, gap-32' },
            { label: 'Pixel Value', value: '128px (8rem)' },
            { label: 'Usage', value: 'The Huge Pause. Isolates the Hero section from the canvas to create breathing room.' },
          ]}
        >
          <div className="w-32 h-32 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
            <span className="text-xs font-mono text-primary">128px</span>
          </div>
        </DesignTokensInspector>

        <DesignTokensInspector
          title="Spacious (64px)"
          category="Spacing / Section"
          tokens={[
            { label: 'CSS Variable / Tailwind', value: 'var(--space-16) / p-16, m-16, gap-16' },
            { label: 'Pixel Value', value: '64px (4rem)' },
            { label: 'Usage', value: 'Separates different emotional states (e.g., from Attention to Progress).' },
          ]}
        >
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
            <span className="text-xs font-mono text-primary">64px</span>
          </div>
        </DesignTokensInspector>

        <DesignTokensInspector
          title="Comfortable (24px)"
          category="Spacing / Component"
          tokens={[
            { label: 'CSS Variable / Tailwind', value: 'var(--space-6) / p-6, m-6, gap-6' },
            { label: 'Pixel Value', value: '24px (1.5rem)' },
            { label: 'Usage', value: 'Separates individual narrative cards or timeline groups.' },
          ]}
        >
          <div className="w-6 h-6 bg-primary/10 border border-primary/20 rounded flex items-center justify-center">
            <span className="text-[10px] font-mono text-primary scale-75">24</span>
          </div>
        </DesignTokensInspector>

        <DesignTokensInspector
          title="Dense (8px)"
          category="Spacing / Primitive Internal"
          tokens={[
            { label: 'CSS Variable / Tailwind', value: 'var(--space-2) / p-2, m-2, gap-2' },
            { label: 'Pixel Value', value: '8px (0.5rem)' },
            { label: 'Usage', value: 'Used strictly within a primitive (e.g., between an icon and text, or calculation pills).' },
          ]}
        >
          <div className="w-2 h-2 bg-primary/10 border border-primary/20 rounded" />
        </DesignTokensInspector>
        
        <DesignTokensInspector
          title="Compressed (4px)"
          category="Spacing / Micro"
          tokens={[
            { label: 'CSS Variable / Tailwind', value: 'var(--space-1) / p-1, m-1, gap-1' },
            { label: 'Pixel Value', value: '4px (0.25rem)' },
            { label: 'Usage', value: 'Micro-adjustments, border-radius offsets, icon nudges.' },
          ]}
        >
          <div className="w-1 h-1 bg-primary border border-primary/50" />
        </DesignTokensInspector>
      </div>
    </div>
  );
}
