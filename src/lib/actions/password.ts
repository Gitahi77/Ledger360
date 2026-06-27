import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import * as argon2 from '@node-rs/argon2';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

import { z } from 'zod';

// Request password reset (Generates token and logs to console)
export async function requestPasswordReset(rawEmail: string) {
  'use server';
  const email = z.string().email().max(128).parse(rawEmail);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Return success to prevent email enumeration attacks
    return { success: true };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiry = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: tokenHash,
      resetTokenExpiry: expiry,
    }
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'));
  const resetLink = `${appUrl}/reset-password?token=${token}`;

  try {
    await resend.emails.send({
      from: 'Ledger360 <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your Ledger360 password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333; text-align: center;">Reset your Password</h2>
          <p style="color: #555; line-height: 1.6;">Hello ${user.name || ''},</p>
          <p style="color: #555; line-height: 1.6;">We received a request to reset your password for your Ledger360 account. Click the button below to choose a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
          </div>
          <p style="color: #555; line-height: 1.6; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
          <p style="color: #999; font-size: 12px; margin-top: 40px; text-align: center;">&copy; ${new Date().getFullYear()} Ledger360. All rights reserved.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send reset email:', error);
  }

  return { success: true };
}

export async function resetPassword(rawToken: string, rawNewPassword: string) {
  'use server';
  const token = z.string().max(128).parse(rawToken);
  const newPassword = z.string().min(8).max(128).parse(rawNewPassword);

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetToken: tokenHash,
      resetTokenExpiry: { gt: new Date() }
    }
  });

  if (!user) {
    return { error: 'Invalid or expired reset token' };
  }

  const hashedPassword = await argon2.hash(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
      sessionVersion: { increment: 1 },
    }
  });

  return { success: true };
}
