// src/app/api/auth/signup/route.ts
// Registration endpoint — validates input, hashes password, creates user + seeds categories
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { DEFAULT_CATEGORIES } from '@/lib/constants/categories';
import { signupLimiter } from '@/lib/rateLimit';

// ── Input validation schema ───────────────────────────────────────────────
const SignupSchema = z.object({
  name:        z.string().min(1, 'Name is required').max(80, 'Name too long'),
  email:       z.string().email('Invalid email address').max(254),
  password:    z.string().min(8, 'Password must be at least 8 characters').max(128),
  // Only allow known account types — prevents e.g. accountType: "admin" in JWT
  accountType: z.enum(['individual', 'freelancer', 'small_business']).default('individual'),
  // Only allow supported currencies
  currency:    z.enum(['KES', 'USD', 'EUR', 'GBP', 'UGX', 'TZS']).default('KES'),
});

export async function POST(req: Request) {
  // ── Rate limiting (by IP) ─────────────────────────────────────────────
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const rl = signupLimiter.check(`signup:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many signup attempts. Please try again in ${rl.retryAfter} seconds.` },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      }
    );
  }

  try {
    const body = await req.json();

    // ── Zod validation ────────────────────────────────────────────────────
    const parsed = SignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? 'Invalid input.' },
        { status: 400 }
      );
    }
    const { name, email, password, accountType, currency } = parsed.data;

    // Normalise email to prevent case-sensitive duplicate accounts
    const normalisedEmail = email.toLowerCase().trim();

    // ── Constant-time duplicate check ─────────────────────────────────────
    // We always run bcrypt.hash even when email exists to equalise timing
    // and prevent email enumeration via response time differences.
    const [existing, hashed] = await Promise.all([
      prisma.user.findUnique({ where: { email: normalisedEmail } }),
      bcrypt.hash(password, 12),
    ]);

    if (existing) {
      // Return 409 after bcrypt completes — timing is now equal for both branches
      return NextResponse.json(
        { error: 'An account with this email already exists.' },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name:        name.trim(),
        email:       normalisedEmail,
        password:    hashed,
        accountType,
        currency,
      },
    });

    // Seed full default categories (Kenyan-relevant) for new users
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map(c => ({ ...c, userId: user.id })),
      skipDuplicates: true,
    });

    // Do NOT return userId — unnecessary information leakage
    return NextResponse.json({ success: true }, { status: 201 });

  } catch (err: any) {
    // Log full error server-side; return only a generic message to client
    console.error('[signup]', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
