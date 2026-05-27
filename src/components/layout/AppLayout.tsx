'use client';

import { ReactNode, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { ThemeToggle } from '../ThemeToggle';
import { TemporalEngine } from '../TemporalEngine';
import { MobileNav } from '../navigation/MobileNav';

const PAGE_TITLES: Record<string, string> = {
  '/':             'Dashboard',
  '/net-worth':    'Net Worth',
  '/transactions': 'Transactions',
  '/budgets':      'Budgets',
  '/goals':        'Goals',
  '/loans':        'Loans & Debt',
  '/reports':      'Reports',
  '/settings':     'Settings',
  '/security':     'Security',
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
            <TemporalEngine />
            <ThemeToggle />
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>

      <MobileNav />
    </div>
  );
}
