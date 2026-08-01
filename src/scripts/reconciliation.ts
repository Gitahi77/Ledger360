import { prisma } from '../lib/prisma';
import {  } from '../lib/repositories/accounts';
import { BalanceService } from '../lib/domain/services/BalanceService';

/**
 * Stage 3 - Reconciliation Tool
 * 
 * Provides tooling to detect, report, and repair balance drift.
 * Because the ledger is the source of truth, repairs always recompute from the transaction history.
 */

export interface DriftReport {
  accountId: string;
  userId: string;
  persistedBalance: bigint;
  ledgerBalance: bigint;
  drift: bigint;
}

/**
 * Scans accounts to find any whose persisted balance differs from the transaction ledger.
 */
export async function detectBalanceDrift(): Promise<DriftReport[]> {
  const accounts = await prisma.account.findMany({
    select: { id: true, userId: true, balanceMinor: true }
  });

  const driftReports: DriftReport[] = [];

  for (const acc of accounts) {
    const computed = await BalanceService.getSingleAccountBalance(acc.userId, acc.id);
    if (!computed) continue;

    const ledgerBalance = BigInt(computed.balanceMinor);
    if (acc.balanceMinor !== ledgerBalance) {
      driftReports.push({
        accountId: acc.id,
        userId: acc.userId,
        persistedBalance: acc.balanceMinor,
        ledgerBalance,
        drift: acc.balanceMinor - ledgerBalance,
      });
    }
  }

  return driftReports;
}

/**
 * Recomputes the balances for all accounts and updates the persisted balance.
 * Implements batching and progress reporting.
 */
export async function recalculateBalances(onProgress?: (processed: number, total: number) => void): Promise<number> {
  const accounts = await prisma.account.findMany({
    select: { id: true, userId: true, allowNegativeBalance: true }
  });

  const total = accounts.length;
  let processed = 0;

  for (const acc of accounts) {
    const computed = await BalanceService.getSingleAccountBalance(acc.userId, acc.id);
    if (!computed) continue;

    const ledgerBalance = BigInt(computed.balanceMinor);
    const isNegative = ledgerBalance < 0n;

    await prisma.account.update({
      where: { id: acc.id },
      data: { 
        balanceMinor: ledgerBalance,
        ...(isNegative && !acc.allowNegativeBalance ? { allowNegativeBalance: true } : {})
      },
    });

    processed++;
    if (onProgress && processed % 10 === 0) {
      onProgress(processed, total);
    }
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  if (onProgress) {
    onProgress(processed, total);
  }

  return processed;
}

/**
 * Explicitly repairs balances for accounts that have drifted.
 * Never silently repairs. Callers must invoke this explicitly with known drifting accounts.
 */
export async function repairBalances(accountIds: string[]): Promise<void> {
  const accounts = await prisma.account.findMany({
    where: { id: { in: accountIds } },
    select: { id: true, userId: true }
  });

  for (const acc of accounts) {
    const computed = await BalanceService.getSingleAccountBalance(acc.userId, acc.id);
    if (!computed) continue;

    await prisma.account.update({
      where: { id: acc.id },
      data: { balanceMinor: BigInt(computed.balanceMinor) }
    });
  }
}
