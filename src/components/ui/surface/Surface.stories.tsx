/* eslint-disable storybook/no-renderer-packages */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Surface } from './Surface';

const meta = {
  title: 'UI/Surface',
  component: Surface,
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    interactive: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Surface>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is a surface component, used as a foundation for cards and widget panels.',
    padding: 'md',
  },
};

export const LargePadding: Story = {
  args: {
    children: 'This surface has large padding.',
    padding: 'lg',
  },
};

export const Interactive: Story = {
  args: {
    children: 'Hover me! (Interactive Surface)',
    interactive: true,
    padding: 'md',
  },
};
