"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
    Search, Package, Clock, Truck, CheckCircle2, XCircle, Eye,
    ChevronLeft, ChevronRight, MoreHorizontal, RefreshCw,
    ShoppingBag, MapPin, Phone, User, ArrowRight, Loader2,
    Calendar, Hash, CreditCard, FileText, Copy, Edit, Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ===================== HELPERS =====================

function formatVND(value: number) {
    return new Intl.NumberFormat("vi-VN").format(value) + "đ";
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
    });
}

function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit"
    });
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} giờ trước`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days} ngày trước`;
    return formatDate(dateStr);
}

// ===================== PRINT BILL =====================

function printBill(order: any) {
    if (!order) return;
    const items = order.order_items || [];
    const status = STATUS_CONFIG_LABELS[order.status] || "Chờ xử lý";
    const payMethod = order.payment_method === "cod" ? "Thanh toán khi nhận hàng (COD)" : order.payment_method === "bank_transfer" ? "Chuyển khoản ngân hàng" : "Chưa xác định";

    // Tính phí vận chuyển theo chính sách
    const subtotal = order.total_amount || 0;
    let shippingFee = 0;
    let shippingLabel = "";
    if (subtotal < 500000) {
        // Đơn hàng dưới 500.000đ: phí cố định 25.000đ
        shippingFee = 25000;
        shippingLabel = formatVND(shippingFee);
    } else if (subtotal >= 500000 && subtotal <= 5000000) {
        // Đơn hàng 500.000đ - 5.000.000đ: miễn phí (hỗ trợ tối đa 25.000đ)
        shippingFee = 0;
        shippingLabel = "Miễn phí";
    } else {
        // Đơn hàng trên 5.000.000đ: hỗ trợ phí lên đến 70.000đ → miễn phí
        shippingFee = 0;
        shippingLabel = "Miễn phí";
    }
    const grandTotal = subtotal + shippingFee;

    const itemsHTML = items.map((item: any, idx: number) => {
        const product = item.product_variants?.products;
        const variant = item.product_variants;
        const attrs = variant?.attributes
            ? Object.entries(variant.attributes).map(([k, v]) => `${k}: ${v}`).join(", ")
            : "";
        const itemSubtotal = (item.price_at_purchase || 0) * (item.quantity || 1);
        return `
            <tr>
                <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;color:#666;">${idx + 1}</td>
                <td style="padding:10px 8px;border-bottom:1px solid #eee;">
                    <div style="font-weight:600;color:#1a1a1a;">${product?.name || "Sản phẩm"}</div>
                    ${attrs ? `<div style="font-size:11px;color:#888;margin-top:2px;">${attrs}</div>` : ""}
                </td>
                <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
                <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;">${formatVND(item.price_at_purchase)}</td>
                <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">${formatVND(itemSubtotal)}</td>
            </tr>
        `;
    }).join("");

    const logoUrl = window.location.origin + "/img/logo-telectric.png";

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Hóa đơn #${order.id?.slice(0, 8).toUpperCase()}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; background: #fff; }
        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div style="max-width:800px;margin:0 auto;padding:40px 30px;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #ea580c;padding-bottom:20px;margin-bottom:24px;">
            <div>
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;">
                    <img src="${logoUrl}" alt="TELECTRIC" style="height:80px;width:auto;object-fit:contain;" />
                </div>
                <div style="font-size:12px;color:#888;margin-top:4px;">Thiết bị điện công nghiệp chính hãng</div>
            </div>
            <div style="text-align:right;">
                <div style="font-size:20px;font-weight:800;color:#ea580c;">HÓA ĐƠN</div>
                <div style="font-size:12px;color:#666;margin-top:4px;">#${order.id?.slice(0, 8).toUpperCase()}</div>
                <div style="font-size:12px;color:#666;margin-top:2px;">Ngày: ${formatDateTime(order.created_at)}</div>
            </div>
        </div>

        <!-- Customer + Order Info -->
        <div style="display:flex;gap:24px;margin-bottom:24px;">
            <div style="flex:1;background:#f8f9fa;border-radius:10px;padding:16px;">
                <div style="font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Thông tin khách hàng</div>
                <div style="font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:4px;">${order.customer_name}</div>
                <div style="font-size:13px;color:#555;margin-bottom:3px;">📞 ${order.customer_phone}</div>
                ${order.shipping_address ? `<div style="font-size:13px;color:#555;">📍 ${order.shipping_address}</div>` : ""}
            </div>
            <div style="flex:1;background:#f8f9fa;border-radius:10px;padding:16px;">
                <div style="font-size:10px;font-weight:700;color:#999;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Thông tin đơn hàng</div>
                <div style="font-size:13px;color:#555;margin-bottom:3px;">Trạng thái: <strong>${status}</strong></div>
                <div style="font-size:13px;color:#555;margin-bottom:3px;">Thanh toán: ${payMethod}</div>
                ${order.notes ? `<div style="font-size:13px;color:#555;">Ghi chú: ${order.notes}</div>` : ""}
            </div>
        </div>

        <!-- Items Table -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <thead>
                <tr style="background:#f1f5f9;">
                    <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;width:40px;">STT</th>
                    <th style="padding:10px 8px;text-align:left;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Sản phẩm</th>
                    <th style="padding:10px 8px;text-align:center;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;width:60px;">SL</th>
                    <th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;width:120px;">Đơn giá</th>
                    <th style="padding:10px 8px;text-align:right;font-size:11px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;width:130px;">Thành tiền</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHTML}
            </tbody>
        </table>

        <!-- Totals -->
        <div style="display:flex;justify-content:flex-end;margin-bottom:30px;">
            <div style="width:280px;">
                <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#666;">
                    <span>Tạm tính:</span>
                    <span>${formatVND(subtotal)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#666;">
                    <span>Phí vận chuyển:</span>
                    <span style="color:${shippingFee > 0 ? '#333' : '#16a34a'};font-weight:600;">${shippingLabel}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:12px 0;font-size:18px;font-weight:800;color:#ea580c;border-top:2px solid #ea580c;margin-top:4px;">
                    <span>Tổng cộng:</span>
                    <span>${formatVND(grandTotal)}</span>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div style="border-top:1px solid #e5e7eb;padding-top:20px;text-align:center;">
            <p style="font-size:13px;color:#888;margin-bottom:4px;">Cảm ơn quý khách đã mua hàng tại <strong style="color:#ea580c;">TELECTRIC</strong></p>
            <p style="font-size:11px;color:#aaa;">Liên hệ hỗ trợ: 093.400.14.35 · telectric1992@gmail.com</p>
        </div>

        <!-- Print Button -->
        <div class="no-print" style="text-align:center;margin-top:30px;">
            <button onclick="window.print()" style="padding:12px 32px;background:#ea580c;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">🖨️ In hóa đơn</button>
        </div>
    </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
    }
}

// Label map cho print (không có JSX icons)
const STATUS_CONFIG_LABELS: Record<string, string> = {
    pending: "Chờ xử lý",
    processing: "Đang xử lý",
    shipped: "Đang giao hàng",
    delivered: "Đã giao hàng",
    cancelled: "Đã hủy",
};

// ===================== CONSTANTS =====================

const STATUS_CONFIG: Record<string, {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: React.ReactNode;
    dotColor: string;
}> = {
    pending: {
        label: "Chờ xử lý",
        color: "text-amber-700 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        borderColor: "border-amber-200 dark:border-amber-900/50",
        icon: <Clock className="h-3.5 w-3.5" />,
        dotColor: "bg-amber-500"
    },
    processing: {
        label: "Đang xử lý",
        color: "text-blue-700 dark:text-blue-400",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-200 dark:border-blue-900/50",
        icon: <Package className="h-3.5 w-3.5" />,
        dotColor: "bg-blue-500"
    },
    shipped: {
        label: "Đang giao",
        color: "text-violet-700 dark:text-violet-400",
        bgColor: "bg-violet-50 dark:bg-violet-900/20",
        borderColor: "border-violet-200 dark:border-violet-900/50",
        icon: <Truck className="h-3.5 w-3.5" />,
        dotColor: "bg-violet-500"
    },
    delivered: {
        label: "Đã giao",
        color: "text-emerald-700 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
        borderColor: "border-emerald-200 dark:border-emerald-900/50",
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        dotColor: "bg-emerald-500"
    },
    cancelled: {
        label: "Đã hủy",
        color: "text-red-700 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-900/20",
        borderColor: "border-red-200 dark:border-red-900/50",
        icon: <XCircle className="h-3.5 w-3.5" />,
        dotColor: "bg-red-500"
    },
};

// Admin có thể chuyển sang bất kỳ trạng thái nào (trừ trạng thái hiện tại)
const ALL_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];
const STATUS_TRANSITIONS: Record<string, string[]> = Object.fromEntries(
    ALL_STATUSES.map(s => [s, ALL_STATUSES.filter(t => t !== s)])
);

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    unpaid: { label: "Chưa TT", className: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-900/20 dark:border-red-900/50" },
    paid: { label: "Đã TT", className: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/20 dark:border-emerald-900/50" },
    refunded: { label: "Hoàn tiền", className: "text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-800/50 dark:border-slate-700" },
};

// ===================== TYPES =====================

interface OrderTableProps {
    orders: any[];
    totalCount: number;
    currentPage: number;
    pageSize: number;
    search: string;
    statusFilter: string;
    stats: {
        total: number;
        pending: number;
        processing: number;
        shipped: number;
        delivered: number;
        cancelled: number;
    };
    onRefresh: () => void;
}

// ===================== STATUS UPDATE DIALOG =====================

function StatusUpdateDialog({
    open, onOpenChange, order, onUpdate, isUpdating
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: any;
    onUpdate: (orderId: string, newStatus: string, newPaymentStatus: string) => void;
    isUpdating: boolean;
}) {
    const [newStatus, setNewStatus] = useState("");
    const [newPaymentStatus, setNewPaymentStatus] = useState("");

    // 3 trạng thái đơn hàng chính
    const ORDER_STATUSES = ["processing", "delivered", "cancelled"] as const;

    // Reset khi mở dialog
    React.useEffect(() => {
        if (open) {
            setNewStatus(order?.status || "processing");
            setNewPaymentStatus(order?.payment_status || "unpaid");
        }
    }, [open, order?.status, order?.payment_status]);

    if (!order) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Edit className="h-5 w-5 text-orange-600" />
                        Cập nhật trạng thái
                    </DialogTitle>
                    <DialogDescription>
                        Đơn hàng <span className="font-mono font-bold text-slate-700 dark:text-slate-300">#{order.id?.slice(0, 8)}</span>
                        {" · "}{order.customer_name}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-5">
                    {/* Order Status - 3 buttons always visible */}
                    <div>
                        <p className="text-xs font-medium text-slate-500 mb-2">Trạng thái đơn hàng</p>
                        <div className="flex flex-wrap gap-2">
                            {ORDER_STATUSES.map((key) => {
                                const config = STATUS_CONFIG[key];
                                const isSelected = newStatus === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setNewStatus(key)}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-all",
                                            isSelected
                                                ? cn(config.bgColor, config.borderColor, config.color, "ring-2 ring-offset-1 ring-orange-400 scale-[1.03]")
                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                                        )}
                                    >
                                        {config.icon}
                                        {config.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Payment Status - 3 buttons always visible */}
                    <div>
                        <p className="text-xs font-medium text-slate-500 mb-2">Trạng thái thanh toán</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(PAYMENT_STATUS_CONFIG).map(([key, config]) => {
                                const isSelected = newPaymentStatus === key;
                                const dotColor = key === "paid" ? "bg-emerald-500" : key === "refunded" ? "bg-slate-500" : "bg-red-500";
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setNewPaymentStatus(key)}
                                        className={cn(
                                            "inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg border text-xs font-semibold transition-all",
                                            isSelected
                                                ? cn(config.className, "ring-2 ring-offset-1 ring-orange-400 scale-[1.03]")
                                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
                                        )}
                                    >
                                        <span className={cn("w-2 h-2 rounded-full", dotColor)} />
                                        {config.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUpdating}>
                        Hủy
                    </Button>
                    <Button
                        className="bg-orange-600 hover:bg-orange-700"
                        disabled={isUpdating}
                        onClick={() => onUpdate(order.id, newStatus, newPaymentStatus)}
                    >
                        {isUpdating ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang cập nhật...</>
                        ) : (
                            "Xác nhận"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ===================== ORDER DETAIL DIALOG =====================

function OrderDetailDialog({
    open, onOpenChange, order
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    order: any;
}) {
    if (!order) return null;
    const items = order.order_items || [];
    const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const payStatus = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.unpaid;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">Chi tiết đơn hàng</p>
                            <p className="text-xs font-normal text-slate-500 mt-0.5">
                                #{order.id?.slice(0, 8)} · {formatDateTime(order.created_at)}
                            </p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Status + Payment */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold",
                            status.bgColor, status.borderColor, status.color
                        )}>
                            {status.icon} {status.label}
                        </span>
                        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", payStatus.className)}>
                            {payStatus.label}
                        </span>
                        {order.payment_method && (
                            <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                <CreditCard className="h-3 w-3 inline mr-1" />
                                {order.payment_method === "cod" ? "COD" : "Chuyển khoản"}
                            </span>
                        )}
                    </div>

                    {/* Customer */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Khách hàng</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <User className="h-4 w-4 text-orange-600" />
                                </div>
                                <span className="font-semibold text-slate-900 dark:text-slate-100">{order.customer_name}</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <Phone className="h-4 w-4 text-blue-600" />
                                </div>
                                <span className="text-slate-700 dark:text-slate-300">{order.customer_phone}</span>
                            </div>
                            {order.shipping_address && (
                                <div className="flex items-start gap-2.5 sm:col-span-2">
                                    <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <MapPin className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{order.shipping_address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Items */}
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                            Sản phẩm ({items.length})
                        </h4>
                        <div className="space-y-2.5">
                            {items.map((item: any, idx: number) => {
                                const product = item.product_variants?.products;
                                const variant = item.product_variants;
                                return (
                                    <div key={idx} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:shadow-sm transition">
                                        {product?.thumbnail ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={product.thumbnail}
                                                alt={product?.name || ""}
                                                className="w-12 h-12 rounded-lg object-cover border dark:border-slate-700"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                                <Package className="h-5 w-5 text-slate-300 dark:text-slate-500" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                                                {product?.name || "Sản phẩm"}
                                            </p>
                                            {variant?.attributes && (
                                                <div className="flex gap-1 mt-1 flex-wrap">
                                                    {Object.entries(variant.attributes).map(([k, v]) => (
                                                        <span key={k} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-medium">
                                                            {k}: {v as string}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="font-bold text-sm text-slate-900 dark:text-slate-100">{formatVND(item.price_at_purchase)}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">x{item.quantity}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Total */}
                    <div className="border-t pt-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-500">Tổng cộng</span>
                        <span className="text-2xl font-black text-orange-600">{formatVND(order.total_amount)}</span>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3">
                            <p className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-1">Ghi chú</p>
                            <p className="text-sm text-amber-800 dark:text-amber-400">{order.notes}</p>
                        </div>
                    )}

                    {/* Print Button */}
                    <div className="border-t pt-4 flex justify-end">
                        <Button
                            variant="outline"
                            className="gap-2 border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                            onClick={() => printBill(order)}
                        >
                            <Printer className="h-4 w-4" /> In hóa đơn
                        </Button>
                    </div>
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
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold whitespace-nowrap",
            config.bgColor, config.borderColor, config.color
        )}>
            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", config.dotColor)} />
            {config.label}
        </span>
    );
}

// ===================== MAIN TABLE =====================

export function OrderTable({
    orders, totalCount, currentPage, pageSize, search, statusFilter, stats, onRefresh
}: OrderTableProps) {
    const router = useRouter();
    const { toast } = useToast();
    const supabase = useMemo(() => createClient(), []);

    const [searchInput, setSearchInput] = useState(search);
    const [detailOrder, setDetailOrder] = useState<any>(null);
    const [statusOrder, setStatusOrder] = useState<any>(null);
    const [showDetail, setShowDetail] = useState(false);
    const [showStatus, setShowStatus] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const totalPages = Math.ceil(totalCount / pageSize);

    // --- Navigation ---
    const buildUrl = (params: Record<string, string>) => {
        const sp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => { if (v && v !== "all") sp.set(k, v); });
        const qs = sp.toString();
        return `/admin/orders${qs ? `?${qs}` : ""}`;
    };

    const handleSearch = () => {
        router.push(buildUrl({ search: searchInput, status: statusFilter, page: "1" }));
    };

    const handleStatusFilter = (status: string) => {
        router.push(buildUrl({ search, status, page: "1" }));
    };

    const handlePageChange = (newPage: number) => {
        router.push(buildUrl({ search, status: statusFilter, page: newPage.toString() }));
    };

    // --- Status Update ---
    const handleStatusUpdate = async (orderId: string, newStatus: string, newPaymentStatus: string) => {
        setIsUpdating(true);
        try {
            // Build update object
            const updateData: any = { updated_at: new Date().toISOString() };
            if (newStatus) updateData.status = newStatus;
            if (newPaymentStatus) updateData.payment_status = newPaymentStatus;

            const { error } = await supabase
                .from("orders")
                .update(updateData)
                .eq("id", orderId);

            if (error) throw error;

            // Chỉ chạy logic warranty khi STATUS ĐƠN HÀNG thực sự thay đổi
            const currentOrderStatus = orders.find(o => o.id === orderId)?.status;
            const statusActuallyChanged = newStatus && newStatus !== currentOrderStatus;

            // Auto-create warranty cards when status CHANGES to "delivered"
            if (statusActuallyChanged && newStatus === "delivered") {
                try {
                    // Fetch order with items + product info
                    const { data: orderData } = await supabase
                        .from("orders")
                        .select(`
                            customer_name, customer_phone,
                            order_items (
                                quantity,
                                product_variants (
                                    products ( name, warranty_months )
                                )
                            )
                        `)
                        .eq("id", orderId)
                        .single();

                    if (orderData?.order_items) {
                        const now = new Date();
                        const warrantyCards = (orderData.order_items as any[]).map((item: any) => {
                            const product = item.product_variants?.products;
                            const warrantyMonths = product?.warranty_months ?? 12;
                            const expiryDate = new Date(now);
                            expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);

                            return {
                                customer_phone: orderData.customer_phone,
                                customer_name: orderData.customer_name,
                                product_name: product?.name || "Sản phẩm",
                                serial_number: null,
                                purchase_date: now.toISOString().split("T")[0],
                                warranty_months: warrantyMonths,
                                expiry_date: expiryDate.toISOString().split("T")[0],
                                status: "active",
                            };
                        });

                        if (warrantyCards.length > 0) {
                            await supabase.from("warranty_cards").insert(warrantyCards);
                            toast({
                                title: "🛡️ Đã tạo phiếu bảo hành",
                                description: `Tạo ${warrantyCards.length} phiếu bảo hành tự động`,
                            });
                        }
                    }
                } catch (warrantyErr) {
                    console.error("Auto-create warranty failed:", warrantyErr);
                    // Don't block the status update if warranty creation fails
                }
            }

            // Auto-void warranty cards when order status CHANGES to cancelled
            if (statusActuallyChanged && newStatus === "cancelled") {
                try {
                    const { data: orderData } = await supabase
                        .from("orders")
                        .select(`
                            customer_phone,
                            order_items (
                                product_variants (
                                    products ( name )
                                )
                            )
                        `)
                        .eq("id", orderId)
                        .single();

                    if (orderData?.customer_phone && orderData?.order_items) {
                        const productNames = (orderData.order_items as any[])
                            .map((item: any) => item.product_variants?.products?.name)
                            .filter(Boolean);

                        if (productNames.length > 0) {
                            const { count } = await supabase
                                .from("warranty_cards")
                                .update({ status: "voided", updated_at: new Date().toISOString() })
                                .eq("customer_phone", orderData.customer_phone)
                                .in("product_name", productNames)
                                .eq("status", "active");

                            if (count && count > 0) {
                                toast({
                                    title: "⚠️ Đã huỷ phiếu bảo hành",
                                    description: `Huỷ ${count} phiếu bảo hành do đơn hàng bị huỷ`,
                                });
                            }
                        }
                    }
                } catch (voidErr) {
                    console.error("Auto-void warranty failed:", voidErr);
                }
            }

            const parts = [];
            if (newStatus) parts.push(`trạng thái → "${STATUS_CONFIG[newStatus]?.label}"`);
            if (newPaymentStatus && newPaymentStatus !== orders.find(o => o.id === orderId)?.payment_status) {
                parts.push(`thanh toán → "${PAYMENT_STATUS_CONFIG[newPaymentStatus]?.label}"`);
            }

            toast({
                title: "✓ Cập nhật thành công",
                description: parts.join(", ") || "Đã cập nhật đơn hàng",
            });

            setShowStatus(false);
            setStatusOrder(null);
            // Refetch data thay vì router.refresh
            onRefresh();
        } catch (err: any) {
            toast({
                title: "Lỗi cập nhật",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setIsUpdating(false);
        }
    };

    // --- Stat Cards ---
    const statCards = [
        { label: "Tất cả", value: stats.total, key: "all", color: "text-slate-600", bg: "bg-white", activeBg: "bg-slate-900 text-white", icon: <ShoppingBag className="h-4 w-4" /> },
        { label: "Chờ xử lý", value: stats.pending, key: "pending", color: "text-amber-600", bg: "bg-amber-50", activeBg: "bg-amber-600 text-white", icon: <Clock className="h-4 w-4" /> },
        { label: "Đang xử lý", value: stats.processing, key: "processing", color: "text-blue-600", bg: "bg-blue-50", activeBg: "bg-blue-600 text-white", icon: <Package className="h-4 w-4" /> },
        { label: "Đang giao", value: stats.shipped, key: "shipped", color: "text-violet-600", bg: "bg-violet-50", activeBg: "bg-violet-600 text-white", icon: <Truck className="h-4 w-4" /> },
        { label: "Đã giao", value: stats.delivered, key: "delivered", color: "text-emerald-600", bg: "bg-emerald-50", activeBg: "bg-emerald-600 text-white", icon: <CheckCircle2 className="h-4 w-4" /> },
        { label: "Đã hủy", value: stats.cancelled, key: "cancelled", color: "text-red-600", bg: "bg-red-50", activeBg: "bg-red-600 text-white", icon: <XCircle className="h-4 w-4" /> },
    ];

    const activeFilter = statusFilter || "all";

    return (
        <div className="space-y-5">
            {/* ===== STAT CARDS ===== */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5">
                {statCards.map((stat) => {
                    const isActive = activeFilter === stat.key;
                    return (
                        <button
                            key={stat.key}
                            onClick={() => handleStatusFilter(stat.key)}
                            className={cn(
                                "rounded-xl p-3 text-left transition-all duration-200 border group",
                                isActive
                                    ? `${stat.activeBg} border-transparent shadow-lg scale-[1.02] dark:shadow-none`
                                    : `${stat.bg} dark:bg-[#1e2330] border-slate-200 dark:border-white/5 hover:shadow-md hover:scale-[1.01]`
                            )}
                        >
                            <div className={cn(
                                "mb-1.5 transition-colors",
                                isActive ? "text-white/80" : stat.color
                            )}>
                                {stat.icon}
                            </div>
                            <p className={cn(
                                "text-xl font-black",
                                isActive ? "text-white" : "text-slate-900 dark:text-slate-100"
                            )}>
                                {stat.value}
                            </p>
                            <p className={cn(
                                "text-[11px] font-semibold mt-0.5",
                                isActive ? "text-white/70" : stat.color
                            )}>
                                {stat.label}
                            </p>
                        </button>
                    );
                })}
            </div>

            {/* ===== SEARCH BAR ===== */}
            <div className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-white/5 p-3 flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Tìm theo tên khách hàng hoặc số điện thoại..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-10 h-10 border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-slate-100 focus-visible:ring-orange-200"
                    />
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSearch} className="bg-orange-600 hover:bg-orange-700 h-10 px-5 text-white flex-1 sm:flex-none">
                        <Search className="h-4 w-4 mr-1.5" /> Tìm
                    </Button>
                    <Button
                        variant="outline"
                        className="h-10 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        onClick={() => {
                            setSearchInput("");
                            router.push("/admin/orders");
                        }}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* ===== TABLE ===== */}
            <div className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="min-w-[800px]">
                        <TableHeader>
                            <TableRow className="bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <TableHead className="font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider w-[100px]">
                                    <Hash className="h-3 w-3 inline mr-1" /> Mã đơn
                                </TableHead>
                                <TableHead className="font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider min-w-[180px]">
                                    <User className="h-3 w-3 inline mr-1" /> Khách hàng
                                </TableHead>
                                <TableHead className="font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider text-center w-[60px]">SP</TableHead>
                                <TableHead className="font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider text-right min-w-[120px]">Tổng tiền</TableHead>
                                <TableHead className="font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider text-center min-w-[140px]">Trạng thái</TableHead>
                                <TableHead className="font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider text-center min-w-[120px]">Thanh toán</TableHead>
                                <TableHead className="font-bold text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider min-w-[140px]">
                                    <Calendar className="h-3 w-3 inline mr-1" /> Ngày
                                </TableHead>
                                <TableHead className="w-[50px]" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-20">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                                                <ShoppingBag className="h-8 w-8 text-slate-300" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-slate-500">Không có đơn hàng</p>
                                                <p className="text-sm text-slate-400 mt-0.5">Thử thay đổi bộ lọc hoặc từ khóa</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order: any) => {
                                    const payStatus = PAYMENT_STATUS_CONFIG[order.payment_status] || PAYMENT_STATUS_CONFIG.unpaid;
                                    const itemCount = order.order_items?.length || 0;

                                    return (
                                        <TableRow
                                            key={order.id}
                                            className="hover:bg-orange-50/40 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                                            onClick={() => { setDetailOrder(order); setShowDetail(true); }}
                                        >
                                            {/* Order ID */}
                                            <TableCell>
                                                <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400 px-2 py-1 rounded">
                                                    #{order.id?.slice(0, 8)}
                                                </span>
                                            </TableCell>

                                            {/* Customer */}
                                            <TableCell>
                                                <div>
                                                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-orange-700 transition-colors">
                                                        {order.customer_name}
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                        <Phone className="h-3 w-3" /> {order.customer_phone}
                                                    </p>
                                                </div>
                                            </TableCell>

                                            {/* Item Count */}
                                            <TableCell className="text-center">
                                                <Badge variant="secondary" className="font-bold text-[11px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 dark:text-slate-300">
                                                    {itemCount}
                                                </Badge>
                                            </TableCell>

                                            {/* Total */}
                                            <TableCell className="text-right">
                                                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{formatVND(order.total_amount)}</span>
                                            </TableCell>

                                            {/* Status */}
                                            <TableCell className="text-center">
                                                <StatusBadge status={order.status} />
                                            </TableCell>

                                            {/* Payment */}
                                            <TableCell className="text-center">
                                                <span className={cn(
                                                    "text-[11px] font-bold px-2 py-1 rounded-full border",
                                                    payStatus.className
                                                )}>
                                                    {payStatus.label}
                                                </span>
                                            </TableCell>

                                            {/* Date */}
                                            <TableCell>
                                                <div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-300">{formatDate(order.created_at)}</p>
                                                    <p className="text-[10px] text-slate-400">{timeAgo(order.created_at)}</p>
                                                </div>
                                            </TableCell>

                                            {/* Actions */}
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem onClick={() => { setDetailOrder(order); setShowDetail(true); }}>
                                                            <Eye className="h-4 w-4 mr-2 text-blue-600" /> Xem chi tiết
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => { setStatusOrder(order); setShowStatus(true); }}
                                                            disabled={STATUS_TRANSITIONS[order.status]?.length === 0}
                                                        >
                                                            <RefreshCw className="h-4 w-4 mr-2 text-orange-600" /> Cập nhật trạng thái
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => printBill(order)}>
                                                            <Printer className="h-4 w-4 mr-2 text-violet-600" /> In hóa đơn
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(order.id);
                                                                toast({ title: "✓ Đã copy mã đơn!" });
                                                            }}
                                                        >
                                                            <Copy className="h-4 w-4 mr-2 text-slate-500" /> Copy mã đơn
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* ===== PAGINATION ===== */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-1">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{(currentPage - 1) * pageSize + 1}</span>
                        {" - "}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.min(currentPage * pageSize, totalCount)}</span>
                        {" / "}
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{totalCount}</span>
                        {" đơn hàng"}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline" size="sm"
                            disabled={currentPage <= 1}
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="h-9 w-9 p-0 dark:border-slate-700 dark:text-slate-300"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 5) {
                                pageNum = i + 1;
                            } else if (currentPage <= 3) {
                                pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                            } else {
                                pageNum = currentPage - 2 + i;
                            }
                            return (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "default" : "outline"}
                                    size="sm"
                                    className={cn(
                                        "w-9 h-9 p-0 text-sm font-bold dark:border-slate-700 dark:text-slate-300",
                                        currentPage === pageNum && "bg-orange-600 hover:bg-orange-700 text-white dark:border-orange-600"
                                    )}
                                    onClick={() => handlePageChange(pageNum)}
                                >
                                    {pageNum}
                                </Button>
                            );
                        })}
                        <Button
                            variant="outline" size="sm"
                            disabled={currentPage >= totalPages}
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="h-9 w-9 p-0 dark:border-slate-700 dark:text-slate-300"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* ===== DIALOGS ===== */}
            <OrderDetailDialog
                open={showDetail}
                onOpenChange={setShowDetail}
                order={detailOrder}
            />
            <StatusUpdateDialog
                open={showStatus}
                onOpenChange={(open) => { setShowStatus(open); if (!open) setStatusOrder(null); }}
                order={statusOrder}
                onUpdate={handleStatusUpdate}
                isUpdating={isUpdating}
            />
        </div>
    );
}
