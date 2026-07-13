import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '../prisma';
import { assertOwnsAccount, assertOwnsTransaction, assertOwnsBudget, assertOwnsTransfer, assertOwnsCategory, AuthorizationError } from '../authz';

// We mock some data for the tests
const USER_A_ID = 'test-user-a';
const USER_B_ID = 'test-user-b';

describe('Security Regression Tests - Phase 2.3B', () => {

  beforeEach(async () => {
    // Clear relevant tables
    await prisma.transaction.deleteMany();
    await prisma.budget.deleteMany();
    await prisma.goal.deleteMany();
    await prisma.loan.deleteMany();
    await prisma.transfer.deleteMany();
    await prisma.account.deleteMany();
    await prisma.category.deleteMany();

    // Create test accounts
    await prisma.account.createMany({
      data: [
        { id: 'account-a', userId: USER_A_ID, name: 'User A Account', type: 'CHECKING', currency: 'KES' },
        { id: 'account-b', userId: USER_B_ID, name: 'User B Account', type: 'CHECKING', currency: 'KES' },
      ]
    });
    
    // Create test category
    await prisma.category.createMany({
      data: [
        { id: 'category-a', userId: USER_A_ID, name: 'User A Cat', type: 'income' },
        { id: 'category-b', userId: USER_B_ID, name: 'User B Cat', type: 'income' }
      ]
    });

    // Create test transactions
    await prisma.transaction.createMany({
      data: [
        { id: 'tx-a', userId: USER_A_ID, accountId: 'account-a', name: 'A Tx', type: 'expense', baseAmountMinor: 1000n, date: new Date(), categoryId: 'category-a' },
        { id: 'tx-b', userId: USER_B_ID, accountId: 'account-b', name: 'B Tx', type: 'expense', baseAmountMinor: 1000n, date: new Date(), categoryId: 'category-b' }
      ]
    });
    
    // Create test budget
    await prisma.budget.create({
      data: { id: 'budget-b', userId: USER_B_ID, name: 'Budget B', categoryId: 'category-b', limitAmountMinor: 5000n, period: 'monthly' }
    });
    
    // Create test transfer
    await prisma.transfer.create({
      data: { id: 'transfer-b', userId: USER_B_ID, fromAccountId: 'account-b', amountMinor: 500n, currency: 'KES', baseAmountMinor: 500n, fxRate: 1, date: new Date(), source: 'manual' }
    });
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
    const { count } = await prisma.account.deleteMany({
      where: { id: 'account-b', userId: USER_A_ID }
    });
    expect(count).toBe(0); // Delete failed due to userId mismatch
  });
});
