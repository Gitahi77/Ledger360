import { prisma } from '@/lib/prisma';
import { Loan } from '@prisma/client';

export async function getLoanById({ userId, loanId }: { userId: string, loanId: string }): Promise<Loan | null> {
  return prisma.loan.findFirst({
    where: { id: loanId, userId }
  });
}

export async function getLoansForUser({ userId }: { userId: string }): Promise<Loan[]> {
  return prisma.loan.findMany({
    where: { userId },
    orderBy: { nextDue: 'asc' }
  });
}
