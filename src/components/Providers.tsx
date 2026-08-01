'use client';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NuqsAdapter>
        {children}
        <Toaster 
          position="bottom-right" 
        visibleToasts={3}
        toastOptions={{
          classNames: {
            toast: 'group border-none shadow-md font-sans',
            success: 'bg-calm-sage text-white',
            warning: 'bg-alert-amber text-alert-amber-foreground duration-5000',
            error: 'bg-alert-terracotta text-white',
            info: 'bg-calm-charcoal text-white',
          },
          duration: 3000,
        }} 
      />
      </NuqsAdapter>
    </SessionProvider>
  );
}
