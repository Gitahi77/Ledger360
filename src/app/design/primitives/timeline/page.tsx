import * as React from 'react';
import { TimelineGroup, TimelineItem } from '@/components/finance/Timeline';
import { PrimitiveProvingGround, VariantBlock } from '../../_components/PrimitiveProvingGround';

export const metadata = {
  title: 'Timeline | Ledger360 Design System',
};

export default function TimelineProvingGround() {
  return (
    <PrimitiveProvingGround
      name="Timeline"
      purpose="The Timeline is used to present a chronological sequence of events. It groups items conversationally (e.g., 'Today', 'Yesterday') and emphasizes narrative over metadata."
      whenToUse="Use for the Activity Feed, transaction histories, and chronological status updates."
      whenNotToUse="Do not use for displaying a list of un-ordered items (like accounts). Do not use if the exact chronological relationship between items is unimportant."
      antiPatterns={[
        {
          correct: "Grouping items under conversational headers like 'Today' and 'Yesterday'.",
          incorrect: "Grouping items by exact date strings like '2024-03-12' and '2024-03-11'."
        },
        {
          correct: "Narrative titles like 'Your salary arrived'.",
          incorrect: "Raw database titles like 'DEP_PAYROLL_X321'."
        }
      ]}
    >
      <VariantBlock 
        title="Standard Sequence" 
        description="A typical grouping of chronological events."
      >
        <div className="py-4 max-w-md">
          <TimelineGroup label="Today">
            <TimelineItem 
              title="Salary arrived" 
              description="TechCorp Inc." 
              value="+KES 150,000" 
              status="success" 
            />
            <TimelineItem 
              title="Auto-transferred to Savings" 
              description="Emergency Fund Rule" 
              value="-KES 20,000" 
              status="standard" 
              isLast={true}
            />
          </TimelineGroup>
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Warning & Flagged Sequence" 
        description="Items that require attention interrupt the visual flow with the warning color."
      >
        <div className="py-4 max-w-md">
          <TimelineGroup label="Yesterday">
            <TimelineItem 
              title="Netflix Subscription" 
              description="Entertainment Budget" 
              value="-KES 1,200" 
              status="standard" 
            />
            <TimelineItem 
              title="Overdraft Fee Warning" 
              description="You dipped below your KES 5k buffer." 
              time="14:30"
              status="warning" 
              isLast={true}
            />
          </TimelineGroup>
        </div>
      </VariantBlock>

      <VariantBlock 
        title="Loading State" 
        description="No specialized loading variant exists inside the TimelineItem. Render skeletons as standard nodes."
      >
        <div className="py-4 max-w-md">
          <TimelineGroup label="Loading">
            <div className="pl-8 py-3 relative -ml-2">
               <div className="absolute left-[11px] top-8 bottom-[-12px] w-[2px] bg-border" />
               <div className="absolute left-1 top-4 w-6 h-6 rounded-full border-2 border-background bg-muted shadow-sm z-10" />
               <div className="h-5 w-32 bg-muted rounded animate-pulse mb-2" />
               <div className="h-4 w-24 bg-muted/60 rounded animate-pulse" />
            </div>
            <div className="pl-8 py-3 relative -ml-2">
               <div className="absolute left-1 top-4 w-6 h-6 rounded-full border-2 border-background bg-muted shadow-sm z-10" />
               <div className="h-5 w-48 bg-muted rounded animate-pulse mb-2" />
               <div className="h-4 w-16 bg-muted/60 rounded animate-pulse" />
            </div>
          </TimelineGroup>
        </div>
      </VariantBlock>
    </PrimitiveProvingGround>
  );
}
