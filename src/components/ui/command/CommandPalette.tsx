"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CommandAction, CommandRegistry } from "@/lib/commands";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [commands, setCommands] = React.useState<CommandAction[]>([]);
  
  React.useEffect(() => {
    // Load commands on mount (and potentially dynamically later if we listen to registry events)
    CommandRegistry.getCommands().then(setCommands);
  }, []);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Toggle on Cmd+K or Ctrl+K
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        // Prevent toggle if inside an input or textarea? 
        // Actually Cmd+K usually works everywhere, but we can prevent it if needed.
        // Usually, users want Cmd+K to work globally, but let's be safe.
        const target = e.target as HTMLElement;
        if (target.isContentEditable || target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          // If we want to allow Cmd+K inside inputs, we can remove this.
          // But to be strictly safe and avoid conflicting with rich text editors (like notion), we might keep it.
          // In standard apps, Cmd+K opens the palette globally anyway.
          // We will prevent default to avoid native browser search or other shortcuts.
        }
        
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback(
    (command: CommandAction) => {
      // Close immediately
      setOpen(false);
      // Run the command action with context
      Promise.resolve(
        command.perform({
          router,
          close: () => setOpen(false),
        })
      ).catch(console.error);
    },
    [router]
  );

  // Group commands for rendering
  const groupedCommands = React.useMemo(() => {
    const groups: Record<string, CommandAction[]> = {};
    for (const cmd of commands) {
      if (cmd.hidden) continue;
      if (!groups[cmd.group]) groups[cmd.group] = [];
      groups[cmd.group].push(cmd);
    }
    return groups;
  }, [commands]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedCommands).map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((cmd) => (
              <CommandItem
                key={cmd.id}
                value={cmd.id} // use ID as the underlying value
                keywords={cmd.keywords} // pass keywords to cmdk for fuzzy searching
                onSelect={() => runCommand(cmd)}
                className="flex items-center gap-2"
              >
                {cmd.icon && (
                  <div className="flex items-center justify-center text-muted-foreground w-5 h-5">
                    {cmd.icon}
                  </div>
                )}
                <span>{cmd.title}</span>
                {cmd.subtitle && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {cmd.subtitle}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
