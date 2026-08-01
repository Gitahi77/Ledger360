import { toMoneyDTO, toDateDTO } from './core';
import type { MoneyDTO, TransactionType } from '../types/domain';
import { type CategoryDTO, mapCategoryToDTO } from './categories';

export type TransactionDTO = {
  id: string;
  date: string;
  baseMoney: MoneyDTO;
  type: TransactionType;
  name: string;
  note: string | null;
  categoryId: string;
  accountId: string;
  userId: string;
  status: 'ACTIVE' | 'VOIDED' | 'ARCHIVED';
  parentId: string | null;
  importedAt: string | null;
  importHash: string | null;
  reference: string | null;
  createdAt: string;
  category?: CategoryDTO | null;
  
  // Normalization Metadata (Presentation/AI layers)
  normalizedMerchantName?: string;
  merchantConfidence?: number;
  categoryConfidence?: number;
  isVerified?: boolean;
};

export function mapTransactionToDTO(
  transaction: {
    id: string; date: Date; baseAmountMinor: number | bigint; currency: string; type: string; name: string;
    note: string | null; categoryId: string; accountId: string; userId: string; status: string; parentId: string | null;
    importedAt: Date | null;
    importHash: string | null; reference: string | null; createdAt: Date;
    category?: unknown | null;
  },
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
    baseMoney: { amountMinor: toMoneyDTO(transaction.baseAmountMinor), currency: transaction.currency },
    type: transaction.type as TransactionType,
    name: transaction.name,
    note: transaction.note,
    categoryId: transaction.categoryId,
    accountId: transaction.accountId,
    userId: transaction.userId,
    status: transaction.status as 'ACTIVE' | 'VOIDED' | 'ARCHIVED',
    parentId: transaction.parentId,
    importedAt: toDateDTO(transaction.importedAt),
    importHash: transaction.importHash,
    reference: transaction.reference,
    createdAt: toDateDTO(transaction.createdAt) as string,
    category: transaction.category ? mapCategoryToDTO(transaction.category as import('@prisma/client').Category) : null,
    
    normalizedMerchantName: metadata?.normalizedMerchantName,
    merchantConfidence: metadata?.merchantConfidence,
    categoryConfidence: metadata?.categoryConfidence,
    isVerified: metadata?.isVerified,
  };
}
