import { FinancialSnapshot } from '@/lib/domain/snapshot';
import { CapabilityRegistry } from './capability';
import { Decision, Memory, Narrative } from '../contracts';

export interface MorningBrief {
  narrative: Narrative;
  decision: Decision | null;
  memory: Memory | null;
}

/**
 * The Experience Registry.
 * Composes individual capabilities (Narrative, Memory, Decision) into
 * cohesive, named experiences that UI components can render.
 * 
 * Experiences outlive pages. A MorningBrief can be rendered on the Dashboard,
 * in a mobile widget, or pushed via email.
 */
export class ExperienceRegistry {
  /**
   * Generates the Morning Brief:
   * "Am I okay right now, and what do I need to pay attention to?"
   */
  static getMorningBrief(snapshot: FinancialSnapshot): MorningBrief {
    return {
      narrative: CapabilityRegistry.getNarrative(snapshot),
      decision: CapabilityRegistry.getDecision(snapshot),
      memory: CapabilityRegistry.getContextMemory(),
    };
  }

  /**
   * Future Expansion: getSalaryDayExperience()
   * Future Expansion: getOverspendingExperience()
   */
}
