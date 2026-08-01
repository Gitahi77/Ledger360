import { Money } from './types';

export type LedgerEntry = {
  id: string;
  baseAmountMinor: number | bigint;
  type: 'income' | 'expense';
  status: 'ACTIVE' | 'VOIDED' | 'ARCHIVED';
  date: Date;
  accountId: string;
};

export type SplitChildInput = {
  baseAmountMinor: number;
  categoryId: string;
  note?: string;
};

/**
 * Calculates total income, expense, and net cash flow from an array of transactions.
 * Excludes VOIDED transactions.
 */
export function calculateCashFlow(transactions: LedgerEntry[]): {
  incomeMinor: bigint;
  expenseMinor: bigint;
  netMinor: bigint;
} {
  let incomeMinor = 0n;
  let expenseMinor = 0n;

  for (const tx of transactions) {
    if (tx.status === 'VOIDED' || tx.status === 'ARCHIVED') continue;

    const amount = BigInt(tx.baseAmountMinor);
    if (tx.type === 'income') {
      incomeMinor += amount;
    } else if (tx.type === 'expense') {
      expenseMinor += amount;
    }
  }

  return {
    incomeMinor,
    expenseMinor,
    netMinor: incomeMinor - expenseMinor,
  };
}

/**
 * Validates that the sum of child split transactions matches the parent transaction.
 * This MUST hold after creation, edit, or merge.
 */
export function validateSplitTotal(parentAmountMinor: bigint | number, children: SplitChildInput[]): boolean {
  const parentAmt = BigInt(parentAmountMinor);
  const sumChildren = children.reduce((sum, child) => sum + BigInt(child.baseAmountMinor), 0n);
  return parentAmt === sumChildren;
}

/**
 * Given a starting balance and a chronological list of transactions, calculates the daily running balance.
 */
export function calculateRunningBalance(
  startingBalanceMinor: bigint | number,
  transactionsAsc: LedgerEntry[]
): { date: Date; balanceMinor: bigint }[] {
  let currentBalance = BigInt(startingBalanceMinor);
  const runningBalances: { date: Date; balanceMinor: bigint }[] = [];

  for (const tx of transactionsAsc) {
    if (tx.status === 'VOIDED' || tx.status === 'ARCHIVED') continue;

    const amount = BigInt(tx.baseAmountMinor);
    if (tx.type === 'income') {
      currentBalance += amount;
    } else {
      currentBalance -= amount;
    }

    runningBalances.push({
      date: tx.date,
      balanceMinor: currentBalance,
    });
  }

  return runningBalances;
}
