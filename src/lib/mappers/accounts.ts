import type { Account, ChamaDetails } from '@prisma/client';
import { serializeMoney, serializeDate } from './core';

export type AccountDTO = {
  id: string;
  userId: string;
  name: string;
  type: string;
  currency: string;
  openingMinor: number;
  archived: boolean;
  createdAt: string;
  chamaDetails?: ChamaDetails | null;
  balanceMinor?: number; // Only present if enriched by getAccountBalances
};

export function mapAccountToDTO(
  account: Account & { chamaDetails?: ChamaDetails | null, balanceMinor?: bigint | number }
): AccountDTO {
  return {
    id: account.id,
    userId: account.userId,
    name: account.name,
    type: account.type,
    currency: account.currency,
    openingMinor: serializeMoney(account.openingMinor),
    archived: account.archived,
    createdAt: serializeDate(account.createdAt) as string,
    chamaDetails: account.chamaDetails,
    balanceMinor: account.balanceMinor !== undefined ? serializeMoney(account.balanceMinor) : undefined,
  };
}
