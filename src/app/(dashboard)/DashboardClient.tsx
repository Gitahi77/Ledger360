import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DashboardIntelligenceDTO } from '@/lib/types/dashboard-intelligence';
import { PageShell } from '@/components/os/PageShell';
import { EmptyState } from '@/components/os/EmptyState';
import { MetricBlock } from '@/components/os/MetricBlock';
import { AdvisoryCard } from '@/components/os/AdvisoryCard';
import { DashboardHero } from './_components/DashboardHero';
import { RadarTimeline } from './_components/RadarTimeline';
import { PlanHealthCard } from './_components/PlanHealthCard';
import { formatCurrency } from '@/lib/finance/formatCurrency';

type DashboardClientProps = {
  dto: DashboardIntelligenceDTO;
};

export function DashboardClient({ dto }: DashboardClientProps) {
  if (dto.dashboardState === 'onboarding') {
    return (
      <PageShell>
        <EmptyState 
          title="Welcome to Ledger360"
          description="Connect your first account or add a manual transaction to generate your financial briefing."
          action={
            <Button onClick={() => { console.log('link account'); }}>
              Link Account
            </Button>
          }
        />
      </PageShell>
    );
  }

  const isStale = dto.dataFreshness.status === 'stale';
  const reportingCurrency = dto.currentPosition.currency;

  return (
    <PageShell className="max-w-5xl mx-auto pt-8">
      {/* Hero Section */}
      <DashboardHero 
        briefing={dto.briefing} 
        safeToSpend={dto.safeToSpend} 
        isStale={isStale} 
      />

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-12">
        {/* Left Column (Main Content) - 65% on Desktop */}
        <div className="lg:col-span-8 flex flex-col gap-10">
          
          {/* Advisories - Mapped strictly in the order provided by the backend */}
          {dto.attentionItems.length > 0 && (
            <div className="flex flex-col gap-4">
              {dto.attentionItems.map((item) => (
                <div key={item.id}>
                  <AdvisoryCard 
                    title={item.severity.toUpperCase()} 
                    explainer={item.message} 
                    priority={item.severity === 'critical' ? 'critical' : item.severity === 'warning' ? 'high' : 'medium'}
                    action={item.actionableLink ? (
                      <Link href={item.actionableLink} className="text-sm font-semibold underline underline-offset-4">
                        Resolve issue &rarr;
                      </Link>
                    ) : undefined}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Vital Signs - The 4 explicit KPIs in a 2x2 grid */}
          <div className="grid grid-cols-2 gap-4">
            <MetricBlock 
              label="Total Cash" 
              value={formatCurrency({ amountMinor: dto.vitalSigns.totalCashMinor, currency: reportingCurrency }, { precision: 0 })}
            />
            <MetricBlock 
              label="30-Day Flow" 
              value={formatCurrency({ amountMinor: dto.vitalSigns.netFlow30DaysMinor, currency: reportingCurrency }, { precision: 0 })}
              trend={<span className={dto.trajectory.trend === 'improving' ? 'text-success' : dto.trajectory.trend === 'deteriorating' ? 'text-destructive' : 'text-muted-foreground'}>{dto.trajectory.trend}</span>}
            />
            <MetricBlock 
              label="Burn Rate" 
              value={dto.vitalSigns.burnRatePercentage !== null ? `${dto.vitalSigns.burnRatePercentage}%` : '---'} 
            />
            <MetricBlock 
              label="MTD Savings" 
              value={dto.vitalSigns.monthToDateSavingsMinor !== null ? formatCurrency({ amountMinor: dto.vitalSigns.monthToDateSavingsMinor, currency: reportingCurrency }, { precision: 0 }) : '---'} 
            />
          </div>

        </div>

        {/* Right Column (Radar & Planning) - 35% on Desktop */}
        <div className="lg:col-span-4 flex flex-col gap-10 border-t lg:border-t-0 lg:border-l border-border pt-10 lg:pt-0 lg:pl-8">
          
          <RadarTimeline 
            obligations={dto.upcomingObligations} 
            currency={reportingCurrency} 
          />

          {dto.planHealth && (
            <PlanHealthCard health={dto.planHealth} />
          )}

        </div>
      </div>
    </PageShell>
  );
}
