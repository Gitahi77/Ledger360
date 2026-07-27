import type { Meta, StoryObj } from '@storybook/react';
import { Combobox } from './Combobox';

const meta = {
  title: 'UI/Combobox',
  component: Combobox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    placeholder: 'Select an option...',
  },
} satisfies Meta<typeof Combobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const standardOptions = [
  { id: '1', value: 'apple', label: 'Apple' },
  { id: '2', value: 'banana', label: 'Banana' },
  { id: '3', value: 'cherry', label: 'Cherry' },
  { id: '4', value: 'date', label: 'Date' },
  { id: '5', value: 'elderberry', label: 'Elderberry' },
];

export const Default: Story = {
  args: {
    options: standardOptions,
  },
};

export const SelectedValue: Story = {
  args: {
    options: standardOptions,
    value: 'banana',
  },
};

export const Disabled: Story = {
  args: {
    options: standardOptions,
    disabled: true,
  },
};

export const Empty: Story = {
  args: {
    options: [],
  },
};

export const Loading: Story = {
  args: {
    options: standardOptions,
    // Add loading prop if implemented, otherwise simulate via disabled/empty
    placeholder: 'Loading...',
    disabled: true,
  },
};

// export const Error: Story = {
//   args: {
//     options: standardOptions,
//   },
// };

// Generate a long list of options
const longOptions = Array.from({ length: 100 }, (_, i) => ({
  id: String(i),
  value: `item-${i}`,
  label: `Item ${i}`,
}));

export const LongList: Story = {
  args: {
    options: longOptions,
  },
};

export const RTL: Story = {
  args: {
    options: standardOptions,
  },
  parameters: {
    // If the project uses a standard RTL wrapper, we would configure it here
  }
};
