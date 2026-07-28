import * as React from 'react';

interface TokenProp {
  label: string;
  value: string | React.ReactNode;
}

interface DesignTokensInspectorProps {
  title: string;
  category: string;
  tokens: TokenProp[];
  children?: React.ReactNode;
}

export function DesignTokensInspector({ title, category, tokens, children }: DesignTokensInspectorProps) {
  return (
    <div className="border rounded-2xl bg-card overflow-hidden">
      <div className="p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{category}</p>
        </div>
        {children && (
          <div className="flex-shrink-0">
            {children}
          </div>
        )}
      </div>
      <div className="p-0">
        <table className="w-full text-sm">
          <tbody>
            {tokens.map((token, i) => (
              <tr key={i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <td className="py-3 px-6 text-muted-foreground font-medium w-1/3 align-top">{token.label}</td>
                <td className="py-3 px-6 text-foreground font-mono">{token.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
