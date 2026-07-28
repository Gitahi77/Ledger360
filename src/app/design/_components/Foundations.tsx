import * as React from 'react';
import { ChartStandards } from '@/lib/design/tokens';

export function Foundations() {
  return (
    <section className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-2 border-b pb-2">FOUNDATIONS</h3>
        <p className="text-muted-foreground">Core design tokens and primitive scales.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Typography */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold border-b pb-2">Typography</h4>
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Hero (--text-fluid-hero)</span>
              <span className="text-[length:var(--text-fluid-hero)] font-bold tracking-tight leading-none">Hero Text</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">H1 (--text-fluid-h1)</span>
              <span className="text-[length:var(--text-fluid-h1)] font-bold tracking-tight">Heading 1</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">H2 (--text-fluid-h2)</span>
              <span className="text-[length:var(--text-fluid-h2)] font-semibold tracking-tight">Heading 2</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Body (--text-fluid-base)</span>
              <span className="text-[length:var(--text-fluid-base)]">The quick brown fox jumps over the lazy dog.</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-muted-foreground">Caption (--text-fluid-caption)</span>
              <span className="text-[length:var(--text-fluid-caption)] text-muted-foreground">Small print information.</span>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold border-b pb-2">Colors</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="h-10 rounded-md bg-background border shadow-sm"></div>
              <div className="text-xs font-medium">Background</div>
            </div>
            <div className="space-y-1.5">
              <div className="h-10 rounded-md bg-foreground border shadow-sm"></div>
              <div className="text-xs font-medium">Foreground</div>
            </div>
            <div className="space-y-1.5">
              <div className="h-10 rounded-md bg-primary border shadow-sm"></div>
              <div className="text-xs font-medium">Primary</div>
            </div>
            <div className="space-y-1.5">
              <div className="h-10 rounded-md bg-secondary border shadow-sm"></div>
              <div className="text-xs font-medium">Secondary</div>
            </div>
            <div className="space-y-1.5">
              <div className="h-10 rounded-md bg-muted border shadow-sm"></div>
              <div className="text-xs font-medium">Muted</div>
            </div>
            <div className="space-y-1.5">
              <div className="h-10 rounded-md bg-accent border shadow-sm"></div>
              <div className="text-xs font-medium">Accent</div>
            </div>
            <div className="space-y-1.5">
              <div className="h-10 rounded-md bg-success border shadow-sm"></div>
              <div className="text-xs font-medium">Success</div>
            </div>
            <div className="space-y-1.5">
              <div className="h-10 rounded-md bg-warning border shadow-sm"></div>
              <div className="text-xs font-medium">Warning</div>
            </div>
            <div className="space-y-1.5">
              <div className="h-10 rounded-md bg-destructive border shadow-sm"></div>
              <div className="text-xs font-medium">Destructive</div>
            </div>
          </div>
        </div>

        {/* Spacing & Layout */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold border-b pb-2">Spacing & Grid</h4>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-[var(--layout-page-gutter)] h-8 bg-primary/20 rounded-sm"></div>
              <span className="text-sm">Page Gutter (--layout-page-gutter)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-[var(--layout-card-gap)] h-8 bg-primary/20 rounded-sm"></div>
              <span className="text-sm">Card Gap (--layout-card-gap)</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-[var(--layout-section-gap)] h-8 bg-primary/20 rounded-sm"></div>
              <span className="text-sm">Section Gap (--layout-section-gap)</span>
            </div>
            <div className="flex items-center gap-4 mt-6">
              <div className="w-16 h-[var(--touch-target-min)] bg-primary/10 border border-primary/20 border-dashed rounded-md flex items-center justify-center text-xs">
                44px
              </div>
              <span className="text-sm">Touch Target (--touch-target-min)</span>
            </div>
          </div>
        </div>

        {/* Elevation */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold border-b pb-2">Elevation</h4>
          <div className="grid grid-cols-2 gap-6 p-4 bg-muted/30 rounded-xl">
            <div className="h-24 bg-background rounded-xl border flex items-center justify-center shadow-none">
              <span className="text-sm font-medium">Surface 0 (Flat)</span>
            </div>
            <div className="h-24 bg-background rounded-xl border flex items-center justify-center shadow-sm">
              <span className="text-sm font-medium">Surface 1 (Card)</span>
            </div>
            <div className="h-24 bg-background rounded-xl border flex items-center justify-center shadow-md">
              <span className="text-sm font-medium">Surface 2 (Dropdown)</span>
            </div>
            <div className="h-24 bg-background rounded-xl border flex items-center justify-center shadow-lg">
              <span className="text-sm font-medium">Surface 3 (Modal)</span>
            </div>
          </div>
        </div>

        {/* Radius */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold border-b pb-2">Radius</h4>
          <div className="flex gap-4">
            <div className="h-16 w-16 bg-primary/20 border border-primary/40 rounded-sm flex items-center justify-center text-xs">sm</div>
            <div className="h-16 w-16 bg-primary/20 border border-primary/40 rounded-md flex items-center justify-center text-xs">md</div>
            <div className="h-16 w-16 bg-primary/20 border border-primary/40 rounded-lg flex items-center justify-center text-xs">lg</div>
            <div className="h-16 w-16 bg-primary/20 border border-primary/40 rounded-xl flex items-center justify-center text-xs">xl</div>
            <div className="h-16 w-16 bg-primary/20 border border-primary/40 rounded-full flex items-center justify-center text-xs">full</div>
          </div>
        </div>
      </div>
    </section>
  );
}
