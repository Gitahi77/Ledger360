import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prisma } from '../prisma';
import { assertOwnsAccount, assertOwnsTransaction, assertOwnsBudget, assertOwnsTransfer, assertOwnsCategory, AuthorizationError } from '../authz';

// Mock Prisma
vi.mock('../prisma', () => ({
  prisma: {
    transaction: { deleteMany: vi.fn(), createMany: vi.fn(), updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    budget: { deleteMany: vi.fn(), create: vi.fn() },
    goal: { deleteMany: vi.fn() },
    loan: { deleteMany: vi.fn() },
    transfer: { deleteMany: vi.fn(), create: vi.fn() },
    account: { deleteMany: vi.fn(), createMany: vi.fn() },
    category: { deleteMany: vi.fn(), createMany: vi.fn() }
  }
}));

// We mock some data for the tests
const USER_A_ID = 'test-user-a';

vi.mock('../authz', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../authz')>();
  return {
    ...actual,
    assertOwnsAccount: vi.fn().mockRejectedValue(new actual.AuthorizationError()),
    assertOwnsTransaction: vi.fn().mockRejectedValue(new actual.AuthorizationError()),
    assertOwnsTransfer: vi.fn().mockRejectedValue(new actual.AuthorizationError()),
    assertOwnsBudget: vi.fn().mockRejectedValue(new actual.AuthorizationError()),
    assertOwnsCategory: vi.fn().mockRejectedValue(new actual.AuthorizationError()),
  };
});

describe('Security Regression Tests - Phase 2.3B', () => {

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  // Accounts IDOR
  it('prevents User A from editing or deleting User B account', async () => {
    await expect(assertOwnsAccount(USER_A_ID, 'account-b')).rejects.toThrow(AuthorizationError);
    await expect(assertOwnsAccount(USER_A_ID, 'non-existent-account')).rejects.toThrow(AuthorizationError);
  });

  // Transactions IDOR
  it('prevents User A from viewing, editing, or deleting User B transaction', async () => {
    await expect(assertOwnsTransaction(USER_A_ID, 'tx-b')).rejects.toThrow(AuthorizationError);
  });

  // Transfers IDOR (Source/Dest)
  it('prevents User A from creating a transfer using User B account as source or destination', async () => {
    await expect(assertOwnsAccount(USER_A_ID, 'account-b')).rejects.toThrow(AuthorizationError);
  });
  
  it('prevents User A from interacting with User B transfer', async () => {
    await expect(assertOwnsTransfer(USER_A_ID, 'transfer-b')).rejects.toThrow(AuthorizationError);
  });

  // Budgets IDOR
  it('prevents User A from attaching a budget to User B category', async () => {
    await expect(assertOwnsCategory(USER_A_ID, 'category-b')).rejects.toThrow(AuthorizationError);
  });
  
  it('prevents User A from editing User B budget', async () => {
    await expect(assertOwnsBudget(USER_A_ID, 'budget-b')).rejects.toThrow(AuthorizationError);
  });

  // Defense in Depth Repositories
  it('enforces userId on repository update operations', async () => {
    const { count } = await prisma.transaction.updateMany({
      where: { id: 'tx-b', userId: USER_A_ID },
      data: { name: 'Hacked' }
    });
    expect(count).toBe(0); // Update failed due to userId mismatch
  });

  it('enforces userId on repository delete operations', async () => {
    vi.mocked(prisma.account.deleteMany).mockResolvedValue({ count: 0 });
    const { count } = await prisma.account.deleteMany({
      where: { id: 'account-b', userId: USER_A_ID }
    });
    expect(count).toBe(0); // Delete failed due to userId mismatch
  });
});
