'use client';

import React, { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { IntentRouter } from '@/lib/os/intent/router';
import { Search } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  
  // Toggle the menu when ⌘K is pressed
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

  const intent = IntentRouter.resolve(query);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm p-4 pt-[10vh] flex justify-center">
      <Command 
        className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            setOpen(false);
          }
        }}
      >
        <div className="flex items-center px-4 py-3 border-b border-border bg-card">
          <Search className="w-5 h-5 text-muted-foreground shrink-0 mr-3" />
          <Command.Input
            autoFocus
            value={query}
            onValueChange={setQuery}
            placeholder="Type 'I got paid' or 'Coffee'..."
            className="flex-1 bg-transparent border-none outline-none text-foreground text-lg placeholder:text-muted-foreground/60 font-medium"
          />
        </div>

        <Command.List className="max-h-[60vh] overflow-y-auto p-2">
          {query.length === 0 && (
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              What's on your mind?
            </Command.Empty>
          )}

          {query.length > 0 && intent.action === 'unknown' && (
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No matching intent found. Try "Move money".
            </Command.Empty>
          )}

          {intent.action !== 'unknown' && (
            <Command.Group heading={`Recognized Intent (${intent.confidence}%)`} className="text-xs font-semibold text-muted-foreground px-2 py-1 uppercase tracking-wider">
              <Command.Item 
                onSelect={() => {
                  console.log('Action triggered:', intent);
                  setOpen(false);
                }}
                className="flex items-center px-3 py-3 mt-1 rounded-md cursor-pointer hover:bg-secondary aria-selected:bg-secondary text-foreground text-sm font-medium transition-colors"
              >
                Execute: {intent.action} → {intent.target || 'Auto'}
              </Command.Item>
            </Command.Group>
          )}
        </Command.List>
      </Command>
    </div>
  );
}
