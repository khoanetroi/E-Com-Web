"use client";

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    CheckCircle, ChevronRight, ArrowLeft, Receipt,
    Copy, Check, QrCode, Smartphone, Clock, AlertCircle
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// Bank info — cập nhật theo thông tin thực tế
const BANK_INFO = {
    bankName: "VIB",
    bankFullName: "Ngân hàng Thương mại cổ phần Quốc tế Việt Nam",
    accountNumber: "028365284",
    accountName: "NGUYEN DAC TAI",
    branch: "Ngân hàng Quốc tế Việt Nam",
};

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-lg transition-all"
        >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Đã sao chép" : "Sao chép"}
        </button>
    );
}

function QRPaymentPanel({ orderId }: { orderId: string | null }) {
    const shortId = orderId ? orderId.slice(0, 8).toUpperCase() : "N/A";
    const transferContent = `TELECTRIC ${shortId}`;

    return (
        <div className="mt-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-b from-blue-50 to-white overflow-hidden">
            {/* Panel header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                    <QrCode className="h-5 w-5 text-white" />
                </div>
                <div>
                    <p className="font-black text-white text-[15px]">Thanh toán qua QR Code</p>
                    <p className="text-blue-100 text-xs font-medium">Quét bằng ứng dụng ngân hàng hoặc VNPay</p>
                </div>
            </div>

            <div className="p-5 sm:p-6">
                {/* QR Image + Bank Info — side by side on desktop */}
                <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
                    <div className="flex-shrink-0 flex flex-col items-center">
                        <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-2xl overflow-hidden border-4 border-white shadow-[0_12px_36px_rgba(37,99,235,0.15)] bg-white p-2">
                            <Image
                                src="/img/QR-ThanhToan.png"
                                alt="QR Code thanh toán TELECTRIC"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <p className="text-center text-sm text-blue-600 font-bold mt-3 flex items-center justify-center gap-2">
                            <Smartphone className="h-4 w-4" /> Quét bằng camera hoặc ứng dụng ngân hàng
                        </p>
                    </div>

                    {/* Bank info */}
                    <div className="w-full space-y-3">
                        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Ngân hàng</p>
                                <p className="font-black text-sm sm:text-base text-slate-900">{BANK_INFO.bankName}</p>
                                <p className="text-xs text-slate-500">{BANK_INFO.bankFullName}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Số tài khoản</p>
                                <p className="font-black text-lg sm:text-xl text-slate-900 tracking-widest font-mono">{BANK_INFO.accountNumber}</p>
                            </div>
                            <CopyButton text={BANK_INFO.accountNumber} />
                        </div>

                        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
                            <div>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Chủ tài khoản</p>
                                <p className="font-bold text-sm sm:text-base text-slate-800 uppercase">{BANK_INFO.accountName}</p>
                            </div>
                        </div>


                    </div>
                </div>

                {/* Warning note */}
                <div className="mt-4 flex gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
                    <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-amber-700 mb-0.5">Lưu ý quan trọng</p>
                        <p className="text-[11px] text-amber-600 leading-relaxed">
                            Sau khi chuyển khoản, chúng tôi sẽ xác nhận và xử lý đơn hàng trong vòng <strong>1–4 giờ</strong> (trong giờ hành chính).
                            Vui lòng giữ lại biên lai chuyển khoản để đối chiếu nếu cần.
                        </p>
                    </div>
                </div>

                {/* Timer hint */}
                <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Đơn hàng sẽ được giữ trong <strong className="text-slate-700 mx-1">24 giờ</strong> chờ xác nhận thanh toán.
                </div>
            </div>
        </div>
    );
}

function SuccessContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams?.get('orderId');
    const method = searchParams?.get('method');
    const isCOD = method === 'cod';
    const isQR = method === 'qr';

    return (
        <div className="w-full max-w-xl lg:max-w-4xl xl:max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            {/* Header */}
            <div className={`px-8 py-10 text-center relative overflow-hidden ${isQR
                ? 'bg-gradient-to-br from-blue-500 to-blue-700'
                : 'bg-gradient-to-br from-green-500 to-green-600'
                }`}>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent mix-blend-overlay" />
                <div className="relative z-10">
                    <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/30 shadow-xl">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-inner">
                            {isQR
                                ? <QrCode className="h-8 w-8 text-blue-500" />
                                : <CheckCircle className="h-8 w-8 text-green-500" />
                            }
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight drop-shadow-sm">
                        {isQR ? 'Đơn Hàng Đã Ghi Nhận!' : 'Đặt Hàng Thành Công!'}
                    </h1>
                    <p className="text-white/80 text-sm font-medium">
                        {isQR
                            ? 'Vui lòng hoàn tất thanh toán bằng QR bên dưới'
                            : 'Cảm ơn bạn đã tin tưởng và mua sắm tại TELECTRIC'
                        }
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
                {/* Order info */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 mb-4 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <Receipt className="h-5 w-5 text-slate-400" />
                        <h3 className="font-semibold text-slate-800">Thông tin đơn hàng</h3>
                    </div>
                    <div className="space-y-3">
                        {orderId && (
                            <div className="flex justify-between items-center py-2 border-b border-slate-200/60">
                                <span className="text-slate-500 text-sm font-medium">Mã đơn hàng</span>
                                <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">
                                    #{orderId.slice(0, 8).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-slate-200/60 last:border-0">
                            <span className="text-slate-500 text-sm font-medium">Trạng thái</span>
                            {isCOD ? (
                                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                    Chờ xử lý
                                </span>
                            ) : isQR ? (
                                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                    Chờ thanh toán
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    Đã thanh toán
                                </span>
                            )}
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-slate-500 text-sm font-medium">Phương thức</span>
                            <span className="text-xs font-semibold text-slate-600">
                                {isCOD ? 'Thanh toán khi nhận hàng (COD)' : isQR ? 'Chuyển khoản / QR Code' : 'Thanh toán online'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* QR Panel — only shown when method=qr */}
                {isQR && <QRPaymentPanel orderId={orderId ?? ""} />}

                {/* Message */}
                {!isQR && (
                    <p className="text-center text-slate-500 text-sm mb-6 leading-relaxed px-4">
                        {isCOD
                            ? "Chúng tôi sẽ sớm liên hệ để xác nhận đơn hàng và tiến hành giao hàng trong thời gian sớm nhất."
                            : "Thanh toán của bạn đã được ghi nhận. Chúng tôi sẽ tiến hành xử lý và giao hàng trong thời gian sớm nhất."}
                    </p>
                )}

                {/* CTA Buttons */}
                <div className={`flex flex-col sm:flex-row gap-3 ${isQR ? 'mt-6' : ''}`}>
                    <Link
                        href="/"
                        className="flex-1 flex items-center justify-center gap-2 h-12 px-6 rounded-xl border-2 border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 group"
                    >
                        <ArrowLeft className="h-4 w-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
                        Về trang chủ
                    </Link>
                    <Link
                        href="/products"
                        className="flex-1 flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 shadow-lg shadow-orange-600/20 transition-all active:scale-95 group"
                    >
                        Tiếp tục mua sắm
                        <ChevronRight className="h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function PaymentSuccessPage() {
    return (
        <div className="min-h-screen bg-slate-100 flex items-start justify-center pt-10 pb-16 px-4 sm:px-6 lg:px-12 xl:px-16">
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
