/**
 * The Intelligence Priority Constants.
 * These priorities determine the ordering of observations and insights across the entire OS,
 * ensuring the Advisor Engine always elevates the most critical issues to the user.
 */
export const PRIORITY = {
  CASH_FLOW_RISK: 100,
  BUDGET_BREACH: 90,
  LARGE_OUTLIER: 80,
  INCOME_INSTABILITY: 70,
  RECURRING_INCREASE: 60,
  CATEGORY_CONCENTRATION: 50,
  POSITIVE_BEHAVIOUR: 40,
  GENERAL_OBSERVATION: 30,
} as const;

export type IntelligencePriority = typeof PRIORITY[keyof typeof PRIORITY];

/**
 * Assigns a predefined priority level to an observation or insight based on its type and context.
 */
export function assignPriority(type: string): IntelligencePriority {
  switch (type) {
    case 'cash_flow_risk':
    case 'acceleration': // If negative cash flow
      return PRIORITY.CASH_FLOW_RISK;
    case 'budget_breach':
      return PRIORITY.BUDGET_BREACH;
    case 'outlier':
    case 'anomaly':
      return PRIORITY.LARGE_OUTLIER;
    case 'income_instability':
      return PRIORITY.INCOME_INSTABILITY;
    case 'reliance':
      return PRIORITY.RECURRING_INCREASE;
    case 'concentration':
      return PRIORITY.CATEGORY_CONCENTRATION;
    case 'stability':
    case 'savings_deposit':
      return PRIORITY.POSITIVE_BEHAVIOUR;
    default:
      return PRIORITY.GENERAL_OBSERVATION;
  }
}
