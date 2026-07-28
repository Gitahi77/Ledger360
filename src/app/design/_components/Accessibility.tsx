import * as React from 'react';
import { Button } from '@/components/ui/button';

export function Accessibility() {
  return (
    <section className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-2 border-b pb-2">ACCESSIBILITY</h3>
        <p className="text-muted-foreground">WCAG AA compliance and a11y patterns.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <h4 className="text-lg font-semibold border-b pb-2">Focus Rings</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Keyboard navigation is fully supported. Try pressing <kbd className="px-1.5 py-0.5 bg-muted rounded border text-xs">Tab</kbd> to see the focus rings.
          </p>
          <div className="flex gap-4">
            <Button>Focus Me</Button>
            <Button variant="secondary">Or Me</Button>
            <a href="#" className="text-sm font-medium text-primary hover:underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm ring-offset-background">
              Accessible Link
            </a>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold border-b pb-2">Screen Readers (ARIA)</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Components use Radix UI primitives which handle complex ARIA attributes automatically.
            Custom semantic components should include `aria-label` or `sr-only` text.
          </p>
          <div className="p-4 border rounded-xl bg-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Icon-only button:</span>
              <Button variant="ghost" size="icon" aria-label="Settings">
                <span className="sr-only">Settings</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-lg font-semibold border-b pb-2">Reduced Motion</h4>
          <p className="text-sm text-muted-foreground">
            All animations respect the <code>@media (prefers-reduced-motion: reduce)</code> media query.
            When enabled at the OS level, animations become instant to prevent discomfort for users with vestibular disorders.
          </p>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-lg font-semibold border-b pb-2">Color Contrast</h4>
          <p className="text-sm text-muted-foreground">
            The design token system mathematically enforces WCAG AA (4.5:1) minimum contrast ratios 
            for all primary, secondary, and accent colors against their respective backgrounds.
          </p>
        </div>
      </div>
    </section>
  );
}
