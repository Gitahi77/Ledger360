import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', padding: '1.5rem', textAlign: 'center' }}>
      <div>
        <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-text-primary)' }}>404</h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '2rem' }}>Page not found.</p>
        <Link href="/" className="btn btn-primary" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}>
          Return Home
        </Link>
      </div>
    </div>
  );
}
