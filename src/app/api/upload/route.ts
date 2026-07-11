// src/app/api/upload/route.ts
// Smart Upload Pipeline — supports CSV, Excel (.xlsx/.xls) and PDF without AI key.
// If GOOGLE_GENERATIVE_AI_API_KEY is set, PDF/image screenshots also go through Gemini Vision.

import { NextResponse } from 'next/server';

import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkLimit } from '@/lib/rateLimit';

export const maxDuration = 60; // allow up to 60s for AI processing

// 10 MB hard limit — prevents OOM on serverless functions
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Extracts magic number from file buffer to prevent MIME spoofing attacks.
 * Relies on the actual binary signature, not the user-provided MIME type.
 */
function getActualMimeType(buffer: ArrayBuffer | null, fallbackMime: string): string {
  if (!buffer || buffer.byteLength < 4) return fallbackMime;
  
  const arr = new Uint8Array(buffer).subarray(0, 4);
  const hex = Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

  if (hex.startsWith('89504E47')) return 'image/png';
  if (hex.startsWith('FFD8FF')) return 'image/jpeg';
  if (hex.startsWith('25504446')) return 'application/pdf';
  if (hex.startsWith('504B0304')) return 'application/zip'; // Excel/docx are ZIPs
  if (hex.startsWith('D0CF11E0')) return 'application/vnd.ms-excel'; // Legacy .xls
  
  // For text/csv where magic numbers don't exist, we fallback to the provided mime/filename
  return fallbackMime;
}

/* -- Category keyword map ---------------------------------- */
const CATEGORY_RULES: { pattern: RegExp; category: string; type: 'income' | 'expense' | 'transfer' }[] = [
  // Income
  { pattern: /salary|payroll|wage|pay slip/i,         category: 'Salary',           type: 'income'  },
  { pattern: /freelance|consulting|invoice/i,          category: 'Freelance',        type: 'income'  },
  { pattern: /dividend|interest earned|investment/i,   category: 'Investment',       type: 'income'  },
  { pattern: /refund|cashback|reversal/i,              category: 'Refund',           type: 'income'  },
  { pattern: /received from|funds received|deposit/i,  category: 'Income',           type: 'income'  },
  // Expenses
  { pattern: /naivas|carrefour|quickmart|grocery|supermarket|food|market/i, category: 'Food & Grocery', type: 'expense' },
  { pattern: /uber|bolt|little|matatu|bus|petrol|fuel|parking|ntsa/i, category: 'Transport', type: 'expense' },
  { pattern: /kplc|electricity|water|sewage|internet|zuku|safaricom home|faiba|wifi/i, category: 'Utilities', type: 'expense' },
  { pattern: /netflix|spotify|showmax|dstv|youtube|gaming|cinema|tickets/i, category: 'Entertainment', type: 'expense' },
  { pattern: /hospital|clinic|pharmacy|doctor|dental|chemist|\bsha\b|200222|aar/i, category: 'Health', type: 'expense' },
  { pattern: /rent|landlord|lease|bnb|airbnb/i,        category: 'Rent',             type: 'expense' },
  { pattern: /java|artcaffe|chicken inn|kfc|pizza|restaurant|cafe|coffee|hotel|steers/i, category: 'Food & Grocery', type: 'expense' },
  { pattern: /gym|fitness|spa|salon|haircut|barber/i,   category: 'Health',           type: 'expense' },
  { pattern: /airtime|data bundle|safaricom|airtel|telkom|tkash/i, category: 'Utilities', type: 'expense' },
  { pattern: /school|tuition|university|college|fees|kcse/i, category: 'Education',  type: 'expense' },
  { pattern: /amazon|jumia|clothing|shoes|fashion|kilimall/i, category: 'Clothing',   type: 'expense' },
  // Savings — putting money into savings is a TRANSFER, not income
  { pattern: /savings|goal|fixed deposit|mmf|cic/i,    category: 'Savings',          type: 'transfer'  },
  // M-Pesa specific
  { pattern: /withdraw|agent|atm|cash out/i,           category: 'Cash Withdrawal',  type: 'expense' },
  { pattern: /paybill|buy goods|till/i,                 category: 'Utilities',        type: 'expense' },
  { pattern: /send money|transfer to/i,                 category: 'Transfer',         type: 'transfer' },
];

function autoCategory(description: string, amount: number): { category: string; type: 'income' | 'expense' | 'transfer' } {
  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(description)) {
      return { category: rule.category, type: rule.type };
    }
  }
  return { category: amount > 0 ? 'Income' : 'General', type: amount > 0 ? 'income' : 'expense' };
}

/* -- Normalise a raw row from any parser ------------------- */
interface RawRow {
  date: string;
  description: string;
  amount: number;
  type?: string;
  reference?: string;
}

function rowToTransaction(row: RawRow) {
  const { category, type } = autoCategory(row.description, row.amount);
  return {
    date:      row.date,
    name:      row.description.slice(0, 100),
    amount:    Math.abs(row.amount),
    type:      row.type ?? type,
    category,
    reference: row.reference?.slice(0, 50),
    note:      'Imported via Smart Upload',
  };
}

/* -- Parse a date string flexibly -------------------------- */
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

/* -- CSV / plain-text parser ------------------------------- */
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
  const iDesc   = cols.findIndex(c => /description|narration|detail|particulars/.test(c));
  const iRef    = cols.findIndex(c => /reference|receipt|ref\b|code/.test(c));
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
    const ref     = iRef >= 0 ? cells[iRef] : undefined;
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

    rows.push({ date, description: desc, amount, type, reference: ref });
  }
  return rows;
}

/* -- Excel parser (.xlsx / .xls) --------------------------- */
async function parseExcel(buffer: ArrayBuffer): Promise<RawRow[]> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  // Convert to CSV text and reuse the CSV parser
  const csvRows: string[] = [];
  sheet.eachRow((row) => {
    const rowValues = (row.values as any[]).slice(1).map(val => {
      if (val === null || val === undefined) return '';
      if (val instanceof Date) return val.toISOString();
      if (typeof val === 'object' && val.text) return val.text;
      return String(val).replace(/"/g, '""');
    });
    csvRows.push('"' + rowValues.join('","') + '"');
  });
  
  return parseCSVText(csvRows.join('\n'));
}

/* -- PDF text extractor ------------------------------------ */
async function parsePDF(buffer: ArrayBuffer): Promise<RawRow[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
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

/* -- M-Pesa statement line-by-line parser ------------------ */
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
    
    // M-Pesa receipts usually start with a 10-character code
    const refMatch = afterDate.match(/^[A-Z0-9]{10}\b/);
    const reference = refMatch ? refMatch[0] : undefined;
    const descRaw = refMatch ? afterDate.slice(10).trim() : afterDate;

    const desc = descRaw.replace(amountPattern, '').trim().slice(0, 100) || 'M-Pesa Transaction';

    rows.push({
      date,
      description: desc || 'M-Pesa Transaction',
      amount: Math.abs(amount),
      type: amount < 0 ? 'expense' : 'income',
      reference,
    });
  }
  return rows;
}

/* -- Gemini Vision parser (uses GOOGLE_GENERATIVE_AI_API_KEY) ----- */
async function parseWithAI(fileBuffer: ArrayBuffer, mimeType: string, userId: string, signal?: AbortSignal): Promise<Record<string, unknown>[] | null> {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) return null;
  
  const rlAi = await checkLimit('ai', `ai:${userId}`);
  if (!rlAi.ok) {
    console.warn(`[SmartUpload] AI rate limit hit for user ${userId}`);
    return null; // fallback to non-AI methods
  }

  try {
    const { parseDocumentWithGemini } = await import('@/lib/api/gemini');
    const base64 = Buffer.from(fileBuffer).toString('base64');
    const results = await parseDocumentWithGemini(base64, mimeType, signal);
    return results.length ? results : null;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') throw err; // rethrow to be caught by main route handler
    console.error('[SmartUpload Gemini]', err);
    return null;
  }
}

/* -- Zod schema to validate each transaction row before DB insert -- */
const UploadRowSchema = z.object({
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  name:      z.string().min(1).max(200),
  amount:    z.number().min(0),
  type:      z.enum(['income', 'expense', 'transfer']),
  category:  z.string().min(1).max(80),
  reference: z.string().optional(),
  note:      z.string().optional(),
});

import { parseMpesaSms as parseDeterministicSms, parseMpesaPdfStatement } from '@/lib/parsers/mpesa';
import { redactForAI } from '@/lib/api/redact';

/* -- Main route handler ------------------------------------ */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session.user as { id?: string }).id as string;

  // -- Rate limiting ------------------------------------------
  const rl = await checkLimit('upload', `upload:${userId}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Upload limit reached. Please wait ${rl.retryAfter} seconds.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  try {
    const formData = await request.formData();
    const file     = formData.get('file') as File | null;
    const smsText  = formData.get('text') as string | null;

    if (!file && !smsText) return NextResponse.json({ error: 'No file or text provided.' }, { status: 400 });

    if (file && file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB.` },
        { status: 413 }
      );
    }

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 55_000); // 5s before server timeout

    const clientMimeType = file ? (file.type || 'application/octet-stream') : 'text/plain';
    const fileName       = file ? (file.name?.toLowerCase() ?? '') : 'sms.txt';
    const magicBuffer    = file ? await file.slice(0, 100).arrayBuffer() : null;
    
    // Security: Derive MIME type from magic numbers to prevent spoofing
    const mimeType = getActualMimeType(magicBuffer, clientMimeType);
    
    let cachedFileBuffer: ArrayBuffer | null = null;
    const getFileBuffer = async () => {
      if (!cachedFileBuffer && file) {
        cachedFileBuffer = await file.arrayBuffer();
      }
      return cachedFileBuffer;
    };

    type RowData = { category?: string; type?: string; importHash?: string; reference?: string; date?: string; amount?: number; name?: string; isDuplicate?: boolean; isTransfer?: boolean; categoryId?: string; note?: string };
    let transactions: RowData[] = [];
    let method = 'csv';

    const isExcel = mimeType === 'application/vnd.ms-excel' || (mimeType === 'application/zip' && (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')));
    const isPDF   = mimeType === 'application/pdf';
    const isImage = mimeType.startsWith('image/');
    const isSMS   = !!smsText;

    // 0. SMS Input
    if (isSMS && smsText) {
      if (smsText.length > 8000) {
        return NextResponse.json({ error: 'SMS text is too long (max 8000 characters)' }, { status: 400 });
      }

      const deterministic = parseDeterministicSms(smsText);
      if (deterministic.length > 0) {
        transactions = deterministic;
        method = 'sms';
      } else {
        // Fallback to AI with strict protections
        const rlAi = await checkLimit('ai', `ai:${userId}`);
        if (!rlAi.ok) {
          return NextResponse.json(
            { error: `AI rate limit reached. Try again in ${rlAi.retryAfter}s.` },
            { status: 429, headers: { 'Retry-After': String(rlAi.retryAfter) } }
          );
        }
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 503 });
        }
        
        const redactedSms = redactForAI(smsText);
        const { parseMpesaSms: parseMpesaSmsWithAI } = await import('@/lib/api/gemini');
        transactions = await parseMpesaSmsWithAI(redactedSms, controller.signal);
        method = 'ai-sms';
      }
    }

    // 1. Excel → xlsx parser
    if (transactions.length === 0 && isExcel && file) {
      const fb = await getFileBuffer();
      if (fb) {
        transactions = (await parseExcel(fb)).map(rowToTransaction);
        method = 'xlsx';
      }
    }

    // 2. PDF → Deterministic *334# then Gemini AI then M-Pesa pattern fallback
    if (transactions.length === 0 && isPDF && file) {
      const fb = await getFileBuffer();
      if (fb) {
        try {
        const pdfParse = require('pdf-parse');
        const { text: pdfExtractedText } = await pdfParse(Buffer.from(fb));
        const deterministicPdf = parseMpesaPdfStatement(pdfExtractedText);
        
        if (deterministicPdf && deterministicPdf.length > 0) {
           transactions = deterministicPdf;
           method = 'pdf-334';
        }
      } catch (err) {
        console.error('[SmartUpload PDF Preprocess]', err);
      }

        if (transactions.length === 0) {
          const aiResult = await parseWithAI(fb, mimeType, userId, controller.signal);
          if (aiResult?.length) {
            transactions = aiResult;
            method = 'ai';
          } else {
            transactions = (await parsePDF(fb)).map(rowToTransaction);
            method = 'pdf';
          }
        }
      }
    }

    // 3. Image → Gemini Vision
    if (transactions.length === 0 && isImage && file) {
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return NextResponse.json({
          error: 'Image and receipt uploads require a configured Gemini AI API Key.'
        }, { status: 422 });
      }
      const fb = await getFileBuffer();
      if (fb) {
        const aiResult = await parseWithAI(fb, mimeType, userId, controller.signal);
        if (aiResult?.length) { transactions = aiResult; method = 'ai'; }
      }
    }

    // 4. Fallback → CSV text parser (also catches .csv files)
    if (transactions.length === 0 && file && !isSMS) {
      const fb = await getFileBuffer();
      if (fb) {
        const text = Buffer.from(fb).toString('utf-8');
        transactions = parseCSVText(text).map(rowToTransaction);
        method = 'csv';
      }
    }

    if (transactions.length === 0) {
      return NextResponse.json({
        error: 'Could not extract transactions. Supported formats:\n• CSV: must have Date, Description, Amount columns\n• Excel: first sheet with those headers\n• PDF / Image: AI-powered (Gemini) — works with bank statements & receipts\n• M-Pesa SMS: use the "Paste M-Pesa SMS" tab instead',
      }, { status: 422 });
    }

    // -- Validate every row with Zod before touching the DB -----
    const validRows = transactions.filter((t: RowData) => {
      const result = UploadRowSchema.safeParse(t);
      if (!result.success) {
        console.warn('[upload] Skipping invalid row:', result.error.flatten(), t);
      }
      return result.success;
    });

    if (validRows.length === 0) {
      return NextResponse.json({
        error: 'No valid transactions found after validation. Check that dates are YYYY-MM-DD and amounts are numeric.',
      }, { status: 422 });
    }

    // Resolve category IDs for the user
    const categoryNames = [...new Set(validRows.map((t: RowData) => String(t.category)))];
    const existingCats  = await prisma.category.findMany({ where: { userId, name: { in: categoryNames } } });
    const catMap: Record<string, string> = Object.fromEntries(existingCats.map(c => [c.name, c.id]));

    const newCatsToCreate = categoryNames
      .filter(name => !catMap[name])
      .map(name => ({
        name,
        type: validRows.find((t: RowData) => t.category === name)?.type ?? 'expense',
        userId
      }));

    if (newCatsToCreate.length > 0) {
      await prisma.category.createMany({ data: newCatsToCreate, skipDuplicates: true });
      const newlyCreated = await prisma.category.findMany({
        where: { userId, name: { in: newCatsToCreate.map(c => c.name) } }
      });
      for (const cat of newlyCreated) {
        catMap[cat.name] = cat.id;
      }
    }

    const fallbackId = catMap['Food & Grocery'] ?? catMap[categoryNames[0]];
    const parsed = validRows.map((t: RowData) => ({
      ...t,
      categoryId: catMap[String(t.category)] ?? fallbackId,
    }));

    const crypto = await import('crypto');
    const enhancedParsed = parsed.map((r: RowData) => {
      let hashStr = '';
      if (r.reference) {
        hashStr = `${userId}:${r.reference}`;
      } else {
        hashStr = `${userId}:${r.date}:${r.amount}:${String(r.name).trim().toLowerCase()}`;
      }
      const importHash = crypto.createHash('sha256').update(hashStr).digest('hex');
      return { ...r, importHash };
    });

    const hashes = enhancedParsed.map((r: RowData) => r.importHash as string);
    const existing = await prisma.transaction.findMany({
      where: { userId, importHash: { in: hashes } },
      select: { importHash: true }
    });
    const existingSet = new Set(existing.map(tx => tx.importHash));

    const finalParsed = enhancedParsed.map((r: RowData) => ({
      ...r,
      isDuplicate: r.importHash ? existingSet.has(r.importHash) : false,
      isTransfer: r.type === 'transfer'
    }));

    clearTimeout(timeoutId);
    return NextResponse.json({ 
      success: true, 
      transactions: finalParsed,
      count: finalParsed.filter((t: RowData) => !t.isDuplicate && !t.isTransfer).length, 
      method 
    });

  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'AI processing timed out. Please try again.' },
        { status: 504 }
      );
    }
    // Log full error server-side; never expose internal details to client
    console.error('[SmartUpload]', err);
    return NextResponse.json(
      { error: 'File processing failed. Please check the file format and try again.' },
      { status: 500 }
    );
  }
}
