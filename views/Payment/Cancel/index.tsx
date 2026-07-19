"use client";

import React, { Suspense } from 'react';
import Link from 'next/link';
import { XCircle, ChevronRight } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function CancelContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams?.get('orderId');

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
                <XCircle className="h-10 w-10 text-orange-600" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-2">Đã hủy thanh toán</h1>
            <p className="text-slate-500 mb-4">
                Bạn đã hủy quá trình thanh toán. Vui lòng kiểm tra lại đơn hàng hoặc chọn phương thức thanh toán khác.
            </p>
            {orderId && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-slate-700 font-medium">Mã đơn hàng</p>
                    <p className="text-lg font-mono font-black text-slate-600 mt-1">
                        #{orderId.slice(0, 8).toUpperCase()}
                    </p>
                </div>
            )}
            <div className="flex gap-3">
                <Link
                    href="/"
                    className="flex-1 flex items-center justify-center h-10 px-4 rounded-lg bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition"
                >
                    Về trang chủ
                </Link>
                <Link
                    href="/products"
                    className="flex-1 flex items-center justify-center gap-1 h-10 px-4 rounded-lg border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition"
                >
                    Mua sắm lại <ChevronRight className="h-4 w-4" />
                </Link>
            </div>
        </div>
    );
}

export default function PaymentCancelPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Suspense fallback={<div className="text-slate-500 text-sm">Đang tải...</div>}>
                <CancelContent />
            </Suspense>
        </div>
    );
}
