import * as React from 'react';
import { InsightCard } from '@/components/finance/InsightCard';
import { PrimitiveProvingGround, VariantBlock } from '../../_components/PrimitiveProvingGround';

export const metadata = {
  title: 'InsightCard | Ledger360 Design System',
};

export default function InsightCardProvingGround() {
  return (
    <PrimitiveProvingGround
      name="InsightCard"
      purpose="InsightCard communicates system-generated analysis about the user's financial state. Crucially, its physical size and visual weight scale according to severity, not just its color."
      whenToUse="Use when the system has identified a pattern, risk, or achievement that the user needs to know. Often displayed in a masonry grid or vertical stack."
      whenNotToUse="Do not use to display raw transaction data or account balances. Do not use for user-initiated actions (use a dialog/sheet instead)."
      antiPatterns={[
        {
          correct: "A Critical InsightCard spanning the full width of the grid to interrupt the user.",
          incorrect: "A Critical InsightCard placed in a small 300px column where its text is cramped."
        },
        {
          correct: "An Info InsightCard that blends into the background, requiring the user to intentionally read it.",
          incorrect: "Using a bright blue background for an Info card, drawing unnecessary attention."
        }
      ]}
    >
      <VariantBlock 
        title="Critical State" 
        description="Physically interrupts the layout with massive typography and padding. Demands an action."
      >
        <div className="py-4">
          <InsightCard 
            severity="critical"
            title="Over Budget"
            content="You have exceeded your Entertainment budget by KES 4,500 with 12 days left in the month."
            actionLabel="Review Spending"
          />
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Warning State" 
        description="Uses a strong left border to draw the eye, but maintains standard typography."
      >
        <div className="py-4 max-w-md">
          <InsightCard 
            severity="warning"
            title="Approaching Limit"
            content="Your upcoming auto-insurance payment may cause an overdraft based on current cashflow."
          />
        </div>
      </VariantBlock>
      
      <VariantBlock 
        title="Success State" 
        description="Subtle background tint to reinforce positive reinforcement."
      >
        <div className="py-4 max-w-md">
          <InsightCard 
            severity="success"
            title="Goal Reached"
            content="You've successfully fully funded your Emergency Fund for this year."
          />
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Info State" 
        description="Blends into the canvas. Uses muted text so the user only reads it if they want to."
      >
        <div className="py-4 max-w-md">
          <InsightCard 
            severity="info"
            content="You usually spend more on groceries on Thursdays. Consider planning meals in advance."
          />
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Loading State" 
        description="Prevents layout shift before the AI insight engine returns."
      >
        <div className="py-4 max-w-md">
          <InsightCard 
            severity="info"
            content=""
            isLoading={true}
          />
        </div>
      </VariantBlock>
    </PrimitiveProvingGround>
  );
}
