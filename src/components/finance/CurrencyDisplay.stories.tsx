import type { Meta, StoryObj } from '@storybook/react';
import { CurrencyDisplay } from './CurrencyDisplay';

const meta = {
  title: 'Finance/CurrencyDisplay',
  component: CurrencyDisplay,
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'select',
      options: ['positive', 'negative', 'neutral', 'warning', 'pending', undefined],
    },
    variant: {
      control: 'select',
      options: ['standard', 'compact', 'accounting'],
    },
    locale: { control: 'text' },
    showSymbol: { control: 'boolean' },
    precision: { control: 'number' },
  },
} satisfies Meta<typeof CurrencyDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Edge Cases ---

export const Positive: Story = {
  args: {
    money: { amountMinor: 125000, currency: 'USD' },
    tone: 'positive',
  },
};

export const Negative: Story = {
  args: {
    money: { amountMinor: -45050, currency: 'USD' },
    tone: 'negative',
  },
};

export const Zero: Story = {
  args: {
    money: { amountMinor: 0, currency: 'USD' },
    tone: 'neutral',
  },
};

export const CentsOnly: Story = {
  args: {
    money: { amountMinor: 8, currency: 'USD' }, // $0.08
  },
};

export const AccountingVariant: Story = {
  args: {
    money: { amountMinor: -123400, currency: 'USD' },
    variant: 'accounting',
  },
};

export const CompactMillions: Story = {
  args: {
    money: { amountMinor: 154000000, currency: 'USD' }, // 1.54M
    variant: 'compact',
  },
};

export const CompactBillions: Story = {
  args: {
    money: { amountMinor: 450000000000, currency: 'USD' }, // 4.5B
    variant: 'compact',
  },
};

export const BigIntInput: Story = {
  args: {
    money: { amountMinor: 100000000000000n, currency: 'USD' }, // $1,000,000,000,000
  },
};

export const HiddenSymbol: Story = {
  args: {
    money: { amountMinor: 50000, currency: 'USD' },
    showSymbol: false,
  },
};

export const MultipleCurrencies: Story = {
  args: { money: { amountMinor: 0, currency: 'USD' } },
  render: () => (
    <div className="flex flex-col gap-4">
      <CurrencyDisplay money={{ amountMinor: 10000, currency: 'USD' }} />
      <CurrencyDisplay money={{ amountMinor: 10000, currency: 'EUR' }} locale="de-DE" />
      <CurrencyDisplay money={{ amountMinor: 10000, currency: 'GBP' }} locale="en-GB" />
      <CurrencyDisplay money={{ amountMinor: 10000, currency: 'JPY' }} locale="ja-JP" precision={0} />
      <CurrencyDisplay money={{ amountMinor: 10000, currency: 'KES' }} locale="en-KE" />
    </div>
  ),
};

export const RTLSupport: Story = {
  args: { money: { amountMinor: 0, currency: 'AED' } },
  render: () => (
    <div dir="rtl" className="flex flex-col gap-2">
      <CurrencyDisplay money={{ amountMinor: 125000, currency: 'AED' }} locale="ar-AE" />
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: {
    themes: {
      themeOverride: 'dark',
    },
  },
  args: {
    money: { amountMinor: 100000, currency: 'USD' },
  },
};
