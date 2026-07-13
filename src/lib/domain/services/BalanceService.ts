import { AccountType } from '@prisma/client';
import { getAccountsByUserId } from '../../repositories/accounts';
import { getTransactionSumsByAccount } from '../../repositories/transactions';
import { getTransferSumsByAccount } from '../../repositories/transfers';
import { AccountAggregator } from '../calculators/AccountAggregator';
import { MoneyFormatter } from '../money/MoneyFormatter';

export type EnrichedAccountData = {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  openingMinor: number;
  archived: boolean;
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

    const { incomeSums, expenseSums } = await getTransactionSumsByAccount({ userId });
    const { transfersOut, transfersIn } = await getTransferSumsByAccount(userId);

    const incMap = new Map(incomeSums.map(g => [g.accountId, Number(g._sum?.baseAmountMinor ?? 0)]));
    const expMap = new Map(expenseSums.map(g => [g.accountId, Number(g._sum?.baseAmountMinor ?? 0)]));
    const txOutMap = new Map(transfersOut.map(g => [g.fromAccountId, Number(g._sum?.amountMinor ?? 0)]));
    const txInMap = new Map(transfersIn.map(g => [g.toAccountId, Number(g._sum?.baseAmountMinor ?? 0)]));

    // 2. Orchestrate calculations
    return accounts.map(acc => {
      const summary = {
        accountId: acc.id,
        currency: acc.currency,
        openingMinor: Number(acc.openingMinor),
        totalIncomeMinor: incMap.get(acc.id) ?? 0,
        totalExpenseMinor: expMap.get(acc.id) ?? 0,
        totalTransfersInMinor: txInMap.get(acc.id) ?? 0,
        totalTransfersOutMinor: txOutMap.get(acc.id) ?? 0,
      };

      const balanceMoney = AccountAggregator.aggregate(summary);

      // 3. Prepare enrichment fields
      return {
        ...acc,
        openingMinor: Number(acc.openingMinor),
        balanceMinor: balanceMoney.minorUnits,
        displayBalance: MoneyFormatter.format(balanceMoney),
        isOverdrawn: balanceMoney.isNegative(),
        availableBalanceMinor: balanceMoney.minorUnits, // could subtract holds/reserves here in the future
      };
    });
  }
}
