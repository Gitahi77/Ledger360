import type { Asset } from '@prisma/client';
import { toMoneyDTO, toDateDTO } from './core';

export type AssetDTO = {
  id: string;
  name: string;
  category: string;
  valueMoney: import('../types/domain').MoneyDTO;
  symbol: string | null;
  userId: string;
  updatedAt: string;
  createdAt: string;
};

export function mapAssetToDTO(asset: Asset, currency: string = 'USD'): AssetDTO {
  return {
    id: asset.id,
    name: asset.name,
    category: asset.category,
    valueMoney: { amountMinor: toMoneyDTO(asset.valueMinor), currency },
    symbol: asset.symbol,
    userId: asset.userId,
    updatedAt: toDateDTO(asset.updatedAt) as string,
    createdAt: toDateDTO(asset.createdAt) as string,
  };
}
