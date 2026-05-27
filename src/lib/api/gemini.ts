// src/lib/api/gemini.ts
// Google Gemini AI client — replaces OpenAI for SmartUpload & M-Pesa parsing
// Free tier: 1 million tokens/day via Gemini 1.5 Flash
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

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
export interface ParsedTransaction {
  name:     string;
  date:     string;       // ISO YYYY-MM-DD
  amount:   number;       // always positive
  type:     'income' | 'expense';
  category: string;
  fee?:     number;
  ref?:     string;       // M-Pesa confirmation code
  balance?: number;       // balance after transaction
  raw:      string;       // the original SMS line
}

const SMS_PROMPT = `You are a Kenyan personal finance assistant. Parse the following M-Pesa SMS messages into structured JSON.

Return a JSON array of transaction objects. Each object must have:
- name: string (descriptive label e.g. "Send Money - JOHN KAMAU", "Paybill - KPLC", "Buy Goods - Naivas", "M-Pesa Withdrawal - Agent")
- date: string (ISO format YYYY-MM-DD, infer year if missing — assume current year)
- amount: number (always positive)
- type: "income" | "expense" 
  - income: received money, reversal, salary deposit
  - expense: sent money, paybill, buy goods, withdrawal, airtime, Fuliza
- category: one of: Food & Grocery, Transport, Utilities, Entertainment, Health, Rent, Clothing, Savings, Transfer, Salary, Business, Airtime, Loan Repayment, Other
- fee: number (transaction cost if mentioned, else omit)
- ref: string (M-Pesa confirmation code e.g. "FG7K2X8L", else omit)
- balance: number (new M-PESA balance if mentioned, else omit)
- raw: string (the original SMS text, verbatim)

IMPORTANT RULES:
- Fuliza deductions are "expense", category "Loan Repayment"
- Received money from another person is "income", category "Transfer"
- Buy Goods / Paybill / Till payments are "expense"
- Airtime purchase is "expense", category "Airtime"
- Withdrawals from agents or ATMs are "expense"
- DO NOT include the transaction fee as a separate transaction — just add it to the fee field

Return ONLY a valid JSON array. No markdown, no explanation.`;

export async function parseMpesaSms(smsText: string): Promise<ParsedTransaction[]> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings: SAFETY,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
  });

  const result = await model.generateContent(`${SMS_PROMPT}\n\nSMS MESSAGES:\n${smsText}`);
  const text = result.response.text().trim();

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error('[Gemini SMS] Failed to parse response:', text);
    return [];
  }
}

/* ─── Document / Image Parser (replaces OpenAI Vision) ─────── */
export interface ParsedDocTransaction {
  name:     string;
  date:     string;
  amount:   number;
  type:     'income' | 'expense';
  category: string;
}

const DOC_PROMPT = `You are a Kenyan personal finance assistant. Extract ALL financial transactions from this bank statement, receipt, or financial document.

Return a JSON array. Each item must have:
- name: string (short description of the transaction)
- date: string (YYYY-MM-DD)
- amount: number (positive)
- type: "income" | "expense"
- category: one of: Food & Grocery, Transport, Utilities, Entertainment, Health, Rent, Clothing, Savings, Transfer, Salary, Business, Airtime, Loan Repayment, Other

Kenya-specific rules:
- M-Pesa paybill/till = expense
- Salary/payroll credit = income
- KPLC / Zuku / Safaricom = Utilities
- Naivas / Carrefour / Quickmart = Food & Grocery
- Uber / Bolt / matatu = Transport
- NHIF / hospital = Health
- Fuliza = Loan Repayment

Return ONLY a valid JSON array. No markdown, no explanation. If no transactions found, return [].`;

export async function parseDocumentWithGemini(
  fileBase64: string,
  mimeType: string
): Promise<ParsedDocTransaction[]> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings: SAFETY,
    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
  });

  const result = await model.generateContent([
    DOC_PROMPT,
    { inlineData: { data: fileBase64, mimeType } },
  ]);
  const text = result.response.text().trim();

  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error('[Gemini Doc] Failed to parse response:', text);
    return [];
  }
}

/* ─── Simple text prompt ─────────────────────────────────────── */
export async function geminiPrompt(prompt: string): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: 'gemini-1.5-flash',
    safetySettings: SAFETY,
  });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}
