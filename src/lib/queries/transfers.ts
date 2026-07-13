
import { prisma } from '@/lib/prisma';
import { getNairobiNow } from '@/lib/dateUtils';
import { mapTransferToDTO, type TransferDTO } from '@/lib/mappers/transfers';



/* -- Fetch -------------------------------------------------- */
export async function getTransfers({ userId, period }: { userId: string; period?: 'this-month' | 'last-30-days' | 'all-time' | 'this-week' | 'this-year' }): Promise<TransferDTO[]> {

  // Basic date filtering
  let dateFilter = {};
  if (period === 'this-month') {
    const now = getNairobiNow();
    dateFilter = { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
  } else if (period === 'last-30-days') {
    const d = getNairobiNow();
    d.setDate(d.getDate() - 30);
    dateFilter = { gte: d };
  } else if (period === 'this-week') {
    const now = getNairobiNow();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    dateFilter = { gte: new Date(now.getFullYear(), now.getMonth(), diff) };
  } else if (period === 'this-year') {
    const now = getNairobiNow();
    dateFilter = { gte: new Date(now.getFullYear(), 0, 1) };
  }

  const transfers = await prisma.transfer.findMany({
    where: { 
      userId,
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {})
    },
    include: {
      fromAccount: { select: { name: true, currency: true } },
      toAccount: { select: { name: true, currency: true } },
    },
    orderBy: { date: 'desc' },
  });

  return transfers.map(mapTransferToDTO);
}

/* -- Add (Zod-validated) ------------------------------------ */




/* -- Delete (atomic â€” no TOCTOU race) ---------------------- */

