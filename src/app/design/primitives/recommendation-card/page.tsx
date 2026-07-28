import * as React from 'react';
import { RecommendationCard } from '@/components/finance/RecommendationCard';
import { PrimitiveProvingGround, VariantBlock } from '../../_components/PrimitiveProvingGround';

export const metadata = {
  title: 'RecommendationCard | Ledger360 Design System',
};

export default function RecommendationCardProvingGround() {
  return (
    <PrimitiveProvingGround
      name="RecommendationCard"
      purpose="The user must never reach the bottom of a continuous canvas without knowing what to do next. The RecommendationCard transitions the user from analyzing the past to controlling the future."
      whenToUse="Use at the very bottom of a dashboard or detail page to provide the single most impactful action the user can take."
      whenNotToUse="Do not use in the middle of a screen. Do not use for multiple, competing actions."
      antiPatterns={[
        {
          correct: "A single, clear action: 'Transfer KES 8,000 to Emergency Fund'.",
          incorrect: "A card with three different buttons for Transfer, Invest, and Pay Loan."
        },
        {
          correct: "Telling the user 'Keep doing what you're doing' if they are perfectly on track.",
          incorrect: "Forcing a recommendation like 'Review your settings' just to fill the space."
        }
      ]}
    >
      <VariantBlock 
        title="Active State" 
        description="Used when the system has identified a high-value action the user should take."
      >
        <div className="py-8">
          <RecommendationCard 
            actionStatement="Transfer KES 8,000 to your Emergency Fund."
            narrative="Completing this keeps you on track for your March target."
            actionLabel="Transfer Now"
            status="active"
          />
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Peace State" 
        description="Used when the user is on track. This provides closure and ends the session on a high note."
      >
        <div className="py-8">
          <RecommendationCard 
            actionStatement="Keep doing what you're doing."
            narrative="You're on track across all budgets and goals. No action is needed today."
            status="peace"
          />
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Loading State" 
        description="Reserves the space at the bottom of the page while the AI engine computes the best next step."
      >
        <div className="py-8">
          <RecommendationCard 
            actionStatement=""
            narrative=""
            isLoading={true}
          />
        </div>
      </VariantBlock>
    </PrimitiveProvingGround>
  );
}
