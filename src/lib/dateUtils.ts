// src/lib/dateUtils.ts
// Period date helpers — shared between server actions and client components

const NAIROBI_TZ = 'Africa/Nairobi'

/**
 * Returns the current date/time as seen in Nairobi (UTC+3).
 * Use this everywhere a "now" boundary is needed for period calculations.
 */
export function getNairobiNow(): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: NAIROBI_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(new Date())
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '0'
  return new Date(
    `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`
  )
}

/**
 * Returns the start of the current month in Nairobi time as a UTC Date.
 */
export function getNairobiMonthStart(): Date {
  const now = getNairobiNow()
  return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
}

/**
 * Returns the start of the current day in Nairobi time.
 */
export function getNairobiDayStart(): Date {
  const now = getNairobiNow()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
}

export function periodDates(period: string): { from: Date; to: Date } {
  const now = getNairobiNow();
  let from: Date;
  // "to" must end at 23:59:59.999 so that same-day transactions are always included.
  // Without this, a transaction created at 14:30 today would be excluded if `to`
  // was set to the current time-of-day (e.g. 14:00).
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (period === 'this-week') {
    const day = now.getDay() || 7; // Mon=1 … Sun=7
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day + 1, 0, 0, 0, 0);
  } else if (period === 'this-month') {
    from = getNairobiMonthStart();
  } else if (period === 'this-year') {
    from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  } else {
    // 'all' or any unknown value — fetch everything
    from = new Date('2000-01-01');
  }
  return { from, to };
}

/**
 * Returns a YYYY-MM string that is year-aware.
 * Used as a grouping key in intelligence.ts to avoid "Jan 2024" and "Jan 2025"
 * being merged into the same bucket.
 */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}
