import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: {
    variant: 'neutral',
    children: 'Completed',
  },
};

export const Positive: Story = {
  args: {
    variant: 'positive',
    children: '+ $1,200',
  },
};

export const Negative: Story = {
  args: {
    variant: 'negative',
    children: '- $500',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Pending',
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Badge',
  },
};
