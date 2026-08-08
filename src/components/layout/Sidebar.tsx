'use client';

import {
  LayoutDashboard, ArrowLeftRight, Target, PieChart, Tags,
  CreditCard, BarChart2, Settings, TrendingUp, LogOut, Landmark
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

const navItems = [
  {
    group: 'CORE INTENTS',
    items: [
      { name: 'Dashboard',    href: '/',             icon: LayoutDashboard },
      { name: 'Accounts',     href: '/accounts',     icon: Landmark        },
      { name: 'Transactions', href: '/transactions', icon: ArrowLeftRight  },
    ],
  },
  {
    group: 'GROWTH',
    items: [
      { name: 'Budgets',      href: '/budgets',      icon: PieChart   },
      { name: 'Categories',   href: '/categories',   icon: Tags       },
      { name: 'Goals',        href: '/goals',        icon: Target     },
      { name: 'Loans',        href: '/loans',        icon: CreditCard },
      { name: 'Net Worth',    href: '/net-worth',    icon: TrendingUp },
    ],
  },
  {
    group: 'INTELLIGENCE',
    items: [
      { name: 'Reports',      href: '/reports',      icon: BarChart2 },
      { name: 'Settings',     href: '/settings',     icon: Settings  },
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
    <aside className="w-[260px] hidden md:flex flex-col bg-secondary/30 h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="flex items-center gap-3 px-8 h-[72px] shrink-0 mt-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand shadow-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="font-display font-bold text-lg text-foreground tracking-tight">Ledger<span className="text-brand">360</span></span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-8">
        {navItems.map(group => (
          <div key={group.group} className="space-y-1">
            <div className="px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-3">{group.group}</div>
            {group.items.map(item => {
              const Icon     = item.icon;
              const isActive = item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  className={`flex items-center gap-3 px-4 py-2.5 text-sm rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-background text-brand font-medium shadow-sm border border-border/50' 
                      : 'text-muted-foreground hover:bg-black/5 hover:text-foreground border border-transparent'
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="p-4 mt-auto mb-2">
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-background border border-border/50 shadow-sm">
          <div className="w-9 h-9 rounded-full bg-secondary text-foreground flex items-center justify-center text-xs font-bold shrink-0 border border-border/60">
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
            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors shrink-0"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
