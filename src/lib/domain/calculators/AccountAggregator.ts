import { Money } from '../money/Money';
import { CurrencyCode } from '../money/Currency';
import { BalanceCalculator } from './BalanceCalculator';

export type AccountLedgerSummary = {
  accountId: string;
  currency: CurrencyCode;
  openingMinor: number;
  totalIncomeMinor: number;
  totalExpenseMinor: number;
  totalTransfersInMinor: number;
  totalTransfersOutMinor: number;
};

export class AccountAggregator {
  /**
   * Takes raw ledger summaries (from the repository) and computes the exact domain Money balance.
   */
  static aggregate(summary: AccountLedgerSummary): Money {
    const currency = summary.currency;
    
    const opening = Money.fromMinor(summary.openingMinor, currency);
    const income = Money.fromMinor(summary.totalIncomeMinor, currency);
    const expense = Money.fromMinor(summary.totalExpenseMinor, currency);
    const transfersIn = Money.fromMinor(summary.totalTransfersInMinor, currency);
    const transfersOut = Money.fromMinor(summary.totalTransfersOutMinor, currency);

    return BalanceCalculator.compute(opening, income, expense, transfersIn, transfersOut);
  }
}
