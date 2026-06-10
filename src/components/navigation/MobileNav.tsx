'use client';
// src/components/navigation/MobileNav.tsx
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, ArrowLeftRight, PieChart, Target,
  CreditCard, BarChart2, TrendingUp, Settings,
  Tags, Menu, X, Landmark, Shield, FileText
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
  { href: '/privacy',      icon: Shield,          label: 'Privacy'      },
  { href: '/tos',          icon: FileText,        label: 'Terms'        },
];

export function MobileNav() {
  const pathname = usePathname() ?? '/';
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowMore(false);
  }, [pathname]);

  function isActive(href: string) {
    return href === '/' ? pathname === '/' : pathname.startsWith(href);
  }

  return (
    <>
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
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          alignItems: 'center',
        }}
      >
        {MAIN_ITEMS.map(item => {
          const Icon   = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                height: '100%', gap: '0.2rem', padding: '0.4rem', textDecoration: 'none',
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

        {/* More Button */}
        <button
          onClick={() => setShowMore(true)}
          style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100%', gap: '0.2rem', padding: '0.4rem', background: 'none', border: 'none', cursor: 'pointer'
          }}
        >
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: '50%',
            background: 'transparent',
            transition: 'background 0.2s',
          }}>
            <Menu size={20} strokeWidth={2} color="var(--text-muted)" />
          </div>
          <span style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--text-muted)' }}>More</span>
        </button>
      </nav>

      {/* Slide-up Drawer for More Items */}
      {showMore && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }} onClick={() => setShowMore(false)}>
          <div 
            className="animate-in"
            style={{
              background: 'var(--bg-card)',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: '1.5rem',
              paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>More</h3>
              <button onClick={() => setShowMore(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              {MORE_ITEMS.map(item => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: '0.5rem', padding: '1rem', textDecoration: 'none',
                      background: active ? 'var(--primary-light)' : 'var(--bg-subtle)',
                      borderRadius: 12,
                    }}
                  >
                    <Icon size={24} color={active ? 'var(--primary)' : 'var(--text-secondary)'} />
                    <span style={{ fontSize: '0.7rem', fontWeight: 500, color: active ? 'var(--primary)' : 'var(--text-secondary)' }}>
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
