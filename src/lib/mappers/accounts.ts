import type { AccountType, ChamaDetails, MoneyDTO } from '../types/domain';
import { toMoneyDTO, toDateDTO } from './core';

export type AccountDTO = {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  openingMoney: MoneyDTO;
  archived: boolean;
  allowNegativeBalance: boolean;
  createdAt: string;
  chamaDetails?: ChamaDetails | null;
  balanceMoney: MoneyDTO;
  displayBalance: string;
  isOverdrawn: boolean;
  availableBalanceMoney: MoneyDTO;
};

export function mapAccountToDTO(
  account: import('../domain/services/BalanceService').EnrichedAccountData
): AccountDTO {
  return {
    id: account.id,
    userId: account.userId,
    name: account.name,
    type: account.type,
    openingMoney: { amountMinor: toMoneyDTO(account.openingMinor), currency: account.currency },
    archived: account.archived,
    allowNegativeBalance: account.allowNegativeBalance,
    createdAt: toDateDTO(account.createdAt) as string,
    chamaDetails: account.chamaDetails,
    balanceMoney: { amountMinor: toMoneyDTO(account.balanceMinor), currency: account.currency },
    displayBalance: account.displayBalance,
    isOverdrawn: account.isOverdrawn,
    availableBalanceMoney: { amountMinor: toMoneyDTO(account.availableBalanceMinor), currency: account.currency },
  };
}

