// src/lib/mappers/categories.ts
import { TransactionType } from '../types/domain';

export type CategoryDTO = {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
};

export function mapCategoryToDTO(category: {
  id: string;
  userId: string;
  name: string;
  type: string;
  icon: string | null;
}): CategoryDTO {
  return {
    id: category.id,
    userId: category.userId,
    name: category.name,
    type: category.type as TransactionType,
    color: 'var(--color-primary)', // Default fallback since it's not in db yet
    icon: category.icon || '',
  };
}
