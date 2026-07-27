import type { Meta, StoryObj } from '@storybook/react';
import { AmountBadge } from './AmountBadge';

const meta = {
  title: 'Finance/AmountBadge',
  component: AmountBadge,
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: 'select',
      options: ['Pending', 'Cleared', 'Failed', 'Scheduled', undefined],
    },
    direction: {
      control: 'select',
      options: ['Income', 'Expense', 'Transfer', undefined],
    },
  },
} satisfies Meta<typeof AmountBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const IncomeCleared: Story = {
  args: {
    direction: 'Income',
    status: 'Cleared',
  },
};

export const ExpensePending: Story = {
  args: {
    direction: 'Expense',
    status: 'Pending',
  },
};

export const TransferScheduled: Story = {
  args: {
    direction: 'Transfer',
    status: 'Scheduled',
  },
};

export const StatusOnly: Story = {
  args: {
    status: 'Failed',
  },
};

export const DirectionOnly: Story = {
  args: {
    direction: 'Income',
  },
};
