"use client";

import React, { Suspense, useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import {
    CheckCircle, ChevronRight, ArrowLeft, Receipt,
    Copy, Check, QrCode, Smartphone, Clock, AlertCircle,
    Landmark, ShieldCheck, RefreshCw, Sparkles, CheckCircle2,
    Truck, Package
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// Cấu hình thông tin tài khoản MBBank & SePay Gateway
const BANK_INFO = {
    bankId: "MB",
    bankName: "MBBank",
    bankFullName: "Ngân hàng TMCP Quân đội (MBBank)",
    accountNumber: "0364923127",
    accountName: "NGUYEN DANG KHOA",
};

function formatVND(value: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function CopyButton({ text, label }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-lg transition-all"
            title="Sao chép"
        >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Đã chép" : (label || "Sao chép")}
        </button>
    );
}

function QRPaymentPanel({
    orderId,
    amount,
    onPaymentSuccess
}: {
    orderId: string | null;
    amount: number;
    onPaymentSuccess: () => void;
}) {
    const [imageLoading, setImageLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [qrSourceIndex, setQrSourceIndex] = useState(0);

    const shortId = orderId ? orderId.slice(0, 8).toUpperCase() : "TELECTRIC";
    const transferContent = `TELECTRIC ${shortId}`;

    // Nguồn 1: SePay Dynamic QR; Nguồn 2: VietQR fallback
    const qrUrls = [
        `https://qr.sepay.vn/img?acc=${BANK_INFO.accountNumber}&bank=${BANK_INFO.bankName}&amount=${Math.round(amount)}&des=${encodeURIComponent(transferContent)}&template=compact`,
        `https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNumber}-compact2.png?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`
    ];

    const currentQrUrl = qrUrls[qrSourceIndex] || qrUrls[0];

    const checkPaymentStatus = async () => {
        if (!orderId) return;
        setChecking(true);
        try {
            const res = await fetch(`/api/orders/${orderId}/status`);
            const data = await res.json();
            if (data.isPaid) {
                onPaymentSuccess();
            }
        } catch (e) {
            console.error("Error checking order payment:", e);
        } finally {
            setTimeout(() => setChecking(false), 500);
        }
    };

    return (
        <div className="mt-6 rounded-2xl border-2 border-blue-200 dark:border-blue-900/60 bg-gradient-to-b from-blue-50/70 to-white dark:from-[#131929] dark:to-[#0d111c] overflow-hidden shadow-sm transition-all">
            {/* Panel header */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <QrCode className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="font-black text-white text-[15px] sm:text-base">Mã QR Thanh Toán Tự Động (SePay)</p>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/90 text-emerald-950">
                                Realtime Auto-Check
                            </span>
                        </div>
                        <p className="text-blue-100 text-xs font-medium">Tự động nhận dạng tiền vào và kích hoạt đơn hàng</p>
                    </div>
                </div>
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm">
                    <ShieldCheck size={14} /> MBBank 24/7
                </span>
            </div>

            <div className="p-5 sm:p-7">
                {/* QR Image + Bank Info — side by side on desktop */}
                <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
                    {/* QR Code Container */}
                    <div className="flex-shrink-0 flex flex-col items-center">
                        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-[0_12px_36px_rgba(37,99,235,0.18)] bg-white p-2 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={currentQrUrl}
                                alt={`QR SePay thanh toán đơn hàng ${shortId}`}
                                className={`w-full h-full object-contain transition-opacity duration-300 ${imageLoading ? 'opacity-30' : 'opacity-100'}`}
                                onLoad={() => setImageLoading(false)}
                                onError={() => {
                                    if (qrSourceIndex < qrUrls.length - 1) {
                                        setQrSourceIndex(prev => prev + 1);
                                    }
                                }}
                            />
                            {imageLoading && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/80 dark:bg-slate-900/80">
                                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs text-slate-500 font-medium">Đang tạo mã SePay...</span>
                                </div>
                            )}
                        </div>

                        <p className="text-center text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-bold mt-3 flex items-center justify-center gap-1.5">
                            <Smartphone className="h-4 w-4" /> Mở App Ngân hàng bất kỳ để quét
                        </p>
                    </div>

                    {/* Bank Transfer Details */}
                    <div className="w-full space-y-3 flex-1">
                        {/* Ngân hàng */}
                        <div className="flex items-center justify-between bg-white dark:bg-[#1a2030] rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Ngân hàng thụ hưởng</p>
                                <p className="font-black text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                                    <Landmark className="h-4 w-4 text-blue-600" /> {BANK_INFO.bankName}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{BANK_INFO.bankFullName}</p>
                            </div>
                        </div>

                        {/* Số tài khoản */}
                        <div className="flex items-center justify-between bg-white dark:bg-[#1a2030] rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Số tài khoản</p>
                                <p className="font-black text-lg sm:text-xl text-blue-600 dark:text-blue-400 tracking-widest font-mono">
                                    {BANK_INFO.accountNumber}
                                </p>
                            </div>
                            <CopyButton text={BANK_INFO.accountNumber} />
                        </div>

                        {/* Chủ tài khoản */}
                        <div className="flex items-center justify-between bg-white dark:bg-[#1a2030] rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 shadow-sm">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Chủ tài khoản</p>
                                <p className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-200 uppercase">
                                    {BANK_INFO.accountName}
                                </p>
                            </div>
                        </div>

                        {/* Số tiền */}
                        <div className="flex items-center justify-between bg-blue-50/80 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/80 px-4 py-3 shadow-sm">
                            <div>
                                <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5">Số tiền thanh toán</p>
                                <p className="font-black text-lg sm:text-xl text-slate-900 dark:text-white">
                                    {formatVND(amount)}
                                </p>
                            </div>
                            {amount > 0 && <CopyButton text={Math.round(amount).toString()} label="Chép số tiền" />}
                        </div>

                        {/* Nội dung chuyển khoản */}
                        <div className="flex items-center justify-between bg-amber-50/80 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/80 px-4 py-3 shadow-sm">
                            <div>
                                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-0.5">Nội dung chuyển khoản (Bắt buộc)</p>
                                <p className="font-black text-sm sm:text-base text-amber-950 dark:text-amber-200 font-mono tracking-wider">
                                    {transferContent}
                                </p>
                            </div>
                            <CopyButton text={transferContent} label="Chép cú pháp" />
                        </div>
                    </div>
                </div>

                {/* Auto status check bar */}
                <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 bg-blue-100/50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl p-3.5">
                    <div className="flex items-center gap-2.5 text-xs text-blue-800 dark:text-blue-300">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                        </span>
                        <span>Đang tự động lắng nghe biến động số dư từ <strong>SePay / MBBank</strong>...</span>
                    </div>

                    <button
                        type="button"
                        onClick={checkPaymentStatus}
                        disabled={checking}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`} />
                        {checking ? "Đang kiểm tra..." : "Tôi đã chuyển tiền"}
                    </button>
                </div>

                {/* Warning note */}
                <div className="mt-4 flex gap-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3.5">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-0.5">Lưu ý quan trọng</p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                            Sau khi bạn chuyển khoản thành công, hệ thống SePay sẽ tự động nhận diện trong vòng <strong>1–5 giây</strong> và tự động chuyển màn hình sang trạng thái hoàn tất!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SuccessPaidBox({ orderId, amount }: { orderId: string | null; amount: number }) {
    const shortId = orderId ? orderId.slice(0, 8).toUpperCase() : "N/A";

    return (
        <div className="mt-6 rounded-2xl border-2 border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-b from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-[#0f1722] p-6 text-center animate-in fade-in zoom-in-95 duration-500 shadow-md">
            <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="h-9 w-9" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" /> Thanh toán tự động SePay thành công
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mb-1">
                Đã Nhận {formatVND(amount)}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
                Hệ thống SePay đã xác nhận giao dịch chuyển khoản cho đơn hàng <strong>#{shortId}</strong>. Đơn hàng đang được kỹ thuật viên chuẩn bị đóng gói!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left bg-white dark:bg-[#1a2030] p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-xs">
                <div className="flex items-center gap-2.5">
                    <Truck className="h-4 w-4 text-emerald-600" />
                    <div>
                        <p className="text-slate-400">Giao hàng dự kiến</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">1 – 3 ngày làm việc</p>
                    </div>
                </div>
                <div className="flex items-center gap-2.5">
                    <Package className="h-4 w-4 text-emerald-600" />
                    <div>
                        <p className="text-slate-400">Trạng thái đơn hàng</p>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">Đang xử lý xuất kho</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams?.get('orderId');
    const method = searchParams?.get('method');
    const amountParam = searchParams?.get('amount');
    const parsedAmount = amountParam ? parseFloat(amountParam) : 0;

    const [amount, setAmount] = useState<number>(parsedAmount);
    const [isPaid, setIsPaid] = useState(false);
    const [trackingNumber, setTrackingNumber] = useState<string | null>(null);

    const isCOD = method === 'cod';
    const isQR = method === 'qr';

    // 1. Fetch order details & initial payment status
    const loadOrder = useCallback(async () => {
        if (!orderId) return;
        try {
            const supabase = createClient();
            const { data } = await supabase
                .from('orders')
                .select('total_amount, payment_status, status, tracking_number')
                .eq('id', orderId)
                .maybeSingle();

            if (data) {
                if (data.total_amount) setAmount(data.total_amount);
                if (data.tracking_number) setTrackingNumber(data.tracking_number);
                if (data.payment_status === 'paid') {
                    setIsPaid(true);
                }
            }
        } catch (e) {
            console.error("Error loading order in success page:", e);
        }
    }, [orderId]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    // 2. Realtime auto-polling & Supabase subscription for SePay webhook detection
    useEffect(() => {
        if (!orderId || isPaid || isCOD) return;

        // Auto polling every 2.5s
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/orders/${orderId}/status`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.isPaid) {
                        setIsPaid(true);
                        clearInterval(interval);
                    }
                }
            } catch {
                // Ignore polling errors
            }
        }, 2500);

        // Supabase Realtime channel
        const supabase = createClient();
        const channel = supabase
            .channel(`order-${orderId}`)
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
                (payload) => {
                    if (payload.new && (payload.new as any).payment_status === 'paid') {
                        setIsPaid(true);
                    }
                }
            )
            .subscribe();

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [orderId, isPaid, isCOD]);

    return (
        <div className="w-full max-w-xl lg:max-w-4xl xl:max-w-5xl bg-white dark:bg-[#121624] rounded-3xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
            {/* Header */}
            <div className={`px-8 py-10 text-center relative overflow-hidden transition-colors duration-500 ${isPaid || (!isQR && !isCOD)
                ? 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700'
                : isQR
                    ? 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700'
                    : 'bg-gradient-to-br from-amber-500 via-orange-600 to-red-600'
                }`}>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent mix-blend-overlay" />
                <div className="relative z-10">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-5 backdrop-blur-sm border border-white/30 shadow-xl">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-inner">
                            {isPaid || (!isQR && !isCOD) ? (
                                <CheckCircle2 className="h-8 w-8 text-emerald-600 animate-in zoom-in duration-300" />
                            ) : isQR ? (
                                <QrCode className="h-7 w-7 sm:h-8 sm:w-8 text-blue-600" />
                            ) : (
                                <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-orange-600" />
                            )}
                        </div>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight drop-shadow-sm">
                        {isPaid
                            ? 'Thanh Toán Thành Công!'
                            : isQR
                                ? 'Đơn Hàng Đã Ghi Nhận!'
                                : 'Đặt Hàng Thành Công!'}
                    </h1>
                    <p className="text-white/90 text-sm font-medium max-w-md mx-auto">
                        {isPaid
                            ? 'Cảm ơn bạn! Đơn hàng đã được thanh toán và xác nhận tự động.'
                            : isQR
                                ? 'Vui lòng quét mã QR bên dưới để thanh toán chuyển khoản'
                                : 'Cảm ơn bạn đã tin tưởng và mua sắm thiết bị tại TELECTRIC'}
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
                {/* Order info summary */}
                <div className="bg-slate-50 dark:bg-[#191f30] rounded-2xl p-5 border border-slate-200/70 dark:border-slate-800 mb-4 shadow-sm">
                    <div className="flex items-center gap-2.5 mb-4">
                        <Receipt className="h-5 w-5 text-electric-orange" />
                        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base">Thông tin đơn hàng</h3>
                    </div>
                    <div className="space-y-3">
                        {orderId && (
                            <div className="flex justify-between items-center py-2 border-b border-slate-200/60 dark:border-slate-800">
                                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Mã đơn hàng</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white bg-white dark:bg-[#121624] px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm text-sm">
                                    #{trackingNumber || orderId.slice(0, 8).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-slate-200/60 dark:border-slate-800">
                            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Trạng thái thanh toán</span>
                            {isPaid ? (
                                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 animate-in fade-in duration-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Đã thanh toán (SePay)
                                </span>
                            ) : isCOD ? (
                                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-900/50">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                    Thanh toán khi nhận hàng
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    Chờ chuyển khoản
                                </span>
                            )}
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Phương thức</span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                {isCOD ? 'Thanh toán tiền mặt (COD)' : 'Chuyển khoản SePay / MBBank'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Conditional View: QR Panel vs Paid Success Box */}
                {isQR && !isPaid && (
                    <QRPaymentPanel
                        orderId={orderId ?? ""}
                        amount={amount}
                        onPaymentSuccess={() => setIsPaid(true)}
                    />
                )}

                {isPaid && (
                    <SuccessPaidBox orderId={orderId ?? ""} amount={amount} />
                )}

                {/* COD Message */}
                {isCOD && (
                    <p className="text-center text-slate-500 dark:text-slate-400 text-sm my-6 leading-relaxed px-4">
                        Chúng tôi sẽ sớm liên hệ qua số điện thoại để xác nhận đơn hàng và tiến hành đóng gói vận chuyển.
                    </p>
                )}

                {/* CTA Buttons */}
                <div className={`flex flex-col sm:flex-row gap-3 ${isQR ? 'mt-7' : 'mt-4'}`}>
                    <Link
                        href="/"
                        className="flex-1 flex items-center justify-center gap-2 h-12 px-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 group"
                    >
                        <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
                        Về trang chủ
                    </Link>
                    <Link
                        href="/products"
                        className="flex-1 flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-electric-orange text-white font-bold text-sm hover:bg-orange-600 shadow-lg shadow-orange-600/20 transition-all active:scale-95 group"
                    >
                        Tiếp tục mua sắm
                        <ChevronRight className="h-4 w-4 opacity-80 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <div className="min-h-screen bg-slate-100 dark:bg-[#0a0d16] flex items-start justify-center pt-8 pb-16 px-4 sm:px-6 lg:px-12 xl:px-16 transition-colors">
            <Suspense fallback={
                <div className="flex flex-col items-center gap-4 mt-20">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-slate-500 font-medium">Đang tải dữ liệu...</span>
                </div>
            }>
                <SuccessContent />
            </Suspense>
        </div>
    );
}
