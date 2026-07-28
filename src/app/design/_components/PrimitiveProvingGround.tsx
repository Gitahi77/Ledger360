import * as React from 'react';

interface PrimitiveProvingGroundProps {
  name: string;
  purpose: string;
  whenToUse: string;
  whenNotToUse: string;
  antiPatterns: { correct: string; incorrect: string }[];
  children: React.ReactNode;
}

export function PrimitiveProvingGround({
  name,
  purpose,
  whenToUse,
  whenNotToUse,
  antiPatterns,
  children
}: PrimitiveProvingGroundProps) {
  return (
    <div className="space-y-16">
      {/* Header & Purpose */}
      <div className="space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">{name}</h1>
        <div className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          {purpose}
        </div>
      </div>

      {/* Rules */}
      <div className="grid sm:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-sm uppercase tracking-widest font-semibold text-muted-foreground border-b pb-2">When to use</h3>
          <p className="text-sm leading-relaxed">{whenToUse}</p>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm uppercase tracking-widest font-semibold text-muted-foreground border-b pb-2">When NOT to use</h3>
          <p className="text-sm leading-relaxed">{whenNotToUse}</p>
        </div>
      </div>

      {/* Anti-Patterns */}
      <div className="space-y-6">
        <h3 className="text-sm uppercase tracking-widest font-semibold text-muted-foreground border-b pb-2">Anti-Patterns</h3>
        <div className="grid gap-6">
          {antiPatterns.map((pattern, i) => (
            <div key={i} className="grid sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-success/10 border border-success/20 text-success-foreground">
                <div className="font-semibold mb-1 flex items-center gap-2">
                  <span>✓</span> Correct
                </div>
                {pattern.correct}
              </div>
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive-foreground">
                <div className="font-semibold mb-1 flex items-center gap-2">
                  <span>✗</span> Incorrect
                </div>
                {pattern.incorrect}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Variant Matrix */}
      <div className="space-y-8 pt-8">
        <h2 className="text-2xl font-bold tracking-tight border-b pb-4">Variant Matrix</h2>
        <div className="space-y-16">
          {children}
        </div>
      </div>
    </div>
  );
}

export function VariantBlock({ title, description, children }: { title: string, description?: string, children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium">{title}</h3>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="p-8 border rounded-2xl bg-card overflow-hidden">
        {children}
      </div>
    </div>
  );
}
