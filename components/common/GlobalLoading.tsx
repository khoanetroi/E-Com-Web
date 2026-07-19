"use client";

import { cn } from "@/lib/utils";

interface GlobalLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
    message?: string;
}

export function GlobalLoading({
    className,
    message = "Đang tải trang, chờ chút nhé ...",
    ...props
}: GlobalLoadingProps) {
    return (
        <div
            className={cn(
                "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300",
                className
            )}
            {...props}
        >
            {/* Spinner */}
            <div className="relative h-14 w-14 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-muted" />
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-electric-orange" />
            </div>

            {/* Message */}
            <p className="text-sm font-medium text-muted-foreground animate-pulse">
                {message}
            </p>
        </div>
    );
}
