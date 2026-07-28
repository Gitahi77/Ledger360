import * as React from 'react';
import { StoryStack } from '@/components/finance/StoryStack';
import { StoryCard } from '@/components/finance/StoryCard';
import { PrimitiveProvingGround, VariantBlock } from '../../_components/PrimitiveProvingGround';

export const metadata = {
  title: 'StoryStack Composition | Ledger360',
};

export default function StoryStackProvingGround() {
  return (
    <PrimitiveProvingGround
      name="StoryStack"
      purpose="Groups related stories (like Budgets or Goals) under a unified header, ensuring consistent spacing and grid layout."
      whenToUse="When presenting a collection of tracking items, such as Active Goals or Budget Categories."
      whenNotToUse="Do not use for a single item. Do not use for non-narrative data."
      antiPatterns={[
        {
          correct: "A clean grid of 3 goals side-by-side on desktop, stacking on mobile.",
          incorrect: "A single StoryCard wrapped in a StoryStack."
        }
      ]}
    >
      <VariantBlock title="Goals Assembly">
        <StoryStack title="Your Active Goals">
          <StoryCard 
            title="Emergency Fund"
            narrative="You are 2 months ahead of schedule for your end-of-year target."
            metric="KES 240k / 300k"
            progress={80}
            status="positive"
          />
          <StoryCard 
            title="Vacation"
            narrative="You are perfectly on pace to fund this by July."
            metric="KES 50k / 100k"
            progress={50}
            status="positive"
          />
          <StoryCard 
            title="Car Loan Payoff"
            narrative="You missed last month's extra payment. You'll pay KES 12,000 more in interest if you don't catch up."
            metric="14 Months Left"
            progress={65}
            status="warning"
          />
        </StoryStack>
      </VariantBlock>
    </PrimitiveProvingGround>
  );
}
