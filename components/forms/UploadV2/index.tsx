"use client";

import React, { useState, useRef } from "react";
import { Control, FieldValues, Path } from "react-hook-form";
import { X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UploadV2Props<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  description?: string;
  accept?: string;
  maxSize?: number; // MB
  disabled?: boolean;
  className?: string;
}

export function UploadV2<T extends FieldValues>({
  control,
  name,
  label,
  description,
  accept = "image/*",
  maxSize = 20, // Theo ảnh mẫu là 20MB
  disabled = false,
  className,
}: UploadV2Props<T>) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (
    file: File,
    onChange: (value: string) => void
  ) => {
    if (file.size > maxSize * 1024 * 1024) {
      toast({ title: `File quá lớn! Tối đa ${maxSize}MB.`, variant: "destructive" });
      return;
    }

    setIsUploading(true);
    const { id: loadingToastId, update: updateToast } = toast({ title: "Uploading image..." });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data = await res.json();

      if (data?.url) {
        onChange(data.url);
        updateToast({ id: loadingToastId, title: "Upload thành công!" });
      } else {
        throw new Error("Không nhận được URL");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      updateToast({ id: loadingToastId, title: `Error: ${error.message}`, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  // Drag & Drop Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0], onChange);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void
  ) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0], onChange);
    }
  };

  return (
    <FormField
      control={control}
      name={name}
      render={({ field: { value, onChange } }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              {label}
            </FormLabel>
          )}

          <FormControl>
            <div className="w-full">
              {value ? (
                <div className="relative w-full max-w-md bg-slate-50/50 border border-slate-200 rounded-[24px] p-4 group transition-all hover:shadow-sm">
                  {/* Header Card */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                      <span className="text-xs font-bold text-slate-700">
                        Main Image
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onChange("")}
                      className="h-8 w-8 flex items-center justify-center bg-white rounded-full border border-slate-200 shadow-sm hover:bg-slate-100 transition-colors"
                    >
                      <X className="h-4 w-4 text-slate-600" />
                    </button>
                  </div>

                  {/* Image Container */}
                  <div className="aspect-video w-full bg-white rounded-xl overflow-hidden border border-slate-100 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={value}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <p className="text-center text-xs text-slate-400 mt-3">
                    Image uploaded successfully
                  </p>
                </div>
              ) : (
                /* --- B. EMPTY STATE (Giao diện Drag Drop như ảnh 1) --- */
                <div
                  className={cn(
                    "relative flex flex-col items-center justify-center w-full rounded-[32px] border-2 border-dashed transition-all cursor-pointer",
                    dragActive
                      ? "border-slate-400 bg-slate-50"
                      : "border-slate-200 hover:bg-slate-50/60",
                    disabled && "opacity-60 cursor-not-allowed",
                    isUploading && "cursor-default bg-slate-50"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={(e) => !isUploading && handleDrop(e, onChange)}
                  onClick={() =>
                    !disabled && !isUploading && inputRef.current?.click()
                  }
                >
                  <Input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    className="hidden"
                    disabled={disabled || isUploading}
                    onChange={(e) => handleChange(e, onChange)}
                    value=""
                  />

                  {isUploading ? (
                    <div className="flex flex-col items-center gap-3 p-6">
                      <Loader2 className="h-10 w-10 animate-spin text-slate-900" />
                      <p className="text-sm font-bold text-slate-900">
                        Uploading...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center p-4 space-y-6">
                      {/* Icon Stacked Papers (Custom SVG giống ảnh) */}
                      <div className="relative">
                        {/* Card sau */}
                        <div className="absolute top-0 right-[-10px] w-14 h-16 bg-slate-100 rounded-lg border border-slate-200 rotate-12"></div>
                        {/* Card trước */}
                        <div className="relative w-14 h-16 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center -rotate-6">
                          <span className="text-2xl text-slate-300 font-light">
                            +
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 max-w-md">
                        <h3 className="text-xl font-bold text-slate-900">
                          Drag images of your thumbnail here, <br />
                          or upload from your device
                        </h3>
                        <p className="text-xs text-slate-400">
                          Supported formats: JPG, PNG, WEBP, GIF.
                        </p>
                        <p className="text-xs text-slate-400">
                          Maximum file size: {maxSize}MB
                        </p>
                      </div>

                      <Button type="button" variant="outline">
                        Upload Images
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </FormControl>
          <FormMessage className="text-red-500 mt-2" />
        </FormItem>
      )}
    />
  );
}
