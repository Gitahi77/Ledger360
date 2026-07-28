import * as React from 'react';
import { JourneyCard } from '@/components/finance/JourneyCard';
import { PrimitiveProvingGround, VariantBlock } from '../../_components/PrimitiveProvingGround';

export const metadata = {
  title: 'JourneyCard | Ledger360 Design System',
};

export default function JourneyCardProvingGround() {
  return (
    <PrimitiveProvingGround
      name="JourneyCard"
      purpose="Every long-term financial object should communicate movement rather than balance. The JourneyCard focuses on velocity and trajectory."
      whenToUse="Use for tracking long-term structural changes like Net Worth growth, SACCO dividend history, or Mortgage paydowns."
      whenNotToUse="Do not use for immediate budget tracking (Use StoryCard). Do not omit the timeline/velocity reference."
      antiPatterns={[
        {
          correct: "Showing '+KES 220k since January' to emphasize the user's velocity.",
          incorrect: "Showing just the total balance of 'KES 2,000,000' which provides no sense of pacing or achievement."
        },
        {
          correct: "Explaining the driver of the movement: 'Driven by consistent MMF deposits.'",
          incorrect: "Leaving the narrative blank or providing generic placeholder text."
        }
      ]}
    >
      <VariantBlock 
        title="Wealth Growth (Positive Velocity)" 
        description="Used when an asset is compounding or increasing favorably."
      >
        <div className="py-4 max-w-sm">
          <JourneyCard 
            title="Net Worth"
            primaryMetric="+KES 220k"
            trendLabel="since January"
            narrative="Highest in 8 months. Driven by consistent MMF deposits."
            trendDirection="positive"
          />
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Debt Reduction (Positive Velocity)" 
        description="Even though debt is 'negative', paying it down is a positive trend."
      >
        <div className="py-4 max-w-sm">
          <JourneyCard 
            title="Car Loan"
            primaryMetric="-KES 45k"
            trendLabel="this quarter"
            narrative="Principal is dropping faster due to the extra KES 10k monthly payment."
            trendDirection="positive"
          />
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Asset Depreciation (Negative Velocity)" 
        description="Used when a tracked asset has lost value over the horizon."
      >
        <div className="py-4 max-w-sm">
          <JourneyCard 
            title="NSE Portfolio"
            primaryMetric="-KES 12k"
            trendLabel="last 30 days"
            narrative="Market dip affecting SafariCom and Equity holdings."
            trendDirection="negative"
          />
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Loading State" 
        description="Maintains exact component dimensions (180px height) to prevent CLS."
      >
        <div className="py-4 max-w-sm">
          <JourneyCard 
            title="Loading"
            primaryMetric=""
            trendLabel=""
            narrative=""
            isLoading={true}
          />
        </div>
      </VariantBlock>
    </PrimitiveProvingGround>
  );
}
