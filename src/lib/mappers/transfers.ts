import type { MoneyDTO } from '../types/domain';
import { toMoneyDTO, toDateDTO } from './core';

export type TransferDTO = {
  id: string;
  userId: string;
  fromAccountId: string | null;
  toAccountId: string | null;
  money: MoneyDTO;
  baseMoney: MoneyDTO;
  fxRate: number;
  date: string;
  note: string | null;
  source: string;
  goalId: string | null;
  sourceTransactionId: string | null;
  loanId: string | null;
  interestMoney: MoneyDTO;
  createdAt: string;
  fromAccount?: { name: string; currency: string } | null;
  toAccount?: { name: string; currency: string } | null;
};

export type TransferResultDTO = {
  status: 'completed' | 'rejected' | 'pending';
  transferId?: string;
  amountMoney?: MoneyDTO;
  feeMoney?: MoneyDTO;
  interestMoney?: MoneyDTO;
  referenceNumber?: string;
  updatedSourceBalanceMoney?: MoneyDTO;
  updatedDestinationBalanceMoney?: MoneyDTO;
  remainingLoanBalanceMoney?: MoneyDTO;
};

export function mapTransferToDTO(
  transfer: {
    id: string; userId: string; fromAccountId: string | null; toAccountId: string | null;
    amountMinor: number | bigint; currency: string; baseAmountMinor: number | bigint; fxRate: any;
    date: Date; note: string | null; source: string; goalId: string | null;
    sourceTransactionId: string | null; loanId: string | null; interestMinor: number | bigint;
    createdAt: Date;
    fromAccount?: { name: string; currency: string } | null;
    toAccount?: { name: string; currency: string } | null;
  }
): TransferDTO {
  return {
    id: transfer.id,
    userId: transfer.userId,
    fromAccountId: transfer.fromAccountId,
    toAccountId: transfer.toAccountId,
    money: { amountMinor: toMoneyDTO(transfer.amountMinor), currency: transfer.currency },
    baseMoney: { amountMinor: toMoneyDTO(transfer.baseAmountMinor), currency: transfer.currency }, // Note: base currency usually KES, but storing it helps
    fxRate: Number(transfer.fxRate),
    date: toDateDTO(transfer.date) as string,
    note: transfer.note,
    source: transfer.source,
    goalId: transfer.goalId,
    sourceTransactionId: transfer.sourceTransactionId,
    loanId: transfer.loanId,
    interestMoney: { amountMinor: toMoneyDTO(transfer.interestMinor), currency: transfer.currency },
    createdAt: toDateDTO(transfer.createdAt) as string,
    fromAccount: transfer.fromAccount,
    toAccount: transfer.toAccount,
  };
}
