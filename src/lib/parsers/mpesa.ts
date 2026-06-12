// src/lib/parsers/mpesa.ts
// Deterministic parser for M-Pesa SMS and *334# PDF statements
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { toMinor, toMajor } from '../money';

export interface ParsedMpesaTransaction {
  date: string; // YYYY-MM-DD
  name: string;
  amount: number; // MAJOR units (for UI/API compatibility, but parsed via minor units)
  type: 'income' | 'expense' | 'transfer';
  category: string;
  reference?: string;
  fee?: number; // MAJOR units
}

const DICTIONARY: { pattern: RegExp; category: string; type: 'income' | 'expense' | 'transfer' }[] = [
  // Health (SHA 200222, replacing NHIF)
  { pattern: /\bSHA\b|200222/i, category: 'Health', type: 'expense' },
  // Government
  { pattern: /\b(KRA|eCitizen|NTSA|NSSF)\b/i, category: 'Government', type: 'expense' },
  // Utilities
  { pattern: /\b(KPLC|Nairobi Water|Safaricom|Zuku|DStv|GOtv)\b/i, category: 'Utilities', type: 'expense' },
  // Supermarkets
  { pattern: /\b(Naivas|Quickmart|Carrefour|Chandarana)\b/i, category: 'Food & Grocery', type: 'expense' },
  // Transport/Fuel
  { pattern: /\b(Uber|Bolt|Little|Shell|Total|Rubis)\b/i, category: 'Transport', type: 'expense' },
  // Streaming
  { pattern: /\b(Netflix|Showmax|Spotify)\b/i, category: 'Entertainment', type: 'expense' },
  // Betting
  { pattern: /\b(SportPesa|Betika|Odibets)\b/i, category: 'Entertainment', type: 'expense' },
  // Mobile Credit
  { pattern: /\b(Fuliza|M-Shwari|KCB M-Pesa|Hustler Fund|Tala|Branch|Zenka)\b/i, category: 'Loan Repayment', type: 'expense' },
];

function determineCategory(name: string, defaultType: 'income' | 'expense' | 'transfer'): { category: string; type: 'income' | 'expense' | 'transfer' } {
  for (const rule of DICTIONARY) {
    if (rule.pattern.test(name)) {
      return { category: rule.category, type: rule.type };
    }
  }
  return { 
    category: defaultType === 'income' ? 'Income' : 'General', 
    type: defaultType 
  };
}

function parseAmountToMajorSafe(str: string): number {
  const cleaned = str.replace(/[^\d.]/g, '');
  if (!cleaned) return 0;
  // Parse through minor units to prevent float issues as per Invariant I-1
  const minor = toMinor(parseFloat(cleaned));
  return toMajor(minor);
}

function parseDateStr(dateStr: string): string | null {
  // expects DD/MM/YY or DD/MM/YYYY
  const parts = dateStr.split('/');
  if (parts.length >= 3) {
    let year = parts[2].split(' ')[0];
    if (year.length === 2) year = '20' + year;
    const month = parts[1].padStart(2, '0');
    const day = parts[0].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return null;
}

export function parseMpesaSms(sms: string): ParsedMpesaTransaction[] {
  const transactions: ParsedMpesaTransaction[] = [];
  const lines = sms.split('\n').map(l => l.trim()).filter(Boolean);

  const sendRe = /^([A-Z0-9]{8,12})\s+Confirmed\.\s*(?:Ksh|KES)\s*([\d,.]+)\s+sent\s+to\s+(.+?)(?:\s+[\dX]+)?\s+on\s+([\d/]+)\s+at/i;
  const receiveRe = /^([A-Z0-9]{8,12})\s+Confirmed\.\s+You\s+have\s+received\s+(?:Ksh|KES)\s*([\d,.]+)\s+from\s+(.+?)(?:\s+[\dX]+)?\s+on\s+([\d/]+)\s+at/i;
  const paybillRe = /^([A-Z0-9]{8,12})\s+Confirmed\.\s*(?:Ksh|KES)\s*([\d,.]+)\s+paid\s+to\s+(.+?)\s+on\s+([\d/]+)\s+at/i;
  const withdrawRe = /^([A-Z0-9]{8,12})\s+Confirmed\.\s+on\s+([\d/]+)\s+at.+?Withdraw\s+(?:Ksh|KES)\s*([\d,.]+)\s+from\s+(.+?)\./i;
  const fulizaRepayRe = /^([A-Z0-9]{8,12})\s+Confirmed\.\s*(?:Ksh|KES)\s*([\d,.]+)\s+deducted.+?on\s+([\d/]+)\s+at/i;

  for (const line of lines) {
    let match = sendRe.exec(line);
    if (match) {
      const [, ref, amountStr, nameRaw, dateStr] = match;
      const amount = parseAmountToMajorSafe(amountStr);
      const date = parseDateStr(dateStr);
      const name = nameRaw.replace(/\(paybill.+/i, '').trim();
      const { category, type } = determineCategory(name, 'expense');
      if (date) transactions.push({ date, name, amount, type, category, reference: ref });
      continue;
    }

    match = receiveRe.exec(line);
    if (match) {
      const [, ref, amountStr, nameRaw, dateStr] = match;
      const amount = parseAmountToMajorSafe(amountStr);
      const date = parseDateStr(dateStr);
      const name = nameRaw.replace(/\(paybill.+/i, '').trim();
      const { category, type } = determineCategory(name, 'income');
      if (date) transactions.push({ date, name, amount, type, category, reference: ref });
      continue;
    }

    match = paybillRe.exec(line);
    if (match) {
      const [, ref, amountStr, nameRaw, dateStr] = match;
      const amount = parseAmountToMajorSafe(amountStr);
      const date = parseDateStr(dateStr);
      const name = nameRaw.replace(/\(paybill.+/i, '').replace(/\.$/, '').trim();
      const { category, type } = determineCategory(name, 'expense');
      if (date) transactions.push({ date, name, amount, type, category, reference: ref });
      continue;
    }

    match = withdrawRe.exec(line);
    if (match) {
      const [, ref, dateStr, amountStr, nameRaw] = match;
      const amount = parseAmountToMajorSafe(amountStr);
      const date = parseDateStr(dateStr);
      const name = nameRaw.trim();
      if (date) transactions.push({ date, name, amount, type: 'expense', category: 'Cash Withdrawal', reference: ref });
      continue;
    }

    match = fulizaRepayRe.exec(line);
    if (match) {
      const [, ref, amountStr, dateStr] = match;
      const amount = parseAmountToMajorSafe(amountStr);
      const date = parseDateStr(dateStr);
      if (date) transactions.push({ date, name: 'Fuliza Repayment', amount, type: 'expense', category: 'Loan Repayment', reference: ref });
      continue;
    }
  }

  return transactions;
}

export function parseMpesaPdfStatement(text: string): ParsedMpesaTransaction[] | null {
  // Check if it looks like the official *334# statement
  if (!text.includes('M-PESA STATEMENT') && !text.includes('Customer transactions')) {
    return null; // Fallthrough
  }

  const transactions: ParsedMpesaTransaction[] = [];
  const lines = text.split('\n');

  // Regex to match a standard M-Pesa PDF line:
  // QJK34RFT 17/05/2026 14:23 Payment to Till 123456 NAIVAS -2,500.00 48,230.00
  // Note: Reference usually at start, then Date Time, then Details, then Amount, then Balance
  const statementLineRe = /^([A-Z0-9]{8,12})\s+(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})\s+\d{2}:\d{2}\s+(.+?)\s+([+-]?[\d,]+\.\d{2})\s+[\d,]+\.\d{2}/;
  
  for (const line of lines) {
    const match = statementLineRe.exec(line.trim());
    if (match) {
      const [, ref, dateStr, details, amountStr] = match;
      const amountRaw = parseFloat(amountStr.replace(/,/g, ''));
      const amount = parseAmountToMajorSafe(Math.abs(amountRaw).toString());
      const type = amountRaw < 0 ? 'expense' : 'income';
      
      let date = dateStr;
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        date = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }

      const { category, type: dictType } = determineCategory(details.trim(), type);

      transactions.push({
        date,
        name: details.trim(),
        amount,
        type: dictType,
        category,
        reference: ref
      });
    }
  }

  return transactions.length > 0 ? transactions : null;
}
