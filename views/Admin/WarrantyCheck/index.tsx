'use client'

import React, { useState, useEffect, useCallback } from 'react'
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
    Loader2,
    Hash,
    History,
    ChevronDown,
    ChevronUp,
    User,
    SearchCheck,
    FileText
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
    active: { label: 'Còn bảo hành', color: 'text-emerald-600 dark:text-emerald-400', icon: <CheckCircle2 size={16} />, bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' },
    expired: { label: 'Hết hạn', color: 'text-red-600 dark:text-red-400', icon: <XCircle size={16} />, bg: 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' },
    voided: { label: 'Đã huỷ', color: 'text-amber-600 dark:text-amber-400', icon: <AlertTriangle size={16} />, bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20' },
}

const repairStatusConfig: Record<string, { label: string; color: string }> = {
    received: { label: 'Đã tiếp nhận', color: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' },
    processing: { label: 'Đang xử lý', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
    done: { label: 'Hoàn tất', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' },
    returned: { label: 'Đã trả khách', color: 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400' },
}

export default function AdminWarrantyCheckPage() {
    const [phone, setPhone] = useState('')
    const [results, setResults] = useState<WarrantyCard[]>([])
    const [histories, setHistories] = useState<Record<string, WarrantyHistory[]>>({})
    const [loading, setLoading] = useState(true)
    const [searched, setSearched] = useState(false)
    const [expandedCard, setExpandedCard] = useState<string | null>(null)

    const supabase = createClient()

    // Load warranty cards that have history records on page mount
    const loadCardsWithHistory = useCallback(async () => {
        setLoading(true)

        // Get all warranty_history card IDs
        const { data: historyData } = await supabase
            .from('warranty_history')
            .select('warranty_card_id')

        const cardIds = [...new Set((historyData || []).map(h => h.warranty_card_id))]

        if (cardIds.length > 0) {
            const { data, error } = await supabase
                .from('warranty_cards')
                .select('*')
                .in('id', cardIds)
                .neq('status', 'voided')
                .order('created_at', { ascending: false })

            if (!error && data) {
                setResults(data)
            }
        } else {
            setResults([])
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        loadCardsWithHistory()
    }, [loadCardsWithHistory])

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!phone.trim()) {
            // If search is cleared, reload cards with history
            setSearched(false)
            loadCardsWithHistory()
            return
        }

        setLoading(true)
        setSearched(true)
        setExpandedCard(null)
        setHistories({})

        const cleanPhone = phone.replace(/\s/g, '')
        const { data, error } = await supabase
            .from('warranty_cards')
            .select('*')
            .or(`customer_phone.ilike.%${cleanPhone}%,customer_name.ilike.%${cleanPhone}%,serial_number.ilike.%${cleanPhone}%`)
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
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
                        <SearchCheck size={22} className="text-white" />
                    </div>
                    Tra cứu Bảo hành
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Tìm kiếm nhanh theo SĐT, tên khách hàng, hoặc serial</p>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch}>
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            id="admin-check-search"
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Nhập SĐT, tên, hoặc serial number..."
                            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !phone.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none active:scale-95"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                        Tra cứu
                    </button>
                </div>
            </form>

            {/* Results */}
            {!loading && (
                <div className="space-y-4">
                    {results.length === 0 ? (
                        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-12 text-center">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search size={28} className="text-slate-300 dark:text-slate-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 mb-1">
                                {searched ? 'Không tìm thấy' : 'Chưa có lịch sử bảo hành'}
                            </h3>
                            <p className="text-slate-400 text-sm">
                                {searched
                                    ? 'Không có thẻ bảo hành nào khớp với từ khoá tìm kiếm.'
                                    : 'Chưa có sản phẩm nào được ghi nhận lịch sử bảo hành.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {searched
                                    ? <>Tìm thấy <span className="font-semibold text-slate-700 dark:text-white">{results.length}</span> kết quả</>
                                    : <>Hiển thị <span className="font-semibold text-slate-700 dark:text-white">{results.length}</span> sản phẩm có lịch sử bảo hành</>
                                }
                            </p>

                            {results.map((card) => {
                                const status = statusConfig[card.status] || statusConfig.active
                                const daysRemaining = getDaysRemaining(card.expiry_date)
                                const isExpanded = expandedCard === card.id
                                const cardHistories = histories[card.id] || []

                                return (
                                    <div key={card.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                        {/* Status indicator bar */}
                                        <div className={`h-1 ${card.status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : card.status === 'expired' ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`} />

                                        <div className="p-6">
                                            {/* Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-11 h-11 bg-orange-50 dark:bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                                        <ShieldCheck size={22} className="text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-slate-800 dark:text-white">{card.product_name}</h3>
                                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                                                            {card.customer_name && (
                                                                <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                                    <User size={12} /> {card.customer_name}
                                                                </span>
                                                            )}
                                                            <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                                <Phone size={12} /> {card.customer_phone}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-semibold ${status.bg} ${status.color}`}>
                                                    {status.icon}
                                                    {status.label}
                                                </span>
                                            </div>

                                            {/* Details grid */}
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                                {card.serial_number && (
                                                    <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                                        <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1"><Hash size={10} />Serial</p>
                                                        <p className="text-sm font-mono font-medium text-slate-700 dark:text-slate-200">{card.serial_number}</p>
                                                    </div>
                                                )}
                                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1"><Calendar size={10} />Ngày mua</p>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatDate(card.purchase_date)}</p>
                                                </div>
                                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1"><Clock size={10} />Thời hạn</p>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{card.warranty_months} tháng</p>
                                                </div>
                                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1"><Calendar size={10} />Hết hạn</p>
                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatDate(card.expiry_date)}</p>
                                                </div>
                                            </div>

                                            {/* Days remaining */}
                                            {card.status === 'active' && daysRemaining > 0 && (
                                                <div className="mb-4">
                                                    <div className="flex justify-between items-center mb-1.5">
                                                        <span className="text-xs text-slate-400 uppercase tracking-wider">Còn lại</span>
                                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{daysRemaining} ngày</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                                                            style={{ width: `${Math.min(100, (daysRemaining / (card.warranty_months * 30)) * 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Note */}
                                            {card.note && (
                                                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-xl mb-4">
                                                    <FileText size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                                                    <p className="text-sm text-amber-700 dark:text-amber-400">{card.note}</p>
                                                </div>
                                            )}

                                            {/* Toggle history */}
                                            <button
                                                onClick={() => loadHistory(card.id)}
                                                className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            >
                                                <History size={16} />
                                                Lịch sử bảo hành ({cardHistories.length || '...'})
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                        </div>

                                        {/* History */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 p-6">
                                                {cardHistories.length === 0 ? (
                                                    <p className="text-slate-400 text-sm text-center py-4">Chưa có lịch sử bảo hành</p>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {cardHistories.map(h => {
                                                            const repairStatus = repairStatusConfig[h.repair_status] || repairStatusConfig.received
                                                            return (
                                                                <div key={h.id} className="flex items-start gap-3 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                                                                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1.5">
                                                                            <span className="text-xs text-slate-400">{formatDate(h.request_date)}</span>
                                                                            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${repairStatus.color}`}>
                                                                                {repairStatus.label}
                                                                            </span>
                                                                        </div>
                                                                        {h.issue_description && (
                                                                            <p className="text-sm text-slate-700 dark:text-slate-200 mb-0.5">
                                                                                <span className="text-slate-400 mr-1">Vấn đề:</span>{h.issue_description}
                                                                            </p>
                                                                        )}
                                                                        {h.repair_action && (
                                                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                                                <span className="text-slate-400 mr-1">Xử lý:</span>{h.repair_action}
                                                                            </p>
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
                                )
                            })}
                        </>
                    )}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="space-y-4">
                    {[1, 2].map(i => (
                        <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 animate-pulse">
                            <div className="flex items-start gap-3 mb-5">
                                <div className="w-11 h-11 bg-slate-100 dark:bg-slate-700 rounded-xl" />
                                <div className="flex-1">
                                    <div className="h-5 bg-slate-100 dark:bg-slate-700 rounded-lg w-48 mb-2" />
                                    <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-lg w-32" />
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {[1, 2, 3, 4].map(j => <div key={j} className="h-14 bg-slate-100 dark:bg-slate-700 rounded-xl" />)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
