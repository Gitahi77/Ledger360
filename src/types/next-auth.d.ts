// src/types/next-auth.d.ts
// Augments NextAuth types so session.user has id, accountType, currency
// Eliminates all (user as any) casts throughout the codebase.
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      accountType: string;
      currency: string;
    };
  }

  interface User {
    id: string;
    accountType: string;
    currency: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    accountType: string;
    currency: string;
  }
}
