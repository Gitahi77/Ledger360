import { FinancialTone } from './types';

/**
 * Determines the financial tone based on the value amount.
 * Useful for mapping numbers to a semantic state (positive, negative, neutral) 
 * without entangling UI/Tailwind logic.
 */
export function getToneFromAmount(amountMinor: bigint | number): FinancialTone {
  const amount = Number(amountMinor);
  if (amount > 0) return 'positive';
  if (amount < 0) return 'negative';
  return 'neutral';
}
