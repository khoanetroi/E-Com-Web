"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        href: string
        title: string
        icon?: React.ReactNode
    }[]
}

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
    const pathname = usePathname()

    return (
        <nav
            className={cn(
                "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
                className
            )}
            {...props}
        >
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        buttonVariants({ variant: "ghost" }),
                        pathname === item.href
                            ? "bg-slate-50 dark:bg-[#2a3040] text-electric-orange dark:text-electric-orange font-medium"
                            : "hover:bg-slate-50 dark:hover:bg-[#2a3040] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
                        "justify-start transition-all px-3 py-2 h-auto relative overflow-hidden"
                    )}
                >
                    {pathname === item.href && (
                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-electric-orange" />
                    )}
                    {item.icon && <span className="mr-2">{item.icon}</span>}
                    {item.title}
                </Link>
            ))}
        </nav>
    )
}
