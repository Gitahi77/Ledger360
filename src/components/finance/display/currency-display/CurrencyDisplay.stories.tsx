/* eslint-disable storybook/no-renderer-packages */
import type { Meta, StoryObj } from '@storybook/react';
import { CurrencyDisplay } from './CurrencyDisplay';

const meta = {
  title: 'Finance/CurrencyDisplay',
  component: CurrencyDisplay,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'hero'],
    },
    signDisplay: {
      control: 'select',
      options: ['auto', 'always', 'never'],
    },
    colorize: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof CurrencyDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const KES: Story = {
  args: {
    value: { amountMinor: 500000, currencyCode: 'KES' }, // 5,000.00 KES
  },
};

export const USD: Story = {
  args: {
    value: { amountMinor: 25050, currencyCode: 'USD' }, // $250.50
  },
};

export const Zero: Story = {
  args: {
    value: { amountMinor: 0, currencyCode: 'USD' },
  },
};

export const Positive: Story = {
  args: {
    value: { amountMinor: 150000, currencyCode: 'KES' },
    colorize: true,
    signDisplay: 'always',
  },
};

export const Negative: Story = {
  args: {
    value: { amountMinor: -45000, currencyCode: 'KES' },
    colorize: true,
  },
};

export const Missing: Story = {
  args: {
    value: null,
  },
};

export const LargeNumber: Story = {
  args: {
    value: { amountMinor: 125000000000, currencyCode: 'KES' }, // 1.25B
  },
};

export const TinyDecimal: Story = {
  args: {
    value: { amountMinor: 5, currencyCode: 'USD' }, // $0.05
  },
};

export const HeroSize: Story = {
  args: {
    value: { amountMinor: 125000000000, currencyCode: 'KES' },
    size: 'hero',
  },
};

export const SmallSize: Story = {
  args: {
    value: { amountMinor: 500000, currencyCode: 'KES' },
    size: 'sm',
  },
};
