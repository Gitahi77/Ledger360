import type { Transfer, Account, Goal, Loan } from '@prisma/client';
import { serializeMoney, serializeDate } from './core';

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
    amountMinor: serializeMoney(transfer.amountMinor),
    currency: transfer.currency,
    baseAmountMinor: serializeMoney(transfer.baseAmountMinor),
    fxRate: Number(transfer.fxRate),
    date: serializeDate(transfer.date) as string,
    note: transfer.note,
    source: transfer.source,
    goalId: transfer.goalId,
    sourceTransactionId: transfer.sourceTransactionId,
    loanId: transfer.loanId,
    interestMinor: serializeMoney(transfer.interestMinor),
    createdAt: serializeDate(transfer.createdAt) as string,
    fromAccount: transfer.fromAccount,
    toAccount: transfer.toAccount,
  };
}
