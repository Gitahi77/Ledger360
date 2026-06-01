'use server';

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Request password reset (Generates token and logs to console)
export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Return success to prevent email enumeration attacks
    return { success: true };
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetTokenExpiry: expiry,
    }
  });

  // Since we don't have an email provider configured, we log the reset link.
  const resetLink = \`http://localhost:3000/reset-password?token=\${token}\`;
  console.log('\n\n======================================================');
  console.log('PASSWORD RESET REQUESTED FOR:', email);
  console.log('RESET LINK:', resetLink);
  console.log('======================================================\n\n');

  return { success: true };
}

// Perform actual password reset
export async function resetPassword(token: string, newPassword: string) {
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() }
    }
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    }
  });

  return { success: true };
}
