'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DashboardIcon, TransactionsIcon, BudgetsIcon, GoalsIcon, SettingsIcon } from '../SidebarIcons';

const navItems = [
  { name: 'Dashboard', href: '/', Icon: DashboardIcon },
  { name: 'Transactions', href: '/transactions', Icon: TransactionsIcon },
  { name: 'Budgets', href: '/budgets', Icon: BudgetsIcon },
  { name: 'Goals', href: '/goals', Icon: GoalsIcon },
  { name: 'Settings', href: '/settings', Icon: SettingsIcon },
];

export function TopNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`flex items-center justify-between transition-all duration-300 bg-background border-b z-50 sticky top-0 backdrop-blur-md ${scrolled ? 'py-2 px-8 shadow-md' : 'py-5 px-8 shadow-sm'}`} style={{ borderColor: 'var(--border)', backgroundColor: 'rgba(var(--background-rgb), 0.95)' }}>
      <div className="flex items-center gap-3">
        <div className={`rounded-lg flex items-center justify-center text-white font-bold transition-all duration-300 ${scrolled ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-lg'}`} 
             style={{ background: 'var(--primary)', boxShadow: '0 2px 8px rgba(0, 102, 255, 0.3)' }}>
          L
        </div>
        <h2 className={`font-extrabold tracking-tight transition-all duration-300 mb-0`} style={{ fontSize: scrolled ? '1.25rem' : '1.5rem', color: 'var(--foreground)' }}>Ledger360</h2>
      </div>

      <div className="flex items-center gap-2">
        {navItems.map((item) => {
          const { Icon } = item;
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-2 rounded-md transition-all duration-300 nav-link ${scrolled ? 'px-4 py-1.5' : 'px-5 py-2.5'}`}
              style={isActive ? { 
                backgroundColor: 'var(--primary-light)', 
                color: 'var(--primary)', 
                fontWeight: 600, 
                borderBottom: '2px solid var(--primary)'
              } : { 
                color: 'var(--text-muted)', 
                fontWeight: 500,
                borderBottom: '2px solid transparent'
              }}
            >
              <Icon active={isActive} />
              <span style={{ fontSize: scrolled ? '0.875rem' : '0.95rem' }}>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
