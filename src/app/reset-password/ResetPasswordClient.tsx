'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { resetPassword } from '@/lib/actions/password';
import { getErrorMessage } from '@/lib/errors';

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('Missing reset token. Please request a new password reset link.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await resetPassword(token, password);
      if (!result.success) {
        setError(result.error || 'Failed to reset password');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err) || 'Failed to reset password. The token may be expired.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', padding: '1.5rem' }}>
        <div className="card animate-in" style={{ width: '100%', maxWidth: 400, padding: '2rem', textAlign: 'center' }}>
          <div style={{ padding: '1rem', background: 'var(--color-expense-light)', borderRadius: 8, color: 'var(--color-expense)' }}>
            <p style={{ fontWeight: 600 }}>Invalid Reset Link</p>
            <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>The password reset link is missing a token.</p>
          </div>
          <Link href="/forgot-password" style={{ display: 'inline-block', marginTop: '1.5rem', color: 'var(--color-brand)', fontWeight: 500, fontSize: '0.875rem' }}>
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', padding: '1.5rem' }}>
      <div className="card animate-in" style={{ width: '100%', maxWidth: 400, padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>New Password</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>Enter your new password below</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'var(--color-expense-light)', color: 'var(--color-expense)', fontSize: '0.8125rem', marginBottom: '1rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--color-income-light)', borderRadius: 8 }}>
            <p style={{ color: 'var(--color-income)', fontWeight: 600, fontSize: '0.875rem' }}>Password reset successful!</p>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.78rem', marginTop: '0.5rem' }}>Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '0.4rem' }}>
                New Password <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>(min 8 chars)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input 
                  type={showPw ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  minLength={8} 
                  placeholder="••••••••"
                  className="input-field" 
                  style={{ width: '100%', padding: '0.625rem 2.5rem 0.625rem 0.875rem', fontSize: '0.875rem' }} 
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', display: 'flex' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.25rem' }}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: password.length >= (i + 1) * 3 ? (password.length >= 12 ? 'var(--color-income)' : 'var(--warning)') : 'var(--border)', transition: 'background 0.2s' }} />
                  ))}
                </div>
              )}
            </div>
            
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', justifyContent: 'center' }}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
