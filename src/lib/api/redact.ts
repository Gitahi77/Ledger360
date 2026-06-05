// src/lib/api/redact.ts
// Strip personally identifying data before sending text to an external AI (I-10).
// Kenyan phone formats, account/ID-like number runs, and M-Pesa codes are masked.
export function redactForAI(input: string): string {
  return input
    // Kenyan phone numbers: 07xx/01xx, +2547xx, 2547xx
    .replace(/(?:\+?254|0)[17]\d{8}\b/g, '[PHONE]')
    // Long digit runs (account/ID numbers, 6+ digits) — keep small amounts intact
    .replace(/\b\d{6,}\b/g, '[NUMBER]')
    // M-Pesa confirmation codes (10 alphanumerics, upper) — keep but mark optional
    .replace(/\b[A-Z0-9]{10}\b/g, '[REF]');
}
// NOTE: amounts and dates are intentionally preserved — they are needed for parsing
// and are not identifying on their own once names/phones/accounts are removed.
