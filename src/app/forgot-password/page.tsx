'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { requestPasswordReset } from '@/lib/actions/password';

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err: ReturnType<typeof JSON.parse>) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', padding: '1.5rem' }}>
      <div className="card animate-in" style={{ width: '100%', maxWidth: 400, padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Reset Password</h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Enter your email to receive a reset link</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: 8, background: 'var(--danger-light)', color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: '1rem', fontWeight: 500 }}>
            {error}
          </div>
        )}

        {sent ? (
          <div style={{ textAlign: 'center', padding: '1rem', background: 'var(--success-light)', borderRadius: 8 }}>
            <p style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Check your email</p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>If an account exists for {email}, a reset link has been sent.</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.5rem' }}>(In dev mode, check your server console for the link)</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="jane@example.com"
                className="input-field" 
                style={{ width: '100%', padding: '0.625rem 0.875rem', fontSize: '0.875rem' }} 
              />
            </div>
            
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', justifyContent: 'center' }}>
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8125rem' }}>
          <Link href="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
