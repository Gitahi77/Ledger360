'use server';

import { requireAuth } from '@/lib/actions/_auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { TransferService } from '../domain/transfers/TransferService';
import { ActionResult } from '../types/action-result';
import { TransferResultDTO } from '../mappers/transfers';

const DeleteSchema = z.object({ id: z.string().cuid() });

export async function createTransfer(raw: unknown): Promise<ActionResult<TransferResultDTO>> {
  'use server';
  try {
    const { AddTransferSchema } = await import('@/lib/validation');
    const parsed = AddTransferSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, code: 'VALIDATION_ERROR', message: 'Invalid input' };
    }
    const data = parsed.data;
    const user = await requireAuth();

    const fallbackIdempotencyKey = `LEGACY-${user.id}-${data.fromAccountId}-${data.amountMinor}-${new Date(data.date).getTime()}`;
    const idempotencyKey = (data as any).idempotencyKey || fallbackIdempotencyKey;

    const result = await TransferService.executeTransfer({
      idempotencyKey,
      userId: user.id,
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId || null,
      amountMinor: data.amountMinor,
      date: new Date(data.date),
      note: data.note,
      goalId: data.goalId,
      loanId: data.loanId,
      interestMinor: data.interestMinor,
    });

    revalidatePath('/transactions');
    revalidatePath('/accounts');
    revalidatePath('/finance');
    revalidatePath('/');
    
    return { success: true, data: result };
  } catch (error) {
    console.error('[createTransfer]', error);
    const msg = error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.';
    return { success: false, code: 'UNKNOWN', message: msg };
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function editTransfer(id: string, rawData: unknown): Promise<ActionResult<TransferResultDTO>> {
  'use server';
  return { 
    success: false, 
    code: 'FORBIDDEN', 
    message: 'Editing transfers directly is restricted in the new Ledger architecture. Please delete and recreate the transfer.' 
  };
}

export async function deleteTransfer(id: string): Promise<ActionResult<void>> {
  'use server';
  const user = await requireAuth();
  try {
    const parsedId = DeleteSchema.safeParse({ id });
    if (!parsedId.success) {
      return { success: false, code: 'VALIDATION_ERROR', message: 'Invalid input' };
    }
    const validId = parsedId.data.id;

    const { prisma } = await import('@/lib/prisma');
    
    await prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findFirst({ where: { id: validId, userId: user.id } });
      if (!transfer) throw new Error('Transfer not found or already deleted');

      await tx.account.update({ where: { id: transfer.fromAccountId! }, data: { updatedAt: new Date() } });
      if (transfer.toAccountId) {
        await tx.account.update({ where: { id: transfer.toAccountId }, data: { updatedAt: new Date() } });
      }

      if (transfer.loanId) {
        const loan = await tx.loan.update({ where: { id: transfer.loanId }, data: { updatedAt: new Date() } });
        const principalReversal = Number(transfer.amountMinor) - Number(transfer.interestMinor);
        await tx.loan.update({
          where: { id: loan.id },
          data: { balanceMinor: BigInt(Number(loan.balanceMinor) + principalReversal) }
        });
      }

      await tx.transfer.delete({ where: { id: transfer.id } });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE',
          resource: 'Transfer',
          metadata: JSON.stringify({ transferId: validId }),
        }
      });
    });

    revalidatePath('/transactions');
    revalidatePath('/accounts');
    revalidatePath('/');
    return { success: true, data: undefined };
  } catch (error) {
    console.error('[deleteTransfer]', error);
    const msg = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return { success: false, code: 'UNKNOWN', message: msg };
  }
}
