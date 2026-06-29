import { requireAuth } from '@/lib/actions/_auth';
export const dynamic = 'force-dynamic';
import { AppLayout } from '@/components/layout/AppLayout';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure all routes within the dashboard group are authenticated
  await requireAuth();

  return <AppLayout>{children}</AppLayout>;
}
