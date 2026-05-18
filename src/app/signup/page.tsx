'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, User, Building2 } from 'lucide-react';

const CURRENCIES = [
  { code: 'KES', label: 'KES — Kenyan Shilling' },
  { code: 'USD', label: 'USD — US Dollar'        },
  { code: 'GBP', label: 'GBP — British Pound'    },
  { code: 'EUR', label: 'EUR — Euro'              },
  { code: 'NGN', label: 'NGN — Nigerian Naira'   },
  { code: 'ZAR', label: 'ZAR — South African Rand'},
  { code: 'GHS', label: 'GHS — Ghanaian Cedi'    },
];

export default function SignupPage() {
  const router = useRouter();
  const [step,        setStep]        = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<'individual' | 'corporate'>('individual');
  const [name,        setName]        = useState('');
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [currency,    setCurrency]    = useState('KES');
  const [showPw,      setShowPw]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, accountType, currency }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }

      // Auto sign-in after successful registration
      await signIn('credentials', { email, password, redirect: false });
      router.push('/');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', padding: '1.5rem' }}>
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '60vw', height: '60vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,112,243,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div className="animate-in" style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,112,243,0.4)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M3 3h18v4H3zM3 10h11v4H3zM3 17h7v4H3zM17 14l4 4-4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ fontFamily: 'Space Grotesk,sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.04em' }}>Ledger<span style={{ color: 'var(--primary)' }}>360</span></span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Create your free account</p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[1, 2].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: step >= s ? 'var(--primary-grad)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, color: step >= s ? 'white' : 'var(--text-muted)', boxShadow: step >= s ? '0 0 10px rgba(0,112,243,0.35)' : 'none', transition: 'all 0.2s' }}>
                {s}
              </div>
              {s < 2 && <div style={{ width: 40, height: 2, borderRadius: 1, background: step > s ? 'var(--primary)' : 'var(--border)', transition: 'background 0.3s' }} />}
            </div>
          ))}
        </div>

        <div className="card" style={{ padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.08)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'var(--danger-light)', border: '1px solid rgba(220,38,38,0.2)', fontSize: '0.8125rem', color: 'var(--danger)', fontWeight: 500 }}>
                {error}
              </div>
            )}

            {step === 1 && (
              <>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>I am signing up as a…</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {([
                      { value: 'individual', label: 'Individual',  sub: 'Personal finance', Icon: User       },
                      { value: 'corporate',  label: 'Corporate',   sub: 'Business finance', Icon: Building2  },
                    ] as const).map(({ value, label, sub, Icon }) => (
                      <button key={value} type="button" onClick={() => setAccountType(value)} style={{
                        padding: '1rem', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                        border: `2px solid ${accountType === value ? 'var(--primary)' : 'var(--border)'}`,
                        background: accountType === value ? 'var(--primary-light)' : 'var(--bg-app)',
                        boxShadow: accountType === value ? '0 0 14px rgba(0,112,243,0.15)' : 'none',
                        transition: 'all 0.15s',
                      }}>
                        <Icon size={18} color={accountType === value ? 'var(--primary)' : 'var(--text-muted)'} style={{ marginBottom: '0.5rem' }} />
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: accountType === value ? 'var(--primary)' : 'var(--text-primary)' }}>{label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    {accountType === 'individual' ? 'Full Name' : 'Business Name'}
                  </label>
                  <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder={accountType === 'individual' ? 'Jane Mwangi' : 'Acme Ltd'}
                    className="input-field" style={{ width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="input-field" style={{ width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem' }}>
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'var(--success-light)', borderLeft: '3px solid var(--success)', fontSize: '0.8rem', color: 'var(--success-text)', fontWeight: 500 }}>
                  Welcome, <strong>{name}</strong>! Almost done — set up your login credentials.
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="jane@example.com"
                    className="input-field" style={{ width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem' }} />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Password <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(min 8 chars)</span></label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="••••••••"
                      className="input-field" style={{ width: '100%', padding: '0.625rem 2.5rem 0.625rem 0.875rem', fontSize: '0.875rem' }} />
                    <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {password.length > 0 && (
                    <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.25rem' }}>
                      {[...Array(4)].map((_, i) => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: password.length >= (i + 1) * 3 ? (password.length >= 12 ? 'var(--success)' : 'var(--warning)') : 'var(--border)', transition: 'background 0.2s' }} />
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', marginTop: '0.5rem', justifyContent: 'center' }}>
              {loading
                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Creating account...</>
                : step === 1 ? 'Continue →' : 'Create Account'}
            </button>
          </form>

          {step === 2 && (
            <button onClick={() => setStep(1)} style={{ display: 'block', marginTop: '0.75rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted)', width: '100%', textAlign: 'center' }}>
              ← Back
            </button>
          )}

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
