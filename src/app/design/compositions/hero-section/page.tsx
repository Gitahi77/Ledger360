import * as React from 'react';
import { HeroSection } from '@/components/finance/HeroSection';
import { PrimitiveProvingGround, VariantBlock } from '../../_components/PrimitiveProvingGround';

export const metadata = {
  title: 'HeroSection Composition | Ledger360',
};

export default function HeroSectionProvingGround() {
  return (
    <PrimitiveProvingGround
      name="HeroSection"
      purpose="Combines the HeroMetric with CalculationPills to provide both the ultimate number and the transparent math that built it."
      whenToUse="As the primary header of the Safe to Spend dashboard or any view driven by a single calculated metric."
      whenNotToUse="Do not use for static metrics that require no calculation (use just HeroMetric instead)."
      antiPatterns={[
        {
          correct: "A large number followed by small pills explaining it.",
          incorrect: "Adding additional text, buttons, or charts into the hero space."
        }
      ]}
    >
      <VariantBlock title="Safe to Spend Pattern">
        <HeroSection 
          metric={{
            label: "Safe to Spend",
            value: "KES 33,000",
            subtitle: "You have 12 days left in the month."
          }}
          calculation={[
            { label: 'Liquid Cash', value: 'KES 45,000', operator: '-' },
            { label: 'Upcoming Bills', value: 'KES 12,000', operator: '=' },
            { label: 'Safe to Spend', value: 'KES 33,000', isResult: true }
          ]}
        />
      </VariantBlock>
    </PrimitiveProvingGround>
  );
}
