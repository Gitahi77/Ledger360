'use client';
// src/components/navigation/MobileNav.tsx
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Target,
  CreditCard, BarChart2, TrendingUp, Settings,
  Tags, Menu, X, Landmark
} from 'lucide-react';

const MAIN_ITEMS = [
  { href: '/',             icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/net-worth',    icon: TrendingUp,      label: 'Net Worth'    },
  { href: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { href: '/budgets',      icon: PieChart,        label: 'Budgets'      },
];

const MORE_ITEMS = [
  { href: '/accounts',     icon: Landmark,        label: 'Accounts'     },
  { href: '/categories',   icon: Tags,            label: 'Categories'   },
  { href: '/goals',        icon: Target,          label: 'Goals'        },
  { href: '/loans',        icon: CreditCard,      label: 'Loans'        },
  { href: '/reports',      icon: BarChart2,       label: 'Reports'      },
  { href: '/settings',     icon: Settings,        label: 'Settings'     },
];

export function MobileNav() {
  const pathname = usePathname() ?? '/';
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    setShowMore(false);
  }, [pathname]);

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <>
      <nav className="mobile-nav grid grid-cols-5 items-center md:hidden fixed bottom-0 left-0 right-0 h-[calc(64px+env(safe-area-inset-bottom,0px))] bg-background border-t border-border/50 pb-[env(safe-area-inset-bottom,0px)] z-[999]">
        {MAIN_ITEMS.map(item => {
          const Icon   = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center h-full gap-1 p-1.5"
            >
              <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors duration-200 ${active ? 'bg-secondary' : 'bg-transparent'}`}>
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 2}
                  className={active ? 'text-brand' : 'text-muted-foreground'}
                />
              </div>
              <span className={`text-[10px] font-semibold ${active ? 'text-foreground' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setShowMore(true)}
          className="flex flex-col items-center justify-center h-full gap-1 p-1.5 bg-transparent border-none cursor-pointer"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-transparent transition-colors duration-200">
            <Menu size={20} strokeWidth={2} className="text-muted-foreground" />
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">More</span>
        </button>
      </nav>

      {/* Slide-up Drawer for More Items */}
      {showMore && (
        <div className="fixed inset-0 z-[1000] bg-black/60 flex flex-col justify-end" onClick={() => setShowMore(false)}>
          <div 
            className="animate-in slide-in-from-bottom-full duration-300 ease-[var(--ease-spring)] bg-background rounded-t-3xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="m-0 text-lg font-semibold text-foreground">More</h3>
              <button onClick={() => setShowMore(false)} className="bg-transparent border-none cursor-pointer text-muted-foreground hover:bg-secondary p-1 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {MORE_ITEMS.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl text-decoration-none transition-colors duration-200 ${active ? 'bg-secondary border border-border/50' : 'bg-secondary/30 hover:bg-secondary'}`}
                  >
                    <Icon size={24} className={active ? 'text-brand' : 'text-muted-foreground'} />
                    <span className={`text-xs font-medium ${active ? 'text-brand' : 'text-muted-foreground'}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
