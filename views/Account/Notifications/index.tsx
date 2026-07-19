"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function NotificationsPage() {
    const supabase = createClient();
    const { toast } = useToast();

    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    // Settings state
    const [settings, setSettings] = useState({
        email_notif: true,
        push_notif: true,
        system_notif: true,
    });

    // Fetch initial settings
    const loadSettings = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            // We don't throw error if data is missing, we just use defaults
            if (data) {
                setSettings({
                    email_notif: data.email_notif ?? true,
                    push_notif: data.push_notif ?? true,
                    system_notif: data.system_notif ?? true,
                });
            }
        } catch (error) {
            console.error("Lỗi khi tải cài đặt:", error);
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // Handle toggle switch
    const handleToggle = async (key: keyof typeof settings) => {
        if (!userId) return;

        const newValue = !settings[key];
        // Optimistic UI update
        setSettings(prev => ({ ...prev, [key]: newValue }));

        try {
            const { error } = await supabase
                .from("profiles")
                .update({ [key]: newValue })
                .eq("id", userId);

            // Ignore column missing error gracefully (code "PGRST204")
            if (error && error.code !== "PGRST204") throw error;

            toast({
                title: "Đã lưu cài đặt",
                description: "Tùy chọn thông báo của bạn đã được cập nhật.",
            });
        } catch (error: any) {
            // Revert state on error
            setSettings(prev => ({ ...prev, [key]: !newValue }));
            toast({
                title: "Lỗi lưu cài đặt",
                description: "Không thể lưu cài đặt, vui lòng thử lại.",
                variant: "destructive",
            });
            console.error("Error updating setting:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-electric-orange" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="bg-white dark:bg-[#1e2330] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transition-colors">
                <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase text-slate-500 dark:text-gray-400">
                        Cài đặt thông báo
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Email Notif */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Thông báo qua Email</p>
                            <p className="text-xs text-slate-500 dark:text-gray-500">Nhận thông tin về đơn hàng và khuyến mãi</p>
                        </div>
                        <Switch
                            id="email-notif"
                            checked={settings.email_notif}
                            onCheckedChange={() => handleToggle("email_notif")}
                            className="data-[state=checked]:bg-electric-orange data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700"
                        />
                    </div>
                    <Separator className="bg-slate-200 dark:bg-slate-800" />

                    {/* Push Notif */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Thông báo đẩy (Push)</p>
                            <p className="text-xs text-slate-500 dark:text-gray-500">Nhận thông báo trên trình duyệt</p>
                        </div>
                        <Switch
                            id="push-notif"
                            checked={settings.push_notif}
                            onCheckedChange={() => handleToggle("push_notif")}
                            className="data-[state=checked]:bg-electric-orange data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700"
                        />
                    </div>
                    <Separator className="bg-slate-200 dark:bg-slate-800" />

                    {/* System Notif */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Tin nhắn từ hệ thống</p>
                            <p className="text-xs text-slate-500 dark:text-gray-500">Các thông báo quan trọng về tài khoản</p>
                        </div>
                        <Switch
                            id="system-notif"
                            checked={settings.system_notif}
                            onCheckedChange={() => handleToggle("system_notif")}
                            className="data-[state=checked]:bg-electric-orange data-[state=unchecked]:bg-slate-200 dark:data-[state=unchecked]:bg-slate-700"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
