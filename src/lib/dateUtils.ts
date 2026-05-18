// src/lib/dateUtils.ts
// Period date helpers — shared between server actions and client components

export function periodDates(period: string): { from: Date; to: Date } {
  const now = new Date();
  const to  = new Date(now);
  let from  = new Date(now);

  if (period === 'this-week') {
    const day = now.getDay() || 7; // Mon=1 … Sun=7
    from.setDate(now.getDate() - day + 1);
    from.setHours(0, 0, 0, 0);
  } else if (period === 'this-month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'this-year') {
    from = new Date(now.getFullYear(), 0, 1);
  } else {
    from = new Date('2000-01-01'); // 'all' / 'custom'
  }
  return { from, to };
}
