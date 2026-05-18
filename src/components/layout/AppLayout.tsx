'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from '../ThemeToggle';
import { TemporalEngine } from '../TemporalEngine';

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
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        <header className="top-header">
          <span className="top-header-title">{title}</span>
          <div className="top-header-right">
            <TemporalEngine />
            <ThemeToggle />
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
