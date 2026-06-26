'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from '../ThemeToggle';
import { MobileNav } from '../navigation/MobileNav';
import { AppFooter } from './AppFooter';

const PAGE_TITLES: Record<string, string> = {
  '/':             'Dashboard',
  '/net-worth':    'Net Worth',
  '/transactions': 'Transactions',
  '/budgets':      'Budgets',
  '/goals':        'Goals',
  '/loans':        'Loans & Debt',
  '/reports':      'Reports',
  '/settings':     'Settings',
};

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const title = PAGE_TITLES[pathname]
    ?? PAGE_TITLES[Object.keys(PAGE_TITLES).find(k => k !== '/' && pathname.startsWith(k)) ?? '/']
    ?? 'Ledger360';

  return (
    <div className="flex min-h-screen pb-[env(safe-area-inset-bottom)] bg-background">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 md:ml-[232px] pb-[72px] md:pb-0">
        <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-secondary px-4 md:px-7">
          <div className="flex items-center gap-3">
            <span className="font-display text-[0.9375rem] font-bold tracking-[-0.02em] text-foreground">{title}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-7 min-w-0 overflow-x-hidden">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
        <AppFooter />
      </div>

      <MobileNav />
    </div>
  );
}
