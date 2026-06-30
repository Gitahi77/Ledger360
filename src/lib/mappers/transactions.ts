import type { Transaction, Category } from '@prisma/client';
import { serializeMoney, serializeDate } from './core';

export type TransactionDTO = {
  id: string;
  date: string;
  baseAmountMinor: number;
  currency: string;
  type: string;
  name: string;
  note: string | null;
  categoryId: string;
  accountId: string;
  userId: string;
  importedAt: string | null;
  importHash: string | null;
  reference: string | null;
  createdAt: string;
  category?: Category | null;
};

export function mapTransactionToDTO(
  transaction: Transaction & { category?: Category | null }
): TransactionDTO {
  return {
    id: transaction.id,
    date: serializeDate(transaction.date) as string,
    baseAmountMinor: serializeMoney(transaction.baseAmountMinor),
    currency: transaction.currency,
    type: transaction.type,
    name: transaction.name,
    note: transaction.note,
    categoryId: transaction.categoryId,
    accountId: transaction.accountId,
    userId: transaction.userId,
    importedAt: serializeDate(transaction.importedAt),
    importHash: transaction.importHash,
    reference: transaction.reference,
    createdAt: serializeDate(transaction.createdAt) as string,
    category: transaction.category,
  };
}
