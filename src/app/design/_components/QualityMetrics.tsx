import * as React from 'react';
import { Check } from 'lucide-react';

export function QualityMetrics() {
  const metrics = [
    {
      category: 'Touch Target',
      items: ['44px minimum for primary actions']
    },
    {
      category: 'Card Padding',
      items: ['24px desktop', '16px mobile']
    },
    {
      category: 'Animation Duration',
      items: ['150ms (micro)', '250ms (standard)', '350ms (complex/dialog)']
    },
    {
      category: 'Border Radius',
      items: ['Small (sm)', 'Medium (md)', 'Large (lg)', 'Full (full)']
    },
    {
      category: 'Chart Palette',
      items: ['Primary', 'Success', 'Warning', 'Danger', 'Neutral']
    },
    {
      category: 'Typography Scale',
      items: ['Hero', 'H1', 'H2', 'Body', 'Caption']
    }
  ];

  return (
    <section className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold tracking-tight mb-2 border-b pb-2">QUALITY METRICS</h3>
        <p className="text-muted-foreground">Standardized constraints for PR reviews and component design.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {metrics.map((metric, i) => (
          <div key={i} className="p-4 border rounded-xl bg-card">
            <h4 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider">
              {metric.category}
            </h4>
            <ul className="space-y-2">
              {metric.items.map((item, j) => (
                <li key={j} className="flex items-start text-sm">
                  <Check className="h-4 w-4 text-success mr-2 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
