import { describe, it, expect } from 'vitest';
import { ParsedTransactionSchema, ParsedDocTransactionSchema } from '@/lib/api/gemini';

describe('Gemini ParsedTransactionSchema', () => {
  it('validates a well-formed parsed M-Pesa transaction', () => {
    const validData = {
      name: 'Send Money - JOHN KAMAU',
      date: '2024-05-15',
      amount: 1500,
      type: 'expense',
      category: 'Transfer',
      fee: 22,
      ref: 'QWE123RTY4',
      balance: 15000,
      raw: 'QWE123RTY4 Confirmed. Ksh1,500.00 sent to JANE DOE 0712345678 on 15/5/24 at 10:30 AM.'
    };
    
    const result = ParsedTransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects negative amounts', () => {
    const invalidData = {
      name: 'Invalid Amount',
      date: '2024-05-15',
      amount: -500,
      type: 'expense',
      category: 'Transfer',
      raw: 'Some raw string'
    };
    
    const result = ParsedTransactionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rejects invalid transaction types', () => {
    const invalidData = {
      name: 'Invalid Type',
      date: '2024-05-15',
      amount: 500,
      type: 'unknown_type', // not income, expense, or transfer
      category: 'Transfer',
      raw: 'Some raw string'
    };
    
    const result = ParsedTransactionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('allows missing optional fields', () => {
    const validData = {
      name: 'Minimal transaction',
      date: '2024-05-15',
      amount: 1500,
      type: 'income',
      category: 'Salary',
      raw: 'Some raw string'
    };
    // fee, ref, balance are missing
    const result = ParsedTransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe('Gemini ParsedDocTransactionSchema', () => {
  it('validates a well-formed bank document transaction', () => {
    const validData = {
      name: 'KPLC PREPAID',
      date: '2024-06-01',
      amount: 1000,
      type: 'expense',
      category: 'Utilities'
    };
    
    const result = ParsedDocTransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields (no raw field here)', () => {
    const invalidData = {
      name: 'Missing fields',
      amount: 1000
    };
    
    const result = ParsedDocTransactionSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
