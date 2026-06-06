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
    <div className="app-shell" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <Sidebar />
      
      <div className="main-content" style={{ marginBottom: '4rem' }} id="main-scroll-area">
        <header className="top-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="top-header-title">{title}</span>
          </div>
          <div className="top-header-right">
            <ThemeToggle />
          </div>
        </header>
        <main className="page-content">{children}</main>
        <AppFooter />
      </div>

      <MobileNav />
    </div>
  );
}
