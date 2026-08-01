'use client';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/finance/formatCurrency';
import type { FinancialIntelligenceDTO, MonthlyTrendData } from '@/lib/domain/calculators/financial-intelligence';
import { FinancialHealthIndicator } from '@/components/finance/primitives/FinancialHealthIndicator';
import { KPIHero } from '@/components/finance/primitives/KPIHero';
import { TrendBadge } from '@/components/finance/primitives/TrendBadge';
import { VarianceIndicator } from '@/components/finance/primitives/VarianceIndicator';
import { MetricComparison } from '@/components/finance/primitives/MetricComparison';
import { RollingAverageChart } from '@/components/finance/primitives/RollingAverageChart';
import { Sparkline } from '@/components/finance/primitives/Sparkline';

type CategoryRow = { name: string; value: number; pct: number; color: string };

export function ReportsClient({
  period, 
  trend, 
  expenseCategories, 
  incomeCategories, 
  financialIntelligence, 
  currency,
}: {
  period: string;
  trend: MonthlyTrendData[];
  summary: any;
  expenseCategories: CategoryRow[];
  incomeCategories: CategoryRow[];
  financialIntelligence: FinancialIntelligenceDTO;
  currency: string;
}) {
  const router = useRouter();

  function setPeriod(p: string) {
    router.push(`/reports?period=${p}`);
  }

  const { advisor, executiveSummary, behaviourAnalysis, deepAnalytics } = financialIntelligence;

  // Map 6-mo trend to RollingAverageChart data format
  const incomeTrendData = trend.map(t => ({ label: t.label, actual: t.Income, average: deepAnalytics.rollingAverages.income6Mo }));
  const expenseTrendData = trend.map(t => ({ label: t.label, actual: t.Expenses, average: deepAnalytics.rollingAverages.expenses6Mo }));

  return (
    <div className="page-container max-w-[1100px] mx-auto pb-12">
      
      {/* Header & Period Selector */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4 print-hide">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Financial Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">AI-driven analysis of your financial history.</p>
        </div>
        <div className="flex gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100">
          {['this-month', 'this-year'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${period === p ? 'bg-white text-gray-900 shadow-sm border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}>
              {p === 'this-month' ? 'This Month' : 'This Year'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-10">

        {/* Level 1: Immediate Answer (Advisor Note) */}
        <section className="animate-in">
          <div className="p-6 bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl shadow-md text-white border border-gray-900 flex items-start gap-4">
            <div className="w-1.5 h-full rounded-full bg-emerald-500 flex-shrink-0" style={{ backgroundColor: advisor.status === 'negative' ? '#f43f5e' : advisor.status === 'warning' ? '#f59e0b' : '#10b981' }} />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 block">Ledger360 Intelligence</span>
              <p className="text-lg font-light leading-relaxed">
                {advisor.narrative}
              </p>
            </div>
          </div>
        </section>

        {/* Level 2: Executive Summary */}
        <section className="animate-in" style={{ animationDelay: '50ms' }}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <FinancialHealthIndicator score={executiveSummary.healthScore} label={executiveSummary.healthStatus} />
            </div>
            <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KPIHero label="Net Cash Flow" amount={executiveSummary.netCashFlow} currency={currency} trendChange={executiveSummary.netCashFlowChange} isGoodIfPositive={true} />
              <KPIHero label="Savings Rate" percentage={executiveSummary.savingsRate} trendChange={executiveSummary.savingsRateChange} isGoodIfPositive={true} />
              <KPIHero label="Total Income" amount={executiveSummary.income} currency={currency} trendChange={executiveSummary.incomeChange} isGoodIfPositive={true} />
              <KPIHero label="Total Expenses" amount={executiveSummary.expenses} currency={currency} trendChange={executiveSummary.expensesChange} isGoodIfPositive={false} />
            </div>
          </div>
        </section>

        {/* Level 3: Behaviour Analysis */}
        <section className="animate-in" style={{ animationDelay: '100ms' }}>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-4">Behaviour Analysis</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
              <span className="text-sm font-medium text-gray-500">6-Month Trajectories</span>
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <span className="text-sm text-gray-700">Cash Flow</span>
                <TrendBadge trend={behaviourAnalysis.cashFlowTrend} sentiment={behaviourAnalysis.cashFlowTrend === 'Expanding' ? 'positive' : behaviourAnalysis.cashFlowTrend === 'Contracting' ? 'negative' : 'neutral'} />
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <span className="text-sm text-gray-700">Income</span>
                <TrendBadge trend={behaviourAnalysis.incomeTrend} sentiment={behaviourAnalysis.incomeTrend === 'Rising' ? 'positive' : behaviourAnalysis.incomeTrend === 'Falling' ? 'negative' : 'neutral'} />
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                <span className="text-sm text-gray-700">Expenses</span>
                <TrendBadge trend={behaviourAnalysis.expenseTrend} sentiment={behaviourAnalysis.expenseTrend === 'Falling' ? 'positive' : behaviourAnalysis.expenseTrend === 'Rising' ? 'negative' : 'neutral'} />
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
              <span className="text-sm font-medium text-gray-500">Volatility</span>
              <VarianceIndicator variance={deepAnalytics.monthlyVariance.incomeVariance} status="Stable" />
              <div className="text-xs text-gray-400 mb-2">Income Stability</div>
              
              <VarianceIndicator variance={deepAnalytics.monthlyVariance.expenseVariance} status={deepAnalytics.monthlyVariance.status} />
              <div className="text-xs text-gray-400">Expense Stability</div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4">
              <span className="text-sm font-medium text-gray-500">Category Drivers</span>
              {behaviourAnalysis.topGrowingCategory ? (
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-rose-600">Fastest Growing</span>
                    <span className="text-lg font-light text-gray-900">{behaviourAnalysis.topGrowingCategory}</span>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-400">No rapidly growing categories.</span>
              )}
              {behaviourAnalysis.topShrinkingCategory && (
                <div className="flex justify-between items-center mt-2 pt-4 border-t border-gray-50">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-emerald-600">Fastest Shrinking</span>
                    <span className="text-lg font-light text-gray-900">{behaviourAnalysis.topShrinkingCategory}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Level 4: Deep Analytics */}
        <section className="animate-in" style={{ animationDelay: '150ms' }}>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-4">Deep Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500">Expense Distribution vs 6M Average</span>
              <RollingAverageChart data={expenseTrendData} lineColor="#f43f5e" barColor="#ffe4e6" />
              <div className="mt-4 pt-4 border-t border-gray-50">
                <MetricComparison 
                  label="Current Expenses" 
                  actual={executiveSummary.expenses} 
                  benchmark={deepAnalytics.rollingAverages.expenses6Mo} 
                  benchmarkLabel="6M Average" 
                  currency={currency} 
                  isGoodIfActualIsHigher={false} 
                />
              </div>
            </div>

            <div className="flex flex-col gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-sm font-medium text-gray-500">Income Distribution vs 6M Average</span>
              <RollingAverageChart data={incomeTrendData} lineColor="#10b981" barColor="#d1fae5" />
              <div className="mt-4 pt-4 border-t border-gray-50">
                <MetricComparison 
                  label="Current Income" 
                  actual={executiveSummary.income} 
                  benchmark={deepAnalytics.rollingAverages.income6Mo} 
                  benchmarkLabel="6M Average" 
                  currency={currency} 
                  isGoodIfActualIsHigher={true} 
                />
              </div>
            </div>

          </div>
        </section>

        {/* Level 5: Exploration (Top Categories) */}
        <section className="animate-in pb-12" style={{ animationDelay: '200ms' }}>
          <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-widest mb-4">Exploration</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">Top Expenses</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {expenseCategories.length > 0 ? expenseCategories.slice(0, 5).map(cat => (
                  <div key={cat.name} className="flex justify-between items-center px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-gray-500">{cat.pct}%</span>
                      <span className="text-sm font-medium text-gray-900 w-24 text-right">{formatCurrency({ amountMinor: cat.value, currency }, { variant: 'compact' })}</span>
                    </div>
                  </div>
                )) : (
                  <div className="p-5 text-sm text-gray-400">No expense data found.</div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700">Top Income Sources</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {incomeCategories.length > 0 ? incomeCategories.slice(0, 5).map(cat => (
                  <div key={cat.name} className="flex justify-between items-center px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                      <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-mono text-gray-500">{cat.pct}%</span>
                      <span className="text-sm font-medium text-gray-900 w-24 text-right">{formatCurrency({ amountMinor: cat.value, currency }, { variant: 'compact' })}</span>
                    </div>
                  </div>
                )) : (
                  <div className="p-5 text-sm text-gray-400">No income data found.</div>
                )}
              </div>
            </div>

          </div>
        </section>

      </div>
    </div>
  );
}
