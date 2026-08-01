import { prisma } from './prisma';
import { logger } from './logger';

export class AuthorizationError extends Error {
  code = 'AUTHORIZATION';
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
export async function assertOwnsResource<R>(params: {
  findById: (id: string) => Promise<R | null>;
  userId: string;
  id: string;
  resourceType: string;
}): Promise<NonNullable<R>> {
  
  const resource = await params.findById(params.id);

  if (!resource) {
    logger.server('AUTHORIZATION_FAILURE', {
      userId: params.userId,
      resourceType: params.resourceType,
      resourceId: params.id,
      reason: 'Resource not found',
      action: 'assertOwnsResource',
    });
    throw new AuthorizationError();
  }
  
  if ((resource as any).userId !== params.userId) {
    logger.server('AUTHORIZATION_FAILURE', {
      userId: params.userId,
      resourceType: params.resourceType,
      resourceId: params.id,
      reason: 'Ownership mismatch',
      action: 'assertOwnsResource',
    });
    throw new AuthorizationError();
  }

  return resource as NonNullable<R>;
}

// ── Thin Domain Wrappers ────────────────────────────────────────────────

export async function assertOwnsAccount(userId: string, accountId: string) {
  return assertOwnsResource({ 
    findById: async (id) => prisma.account.findUnique({ where: { id } }), 
    userId, 
    id: accountId, 
    resourceType: 'account' 
  });
}

export async function assertOwnsTransaction(userId: string, transactionId: string) {
  return assertOwnsResource({ 
    findById: async (id) => prisma.transaction.findUnique({ where: { id } }), 
    userId, 
    id: transactionId, 
    resourceType: 'transaction' 
  });
}

export async function assertOwnsCategory(userId: string, categoryId: string) {
  return assertOwnsResource({ 
    findById: async (id) => prisma.category.findUnique({ where: { id } }), 
    userId, 
    id: categoryId, 
    resourceType: 'category' 
  });
}

export async function assertOwnsBudget(userId: string, budgetId: string) {
  const { getBudgetById } = await import('./repositories/budgets');
  return assertOwnsResource({ 
    findById: async (id) => getBudgetById(id, userId), 
    userId, 
    id: budgetId, 
    resourceType: 'budget' 
  });
}

export async function assertOwnsGoal(userId: string, goalId: string) {
  return assertOwnsResource({ 
    findById: async (id) => prisma.goal.findUnique({ where: { id } }), 
    userId, 
    id: goalId, 
    resourceType: 'goal' 
  });
}

export async function assertOwnsLoan(userId: string, loanId: string) {
  return assertOwnsResource({ 
    findById: async (id) => prisma.loan.findUnique({ where: { id } }), 
    userId, 
    id: loanId, 
    resourceType: 'loan' 
  });
}

export async function assertOwnsTransfer(userId: string, transferId: string) {
  return assertOwnsResource({ 
    findById: async (id) => prisma.transfer.findUnique({ where: { id } }), 
    userId, 
    id: transferId, 
    resourceType: 'transfer' 
  });
}

export async function assertOwnsAsset(userId: string, assetId: string) {
  return assertOwnsResource({ 
    findById: async (id) => prisma.asset.findUnique({ where: { id } }), 
    userId, 
    id: assetId, 
    resourceType: 'asset' 
  });
}
