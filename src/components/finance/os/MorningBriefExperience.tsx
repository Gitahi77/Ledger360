import React from 'react';
import { MorningBrief } from '@/lib/os/registry/experience';
import { AdvisorNote } from './AdvisorNote';
import { DecisionCard } from './DecisionCard';
import { MomentumChip } from './MomentumChip';

interface MorningBriefExperienceProps {
  brief: MorningBrief | null;
  userName?: string;
}

/**
 * Morning Brief Experience
 * The user's first touchpoint of the day. Answers "Am I okay right now?"
 * Uses the Capability Contracts to render intelligence safely.
 */
export function MorningBriefExperience({ brief, userName = 'there' }: MorningBriefExperienceProps) {
  if (!brief) return null;

  return (
    <section className="space-y-6 max-w-4xl animate-in">
      {/* 1. Header / Greeting */}
      <div>
        <h1 className="text-3xl font-heading font-extrabold tracking-tight text-foreground">
          Good morning, {userName}.
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">
          Here is your financial briefing for today.
        </p>
      </div>

      {/* 2. Narrative Engine output */}
      <AdvisorNote narrative={brief.narrative} />

      {/* 3. Memory / Momentum Engine output (Quick facts) */}
      {brief.memory && (
        <div className="flex flex-wrap gap-3">
          <MomentumChip 
            label="Remember" 
            value={brief.memory.eventDescription} 
            trend="neutral"
          />
        </div>
      )}

      {/* 4. Decision Engine output (The one action to take) */}
      {brief.decision && (
        <div className="pt-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Today's Top Recommendation
          </h2>
          <DecisionCard 
            decision={brief.decision} 
            onAccept={() => console.log('Action accepted')}
            onReject={() => console.log('Action rejected')}
          />
        </div>
      )}
    </section>
  );
}
