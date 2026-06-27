import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/actions/_auth';
import { getAccountBalances } from '@/lib/queries/accounts';
import { Users, Calendar, Target, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatKES } from '@/lib/format';

export async function ChamaBoard() {
  const user = await requireAuth();

  // Find all Chamas for the user
  const chamas = await prisma.chamaDetails.findMany({
    where: { account: { userId: user.id } },
    include: { account: true },
  });

  if (chamas.length === 0) {
    return null; // Don't show the board if the user has no Chamas
  }

  const balances = await getAccountBalances(user.id);
  const balanceMap = new Map(balances.map(b => [b.id, b.balanceMinor]));

  const today = new Date();

  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="section-header" style={{ marginBottom: 0 }}>
        <h2 className="card-title" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Users size={18} color="var(--color-brand)" />
          My Chamas
        </h2>
        <Link href="/accounts" className="section-link">View all <ArrowRight size={12} /></Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {chamas.map((chama) => {
          // Calculate next meeting date
          let nextMeeting = new Date(today.getFullYear(), today.getMonth(), chama.meetingDay);
          if (nextMeeting < today) {
            nextMeeting = new Date(today.getFullYear(), today.getMonth() + 1, chama.meetingDay);
          }
          const daysToMeeting = Math.ceil((nextMeeting.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

          return (
            <div key={chama.id} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-app)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>{chama.account.name}</h3>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', margin: 0, marginTop: '0.1rem' }}>
                    Payout Position: <strong style={{ color: 'var(--color-text-secondary)' }}>{chama.yourPayoutPosition} of {chama.totalMembers}</strong>
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, fontFamily: 'Space Grotesk, sans-serif' }}>{formatKES(Number(chama.monthlyContrib))}</p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', margin: 0 }}>monthly target</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: 6, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} color="var(--color-brand)" />
                  <div>
                    <p style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', margin: 0 }}>Next Meeting</p>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: 0 }}>In {daysToMeeting} days</p>
                  </div>
                </div>
                <div style={{ background: 'var(--bg-subtle)', padding: '0.5rem', borderRadius: 6, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Target size={14} color="var(--color-income)" />
                  <div>
                    <p style={{ fontSize: '0.65rem', color: 'var(--color-text-secondary)', margin: 0 }}>Current Balance</p>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, margin: 0 }}>{formatKES(Number(balanceMap.get(chama.account.id) ?? 0))}</p>
                  </div>
                </div>
              </div>

              <Link href={`/transactions`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.6rem', fontSize: '0.8rem' }}>
                Add Contribution
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
