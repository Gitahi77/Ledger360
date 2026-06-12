import { describe, it, expect } from 'vitest';
import { parseMpesaSms, parseMpesaPdfStatement } from '../lib/parsers/mpesa';

describe('M-Pesa Deterministic Parser', () => {
  it('parses Send Money SMS correctly', () => {
    const sms = `FG7K2X8L Confirmed. Ksh1,500.00 sent to JOHN KAMAU 0722XXXXXX on 27/5/25 at 3:14 PM. New M-PESA balance is Ksh8,432.00. Transaction cost, Ksh27.00.`;
    const result = parseMpesaSms(sms);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      reference: 'FG7K2X8L',
      amount: 1500, // major units handled via minor parsing invariant
      name: 'JOHN KAMAU',
      date: '2025-05-27',
      type: 'expense',
      category: 'General',
    });
  });

  it('parses Receive Money SMS correctly', () => {
    const sms = `QK3P9XY2 Confirmed. You have received Ksh5,000.00 from JANE WANJIKU 0733XXXXXX on 27/5/25 at 9:02 AM. New M-PESA balance is Ksh13,432.00.`;
    const result = parseMpesaSms(sms);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      reference: 'QK3P9XY2',
      amount: 5000,
      name: 'JANE WANJIKU',
      date: '2025-05-27',
      type: 'income',
      category: 'Income',
    });
  });

  it('parses Paybill SMS correctly with dictionary match', () => {
    const sms = `RN5M4HJ1 Confirmed. Ksh2,000.00 paid to KPLC. on 26/5/25 at 7:45 PM. New M-PESA balance is Ksh11,432.00. Transaction cost, Ksh33.00.`;
    const result = parseMpesaSms(sms);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      reference: 'RN5M4HJ1',
      amount: 2000,
      name: 'KPLC',
      date: '2025-05-26',
      type: 'expense',
      category: 'Utilities',
    });
  });

  it('parses Paybill format with (paybill number) correctly', () => {
    const sms = `RN5M4HJ2 Confirmed. Ksh1,000.00 paid to Safaricom(paybill number 888880) on 26/5/25 at 8:00 PM.`;
    const result = parseMpesaSms(sms);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      reference: 'RN5M4HJ2',
      amount: 1000,
      name: 'Safaricom',
      date: '2025-05-26',
      type: 'expense',
      category: 'Utilities', // Correct dictionary match
    });
  });

  it('parses Buy Goods with merchant dictionary match', () => {
    const sms = `AB1C2D3E Confirmed. Ksh500.00 paid to Naivas Supermarket. on 25/5/25 at 12:00 PM.`;
    const result = parseMpesaSms(sms);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      reference: 'AB1C2D3E',
      amount: 500,
      name: 'Naivas Supermarket',
      date: '2025-05-25',
      type: 'expense',
      category: 'Food & Grocery',
    });
  });

  it('parses SHA (Paybill 200222) health dictionary match', () => {
    const sms = `SH8A7B6C Confirmed. Ksh1,000.00 paid to 200222. on 20/5/25 at 10:00 AM.`;
    const result = parseMpesaSms(sms);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      reference: 'SH8A7B6C',
      amount: 1000,
      name: '200222',
      date: '2025-05-20',
      category: 'Health',
    });
  });

  it('parses Withdraw SMS correctly', () => {
    const sms = `CD4E5F6G Confirmed. on 24/5/25 at 10:00 AM Withdraw Ksh5,000.00 from 123456 - Agent Name. New M-PESA balance is Ksh100.00.`;
    const result = parseMpesaSms(sms);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      reference: 'CD4E5F6G',
      amount: 5000,
      name: '123456 - Agent Name',
      date: '2025-05-24',
      type: 'expense',
      category: 'Cash Withdrawal',
    });
  });

  it('parses Fuliza SMS correctly', () => {
    const sms = `FG7K2X8L Confirmed. Ksh1,500.50 deducted from your M-PESA account to repay your Fuliza M-PESA on 27/5/25 at 3:14 PM.`;
    const result = parseMpesaSms(sms);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      reference: 'FG7K2X8L',
      amount: 1500.5,
      name: 'Fuliza Repayment',
      date: '2025-05-27',
      type: 'expense',
      category: 'Loan Repayment',
    });
  });

  it('ignores unrecognized SMS formats', () => {
    const sms = `Dear Customer, your M-PESA limit has been increased.`;
    const result = parseMpesaSms(sms);
    expect(result).toHaveLength(0);
  });

  it('parses *334# PDF statements correctly', () => {
    const pdfText = `
M-PESA STATEMENT
Customer transactions
QJK34RFT 17/05/2026 14:23 Payment to Till 123456 NAIVAS -2,500.00 48,230.00
QJK34RFU 17/05/2026 15:00 Receive from Jane +1,000.00 49,230.00
`;
    const result = parseMpesaPdfStatement(pdfText);
    expect(result).not.toBeNull();
    expect(result).toHaveLength(2);
    expect(result![0]).toMatchObject({
      reference: 'QJK34RFT',
      date: '2026-05-17',
      name: 'Payment to Till 123456 NAIVAS',
      amount: 2500,
      type: 'expense',
      category: 'Food & Grocery'
    });
    expect(result![1]).toMatchObject({
      reference: 'QJK34RFU',
      date: '2026-05-17',
      name: 'Receive from Jane',
      amount: 1000,
      type: 'income',
      category: 'Income'
    });
  });

  it('returns null for non-M-Pesa PDFs to allow fallback', () => {
    const pdfText = `Invoice for services rendered\nTotal: KES 5000`;
    const result = parseMpesaPdfStatement(pdfText);
    expect(result).toBeNull();
  });
});
