"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
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
import { useState } from "react"
import { Eye, EyeOff, Loader2, RefreshCw } from "lucide-react"

// Schemas for each step
const emailSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
})

const otpSchema = z.object({
    otp: z.string().length(8, "Mã xác nhận phải có 8 chữ số"),
})

const passwordSchema = z.object({
    password: z.string()
        .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
        .max(32, "Mật khẩu không được quá 32 ký tự")
        .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
        .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
})

interface ForgotPasswordFormProps {
    onSwitchToLogin?: () => void
    onClose?: () => void
}

type Step = "EMAIL" | "OTP" | "PASSWORD"

export function ForgotPasswordForm({ onSwitchToLogin, onClose }: ForgotPasswordFormProps) {
    const [step, setStep] = useState<Step>("EMAIL")
    const [email, setEmail] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const { toast } = useToast()
    const supabase = createClient()

    // Forms
    const emailForm = useForm<z.infer<typeof emailSchema>>({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: "" },
    })

    const otpForm = useForm<z.infer<typeof otpSchema>>({
        resolver: zodResolver(otpSchema),
        defaultValues: { otp: "" },
    })

    const passwordForm = useForm<z.infer<typeof passwordSchema>>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { password: "", confirmPassword: "" },
    })

    // Handlers
    async function onEmailSubmit(values: z.infer<typeof emailSchema>) {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(values.email)

            if (error) throw error

            setEmail(values.email)
            setStep("OTP")
            toast({
                title: "Đã gửi mã xác nhận",
                description: "Vui lòng kiểm tra email của bạn",
            })
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: error.message || "Đã có lỗi xảy ra",
            })
        } finally {
            setIsLoading(false)
        }
    }

    async function onOtpSubmit(values: z.infer<typeof otpSchema>) {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.verifyOtp({
                email,
                token: values.otp,
                type: "recovery",
            })

            if (error) throw error

            setStep("PASSWORD")
            toast({
                title: "Xác thực thành công",
                description: "Vui lòng nhập mật khẩu mới",
            })
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Mã xác thực không đúng",
                description: "Vui lòng kiểm tra lại mã OTP",
            })
        } finally {
            setIsLoading(false)
        }
    }

    async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({
                password: values.password,
            })

            if (error) throw error

            toast({
                variant: "success",
                title: "Đổi mật khẩu thành công",
                description: "Bạn có thể đăng nhập bằng mật khẩu mới",
            })
            onClose?.()
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Lỗi đổi mật khẩu",
                description: error.message,
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleResendOtp = async () => {
        if (!email) return
        setIsLoading(true)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email)
            if (error) throw error
            toast({ title: "Đã gửi lại mã xác nhận" })
        } catch (error: any) {
            toast({ variant: "destructive", title: "Lỗi", description: error.message })
        } finally {
            setIsLoading(false)
        }
    }

    // Render Functions
    const renderEmailStep = () => (
        <Form {...emailForm}>
            <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="space-y-4">
                <FormField
                    control={emailForm.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-slate-700 dark:text-white">Email <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        placeholder="Vui lòng nhập email"
                                        className="bg-slate-100 dark:bg-[#1e2330] border-transparent focus:bg-white dark:focus:bg-[#1e2330] focus:border-electric-orange focus:ring-1 focus:ring-electric-orange pl-8 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-500 transition-all duration-200"
                                        {...field}
                                        disabled={isLoading}
                                    />
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-gray-500">
                                        <rect width="20" height="16" x="2" y="4" rx="2" />
                                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                    </svg>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="text-xs text-slate-500 dark:text-gray-400">Mã xác nhận sẽ được gửi tới email của bạn</div>
                <Button type="submit" className="w-full bg-electric-orange hover:bg-orange-600 text-white font-bold py-2" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "TIẾP TỤC"}
                </Button>
            </form>
        </Form>
    )

    const renderOtpStep = () => (
        <Form {...otpForm}>
            <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                <FormField
                    control={otpForm.control}
                    name="otp"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-slate-700 dark:text-white">Mã xác nhận <span className="text-red-500">*</span></FormLabel>
                            <div className="flex gap-2">
                                <FormControl>
                                    <div className="relative flex-1">
                                        <Input
                                            placeholder="Nhập 8 chữ số"
                                            className="bg-slate-100 dark:bg-[#1e2330] border-transparent focus:bg-white dark:focus:bg-[#1e2330] focus:border-electric-orange focus:ring-1 focus:ring-electric-orange pl-8 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-gray-500 transition-all duration-200"
                                            maxLength={8}
                                            {...field}
                                            disabled={isLoading}
                                        />
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400 dark:text-gray-500">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                        </svg>
                                    </div>
                                </FormControl>
                                <Button
                                    type="button"
                                    variant="default"
                                    className="bg-electric-orange hover:bg-orange-600 text-white min-w-[100px]"
                                    onClick={handleResendOtp}
                                    disabled={isLoading}
                                >
                                    <RefreshCw className="mr-2 h-3 w-3" /> Gửi lại
                                </Button>
                            </div>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="p-3 bg-slate-100 dark:bg-gray-800/50 rounded-md border border-slate-200 dark:border-gray-700 text-sm text-slate-700 dark:text-gray-300">
                    Mã xác thực đã được gửi đến: <span className="text-slate-900 dark:text-white font-medium">{email}</span>
                </div>
                <Button type="submit" className="w-full bg-electric-orange hover:bg-orange-600 text-white font-bold py-2" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "TIẾP TỤC"}
                </Button>
            </form>
        </Form>
    )

    const renderPasswordStep = () => (
        <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <FormField
                    control={passwordForm.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-slate-700 dark:text-white">Mật khẩu mới <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Nhập mật khẩu mới"
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
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-white transition-colors" disabled={isLoading}>
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-slate-700 dark:text-white">Xác nhận mật khẩu <span className="text-red-500">*</span></FormLabel>
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
                                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-white transition-colors" disabled={isLoading}>
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" className="w-full bg-electric-orange hover:bg-orange-600 text-white font-bold py-2" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "ĐỔI MẬT KHẨU"}
                </Button>
            </form>
        </Form>
    )

    return (
        <div className="w-full space-y-6">
            <div className="space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    ĐẶT LẠI MẬT KHẨU
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    {step === "EMAIL" && "Nhập email để khôi phục"}
                    {step === "OTP" && "Xác minh email"}
                    {step === "PASSWORD" && "Tạo mật khẩu mới"}
                </p>
            </div>

            {step === "EMAIL" && renderEmailStep()}
            {step === "OTP" && renderOtpStep()}
            {step === "PASSWORD" && renderPasswordStep()}

            <div className="flex items-center justify-center text-sm gap-2 mt-4">
                <span className="text-slate-500 dark:text-gray-400">Đã có tài khoản?</span>
                <button
                    type="button"
                    className="text-electric-orange hover:text-orange-600 transition-colors"
                    onClick={onSwitchToLogin}
                    disabled={isLoading}
                >
                    Đăng Nhập
                </button>
            </div>
        </div>
    )
}
