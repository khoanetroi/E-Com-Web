"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { Loader2, MailCheck, RefreshCw, Mail, ArrowLeft } from "lucide-react";

const emailSchema = z.object({
    email: z.string().email("Email không hợp lệ").min(1, "Vui lòng nhập email"),
});

interface ForgotPasswordFormProps {
    onSwitchToLogin?: () => void;
    onClose?: () => void;
}

export function ForgotPasswordForm({ onSwitchToLogin, onClose }: ForgotPasswordFormProps) {
    const [sentEmail, setSentEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const supabase = createClient();

    const form = useForm<z.infer<typeof emailSchema>>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: "" },
    });

    async function onEmailSubmit(values: z.infer<typeof emailSchema>) {
        setIsLoading(true);
        try {
            const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/auth/update-password` : undefined;
            const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
                redirectTo: redirectUrl,
            });

            if (error) throw error;

            setSentEmail(values.email);
            toast({
                title: "Đã gửi link đặt lại mật khẩu",
                description: `Vui lòng kiểm tra hộp thư ${values.email}.`,
            });
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Lỗi gửi email",
                description: error.message || "Đã có lỗi xảy ra, vui lòng thử lại.",
            });
        } finally {
            setIsLoading(false);
        }
    }

    const handleResend = async () => {
        if (!sentEmail) return;
        setIsLoading(true);
        try {
            const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/auth/update-password` : undefined;
            const { error } = await supabase.auth.resetPasswordForEmail(sentEmail, {
                redirectTo: redirectUrl,
            });
            if (error) throw error;
            toast({
                title: "Đã gửi lại email",
                description: "Vui lòng kiểm tra lại hộp thư (bao gồm cả thư rác/Spam).",
            });
        } catch (error: any) {
            toast({ variant: "destructive", title: "Lỗi", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    ĐẶT LẠI MẬT KHẨU
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {sentEmail
                        ? "Kiểm tra email của bạn để tiếp tục"
                        : "Nhập email tài khoản để nhận liên kết khôi phục"}
                </p>
            </div>

            {!sentEmail ? (
                /* Step 1: Enter email form */
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onEmailSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-slate-700 dark:text-white">
                                        Email tài khoản <span className="text-red-500">*</span>
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input
                                                type="email"
                                                placeholder="example@gmail.com"
                                                className="bg-slate-100 dark:bg-[#1e2330] border-transparent focus:bg-white dark:focus:bg-[#1e2330] focus:border-electric-orange focus:ring-1 focus:ring-electric-orange pl-9 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-500 transition-all duration-200"
                                                {...field}
                                                disabled={isLoading}
                                            />
                                            <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-gray-500" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                            Hệ thống sẽ gửi một liên kết xác thực an toàn đến email này. Bạn chỉ cần nhấn vào liên kết để đặt mật khẩu mới.
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-electric-orange hover:bg-orange-600 text-white font-bold py-2 shadow-sm transition-all"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang gửi liên kết...
                                </>
                            ) : (
                                "GỬI LIÊN KẾT ĐẶT LẠI MẬT KHẨU"
                            )}
                        </Button>
                    </form>
                </Form>
            ) : (
                /* Step 2: Check email notification card */
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-300">
                    <div className="p-5 bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl text-center space-y-3">
                        <div className="w-12 h-12 bg-electric-orange text-white rounded-full flex items-center justify-center mx-auto shadow-md shadow-orange-500/20">
                            <MailCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                Đã gửi liên kết khôi phục!
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                                Chúng tôi đã gửi email chứa đường dẫn đặt lại mật khẩu đến:
                            </p>
                            <p className="text-sm font-bold text-electric-orange mt-1 font-mono break-all">
                                {sentEmail}
                            </p>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-orange-200/60 dark:border-orange-900/40 pt-3">
                            Vui lòng mở email và nhấn vào <strong>nút hoặc liên kết</strong> trong thư để nhập mật khẩu mới. (Hãy kiểm tra cả hộp thư <em>Spam / Rác</em> nếu chưa thấy).
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                            onClick={handleResend}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Chưa nhận được? Gửi lại email
                        </Button>

                        <Button
                            type="button"
                            className="w-full bg-electric-orange hover:bg-orange-600 text-white font-bold"
                            onClick={() => {
                                onClose?.();
                                onSwitchToLogin?.();
                            }}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại Đăng nhập
                        </Button>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-center text-sm gap-2 mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-gray-400">Đã nhớ mật khẩu?</span>
                <button
                    type="button"
                    className="text-electric-orange hover:text-orange-600 font-medium transition-colors"
                    onClick={onSwitchToLogin}
                    disabled={isLoading}
                >
                    Đăng Nhập
                </button>
            </div>
        </div>
    );
}
