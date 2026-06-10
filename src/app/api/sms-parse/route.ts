// src/app/api/sms-parse/route.ts
// M-Pesa SMS parser endpoint — powered by Gemini AI
// POST { sms: string } → { transactions: ParsedTransaction[] }
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parseMpesaSms } from '@/lib/api/gemini';
import { redactForAI } from '@/lib/api/redact';
import { checkLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const sms: string = body.sms ?? '';

  if (!sms.trim()) {
    return NextResponse.json({ error: 'No SMS text provided' }, { status: 400 });
  }

  if (sms.length > 8000) {
    return NextResponse.json({ error: 'SMS text is too long (max 8000 characters)' }, { status: 400 });
  }

  const userId = (session.user as ReturnType<typeof JSON.parse>).id as string;
  const rl = await checkLimit('ai', `ai:${userId}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `AI rate limit reached. Try again in ${rl.retryAfter}s.` },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } }
    );
  }

  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 503 });
  }

  try {
    const redactedSms = redactForAI(sms);
    const transactions = await parseMpesaSms(redactedSms);
    return NextResponse.json({ transactions, count: transactions.length });
  } catch (err: ReturnType<typeof JSON.parse>) {
    console.error('[SMS Parse] Error:', err);
    return NextResponse.json(
      { error: 'Failed to parse SMS. Please try again.' },
      { status: 500 }
    );
  }
}
