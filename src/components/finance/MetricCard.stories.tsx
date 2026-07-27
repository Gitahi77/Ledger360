import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { MetricCard } from './MetricCard';
import { Activity } from 'lucide-react';
import { PercentageChange } from './PercentageChange';
import { TrendIndicator } from './TrendIndicator';

const meta = {
  title: 'Finance/MetricCard',
  component: MetricCard,
  tags: ['autodocs'],
} satisfies Meta<typeof MetricCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Active Subscriptions',
    primaryMetric: '12',
    secondaryMetric: 'vs last month',
    trend: <TrendIndicator value={0.15} />,
    icon: <Activity className="w-4 h-4" />,
  },
};

export const WithoutTrend: Story = {
  args: {
    title: 'Total Users',
    primaryMetric: '1,234',
    icon: <Activity className="w-4 h-4" />,
  },
};
