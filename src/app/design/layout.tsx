import * as React from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function DesignSystemLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r bg-muted/20 h-screen sticky top-0 overflow-y-auto hidden md:block">
        <div className="p-6">
          <Link href="/design" className="font-semibold text-lg tracking-tight mb-8 block">
            Ledger360 Design
          </Link>

          <nav className="space-y-8">
            <div>
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">Foundations</h3>
              <ul className="space-y-2">
                <li><Link href="/design/foundations/typography" className="text-sm hover:text-foreground text-muted-foreground transition-colors">Typography</Link></li>
                <li><Link href="/design/foundations/spacing" className="text-sm hover:text-foreground text-muted-foreground transition-colors">Spacing</Link></li>
                <li><Link href="/design/foundations/motion" className="text-sm hover:text-foreground text-muted-foreground transition-colors">Motion</Link></li>
                <li><Link href="/design/foundations/elevation" className="text-sm hover:text-foreground text-muted-foreground transition-colors">Elevation</Link></li>
                <li><Link href="/design/foundations/color" className="text-sm hover:text-foreground text-muted-foreground transition-colors">Color</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">Primitives</h3>
              <ul className="space-y-2">
                <li><Link href="/design/primitives/hero-metric" className="text-sm hover:text-foreground text-muted-foreground transition-colors">HeroMetric</Link></li>
                <li><Link href="/design/primitives/insight-card" className="text-sm hover:text-foreground text-muted-foreground transition-colors">InsightCard</Link></li>
                <li><Link href="/design/primitives/story-card" className="text-sm hover:text-foreground text-muted-foreground transition-colors">StoryCard</Link></li>
                <li><Link href="/design/primitives/journey-card" className="text-sm hover:text-foreground text-muted-foreground transition-colors">JourneyCard</Link></li>
                <li><Link href="/design/primitives/timeline" className="text-sm hover:text-foreground text-muted-foreground transition-colors">Timeline</Link></li>
                <li><Link href="/design/primitives/recommendation-card" className="text-sm hover:text-foreground text-muted-foreground transition-colors">RecommendationCard</Link></li>
                <li><Link href="/design/primitives/calculation-pills" className="text-sm hover:text-foreground text-muted-foreground transition-colors">CalculationPills</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">Compositions</h3>
              <ul className="space-y-2">
                <li><Link href="/design/compositions/dashboard-hero" className="text-sm hover:text-foreground text-muted-foreground transition-colors">Dashboard Hero</Link></li>
                <li><Link href="/design/compositions/activity-feed" className="text-sm hover:text-foreground text-muted-foreground transition-colors">Activity Feed</Link></li>
                <li><Link href="/design/compositions/financial-health" className="text-sm hover:text-foreground text-muted-foreground transition-colors">Financial Health</Link></li>
                <li><Link href="/design/compositions/progress-section" className="text-sm hover:text-foreground text-muted-foreground transition-colors">Progress Section</Link></li>
              </ul>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4 sm:px-6 lg:px-8 justify-between">
            <div className="md:hidden">
              <span className="font-semibold">L360</span>
            </div>
            <div className="flex flex-1 items-center justify-end gap-4">
              <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground">
                Phase 9B.1.6 Proving Ground
              </span>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <div className="p-8 md:p-12 lg:p-16 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
