import { NsePortfolioBoard } from '@/components/dashboard/NsePortfolioBoard';

export default function NsePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-16 md:space-y-24 pb-24 pt-8 px-4 md:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">NSE Portfolio</h1>
        <p className="text-muted-foreground mt-2">Track your Nairobi Securities Exchange investments.</p>
      </div>
      <NsePortfolioBoard />
    </div>
  );
}
