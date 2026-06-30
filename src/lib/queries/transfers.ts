import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/actions/_auth';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/lib/audit';
import { getNairobiNow } from '@/lib/dateUtils';
import { z } from 'zod';
import { mapTransferToDTO, type TransferDTO } from '@/lib/mappers/transfers';

const DeleteSchema = z.object({ id: z.string().cuid() });

/* -- Fetch -------------------------------------------------- */
export async function getTransfers(period?: 'this-month' | 'last-30-days' | 'all-time'): Promise<TransferDTO[]> {
  const user = await requireAuth();

  // Basic date filtering
  let dateFilter = {};
  if (period === 'this-month') {
    const now = getNairobiNow();
    dateFilter = { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
  } else if (period === 'last-30-days') {
    const d = getNairobiNow();
    d.setDate(d.getDate() - 30);
    dateFilter = { gte: d };
  }

  const transfers = await prisma.transfer.findMany({
    where: { 
      userId: user.id,
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




/* -- Delete (atomic — no TOCTOU race) ---------------------- */

