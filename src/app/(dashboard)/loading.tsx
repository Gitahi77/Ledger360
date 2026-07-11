import { Surface } from '@/components/ui/surface/Surface';
import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="p-6 md:p-8 flex-1 flex flex-col items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center text-slate-400 dark:text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p className="text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}
