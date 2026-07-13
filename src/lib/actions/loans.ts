'use server';

// src/lib/actions/loans.ts
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requireAuth } from './_auth';

import { z } from 'zod';
import { AuthorizationError, assertOwnsAccount, assertOwnsLoan } from '@/lib/authz';

import { safeValidate } from '@/lib/respond';

const DeleteSchema = z.object({ id: z.string().cuid() });
const EditLoanSchema = z.object({
  name: z.string().optional(),
  lender: z.string().optional(),
  type: z.string().optional(),
  originalAmountMinor: z.number().int().positive().optional(),
  balanceMinor: z.number().int().optional(),
  annualRate: z.number().optional(),
  amortization: z.string().optional(),
  monthlyPaymentMinor: z.number().int().positive().optional(),
  nextDue: z.string().optional(),
});





/* -- Add (Zod-validated) ------------------------------------ */
export async function addLoan(raw: unknown) {
  'use server';
  try {
    const { AddLoanSchema } = await import('@/lib/validation');
    const parsed = safeValidate(AddLoanSchema, raw, 'AddLoanSchema');
    if (!parsed.success) return parsed.error;
    const data = parsed.data;
    const user = await requireAuth();
    
    if (data.disbursementType === 'received_funds' && data.disbursementAccountId) {
      await assertOwnsAccount(user.id, data.disbursementAccountId);
    }

    await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.create({
        data: {
          name: data.name,
          lender: data.lender,
          type: data.type,
          userId: user.id,
          nextDue: new Date(data.nextDue),
          originalAmountMinor: data.originalAmountMinor,
          balanceMinor: data.balanceMinor,
          monthlyPaymentMinor: data.monthlyPaymentMinor,
          annualRate: data.annualRate,
          amortization: data.amortization,
        },
      });

      if (data.disbursementType === 'received_funds' && data.disbursementAccountId) {
        await tx.transfer.create({
          data: {
            userId: user.id,
            fromAccountId: null,
            toAccountId: data.disbursementAccountId,
            amountMinor: data.balanceMinor,
            currency: user.currency || 'KES',
            baseAmountMinor: data.balanceMinor,
            fxRate: 1,
            date: new Date(),
            source: 'loan_disbursement',
            loanId: loan.id,
          }
        });
      }
    });
    revalidatePath('/loans');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'FORBIDDEN', message: error.message };
    console.error('[addLoan]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function deleteLoan(id: string) {
  'use server';
  const user = await requireAuth();
  try {
    const parsedId = safeValidate(DeleteSchema, { id }, 'DeleteSchema');
    if (!parsedId.success) return parsedId.error;
    const validId = parsedId.data.id;

    await assertOwnsLoan(user.id, validId);
    await prisma.loan.deleteMany({ where: { id: validId, userId: user.id } });
    revalidatePath('/loans');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'FORBIDDEN', message: error.message };
    console.error('[deleteLoan]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}

export async function editLoan(id: string, rawData: unknown) {
  'use server';
  const user = await requireAuth();
  try {
    const parsedId = safeValidate(DeleteSchema, { id }, 'DeleteSchema');
    const parsedData = safeValidate(EditLoanSchema, rawData, 'EditLoanSchema');
    if (!parsedId.success) return parsedId.error;
    if (!parsedData.success) return parsedData.error;
    const validId = parsedId.data.id;
    const data = parsedData.data;

    const updateData: Record<string, unknown> = { ...data };
    if (data.nextDue) updateData.nextDue = new Date(data.nextDue);

    await assertOwnsLoan(user.id, validId);
    const { count } = await prisma.loan.updateMany({
      where: { id: validId, userId: user.id },
      data: updateData,
    });
    if (count === 0) return { error: 'Loan not found or ownership failed' };
    
    revalidatePath('/loans');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    if (error instanceof AuthorizationError) return { success: false, code: 'FORBIDDEN', message: error.message };
    console.error('[editLoan]', error);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
