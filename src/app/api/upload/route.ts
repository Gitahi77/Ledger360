// src/app/api/upload/route.ts
// Smart Upload Pipeline — supports CSV, Excel (.xlsx/.xls) and PDF without AI key.
// If OPENAI_API_KEY is set, PDF/image screenshots also go through GPT-4o Vision.

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const maxDuration = 60; // allow up to 60s for AI processing

/* ── Category keyword map ────────────────────────────────── */
const CATEGORY_RULES: { pattern: RegExp; category: string; type: 'income' | 'expense' }[] = [
  // Income
  { pattern: /salary|payroll|wage|pay slip/i,         category: 'Salary',        type: 'income'  },
  { pattern: /freelance|consulting|invoice/i,          category: 'Freelance',     type: 'income'  },
  { pattern: /dividend|interest earned|investment/i,   category: 'Business',      type: 'income'  },
  { pattern: /refund|cashback|reversal/i,              category: 'Salary',        type: 'income'  },
  { pattern: /received from|funds received|deposit/i,  category: 'Salary',        type: 'income'  },
  // Expenses
  { pattern: /naivas|carrefour|quickmart|grocery|supermarket|food|market|uchumi/i, category: 'Food & Grocery', type: 'expense' },
  { pattern: /uber|bolt|little|matatu|bus|petrol|fuel|parking|ntsa/i, category: 'Transport', type: 'expense' },
  { pattern: /kplc|electricity|water|sewage|internet|zuku|safaricom home|faiba|wifi/i, category: 'Utilities', type: 'expense' },
  { pattern: /netflix|spotify|showmax|dstv|youtube|gaming|cinema|tickets/i, category: 'Entertainment', type: 'expense' },
  { pattern: /hospital|clinic|pharmacy|doctor|dental|chemist|nhif|aar/i, category: 'Health', type: 'expense' },
  { pattern: /rent|landlord|lease|bnb|airbnb/i,        category: 'Rent',          type: 'expense' },
  { pattern: /java|artcaffe|chicken inn|kfc|pizza|restaurant|cafe|coffee|hotel|steers/i, category: 'Food & Grocery', type: 'expense' },
  { pattern: /gym|fitness|spa|salon|haircut|barber/i,   category: 'Health',        type: 'expense' },
  { pattern: /airtime|data bundle|safaricom|airtel|telkom|tkash/i, category: 'Utilities', type: 'expense' },
  { pattern: /school|tuition|university|college|fees|kcse/i, category: 'Health',  type: 'expense' },
  { pattern: /amazon|jumia|clothing|shoes|fashion|kilimall/i, category: 'Clothing', type: 'expense' },
  { pattern: /savings|goal|mpesa savings|fixed deposit|mmf|cic/i, category: 'Savings', type: 'expense' },
  // M-Pesa specific
  { pattern: /withdraw|agent|atm|cash out/i,           category: 'Food & Grocery', type: 'expense' },
  { pattern: /paybill|buy goods|till/i,                 category: 'Utilities',      type: 'expense' },
  { pattern: /send money|transfer to/i,                 category: 'Food & Grocery', type: 'expense' },
];

function autoCategory(description: string, amount: number): { category: string; type: 'income' | 'expense' } {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(description)) {
      return { category: rule.category, type: rule.type };
    }
  }
  return { category: amount > 0 ? 'Salary' : 'Food & Grocery', type: amount > 0 ? 'income' : 'expense' };
}

/* ── Normalise a raw row from any parser ─────────────────── */
interface RawRow {
  date: string;
  description: string;
  amount: number;
  type?: string;
}

function rowToTransaction(row: RawRow) {
  const { category, type } = autoCategory(row.description, row.amount);
  return {
    date:     row.date,
    name:     row.description.slice(0, 100),
    amount:   Math.abs(row.amount),
    type:     row.type ?? type,
    category,
    note:     'Imported via Smart Upload',
  };
}

/* ── Parse a date string flexibly ────────────────────────── */
function parseDate(raw: string): string | null {
  if (!raw) return null;
  // Try several date string formats
  const cleaned = raw.trim().replace(/\//g, '-');
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];

  // DD-MM-YYYY or DD/MM/YYYY
  const m = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (m) {
    const year  = m[3].length === 2 ? '20' + m[3] : m[3];
    const d2    = new Date(`${year}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`);
    if (!isNaN(d2.getTime())) return d2.toISOString().split('T')[0];
  }
  return null;
}

/* ── CSV / plain-text parser ─────────────────────────────── */
function parseCSVText(text: string): RawRow[] {
  const lines = text.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  let headerIdx = -1;
  let delimiter = ',';
  let cols: string[] = [];

  // Scan the first 15 lines to find the header row
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i].toLowerCase();
    if (/date|time/.test(line) && /amount|value|sum|debit|credit/.test(line)) {
      headerIdx = i;
      delimiter = lines[i].includes(';') ? ';' : lines[i].includes('\t') ? '\t' : ',';
      cols = lines[i].split(delimiter).map(c => c.trim().toLowerCase().replace(/['"]/g, ''));
      break;
    }
  }

  const dataLines = headerIdx >= 0 ? lines.slice(headerIdx + 1) : lines;
  
  // If no header found, default to comma and assume Date, Desc, Amount
  if (headerIdx === -1 && cols.length === 0) {
    const firstLine = lines[0] || '';
    delimiter = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';
  }

  const iDate   = cols.findIndex(c => /date|time/.test(c));
  const iDesc   = cols.findIndex(c => /description|narration|detail|reference|particulars|receipt/.test(c));
  const iAmount = cols.findIndex(c => /^amount$|^value$|^sum$/.test(c));
  const iDebit  = cols.findIndex(c => /debit|withdrawal|out|paid/.test(c));
  const iCredit = cols.findIndex(c => /credit|deposit|in|received/.test(c));
  const iPaidIn = cols.findIndex(c => /paid in/.test(c));
  const iPaidOut= cols.findIndex(c => /paid out/.test(c));

  const rows: RawRow[] = [];
  for (const line of dataLines) {
    const cells = line.split(delimiter).map(c => c.replace(/^"|"$/g, '').trim());
    if (cells.length < 2) continue;

    const dateStr = cells[iDate >= 0 ? iDate : 0];
    const desc    = cells[iDesc >= 0 ? iDesc : 1] || 'Unknown';
    let amount    = 0;
    let type: 'income' | 'expense' | undefined;

    if (iPaidOut >= 0 && iPaidIn >= 0) {
      // Barclays/ABSA style: PaidOut / PaidIn columns
      const out = parseFloat((cells[iPaidOut] || '').replace(/[^0-9.]/g, '')) || 0;
      const inp = parseFloat((cells[iPaidIn]  || '').replace(/[^0-9.]/g, '')) || 0;
      if (out > 0) { amount = out; type = 'expense'; }
      else if (inp > 0) { amount = inp; type = 'income'; }
    } else if (iDebit >= 0 && iCredit >= 0) {
      const debit  = parseFloat((cells[iDebit]  || '').replace(/[^0-9.]/g, '')) || 0;
      const credit = parseFloat((cells[iCredit] || '').replace(/[^0-9.]/g, '')) || 0;
      if (credit > 0) { amount = credit; type = 'income'; }
      else if (debit > 0) { amount = debit; type = 'expense'; }
    } else if (iAmount >= 0) {
      amount = parseFloat((cells[iAmount] || '').replace(/[^0-9.-]/g, '')) || 0;
    }

    if (amount === 0) continue;
    const date = parseDate(dateStr);
    if (!date) continue;

    rows.push({ date, description: desc, amount, type });
  }
  return rows;
}

/* ── Excel parser (.xlsx / .xls) ─────────────────────────── */
async function parseExcel(buffer: ArrayBuffer): Promise<RawRow[]> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(Buffer.from(buffer), { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  // Convert to CSV text and reuse the CSV parser — simpler & more flexible than AOA
  const csv = XLSX.utils.sheet_to_csv(sheet);
  return parseCSVText(csv);
}

/* ── PDF text extractor ──────────────────────────────────── */
async function parsePDF(buffer: ArrayBuffer): Promise<RawRow[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse/lib/pdf-parse');
    const { text } = await pdfParse(Buffer.from(buffer));
    if (!text || text.trim().length < 20) return [];

    // Attempt to parse as CSV-like text extracted from PDF
    const rows = parseCSVText(text);
    if (rows.length > 0) return rows;

    // Fallback: line-by-line amount pattern matching (common in M-Pesa statements)
    return parseMpesaStyle(text);
  } catch (err) {
    console.error('[SmartUpload PDF]', err);
    return [];
  }
}

/* ── M-Pesa statement line-by-line parser ────────────────── */
function parseMpesaStyle(text: string): RawRow[] {
  // M-Pesa PDFs look like:
  // 17/05/2026 QJK34RFT Payment to Till 123456 NAIVAS -2,500.00 48,230.00
  const rows: RawRow[] = [];
  const lines = text.split('\n');

  // Date pattern: DD/MM/YYYY or YYYY-MM-DD at start of a meaningful line
  const datePattern = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{2}[\/\-]\d{2})/;
  const amountPattern = /-?[\d,]+\.?\d{0,2}/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 10) continue;

    const dateMatch = trimmed.match(datePattern);
    if (!dateMatch) continue;

    const date = parseDate(dateMatch[1]);
    if (!date) continue;

    // Extract all numbers from the line
    const amounts = [...trimmed.matchAll(amountPattern)].map(m => parseFloat(m[0].replace(/,/g, '')));
    if (amounts.length === 0) continue;

    // The transaction amount is usually the first significant number after the description
    // Negative = expense, positive = income
    const amount = amounts.find(a => a !== 0);
    if (!amount) continue;

    // Description: everything between date and first number
    const afterDate = trimmed.slice(dateMatch.index! + dateMatch[1].length).trim();
    const desc = afterDate.replace(amountPattern, '').trim().slice(0, 100) || 'M-Pesa Transaction';

    rows.push({
      date,
      description: desc || 'M-Pesa Transaction',
      amount: Math.abs(amount),
      type: amount < 0 ? 'expense' : 'income',
    });
  }
  return rows;
}

/* ── GPT-4o Vision parser (requires OPENAI_API_KEY) ────────── */
async function parseWithAI(fileBuffer: ArrayBuffer, mimeType: string): Promise<any[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const base64 = Buffer.from(fileBuffer).toString('base64');
  const prompt = `You are a financial statement parser for Ledger360, a personal finance app used primarily in Kenya.

Extract ALL transactions from this bank statement/document.
Return a JSON array (no markdown, no explanation) with this exact structure:
[
  {
    "date": "YYYY-MM-DD",
    "name": "short merchant/description (max 60 chars)",
    "amount": 1234.56,
    "type": "income" or "expense",
    "category": one of: "Salary","Freelance","Business","Food & Grocery","Transport","Utilities","Entertainment","Health","Rent","Clothing","Savings",
    "note": "original description from statement"
  }
]

Rules:
- amount is always POSITIVE. type determines direction.
- Income: salary, deposits, refunds, credits, "received from".
- Expense: purchases, withdrawals, debits, fees, "paid to".
- Use context clues for category (e.g. "UBER" = Transport, "NAIVAS" = Food & Grocery).
- Skip balance rows, header rows, running totals.
- Date format MUST be YYYY-MM-DD.`;

  const isImage = mimeType.startsWith('image/');
  const messageContent = isImage ? [
    { type: 'text', text: prompt },
    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}`, detail: 'high' } },
  ] : [
    { type: 'text', text: `${prompt}\n\nDocument content:\n${Buffer.from(fileBuffer).toString('utf-8').substring(0, 8000)}` },
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-4o', messages: [{ role: 'user', content: messageContent }], max_tokens: 4000, temperature: 0 }),
  });

  if (!response.ok) { console.error('[SmartUpload AI]', await response.text()); return null; }

  const { choices } = await response.json();
  const raw = choices?.[0]?.message?.content ?? '';
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    console.error('[SmartUpload] Failed to parse AI response:', raw.substring(0, 500));
    return null;
  }
}

/* ── Main route handler ──────────────────────────────────── */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as any).id as string;

  try {
    const formData = await request.formData();
    const file     = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

    const mimeType   = file.type || 'application/octet-stream';
    const fileName   = file.name?.toLowerCase() ?? '';
    const fileBuffer = await file.arrayBuffer();

    let transactions: any[] = [];
    let method = 'csv';

    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || mimeType.includes('spreadsheet') || mimeType.includes('excel');
    const isPDF   = fileName.endsWith('.pdf') || mimeType === 'application/pdf';
    const isImage = mimeType.startsWith('image/');

    // 1. Excel → xlsx parser
    if (isExcel) {
      transactions = (await parseExcel(fileBuffer)).map(rowToTransaction);
      method = 'xlsx';
    }

    // 2. PDF → pdf-parse then M-Pesa pattern matching; optionally AI if key present
    if (transactions.length === 0 && isPDF) {
      // Try AI first if available
      const aiResult = process.env.OPENAI_API_KEY ? await parseWithAI(fileBuffer, mimeType) : null;
      if (aiResult?.length) {
        transactions = aiResult;
        method = 'ai';
      } else {
        // Fall back to pdf-parse text extraction
        transactions = (await parsePDF(fileBuffer)).map(rowToTransaction);
        method = 'pdf';
      }
    }

    // 3. Image → AI (if key present)
    if (transactions.length === 0 && isImage && process.env.OPENAI_API_KEY) {
      const aiResult = await parseWithAI(fileBuffer, mimeType);
      if (aiResult?.length) { transactions = aiResult; method = 'ai'; }
    }

    // 4. Fallback → CSV text parser (also catches .csv files)
    if (transactions.length === 0) {
      const text = Buffer.from(fileBuffer).toString('utf-8');
      transactions = parseCSVText(text).map(rowToTransaction);
      method = 'csv';
    }

    if (transactions.length === 0) {
      return NextResponse.json({
        error: 'Could not extract transactions. Please check:\n• CSV: must have Date, Description, Amount columns\n• Excel: first sheet with headers\n• PDF: if it\'s a scanned image, add OPENAI_API_KEY to enable AI parsing\n• M-Pesa statement: download as CSV from MySafaricom app',
      }, { status: 422 });
    }

    // Resolve category IDs for the user
    const categoryNames = [...new Set(transactions.map((t: any) => String(t.category)))];
    const existingCats  = await prisma.category.findMany({ where: { userId, name: { in: categoryNames } } });
    const catMap: Record<string, string> = Object.fromEntries(existingCats.map(c => [c.name, c.id]));

    for (const name of categoryNames) {
      if (!catMap[name]) {
        const cat = await prisma.category.create({
          data: { name, type: transactions.find((t: any) => t.category === name)?.type ?? 'expense', userId },
        });
        catMap[name] = cat.id;
      }
    }

    const fallbackId = catMap['Food & Grocery'] ?? catMap[categoryNames[0]];
    const parsed = transactions.map((t: any) => ({
      ...t,
      categoryId: catMap[String(t.category)] ?? fallbackId,
    }));

    return NextResponse.json({ success: true, transactions: parsed, count: parsed.length, method });

  } catch (err: any) {
    console.error('[SmartUpload]', err);
    return NextResponse.json({ error: `Processing failed: ${err.message ?? 'Unknown error'}` }, { status: 500 });
  }
}
