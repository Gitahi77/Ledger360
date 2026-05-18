'use client';

import {
  LayoutDashboard, ArrowLeftRight, PieChart, Target,
  CreditCard, BarChart2, Settings, TrendingUp, LogOut, ShieldCheck
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const navItems = [
  {
    group: 'OVERVIEW',
    items: [
      { name: 'Dashboard',    href: '/',            icon: LayoutDashboard },
      { name: 'Net Worth',    href: '/net-worth',   icon: TrendingUp      },
      { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight  },
    ],
  },
  {
    group: 'PLANNING',
    items: [
      { name: 'Budgets',      href: '/budgets', icon: PieChart   },
      { name: 'Goals',        href: '/goals',   icon: Target     },
      { name: 'Loans & Debt', href: '/loans',   icon: CreditCard },
    ],
  },
  {
    group: 'INSIGHTS',
    items: [
      { name: 'Reports',  href: '/reports',  icon: BarChart2 },
      { name: 'Security', href: '/security', icon: ShieldCheck },
      { name: 'Settings', href: '/settings', icon: Settings  },
    ],
  },
];

export function Sidebar() {
  const pathname          = usePathname() ?? '/';
  const { data: session } = useSession();
  const user              = session?.user as any;

  // Derive initials from name
  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="sidebar-logo-text">Ledger<span>360</span></span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(group => (
          <div key={group.group}>
            <div className="sidebar-nav-label">{group.group}</div>
            {group.items.map(item => {
              const Icon     = item.icon;
              const isActive = item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                  <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="sidebar-user-name">{user?.name ?? 'User'}</div>
            <div className="sidebar-user-plan">
              {user?.accountType === 'corporate' ? 'Corporate' : 'Individual'} · {user?.currency ?? 'KES'}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.25rem', borderRadius: 4, display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'color 0.15s' }}
            onMouseOver={e => (e.currentTarget.style.color = 'var(--danger)')}
            onMouseOut={e  => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
