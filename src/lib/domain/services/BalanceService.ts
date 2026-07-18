import { AccountType } from '@prisma/client';
import { getAccountsByUserId } from '../../repositories/accounts';
import { getTransactionSumsByAccount } from '../../repositories/transactions';
import { getTransferSumsByAccount } from '../../repositories/transfers';
import { AccountAggregator } from '../calculators/AccountAggregator';
import { MoneyFormatter } from '../money/MoneyFormatter';
import { Money } from '../money/Money';

export type EnrichedAccountData = {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  openingMinor: number;
  archived: boolean;
  allowNegativeBalance: boolean;
  createdAt: Date;
  chamaDetails?: import('@prisma/client').ChamaDetails | null;
  
  // Computed domain fields
  balanceMinor: number;
  displayBalance: string;
  isOverdrawn: boolean;
  availableBalanceMinor: number;
};

export class BalanceService {
  /**
   * Fetches the ledger state and orchestrates the aggregation of balances for all accounts.
   */
  static async getEnrichedAccounts(userId: string): Promise<EnrichedAccountData[]> {
    // 1. Fetch persistence data
    const accounts = await getAccountsByUserId(userId);
    if (accounts.length === 0) return [];

    // 2. Orchestrate calculations (O(1) from DB directly)
    return accounts.map(acc => {
      const summary = {
        accountId: acc.id,
        currency: acc.currency,
        openingMinor: Number(acc.openingMinor),
        totalIncomeMinor: 0,
        totalExpenseMinor: 0,
        totalTransfersInMinor: 0,
        totalTransfersOutMinor: 0,
      };

      const balanceMoney = Money.fromMinor(Number(acc.balanceMinor), acc.currency);

      // 3. Prepare enrichment fields
      return {
        ...acc,
        openingMinor: Number(acc.openingMinor),
        balanceMinor: Number(acc.balanceMinor),
        displayBalance: MoneyFormatter.format(balanceMoney),
        isOverdrawn: acc.balanceMinor < 0n,
        availableBalanceMinor: Number(acc.balanceMinor), // could subtract holds/reserves here in the future
      };
    });
  }
}
