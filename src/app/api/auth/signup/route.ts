// src/app/api/auth/signup/route.ts
// Registration endpoint — validates input, hashes password, creates user + seeds categories
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { DEFAULT_CATEGORIES } from '@/lib/constants/categories';

export async function POST(req: Request) {
  try {
    const { name, email, password, accountType, currency } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user   = await prisma.user.create({
      data: {
        name,
        email,
        password:    hashed,
        accountType: accountType ?? 'individual',
        currency:    currency    ?? 'KES',
      },
    });

    // Seed full default categories (Kenyan-relevant) for new users
    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map(c => ({ ...c, userId: user.id })),
      skipDuplicates: true,
    });

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (err: any) {
    console.error('[signup]', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
