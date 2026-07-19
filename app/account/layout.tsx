import { Metadata } from "next"
import Image from "next/image"

import { Separator } from "@/components/ui/separator"
import { SidebarNav } from "@/components/account/sidebar-nav"
import { User, Bell, History, Shield, CreditCard, Ticket } from "lucide-react"
import DefaultLayout from "@/components/layout/DefaultLayout"

export const metadata: Metadata = {
    title: "Tài khoản",
    description: "Quản lý tài khoản của bạn",
}

const sidebarNavItems = [
    {
        title: "Thông tin chung",
        href: "/account/profile",
        icon: <User className="w-4 h-4" />,
    },
    {
        title: "Cài đặt thông báo",
        href: "/account/notifications",
        icon: <Bell className="w-4 h-4" />,
    },
]

const historyNavItems = [
    {
        title: "Lịch sử đơn hàng",
        href: "/account/orders",
        icon: <History className="w-4 h-4" />,
    },
]

interface SettingsLayoutProps {
    children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <DefaultLayout>
            <div className="hidden space-y-6 pb-16 md:block bg-gray-50 dark:bg-[#0f111a] min-h-screen text-slate-900 dark:text-white transition-colors duration-300">
                <div className="container mx-auto max-w-7xl py-10 px-4 flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                    <aside className="lg:w-1/5">
                        <div className="bg-white dark:bg-[#1e2330] rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 transition-colors h-fit sticky top-24 overflow-hidden">
                            <div className="p-4 pb-2">
                                <h2 className="mb-2 px-2 text-sm font-bold tracking-tight text-slate-500 dark:text-gray-500 uppercase">
                                    Tài khoản
                                </h2>
                                <SidebarNav items={sidebarNavItems} />
                            </div>
                            <Separator className="my-2 bg-slate-200 dark:bg-slate-700 h-[1px]" />
                            <div className="p-4 pt-2">
                                <h2 className="mb-2 px-2 text-sm font-bold tracking-tight text-slate-500 dark:text-gray-500 uppercase">
                                    Lịch sử
                                </h2>
                                <SidebarNav items={historyNavItems} />
                            </div>
                        </div>
                    </aside>
                    <div className="flex-1 lg:max-w-4xl">{children}</div>
                </div>
            </div>
        </DefaultLayout>
    )
}
