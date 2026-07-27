"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { CommandGroup, CommandItem } from "@/components/ui/command";
import { Combobox, type ComboboxProps } from "./Combobox";

export interface CreatableComboboxProps<T = unknown> extends ComboboxProps<T> {
  /** Callback when the user creates a new option */
  onCreateOption?: (inputValue: string) => void;
  /** Label for the create button. Defaults to `Create "{inputValue}"` */
  formatCreateLabel?: (inputValue: string) => string;
}

export function CreatableCombobox<T = unknown>({
  onCreateOption,
  formatCreateLabel = (val) => `Create "${val}"`,
  ...props
}: CreatableComboboxProps<T>) {
  
  const handleCreateOption = (inputValue: string, closePopover: () => void) => {
    if (onCreateOption && inputValue.trim()) {
      onCreateOption(inputValue.trim());
      closePopover();
    }
  };

  return (
    <Combobox
      {...props}
      renderBottomAction={(searchQuery, closePopover) => {
        const trimmedQuery = searchQuery.trim();
        if (!trimmedQuery) return null;
        
        // Don't show create option if there is an exact match in the existing options
        const hasExactMatch = props.options.some(
          (opt) => opt.label.toLowerCase() === trimmedQuery.toLowerCase()
        );

        if (hasExactMatch) return null;

        return (
          <CommandGroup className="border-t border-border mt-1 pt-1">
            <CommandItem
              value={trimmedQuery}
              onSelect={() => handleCreateOption(trimmedQuery, closePopover)}
              className="flex items-center gap-2 cursor-pointer text-brand font-medium"
            >
              <Plus className="h-4 w-4" />
              <span className="flex-1 truncate">{formatCreateLabel(trimmedQuery)}</span>
            </CommandItem>
          </CommandGroup>
        );
      }}
    />
  );
}
