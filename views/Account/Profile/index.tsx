import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { Profile } from "@/lib/types"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

export default async function ProfilePage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/?login=true&redirect=/account")
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

    // Format date
    const joinDate = new Date(user.created_at).toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    })

    return (
        <div className="space-y-6">
            <Card className="bg-white dark:bg-[#1e2330] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transition-colors">
                <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase text-slate-500 dark:text-gray-400">
                        Thông tin tài khoản
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500 dark:text-gray-500">Tên hiển thị</p>
                        <p className="text-lg font-bold text-slate-900 dark:text-white">{user.user_metadata.full_name || "Chưa cập nhật"}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500 dark:text-gray-500">Email</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{user.email}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500 dark:text-gray-500">Ngày tham gia</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{joinDate}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500 dark:text-gray-500">Nhóm tài khoản</p>
                        <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-electric-orange border-electric-orange hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
                            {profile?.role === "admin" ? "Quản trị viên" : profile?.role === "moderator" ? "Điều phối viên" : "Người dùng"}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white dark:bg-[#1e2330] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transition-colors">
                <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase text-slate-500 dark:text-gray-400">
                        Bảo mật tài khoản
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">Đổi mật khẩu</p>
                            <p className="text-xs text-slate-500 dark:text-gray-500">Thay đổi mật khẩu đăng nhập của bạn</p>
                        </div>
                        <Button variant="outline" className="bg-slate-100 dark:bg-[#2a3040] border-slate-200 dark:border-0 hover:bg-slate-200 dark:hover:bg-[#353b4d] text-slate-900 dark:text-white">
                            Đổi mật khẩu
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-white dark:bg-[#1e2330] border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white transition-colors">
                <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase text-slate-500 dark:text-gray-400">
                        Tài khoản liên kết
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#2a3040] flex items-center justify-center text-xl text-slate-900 dark:text-white">G</div>
                            <div>
                                <p className="text-sm font-medium text-slate-900 dark:text-white">Google</p>
                                <p className="text-xs text-slate-500 dark:text-gray-500">Chưa liên kết</p>
                            </div>
                        </div>
                        <Button variant="ghost" className="text-slate-900 dark:text-white hover:text-[#00b4d8] hover:bg-transparent">
                            Liên kết
                        </Button>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}
