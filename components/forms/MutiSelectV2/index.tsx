"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Control, FieldValues, Path } from "react-hook-form";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export type SelectOption = {
  value: string;
  label: string;
};

interface MultiSelectV2Props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  options: SelectOption[];
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  notFoundText?: string;
  disabled?: boolean;
}

export function MultiSelectV2<T extends FieldValues>({
  control,
  name,
  options,
  label,
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm kiếm...",
  notFoundText = "Không tìm thấy.",
  disabled = false,
}: MultiSelectV2Props<T>) {
  const [open, setOpen] = React.useState(false);

  const getSelectedLabels = (selectedValues: string[]) => {
    return options.filter((option) => selectedValues.includes(option.value));
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selectedValues: string[] = Array.isArray(field.value)
          ? field.value
          : [];
        const selectedLabels = getSelectedLabels(selectedValues);

        const handleSelect = (value: string) => {
          let newValues: string[];
          if (selectedValues.includes(value)) {
            newValues = selectedValues.filter((v) => v !== value);
          } else {
            newValues = [...selectedValues, value];
          }
          field.onChange(newValues);
        };

        const handleRemove = (
          e: React.MouseEvent<HTMLButtonElement>,
          value: string
        ) => {
          e.preventDefault();
          e.stopPropagation();
          const newValues = selectedValues.filter((v) => v !== value);
          field.onChange(newValues);
        };

        return (
          <FormItem>
            {label && <FormLabel>{label}</FormLabel>}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className="w-full justify-between h-auto min-h-10 border-slate-50 rounded-[10px]"
                  >
                    <div className="flex flex-wrap gap-1">
                      {selectedLabels.length > 0 ? (
                        selectedLabels.map((option) => (
                          <Badge
                            key={option.value}
                            variant="default"
                            className="mr-1"
                          >
                            {option.label}
                            <button
                              aria-label={`Xóa ${option.label}`}
                              className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                              onMouseDown={(e) => handleRemove(e, option.value)}
                            >
                              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                            </button>
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground font-normal">
                          {placeholder}
                        </span>
                      )}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder={searchPlaceholder} />
                  <CommandList>
                    <CommandEmpty>{notFoundText}</CommandEmpty>
                    <CommandGroup>
                      {options.map((option) => {
                        const isSelected = selectedValues.includes(
                          option.value
                        );
                        return (
                          <CommandItem
                            key={option.value}
                            onSelect={() => handleSelect(option.value)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {option.label}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
