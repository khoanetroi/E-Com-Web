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
    X,
    Truck,
    RefreshCcw,
    AlertCircle,
    DollarSign,
    Activity,
    BarChart3,
    Ticket,
    Flame,
    ShieldAlert,
} from "lucide-react";
import DefectRateAnalytics from "@/components/admin/DefectRateAnalytics";

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
    totalTickets: number;
    unresolvedTickets: number;
    pendingTickets?: number;
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

const formatCurrencyAbbr = (value: number) => {
    if (value >= 1000000) {
        return (value / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + 'M ₫';
    }
    if (value >= 1000) {
        return (value / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + 'k ₫';
    }
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
};

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

interface RevenueBucket {
    label: string;
    dateKey: string;
    revenue: number;
    orderCount: number;
}

const getMondayOfDate = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.getFullYear(), d.getMonth(), diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
};

const processRevenueData = (orders: { total_amount: number; created_at: string }[], filterType: 'day' | 'week' | 'month'): RevenueBucket[] => {
    const now = new Date();
    const result: RevenueBucket[] = [];

    if (filterType === 'day') {
        // Last 15 days
        for (let i = 14; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i);
            const dateKey = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
            const label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            result.push({ label, dateKey, revenue: 0, orderCount: 0 });
        }

        orders.forEach(order => {
            if (!order.created_at) return;
            const od = new Date(order.created_at);
            const key = od.toLocaleDateString('en-CA');
            const bucket = result.find(r => r.dateKey === key);
            if (bucket) {
                bucket.revenue += order.total_amount || 0;
                bucket.orderCount += 1;
            }
        });
    } else if (filterType === 'week') {
        // Last 8 weeks
        for (let i = 7; i >= 0; i--) {
            const d = new Date();
            d.setDate(now.getDate() - i * 7);
            const monday = getMondayOfDate(d);
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            sunday.setHours(23, 59, 59, 999);

            const dateKey = monday.toLocaleDateString('en-CA');
            const monStr = monday.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            const sunStr = sunday.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            const label = `${monStr} - ${sunStr}`;
            result.push({ label, dateKey, revenue: 0, orderCount: 0 });
        }

        orders.forEach(order => {
            if (!order.created_at) return;
            const od = new Date(order.created_at);
            const oTime = od.getTime();
            result.forEach(bucket => {
                const bMonday = new Date(bucket.dateKey);
                bMonday.setHours(0, 0, 0, 0);
                const bSunday = new Date(bMonday);
                bSunday.setDate(bMonday.getDate() + 7);

                if (oTime >= bMonday.getTime() && oTime < bSunday.getTime()) {
                    bucket.revenue += order.total_amount || 0;
                    bucket.orderCount += 1;
                }
            });
        });
    } else if (filterType === 'month') {
        // Last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const label = `Tháng ${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
            result.push({ label, dateKey, revenue: 0, orderCount: 0 });
        }

        orders.forEach(order => {
            if (!order.created_at) return;
            const od = new Date(order.created_at);
            const key = `${od.getFullYear()}-${String(od.getMonth() + 1).padStart(2, '0')}`;
            const bucket = result.find(r => r.dateKey === key);
            if (bucket) {
                bucket.revenue += order.total_amount || 0;
                bucket.orderCount += 1;
            }
        });
    }

    return result;
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
    href?: string;
    onClick?: () => void;
    clickable?: boolean;
    isActive?: boolean;
}

const StatCard = ({ title, value, icon, gradient, trend, subtitle, href, onClick, clickable, isActive }: StatCardProps) => {
    const isClickable = clickable || !!href || !!onClick;
    const cardContent = (
        <div
            onClick={onClick}
            className={`relative overflow-hidden rounded-2xl bg-white dark:bg-[#1e2330] border p-6 shadow-sm transition-all duration-300 group h-full ${isClickable ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5" : ""
                } ${isActive
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-500 dark:ring-emerald-500/10"
                    : "border-slate-100 dark:border-white/5"
                }`}
        >
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

    if (href) {
        return (
            <Link href={href} className="block h-full">
                {cardContent}
            </Link>
        );
    }

    return cardContent;
};

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
        totalTickets: 0,
        unresolvedTickets: 0,
        pendingTickets: 0,
        recentOrders: [],
    });

    const [deliveredOrders, setDeliveredOrders] = useState<{ total_amount: number; created_at: string }[]>([]);
    const [showRevenueDetail, setShowRevenueDetail] = useState(false);
    const [showDefectDetail, setShowDefectDetail] = useState(false);
    const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('day');
    const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const activeRevenueData = useMemo(() => {
        return processRevenueData(deliveredOrders, timeFilter);
    }, [deliveredOrders, timeFilter]);

    const { yMax, ticks } = useMemo(() => {
        const maxVal = Math.max(...activeRevenueData.map(d => d.revenue), 0);

        if (maxVal <= 0) return { yMax: 1000000, ticks: [1000000, 750000, 500000, 250000, 0] };

        const log10 = Math.log10(maxVal);
        const magnitude = Math.pow(10, Math.floor(log10));

        let roundedMax = Math.ceil(maxVal / (magnitude / 2)) * (magnitude / 2);
        if (roundedMax === maxVal) roundedMax += magnitude;
        if (roundedMax < maxVal) roundedMax = maxVal;

        const generatedTicks = [roundedMax, roundedMax * 0.75, roundedMax * 0.5, roundedMax * 0.25, 0];
        return { yMax: roundedMax, ticks: generatedTicks };
    }, [activeRevenueData]);

    const summaryStats = useMemo(() => {
        const total = activeRevenueData.reduce((sum, item) => sum + item.revenue, 0);
        const ordersCount = activeRevenueData.reduce((sum, item) => sum + item.orderCount, 0);
        const avgPeriod = total / (activeRevenueData.length || 1);
        const avgOrder = ordersCount > 0 ? total / ordersCount : 0;
        return { total, ordersCount, avgPeriod, avgOrder };
    }, [activeRevenueData]);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            try {
                const [
                    ordersRes,
                    revenueRes,
                    productsRes,
                    usersRes,
                    ticketsRes,
                    pendingRes,
                    processingRes,
                    shippedRes,
                    deliveredRes,
                    cancelledRes,
                    recentRes,
                ] = await Promise.all([
                    supabase.from("orders").select("*", { count: "exact", head: true }),
                    supabase.from("orders").select("total_amount, created_at").eq("status", "delivered"),
                    supabase.from("products").select("*", { count: "exact", head: true }),
                    supabase.from("profiles").select("*", { count: "exact", head: true }),
                    supabase.from("warranty_tickets").select("id, status"),
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

                const deliveredData = revenueRes.data || [];
                const totalRevenue = deliveredData.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0);

                const ticketList = (ticketsRes.data || []) as Array<{ id: string; status?: string }>;
                const totalTickets = ticketList.length;
                const unresolvedTickets = ticketList.filter(
                    (t) => t.status !== "resolved" && t.status !== "closed"
                ).length;

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
                    totalNews: 0,
                    totalTickets,
                    unresolvedTickets,
                    pendingTickets: unresolvedTickets,
                    recentOrders: recentRes.data || [],
                });
                setDeliveredOrders(deliveredData);
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
            subtitle: `${stats.pendingOrders} đang chờ xử lý • Nhấp để xem`,
            href: "/admin/orders",
        },
        {
            title: "Doanh thu (đã giao)",
            value: loading ? "—" : formatCurrency(stats.totalRevenue),
            icon: <DollarSign size={22} />,
            gradient: "bg-gradient-to-br from-emerald-400 to-teal-600",
            subtitle: loading ? "Đang tải dữ liệu..." : `Từ ${stats.deliveredOrders} đơn đã giao • Nhấp để xem`,
            onClick: () => setShowRevenueDetail(!showRevenueDetail),
            clickable: true,
            isActive: showRevenueDetail,
        },
        {
            title: "Ticket lỗi",
            value: loading ? "—" : `${stats.totalTickets} ticket`,
            icon: <Flame size={22} />,
            gradient: "bg-gradient-to-br from-rose-500 to-red-600",
            subtitle: loading ? "Đang tải dữ liệu..." : `${stats.unresolvedTickets} chưa xử lý • Nhấp để xem biểu đồ`,
            onClick: () => setShowDefectDetail(!showDefectDetail),
            clickable: true,
            isActive: showDefectDetail,
        },
        {
            title: "Sản phẩm",
            value: loading ? "—" : stats.totalProducts.toLocaleString("vi-VN"),
            icon: <Package size={22} />,
            gradient: "bg-gradient-to-br from-blue-400 to-indigo-600",
            subtitle: "Đang kinh doanh • Nhấp để quản lý",
            href: "/admin/products",
        },
        {
            title: "Khách hàng",
            value: loading ? "—" : stats.totalUsers.toLocaleString("vi-VN"),
            icon: <Users size={22} />,
            gradient: "bg-gradient-to-br from-purple-400 to-violet-600",
            subtitle: "Tài khoản khách hàng • Nhấp để quản lý",
            href: "/admin/users",
        },
    ];

    const quickLinks = [
        {
            href: "/admin/warranty-tickets",
            icon: <Ticket size={20} />,
            label: "Ticket báo lỗi",
            description: "Chẩn đoán & xử lý sự cố thiết bị",
            color: "bg-gradient-to-br from-amber-500 to-orange-600",
            badge: stats.pendingTickets || stats.unresolvedTickets,
        },
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
            href: "/admin/brands",
            icon: <ImageIcon size={20} />,
            label: "Thương hiệu",
            description: "Quản lý logo & hãng đối tác",
            color: "bg-gradient-to-br from-pink-500 to-rose-600",
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {statCards.map((card, idx) => (
                    <StatCard key={idx} {...card} />
                ))}
            </div>

            {/* Defect Rate Details Panel (Click-to-Toggle) */}
            {showDefectDetail && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300 rounded-2xl bg-white dark:bg-[#1e2330] border border-slate-100 dark:border-white/5 p-6 shadow-sm">
                    <DefectRateAnalytics onClose={() => setShowDefectDetail(false)} />
                </div>
            )}

            {/* Revenue Details Panel */}
            {showRevenueDetail && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-300 rounded-2xl bg-white dark:bg-[#1e2330] border border-slate-100 dark:border-white/5 p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/5 pb-4">
                        <div>
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-base">
                                <DollarSign size={18} className="text-emerald-500" />
                                Chi tiết doanh thu (đã giao)
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                Số liệu được thống kê dựa trên các đơn hàng có trạng thái Đã giao.
                            </p>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Time Filters */}
                            <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 border border-slate-200/50 dark:border-white/5">
                                {(
                                    [
                                        { key: 'day', label: 'Theo ngày' },
                                        { key: 'week', label: 'Theo tuần' },
                                        { key: 'month', label: 'Theo tháng' },
                                    ] as const
                                ).map((t) => (
                                    <button
                                        key={t.key}
                                        onClick={() => {
                                            setTimeFilter(t.key);
                                            setHoveredIndex(null);
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${timeFilter === t.key
                                            ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                            }`}
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>

                            {/* View Modes */}
                            <div className="flex rounded-xl bg-slate-100 dark:bg-white/5 p-1 border border-slate-200/50 dark:border-white/5">
                                {(
                                    [
                                        { key: 'chart', label: 'Biểu đồ' },
                                        { key: 'table', label: 'Bảng số liệu' },
                                    ] as const
                                ).map((m) => (
                                    <button
                                        key={m.key}
                                        onClick={() => setViewMode(m.key)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === m.key
                                            ? "bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm"
                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                            }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => setShowRevenueDetail(false)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                                title="Đóng bảng chi tiết"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100/50 dark:border-white/5">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wider">Tổng doanh thu kỳ</p>
                            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 leading-tight">{formatCurrency(summaryStats.total)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100/50 dark:border-white/5">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wider">Tổng đơn hàng</p>
                            <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1 leading-tight">{summaryStats.ordersCount} đơn</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100/50 dark:border-white/5">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wider">Doanh thu TB / mốc</p>
                            <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1 leading-tight">{formatCurrency(summaryStats.avgPeriod)}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100/50 dark:border-white/5">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-semibold tracking-wider">Giá trị đơn TB (AOV)</p>
                            <p className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1 leading-tight">{formatCurrency(summaryStats.avgOrder)}</p>
                        </div>
                    </div>

                    {/* Content view */}
                    {viewMode === 'chart' ? (
                        <div className="relative pt-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-slate-100/50 dark:border-white/5 p-4">
                            {/* Chart Title / Date Range Indicator */}
                            <div className="flex items-center justify-between mb-4 px-2">
                                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Biểu đồ xu hướng</span>
                                <span className="text-xs text-slate-400 dark:text-slate-500">
                                    {timeFilter === 'day' && "15 ngày vừa qua"}
                                    {timeFilter === 'week' && "8 tuần vừa qua"}
                                    {timeFilter === 'month' && "6 tháng vừa qua"}
                                </span>
                            </div>

                            {/* SVG Container */}
                            <div className="relative w-full h-[300px]">
                                {(() => {
                                    const width = 600;
                                    const height = 300;
                                    const paddingLeft = 60;
                                    const paddingRight = 20;
                                    const paddingTop = 20;
                                    const paddingBottom = 40;

                                    const chartWidth = width - paddingLeft - paddingRight;
                                    const chartHeight = height - paddingTop - paddingBottom;

                                    const points = activeRevenueData.map((d, index) => {
                                        const x = paddingLeft + (index / (activeRevenueData.length - 1 || 1)) * chartWidth;
                                        const y = paddingTop + chartHeight - (d.revenue / yMax) * chartHeight;
                                        return { x, y, ...d };
                                    });

                                    let linePath = "";
                                    if (points.length > 0) {
                                        linePath = `M ${points[0].x} ${points[0].y} ` +
                                            points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
                                    }

                                    let areaPath = "";
                                    if (points.length > 0) {
                                        areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;
                                    }

                                    return (
                                        <>
                                            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-slate-900 dark:text-white" preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                                                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                                    </linearGradient>
                                                </defs>

                                                {/* Grid Lines */}
                                                {ticks.map((tick, idx) => {
                                                    const y = paddingTop + chartHeight - (tick / yMax) * chartHeight;
                                                    return (
                                                        <g key={idx} className="opacity-40">
                                                            <line
                                                                x1={paddingLeft}
                                                                y1={y}
                                                                x2={width - paddingRight}
                                                                y2={y}
                                                                className="stroke-slate-200 dark:stroke-slate-800 stroke-[1px] stroke-dashed"
                                                                strokeDasharray="4 4"
                                                            />
                                                            <text
                                                                x={paddingLeft - 10}
                                                                y={y + 4}
                                                                textAnchor="end"
                                                                className="fill-slate-400 dark:fill-slate-500 text-[10px] font-medium"
                                                            >
                                                                {formatCurrencyAbbr(tick)}
                                                            </text>
                                                        </g>
                                                    );
                                                })}

                                                {/* X Axis grid lines and labels */}
                                                {points.map((p, idx) => {
                                                    const showLabel = timeFilter !== 'day' || idx % 2 === 0 || idx === points.length - 1;
                                                    return (
                                                        <g key={idx}>
                                                            {showLabel && (
                                                                <text
                                                                    x={p.x}
                                                                    y={height - 15}
                                                                    textAnchor="middle"
                                                                    className="fill-slate-400 dark:fill-slate-500 text-[10px] font-medium"
                                                                >
                                                                    {p.label}
                                                                </text>
                                                            )}
                                                        </g>
                                                    );
                                                })}

                                                {/* Hover Vertical Guide Line */}
                                                {hoveredIndex !== null && points[hoveredIndex] && (
                                                    <line
                                                        x1={points[hoveredIndex].x}
                                                        y1={paddingTop}
                                                        x2={points[hoveredIndex].x}
                                                        y2={paddingTop + chartHeight}
                                                        className="stroke-emerald-400/50 dark:stroke-emerald-500/50 stroke-[1.5px] stroke-dashed"
                                                        strokeDasharray="3 3"
                                                    />
                                                )}

                                                {/* Area Path */}
                                                {areaPath && (
                                                    <path
                                                        d={areaPath}
                                                        fill="url(#chartGradient)"
                                                    />
                                                )}

                                                {/* Line Path */}
                                                {linePath && (
                                                    <path
                                                        d={linePath}
                                                        fill="none"
                                                        className="stroke-emerald-500 stroke-[3px]"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                )}

                                                {/* Circles at nodes */}
                                                {points.map((p, idx) => (
                                                    <circle
                                                        key={idx}
                                                        cx={p.x}
                                                        cy={p.y}
                                                        r={hoveredIndex === idx ? 6 : 4}
                                                        className={`transition-all duration-100 ${hoveredIndex === idx
                                                            ? "fill-emerald-500 stroke-white stroke-[2px] dark:stroke-[#1e2330]"
                                                            : "fill-white dark:fill-[#1e2330] stroke-emerald-500 stroke-[2px] cursor-pointer"
                                                            }`}
                                                    />
                                                ))}

                                                {/* Invisible Rectangular Hover Catchers */}
                                                {points.map((p, idx) => {
                                                    const spacing = chartWidth / (activeRevenueData.length - 1 || 1);
                                                    const rectX = p.x - spacing / 2;
                                                    return (
                                                        <rect
                                                            key={idx}
                                                            x={rectX}
                                                            y={paddingTop}
                                                            width={spacing}
                                                            height={chartHeight}
                                                            fill="transparent"
                                                            className="cursor-pointer"
                                                            onMouseEnter={() => setHoveredIndex(idx)}
                                                            onMouseLeave={() => setHoveredIndex(null)}
                                                        />
                                                    );
                                                })}
                                            </svg>

                                            {/* HTML Tooltip Overlay (Absolute Positioned over parent) */}
                                            {hoveredIndex !== null && points[hoveredIndex] && (
                                                <div
                                                    className="absolute z-10 p-3 bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 rounded-xl shadow-xl pointer-events-none text-xs border border-white/10 dark:border-slate-200 transition-all duration-700 ease-out select-none"
                                                    style={{
                                                        left: `${(points[hoveredIndex].x / width) * 100}%`,
                                                        top: `${(points[hoveredIndex].y / height) * 100 - 10}%`,
                                                        transform: 'translate(-50%, -100%)',
                                                    }}
                                                >
                                                    <p className="font-semibold mb-1 text-slate-300 dark:text-slate-500">{points[hoveredIndex].label}</p>
                                                    <p className="text-sm font-bold text-emerald-400 dark:text-emerald-600">{formatCurrency(points[hoveredIndex].revenue)}</p>
                                                    <p className="text-[10px] mt-0.5 text-slate-400 dark:text-slate-500">{points[hoveredIndex].orderCount} đơn hàng thành công</p>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300">Mốc thời gian</th>
                                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Doanh thu</th>
                                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-center">Số đơn hàng</th>
                                        <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Giao dịch TB</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                                    {[...activeRevenueData].reverse().map((item, idx) => {
                                        const avg = item.orderCount > 0 ? item.revenue / item.orderCount : 0;
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                                <td className="p-4 font-medium text-slate-800 dark:text-slate-200">{item.label}</td>
                                                <td className="p-4 text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(item.revenue)}</td>
                                                <td className="p-4 text-center text-slate-600 dark:text-slate-400">{item.orderCount}</td>
                                                <td className="p-4 text-right text-slate-500 dark:text-slate-400">{formatCurrency(avg)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

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
