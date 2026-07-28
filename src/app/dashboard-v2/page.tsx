import * as React from 'react';
import { HeroSection } from '@/components/finance/HeroSection';
import { AttentionSection } from '@/components/finance/AttentionSection';
import { ReflectionSection } from '@/components/finance/ReflectionSection';
import { ProgressSection } from '@/components/finance/ProgressSection';
import { ActionSection } from '@/components/finance/ActionSection';
import { buildDashboardPresentation } from './presentation';
import { buildFinancialSnapshot } from '@/lib/domain/snapshot';
import { requireAuth } from '@/lib/actions/_auth';

export default async function DashboardV2Page() {
  const user = await requireAuth();
  
  // 1. Generate the snapshot (the only database boundary)
  const snapshot = await buildFinancialSnapshot(user.id);
  
  // 2. Build the pure presentation logic
  const presentation = buildDashboardPresentation(snapshot);
  
  // 3. Render certified primitives (UI Frozen)
  return (
    <div className="max-w-5xl mx-auto space-y-16 md:space-y-24 pb-24 pt-8 px-4 md:px-8">
      <HeroSection {...presentation.hero} />
      <AttentionSection {...presentation.attention} />
      <ReflectionSection {...presentation.reflection} />
      <ProgressSection {...presentation.progress} />
      <ActionSection {...presentation.action} />
    </div>
  );
}
