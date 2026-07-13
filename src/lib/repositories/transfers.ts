import { prisma } from '@/lib/prisma';
import { Prisma, Transfer } from '@prisma/client';

export async function getTransferSumsByAccount(userId: string) {
  const [transfersOut, transfersIn] = await Promise.all([
    prisma.transfer.groupBy({
      by: ['fromAccountId'],
      where: { userId },
      _sum: { amountMinor: true }
    }),
    prisma.transfer.groupBy({
      by: ['toAccountId'],
      where: { userId },
      _sum: { baseAmountMinor: true }
    })
  ]);

  return { transfersOut, transfersIn };
}

export async function getTransferById(userId: string, transferId: string): Promise<Transfer | null> {
  return prisma.transfer.findFirst({
    where: { id: transferId, userId }
  });
}

export async function getTransferByIdempotencyKey(userId: string, idempotencyKey: string): Promise<Transfer | null> {
  return prisma.transfer.findFirst({
    where: { idempotencyKey, userId }
  });
}

export async function createTransferRecord(
  tx: Prisma.TransactionClient, 
  data: Prisma.TransferUncheckedCreateInput
): Promise<Transfer> {
  return tx.transfer.create({ data });
}

export async function updateTransferRecord(
  tx: Prisma.TransactionClient, 
  id: string,
  userId: string,
  data: Prisma.TransferUncheckedUpdateInput
): Promise<Transfer> {
  return tx.transfer.update({
    where: { id, userId },
    data
  });
}

export async function deleteTransferRecord(
  tx: Prisma.TransactionClient, 
  id: string,
  userId: string
): Promise<void> {
  await tx.transfer.delete({
    where: { id, userId }
  });
}
