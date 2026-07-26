/* eslint-disable storybook/no-renderer-packages */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from './Input';
import { Search, Mail, DollarSign } from 'lucide-react';
import React from 'react';

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
    },
    error: {
      control: 'text',
    },
    placeholder: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your email',
    type: 'email',
  },
};

export const WithError: Story = {
  args: {
    placeholder: 'Password',
    type: 'password',
    defaultValue: '123',
    error: 'Password must be at least 8 characters long.',
  },
};

export const WithIconLeft: Story = {
  args: {
    placeholder: 'Search transactions...',
    iconLeft: <Search className="h-4 w-4" />,
  },
};

export const WithIconRight: Story = {
  args: {
    placeholder: 'Email address',
    type: 'email',
    iconRight: <Mail className="h-4 w-4" />,
  },
};

export const FinancialInput: Story = {
  args: {
    placeholder: '0.00',
    type: 'number',
    iconLeft: <DollarSign className="h-4 w-4" />,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: 'Cannot edit this',
    disabled: true,
  },
};
