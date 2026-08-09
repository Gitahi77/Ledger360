import * as React from 'react';
import { DashboardClient } from './DashboardClient';
import { mockDashboardIntelligence } from '@/lib/mock/dashboard';

export const metadata = { title: 'Dashboard - Ledger360' };

export default function DashboardPage() {
  // Currently scaffolding with mock data as per Phase 5B rules.
  // Backend data fetching will be implemented in a future phase.
  
  return <DashboardClient dto={mockDashboardIntelligence} />;
}
