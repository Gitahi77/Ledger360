import { Decision, Recommendation } from '../contracts';

/**
 * The Decision Engine.
 * Responsible for taking a list of possible actions (from the Recommendation Engine)
 * and ruthlessly prioritizing them so the user is only presented with ONE optimal choice.
 * This eliminates decision fatigue.
 */
export class DecisionEngine {
  /**
   * Evaluates candidates and selects the single most valuable action.
   */
  static selectBestAction(candidates: Recommendation[]): Decision | null {
    if (candidates.length === 0) {
      return null;
    }

    // Sort candidates by a composite score
    // Weightings: Impact (40%), Urgency (30%), Confidence (20%), Effort (10% inverse)
    const scoredCandidates = candidates.map((candidate) => {
      const compositeScore =
        (candidate.impactScore * 0.4) +
        (candidate.urgencyScore * 0.3) +
        (candidate.confidence * 0.2) +
        ((100 - candidate.effortScore) * 0.1);

      return {
        candidate,
        compositeScore,
      };
    });

    scoredCandidates.sort((a, b) => b.compositeScore - a.compositeScore);

    const winningRecommendation = scoredCandidates[0].candidate;
    const rejectedAlternatives = scoredCandidates.slice(1).map(s => s.candidate);

    return {
      winningRecommendation,
      rejectedAlternatives,
    };
  }
}
