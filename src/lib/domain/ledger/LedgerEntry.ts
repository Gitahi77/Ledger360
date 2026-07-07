import { Money } from '../money/Money';

export type LedgerEntryType = 'CREDIT' | 'DEBIT';
export type LedgerEntrySource = 'TRANSACTION' | 'TRANSFER' | 'LOAN_PAYMENT' | 'ADJUSTMENT';

/**
 * A LedgerEntry is the fundamental, immutable record of financial movement within an account.
 * Every financial operation (income, expense, transfer) resolves to one or more LedgerEntries.
 */
export interface LedgerEntry {
  id: string; // Typically prefixed with the source type, e.g., 'tx_123' or 'trf_456_out'
  accountId: string;
  amount: Money;
  type: LedgerEntryType;
  source: LedgerEntrySource;
  sourceId: string; // The ID of the original record (Transaction, Transfer)
  timestamp: Date;
  metadata: {
    merchant?: string;
    normalizedMerchant?: string;
    categoryId?: string;
    confidence?: number;
    notes?: string;
  };
}
