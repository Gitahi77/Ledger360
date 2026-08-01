'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem 
} from '@/components/ui/command/Command';
import { 
  LayoutDashboard, 
  ArrowRightLeft, 
  Landmark, 
  Settings, 
  PlusCircle, 
  LineChart, 
  Download, 
  Bot,
  Search
} from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => router.push('/dashboard'))}>
            <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Go to Dashboard</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/transactions'))}>
            <ArrowRightLeft className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Go to Transactions</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/loans'))}>
            <Landmark className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Go to Loans & Debt</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/settings'))}>
            <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Go to Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => runCommand(() => router.push('/transactions?action=transfer'))}>
            <ArrowRightLeft className="mr-2 h-4 w-4 text-brand" />
            <span>Transfer Money</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/transactions?action=new'))}>
            <PlusCircle className="mr-2 h-4 w-4 text-brand" />
            <span>Create Transaction</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/reports/builder'))}>
            <LineChart className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Run Report</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log('Export Data Modal'))}>
            <Download className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Export Data</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/settings/ai'))}>
            <Bot className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Open AI Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandGroup heading="Recent Searches">
          <CommandItem onSelect={() => runCommand(() => router.push('/transactions?search=coffee'))}>
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Search merchant "coffee"</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => router.push('/transactions?search=uber'))}>
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Search merchant "uber"</span>
          </CommandItem>
        </CommandGroup>

      </CommandList>
    </CommandDialog>
  );
}
