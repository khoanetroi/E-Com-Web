"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    Loader2, Package, Eye, ShieldCheck, Clock,
    Truck, CheckCircle2, XCircle, User, Phone,
    MapPin, CreditCard, Calendar, FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ===================== HELPERS =====================

function formatVND(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value) + " đ";
}

function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
    });
}

// ===================== STATUS CONFIG =====================

const STATUS_CONFIG: Record<string, {
    label: string;
    lightColor: string;
    darkColor: string;
    lightBg: string;
    darkBg: string;
    lightBorder: string;
    darkBorder: string;
    icon: React.ReactNode;
}> = {
    pending: {
        label: "Chờ xử lý",
        lightColor: "text-amber-700", darkColor: "dark:text-amber-400",
        lightBg: "bg-amber-50", darkBg: "dark:bg-amber-500/10",
        lightBorder: "border-amber-200", darkBorder: "dark:border-amber-500/30",
        icon: <Clock className="h-3.5 w-3.5" />,
    },
    processing: {
        label: "Đang xử lý",
        lightColor: "text-blue-700", darkColor: "dark:text-blue-400",
        lightBg: "bg-blue-50", darkBg: "dark:bg-blue-500/10",
        lightBorder: "border-blue-200", darkBorder: "dark:border-blue-500/30",
        icon: <Package className="h-3.5 w-3.5" />,
    },
    shipped: {
        label: "Đang giao",
        lightColor: "text-violet-700", darkColor: "dark:text-violet-400",
        lightBg: "bg-violet-50", darkBg: "dark:bg-violet-500/10",
        lightBorder: "border-violet-200", darkBorder: "dark:border-violet-500/30",
        icon: <Truck className="h-3.5 w-3.5" />,
    },
    delivered: {
        label: "Hoàn thành",
        lightColor: "text-emerald-700", darkColor: "dark:text-emerald-400",
        lightBg: "bg-emerald-50", darkBg: "dark:bg-emerald-500/10",
        lightBorder: "border-emerald-200", darkBorder: "dark:border-emerald-500/30",
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    },
    cancelled: {
        label: "Đã hủy",
        lightColor: "text-red-700", darkColor: "dark:text-red-400",
        lightBg: "bg-red-50", darkBg: "dark:bg-red-500/10",
        lightBorder: "border-red-200", darkBorder: "dark:border-red-500/30",
        icon: <XCircle className="h-3.5 w-3.5" />,
    },
};

// ===================== TYPES =====================

interface WarrantyCard {
    id: string;
    customer_phone: string;
    customer_name: string | null;
    product_name: string;
    serial_number: string | null;
    purchase_date: string;
    warranty_months: number;
    expiry_date: string;
    status: string;
}

// ===================== ORDER SELECT QUERY =====================

const ORDER_SELECT = `
    *,
    order_items (
        quantity,
        price_at_purchase,
        product_variants (
            attributes,
            products ( name, thumbnail )
        )
    )
`;

// ===================== ORDER DETAIL DIALOG =====================

function OrderDetailDialog({
    open, onOpenChange, order, warranties
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: any;
    warranties: WarrantyCard[];
}) {
    if (!order) return null;
    const items = order.order_items || [];
    const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-[#1a1f2e] border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-orange-100 dark:bg-[#00b4d8]/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-orange-600 dark:text-[#00b4d8]" />
                        </div>
                        <div>
                            <p className="text-base text-slate-900 dark:text-white">Chi tiết đơn hàng</p>
                            <p className="text-xs font-normal text-slate-500 dark:text-gray-400 mt-0.5">
                                Mã đơn: <span className="font-bold text-orange-600 dark:text-[#00b4d8]">{order.id?.slice(0, 8).toUpperCase()}</span> · {formatDateTime(order.created_at)}
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Status */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold",
                            status.lightBg, status.darkBg, status.lightBorder, status.darkBorder, status.lightColor, status.darkColor
                        )}>
                            {status.icon} {status.label}
                        </span>
                        {order.payment_method && (
                            <span className="text-xs text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                <CreditCard className="h-3 w-3 inline mr-1" />
                                {order.payment_method === "cod" ? "COD" : "Chuyển khoản"}
                            </span>
                        )}
                    </div>

                    {/* Customer */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700/50">
                        <h4 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-3">Khách hàng</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-[#00b4d8]/10 flex items-center justify-center flex-shrink-0">
                                    <User className="h-4 w-4 text-orange-600 dark:text-[#00b4d8]" />
                                </div>
                                <span className="font-semibold text-slate-900 dark:text-white">{order.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                    <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-slate-700 dark:text-gray-300">{order.customer_phone}</span>
                            </div>
                            {order.shipping_address && (
                                <div className="flex items-start gap-2.5 sm:col-span-2">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                    <span className="text-slate-700 dark:text-gray-300 leading-relaxed">{order.shipping_address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-3">
                            Sản phẩm ({items.length})
                        </h4>
                        <div className="space-y-2.5">
                            {items.map((item: any, idx: number) => {
                                const product = item.product_variants?.products;
                                const variant = item.product_variants;
                                return (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-xl hover:shadow-sm dark:hover:bg-slate-800/50 transition">
                                        {product?.thumbnail ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={product.thumbnail}
                                                alt={product?.name || ""}
                                                className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-600"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                                <Package className="h-5 w-5 text-slate-400" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                                                {product?.name || "Sản phẩm"}
                                            </p>
                                            {variant?.attributes && (
                                                <div className="flex gap-1 mt-1 flex-wrap">
                                                    {Object.entries(variant.attributes).map(([k, v]) => (
                                                        <span key={k} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-gray-300 px-1.5 py-0.5 rounded font-medium">
                                                            {k}: {v as string}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-bold text-sm text-orange-600 dark:text-[#00b4d8]">{formatVND(item.price_at_purchase)}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">x{item.quantity}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Warranty Info */}
                    {warranties.length > 0 && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                Thông tin bảo hành
                            </h4>
                            <div className="space-y-2.5">
                                {warranties.map((w) => {
                                    const isActive = w.status === "active";
                                    const daysRemaining = Math.ceil(
                                        (new Date(w.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                                    );
                                    return (
                                        <div key={w.id} className="p-4 bg-white dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700/50 rounded-xl">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <p className="font-semibold text-sm text-slate-900 dark:text-white">{w.product_name}</p>
                                                    {w.serial_number && (
                                                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 font-mono">SN: {w.serial_number}</p>
                                                    )}
                                                </div>
                                                <span className={cn(
                                                    "text-xs font-bold px-2.5 py-1 rounded-full border",
                                                    isActive
                                                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                                                        : "bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400"
                                                )}>
                                                    {isActive ? "Còn bảo hành" : "Hết hạn"}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 text-xs">
                                                <div>
                                                    <p className="text-slate-400 dark:text-gray-500">Ngày mua</p>
                                                    <p className="text-slate-700 dark:text-gray-300 font-medium mt-0.5">{formatDate(w.purchase_date)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 dark:text-gray-500">Thời hạn</p>
                                                    <p className="text-slate-700 dark:text-gray-300 font-medium mt-0.5">{w.warranty_months} tháng</p>
                                                </div>
                                                <div>
                                                    <p className="text-slate-400 dark:text-gray-500">Hết hạn</p>
                                                    <p className="text-slate-700 dark:text-gray-300 font-medium mt-0.5">{formatDate(w.expiry_date)}</p>
                                                </div>
                                            </div>
                                            {isActive && daysRemaining > 0 && (
                                                <div className="mt-3">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-slate-400 dark:text-gray-500 text-[10px] uppercase tracking-wider">Thời gian còn lại</span>
                                                        <span className="text-emerald-600 dark:text-emerald-400 text-xs font-semibold">{daysRemaining} ngày</span>
                                                    </div>
                                                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                                                            style={{ width: `${Math.min(100, (daysRemaining / (w.warranty_months * 30)) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Total */}
                    <div className="border-t border-slate-200 dark:border-slate-700 pt-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-500 dark:text-gray-400">Tổng cộng</span>
                        <span className="text-2xl font-black text-orange-600 dark:text-[#00b4d8]">{formatVND(order.total_amount)}</span>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl p-3">
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-1">Ghi chú</p>
                            <p className="text-sm text-amber-800 dark:text-amber-300">{order.notes}</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ===================== STATUS BADGE =====================

function StatusBadge({ status }: { status: string }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
        <span className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap",
            config.lightBg, config.darkBg, config.lightBorder, config.darkBorder, config.lightColor, config.darkColor
        )}>
            {config.icon}
            {config.label}
        </span>
    );
}

// ===================== MAIN PAGE =====================

export default function OrdersPage() {
    const supabase = useMemo(() => createClient(), []);

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Detail dialog
    const [detailOrder, setDetailOrder] = useState<any>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [warranties, setWarranties] = useState<WarrantyCard[]>([]);

    // Fetch orders
    useEffect(() => {
        async function fetchOrders() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setLoading(false);
                    return;
                }

                // Try by user_id first
                let { data, error } = await supabase
                    .from("orders")
                    .select(ORDER_SELECT, { count: "exact" })
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

                // If user_id query failed or returned nothing, try by customer_phone
                if (error || !data || data.length === 0) {
                    // Try matching by user's phone from metadata
                    const phone = user.user_metadata?.phone || user.phone;
                    if (phone) {
                        const res = await supabase
                            .from("orders")
                            .select(ORDER_SELECT)
                            .eq("customer_phone", phone.replace(/\s/g, ""))
                            .order("created_at", { ascending: false });
                        if (!res.error && res.data && res.data.length > 0) {
                            data = res.data;
                        }
                    }

                    // Also try matching by user's email in customer_email if it exists, but for now we fallback to nothing
                    // as TLECTRIC's order table primarily uses phone and user_id.
                    if ((!data || data.length === 0) && user.email) {
                        const res = await supabase
                            .from("orders")
                            .select(ORDER_SELECT)
                            .eq("customer_phone", (user.user_metadata?.phone || "").replace(/\s/g, "")) // attempt with phone fallback
                            .order("created_at", { ascending: false });
                        if (!res.error && res.data) {
                            data = res.data;
                        }
                    }
                }

                setOrders(data || []);
            } catch (err) {
                console.error("Failed to fetch orders:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchOrders();
    }, [supabase]);

    // Open detail & load warranties
    const openDetail = async (order: any) => {
        setDetailOrder(order);
        setShowDetail(true);
        setWarranties([]);

        // Chỉ load warranties cho đơn hàng đã giao thành công, không load cho đơn đã hủy
        if (order.customer_phone && order.status !== "cancelled") {
            try {
                const { data } = await supabase
                    .from("warranty_cards")
                    .select("*")
                    .eq("customer_phone", order.customer_phone)
                    .order("created_at", { ascending: false });

                setWarranties(data || []);
            } catch {
                // ignore
            }
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600 dark:text-[#00b4d8]" />
                    <p className="text-sm text-slate-500 dark:text-gray-400 font-medium">Đang tải đơn hàng...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <h2 className="text-lg font-bold uppercase text-orange-600 dark:text-[#00b4d8] tracking-wider">
                Lịch sử đơn hàng
            </h2>

            {/* Empty state */}
            {orders.length === 0 ? (
                <div className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                        <Package className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Chưa có đơn hàng</h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400 max-w-sm mx-auto">
                        Bạn chưa có đơn hàng nào. Hãy khám phá sản phẩm và đặt hàng ngay!
                    </p>
                </div>
            ) : (
                /* Order cards */
                <div className="space-y-6">
                    {orders.map((order) => {
                        const items = order.order_items || [];
                        const subtotal = items.reduce(
                            (sum: number, item: any) => sum + (item.price_at_purchase || 0) * (item.quantity || 1),
                            0
                        );

                        return (
                            <div
                                key={order.id}
                                className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-sm"
                            >
                                {/* Order header */}
                                <div className="px-5 pt-5 pb-3">
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                        <p className="text-sm text-slate-500 dark:text-gray-400">
                                            Mã đơn: <span className="font-bold text-slate-900 dark:text-white">{order.id?.slice(0, 8).toUpperCase()}</span>
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-gray-400">
                                            Ngày mua: <span className="text-slate-700 dark:text-gray-300 font-medium">{formatDateTime(order.created_at)}</span>
                                        </p>
                                    </div>
                                </div>

                                {/* Items table */}
                                <div className="px-5">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-700/50">
                                                <th className="text-left py-2.5 text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider w-[70px]">ID</th>
                                                <th className="text-left py-2.5 text-xs font-bold text-orange-600 dark:text-[#00b4d8] uppercase tracking-wider">Sản phẩm</th>
                                                <th className="text-center py-2.5 text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider w-[60px]">Loại</th>
                                                <th className="text-center py-2.5 text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider w-[100px]">Giá</th>
                                                <th className="text-center py-2.5 text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider w-[100px]">Trạng thái</th>
                                                <th className="text-center py-2.5 text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider w-[90px]">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item: any, idx: number) => {
                                                const product = item.product_variants?.products;
                                                const variant = item.product_variants;
                                                const attrs = variant?.attributes
                                                    ? Object.values(variant.attributes).join(", ")
                                                    : "";
                                                return (
                                                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-700/30 last:border-0">
                                                        <td className="py-3">
                                                            <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-gray-300 px-2 py-1 rounded">
                                                                {order.id?.slice(0, 6)}
                                                            </span>
                                                        </td>
                                                        <td className="py-3">
                                                            <div className="flex items-center gap-3">
                                                                {product?.thumbnail ? (
                                                                    // eslint-disable-next-line @next/next/no-img-element
                                                                    <img
                                                                        src={product.thumbnail}
                                                                        alt={product?.name || ""}
                                                                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-600 flex-shrink-0"
                                                                    />
                                                                ) : (
                                                                    <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                                                        <Package className="h-4 w-4 text-slate-400" />
                                                                    </div>
                                                                )}
                                                                <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                                                                    {product?.name || "Sản phẩm"}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            {attrs ? (
                                                                <Badge variant="outline" className="text-[10px] bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30 font-medium">
                                                                    {attrs.length > 6 ? attrs.slice(0, 6) : attrs}
                                                                </Badge>
                                                            ) : (
                                                                <span className="text-slate-400 dark:text-gray-500">-</span>
                                                            )}
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            <span className="font-bold text-orange-600 dark:text-[#00b4d8]">
                                                                {formatVND(item.price_at_purchase || 0)}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <StatusBadge status={order.status} />
                                                                {order.status === "delivered" && (
                                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400">
                                                                        <ShieldCheck className="h-3 w-3" /> Còn hạn BH
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 text-center">
                                                            {idx === 0 && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 text-xs bg-transparent border-slate-300 dark:border-slate-600 text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white gap-1"
                                                                    onClick={() => openDetail(order)}
                                                                >
                                                                    <Eye className="h-3 w-3" />
                                                                    Chi tiết
                                                                </Button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Order footer - totals */}
                                <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700/50">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-slate-500 dark:text-gray-400">Tạm tính:</span>
                                        <span className="text-sm text-slate-700 dark:text-gray-300">{formatVND(subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">Tổng tiền:</span>
                                        <span className="text-lg font-black text-orange-600 dark:text-[#00b4d8]">{formatVND(order.total_amount || subtotal)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Order Detail Dialog */}
            <OrderDetailDialog
                open={showDetail}
                onOpenChange={setShowDetail}
                order={detailOrder}
                warranties={warranties}
            />
        </div>
    );
}
