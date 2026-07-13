import { prisma } from './prisma';

export class AuthorizationError extends Error {
  code = 'FORBIDDEN';
  constructor(message: string = 'You are not authorized to access this resource.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Generic ownership assertion helper.
 * Minimizes DB trips by returning the loaded resource.
 * Throws AuthorizationError if missing or owned by another user.
 */
export async function assertOwnsResource<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  T extends { findUnique: (args: any) => Promise<any> },
  R = Awaited<ReturnType<T['findUnique']>>
>(params: {
  model: T;
  userId: string;
  id: string;
  idField?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select?: any;
}): Promise<NonNullable<R>> {
  const idField = params.idField || 'id';
  
  const resource = await params.model.findUnique({
    where: { [idField]: params.id },
    select: params.select,
  });

  if (!resource) {
    throw new AuthorizationError();
  }
  
  if (resource.userId !== params.userId) {
    throw new AuthorizationError();
  }

  return resource as NonNullable<R>;
}

// ── Thin Domain Wrappers ────────────────────────────────────────────────

export async function assertOwnsAccount(userId: string, accountId: string) {
  return assertOwnsResource({ model: prisma.account, userId, id: accountId });
}

export async function assertOwnsTransaction(userId: string, transactionId: string) {
  return assertOwnsResource({ model: prisma.transaction, userId, id: transactionId });
}

export async function assertOwnsCategory(userId: string, categoryId: string) {
  return assertOwnsResource({ model: prisma.category, userId, id: categoryId });
}

export async function assertOwnsBudget(userId: string, budgetId: string) {
  return assertOwnsResource({ model: prisma.budget, userId, id: budgetId });
}

export async function assertOwnsGoal(userId: string, goalId: string) {
  return assertOwnsResource({ model: prisma.goal, userId, id: goalId });
}

export async function assertOwnsLoan(userId: string, loanId: string) {
  return assertOwnsResource({ model: prisma.loan, userId, id: loanId });
}

export async function assertOwnsTransfer(userId: string, transferId: string) {
  return assertOwnsResource({ model: prisma.transfer, userId, id: transferId });
}

export async function assertOwnsAsset(userId: string, assetId: string) {
  return assertOwnsResource({ model: prisma.asset, userId, id: assetId });
}
