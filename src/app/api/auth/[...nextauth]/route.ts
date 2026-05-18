// src/app/api/auth/[...nextauth]/route.ts
// Bug 0-A fix: handler instantiated HERE only — never re-exported from auth.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
