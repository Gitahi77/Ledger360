import { AccountType } from '@prisma/client';
import { getAccountsByUserId, getAccountById } from '../../repositories/accounts';
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
  updatedAt: Date;
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
      
      const balanceMoney = Money.fromMinor(Number(acc.balanceMinor), acc.currency);

      // 3. Prepare enrichment fields
      return {
        ...acc,
        openingMinor: Number(acc.openingMinor),
        balanceMinor: Number(acc.balanceMinor),
        displayBalance: MoneyFormatter.format(balanceMoney),
        isOverdrawn: acc.balanceMinor < 0n,
        availableBalanceMinor: Number(acc.balanceMinor), // could subtract holds/reserves here in the future
        updatedAt: acc.updatedAt,
      };
    });
  }

  static async getSingleAccountBalance(userId: string, accountId: string): Promise<EnrichedAccountData | null> {
    const acc = await getAccountById(accountId, userId);
    
    if (!acc) return null;

    const balanceMoney = Money.fromMinor(Number(acc.balanceMinor), acc.currency);

    return {
      ...acc,
      openingMinor: Number(acc.openingMinor),
      balanceMinor: Number(acc.balanceMinor),
      displayBalance: MoneyFormatter.format(balanceMoney),
      isOverdrawn: acc.balanceMinor < 0n,
      availableBalanceMinor: Number(acc.balanceMinor),
      updatedAt: acc.updatedAt,
    };
  }

}
