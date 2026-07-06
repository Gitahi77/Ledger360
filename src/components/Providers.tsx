'use client';
// src/components/Providers.tsx
// Client wrapper for NextAuth SessionProvider

import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
