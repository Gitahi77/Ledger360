import type { Meta, StoryObj } from '@storybook/react';
import { PercentageChange } from './PercentageChange';

const meta = {
  title: 'Finance/PercentageChange',
  component: PercentageChange,
  tags: ['autodocs'],
} satisfies Meta<typeof PercentageChange>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Positive: Story = {
  args: {
    value: 0.125, // 12.5%
  },
};

export const Negative: Story = {
  args: {
    value: -0.042, // -4.2%
  },
};

export const Zero: Story = {
  args: {
    value: 0,
  },
};

export const ForcedSign: Story = {
  args: {
    value: 0.125,
    forceSign: true,
  },
};

export const CustomDecimals: Story = {
  args: {
    value: 0.12567,
    decimals: 3,
  },
};

export const ExplicitTone: Story = {
  args: {
    value: 0.05,
    tone: 'warning',
  },
};
