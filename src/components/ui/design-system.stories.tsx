import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';

const meta = {
  title: 'Design System/Tokens Preview',
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const TokenPreview = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  return (
    <div data-theme={theme} className="bg-background text-foreground min-h-screen p-8 space-y-12 transition-colors duration-normal">
      <div className="flex justify-between items-center border-b border-border pb-4">
        <div>
          <h1 className="text-4xl font-heading font-bold">Design Token Verification</h1>
          <p className="text-muted-foreground mt-2 font-body text-lg">Visual proof of the Tailwind v4 @theme values.</p>
        </div>
        <button 
          onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
          className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md shadow-sm hover:opacity-90 transition-opacity"
        >
          Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
        </button>
      </div>

      <section>
        <h2 className="text-2xl font-heading font-semibold border-b border-border pb-2 mb-6">1. Typography Hierarchy</h2>
        <div className="space-y-6">
          <div><span className="text-sm text-muted-foreground font-mono">font-heading text-4xl font-bold</span><h1 className="text-4xl font-heading font-bold">Heading 1</h1></div>
          <div><span className="text-sm text-muted-foreground font-mono">font-heading text-3xl font-semibold</span><h2 className="text-3xl font-heading font-semibold">Heading 2</h2></div>
          <div><span className="text-sm text-muted-foreground font-mono">font-heading text-2xl font-semibold</span><h3 className="text-2xl font-heading font-semibold">Heading 3</h3></div>
          <div><span className="text-sm text-muted-foreground font-mono">font-body text-base</span><p className="font-body text-base">This is standard body text. It uses the Inter font family, designed for excellent legibility at small sizes. Ledger360 depends on clarity for financial data.</p></div>
          <div><span className="text-sm text-muted-foreground font-mono">font-mono text-sm</span><p className="font-mono text-sm">c03632fc-0e31-4ff2-bc12-f045239a589f</p></div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-heading font-semibold border-b border-border pb-2 mb-6">2. Spacing Scale</h2>
        <div className="flex flex-wrap gap-4 items-end">
          {[1, 2, 3, 4, 6, 8, 12, 16].map((space) => (
            <div key={space} className="flex flex-col items-center gap-2">
              <div className="bg-primary/20 border border-primary" style={{ width: `${space * 0.25}rem`, height: `${space * 0.25}rem` }} />
              <span className="font-mono text-xs text-muted-foreground">space-{space}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-heading font-semibold border-b border-border pb-2 mb-6">3. Semantic Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <div className="space-y-2"><div className="h-16 rounded-md bg-primary"></div><div className="text-sm font-medium">Primary</div><div className="text-xs text-muted-foreground">Action</div></div>
          <div className="space-y-2"><div className="h-16 rounded-md bg-secondary border border-border"></div><div className="text-sm font-medium">Secondary</div><div className="text-xs text-muted-foreground">Subtle</div></div>
          <div className="space-y-2"><div className="h-16 rounded-md bg-destructive"></div><div className="text-sm font-medium">Destructive</div><div className="text-xs text-muted-foreground">Error/Delete</div></div>
          <div className="space-y-2"><div className="h-16 rounded-md bg-success"></div><div className="text-sm font-medium">Success</div><div className="text-xs text-muted-foreground">Valid</div></div>
          <div className="space-y-2"><div className="h-16 rounded-md bg-warning"></div><div className="text-sm font-medium">Warning</div><div className="text-xs text-muted-foreground">Caution</div></div>
          <div className="space-y-2"><div className="h-16 rounded-md bg-muted border border-border"></div><div className="text-sm font-medium">Muted</div><div className="text-xs text-muted-foreground">Background/Disabled</div></div>
          <div className="space-y-2"><div className="h-16 rounded-md bg-finance-positive border border-border"></div><div className="text-sm font-medium">Finance Positive</div><div className="text-xs text-muted-foreground">Income</div></div>
          <div className="space-y-2"><div className="h-16 rounded-md bg-finance-negative border border-border"></div><div className="text-sm font-medium">Finance Negative</div><div className="text-xs text-muted-foreground">Expense</div></div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-heading font-semibold border-b border-border pb-2 mb-6">4. Elevation & Radius</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-4 bg-muted rounded-xl">
          <div className="bg-card text-card-foreground p-6 shadow-sm rounded-sm border border-border flex items-center justify-center min-h-32">
            <span className="font-mono text-sm">shadow-sm / rounded-sm</span>
          </div>
          <div className="bg-card text-card-foreground p-6 shadow-md rounded-md border border-border flex items-center justify-center min-h-32">
            <span className="font-mono text-sm">shadow-md / rounded-md</span>
          </div>
          <div className="bg-card text-card-foreground p-6 shadow-lg rounded-lg border border-border flex items-center justify-center min-h-32">
            <span className="font-mono text-sm">shadow-lg / rounded-lg</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-heading font-semibold border-b border-border pb-2 mb-6">5. Motion / Transition</h2>
        <div className="flex gap-8">
          <div className="group cursor-pointer">
            <div className="h-16 w-32 bg-primary rounded-md transition-all duration-fast group-hover:bg-success group-hover:scale-105 flex items-center justify-center text-primary-foreground font-mono text-sm">Hover Me</div>
            <div className="text-sm mt-2 text-muted-foreground text-center">duration-fast</div>
          </div>
          <div className="group cursor-pointer">
            <div className="h-16 w-32 bg-primary rounded-md transition-all duration-normal group-hover:bg-warning group-hover:scale-105 flex items-center justify-center text-primary-foreground font-mono text-sm">Hover Me</div>
            <div className="text-sm mt-2 text-muted-foreground text-center">duration-normal</div>
          </div>
          <div className="group cursor-pointer">
            <div className="h-16 w-32 bg-primary rounded-md transition-all duration-slow group-hover:bg-destructive group-hover:scale-105 flex items-center justify-center text-primary-foreground font-mono text-sm">Hover Me</div>
            <div className="text-sm mt-2 text-muted-foreground text-center">duration-slow</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export const Preview: Story = {
  render: () => <TokenPreview />,
};
