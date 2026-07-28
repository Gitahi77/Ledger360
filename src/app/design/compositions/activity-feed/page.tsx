import * as React from 'react';
import { ActivityFeed } from '@/components/finance/ActivityFeed';
import { TimelineGroup, TimelineItem } from '@/components/finance/Timeline';
import { PrimitiveProvingGround, VariantBlock } from '../../_components/PrimitiveProvingGround';

export const metadata = {
  title: 'ActivityFeed Composition | Ledger360',
};

export default function ActivityFeedProvingGround() {
  return (
    <PrimitiveProvingGround
      name="ActivityFeed"
      purpose="Wraps Timeline groups in a card with a standardized header and spacing."
      whenToUse="When presenting the global recent activity stream on a dashboard or detail page."
      whenNotToUse="Do not use for a list of items that aren't chronological events."
      antiPatterns={[
        {
          correct: "A card titled 'Recent Activity' containing 'Today' and 'Yesterday' groups.",
          incorrect: "A card titled 'Accounts' using the timeline to list Checking and Savings."
        }
      ]}
    >
      <VariantBlock title="Standard Assembly">
        <ActivityFeed>
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
        </ActivityFeed>
      </VariantBlock>
    </PrimitiveProvingGround>
  );
}
