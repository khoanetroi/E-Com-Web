"use client";

import React, { useState, useRef } from "react";
import { Control, FieldValues, Path, Controller } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// --- TYPES ---
interface UploadState {
  value: string | null | undefined;
  isUploading: boolean;
  isDragging: boolean;
}

interface UploadActions {
  onBrowse: () => void;
  onRemove: () => void;
}

interface UploadV3Props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  maxSize?: number; // MB
  accept?: string;
  disabled?: boolean;
  className?: string;
  children: (state: UploadState, actions: UploadActions) => React.ReactNode;
}

// --- COMPONENT ---
export function UploadV3<T extends FieldValues>({
  control,
  name,
  label,
  maxSize = 20,
  accept = "image/*",
  disabled = false,
  className,
  children,
}: UploadV3Props<T>) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // 1. Core Upload Logic
  const processFile = async (file: File, onChange: (value: string) => void) => {
    if (disabled) return;

    if (file.size > maxSize * 1024 * 1024) {
      toast({ title: `File quá lớn! Tối đa ${maxSize}MB.`, variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const { id: loadingToastId, update: updateToast } = toast({ title: "Uploading..." });

    const formData = new FormData();
    formData.append("file", file);

    try {
      // API endpoint upload
      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();

      if (data?.url) {
        onChange(data.url);
        updateToast({ id: loadingToastId, title: "Done!" });
      } else {
        throw new Error("Missing URL");
      }
    } catch (error: any) {
      console.error(error);
      updateToast({ id: loadingToastId, title: `Lỗi: ${error.message}`, variant: "destructive" });
    } finally {
      setIsUploading(false);
      setDragActive(false);
    }
  };

  // 2. Event Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (
    e: React.DragEvent,
    onChange: (value: string) => void
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0], onChange);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0], onChange);
    }
    e.target.value = "";
  };

  return (
    // Dùng Controller trực tiếp để tránh phụ thuộc vào FormContext của cha
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange }, fieldState: { error } }) => (
        <div className={className}>
          {/* Label thủ công */}
          {label && (
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              {label}
            </Label>
          )}

          {/* Wrapper xử lý Drag Drop */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={(e) => handleDrop(e, onChange)}
            className={cn(
              "w-full transition-all",
              dragActive && "scale-[0.99]"
            )}
          >
            <Input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              disabled={disabled || isUploading}
              onChange={(e) => handleChange(e, onChange)}
            />

            {children(
              {
                value,
                isUploading,
                isDragging: dragActive,
              },
              {
                onBrowse: () => inputRef.current?.click(),
                onRemove: () => onChange(""),
              }
            )}
          </div>

          {/* Error Message thủ công */}
          {error && (
            <p className="text-[0.8rem] font-medium text-red-500 mt-2">
              {error.message}
            </p>
          )}
        </div>
      )}
    />
  );
}
