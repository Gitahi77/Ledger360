import type { Meta, StoryObj } from '@storybook/react';
import { BalanceCard } from './BalanceCard';

const meta = {
  title: 'Finance/BalanceCard',
  component: BalanceCard,
  tags: ['autodocs'],
} satisfies Meta<typeof BalanceCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Total Balance',
    money: { amountMinor: 1245000, currency: 'USD' },
    trendValue: 0.045,
  },
};

export const WithBadge: Story = {
  args: {
    title: 'Latest Income',
    money: { amountMinor: 500000, currency: 'USD' },
    status: 'Cleared',
    direction: 'Income',
    trendValue: 0.12,
  },
};

export const NegativeBalance: Story = {
  args: {
    title: 'Credit Card Debt',
    money: { amountMinor: -450000, currency: 'USD' },
    trendValue: 0.02,
    valueProps: {
      currencyProps: {
        tone: 'negative'
      }
    }
  },
};
