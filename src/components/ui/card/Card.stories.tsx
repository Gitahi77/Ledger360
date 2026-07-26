/* eslint-disable storybook/no-renderer-packages */
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Button } from '../button/Button';
import React from 'react';

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card className="w-[350px]" {...args}>
      <CardHeader>
        <CardTitle>Project Status</CardTitle>
        <CardDescription>View the status of your current tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Completion</span>
            <span className="font-mono font-medium">85%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[85%] rounded-full" />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="ghost" size="sm">Cancel</Button>
        <Button size="sm">Continue</Button>
      </CardFooter>
    </Card>
  ),
};

export const FinancialMetric: Story = {
  render: (args) => (
    <Card className="w-[300px]" {...args}>
      <CardHeader className="pb-2">
        <CardDescription>Total Net Worth</CardDescription>
        <CardTitle className="text-3xl">$124,500.00</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-finance-positive font-medium flex items-center gap-1">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
            <path d="M4.14645 8.14645C3.95118 7.95118 3.6346 7.95118 3.43934 8.14645C3.24408 8.34171 3.24408 8.65829 3.43934 8.85355L7.14645 12.5607C7.34171 12.7559 7.65829 12.7559 7.85355 12.5607L11.5607 8.85355C11.7559 8.65829 11.7559 8.34171 11.5607 8.14645C11.3654 7.95118 11.0488 7.95118 10.8536 8.14645L7.5 11.5001L4.14645 8.14645ZM7.5 11.5001V2.50012C7.5 2.22398 7.27614 2.00012 7 2.00012C6.72386 2.00012 6.5 2.22398 6.5 2.50012V11.5001H7.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" transform="rotate(180 7.5 7.5)"></path>
          </svg>
          +4.2% from last month
        </div>
      </CardContent>
    </Card>
  ),
};
