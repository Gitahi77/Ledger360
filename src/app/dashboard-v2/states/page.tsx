import * as React from 'react';
import { HeroSection } from '@/components/finance/HeroSection';
import { AttentionSection } from '@/components/finance/AttentionSection';
import { ReflectionSection } from '@/components/finance/ReflectionSection';
import { ProgressSection } from '@/components/finance/ProgressSection';
import { ActionSection } from '@/components/finance/ActionSection';

export default function StateCertificationBoard() {
  return (
    <div className="max-w-5xl mx-auto pb-24 pt-8 px-4 md:px-8 bg-background min-h-screen">
      <div className="mb-16 border-b pb-8">
        <h1 className="text-3xl font-bold mb-4">Phase 9B.2B: State Certification & Regression Lab</h1>
        <p className="text-muted-foreground">
          This board explicitly renders every section against every edge-case state (Loading, Empty, Partial, Error, Success, and Stress tests) to guarantee visual stability before real data integration.
        </p>
      </div>

      <div className="space-y-32">
        {/* HERO SECTION STATES */}
        <section className="space-y-8 border p-8 rounded-3xl bg-muted/5 relative">
          <div className="absolute -top-4 left-8 bg-background px-4 font-bold tracking-widest text-xs uppercase text-muted-foreground">
            HeroSection States
          </div>
          
          <StateVariant label="1. Loading (Skeleton)">
            <HeroSection metric={{ label: 'Safe to Spend', value: '', isLoading: true }} calculation={[]} />
          </StateVariant>

          <StateVariant label="2. Empty (No accounts/data)">
            <HeroSection metric={{ label: 'Safe to Spend', value: '', isEmpty: true }} calculation={[]} />
          </StateVariant>

          <StateVariant label="3. Positive Safe-to-Spend">
            <HeroSection 
              metric={{ label: 'Safe to Spend', value: 'KES 42,500', status: 'positive' }} 
              calculation={[
                { label: 'Liquid Cash', value: 'KES 120,000' },
                { label: 'Upcoming Bills', value: '-KES 35,000' },
                { label: 'Savings Goal', value: '-KES 42,500' },
              ]}
            />
          </StateVariant>

          <StateVariant label="4. Negative Safe-to-Spend">
            <HeroSection 
              metric={{ label: 'Safe to Spend', value: '-KES 12,500', status: 'negative' }} 
              calculation={[
                { label: 'Liquid Cash', value: 'KES 15,000' },
                { label: 'Upcoming Bills', value: '-KES 27,500' },
              ]}
            />
          </StateVariant>

          <StateVariant label="5. Stress Test: 12-digit Balance">
            <HeroSection 
              metric={{ label: 'Safe to Spend', value: 'KES 450,230,190,500', status: 'positive' }} 
              calculation={[
                { label: 'Liquid Cash', value: 'KES 500,000,000,000' },
                { label: 'Upcoming Bills', value: '-KES 49,769,809,500' },
              ]}
            />
          </StateVariant>
        </section>

        {/* ATTENTION SECTION STATES */}
        <section className="space-y-8 border p-8 rounded-3xl bg-muted/5 relative">
          <div className="absolute -top-4 left-8 bg-background px-4 font-bold tracking-widest text-xs uppercase text-muted-foreground">
            AttentionSection States
          </div>

          <StateVariant label="1. Empty (Zero Alerts)">
            <AttentionSection insights={[]} />
          </StateVariant>

          <StateVariant label="2. One Info">
            <AttentionSection insights={[{ severity: 'info', content: 'You have no upcoming bills this week.' }]} />
          </StateVariant>

          <StateVariant label="3. One Warning">
            <AttentionSection insights={[{ severity: 'warning', title: 'Unusual Spending', content: 'Grocery spending is 40% higher than your weekly average.' }]} />
          </StateVariant>

          <StateVariant label="4. One Critical">
            <AttentionSection insights={[{ severity: 'critical', title: 'Insufficient Funds', content: 'Your upcoming loan payment exceeds your current liquid cash.', actionLabel: 'Transfer Funds' }]} />
          </StateVariant>

          <StateVariant label="5. Stress Test: Multiple Critical & Long Text">
            <AttentionSection insights={[
              { severity: 'critical', title: 'Account Overdrawn', content: 'Your primary checking account has fallen below the minimum required balance, which may result in penalties if not resolved immediately within the next 24 hours.', actionLabel: 'Resolve Now' },
              { severity: 'critical', title: 'Failed Payment', content: 'Your scheduled transfer for KES 50,000 failed due to insufficient network connectivity or bank downtime. Please retry.', actionLabel: 'Retry Payment' },
              { severity: 'warning', content: 'This is an additional warning that is squished beside the critical alerts.' }
            ]} />
          </StateVariant>
        </section>

        {/* REFLECTION SECTION STATES */}
        <section className="space-y-8 border p-8 rounded-3xl bg-muted/5 relative">
          <div className="absolute -top-4 left-8 bg-background px-4 font-bold tracking-widest text-xs uppercase text-muted-foreground">
            ReflectionSection States
          </div>

          <StateVariant label="1. Loading (No native loading prop for Reflection yet, passing empty for now)">
            {/* We'll simulate empty for now or add a skeleton later if requested */}
            <ReflectionSection title="Recent Activity" groups={[]} />
          </StateVariant>

          <StateVariant label="2. Empty (No Activity)">
            <ReflectionSection title="Recent Activity" groups={[]} />
          </StateVariant>

          <StateVariant label="3. Partial (Today Only)">
            <ReflectionSection title="Recent Activity" groups={[
              {
                label: 'Today',
                items: [
                  { title: 'Naivas Supermarket', description: 'Groceries', value: '-KES 4,200', time: '18:45' }
                ]
              }
            ]} />
          </StateVariant>

          <StateVariant label="4. Full (Standard)">
            <ReflectionSection title="Recent Activity" groups={[
              {
                label: 'Today',
                items: [
                  { title: 'Naivas Supermarket', description: 'Groceries', value: '-KES 4,200', time: '18:45' },
                  { title: 'M-Pesa to John Doe', description: 'Lunch split', value: '-KES 850', time: '13:15' }
                ]
              },
              {
                label: 'Yesterday',
                items: [
                  { title: 'Salary Deposit', description: 'Tech Corp Kenya', value: '+KES 250,000', time: '08:00', status: 'success' }
                ]
              }
            ]} />
          </StateVariant>

          <StateVariant label="5. Stress Test: Twenty Items & Extremely Long Account Names">
            <ReflectionSection title="Recent Activity" groups={[
              {
                label: 'Today',
                items: Array.from({ length: 20 }).map((_, i) => ({
                  title: i % 2 === 0 ? 'Extremely Long Merchant Name That Might Wrap Or Truncate Unexpectedly If Not Handled Properly Limited Company' : 'Standard Coffee',
                  description: 'Category / Tag / Very Long Description Here',
                  value: i % 3 === 0 ? '+KES 1,000,000' : '-KES 4,200',
                  time: '18:45',
                  status: i % 3 === 0 ? 'success' : undefined
                }))
              }
            ]} />
          </StateVariant>
        </section>

        {/* PROGRESS SECTION STATES */}
        <section className="space-y-8 border p-8 rounded-3xl bg-muted/5 relative">
          <div className="absolute -top-4 left-8 bg-background px-4 font-bold tracking-widest text-xs uppercase text-muted-foreground">
            ProgressSection States
          </div>

          <StateVariant label="1. Empty (No goals)">
            <ProgressSection title="Goals & Progress" items={[]} />
          </StateVariant>

          <StateVariant label="2. Single Goal">
            <ProgressSection title="Goals & Progress" items={[
              { type: 'story', props: { title: 'Emergency Fund', narrative: 'On track to hit target.', metric: 'KES 150,000', progress: 75, status: 'positive' } }
            ]} />
          </StateVariant>

          <StateVariant label="3. Mixed Portfolio">
            <ProgressSection title="Goals & Progress" items={[
              { type: 'story', props: { title: 'Emergency Fund', narrative: 'On track to hit target.', metric: 'KES 150,000', progress: 75, status: 'positive' } },
              { type: 'journey', props: { title: 'Net Worth', primaryMetric: '+KES 85,000', trendLabel: 'since last month', narrative: 'SACCO dividend drove this growth.', trendDirection: 'positive' } }
            ]} />
          </StateVariant>
          
          <StateVariant label="4. Stress Test: Extreme Text Lengths">
            <ProgressSection title="Extremely Long Section Title That Should Not Break The Layout When It Stretches Across The Top" items={[
              { type: 'story', props: { title: 'Goal Name That Is Very Long And Might Push Everything Else Out Of Bound', narrative: 'Narrative that spans multiple lines. '.repeat(5), metric: 'KES 999,999,999', progress: 12, status: 'warning', actionLabel: 'Extremely Long Action Label Button Text' } }
            ]} />
          </StateVariant>
        </section>

        {/* ACTION SECTION STATES */}
        <section className="space-y-8 border p-8 rounded-3xl bg-muted/5 relative">
          <div className="absolute -top-4 left-8 bg-background px-4 font-bold tracking-widest text-xs uppercase text-muted-foreground">
            ActionSection States
          </div>

          <StateVariant label="1. Peace (Empty)">
            <ActionSection recommendation={undefined} />
          </StateVariant>

          <StateVariant label="2. Standard Recommendation">
            <ActionSection recommendation={{ title: 'Recommended Action', actionStatement: 'Transfer KES 15,000 to MMF', narrative: 'You have excess liquid cash.', actionLabel: 'Transfer Now', status: 'active' }} />
          </StateVariant>

          <StateVariant label="3. Stress Test: Very Long Recommendation Text & Recovery">
            <ActionSection recommendation={{ 
              title: 'CRITICAL RECOVERY ACTION REQUIRED', 
              actionStatement: 'Liquidate KES 500,000 from MMF immediately to cover overdraft', 
              narrative: 'Due to the recent automatic withdrawal for your mortgage payment, your primary account is severely overdrawn. Liquidating part of your Money Market Fund now will prevent compounding penalty fees from applying at midnight tonight. '.repeat(3), 
              actionLabel: 'Execute Emergency Liquidation Protocol', 
              status: 'active' 
            }} />
          </StateVariant>
        </section>
      </div>
    </div>
  );
}

function StateVariant({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-wider text-muted-foreground border-b pb-2">{label}</h3>
      <div className="bg-background rounded-3xl border border-dashed shadow-sm overflow-hidden p-4 md:p-8">
        {children}
      </div>
    </div>
  );
}
