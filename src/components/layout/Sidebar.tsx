'use client';

import {
  LayoutDashboard, ArrowLeftRight, PieChart, Target,
  CreditCard, BarChart2, Settings, TrendingUp, LogOut, Tag, Landmark
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
      { name: 'Accounts',     href: '/accounts',    icon: Landmark        },
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
    group: 'INSIGHTS & SETTINGS',
    items: [
      { name: 'Reports',  href: '/reports',  icon: BarChart2 },
      { name: 'Categories', href: '/categories', icon: Tag },
      { name: 'Settings', href: '/settings', icon: Settings  },
    ],
  },
];

export function Sidebar() {
  const pathname          = usePathname() ?? '/';
  const { data: session } = useSession();
  const user              = session?.user;

  // Derive initials from name
  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()
    : 'U';

  return (
    <aside className="w-[232px] hidden md:flex flex-col bg-card border-r border-border h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="flex items-center gap-2 px-6 h-[72px] shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="font-display font-bold text-lg text-foreground tracking-tight">Ledger<span className="text-brand">360</span></span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-8">
        {navItems.map(group => (
          <div key={group.group} className="space-y-1">
            <div className="px-3 text-xs font-semibold tracking-wider text-muted-foreground/60 mb-2">{group.group}</div>
            {group.items.map(item => {
              const Icon     = item.icon;
              const isActive = item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive 
                      ? 'bg-brand/10 text-brand font-medium' 
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
          <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-foreground truncate">{user?.name ?? 'User'}</div>
            <div className="text-xs text-muted-foreground truncate">
              {user?.accountType === 'corporate' ? 'Corporate' : 'Individual'} · {user?.currency ?? 'KES'}
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sign out"
            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
