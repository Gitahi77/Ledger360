import type { Meta, StoryObj } from '@storybook/react';
import { FinancialValue } from './FinancialValue';

const meta = {
  title: 'Finance/FinancialValue',
  component: FinancialValue,
  tags: ['autodocs'],
} satisfies Meta<typeof FinancialValue>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    money: { amountMinor: 1245000, currency: 'USD' },
    trendValue: 0.045,
  },
};

export const NegativeTrend: Story = {
  args: {
    money: { amountMinor: 890000, currency: 'USD' },
    trendValue: -0.012,
  },
};

export const WithoutTrend: Story = {
  args: {
    money: { amountMinor: 500000, currency: 'USD' },
  },
};
