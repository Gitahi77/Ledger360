import { FinancialSnapshot } from '@/lib/domain/snapshot';
import { Recommendation } from '../contracts';

/**
 * The Recommendation Engine.
 * Responsible for analyzing the financial snapshot and generating a list of candidate actions.
 * It does NOT decide which action the user should take—that is the DecisionEngine's job.
 */
export class RecommendationEngine {
  static generateCandidates(snapshot: FinancialSnapshot): Recommendation[] {
    const candidates: Recommendation[] = [];

    // 1. Check Cash Buffer (Safe to Spend)
    const income = Number(snapshot.metrics.monthlyIncome);
    const expenses = Number(snapshot.metrics.monthlyExpenses);
    const surplus = income - expenses;

    if (surplus > 0 && Number(snapshot.metrics.safeToSpend) > 1000000) {
      // Over 10,000 KES safe to spend
      candidates.push({
        type: 'RECOMMENDATION',
        actionTitle: 'Transfer to Money Market Fund',
        expectedBenefit: `Earn ~KSh ${Math.floor((surplus * 0.1) / 100)} this month`, // rough 10% APY / 12
        timeRequired: '1 minute',
        confidence: 90,
        reason: 'Your checking account holds more cash than required for your monthly expenses.',
        assumptions: ['10% average MMF yield', 'No upcoming emergency expenses'],
        sources: ['Snapshot.metrics.safeToSpend', 'Snapshot.metrics.monthlyIncome'],
        impactScore: 80,
        urgencyScore: 40,
        effortScore: 10, // low effort
      });
    }

    if (surplus < 0) {
      candidates.push({
        type: 'RECOMMENDATION',
        actionTitle: 'Pause a Subscription',
        expectedBenefit: 'Reduce fixed monthly outflow',
        timeRequired: '3 minutes',
        confidence: 85,
        reason: "We're spending faster than planned this month, and you have active subscriptions.",
        assumptions: ['Some subscriptions are non-essential'],
        sources: ['Snapshot.metrics.monthlyExpenses'],
        impactScore: 70,
        urgencyScore: 85,
        effortScore: 40,
      });
    }

    // 2. Check Loans
    // Assuming snapshot.metrics.totalLiabilities represents active debt
    if (Number(snapshot.metrics.totalLiabilities) > 0 && surplus > 500000) {
      candidates.push({
        type: 'RECOMMENDATION',
        actionTitle: 'Make an extra loan payment',
        expectedBenefit: 'Save interest & buy back your freedom sooner',
        timeRequired: '2 minutes',
        confidence: 95,
        reason: 'You have a healthy cash surplus that could accelerate your debt payoff.',
        assumptions: ['Loan allows early repayment without penalty'],
        sources: ['Snapshot.metrics.totalLiabilities'],
        impactScore: 90,
        urgencyScore: 50,
        effortScore: 20,
      });
    }

    return candidates;
  }
}
