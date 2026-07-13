import { AccountType } from '@prisma/client';
import type { ChamaDetails } from '@prisma/client';
import { toMoneyDTO, toDateDTO } from './core';

export type AccountDTO = {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: string;
  openingMinor: number;
  archived: boolean;
  allowNegativeBalance: boolean;
  createdAt: string;
  chamaDetails?: ChamaDetails | null;
  balanceMinor: number;
  displayBalance: string;
  isOverdrawn: boolean;
  availableBalanceMinor: number;
};

export function mapAccountToDTO(
  account: import('../domain/services/BalanceService').EnrichedAccountData
): AccountDTO {
  return {
    id: account.id,
    userId: account.userId,
    name: account.name,
    type: account.type,
    currency: account.currency,
    openingMinor: toMoneyDTO(account.openingMinor),
    archived: account.archived,
    allowNegativeBalance: account.allowNegativeBalance,
    createdAt: toDateDTO(account.createdAt) as string,
    chamaDetails: account.chamaDetails,
    balanceMinor: toMoneyDTO(account.balanceMinor),
    displayBalance: account.displayBalance,
    isOverdrawn: account.isOverdrawn,
    availableBalanceMinor: toMoneyDTO(account.availableBalanceMinor),
  };
}
