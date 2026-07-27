"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/ui/cn";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type ComboboxOption<T = unknown> = {
  id: string;
  value: string;
  label: string;
  keywords?: string[];
  icon?: React.ReactNode;
  disabled?: boolean;
  data?: T;
};

export interface ComboboxProps<T = unknown> {
  options: ComboboxOption<T>[];
  value?: string;
  onChange?: (value: string, option?: ComboboxOption<T>) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  /** For Creatable wrapper to inject an item at the end */
  renderBottomAction?: (searchQuery: string, closePopover: () => void) => React.ReactNode;
}

export function Combobox<T = unknown>({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  disabled = false,
  renderBottomAction,
}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const selectedOption = React.useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const handleSelect = (currentValue: string) => {
    if (onChange) {
      // cmdk returns lowercased values by default, so we need to find the actual option
      // But we can also pass the exact value if we match by it.
      // Alternatively, we use `onSelect` which passes the value string.
      // We will map the original value in the item's value prop.
      const exactOption = options.find((opt) => opt.value.toLowerCase() === currentValue.toLowerCase() || opt.value === currentValue);
      onChange(exactOption ? exactOption.value : currentValue, exactOption);
    }
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal",
            !selectedOption && "text-muted-foreground",
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedOption?.icon}
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={true}>
          <CommandInput 
            placeholder={searchPlaceholder} 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {emptyText}
            </CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.value}
                  keywords={option.keywords}
                  disabled={option.disabled}
                  onSelect={handleSelect}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.icon}
                  <span className="flex-1 truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {renderBottomAction && renderBottomAction(searchQuery, () => {
               setOpen(false);
               setSearchQuery("");
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
