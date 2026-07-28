import * as React from 'react';

export function Changelog() {
  return (
    <section className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-2 border-b pb-2">CHANGELOG</h3>
        <p className="text-muted-foreground">Version history and API freezes.</p>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
          <div className="font-semibold text-sm">Version 1.0 (Phase 9A)</div>
          <div className="text-xs text-muted-foreground">July 2026</div>
        </div>
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Core Updates</h4>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
              <li>Established fluid typography and responsive scaling.</li>
              <li>Defined standard Motion, Elevation, and Layout tokens.</li>
              <li>Introduced the `ResponsiveDialog` component.</li>
              <li>Finalized `InsightCard` as the standard mechanism for data storytelling.</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-warning">API Status</h4>
            <p className="text-sm text-muted-foreground">
              All UI primitives defined on this page are considered <strong>Frozen</strong> for Phase 9B. 
              Any modifications to these components require architectural review to prevent widespread regressions.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
