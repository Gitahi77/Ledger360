import * as React from 'react';
import { DesignTokensInspector } from '../../_components/DesignTokensInspector';

export const metadata = {
  title: 'Elevation Foundations | Ledger360',
};

export default function ElevationFoundationPage() {
  return (
    <div className="space-y-16">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Elevation & Depth</h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          The Stripe clarity. Ledger360 relies on an ultra-flat base canvas with subtle drop shadows introduced only when establishing interactive priority or Z-index hierarchy.
        </p>
      </div>

      <div className="space-y-8">
        <DesignTokensInspector
          title="Canvas (Level 0)"
          category="Elevation / Base"
          tokens={[
            { label: 'Background', value: 'bg-background (pure white / pure black)' },
            { label: 'Border', value: 'None' },
            { label: 'Shadow', value: 'None' },
            { label: 'Usage', value: 'The continuous, unified surface of the application.' },
          ]}
        >
          <div className="w-32 h-16 bg-background border border-dashed border-muted-foreground/30 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Canvas</span>
          </div>
        </DesignTokensInspector>

        <DesignTokensInspector
          title="Surface (Level 1)"
          category="Elevation / Component"
          tokens={[
            { label: 'Background', value: 'bg-card / bg-secondary' },
            { label: 'Border', value: 'border-border (1px solid)' },
            { label: 'Shadow', value: 'shadow-sm (0 1px 2px rgba(0,0,0,0.04))' },
            { label: 'Usage', value: 'Standard cards, inputs, and static primitives that sit atop the canvas.' },
          ]}
        >
          <div className="w-32 h-16 bg-card border shadow-sm rounded-lg flex items-center justify-center">
            <span className="text-xs">Surface</span>
          </div>
        </DesignTokensInspector>

        <DesignTokensInspector
          title="Interactive (Level 2)"
          category="Elevation / Hover"
          tokens={[
            { label: 'Background', value: 'bg-card / bg-secondary' },
            { label: 'Border', value: 'border-border' },
            { label: 'Shadow', value: 'shadow-md (0 4px 6px -1px rgba(0,0,0,0.08))' },
            { label: 'Usage', value: 'Applied exclusively during hover states to teach interactivity.' },
          ]}
        >
          <div className="w-32 h-16 bg-card border shadow-md rounded-lg flex items-center justify-center -translate-y-0.5 transition-all">
            <span className="text-xs">Hovered</span>
          </div>
        </DesignTokensInspector>

        <DesignTokensInspector
          title="Floating (Level 3)"
          category="Elevation / Overlay"
          tokens={[
            { label: 'Background', value: 'bg-popover' },
            { label: 'Border', value: 'border-border' },
            { label: 'Shadow', value: 'shadow-lg' },
            { label: 'Usage', value: 'Dropdowns, tooltips, and contextual menus.' },
          ]}
        >
          <div className="w-32 h-16 bg-popover border shadow-lg rounded-lg flex items-center justify-center relative z-10">
            <span className="text-xs">Floating</span>
          </div>
        </DesignTokensInspector>

        <DesignTokensInspector
          title="Modal (Level 4)"
          category="Elevation / Dialog"
          tokens={[
            { label: 'Background', value: 'bg-background' },
            { label: 'Border', value: 'None' },
            { label: 'Shadow', value: 'shadow-xl' },
            { label: 'Backdrop', value: 'bg-background/80 backdrop-blur-sm' },
            { label: 'Usage', value: 'Dialogs and bottom sheets that demand absolute focus.' },
          ]}
        >
          <div className="w-48 h-32 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl" />
            <div className="w-32 h-16 bg-background shadow-xl rounded-lg flex items-center justify-center relative z-10">
              <span className="text-xs font-medium">Modal</span>
            </div>
          </div>
        </DesignTokensInspector>
      </div>
    </div>
  );
}
