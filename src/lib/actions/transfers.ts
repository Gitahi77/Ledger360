'use server';

import { requireAuth } from '@/lib/actions/_auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { assertOwnsAccount, assertOwnsGoal, assertOwnsLoan } from '@/lib/authz';

import { safeValidate, withAction } from '@/lib/respond';
import { TransferService } from '../domain/transfers/TransferService';
import { ActionResult } from '../types/action-result';
import { TransferResultDTO } from '../mappers/transfers';

const DeleteSchema = z.object({ id: z.string().cuid() });

export async function createTransfer(envelope: { idempotencyKey?: string; payload: unknown }): Promise<ActionResult<TransferResultDTO>> {
  'use server';
  return withAction<unknown, TransferResultDTO>({
    actionName: 'createTransfer',
    idempotencyKey: envelope.idempotencyKey,
    input: envelope.payload,
    handler: async () => {
      const { AddTransferSchema } = await import('@/lib/validation');
      const parsed = safeValidate(AddTransferSchema, envelope.payload, 'createTransfer');
      if (!parsed.success) return parsed.error;
      const data = parsed.data;
      const user = await requireAuth();

      const fromAccount = await assertOwnsAccount(user.id, data.fromAccountId);
      if (data.toAccountId) {
        const toAccount = await assertOwnsAccount(user.id, data.toAccountId);
        if (fromAccount.currency !== toAccount.currency) {
          return { success: false, code: 'VALIDATION', message: 'Cross-currency transfers are not supported yet.' };
        }
        if (fromAccount.id === toAccount.id) {
          return { success: false, code: 'VALIDATION', message: 'Source and destination accounts must be different.' };
        }
      }
      
      if (data.goalId) {
        await assertOwnsGoal(user.id, data.goalId);
      }
      
      if (data.loanId) {
        await assertOwnsLoan(user.id, data.loanId);
      }

      const result = await TransferService.executeTransfer({
        idempotencyKey: envelope.idempotencyKey ?? '',
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
      if (data.goalId) revalidatePath('/goals');
      if (data.loanId) revalidatePath('/loans');
      
      return { success: true, data: result };
    }
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function editTransfer(id: string, rawData: unknown): Promise<ActionResult<TransferResultDTO>> {
  'use server';
  return { 
    success: false, 
    code: 'AUTHORIZATION', 
    message: 'Editing transfers directly is restricted in the new Ledger architecture. Please delete and recreate the transfer.' 
  };
}

export async function deleteTransfer(envelope: { idempotencyKey?: string; payload: unknown }): Promise<ActionResult<void>> {
  'use server';
  const { withAction } = await import('@/lib/respond');
  return withAction<unknown, void>({
    actionName: 'deleteTransfer',
    idempotencyKey: envelope.idempotencyKey,
    input: envelope.payload,
    handler: async () => {
      const user = await requireAuth();
      const parsedId = safeValidate(DeleteSchema, envelope.payload, 'deleteTransfer');
      if (!parsedId.success) return parsedId.error;
      const validId = parsedId.data.id;

      const { prisma } = await import('@/lib/prisma');
      
      await prisma.$transaction(async (tx) => {
        const transfer = await tx.transfer.findFirst({ where: { id: validId, userId: user.id } });
        if (!transfer) throw new Error('Transfer not found or already deleted');

        await tx.account.update({ 
          where: { id: transfer.fromAccountId! }, 
          data: { balanceMinor: { increment: transfer.amountMinor }, updatedAt: new Date() } 
        });
        if (transfer.toAccountId) {
          await tx.account.update({ 
            where: { id: transfer.toAccountId }, 
            data: { balanceMinor: { decrement: transfer.amountMinor }, updatedAt: new Date() } 
          });
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
            metadata: { transferId: validId },
          }
        });
      });

      revalidatePath('/transactions');
      revalidatePath('/accounts');
      revalidatePath('/');
      return { success: true, data: undefined };
    }
  });
}
