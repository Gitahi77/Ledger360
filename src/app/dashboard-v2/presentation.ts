import { HeroSectionProps } from '@/components/finance/HeroSection';
import { AttentionSectionProps } from '@/components/finance/AttentionSection';
import { ReflectionSectionProps } from '@/components/finance/ReflectionSection';
import { ProgressSectionProps } from '@/components/finance/ProgressSection';
import { ActionSectionProps } from '@/components/finance/ActionSection';

export interface DashboardPresentation {
  hero: HeroSectionProps;
  attention: AttentionSectionProps;
  reflection: ReflectionSectionProps;
  progress: ProgressSectionProps;
  action: ActionSectionProps;
}

export function buildDashboardPresentation(): DashboardPresentation {
  return {
    hero: {
      metric: {
        label: 'Safe to Spend',
        value: 'KES 42,500',
        status: 'positive',
      },
      calculation: [
        { label: 'Liquid Cash', value: 'KES 120,000' },
        { label: 'Upcoming Bills', value: '-KES 35,000' },
        { label: 'Savings Goal', value: '-KES 42,500' },
      ],
    },
    attention: {
      insights: [
        {
          severity: 'warning',
          title: 'Unusual Spending',
          content: 'Grocery spending is 40% higher than your weekly average. Consider reviewing your supermarket trips.',
          actionLabel: 'Review Groceries',
        },
        {
          severity: 'info',
          title: 'Bill Upcoming',
          content: 'Your KPLC Electricity bill is due in 3 days (KES 2,500).',
          actionLabel: 'Pay Now',
        },
      ],
    },
    reflection: {
      title: 'Recent Activity',
      groups: [
        {
          label: 'Today',
          items: [
            {
              title: 'Naivas Supermarket',
              description: 'Groceries',
              value: '-KES 4,200',
              time: '18:45',
            },
            {
              title: 'M-Pesa to John Doe',
              description: 'Lunch split',
              value: '-KES 850',
              time: '13:15',
            },
          ],
        },
        {
          label: 'Yesterday',
          items: [
            {
              title: 'Salary Deposit',
              description: 'Tech Corp Kenya',
              value: '+KES 250,000',
              time: '08:00',
              status: 'success',
            },
            {
              title: 'Safaricom PostPay',
              description: 'Monthly Bill',
              value: '-KES 3,000',
              time: '09:30',
            },
          ],
        },
      ],
    },
    progress: {
      title: 'Goals & Progress',
      items: [
        {
          type: 'story',
          props: {
            title: 'Emergency Fund',
            narrative: 'You are on track to hit your target by December.',
            metric: 'KES 150,000',
            progress: 75,
            status: 'positive',
            actionLabel: 'View Goal',
          },
        },
        {
          type: 'journey',
          props: {
            title: 'Net Worth',
            primaryMetric: '+KES 85,000',
            trendLabel: 'since last month',
            narrative: 'Your SACCO dividend and steady MMF contributions drove this growth.',
            trendDirection: 'positive',
          },
        },
      ],
    },
    action: {
      recommendation: {
        title: 'Recommended Action',
        actionStatement: 'Transfer KES 15,000 to MMF',
        narrative: 'You have excess liquid cash this month. Moving it to your Money Market Fund will earn you interest while keeping it accessible.',
        actionLabel: 'Transfer Now',
        status: 'active',
      },
    },
  };
}
