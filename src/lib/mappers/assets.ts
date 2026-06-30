import type { Asset } from '@prisma/client';
import { serializeMoney, serializeDate } from './core';

export type AssetDTO = {
  id: string;
  name: string;
  category: string;
  valueMinor: number;
  symbol: string | null;
  userId: string;
  updatedAt: string;
  createdAt: string;
};

export function mapAssetToDTO(asset: Asset): AssetDTO {
  return {
    id: asset.id,
    name: asset.name,
    category: asset.category,
    valueMinor: serializeMoney(asset.valueMinor),
    symbol: asset.symbol,
    userId: asset.userId,
    updatedAt: serializeDate(asset.updatedAt) as string,
    createdAt: serializeDate(asset.createdAt) as string,
  };
}
