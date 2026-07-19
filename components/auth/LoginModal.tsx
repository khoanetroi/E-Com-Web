"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { LoginForm } from "@/components/auth/LoginForm";

interface LoginModalProps {
    children?: React.ReactNode;
}

function LoginModalContent({ children }: LoginModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const loginParam = searchParams?.get("login");
        if (loginParam === "true") {
            setIsOpen(true);
        }
    }, [searchParams]);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            // Clean up the URL if it was opened via search params
            const currentLoginParam = searchParams?.get("login");
            if (currentLoginParam === "true" && searchParams) {
                const newSearchParams = new URLSearchParams(searchParams.toString());
                newSearchParams.delete("login");
                newSearchParams.delete("redirect");
                const newUrl = window.location.pathname + (newSearchParams.toString() ? `?${newSearchParams.toString()}` : '');
                router.replace(newUrl, { scroll: false });
            }
        }
    };

    const handleClose = () => {
        handleOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-md bg-white dark:bg-[#0f111a] border-slate-200 dark:border-gray-800">
                <LoginForm
                    onClose={handleClose}
                    onSwitchToRegister={() => {
                        handleClose();
                        router.push("/auth/sign-up");
                    }}
                    onSwitchToForgotPassword={() => {
                        handleClose();
                        router.push("/auth/forgot-password");
                    }}
                />
            </DialogContent>
        </Dialog>
    );
}

export function LoginModal(props: LoginModalProps) {
    return (
        <Suspense fallback={props.children}>
            <LoginModalContent {...props} />
        </Suspense>
    );
}
