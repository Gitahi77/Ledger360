// src/lib/auth.ts
// NextAuth configuration with security hardening:
//   - Login rate limiting (10 attempts / 15 min per IP)
//   - 7-day JWT session max-age (appropriate for a financial app)
//   - NEXTAUTH_SECRET startup validation
//   - JWT refresh on session update to pick up profile changes
import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import bcrypt from 'bcryptjs';
import * as argon2 from '@node-rs/argon2';
import { prisma } from './prisma';
import { checkLimit } from './rateLimit';

// Fail fast at startup if secret is missing — random per-process secret
// would invalidate all sessions on every deploy.
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    'NEXTAUTH_SECRET environment variable is not set. ' +
    'Generate one with: openssl rand -base64 32'
  );
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    // 7-day lifetime — shorter than default 30 days, appropriate for finance
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    newUser: '/signup',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
        // We no longer rely on client-supplied IP
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        // -- Rate limit by IP ----------------------------------------------
        const forwardedFor = req?.headers?.['x-forwarded-for'];
        const ip = (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : undefined) ?? 'unknown';
        const rl = await checkLimit('login', `login:${ip}`);
        if (!rl.ok) {
          // Throwing causes NextAuth to surface "CredentialsSignin" error.
          // The login form maps any error to a generic message — safe.
          throw new Error(`Too many login attempts. Try again in ${rl.retryAfter}s.`);
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
        });

        if (!user || !user.password) return null;

        const isBcrypt = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
        const valid = isBcrypt
          ? await bcrypt.compare(credentials.password, user.password)
          : await argon2.verify(user.password, credentials.password);
          
        if (!valid) return null;

        return {
          id:             user.id,
          email:          user.email,
          name:           user.name,
          accountType:    user.accountType,
          currency:       user.currency,
          sessionVersion: user.sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id             = user.id;
        token.accountType    = user.accountType;
        token.currency       = user.currency;
        token.sessionVersion = user.sessionVersion;
      }
      
      // Fetch fresh data from DB on every request to ensure session validity and sync currency
      if (token.id) {
        try {
          const fresh = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { accountType: true, currency: true, name: true, sessionVersion: true },
          });
          
          // If user was deleted or sessionVersion changed (e.g. password reset), invalidate token
          if (!fresh || (token.sessionVersion !== undefined && fresh.sessionVersion !== token.sessionVersion)) {
            // Return token with an error flag to invalidate session
            return { ...token, error: "SessionExpired" };
          }
          
          // Auto-sync currency and profile
          if (fresh) {
            token.accountType    = fresh.accountType;
            token.currency       = fresh.currency;
            token.name           = fresh.name;
            token.sessionVersion = fresh.sessionVersion;
          }
        } catch {
          // DB error - keep stale token
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.error) {
        // Return an empty session to force logout
        return {} as import('next-auth').Session;
      }
      if (session.user) {
        session.user.id          = token.id as string;
        session.user.accountType = token.accountType as string;
        session.user.currency    = token.currency as string;
      }
      return session;
    },
  },
};
