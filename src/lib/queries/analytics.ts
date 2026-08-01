import { prisma } from '@/lib/prisma';
import { activeTransactionFilter } from './transactions';
import type { Category } from '@prisma/client';
import { calculateCategoryAnalytics, CategoryAnalyticsResult } from '../domain/calculators/category-analytics';

export type CategoryAnalyticsDTO = CategoryAnalyticsResult & {
  categoryId: string;
  name: string;
  icon: string | null;
  totalSixMonthSpendMinor: number;
};

export async function getCategoryAnalytics({ userId }: { userId: string }): Promise<CategoryAnalyticsDTO[]> {
  const now = new Date();
  const nowNairobi = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));
  const nYr = nowNairobi.getFullYear();
  const nMo = nowNairobi.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)

  // Start date: 1st of the month, 5 months ago (so 6 months total including current)
  // E.g., if current is Aug (7), 7 - 5 = 2 (March). So Mar, Apr, May, Jun, Jul, Aug = 6 months.
  const start = new Date(Date.UTC(nYr, nMo - 5, 1, -3, 0, 0));
  // End date: end of current month
  const end = new Date(Date.UTC(nYr, nMo + 1, 0, 20, 59, 59, 999));

  // 1. Fetch all expense transactions for the last 6 months
  const txs = await prisma.transaction.findMany({
    where: {
      ...activeTransactionFilter(userId),
      type: 'expense',
      date: { gte: start, lte: end }
    },
    select: { date: true, categoryId: true, baseAmountMinor: true }
  });

  // 2. Fetch all categories for this user to get names/icons
  const categories = await prisma.category.findMany({
    where: { userId }
  });
  const catMap = Object.fromEntries(categories.map(c => [c.id, c]));

  // 3. Generate the sequence of 6 months (YYYY-MM)
  const monthSequence: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(nYr, nMo - i, 1);
    // Format as YYYY-MM (e.g. "2026-03")
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    monthSequence.push(`${d.getFullYear()}-${mm}`);
  }

  // 4. Group data by Category -> Month
  // Record<CategoryId, Record<YYYY-MM, number>>
  const grouped: Record<string, Record<string, number>> = {};
  
  for (const t of txs) {
    if (!t.categoryId) continue;
    const catId = t.categoryId;
    
    // Parse transaction date in Nairobi time
    const d = new Date(t.date.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const monthKey = `${d.getFullYear()}-${mm}`;

    if (!grouped[catId]) {
      grouped[catId] = {};
    }
    if (!grouped[catId][monthKey]) {
      grouped[catId][monthKey] = 0;
    }
    
    grouped[catId][monthKey] += Number(t.baseAmountMinor);
  }

  // 5. Run the analytics engine for each category
  const results: CategoryAnalyticsDTO[] = [];

  for (const catId of Object.keys(grouped)) {
    // Construct the 6-month history array in chronological order, filling 0s for missing months
    const history = monthSequence.map(month => ({
      month,
      amountMinor: grouped[catId][month] || 0
    }));

    // Skip categories with 0 total spend over the 6 months (just in case they were returned somehow, though `txs` query prevents this)
    const totalSixMonthSpendMinor = history.reduce((sum, h) => sum + h.amountMinor, 0);
    if (totalSixMonthSpendMinor === 0) continue;

    const analytics = calculateCategoryAnalytics(history);

    results.push({
      categoryId: catId,
      name: catMap[catId]?.name ?? 'Unknown',
      icon: catMap[catId]?.icon ?? 'other',
      totalSixMonthSpendMinor,
      ...analytics
    });
  }

  // 6. Sort results: Highest total spend first
  results.sort((a, b) => b.totalSixMonthSpendMinor - a.totalSixMonthSpendMinor);

  return results;
}
