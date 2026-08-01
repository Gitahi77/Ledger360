import { LoadingPulse } from '@/components/ui/loading-skeleton';

export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center h-full min-h-[50vh] w-full">
      <LoadingPulse text="Loading Workspace" />
    </div>
  );
}
