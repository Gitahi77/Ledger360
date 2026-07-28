import * as React from 'react';

export const metadata = {
  title: 'Design System Proving Ground | Ledger360',
  description: 'Phase 9B.1.6 Component Certification',
};

export default function DesignIndexPage() {
  return (
    <div className="space-y-12">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">The Proving Ground</h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          This is the Phase 9B.1.6 certification environment. Every primitive must be proven here in isolation before it is allowed to enter a composition or a production page.
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div className="p-8 rounded-2xl border bg-card">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-4">1. Foundations</h2>
          <p className="text-foreground leading-relaxed mb-6">
            The design language codified as tokens. Typography rhythm, spacing language, elevation, and motion curves.
          </p>
          <a href="/design/foundations/typography" className="text-sm font-medium text-primary hover:underline">View Foundations &rarr;</a>
        </div>

        <div className="p-8 rounded-2xl border bg-card">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-4">2. Primitives</h2>
          <p className="text-foreground leading-relaxed mb-6">
            Dumb components that only know their props. Each must pass the Primitive Certification Checklist.
          </p>
          <a href="/design/primitives/hero-metric" className="text-sm font-medium text-primary hover:underline">View Primitives &rarr;</a>
        </div>

        <div className="p-8 rounded-2xl border bg-card sm:col-span-2">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-4">3. Compositions</h2>
          <p className="text-foreground leading-relaxed mb-6 max-w-3xl">
            Sections assembled entirely from certified primitives with absolutely zero custom CSS allowed. This is the final test before entering Phase 9B.2 (Dashboard Assembly).
          </p>
          <a href="/design/compositions/dashboard-hero" className="text-sm font-medium text-primary hover:underline">View Compositions &rarr;</a>
        </div>
      </div>

      <div className="pt-12 border-t">
        <h2 className="text-lg font-semibold mb-6">Primitive Certification Checklist</h2>
        <ul className="space-y-4 text-muted-foreground">
          <li className="flex gap-3">
            <span className="text-foreground font-medium">Purpose:</span> Answers one problem; clear when to use/not use.
          </li>
          <li className="flex gap-3">
            <span className="text-foreground font-medium">Visual:</span> Balanced at all viewports; uses strictly approved tokens; no magic numbers.
          </li>
          <li className="flex gap-3">
            <span className="text-foreground font-medium">Interaction:</span> Hover, Focus, Active, Disabled, Loading handled natively.
          </li>
          <li className="flex gap-3">
            <span className="text-foreground font-medium">Accessibility:</span> Keyboard-only, WCAG contrast, reduced motion respected.
          </li>
          <li className="flex gap-3">
            <span className="text-foreground font-medium">Engineering:</span> No duplicated styling, no hardcoded colors, no screen-specific logic, fully typed props.
          </li>
          <li className="flex gap-3">
            <span className="text-foreground font-medium">Performance:</span> Server Component by default, minimal JS, CSS-driven animation, zero layout shift.
          </li>
        </ul>
      </div>
    </div>
  );
}
