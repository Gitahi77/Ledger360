import type { Transfer, Account } from '@prisma/client';
import { toMoneyDTO, toDateDTO } from './core';

export type TransferDTO = {
  id: string;
  userId: string;
  fromAccountId: string | null;
  toAccountId: string | null;
  amountMinor: number;
  currency: string;
  baseAmountMinor: number;
  fxRate: number;
  date: string;
  note: string | null;
  source: string;
  goalId: string | null;
  sourceTransactionId: string | null;
  loanId: string | null;
  interestMinor: number;
  createdAt: string;
  fromAccount?: { name: string; currency: string } | null;
  toAccount?: { name: string; currency: string } | null;
};

export type TransferResultDTO = {
  status: 'completed' | 'rejected' | 'pending';
  transferId?: string;
  amountMinor?: number;
  feeMinor?: number;
  interestMinor?: number;
  referenceNumber?: string;
  updatedSourceBalanceMinor?: number;
  updatedDestinationBalanceMinor?: number;
  remainingLoanBalanceMinor?: number;
};


export function mapTransferToDTO(
  transfer: Transfer & { 
    fromAccount?: Pick<Account, 'name' | 'currency'> | null,
    toAccount?: Pick<Account, 'name' | 'currency'> | null
  }
): TransferDTO {
  return {
    id: transfer.id,
    userId: transfer.userId,
    fromAccountId: transfer.fromAccountId,
    toAccountId: transfer.toAccountId,
    amountMinor: toMoneyDTO(transfer.amountMinor),
    currency: transfer.currency,
    baseAmountMinor: toMoneyDTO(transfer.baseAmountMinor),
    fxRate: Number(transfer.fxRate),
    date: toDateDTO(transfer.date) as string,
    note: transfer.note,
    source: transfer.source,
    goalId: transfer.goalId,
    sourceTransactionId: transfer.sourceTransactionId,
    loanId: transfer.loanId,
    interestMinor: toMoneyDTO(transfer.interestMinor),
    createdAt: toDateDTO(transfer.createdAt) as string,
    fromAccount: transfer.fromAccount,
    toAccount: transfer.toAccount,
  };
}
