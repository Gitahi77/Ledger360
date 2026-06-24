// src/lib/actions/networth.ts
'use server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';
import { getAccountBalances } from './accounts';
import { getLoansForUser } from './loans';
import { getRates } from '@/lib/api/frankfurter';

export async function getNetWorth() {
  const user = await requireAuth();

  const userCurrency = user.currency || 'KES';

  const [accounts, assets, loans, rates] = await Promise.all([
    getAccountBalances(user.id),
    prisma.asset.findMany({ where: { userId: user.id } }),
    getLoansForUser(user.id),
    getRates('USD')
  ]);

  const cashAccounts = accounts.filter(a => a.type !== 'CREDIT_CARD' && a.balanceMinor >= 0);
  const debtAccounts = accounts.filter(a => a.type === 'CREDIT_CARD' || a.balanceMinor < 0);

  const convert = (amount: number, currency?: string | null) => {
    const c = currency || userCurrency;
    if (c === userCurrency || !rates) return amount;
    
    const rateC = c === 'USD' ? 1 : rates.rates[c];
    const rateUser = userCurrency === 'USD' ? 1 : rates.rates[userCurrency];
    
    if (!rateC || !rateUser) return amount;
    
    return Math.round(amount * (rateUser / rateC));
  };

  const totalCashMinor        = cashAccounts.reduce((s, a) => s + convert(a.balanceMinor, a.currency), 0);
  const totalCardDebtMinor    = debtAccounts.reduce((s, a) => s + Math.abs(convert(a.balanceMinor, a.currency)), 0);
  
  const totalAssetsMinor      = assets.reduce((s, a) => s + a.valueMinor, 0) + totalCashMinor;
  const totalLiabilitiesMinor = loans.reduce((s, l) => s + l.balanceMinor, 0) + totalCardDebtMinor;

  return {
    assets,
    liabilities:     loans,
    totalAssetsMinor,
    totalLiabilitiesMinor,
    totalCashMinor,
    netWorthMinor:  totalAssetsMinor - totalLiabilitiesMinor,
    debtRatio: totalAssetsMinor > 0 ? Math.round((totalLiabilitiesMinor / totalAssetsMinor) * 100) : 0,
  };
}

/* ── Add asset (Zod-validated) ────────────────────────────── */
export async function addAsset(raw: { name: string; category: string; valueMinor: number }) {
  const { AddAssetSchema } = await import('@/lib/validation');
  const data = AddAssetSchema.parse(raw);
  const user = await requireAuth();
  await prisma.asset.create({ data: { ...data, userId: user.id, valueMinor: data.valueMinor } });
  revalidatePath('/net-worth');
  revalidatePath('/');
}

export async function editAsset(id: string, data: { name?: string; category?: string; valueMinor?: number }) {
  const user = await requireAuth();
  if (!id) throw new Error('Missing id');
  
  const { count } = await prisma.asset.updateMany({
    where: { id, userId: user.id },
    data,
  });
  if (count === 0) throw new Error('Asset not found or ownership failed');
  
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
