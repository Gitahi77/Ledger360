import { Money } from '../money/Money';

export class BalanceCalculator {
  /**
   * Computes the final balance of an account.
   * All inputs must be of the same Currency.
   */
  static compute(
    openingBalance: Money,
    totalIncome: Money,
    totalExpense: Money,
    totalTransfersIn: Money,
    totalTransfersOut: Money
  ): Money {
    return openingBalance
      .add(totalIncome)
      .subtract(totalExpense)
      .add(totalTransfersIn)
      .subtract(totalTransfersOut);
  }
}
