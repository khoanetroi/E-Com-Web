"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
    Package,
    ShoppingCart,
    Users,
    Megaphone,
    ShieldCheck,
    SearchCheck,
    Layers,
    Home,
    Image as ImageIcon,
    Zap,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Clock,
    CheckCircle2,
    XCircle,
    Truck,
    RefreshCcw,
    AlertCircle,
    DollarSign,
    Activity,
    BarChart3,
} from "lucide-react";

// ========================
// TYPES
// ========================
interface DashboardStats {
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    totalProducts: number;
    totalUsers: number;
    totalNews: number;
    recentOrders: RecentOrder[];
}

interface RecentOrder {
    id: string;
    customer_name: string;
    total_amount: number;
    status: string;
    created_at: string;
}

// ========================
// HELPERS
// ========================
const formatCurrency = (value: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: "Chờ xử lý", color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400", icon: <Clock size={12} /> },
    processing: { label: "Đang xử lý", color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 dark:text-blue-400", icon: <RefreshCcw size={12} /> },
    shipped: { label: "Đang vận chuyển", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 dark:text-indigo-400", icon: <Truck size={12} /> },
    delivered: { label: "Đã giao", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400", icon: <CheckCircle2 size={12} /> },
    cancelled: { label: "Đã huỷ", color: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400", icon: <XCircle size={12} /> },
};

// ========================
// STAT CARD
// ========================
interface StatCardProps {
    title: string;
    value: string | number;
    icon: React.ReactNode;
    gradient: string;
    trend?: { value: number; positive: boolean };
    subtitle?: string;
}

const StatCard = ({ title, value, icon, gradient, trend, subtitle }: StatCardProps) => (
    <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#1e2330] border border-slate-100 dark:border-white/5 p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 group">
        {/* Gradient blob */}
        <div className={`absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10 group-hover:opacity-15 transition-opacity ${gradient}`} />

        <div className="flex items-start justify-between relative">
            <div className="flex-1">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{title}</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1 leading-tight">{value}</p>
                {subtitle && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subtitle}</p>}
                {trend && (
                    <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"}`}>
                        {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span>{trend.value}% so với tháng trước</span>
                    </div>
                )}
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${gradient}`}>
                {icon}
            </div>
        </div>
    </div>
);

// ========================
// QUICK LINK BUTTON
// ========================
interface QuickLinkProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    description: string;
    color: string;
    badge?: string | number;
}

const QuickLink = ({ href, icon, label, description, color, badge }: QuickLinkProps) => (
    <Link
        href={href}
        className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#1e2330] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
    >
        {/* Hover tint */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${color}`} />

        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0 ${color}`}>
            {icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{label}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{description}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            {badge !== undefined && badge !== null && badge !== 0 && (
                <span className="text-xs font-bold bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                    {badge}
                </span>
            )}
            <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all" />
        </div>
    </Link>
);

// ========================
// ORDER STATUS BAR
// ========================
interface OrderStatusBarProps {
    stats: DashboardStats;
}

const OrderStatusBar = ({ stats }: OrderStatusBarProps) => {
    const items = [
        { label: "Chờ xử lý", count: stats.pendingOrders, color: "bg-amber-400", text: "text-amber-600 dark:text-amber-400" },
        { label: "Đang xử lý", count: stats.processingOrders, color: "bg-blue-400", text: "text-blue-600 dark:text-blue-400" },
        { label: "Đang vận chuyển", count: stats.shippedOrders, color: "bg-indigo-400", text: "text-indigo-600 dark:text-indigo-400" },
        { label: "Đã giao", count: stats.deliveredOrders, color: "bg-emerald-400", text: "text-emerald-600 dark:text-emerald-400" },
        { label: "Đã huỷ", count: stats.cancelledOrders, color: "bg-red-400", text: "text-red-600 dark:text-red-400" },
    ];
    const total = stats.totalOrders || 1;

    return (
        <div className="rounded-2xl bg-white dark:bg-[#1e2330] border border-slate-100 dark:border-white/5 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <BarChart3 size={18} className="text-orange-500" />
                    Trạng thái đơn hàng
                </h3>
                <Link href="/admin/orders" className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium flex items-center gap-1">
                    Xem tất cả <ArrowRight size={12} />
                </Link>
            </div>

            {/* Progress Bar */}
            <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-5">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className={`${item.color} transition-all duration-700 rounded-full`}
                        style={{ width: `${(item.count / total) * 100}%`, minWidth: item.count > 0 ? "4px" : "0" }}
                        title={`${item.label}: ${item.count}`}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0`} />
                        <div>
                            <p className={`text-lg font-bold leading-none ${item.text}`}>{item.count}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 leading-tight">{item.label}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ========================
// RECENT ORDERS
// ========================
interface RecentOrdersProps {
    orders: RecentOrder[];
}

const RecentOrders = ({ orders }: RecentOrdersProps) => (
    <div className="rounded-2xl bg-white dark:bg-[#1e2330] border border-slate-100 dark:border-white/5 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Activity size={18} className="text-orange-500" />
                Đơn hàng gần đây
            </h3>
            <Link href="/admin/orders" className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium flex items-center gap-1">
                Xem tất cả <ArrowRight size={12} />
            </Link>
        </div>

        {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-600">
                <AlertCircle size={32} className="mb-2 opacity-40" />
                <p className="text-sm">Chưa có đơn hàng nào</p>
            </div>
        ) : (
            <div className="space-y-3">
                {orders.map((order) => {
                    const cfg = statusConfig[order.status] || { label: order.status, color: "text-slate-500 bg-slate-100", icon: null };
                    return (
                        <Link
                            key={order.id}
                            href="/admin/orders"
                            className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                        >
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                                {order.customer_name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{order.customer_name}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500">{formatDate(order.created_at)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{formatCurrency(order.total_amount)}</p>
                                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                                    {cfg.icon}
                                    {cfg.label}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        )}
    </div>
);

// ========================
// MAIN DASHBOARD PAGE
// ========================
export default function AdminDashboard() {
    const supabase = useMemo(() => createClient(), []);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        totalProducts: 0,
        totalUsers: 0,
        totalNews: 0,
        recentOrders: [],
    });

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const [
                    ordersRes,
                    revenueRes,
                    productsRes,
                    usersRes,
                    newsRes,
                    pendingRes,
                    processingRes,
                    shippedRes,
                    deliveredRes,
                    cancelledRes,
                    recentRes,
                ] = await Promise.all([
                    supabase.from("orders").select("*", { count: "exact", head: true }),
                    supabase.from("orders").select("total_amount").eq("status", "delivered"),
                    supabase.from("products").select("*", { count: "exact", head: true }),
                    supabase.from("profiles").select("*", { count: "exact", head: true }),
                    supabase.from("news").select("*", { count: "exact", head: true }),
                    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
                    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "processing"),
                    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "shipped"),
                    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "delivered"),
                    supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "cancelled"),
                    supabase
                        .from("orders")
                        .select("id, customer_name, total_amount, status, created_at")
                        .order("created_at", { ascending: false })
                        .limit(6),
                ]);

                const totalRevenue = (revenueRes.data || []).reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

                setStats({
                    totalOrders: ordersRes.count || 0,
                    pendingOrders: pendingRes.count || 0,
                    processingOrders: processingRes.count || 0,
                    shippedOrders: shippedRes.count || 0,
                    deliveredOrders: deliveredRes.count || 0,
                    cancelledOrders: cancelledRes.count || 0,
                    totalRevenue,
                    totalProducts: productsRes.count || 0,
                    totalUsers: usersRes.count || 0,
                    totalNews: newsRes.count || 0,
                    recentOrders: recentRes.data || [],
                });
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [supabase]);

    const statCards = [
        {
            title: "Tổng đơn hàng",
            value: loading ? "—" : stats.totalOrders.toLocaleString("vi-VN"),
            icon: <ShoppingCart size={22} />,
            gradient: "bg-gradient-to-br from-orange-400 to-orange-600",
            subtitle: `${stats.pendingOrders} đang chờ xử lý`,
        },
        {
            title: "Doanh thu (đã giao)",
            value: loading ? "—" : formatCurrency(stats.totalRevenue),
            icon: <DollarSign size={22} />,
            gradient: "bg-gradient-to-br from-emerald-400 to-teal-600",
            subtitle: `Từ ${stats.deliveredOrders} đơn đã giao`,
        },
        {
            title: "Sản phẩm",
            value: loading ? "—" : stats.totalProducts.toLocaleString("vi-VN"),
            icon: <Package size={22} />,
            gradient: "bg-gradient-to-br from-blue-400 to-indigo-600",
            subtitle: "Đang kinh doanh",
        },
        {
            title: "Người dùng",
            value: loading ? "—" : stats.totalUsers.toLocaleString("vi-VN"),
            icon: <Users size={22} />,
            gradient: "bg-gradient-to-br from-purple-400 to-violet-600",
            subtitle: "Tài khoản đã đăng ký",
        },
    ];

    const quickLinks = [
        {
            href: "/admin/orders",
            icon: <ShoppingCart size={20} />,
            label: "Đơn hàng",
            description: "Quản lý & cập nhật đơn hàng",
            color: "bg-gradient-to-br from-orange-400 to-orange-600",
            badge: stats.pendingOrders,
        },
        {
            href: "/admin/products",
            icon: <Package size={20} />,
            label: "Sản phẩm",
            description: "Thêm, sửa, xoá sản phẩm",
            color: "bg-gradient-to-br from-blue-400 to-indigo-600",
            badge: 0,
        },

        {
            href: "/admin/users",
            icon: <Users size={20} />,
            label: "Người dùng",
            description: "Quản lý tài khoản khách hàng",
            color: "bg-gradient-to-br from-purple-400 to-violet-600",
            badge: 0,
        },

        {
            href: "/admin/categories",
            icon: <Layers size={20} />,
            label: "Danh mục",
            description: "Phân loại sản phẩm",
            color: "bg-gradient-to-br from-teal-400 to-cyan-600",
            badge: 0,
        },
        {
            href: "/admin/warranty",
            icon: <ShieldCheck size={20} />,
            label: "Quản lý bảo hành",
            description: "Xem và cập nhật bảo hành",
            color: "bg-gradient-to-br from-emerald-400 to-green-600",
            badge: 0,
        },
        {
            href: "/admin/warranty-check",
            icon: <SearchCheck size={20} />,
            label: "Tra cứu bảo hành",
            description: "Kiểm tra tình trạng bảo hành",
            color: "bg-gradient-to-br from-sky-400 to-blue-600",
            badge: 0,
        },

    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                        Tổng quan hệ thống
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Chào mừng trở lại! Đây là tổng quan hoạt động của cửa hàng.
                    </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 bg-white dark:bg-[#1e2330] border border-slate-100 dark:border-white/5 rounded-xl px-4 py-2 shadow-sm">
                    <Activity size={14} className="text-emerald-500" />
                    <span>Cập nhật theo thời gian thực</span>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {statCards.map((card, idx) => (
                    <StatCard key={idx} {...card} />
                ))}
            </div>

            {/* Order Status Bar */}
            <OrderStatusBar stats={stats} />

            {/* Bottom Grid: Quick Links + Recent Orders */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Quick Links */}
                <div>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 text-sm uppercase tracking-wider">
                        ⚡ Truy cập nhanh
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {quickLinks.map((link) => (
                            <QuickLink key={link.href} {...link} />
                        ))}
                    </div>
                </div>

                {/* Recent Orders */}
                <div>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 text-sm uppercase tracking-wider">
                        🕐 Đơn hàng gần đây
                    </h3>
                    <RecentOrders orders={stats.recentOrders} />
                </div>
            </div>
        </div>
    );
}
