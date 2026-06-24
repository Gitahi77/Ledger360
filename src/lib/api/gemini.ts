// src/lib/api/gemini.ts
// Google Gemini AI client — replaces OpenAI for SmartUpload & M-Pesa parsing
// Free tier: 1 million tokens/day via Gemini 1.5 Flash
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { z } from 'zod';

const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? '';

function getClient() {
  if (!API_KEY) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set in .env');
  return new GoogleGenerativeAI(API_KEY);
}

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/* ─── M-Pesa SMS Parser ─────────────────────────────────────── */
export const ParsedTransactionSchema = z.object({
  name: z.string(),
  date: z.string(),
  amount: z.number().positive(),
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.string(),
  fee: z.number().optional(),
  ref: z.string().optional(),
  balance: z.number().optional(),
  raw: z.string(),
});
export type ParsedTransaction = z.infer<typeof ParsedTransactionSchema>;

const SMS_PROMPT = `You are a Kenyan personal finance assistant. Parse the following M-Pesa SMS messages into structured JSON.

Return a JSON array of transaction objects. Each object must have:
- name: string (descriptive label e.g. "Send Money - JOHN KAMAU", "Paybill - KPLC", "Buy Goods - Naivas", "M-Pesa Withdrawal - Agent")
- date: string (ISO format YYYY-MM-DD, infer year if missing — assume current year)
- amount: number (always positive)
- type: "income" | "expense" | "transfer"
  - income: received money, reversal, salary deposit
  - expense: sent money, paybill, buy goods, withdrawal, airtime, Fuliza
  - transfer: moving money between own accounts or depositing to own savings
- category: one of: Food & Grocery, Transport, Utilities, Entertainment, Health, Rent, Clothing, Savings, Transfer, Salary, Business, Airtime, Loan Repayment, Other
- fee: number (transaction cost if mentioned, else omit)
- ref: string (M-Pesa confirmation code e.g. "FG7K2X8L", else omit)
- balance: number (new M-PESA balance if mentioned, else omit)
- raw: string (the original SMS text, verbatim)

IMPORTANT RULES:
- Moving money to own savings or another own account is "transfer", category "Transfer" or "Savings"
- Fuliza deductions are "expense", category "Loan Repayment"
- Received money from another person is "income", category "Transfer"
- Buy Goods / Paybill / Till payments are "expense"
- Airtime purchase is "expense", category "Airtime"
- Withdrawals from agents or ATMs are "expense"
- DO NOT include the transaction fee as a separate transaction — just add it to the fee field

Return ONLY a valid JSON array. No markdown, no explanation.`;

export async function parseMpesaSms(smsText: string, signal?: AbortSignal): Promise<ParsedTransaction[]> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    safetySettings: SAFETY,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
  });

  const result = await model.generateContent(`${SMS_PROMPT}\n\nSMS MESSAGES:\n${smsText}`, { signal });
  const text = result.response.text().trim();

  try {
    const parsed = JSON.parse(text);
    const parsedArray = Array.isArray(parsed) ? parsed : [];
    
    // Validate each item, skipping invalid ones
    const validTransactions: ParsedTransaction[] = [];
    for (const item of parsedArray) {
      const parsedItem = ParsedTransactionSchema.safeParse(item);
      if (parsedItem.success) {
        validTransactions.push(parsedItem.data);
      }
    }
    return validTransactions;
  } catch {
    console.error('[Gemini SMS] Failed to parse response from Gemini. It was not valid JSON.');
    return [];
  }
}

/* ─── Document / Image Parser (replaces OpenAI Vision) ─────── */
export const ParsedDocTransactionSchema = z.object({
  name: z.string(),
  date: z.string(),
  amount: z.number().positive(),
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.string(),
});
export type ParsedDocTransaction = z.infer<typeof ParsedDocTransactionSchema>;

const DOC_PROMPT = `You are a Kenyan personal finance assistant. Extract ALL financial transactions from this bank statement, receipt, or financial document.

Return a JSON array. Each item must have:
- name: string (short description of the transaction)
- date: string (YYYY-MM-DD)
- amount: number (positive)
- type: "income" | "expense" | "transfer"
- category: one of: Food & Grocery, Transport, Utilities, Entertainment, Health, Rent, Clothing, Savings, Transfer, Salary, Business, Airtime, Loan Repayment, Other

Kenya-specific rules:
- Internal transfers between own accounts or to own savings = transfer
- M-Pesa paybill/till = expense
- Salary/payroll credit = income
- KPLC / Zuku / Safaricom = Utilities
- Naivas / Carrefour / Quickmart = Food & Grocery
- Uber / Bolt / matatu = Transport
- SHA / hospital = Health
- Fuliza = Loan Repayment

Return ONLY a valid JSON array. No markdown, no explanation. If no transactions found, return [].`;

export async function parseDocumentWithGemini(
  fileBase64: string,
  mimeType: string,
  signal?: AbortSignal
): Promise<ParsedDocTransaction[]> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    safetySettings: SAFETY,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
  });

  const result = await model.generateContent([
    DOC_PROMPT,
    { inlineData: { data: fileBase64, mimeType } },
  ], { signal });
  const text = result.response.text().trim();

  try {
    const parsed = JSON.parse(text);
    const parsedArray = Array.isArray(parsed) ? parsed : [];
    
    // Validate each item, skipping invalid ones
    const validTransactions: ParsedDocTransaction[] = [];
    for (const item of parsedArray) {
      const parsedItem = ParsedDocTransactionSchema.safeParse(item);
      if (parsedItem.success) {
        validTransactions.push(parsedItem.data);
      }
    }
    return validTransactions;
  } catch {
    console.error('[Gemini Doc] Failed to parse document from Gemini. It was not valid JSON.');
    return [];
  }
}

/* ─── Simple text prompt ─────────────────────────────────────── */
export async function geminiPrompt(prompt: string): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    safetySettings: SAFETY,
  });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
