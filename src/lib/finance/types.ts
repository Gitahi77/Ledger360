export type CurrencyCode = string;

export interface Money {
  amountMinor: bigint | number;
  currency: CurrencyCode;
}

export type FinancialTone = 'positive' | 'negative' | 'neutral' | 'warning' | 'pending';

export type FinancialStatus = 'Pending' | 'Cleared' | 'Failed' | 'Scheduled';

export type FinancialDirection = 'Income' | 'Expense' | 'Transfer';
