'use client';
// src/components/navigation/MobileNav.tsx
// Copyright (c) 2024-present Eric Gitahi. All rights reserved.
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Target,
  CreditCard, BarChart2, TrendingUp, Settings, ShieldCheck,
  MoreHorizontal, X,
} from 'lucide-react';

// Primary 5 — mirrors the most-used desktop sidebar items
const PRIMARY_ITEMS = [
  { href: '/',             icon: LayoutDashboard, label: 'Dashboard'    },
  { href: '/transactions', icon: ArrowLeftRight,  label: 'Transactions' },
  { href: '/budgets',      icon: PieChart,         label: 'Budgets'      },
  { href: '/goals',        icon: Target,           label: 'Goals'        },
  { href: '/loans',        icon: CreditCard,       label: 'Loans'        },
];

// Secondary — the rest, shown in an overflow drawer
const MORE_ITEMS = [
  { href: '/net-worth', icon: TrendingUp,  label: 'Net Worth' },
  { href: '/reports',   icon: BarChart2,   label: 'Reports'   },
  { href: '/security',  icon: ShieldCheck, label: 'Security'  },
  { href: '/settings',  icon: Settings,    label: 'Settings'  },
];

export function MobileNav() {
  const pathname = usePathname() ?? '/';
  const [showMore, setShowMore] = useState(false);

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  const anyMoreActive = MORE_ITEMS.some(i => isActive(i.href));

  return (
    <>
      {/* Overflow drawer */}
      {showMore && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 998,
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)',
          }}
          onClick={() => setShowMore(false)}
        >
          <div
            style={{
              position: 'absolute', bottom: 'calc(64px + env(safe-area-inset-bottom,0px))',
              left: '1rem', right: '1rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '1rem',
              padding: '0.75rem',
              boxShadow: 'var(--shadow-lg)',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '0.25rem',
            }}
            onClick={e => e.stopPropagation()}
          >
            {MORE_ITEMS.map(item => {
              const Icon   = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: '0.3rem', padding: '0.75rem 0.25rem',
                    borderRadius: '0.75rem', textDecoration: 'none',
                    background: active ? 'var(--primary-light)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                >
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.5 : 2}
                    color={active ? 'var(--primary)' : 'var(--text-muted)'}
                  />
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 600,
                    color: active ? 'var(--primary)' : 'var(--text-muted)',
                    letterSpacing: '-0.01em',
                  }}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom tab bar */}
      <nav
        className="mobile-nav"
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)',
          paddingTop: '0.5rem',
          height: 'auto',
        }}
      >
        {PRIMARY_ITEMS.map(item => {
          const Icon   = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="mobile-nav-item"
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '0.2rem', padding: '0.4rem 0.75rem',
                borderRadius: '0.75rem', textDecoration: 'none',
                minWidth: 0, flex: 1,
                background: active ? 'var(--primary-light)' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 2}
                color={active ? 'var(--primary)' : 'var(--text-muted)'}
              />
              <span style={{
                fontSize: '0.6rem', fontWeight: active ? 700 : 500,
                color: active ? 'var(--primary)' : 'var(--text-muted)',
                letterSpacing: '-0.01em', whiteSpace: 'nowrap',
              }}>{item.label}</span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setShowMore(v => !v)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '0.2rem', padding: '0.4rem 0.75rem',
            borderRadius: '0.75rem', border: 'none', cursor: 'pointer',
            minWidth: 0, flex: 1,
            background: (showMore || anyMoreActive) ? 'var(--primary-light)' : 'transparent',
            transition: 'background 0.15s',
          }}
        >
          {showMore
            ? <X   size={20} strokeWidth={2.5} color="var(--primary)" />
            : <MoreHorizontal size={20} strokeWidth={2} color={(anyMoreActive) ? 'var(--primary)' : 'var(--text-muted)'} />
          }
          <span style={{
            fontSize: '0.6rem', fontWeight: 500,
            color: (showMore || anyMoreActive) ? 'var(--primary)' : 'var(--text-muted)',
            letterSpacing: '-0.01em',
          }}>More</span>
        </button>
      </nav>
    </>
  );
}
