import { describe, it, expect } from 'vitest';
import { toMoneyDTO, toDateDTO } from '@/lib/mappers/core';
import { mapAccountToDTO } from '@/lib/mappers/accounts';
import { mapLoanToDTO } from '@/lib/mappers/loans';
import { AccountType } from '@prisma/client';

describe('DTO Serialization Verification', () => {
  it('toMoneyDTO should convert BigInt to Number without leaking BigInt', () => {
    const minor = 1000n;
    const result = toMoneyDTO(minor);
    expect(typeof result).toBe('number');
    expect(result).toBe(1000);
    
    // JSON.stringify will throw if BigInt is present
    expect(() => JSON.stringify(result)).not.toThrow();
  });

  it('toDateDTO should convert Date to ISO string without leaking Date objects', () => {
    const date = new Date('2024-01-01T00:00:00.000Z');
    const result = toDateDTO(date);
    expect(typeof result).toBe('string');
    expect(result).toBe('2024-01-01T00:00:00.000Z');
    expect((result as any) instanceof Date).toBe(false);
  });

  it('mapAccountToDTO should return a POJO without BigInts or Dates', () => {
    const mockPrismaAccount: any = {
      id: 'acc-1',
      name: 'Checking',
      type: AccountType.CHECKING,
      currency: 'KES',
      userId: 'user-1',
      openingMinor: 1000n,
      allowNegativeBalance: false,
      archived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      balanceMinor: 2500, // Augmented by our queries
      displayBalance: 'KES 25.00',
      isOverdrawn: false,
      availableBalanceMinor: 2500,
    };

    const dto = mapAccountToDTO(mockPrismaAccount);

    expect(typeof dto.openingMoney.amountMinor).toBe('number');
    expect(typeof dto.balanceMoney.amountMinor).toBe('number');
    expect(typeof dto.createdAt).toBe('string');
    expect((dto as any).updatedAt).toBeUndefined(); // updatedAt not mapped in DTO
    expect((dto.createdAt as any) instanceof Date).toBe(false);
    
    // Verify JSON stringifiability
    expect(() => JSON.stringify(dto)).not.toThrow();
  });

  it('mapLoanToDTO should return a POJO without BigInts or Dates', () => {
    const mockPrismaLoan = {
      id: 'loan-1',
      name: 'Personal Loan',
      lender: 'Bank',
      type: 'PERSONAL',
      originalAmountMinor: 100000n,
      balanceMinor: 50000n,
      annualRate: 12,
      amortization: 'FIXED',
      monthlyPaymentMinor: 5000n,
      nextDue: new Date(),
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      daysOverdue: 0
    };

    const dto = mapLoanToDTO(mockPrismaLoan);

    expect(typeof dto.originalMoney.amountMinor).toBe('number');
    expect(typeof dto.balanceMoney.amountMinor).toBe('number');
    expect(typeof dto.monthlyPaymentMoney.amountMinor).toBe('number');
    expect(typeof dto.nextDue).toBe('string');
    expect(typeof dto.createdAt).toBe('string');
    expect((dto.nextDue as any) instanceof Date).toBe(false);
    
    // Verify JSON stringifiability
    expect(() => JSON.stringify(dto)).not.toThrow();
  });
});
