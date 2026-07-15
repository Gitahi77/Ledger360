import { describe, it, expect, vi } from 'vitest';
import { getLoansForUser } from '../lib/queries/loans';
import { prisma } from '../lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    loan: {
      findMany: vi.fn(),
    },
    transfer: {
      groupBy: vi.fn(),
    },
  },
}));

describe('getLoansForUser', () => {
  it('handles Prisma BigInt aggregation values without crashing', async () => {
    // 1. Mock the DB returning a loan
    vi.mocked(prisma.loan.findMany).mockResolvedValue([
      {
        id: 'loan-1',
        userId: 'user-1',
        balanceMinor: 10000n, // Prisma returns BigInt for the column
        originalAmountMinor: 10000n,
        // ... other required fields mocked as needed
      } as any
    ]);

    // 2. Mock the DB returning real BigInt aggregation results (simulating Postgres behavior)
    vi.mocked(prisma.transfer.groupBy).mockResolvedValue([
      {
        loanId: 'loan-1',
        _sum: {
          baseAmountMinor: 5000n as unknown as number, // Vitest mocks previously used Number 5000
          interestMinor: null as unknown as number, // Prisma returns null when no interest exists
        }
      } as any
    ]);

    // 3. Ensure it computes the balance correctly without throwing a TypeError
    const loans = await getLoansForUser({ userId: 'user-1' });

    expect(loans).toHaveLength(1);
    expect(loans[0].balanceMoney.amountMinor).toBe(5000); // 10000 - 5000
    // If the BigInt fix was missing, the line above would never be reached 
    // because getLoansForUser would throw: TypeError: Cannot mix BigInt and other types
  });
});
