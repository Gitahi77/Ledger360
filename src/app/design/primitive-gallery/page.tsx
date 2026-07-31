'use client';

import React, { useState } from 'react';

const PrimitiveGallery = () => {
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans p-8 pb-32">
      <div className="max-w-5xl mx-auto space-y-16">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <h1 className="text-h2 font-medium">Primitive Gallery & Token Audit</h1>
            <p className="text-body text-muted-foreground mt-2">Design Bible Version: Financial Calm v1.0</p>
          </div>
          <button 
            onClick={toggleTheme}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium cursor-pointer"
          >
            Toggle Theme
          </button>
        </header>

        {/* Token Audit Checklist */}
        <section className="space-y-4">
          <h2 className="text-h3 font-medium">Financial Calm v1.0 Token Audit</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card border border-border p-6 rounded-xl">
              <h3 className="font-semibold mb-4">Colors</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ background</li>
                <li>✓ foreground</li>
                <li>✓ card</li>
                <li>✓ primary</li>
                <li>✓ secondary</li>
                <li>✓ muted</li>
                <li>✓ positive</li>
                <li>✓ warning</li>
                <li>✓ negative</li>
                <li>✓ neutral</li>
              </ul>
            </div>
            <div className="bg-card border border-border p-6 rounded-xl">
              <h3 className="font-semibold mb-4">Typography</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ text-hero</li>
                <li>✓ text-h1</li>
                <li>✓ text-h2</li>
                <li>✓ text-h3</li>
                <li>✓ text-body-large</li>
                <li>✓ text-body</li>
                <li>✓ text-caption</li>
                <li>✓ text-label</li>
                <li>✓ text-numeric</li>
              </ul>
            </div>
            <div className="bg-card border border-border p-6 rounded-xl">
              <h3 className="font-semibold mb-4">Spacing & Radii</h3>
              <ul className="space-y-2 text-sm">
                <li>✓ p-4</li>
                <li>✓ p-8</li>
                <li>✓ p-12</li>
                <li>✓ p-16</li>
                <li>✓ rounded-md (4px)</li>
                <li>✓ rounded-xl (12px)</li>
                <li>✓ rounded-2xl (16px)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Semantic Colors */}
        <section className="space-y-6">
          <h2 className="text-h3 font-medium border-b border-border pb-2">1. Semantic Colors</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ColorSwatch name="Background" varName="--background" />
            <ColorSwatch name="Foreground" varName="--foreground" />
            <ColorSwatch name="Card" varName="--card" />
            <ColorSwatch name="Popover" varName="--popover" />
            
            <ColorSwatch name="Primary (Brand)" varName="--primary" />
            <ColorSwatch name="Secondary" varName="--secondary" />
            <ColorSwatch name="Muted" varName="--muted" />
            <ColorSwatch name="Border" varName="--border" />
            
            <ColorSwatch name="Success / Positive" varName="--success" />
            <ColorSwatch name="Warning / Amber" varName="--warning" />
            <ColorSwatch name="Destructive / Critical" varName="--destructive" />
          </div>
        </section>

        {/* Typography Scale */}
        <section className="space-y-6">
          <h2 className="text-h3 font-medium border-b border-border pb-2">2. Typography Scale</h2>
          <div className="space-y-8 bg-card border border-border rounded-xl p-8">
            <div className="flex flex-col md:flex-row md:items-baseline gap-4">
              <span className="w-32 text-caption">.text-hero</span>
              <span className="text-hero truncate">Hero Display</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-4">
              <span className="w-32 text-caption">.text-h1</span>
              <span className="text-h1">Heading 1</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-4">
              <span className="w-32 text-caption">.text-h2</span>
              <span className="text-h2">Heading 2</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-4">
              <span className="w-32 text-caption">.text-h3</span>
              <span className="text-h3">Heading 3</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-4">
              <span className="w-32 text-caption">.text-body-large</span>
              <span className="text-body-large">Body Large: The quick brown fox jumps over the lazy dog.</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-4">
              <span className="w-32 text-caption">.text-body</span>
              <span className="text-body">Body: The quick brown fox jumps over the lazy dog.</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-4">
              <span className="w-32 text-caption">.text-caption</span>
              <span className="text-caption">Caption: Supporting text for minor details.</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-4">
              <span className="w-32 text-caption">.text-label</span>
              <span className="text-label">Status Label</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-4">
              <span className="w-32 text-caption">.text-numeric</span>
              <span className="text-numeric text-h3">$14,295.00</span>
            </div>
          </div>
        </section>

        {/* Spacing & Radii */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h2 className="text-h3 font-medium border-b border-border pb-2">3. Spacing Scale</h2>
            <div className="space-y-4">
              <SpacingSwatch size="var(--space-1)" label="--space-1 (4px)" />
              <SpacingSwatch size="var(--space-2)" label="--space-2 (8px)" />
              <SpacingSwatch size="var(--space-3)" label="--space-3 (12px)" />
              <SpacingSwatch size="var(--space-4)" label="--space-4 (16px)" />
              <SpacingSwatch size="var(--space-6)" label="--space-6 (24px)" />
              <SpacingSwatch size="var(--space-8)" label="--space-8 (32px)" />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-h3 font-medium border-b border-border pb-2">4. Border Radii</h2>
            <div className="flex gap-4 items-end h-32">
              <div className="bg-secondary border border-border w-16 h-16" style={{ borderRadius: 'var(--radius-sm)' }}>
                <span className="text-caption p-2 block text-center mt-16">sm</span>
              </div>
              <div className="bg-secondary border border-border w-16 h-16" style={{ borderRadius: 'var(--radius-md)' }}>
                <span className="text-caption p-2 block text-center mt-16">md</span>
              </div>
              <div className="bg-secondary border border-border w-16 h-16" style={{ borderRadius: 'var(--radius-lg)' }}>
                <span className="text-caption p-2 block text-center mt-16">lg</span>
              </div>
              <div className="bg-secondary border border-border w-16 h-16" style={{ borderRadius: 'var(--radius-pill)' }}>
                <span className="text-caption p-2 block text-center mt-16">pill</span>
              </div>
            </div>
          </div>
        </section>

        {/* Shadows / Elevation */}
        <section className="space-y-6">
          <h2 className="text-h3 font-medium border-b border-border pb-2">5. Elevation / Shadows</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-8 bg-secondary rounded-xl">
            <div className="bg-card h-32 rounded-lg flex items-center justify-center text-body border border-border">
              Base Surface
            </div>
            <div className="bg-card h-32 rounded-lg flex items-center justify-center text-body border border-border" style={{ boxShadow: 'var(--shadow-sm-val)' }}>
              --shadow-sm
            </div>
            <div className="bg-card h-32 rounded-lg flex items-center justify-center text-body border border-border" style={{ boxShadow: 'var(--shadow-md-val)' }}>
              --shadow-md
            </div>
          </div>
        </section>

        {/* Motion & Interaction */}
        <section className="space-y-6">
          <h2 className="text-h3 font-medium border-b border-border pb-2">6. Motion Curves</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 border border-border rounded-xl">
              <p className="text-body font-medium mb-4">Ease Spring (150ms)</p>
              <div className="group h-12 bg-secondary rounded-md overflow-hidden relative cursor-pointer">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-primary w-12 rounded-md"
                  style={{ transition: 'transform 150ms var(--ease-spring)' }}
                ></div>
                <p className="text-caption text-center pt-3 relative z-10 group-hover:opacity-0 transition-opacity">Hover over me</p>
                {/* CSS hack for demo: inline style translation on hover won't work perfectly without JS, but let's use a nested hover */}
                <style>{`
                  .group:hover > div { transform: translateX(300px); }
                `}</style>
              </div>
            </div>
            <div className="p-6 border border-border rounded-xl">
              <p className="text-body font-medium mb-4">Ease Smooth (300ms)</p>
              <div className="group h-12 bg-secondary rounded-md overflow-hidden relative cursor-pointer">
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-primary w-12 rounded-md"
                  style={{ transition: 'transform 300ms var(--ease-smooth)' }}
                ></div>
                <p className="text-caption text-center pt-3 relative z-10 group-hover:opacity-0 transition-opacity">Hover over me</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Primitives Placeholders for A2 */}
        <section className="space-y-6 opacity-50 pointer-events-none">
          <h2 className="text-h3 font-medium border-b border-border pb-2 flex justify-between">
            <span>7. UI Components</span>
            <span className="text-caption bg-secondary px-2 py-1 rounded">Pending Phase A2</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="h-48 border border-dashed border-border rounded-xl flex items-center justify-center flex-col">
              <p className="text-body">Buttons</p>
              <p className="text-caption">12 states remaining</p>
            </div>
            <div className="h-48 border border-dashed border-border rounded-xl flex items-center justify-center flex-col">
              <p className="text-body">Inputs & Forms</p>
              <p className="text-caption">Focus & Validation remaining</p>
            </div>
            <div className="h-48 border border-dashed border-border rounded-xl flex items-center justify-center flex-col">
              <p className="text-body">Cards & Surfaces</p>
              <p className="text-caption">Interactive states remaining</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

const ColorSwatch = ({ name, varName }: { name: string, varName: string }) => (
  <div className="flex items-center gap-4 p-3 border border-border rounded-xl bg-card">
    <div className="w-10 h-10 rounded-full border border-border/50 shadow-sm shrink-0" style={{ backgroundColor: `hsl(var(${varName}))` }}></div>
    <div className="overflow-hidden">
      <p className="text-body text-sm font-medium truncate">{name}</p>
      <p className="text-caption text-xs font-mono">{varName}</p>
    </div>
  </div>
);

const SpacingSwatch = ({ size, label }: { size: string, label: string }) => (
  <div className="flex items-center gap-4">
    <div className="w-24 text-caption text-right">{label}</div>
    <div className="bg-primary/20 h-6 rounded-sm border border-primary/30" style={{ width: size }}></div>
  </div>
);

export default PrimitiveGallery;
