"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
import { LoginForm } from "@/components/auth/LoginForm"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm"

interface AuthModalProps {
    children?: React.ReactNode
    defaultView?: "login" | "register" | "forgot-password"
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

type AuthView = "login" | "register" | "forgot-password"

export function AuthModal({ children, defaultView = "login", open: controlledOpen, onOpenChange: setControlledOpen }: AuthModalProps) {
    const [view, setView] = useState<AuthView>(defaultView)
    const [internalOpen, setInternalOpen] = useState(false)

    const searchParams = useSearchParams()
    const router = useRouter()

    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
    const setIsOpen = setControlledOpen || setInternalOpen

    // Handle auto-opening via URL params (e.g. after middleware redirect)
    useEffect(() => {
        const loginParam = searchParams?.get("login")
        if (loginParam === "true") {
            setIsOpen(true)
            setView("login")
        }
    }, [searchParams, setIsOpen])

    // Sync view with defaultView when modal opens or defaultView changes
    useEffect(() => {
        if (isOpen && !searchParams?.get("login")) {
            setView(defaultView)
        }
    }, [defaultView, isOpen, searchParams])

    const handleOpenChange = (newOpen: boolean) => {
        setIsOpen(newOpen)
        if (!newOpen) {
            // Clean up the URL if it was opened via search params
            const currentLoginParam = searchParams?.get("login")
            if (currentLoginParam === "true" && searchParams) {
                const newSearchParams = new URLSearchParams(searchParams.toString())
                newSearchParams.delete("login")
                newSearchParams.delete("redirect")
                const searchStr = newSearchParams.toString()
                const newUrl = window.location.pathname + (searchStr ? `?${searchStr}` : "")
                router.replace(newUrl, { scroll: false })
            }
            // Reset to default view when closed
            setTimeout(() => setView(defaultView), 200)
        }
    }

    const renderContent = () => {
        switch (view) {
            case "login":
                return (
                    <LoginForm
                        onSwitchToRegister={() => setView("register")}
                        onSwitchToForgotPassword={() => setView("forgot-password")}
                        onClose={() => setIsOpen(false)}
                    />
                )
            case "register":
                return <RegisterForm onSwitchToLogin={() => setView("login")} onClose={() => setIsOpen(false)} />
            case "forgot-password":
                return <ForgotPasswordForm onSwitchToLogin={() => setView("login")} onClose={() => setIsOpen(false)} />
            default:
                return null
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent
                className="sm:max-w-[425px] bg-white dark:bg-[#0f111a] border-slate-200 dark:border-[#1e2330] text-slate-900 dark:text-white p-6 rounded-xl"
                onInteractOutside={(e) => e.preventDefault()}
            >
                {renderContent()}
            </DialogContent>
        </Dialog>
    )
}
