"use client";

import React from "react";
import { Control, Controller, FieldValues, Path } from "react-hook-form"; // Dùng Controller trực tiếp
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // Import Label độc lập
import { cn } from "@/lib/utils";

interface TextareaFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  description?: string;
  className?: string;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  disabled = false,
  description,
  className,
  rows = 4,
  maxLength,
  showCount = false,
}: TextareaFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => {
        // Lấy độ dài hiện tại an toàn
        const currentLength = field.value ? field.value.length : 0;

        return (
          <div className={cn("space-y-2", className)}>
            {/* 1. Label thủ công (không dùng FormLabel) */}
            {label && (
              <Label
                htmlFor={name}
                className={cn(
                  "text-xs font-bold text-slate-500 uppercase",
                  error && "text-red-500"
                )} // Đổi màu đỏ nếu có lỗi
              >
                {label}
              </Label>
            )}

            {/* 2. Textarea */}
            <Textarea
              id={name}
              placeholder={placeholder}
              disabled={disabled}
              rows={rows}
              className="resize-none"
              maxLength={maxLength}
              {...field}
              value={field.value ?? ""}
            />

            {/* 3. Description & Counter */}
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1">
                {description && (
                  <p className="text-[0.8rem] text-muted-foreground">
                    {description}
                  </p>
                )}
              </div>

              {(showCount || maxLength) && (
                <span
                  className={cn(
                    "text-xs text-muted-foreground select-none mt-1",
                    maxLength &&
                      currentLength >= maxLength &&
                      "text-red-500 font-medium"
                  )}
                >
                  {currentLength}
                  {maxLength ? ` / ${maxLength}` : " characters"}
                </span>
              )}
            </div>

            {/* 4. Error Message thủ công (không dùng FormMessage) */}
            {error && (
              <p className="text-[0.8rem] font-medium text-red-500">
                {error.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}
