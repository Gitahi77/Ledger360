import type { Meta, StoryObj } from '@storybook/react';
import { TrendIndicator } from './TrendIndicator';

const meta = {
  title: 'Finance/TrendIndicator',
  component: TrendIndicator,
  tags: ['autodocs'],
} satisfies Meta<typeof TrendIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Up: Story = {
  args: {
    value: 0.05,
  },
};

export const Down: Story = {
  args: {
    value: -0.02,
  },
};

export const Flat: Story = {
  args: {
    value: 0,
  },
};
