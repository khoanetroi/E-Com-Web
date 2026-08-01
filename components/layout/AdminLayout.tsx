'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Layers,
    Users,
    LogOut,
    ShieldCheck,
    SearchCheck,
    Ticket,
    Menu,
    Sun,
    Moon,
} from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet"
import { useTheme } from "next-themes"

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    const menuItems = [
        { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
        { path: '/admin/products', icon: <Package size={20} />, label: 'Sản phẩm' },

        { path: '/admin/orders', icon: <ShoppingCart size={20} />, label: 'Đơn hàng' },

        { path: '/admin/categories', icon: <Layers size={20} />, label: 'Danh mục' },
        // --- MỤC MỚI THÊM ---
        { path: '/admin/warranty', icon: <ShieldCheck size={20} />, label: 'Quản lý bảo hành' },
        { path: '/admin/warranty-check', icon: <SearchCheck size={20} />, label: 'Tra cứu bảo hành' },
        { path: '/admin/warranty-tickets', icon: <Ticket size={20} />, label: 'Ticket lỗi' },
        // -------------------
        { path: '/admin/users', icon: <Users size={20} />, label: 'Người dùng' },

    ]

    const SidebarContent = () => (
        <>
            <div className="p-6 border-b border-gray-100 dark:border-white/5">
                <Link href="/admin" onClick={() => setIsMobileMenuOpen(false)} className="block transition-transform duration-200 hover:scale-[1.02]">
                    <Image
                        src="/img/logo-telectric.png"
                        alt="TLECTRIC Admin"
                        width={160}
                        height={96}
                        className="h-24 w-auto object-contain"
                    />
                </Link>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto mt-2">
                {menuItems.map((item) => {
                    const isActive = item.path === '/admin'
                        ? pathname === '/admin'
                        : item.path === '/admin/warranty'
                            ? pathname === '/admin/warranty'
                            : pathname?.startsWith(item.path)

                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-orange-600 text-white shadow-lg shadow-orange-200 dark:shadow-none font-semibold'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-slate-800/80 hover:text-orange-600 dark:hover:text-electric-orange font-medium'
                                }`}
                        >
                            {item.icon}
                            <span className="text-sm">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </>
    )

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-[#0f1219] transition-colors duration-300">

            {/* DESKTOP SIDEBAR */}
            <aside className="hidden lg:flex w-64 bg-white dark:bg-[#1e2330] border-r border-slate-200 dark:border-white/5 flex-col fixed h-full z-20">
                <SidebarContent />
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-16 bg-white/80 dark:bg-[#1e2330]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10 w-full">
                    <div className="flex items-center gap-3">
                        {/* Mobile Menu Trigger */}
                        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                            <SheetTrigger className="lg:hidden p-2 -ml-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                <Menu size={20} />
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 w-72 bg-white dark:bg-[#1e2330] border-r-slate-200 dark:border-white/5">
                                <SidebarContent />
                            </SheetContent>
                        </Sheet>

                        <h2 className="font-semibold text-slate-800 dark:text-slate-100 capitalize text-lg">
                            {[...menuItems].reverse().find(item =>
                                item.path === '/admin' ? pathname === '/admin' : pathname?.startsWith(item.path)
                            )?.label || 'Quản trị'}
                        </h2>
                    </div>

                    {/* Actions: Theme & Logout */}
                    <div className="flex items-center gap-2">
                        {mounted ? (
                            <button
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                aria-label="Toggle Theme"
                            >
                                {theme === "dark" ? <Sun size={20} className="text-electric-orange" /> : <Moon size={20} />}
                            </button>
                        ) : (
                            <div className="w-9 h-9 opacity-50" />
                        )}

                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all text-sm font-medium border border-transparent hover:border-red-100 dark:hover:border-red-500/20"
                            title="Đăng xuất"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Đăng xuất</span>
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 lg:p-10">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}

export default AdminLayout