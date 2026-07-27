import type { Meta, StoryObj } from '@storybook/react';
import { CreatableCombobox } from './CreatableCombobox';

const meta = {
  title: 'UI/CreatableCombobox',
  component: CreatableCombobox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    placeholder: 'Select or create...',
    onCreateOption: (val: string) => alert(`Created: ${val}`),
  },
} satisfies Meta<typeof CreatableCombobox>;

export default meta;
type Story = StoryObj<typeof meta>;

const standardOptions = [
  { id: '1', value: 'apple', label: 'Apple' },
  { id: '2', value: 'banana', label: 'Banana' },
];

export const Default: Story = {
  args: {
    options: standardOptions,
  },
};

export const ExistingOption: Story = {
  args: {
    options: standardOptions,
    value: 'apple',
  },
};

export const CreateNewOption: Story = {
  args: {
    options: standardOptions,
    // Simulate user typing a non-existent option
    // Storybook interaction tests would be ideal here
  },
};
