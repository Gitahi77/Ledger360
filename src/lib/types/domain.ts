// src/lib/types/domain.ts
// Shared domain vocabulary to act as the single source of truth for the DTO and Domain layers.
import type { 
  AccountType as PrismaAccountType, 
  ChamaDetails as PrismaChamaDetails
} from '@prisma/client';

export type AccountType = PrismaAccountType;
export type ChamaDetails = PrismaChamaDetails;

export type TransactionType = 'income' | 'expense' | 'transfer' | 'savings';
export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';

export type MoneyDTO = {
  amountMinor: number;
  currency: string;
};
