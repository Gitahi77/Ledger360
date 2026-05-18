// src/lib/auth.ts
// Bug 0-A fix: exports ONLY authOptions — no handler, no GET/POST here.
import NextAuth, { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: 'jwt' },
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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password) return null;

        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;

        return {
          id:          user.id,
          email:       user.email,
          name:        user.name,
          accountType: user.accountType,
          currency:    user.currency,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id          = (user as any).id;
        token.accountType = (user as any).accountType;
        token.currency    = (user as any).currency;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id          = token.id as string;
        session.user.accountType = token.accountType as string;
        session.user.currency    = token.currency as string;
      }
      return session;
    },
  },
};
