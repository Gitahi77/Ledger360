import { FinancialSnapshot } from '@/lib/domain/snapshot';
import { RecommendationEngine } from '../engines/recommendation';
import { NarrativeEngine } from '../engines/narrative';
import { MemoryEngine } from '../engines/memory';
import { DecisionEngine } from '../engines/decision';
import { Decision, Memory, Narrative } from '../contracts';

/**
 * The Capability Registry.
 * Provides a unified facade for the UI to consume Intelligence Capabilities,
 * ensuring engines remain decoupled from presentation.
 */
export class CapabilityRegistry {
  /**
   * Retrieves the current high-level financial decision the user should focus on.
   */
  static getDecision(snapshot: FinancialSnapshot): Decision | null {
    const candidates = RecommendationEngine.generateCandidates(snapshot);
    return DecisionEngine.selectBestAction(candidates);
  }

  /**
   * Retrieves the current financial narrative.
   */
  static getNarrative(snapshot: FinancialSnapshot): Narrative {
    return NarrativeEngine.generateBrief(snapshot);
  }

  /**
   * Retrieves relevant historical memory context.
   */
  static getContextMemory(): Memory | null {
    return MemoryEngine.getRecentContext();
  }
}
