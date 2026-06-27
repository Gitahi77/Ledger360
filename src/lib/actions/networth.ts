'use server';

// src/lib/actions/networth.ts
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';



/* -- Add asset (Zod-validated) ------------------------------ */
export async function addAsset(raw: { name: string; category: string; valueMinor: number; symbol?: string }) {
  'use server';
  const { AddAssetSchema } = await import('@/lib/validation');
  const data = AddAssetSchema.parse(raw);
  const user = await requireAuth();
  await prisma.asset.create({ data: { ...data, userId: user.id, valueMinor: BigInt(data.valueMinor), symbol: data.symbol } });
  revalidatePath('/net-worth');
  revalidatePath('/');
}

export async function editAsset(id: string, raw: { name?: string; category?: string; valueMinor?: number; symbol?: string }) {
  'use server';
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');
  const { AddAssetSchema } = await import('@/lib/validation');
  const parsed = AddAssetSchema.partial().parse(raw);
  
  const { count } = await prisma.asset.updateMany({
    where: { id, userId: user.id },
    data: { ...parsed, valueMinor: parsed.valueMinor !== undefined ? BigInt(parsed.valueMinor) : undefined },
  });
  if (count === 0) throw new Error('Asset not found or ownership failed');
  
  revalidatePath('/net-worth');
  revalidatePath('/');
}

export async function deleteAsset(id: string) {
  'use server';
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');
  await prisma.asset.deleteMany({ where: { id, userId: user.id } });
  revalidatePath('/net-worth');
  revalidatePath('/');
}


