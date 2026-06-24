// src/lib/dateUtils.ts
// Period date helpers — shared between server actions and client components

const NAIROBI_TZ = 'Africa/Nairobi'

function getNairobiParts(date: Date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: NAIROBI_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(date)
  const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0', 10)
  return { yr: get('year'), mo: get('month'), da: get('day'), hr: get('hour'), mi: get('minute'), sc: get('second') }
}

export function getNairobiNow(): Date {
  return new Date(); // Return actual real-world moment
}

export function getNairobiMonthStart(): Date {
  const { yr, mo } = getNairobiParts();
  return new Date(`${yr}-${String(mo).padStart(2, '0')}-01T00:00:00+03:00`);
}

export function getNairobiDayStart(): Date {
  const { yr, mo, da } = getNairobiParts();
  return new Date(`${yr}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}T00:00:00+03:00`);
}

export function periodDates(period: string): { from: Date; to: Date } {
  const { yr, mo, da } = getNairobiParts();
  const to = new Date(`${yr}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}T23:59:59.999+03:00`);

  let from: Date;
  if (period === 'this-week') {
    // Find Nairobi's day of week by interpreting the local 12:00 as UTC to find the correct day
    const d = new Date(`${yr}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}T12:00:00+03:00`);
    const dayOfWeek = d.getUTCDay(); // 0=Sun, 1=Mon ... 6=Sat
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // days since Monday
    const startOfWeek = new Date(d.getTime() - diff * 86400000);
    const swParts = getNairobiParts(startOfWeek);
    from = new Date(`${swParts.yr}-${String(swParts.mo).padStart(2, '0')}-${String(swParts.da).padStart(2, '0')}T00:00:00+03:00`);
  } else if (period === 'this-month') {
    from = getNairobiMonthStart();
  } else if (period === 'this-year') {
    from = new Date(`${yr}-01-01T00:00:00+03:00`);
  } else {
    from = new Date('2000-01-01T00:00:00Z');
  }
  return { from, to };
}

export function monthKey(date: Date): string {
  const p = getNairobiParts(date);
  return `${p.yr}-${p.mo}`;
}
