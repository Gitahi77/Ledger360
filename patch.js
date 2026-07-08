const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', '(dashboard)', 'transactions', 'TransactionsClient.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Add imports
const importsToAdd = `import { Grid } from '@/components/layout/grid';
import { Stack } from '@/components/layout/stack';
import { Surface } from '@/components/ui/surface';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FinancialMetric } from '@/components/finance/metrics/FinancialMetric';
import { CurrencyDisplay } from '@/components/finance/display/currency-display';
`;

content = content.replace(`import { TransactionRow } from '@/components/finance/TransactionRow';`, importsToAdd + `import { TransactionRow } from '@/components/finance/TransactionRow';`);

// 2. Replace Hero
const oldHero = `{/* Summary Hero — Premium Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="col-span-1 md:col-span-2 rounded-2xl p-7 shadow-md flex flex-col justify-center relative overflow-hidden" style={{ background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
          <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '150%', height: '200%', background: netPositive ? 'radial-gradient(circle at right, rgba(22,163,74,0.04), transparent 60%)' : 'radial-gradient(circle at right, rgba(220,38,38,0.04), transparent 60%)', pointerEvents: 'none' }} />
          
          <div className="relative z-10">
            <p className="text-[0.7rem] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: netPositive ? 'var(--color-income)' : 'var(--color-expense)' }}></span>
              Net Flow · {periodLabel}
            </p>
            <p className="font-display font-extrabold tabular-nums tracking-tight" style={{ 
              fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', 
              lineHeight: 1.1,
              background: netPositive ? 'linear-gradient(90deg, var(--color-income), hsl(152,65%,62%))' : 'linear-gradient(90deg, var(--color-expense), hsl(0,78%,72%))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
              {netPositive ? '+' : ''}{fmtAdaptive(net, currency)}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-5 shadow-sm border" style={{ background: 'var(--surface-card)', borderColor: 'var(--border)' }}>
            <p className="text-[0.7rem] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-income)' }}></span>
              Money In
            </p>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {fmtAdaptive(totalIncome, currency)}
            </p>
          </div>
          <div className="rounded-2xl p-5 shadow-sm border" style={{ background: 'var(--surface-card)', borderColor: 'var(--border)' }}>
            <p className="text-[0.7rem] font-bold text-muted-foreground uppercase tracking-widest mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--color-expense)' }}></span>
              Money Out
            </p>
            <p className="text-2xl font-bold tabular-nums text-foreground">
              {fmtAdaptive(totalExpense, currency)}
            </p>
          </div>
        </div>
      </div>`;

const newHero = `{/* Summary Hero */}
      <Grid cols={{ base: 1, md: 3 }} gap="lg">
        <Surface variant="card" className="col-span-1 md:col-span-2 p-7 flex flex-col justify-center relative overflow-hidden">
          <div className="relative z-10">
            <FinancialMetric
              label={\`Net Flow · \${periodLabel}\`}
              value={<CurrencyDisplay amountMinor={net} currency={currency} size="xl" showSign />}
            />
          </div>
        </Surface>
        
        <Stack gap="md" className="col-span-1">
          <Surface variant="card" className="p-5">
            <FinancialMetric
              label="Money In"
              value={<CurrencyDisplay amountMinor={totalIncome} currency={currency} size="lg" />}
            />
          </Surface>
          <Surface variant="card" className="p-5">
            <FinancialMetric
              label="Money Out"
              value={<CurrencyDisplay amountMinor={totalExpense} currency={currency} size="lg" />}
            />
          </Surface>
        </Stack>
      </Grid>`;

content = content.replace(oldHero, newHero);

fs.writeFileSync(filePath, content);
console.log('Successfully patched TransactionsClient.tsx');
