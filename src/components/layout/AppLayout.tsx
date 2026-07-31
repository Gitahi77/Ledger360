'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from '../ThemeToggle';
import { MobileNav } from '../navigation/MobileNav';
import { AppFooter } from './AppFooter';
import dynamic from 'next/dynamic';
const CommandPalette = dynamic(() => import('../finance/os/CommandPalette').then(mod => ({ default: mod.CommandPalette })));
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
    <div className="flex min-h-screen pb-[env(safe-area-inset-bottom)] bg-secondary">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 md:ml-[260px] md:py-3 md:pr-3 pb-[72px] md:pb-3 h-screen">
        <div className="flex-1 flex flex-col bg-background md:rounded-3xl md:border border-border/60 shadow-sm overflow-hidden relative">
          <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/30 bg-background/80 backdrop-blur-xl px-6">
            <div className="flex items-center gap-3">
              <span className="text-h3 text-foreground">{title}</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                className="hidden md:flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground bg-secondary/50 border border-border/50 rounded-full hover:bg-secondary hover:text-foreground transition-all duration-200 shadow-sm"
                title="Search (Cmd+K)"
              >
                <Search size={16} />
                <span>Search...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border/50 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
              <button
                onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
                className="md:hidden p-2 text-muted-foreground hover:bg-secondary rounded-full transition-colors"
                title="Search"
              >
                <Search size={20} />
              </button>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-6 overflow-y-auto overflow-x-hidden scroll-smooth">
            <div className="mx-auto w-full max-w-[1440px]">
              {children}
            </div>
          </main>
          <AppFooter />
        </div>
      </div>

      <MobileNav />
      <CommandPalette />
    </div>
  );
}
