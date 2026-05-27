'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import clsx from 'clsx';
import { Home, List, Upload, BarChart3, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Overview' },
  { href: '/transactions', icon: List, label: 'Ledger' },
  { href: '/upload', icon: Upload, label: 'Import' },
  { href: '/reports', icon: BarChart3, label: 'Insights' },
  { href: '/settings', icon: Settings, label: 'Profile' },
];

export function MobileNav() {
  const pathname = usePathname() ?? '/';

  return (
    <nav className="mobile-nav">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "mobile-nav-item pressable",
              isActive && "active"
            )}
          >
            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="mobile-nav-label">
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
