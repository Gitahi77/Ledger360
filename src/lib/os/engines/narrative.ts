import { FinancialSnapshot } from '@/lib/domain/snapshot';
import { Narrative } from '../contracts';

/**
 * The Narrative Engine.
 * Converts raw financial data into empathetic, human-readable strings.
 * It enforces the Product Personality: Never sound like a robot.
 */
export class NarrativeEngine {
  static generateBrief(snapshot: FinancialSnapshot): Narrative {
    const income = Number(snapshot.metrics.monthlyIncome);
    const expenses = Number(snapshot.metrics.monthlyExpenses);
    const surplus = income - expenses;

    // Default: Neutral
    let text = "Your finances are stable right now.";
    let tone: Narrative['tone'] = 'neutral';
    let confidence = 80;
    let reason = "Income and expenses are within expected ranges.";

    if (surplus > 0) {
      if (surplus > income * 0.3) {
        text = "You're building momentum this month.";
        tone = 'celebration';
        confidence = 90;
        reason = "Your savings rate is above 30%.";
      } else {
        text = "You're on track and holding steady.";
        tone = 'calm';
        confidence = 85;
        reason = "You have a positive cash flow.";
      }
    } else if (surplus < 0) {
      text = "Money is leaving a little faster than it's coming in.";
      tone = 'warning';
      confidence = 95;
      reason = "Your monthly expenses have exceeded your income.";
    }

    return {
      type: 'NARRATIVE',
      text,
      tone,
      confidence,
      reason,
      assumptions: ['Assuming all pending transactions clear'],
      sources: ['Snapshot.cashFlow.monthly'],
    };
  }

  static generateDebtNarrative(snapshot: FinancialSnapshot): Narrative | null {
    if (snapshot.metrics.totalLiabilities <= 0) return null;

    return {
      type: 'NARRATIVE',
      text: `You have KES ${Number(snapshot.metrics.totalLiabilities) / 100} of freedom left to buy back.`,
      tone: 'calm',
      confidence: 100,
      reason: "Reframing debt as future freedom.",
      assumptions: [],
      sources: ['Snapshot.metrics.totalLiabilities'],
    };
  }
}
