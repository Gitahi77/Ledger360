import * as React from 'react';
import { HeroSection } from '@/components/finance/HeroSection';
import { AttentionSection } from '@/components/finance/AttentionSection';
import { ReflectionSection } from '@/components/finance/ReflectionSection';
import { ProgressSection } from '@/components/finance/ProgressSection';
import { ActionSection } from '@/components/finance/ActionSection';
import { buildDashboardPresentation } from './presentation';
import { buildFinancialSnapshot } from '@/lib/domain/snapshot';
import { requireAuth } from '@/lib/actions/_auth';
import { ExperienceRegistry } from '@/lib/os/registry/experience';
import { MorningBriefExperience } from '@/components/finance/os/MorningBriefExperience';

export default async function DashboardV2Page() {
  const user = await requireAuth();
  
  // 1. Generate the snapshot (the only database boundary)
  const snapshot = await buildFinancialSnapshot(user.id);
  
  // 2. Build OS Intelligence Experiences
  const morningBrief = ExperienceRegistry.getMorningBrief(snapshot);

  // 3. Build the pure presentation logic for legacy components
  const presentationStart = Date.now();
  const presentation = buildDashboardPresentation(snapshot);
  const presentationTimeMs = Date.now() - presentationStart;
  
  if (process.env['NODE_ENV'] !== 'production') {
    console.info({
      snapshotVersion: snapshot.metadata.version,
      generationTimeMs: snapshot.metadata.generationTimeMs,
      presentationTimeMs,
      queryCount: snapshot.metadata.queryCount,
      alertsGenerated: snapshot.alerts.length,
    });
  }
  
  // 4. Render OS Core UI + certified primitives
  return (
    <div className="max-w-5xl mx-auto space-y-16 md:space-y-24 pb-24 pt-8 px-4 md:px-8">
      {/* The OS Morning Brief */}
      <MorningBriefExperience brief={morningBrief} />

      <div className="border-t border-border pt-16 mt-16 space-y-16 md:space-y-24">
        {/* The Legacy Components serving as Showcase */}
        <HeroSection {...presentation.hero} />
        <AttentionSection {...presentation.attention} />
        <ReflectionSection {...presentation.reflection} />
        <ProgressSection {...presentation.progress} />
        <ActionSection {...presentation.action} />
      </div>
    </div>
  );
}
