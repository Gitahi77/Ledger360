import * as React from 'react';
import { HeroMetric } from '@/components/finance/HeroMetric';
import { PrimitiveProvingGround, VariantBlock } from '../../_components/PrimitiveProvingGround';

export const metadata = {
  title: 'HeroMetric | Ledger360 Design System',
};

export default function HeroMetricProvingGround() {
  return (
    <PrimitiveProvingGround
      name="HeroMetric"
      purpose="The HeroMetric serves as the absolute focal point of any major screen. It is designed to answer the user's biggest question within 3 seconds, using massive typography and luxurious whitespace."
      whenToUse="Use at the top of primary dashboards or detail views (like a specific Goal or Loan) to communicate the most important number."
      whenNotToUse="Do not use inside standard cards, sidebars, or lists. There should never be more than one HeroMetric visible on a screen above the fold."
      antiPatterns={[
        {
          correct: "HeroMetric placed at the top of the page, surrounded by Ultra Spacious padding.",
          incorrect: "HeroMetric squeezed into a 3-column grid alongside other widgets."
        },
        {
          correct: "Using the subtitle prop to add context ('Everything due this week is accounted for').",
          incorrect: "Adding custom sub-components or buttons directly beneath the metric without using a separate RecommendationCard."
        }
      ]}
    >
      <VariantBlock 
        title="Standard State" 
        description="The primary presentation of the HeroMetric. Notice the Apple rhythm and 64px scale."
      >
        <div className="py-16">
          <HeroMetric 
            label="Total Balance" 
            value="KES 45,200" 
            subtitle="Everything due this week is accounted for." 
          />
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Loading State (Skeleton)" 
        description="Skeleton height matches the text exactly. This prevents any layout shift (CLS) when data loads."
      >
        <div className="py-16">
          <HeroMetric 
            label="Total Balance" 
            value="" 
            subtitle="Everything due this week is accounted for." 
            isLoading={true} 
          />
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Empty State" 
        description="Used when a user has no data for this view yet."
      >
        <div className="py-16">
          <HeroMetric 
            label="Total Balance" 
            value="" 
            subtitle="Everything due this week is accounted for." 
            isEmpty={true} 
          />
        </div>
      </VariantBlock>
    </PrimitiveProvingGround>
  );
}
