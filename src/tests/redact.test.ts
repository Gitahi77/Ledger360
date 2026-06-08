import { describe, it, expect } from 'vitest';
import { redactForAI } from '@/lib/api/redact';

describe('redactForAI', () => {
  it('masks Kenyan phone numbers', () => {
    const input = 'Call me at 0712345678 or +254712345678 or 254712345678 or 0112345678';
    const result = redactForAI(input);
    expect(result).toBe('Call me at [PHONE] or [PHONE] or [PHONE] or [PHONE]');
  });

  it('masks long digit runs (6+ digits) as account/ID numbers', () => {
    const input = 'Paid for invoice 123456 to account 987654321';
    const result = redactForAI(input);
    expect(result).toBe('Paid for invoice [NUMBER] to account [NUMBER]');
  });

  it('masks 10-character alphanumeric M-Pesa confirmation codes', () => {
    const input = 'QWE123RTY4 Confirmed. Ksh 5,000 sent to John';
    const result = redactForAI(input);
    expect(result).toBe('[REF] Confirmed. Ksh 5,000 sent to John');
  });

  it('does NOT over-redact amounts (less than 6 digits)', () => {
    const input = 'Paid Ksh 5,000 or Ksh 12345 to merchant';
    const result = redactForAI(input);
    // 5,000 stays (separated by comma), 12345 is 5 digits so it stays
    expect(result).toBe('Paid Ksh 5,000 or Ksh 12345 to merchant');
  });

  it('does NOT over-redact dates', () => {
    const input = 'Transaction on 2024-05-15 or 15/05/2024';
    const result = redactForAI(input);
    // These sequences are less than 6 contiguous digits, so they are not redacted
    expect(result).toBe('Transaction on 2024-05-15 or 15/05/2024');
  });

  it('handles a full M-Pesa SMS example correctly', () => {
    const sms = 'QWE123RTY4 Confirmed. Ksh1,500.00 sent to JANE DOE 0712345678 on 15/5/24 at 10:30 AM. New M-PESA balance is Ksh15,000.00. Transaction cost, Ksh22.00.';
    const result = redactForAI(sms);
    expect(result).toBe('[REF] Confirmed. Ksh1,500.00 sent to JANE DOE [PHONE] on 15/5/24 at 10:30 AM. New M-PESA balance is Ksh15,000.00. Transaction cost, Ksh22.00.');
  });
});
