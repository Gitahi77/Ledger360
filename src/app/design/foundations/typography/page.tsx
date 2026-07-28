import * as React from 'react';
import { DesignTokensInspector } from '../../_components/DesignTokensInspector';

export const metadata = {
  title: 'Typography Foundations | Ledger360',
};

export default function TypographyFoundationPage() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Typography</h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          The Apple rhythm. Hierarchy is defined by scale and spacing, not color. Every data element uses the Inter font family.
        </p>
      </div>

      <div className="space-y-8">
        <DesignTokensInspector
          title="Hero Scale (64px)"
          category="Typography / Display"
          tokens={[
            { label: 'CSS Variable', value: 'text-6xl / text-7xl' },
            { label: 'Font Size', value: '64px (4rem)' },
            { label: 'Line Height', value: '1.05' },
            { label: 'Letter Spacing', value: '-0.04em' },
            { label: 'Weight', value: '400 / 500' },
            { label: 'Usage', value: 'Reserved exclusively for the primary focal point of the screen.' },
          ]}
        >
          <div className="text-6xl md:text-7xl tracking-tighter leading-[1.05]">
            KES 45,200
          </div>
        </DesignTokensInspector>

        <DesignTokensInspector
          title="Title Scale (32px)"
          category="Typography / Heading"
          tokens={[
            { label: 'CSS Variable', value: 'text-3xl / text-4xl' },
            { label: 'Font Size', value: '32px (2rem)' },
            { label: 'Line Height', value: '1.2' },
            { label: 'Letter Spacing', value: '-0.02em' },
            { label: 'Weight', value: '600 / 700' },
            { label: 'Usage', value: 'Introducing new emotional states or sections.' },
          ]}
        >
          <div className="text-3xl font-bold tracking-tight">
            Financial Health
          </div>
        </DesignTokensInspector>

        <DesignTokensInspector
          title="Narrative Scale (18px)"
          category="Typography / Body"
          tokens={[
            { label: 'CSS Variable', value: 'text-lg' },
            { label: 'Font Size', value: '18px (1.125rem)' },
            { label: 'Line Height', value: '1.6' },
            { label: 'Letter Spacing', value: '0' },
            { label: 'Weight', value: '400' },
            { label: 'Usage', value: 'Conversational activity and story card explanations.' },
          ]}
        >
          <div className="text-lg leading-relaxed text-muted-foreground">
            Everything due this week has already been accounted for.
          </div>
        </DesignTokensInspector>

        <DesignTokensInspector
          title="Label Scale (12px)"
          category="Typography / Metadata"
          tokens={[
            { label: 'CSS Variable', value: 'text-xs uppercase tracking-widest' },
            { label: 'Font Size', value: '12px (0.75rem)' },
            { label: 'Line Height', value: '1' },
            { label: 'Letter Spacing', value: '0.05em' },
            { label: 'Weight', value: '500 / 600' },
            { label: 'Usage', value: 'Metadata, timeline grouping (TODAY), and micro-copy.' },
          ]}
        >
          <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Today
          </div>
        </DesignTokensInspector>
      </div>
    </div>
  );
}
