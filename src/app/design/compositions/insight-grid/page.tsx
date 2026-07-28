import * as React from 'react';
import { InsightGrid } from '@/components/finance/InsightGrid';
import { InsightCard } from '@/components/finance/InsightCard';
import { PrimitiveProvingGround, VariantBlock } from '../../_components/PrimitiveProvingGround';

export const metadata = {
  title: 'InsightGrid Composition | Ledger360',
};

export default function InsightGridProvingGround() {
  return (
    <PrimitiveProvingGround
      name="InsightGrid"
      purpose="Orchestrates multiple InsightCards using a responsive grid where critical items take priority spanning the full width."
      whenToUse="When presenting the user with multiple system-generated insights on the dashboard."
      whenNotToUse="Do not use for static content or navigation."
      antiPatterns={[
        {
          correct: "A grid where one Critical insight spans the full width and two Info insights sit side-by-side below it.",
          incorrect: "Forcing a Critical insight into a tiny 1/3 column."
        }
      ]}
    >
      <VariantBlock title="Standard Assembly">
        <InsightGrid>
          <InsightCard 
            severity="critical"
            title="Over Budget"
            content="You have exceeded your Entertainment budget by KES 4,500 with 12 days left in the month."
            actionLabel="Review Spending"
          />
          <InsightCard 
            severity="warning"
            title="Approaching Limit"
            content="Your upcoming auto-insurance payment may cause an overdraft based on current cashflow."
          />
          <InsightCard 
            severity="info"
            content="You usually spend more on groceries on Thursdays. Consider planning meals in advance."
          />
        </InsightGrid>
      </VariantBlock>
    </PrimitiveProvingGround>
  );
}
