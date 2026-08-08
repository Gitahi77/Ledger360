/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
// src/lib/actions/networth.ts
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '../actions/_auth';
import { getAccountBalances } from './accounts';
import { getLoansForUser } from './loans';
import { mapAssetToDTO } from '@/lib/mappers/assets';

export async function getNetWorth({ userId, currency }: { userId: string, currency?: string | null }) {
  let userCurrency = currency;
  if (!userCurrency) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { currency: true } });
    userCurrency = user?.currency || 'KES';
  }

  const [accounts, assets, loans] = await Promise.all([
    getAccountBalances({ userId }),
    prisma.asset.findMany({ where: { userId } }),
    getLoansForUser({ userId })
  ]);

  const cashAccounts = accounts.filter((a: any) => a.type !== 'CREDIT_CARD' && a.balanceMoney.amountMinor >= 0);
  const debtAccounts = accounts.filter((a: any) => a.type === 'CREDIT_CARD' || a.balanceMoney.amountMinor < 0);

  const convert = (amount: number, currency?: string | null) => {
    // Quarantine FX logic for now; future work will reintroduce a domain-safe FX engine.
    return amount;
  };

  const totalCashMinor        = cashAccounts.reduce((sum: number, acc: any) => sum + convert(acc.balanceMoney.amountMinor, acc.currency), 0);
  const totalCardDebtMinor    = debtAccounts.reduce((sum: number, acc: any) => sum + Math.abs(convert(acc.balanceMoney.amountMinor, acc.currency)), 0);
  
  const totalAssetsMinor      = assets.reduce((s: any, a: any) => s + Number(a.valueMinor), 0) + totalCashMinor;
  const totalLiabilitiesMinor = loans.reduce((s: any, l: any) => s + Number(l.balanceMoney?.amountMinor ?? l.balanceMinor ?? 0), 0) + totalCardDebtMinor;

  return {
    assets: assets.map(a => mapAssetToDTO(a, userCurrency)),
    liabilities: loans, // getLoansForUser already returns LoanDTO[]
    totalAssetsMinor,
    totalLiabilitiesMinor,
    totalCashMinor,
    netWorthMinor:  totalAssetsMinor - totalLiabilitiesMinor,
    debtRatio: totalAssetsMinor > 0 ? Math.round((totalLiabilitiesMinor / totalAssetsMinor) * 100) : 0,
  };
}

/* -- Add asset (Zod-validated) ------------------------------ */






export async function getNetWorthHistory({ userId, currency, days }: { userId: string, currency?: string | null, days: number }) {
  const currentNw = (await getNetWorth({ userId, currency })).netWorthMinor;
  
  const today = new Date();
  const cutoff = new Date(today);
  cutoff.setDate(today.getDate() - days);

  const [txs, tfs] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, date: { gte: cutoff } },
      select: { date: true, type: true, baseAmountMinor: true }
    }),
    prisma.transfer.findMany({
      where: { userId, date: { gte: cutoff } },
      select: { date: true, amountMinor: true, fromAccountId: true, toAccountId: true, loanId: true, interestMinor: true }
    })
  ]);

  const toNairobiDateString = (d: Date) => {
    const local = new Date(d.getTime() + 3 * 3600000);
    return local.toISOString().split('T')[0];
  };

  const changeMap = new Map<string, number>();

  for (const tx of txs) {
    const dStr = toNairobiDateString(tx.date);
    const amt = Number(tx.baseAmountMinor);
    // Income increases NW, expense reduces NW
    const delta = tx.type === 'income' ? amt : -amt;
    changeMap.set(dStr, (changeMap.get(dStr) || 0) + delta);
  }

  for (const tf of tfs) {
    const dStr = toNairobiDateString(tf.date);
    const amt = Number(tf.amountMinor);
    let delta = 0;

    if (!tf.toAccountId && !tf.loanId && tf.fromAccountId) {
      // Transfer OUT (off-book): reduces NW
      delta = -amt;
    } else if (!tf.fromAccountId && (tf.toAccountId || tf.loanId)) {
      // Transfer IN (from off-book): increases NW
      // If it's paying a loan, it reduces liability without reducing tracked cash, so NW increases.
      delta = amt;
    } else if (tf.fromAccountId && tf.loanId && tf.interestMinor) {
      // Transfer to Loan WITH interest:
      // Cash decreases by amt. Liability decreases by (amt - interest).
      // Net change to NW = -interest
      delta = -Number(tf.interestMinor);
    }
    
    if (delta !== 0) {
      changeMap.set(dStr, (changeMap.get(dStr) || 0) + delta);
    }
  }

  const history: { date: string; netWorthMinor: number }[] = [];
  let runningNw = currentNw;
  
  for (let i = 0; i <= days; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = toNairobiDateString(d);
    
    history.unshift({ date: dateStr, netWorthMinor: runningNw });
    
    // To go backwards in time, subtract the change that happened ON this day
    // from the running total to find what the NW was at the start of the day.
    const change = changeMap.get(dateStr) || 0;
    runningNw -= change;
  }

  return history;
}
