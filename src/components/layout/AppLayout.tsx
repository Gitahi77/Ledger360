'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from '../ThemeToggle';
import { MobileNav } from '../navigation/MobileNav';
import { AppFooter } from './AppFooter';
import { CommandPalette } from '../ui/command/CommandPalette';
import { Search } from 'lucide-react';

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
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-background border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
              title="Search (Cmd+K)"
            >
              <Search size={14} />
              <span>Search...</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
            <button
              onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
              className="md:hidden p-2 text-muted-foreground hover:bg-accent rounded-full transition-colors"
              title="Search"
            >
              <Search size={18} />
            </button>
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
      <CommandPalette />
    </div>
  );
}
