import * as React from 'react';
import { CalculationPills } from '@/components/finance/CalculationPill';
import { PrimitiveProvingGround, VariantBlock } from '../../_components/PrimitiveProvingGround';

export const metadata = {
  title: 'CalculationPills | Ledger360 Design System',
};

export default function CalculationPillsProvingGround() {
  return (
    <PrimitiveProvingGround
      name="CalculationPills"
      purpose="Trust in a financial application requires transparent math. CalculationPills break down a complex derived metric (like 'Safe to Spend') into its constituent parts, proving to the user exactly how the number was calculated."
      whenToUse="Use directly beneath any derived or magic number (like Safe to Spend, Net Worth, or Left to Budget)."
      whenNotToUse="Do not use for raw, uncalculated balances. Do not use if the math is too complex to show in 3-4 simple steps."
      antiPatterns={[
        {
          correct: "Showing [Liquid Cash] - [Obligations] = [Safe to Spend].",
          incorrect: "Showing a 'Safe to Spend' number with an info icon that opens a 5-paragraph tooltip."
        },
        {
          correct: "Using operators (+, -, =) clearly between pills.",
          incorrect: "Stacking pills without operators, forcing the user to guess the relationship."
        }
      ]}
    >
      <VariantBlock 
        title="Standard Calculation (Subtraction)" 
        description="Used for explaining derived limits, like Safe to Spend."
      >
        <div className="py-4">
          <CalculationPills 
            items={[
              { label: 'Liquid Cash', value: 'KES 45,000', operator: '-' },
              { label: 'Upcoming Bills', value: 'KES 12,000', operator: '=' },
              { label: 'Safe to Spend', value: 'KES 33,000', isResult: true }
            ]}
          />
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Standard Calculation (Addition)" 
        description="Used for explaining aggregations, like Total Debt or Net Worth."
      >
        <div className="py-4">
          <CalculationPills 
            items={[
              { label: 'Checking', value: 'KES 25,000', operator: '+' },
              { label: 'Savings', value: 'KES 150,000', operator: '+' },
              { label: 'Investments', value: 'KES 400,000', operator: '=' },
              { label: 'Liquid Assets', value: 'KES 575,000', isResult: true }
            ]}
          />
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Single Modifier" 
        description="Used when explaining a simple delta, like a fee applied to a transfer."
      >
        <div className="py-4">
          <CalculationPills 
            items={[
              { label: 'Transfer Amount', value: 'KES 10,000', operator: '+' },
              { label: 'M-Pesa Fee', value: 'KES 105', operator: '=' },
              { label: 'Total Deducted', value: 'KES 10,105', isResult: true }
            ]}
          />
        </div>
      </VariantBlock>
    </PrimitiveProvingGround>
  );
}
