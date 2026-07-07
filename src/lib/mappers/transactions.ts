import type { Transaction, Category } from '@prisma/client';
import { toMoneyDTO, toDateDTO } from './core';

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
  
  // Normalization Metadata (Presentation/AI layers)
  normalizedMerchantName?: string;
  merchantConfidence?: number;
  categoryConfidence?: number;
  isVerified?: boolean;
};

export function mapTransactionToDTO(
  transaction: Transaction & { category?: Category | null },
  metadataOrIndex?: {
    normalizedMerchantName?: string;
    merchantConfidence?: number;
    categoryConfidence?: number;
    isVerified?: boolean;
  } | number
): TransactionDTO {
  const metadata = typeof metadataOrIndex === 'number' ? undefined : metadataOrIndex;
  return {
    id: transaction.id,
    date: toDateDTO(transaction.date) as string,
    baseAmountMinor: toMoneyDTO(transaction.baseAmountMinor),
    currency: transaction.currency,
    type: transaction.type,
    name: transaction.name,
    note: transaction.note,
    categoryId: transaction.categoryId,
    accountId: transaction.accountId,
    userId: transaction.userId,
    importedAt: toDateDTO(transaction.importedAt),
    importHash: transaction.importHash,
    reference: transaction.reference,
    createdAt: toDateDTO(transaction.createdAt) as string,
    category: transaction.category,
    
    normalizedMerchantName: metadata?.normalizedMerchantName,
    merchantConfidence: metadata?.merchantConfidence,
    categoryConfidence: metadata?.categoryConfidence,
    isVerified: metadata?.isVerified,
  };
}
