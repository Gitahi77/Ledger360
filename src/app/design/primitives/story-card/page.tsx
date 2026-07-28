import * as React from 'react';
import { StoryCard } from '@/components/finance/StoryCard';
import { PrimitiveProvingGround, VariantBlock } from '../../_components/PrimitiveProvingGround';

export const metadata = {
  title: 'StoryCard | Ledger360 Design System',
};

export default function StoryCardProvingGround() {
  return (
    <PrimitiveProvingGround
      name="StoryCard"
      purpose="The StoryCard exists because raw percentages and balances are useless without context. A StoryCard translates a raw metric into a conversational sentence (e.g., 'You are finishing two months early')."
      whenToUse="Use when displaying financial pacing, such as Budget tracking, Loan Repayment, or Goal Funding."
      whenNotToUse="Do not use to simply display an account balance. The narrative must always be the primary focus."
      antiPatterns={[
        {
          correct: "A StoryCard explaining progress: 'You are on track to fund your vacation by July.'",
          incorrect: "A StoryCard displaying a raw balance: 'KES 50,000 in your account.'"
        },
        {
          correct: "Using the progress bar to show pacing toward a known target.",
          incorrect: "Using a progress bar for an open-ended metric like Net Worth (Use JourneyCard instead)."
        }
      ]}
    >
      <VariantBlock 
        title="Positive State (On Track)" 
        description="Used when the user is pacing well against their financial target."
      >
        <div className="py-4 max-w-sm">
          <StoryCard 
            title="Emergency Fund"
            narrative="You are 2 months ahead of schedule for your end-of-year target."
            metric="KES 240k / 300k"
            progress={80}
            status="positive"
            actionLabel="View Details"
          />
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Warning State (Off Pace)" 
        description="Used when the user is slipping behind but hasn't failed the target."
      >
        <div className="py-4 max-w-sm">
          <StoryCard 
            title="Car Loan"
            narrative="You missed last month's extra payment. You'll pay KES 12,000 more in interest if you don't catch up."
            metric="14 Months Left"
            progress={65}
            status="warning"
            actionLabel="Make Extra Payment"
          />
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Negative State (Over Budget)" 
        description="Used when a strict constraint has been breached."
      >
        <div className="py-4 max-w-sm">
          <StoryCard 
            title="Dining Out"
            narrative="You've exceeded your budget. Consider cooking at home for the rest of the week."
            metric="115% Spent"
            progress={100}
            status="negative"
          />
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Empty State" 
        description="Used when there is no active data to tell a story about."
      >
        <div className="py-4 max-w-sm">
          <StoryCard 
            title="Vacation Fund"
            narrative=""
            metric=""
            isEmpty={true}
          />
        </div>
      </VariantBlock>
    </PrimitiveProvingGround>
  );
}
