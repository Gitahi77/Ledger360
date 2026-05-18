// src/lib/actions/networth.ts
'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';

export async function getNetWorth() {
  const user = await requireAuth();

  const assets = await prisma.asset.findMany({ where: { userId: user.id } });
  const loans  = await prisma.loan.findMany({ where: { userId: user.id } });

  const totalAssets      = assets.reduce((s, a) => s + a.value, 0);
  const totalLiabilities = loans.reduce((s, l) => s + l.balance, 0);

  return {
    assets,
    liabilities:     loans,
    totalAssets,
    totalLiabilities,
    netWorth:  totalAssets - totalLiabilities,
    debtRatio: totalAssets > 0 ? Math.round((totalLiabilities / totalAssets) * 100) : 0,
  };
}

/* ── Add asset (Zod-validated) ────────────────────────────── */
export async function addAsset(raw: { name: string; category: string; value: number }) {
  const { AddAssetSchema } = await import('@/lib/validation');
  const data = AddAssetSchema.parse(raw);
  const user = await requireAuth();
  await prisma.asset.create({ data: { ...data, userId: user.id } });
  revalidatePath('/net-worth');
  revalidatePath('/');
}

export async function updateAsset(id: string, value: number) {
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');
  await prisma.asset.updateMany({
    where: { id, userId: user.id },
    data:  { value: Math.max(0, Number(value)) },
  });
  revalidatePath('/net-worth');
  revalidatePath('/');
}

export async function deleteAsset(id: string) {
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');
  await prisma.asset.deleteMany({ where: { id, userId: user.id } });
  revalidatePath('/net-worth');
  revalidatePath('/');
}
