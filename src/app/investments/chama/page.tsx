import { ChamaBoard } from '@/components/dashboard/ChamaBoard';

export default function ChamaPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 md:space-y-24 pb-24 pt-8 px-4 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">Chamas</h1>
        <p className="text-muted-foreground mt-2">Manage your Chama contributions and investments.</p>
      </div>
      <ChamaBoard />
    </div>
  );
}
