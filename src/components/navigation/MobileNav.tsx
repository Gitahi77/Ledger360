'use client';
// src/components/navigation/MobileNav.tsx
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Target,
  CreditCard, BarChart2, TrendingUp, Settings, ShieldCheck,
  Tags
} from 'lucide-react';

const ITEMS = [
  { href: '/',             icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/net-worth',    icon: TrendingUp,      label: 'Net Worth'    },
  { href: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { href: '/budgets',      icon: PieChart,        label: 'Budgets'      },
  { href: '/categories',   icon: Tags,            label: 'Categories'   },
  { href: '/goals',        icon: Target,          label: 'Goals'        },
  { href: '/loans',        icon: CreditCard,      label: 'Loans'        },
  { href: '/reports',      icon: BarChart2,       label: 'Reports'      },
  { href: '/security',     icon: ShieldCheck,     label: 'Security'     },
  { href: '/settings',     icon: Settings,        label: 'Settings'     },
];

export function MobileNav() {
  const pathname = usePathname() ?? '/';

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <nav
      className="mobile-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(64px + env(safe-area-inset-bottom, 0px))',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        overflowY: 'hidden',
        whiteSpace: 'nowrap',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        .mobile-nav::-webkit-scrollbar { display: none; }
      `}} />
      
      {ITEMS.map(item => {
        const Icon   = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              flex: '0 0 auto', width: '22vw', maxWidth: '80px',
              height: '100%',
              gap: '0.2rem', padding: '0.4rem', textDecoration: 'none',
            }}
          >
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: '50%',
              background: active ? 'var(--primary-light)' : 'transparent',
              transition: 'background 0.2s',
            }}>
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 2}
                color={active ? 'var(--primary)' : 'var(--text-muted)'}
              />
            </div>
            <span style={{
              fontSize: '0.55rem', fontWeight: 600,
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
            }}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
