import type { Meta, StoryObj } from '@storybook/react';
import { CommandPalette } from './CommandPalette';
import { CommandRegistry, CommandProvider, CommandGroups, CommandAction } from '@/lib/commands';

// We wrap it to open automatically for Storybook
const StoryWrapper = () => {
  return (
    <div style={{ minHeight: '400px', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '50px' }}>
      <p className="text-muted-foreground text-sm">Press Cmd+K to open, or trigger the button below.</p>
      <button 
        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
        className="ml-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        Open Palette
      </button>
      <CommandPalette />
    </div>
  );
};

const meta = {
  title: 'UI/CommandPalette',
  component: StoryWrapper,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StoryWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper to inject mock commands
const injectMockProvider = (commands: CommandAction[]) => {
  const provider: CommandProvider = {
    id: 'mock.provider',
    getCommands: () => commands,
  };
  CommandRegistry.register(provider);
};

export const Default: Story = {
  decorators: [
    (Story) => {
      // Unregister everything first
      CommandRegistry['providers'].clear();
      injectMockProvider([
        { id: '1', title: 'Dashboard', group: CommandGroups.Navigation, perform: () => {} },
        { id: '2', title: 'New Transaction', group: CommandGroups.Create, perform: () => {} },
      ]);
      return <Story />;
    }
  ]
};

export const EmptyRegistry: Story = {
  decorators: [
    (Story) => {
      CommandRegistry['providers'].clear();
      return <Story />;
    }
  ]
};

export const MultipleGroups: Story = {
  decorators: [
    (Story) => {
      CommandRegistry['providers'].clear();
      injectMockProvider([
        { id: '1', title: 'Dashboard', group: CommandGroups.Navigation, perform: () => {} },
        { id: '2', title: 'Transactions', group: CommandGroups.Navigation, perform: () => {} },
        { id: '3', title: 'New Transaction', group: CommandGroups.Create, perform: () => {} },
        { id: '4', title: 'New Budget', group: CommandGroups.Create, perform: () => {} },
        { id: '5', title: 'Monthly Report', group: CommandGroups.Reports, perform: () => {} },
        { id: '6', title: 'General Settings', group: CommandGroups.Settings, perform: () => {} },
      ]);
      return <Story />;
    }
  ]
};

export const ManyCommands: Story = {
  decorators: [
    (Story) => {
      CommandRegistry['providers'].clear();
      const commands = Array.from({ length: 50 }, (_, i) => ({
        id: `cmd-${i}`,
        title: `Command ${i}`,
        group: i % 2 === 0 ? CommandGroups.Navigation : CommandGroups.Reports,
        perform: () => {},
      }));
      injectMockProvider(commands);
      return <Story />;
    }
  ]
};

export const HiddenCommands: Story = {
  decorators: [
    (Story) => {
      CommandRegistry['providers'].clear();
      injectMockProvider([
        { id: '1', title: 'Visible Command', group: CommandGroups.Navigation, perform: () => {} },
        { id: '2', title: 'Hidden Command', group: CommandGroups.Navigation, hidden: true, perform: () => {} },
      ]);
      return <Story />;
    }
  ]
};

export const LongTitles: Story = {
  decorators: [
    (Story) => {
      CommandRegistry['providers'].clear();
      injectMockProvider([
        { 
          id: '1', 
          title: 'This is a very very long command title that might wrap or truncate depending on the styling of the command item', 
          subtitle: 'It also has a very long subtitle to see how flexbox handles extremely long text elements in the command palette',
          group: CommandGroups.Navigation, 
          perform: () => {} 
        },
      ]);
      return <Story />;
    }
  ]
};
