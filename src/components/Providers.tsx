'use client';
// src/components/Providers.tsx
// Client wrapper for NextAuth SessionProvider and Global UI Providers

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster position="bottom-right" richColors />
    </SessionProvider>
  );
}
