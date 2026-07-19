'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
    Search,
    ShieldCheck,
    Phone,
    Calendar,
    Package,
    Clock,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ArrowLeft,
    Loader2,
    Sparkles,
    History,
    Hash,
    ChevronDown,
    ChevronUp
} from 'lucide-react'

type WarrantyCard = {
    id: string
    customer_phone: string
    customer_name: string | null
    product_name: string
    serial_number: string | null
    purchase_date: string
    warranty_months: number
    expiry_date: string
    note: string | null
    status: string
    created_at: string
}

type WarrantyHistory = {
    id: string
    warranty_card_id: string
    request_date: string
    issue_description: string | null
    repair_action: string | null
    repair_status: string
    created_at: string
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
    active: {
        label: 'Còn bảo hành',
        color: 'text-emerald-400',
        icon: <CheckCircle2 size={18} />,
        bg: 'bg-emerald-500/10 border-emerald-500/20'
    },
    expired: {
        label: 'Hết hạn',
        color: 'text-red-400',
        icon: <XCircle size={18} />,
        bg: 'bg-red-500/10 border-red-500/20'
    },
    voided: {
        label: 'Đã huỷ',
        color: 'text-amber-400',
        icon: <AlertTriangle size={18} />,
        bg: 'bg-amber-500/10 border-amber-500/20'
    },
}

const repairStatusConfig: Record<string, { label: string; color: string }> = {
    received: { label: 'Đã tiếp nhận', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    processing: { label: 'Đang xử lý', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    done: { label: 'Hoàn tất', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    returned: { label: 'Đã trả khách', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
}

export default function WarrantyCheckPage() {
    const [phone, setPhone] = useState('')
    const [results, setResults] = useState<WarrantyCard[]>([])
    const [histories, setHistories] = useState<Record<string, WarrantyHistory[]>>({})
    const [loading, setLoading] = useState(false)
    const [searched, setSearched] = useState(false)
    const [expandedCard, setExpandedCard] = useState<string | null>(null)

    const supabase = createClient()

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!phone.trim()) return

        setLoading(true)
        setSearched(true)
        setExpandedCard(null)
        setHistories({})

        const cleanPhone = phone.replace(/\s/g, '')
        const { data, error } = await supabase
            .from('warranty_cards')
            .select('*')
            .eq('customer_phone', cleanPhone)
            .neq('status', 'voided')
            .order('created_at', { ascending: false })

        if (!error && data) {
            setResults(data)
        } else {
            setResults([])
        }
        setLoading(false)
    }

    const loadHistory = async (cardId: string) => {
        if (expandedCard === cardId) {
            setExpandedCard(null)
            return
        }
        setExpandedCard(cardId)

        if (histories[cardId]) return

        const { data } = await supabase
            .from('warranty_history')
            .select('*')
            .eq('warranty_card_id', cardId)
            .order('request_date', { ascending: false })

        if (data) {
            setHistories(prev => ({ ...prev, [cardId]: data }))
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        })
    }

    const getDaysRemaining = (expiryDate: string) => {
        const diff = new Date(expiryDate).getTime() - new Date().getTime()
        return Math.ceil(diff / (1000 * 60 * 60 * 24))
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/3 rounded-full blur-[150px]" />
                {/* Grid pattern */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
                        backgroundSize: '60px 60px'
                    }}
                />
            </div>

            {/* Header navigation */}
            <header className="relative z-10 border-b border-white/5">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Về trang chủ</span>
                    </Link>
                    <div className="flex items-center">
                        <img
                            src="/img/logo-telectric.png"
                            alt="TLECTRIC Logo"
                            className="h-24 w-auto object-contain"
                        />
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="relative z-10 max-w-4xl mx-auto px-4 py-12 md:py-20">
                {/* Hero */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-medium mb-6">
                        <Sparkles size={14} />
                        Tra cứu nhanh &amp; chính xác
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 font-heading tracking-tight">
                        Tra Cứu <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">Bảo Hành</span>
                    </h1>
                    <p className="text-white/40 text-lg max-w-md mx-auto leading-relaxed">
                        Nhập số điện thoại để kiểm tra thông tin bảo hành sản phẩm của bạn
                    </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleSearch} className="mb-12">
                    <div className="relative max-w-xl mx-auto group">
                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 rounded-2xl blur-lg opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />

                        <div className="relative flex items-center bg-white/[0.05] backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 group-focus-within:border-orange-500/30 group-focus-within:bg-white/[0.08]">
                            <div className="pl-5 text-white/30">
                                <Phone size={20} />
                            </div>
                            <input
                                id="warranty-phone-input"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Nhập số điện thoại (VD: 0901234567)"
                                className="flex-1 bg-transparent text-white placeholder:text-white/25 px-4 py-5 text-lg outline-none font-medium tracking-wide"
                            />
                            <button
                                id="warranty-search-btn"
                                type="submit"
                                disabled={loading || !phone.trim()}
                                className="m-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 active:scale-95"
                            >
                                {loading ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Search size={18} />
                                )}
                                <span className="hidden sm:inline">Tra cứu</span>
                            </button>
                        </div>
                    </div>
                </form>

                {/* Results */}
                {searched && !loading && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {results.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Search size={32} className="text-white/20" />
                                </div>
                                <h3 className="text-xl font-semibold text-white/60 mb-2">Không tìm thấy</h3>
                                <p className="text-white/30 max-w-sm mx-auto">
                                    Không có thẻ bảo hành nào liên kết với số điện thoại này. Vui lòng kiểm tra lại hoặc liên hệ TLECTRIC.
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                    <span className="text-white/30 text-sm font-medium">
                                        Tìm thấy {results.length} thẻ bảo hành
                                    </span>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                </div>

                                {results.map((card, index) => {
                                    const status = statusConfig[card.status] || statusConfig.active
                                    const daysRemaining = getDaysRemaining(card.expiry_date)
                                    const isExpanded = expandedCard === card.id
                                    const cardHistories = histories[card.id] || []

                                    return (
                                        <div
                                            key={card.id}
                                            className="group relative"
                                            style={{ animationDelay: `${index * 100}ms` }}
                                        >
                                            {/* Card glow */}
                                            <div className="absolute -inset-px bg-gradient-to-r from-orange-500/10 via-transparent to-amber-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                            <div className="relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/10 transition-all duration-500">
                                                {/* Status bar top */}
                                                <div className={`h-1 w-full ${card.status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : card.status === 'expired' ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`} />

                                                <div className="p-6 md:p-8">
                                                    {/* Header row */}
                                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl flex items-center justify-center border border-orange-500/10 flex-shrink-0">
                                                                <ShieldCheck size={24} className="text-orange-400" />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-white font-semibold text-lg leading-tight">{card.product_name}</h3>
                                                                {card.customer_name && (
                                                                    <p className="text-white/40 text-sm mt-1">Khách hàng: {card.customer_name}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${status.bg} ${status.color}`}>
                                                            {status.icon}
                                                            {status.label}
                                                        </div>
                                                    </div>

                                                    {/* Info grid */}
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                                        {card.serial_number && (
                                                            <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                                                <Hash size={16} className="text-white/20 flex-shrink-0" />
                                                                <div>
                                                                    <p className="text-white/30 text-xs uppercase tracking-wider">Serial</p>
                                                                    <p className="text-white/80 text-sm font-mono font-medium">{card.serial_number}</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                                            <Calendar size={16} className="text-white/20 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-white/30 text-xs uppercase tracking-wider">Ngày mua</p>
                                                                <p className="text-white/80 text-sm font-medium">{formatDate(card.purchase_date)}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                                            <Clock size={16} className="text-white/20 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-white/30 text-xs uppercase tracking-wider">Thời hạn</p>
                                                                <p className="text-white/80 text-sm font-medium">{card.warranty_months} tháng</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                                            <Package size={16} className="text-white/20 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-white/30 text-xs uppercase tracking-wider">Hết hạn</p>
                                                                <p className="text-white/80 text-sm font-medium">{formatDate(card.expiry_date)}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Days remaining bar */}
                                                    {card.status === 'active' && daysRemaining > 0 && (
                                                        <div className="mb-6">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="text-white/30 text-xs uppercase tracking-wider">Thời gian còn lại</span>
                                                                <span className="text-emerald-400 text-sm font-semibold">{daysRemaining} ngày</span>
                                                            </div>
                                                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-1000"
                                                                    style={{ width: `${Math.min(100, (daysRemaining / (card.warranty_months * 30)) * 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Note */}
                                                    {card.note && (
                                                        <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl mb-6">
                                                            <p className="text-amber-400/80 text-sm">{card.note}</p>
                                                        </div>
                                                    )}

                                                    {/* History toggle */}
                                                    <button
                                                        id={`toggle-history-${card.id}`}
                                                        onClick={() => loadHistory(card.id)}
                                                        className="w-full flex items-center justify-center gap-2 py-3 text-white/40 hover:text-orange-400 transition-colors text-sm font-medium border-t border-white/[0.04] -mb-6 -mx-6 md:-mx-8 px-6 md:px-8 mt-2 hover:bg-white/[0.02]"
                                                        style={{ width: 'calc(100% + 3rem)', marginLeft: '-1.5rem' }}
                                                    >
                                                        <History size={16} />
                                                        Lịch sử bảo hành
                                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </div>

                                                {/* History section */}
                                                {isExpanded && (
                                                    <div className="border-t border-white/[0.04] bg-white/[0.02] animate-in slide-in-from-top-2 duration-300">
                                                        {cardHistories.length === 0 ? (
                                                            <div className="p-8 text-center">
                                                                <p className="text-white/20 text-sm">Chưa có lịch sử bảo hành</p>
                                                            </div>
                                                        ) : (
                                                            <div className="p-6 md:p-8 space-y-4">
                                                                {cardHistories.map((h) => {
                                                                    const repairStatus = repairStatusConfig[h.repair_status] || repairStatusConfig.received
                                                                    return (
                                                                        <div key={h.id} className="flex gap-4 p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                                                                            <div className="w-2 h-2 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                                                                    <span className="text-white/50 text-xs">{formatDate(h.request_date)}</span>
                                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${repairStatus.color}`}>
                                                                                        {repairStatus.label}
                                                                                    </span>
                                                                                </div>
                                                                                {h.issue_description && (
                                                                                    <p className="text-white/60 text-sm mb-1"><span className="text-white/30">Vấn đề:</span> {h.issue_description}</p>
                                                                                )}
                                                                                {h.repair_action && (
                                                                                    <p className="text-white/60 text-sm"><span className="text-white/30">Xử lý:</span> {h.repair_action}</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && (
                    <div className="space-y-6">
                        {[1, 2].map(i => (
                            <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 animate-pulse">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-12 h-12 bg-white/5 rounded-xl" />
                                    <div className="flex-1">
                                        <div className="h-5 bg-white/5 rounded-lg w-48 mb-2" />
                                        <div className="h-4 bg-white/5 rounded-lg w-32" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[1, 2, 3, 4].map(j => (
                                        <div key={j} className="h-16 bg-white/5 rounded-xl" />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 mt-20">
                <div className="max-w-6xl mx-auto px-4 py-8 text-center">
                    <p className="text-white/20 text-sm">
                        © {new Date().getFullYear()} TLECTRIC — Thiết bị điện công nghiệp
                    </p>
                </div>
            </footer>
        </div>
    )
}
