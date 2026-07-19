"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

const formSchema = z
    .object({
        fullName: z.string().min(2, "Vui lòng nhập họ và tên"),
        email: z.string().email("Email không hợp lệ"),
        password: z.string()
            .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
            .max(32, "Mật khẩu không được quá 32 ký tự")
            .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
            .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số"),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Mật khẩu không khớp",
        path: ["confirmPassword"],
    })

interface RegisterFormProps {
    onSwitchToLogin?: () => void
    onClose?: () => void
}

export function RegisterForm({ onSwitchToLogin, onClose }: RegisterFormProps) {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()
    const supabase = createClient()

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true)
        try {
            const { data, error } = await supabase.auth.signUp({
                email: values.email,
                password: values.password,
                options: {
                    data: {
                        full_name: values.fullName,
                    },
                },
            })

            if (error) {
                toast({
                    variant: "destructive",
                    title: "Đăng ký thất bại",
                    description: error.message,
                })
                return
            }

            // Check if we have a session (auto-login successful)
            if (data.session) {
                toast({
                    variant: "success",
                    title: "Đăng ký và đăng nhập thành công",
                    description: "Chào mừng bạn đến với TELECTRIC!",
                })
                onClose?.()
            } else {
                // Email confirmation required
                toast({
                    title: "Đăng ký thành công",
                    description: "Vui lòng kiểm tra email để xác nhận tài khoản.",
                })
                onSwitchToLogin?.()
            }

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Lỗi hệ thống",
                description: "Đã có lỗi xảy ra, vui lòng thử lại sau"
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    ĐĂNG KÝ
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tạo tài khoản mới</p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-white">
                                    Họ và tên <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            placeholder="Vui lòng nhập họ và tên"
                                            className="bg-slate-100 dark:bg-[#1e2330] border-transparent focus:bg-white dark:focus:bg-[#1e2330] focus:border-electric-orange focus:ring-1 focus:ring-electric-orange pl-8 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-500 transition-all duration-200"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-gray-500"
                                        >
                                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-white">
                                    Email <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            placeholder="Vui lòng nhập email"
                                            className="bg-slate-100 dark:bg-[#1e2330] border-transparent focus:bg-white dark:focus:bg-[#1e2330] focus:border-electric-orange focus:ring-1 focus:ring-electric-orange pl-8 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-500 transition-all duration-200"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-gray-500"
                                        >
                                            <rect width="20" height="16" x="2" y="4" rx="2" />
                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                        </svg>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-white">
                                    Mật khẩu <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Từ 8-32 ký tự"
                                            className="bg-slate-100 dark:bg-[#1e2330] border-transparent focus:bg-white dark:focus:bg-[#1e2330] focus:border-electric-orange focus:ring-1 focus:ring-electric-orange pl-8 pr-10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-500 transition-all duration-200"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-gray-500"
                                        >
                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-white transition-colors"
                                            disabled={isLoading}
                                        >
                                            {showPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-slate-700 dark:text-white">
                                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                                </FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="Nhập lại mật khẩu"
                                            className="bg-slate-100 dark:bg-[#1e2330] border-transparent focus:bg-white dark:focus:bg-[#1e2330] focus:border-electric-orange focus:ring-1 focus:ring-electric-orange pl-8 pr-10 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-500 transition-all duration-200"
                                            {...field}
                                            disabled={isLoading}
                                        />
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-gray-500"
                                        >
                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-white transition-colors"
                                            disabled={isLoading}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full bg-electric-orange hover:bg-[#E66D00] text-white font-bold py-2"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ĐANG XỬ LÝ
                            </>
                        ) : (
                            "ĐĂNG KÝ"
                        )}
                    </Button>

                    <div className="flex items-center justify-center text-sm gap-2 mt-4">
                        <span className="text-slate-500 dark:text-gray-400">Đã có tài khoản?</span>
                        <button
                            type="button"
                            className="text-electric-orange hover:text-[#E66D00] transition-colors"
                            onClick={onSwitchToLogin}
                            disabled={isLoading}
                        >
                            Đăng Nhập
                        </button>
                    </div>

                </form>
            </Form>
        </div>
    )
}
