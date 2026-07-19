'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Plus,
    Search,
    Edit3,
    Trash2,
    X,
    Save,
    ShieldCheck,
    Phone,
    User,
    Package,
    Hash,
    Calendar,
    Clock,
    FileText,
    Loader2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Filter,
    RefreshCw,
    History,
    ChevronDown,
    ChevronUp,
    AlertCircle
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
    updated_at: string
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

type FormData = {
    customer_phone: string
    customer_name: string
    product_name: string
    serial_number: string
    purchase_date: string
    warranty_months: number
    note: string
    status: string
}

type HistoryFormData = {
    issue_description: string
    repair_action: string
    repair_status: string
}

const emptyForm: FormData = {
    customer_phone: '',
    customer_name: '',
    product_name: '',
    serial_number: '',
    purchase_date: new Date().toISOString().split('T')[0],
    warranty_months: 12,
    note: '',
    status: 'active',
}

function calcExpiryDate(purchaseDate: string, warrantyMonths: number): string {
    if (!purchaseDate || !warrantyMonths) return ''
    const d = new Date(purchaseDate)
    d.setMonth(d.getMonth() + warrantyMonths)
    return d.toISOString().split('T')[0]
}

const emptyHistoryForm: HistoryFormData = {
    issue_description: '',
    repair_action: '',
    repair_status: 'received',
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; dot: string }> = {
    active: { label: 'Còn BH', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20', icon: <CheckCircle2 size={14} />, dot: 'bg-emerald-500' },
    expired: { label: 'Hết hạn', color: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-500/20', icon: <XCircle size={14} />, dot: 'bg-red-500' },
    voided: { label: 'Đã huỷ', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-500/20', icon: <AlertTriangle size={14} />, dot: 'bg-amber-500' },
}

const repairStatusOptions = [
    { value: 'received', label: 'Đã tiếp nhận' },
    { value: 'processing', label: 'Đang xử lý' },
    { value: 'done', label: 'Hoàn tất' },
    { value: 'returned', label: 'Đã trả khách' },
]

const PAGE_SIZE = 10

export default function AdminWarrantyPage() {
    const [cards, setCards] = useState<WarrantyCard[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [page, setPage] = useState(0)
    const [totalCount, setTotalCount] = useState(0)

    // Modal state
    const [showModal, setShowModal] = useState(false)
    const [editingCard, setEditingCard] = useState<WarrantyCard | null>(null)
    const [formData, setFormData] = useState<FormData>(emptyForm)

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    // History
    const [expandedCard, setExpandedCard] = useState<string | null>(null)
    const [histories, setHistories] = useState<Record<string, WarrantyHistory[]>>({})
    const [showHistoryForm, setShowHistoryForm] = useState<string | null>(null)
    const [historyForm, setHistoryForm] = useState<HistoryFormData>(emptyHistoryForm)
    const [savingHistory, setSavingHistory] = useState(false)

    // Edit history
    const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null)
    const [editHistoryForm, setEditHistoryForm] = useState<HistoryFormData>(emptyHistoryForm)

    const supabase = createClient()

    const fetchCards = useCallback(async () => {
        setLoading(true)
        let query = supabase
            .from('warranty_cards')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

        if (searchQuery.trim()) {
            const q = searchQuery.trim()
            query = query.or(`customer_phone.ilike.%${q}%,customer_name.ilike.%${q}%,product_name.ilike.%${q}%,serial_number.ilike.%${q}%`)
        }

        if (statusFilter !== 'all') {
            query = query.eq('status', statusFilter)
        }

        const { data, error, count } = await query

        if (!error && data) {
            setCards(data)
            setTotalCount(count || 0)
        }
        setLoading(false)
    }, [page, searchQuery, statusFilter])

    useEffect(() => {
        fetchCards()
    }, [fetchCards])

    // Computed expiry date (auto-calculated, not stored in form)
    const computedExpiryDate = calcExpiryDate(formData.purchase_date, formData.warranty_months)

    const openCreate = () => {
        setEditingCard(null)
        setFormData(emptyForm)
        setShowModal(true)
    }

    const openEdit = (card: WarrantyCard) => {
        setEditingCard(card)
        setFormData({
            customer_phone: card.customer_phone,
            customer_name: card.customer_name || '',
            product_name: card.product_name,
            serial_number: card.serial_number || '',
            purchase_date: card.purchase_date,
            warranty_months: card.warranty_months,
            note: card.note || '',
            status: card.status,
        })
        setShowModal(true)
    }

    const handleSave = async () => {
        if (!formData.customer_phone.trim() || !formData.product_name.trim() || !computedExpiryDate) return
        setSaving(true)

        const payload = {
            customer_phone: formData.customer_phone.replace(/\s/g, ''),
            customer_name: formData.customer_name || null,
            product_name: formData.product_name,
            serial_number: formData.serial_number || null,
            purchase_date: formData.purchase_date,
            warranty_months: formData.warranty_months,
            expiry_date: computedExpiryDate,
            note: formData.note || null,
            status: formData.status,
            updated_at: new Date().toISOString(),
        }

        if (editingCard) {
            await supabase.from('warranty_cards').update(payload).eq('id', editingCard.id)
        } else {
            await supabase.from('warranty_cards').insert(payload)
        }

        setSaving(false)
        setShowModal(false)
        fetchCards()
    }

    const handleDelete = async (id: string) => {
        await supabase.from('warranty_cards').delete().eq('id', id)
        setDeleteConfirm(null)
        fetchCards()
    }

    const loadHistory = async (cardId: string) => {
        if (expandedCard === cardId) {
            setExpandedCard(null)
            return
        }
        setExpandedCard(cardId)
        setShowHistoryForm(null)

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

    const handleSaveHistory = async (cardId: string) => {
        if (!historyForm.issue_description.trim()) return
        setSavingHistory(true)

        await supabase.from('warranty_history').insert({
            warranty_card_id: cardId,
            issue_description: historyForm.issue_description,
            repair_action: historyForm.repair_action || null,
            repair_status: historyForm.repair_status,
        })

        // Refresh history
        const { data } = await supabase
            .from('warranty_history')
            .select('*')
            .eq('warranty_card_id', cardId)
            .order('request_date', { ascending: false })

        if (data) {
            setHistories(prev => ({ ...prev, [cardId]: data }))
        }

        setHistoryForm(emptyHistoryForm)
        setShowHistoryForm(null)
        setSavingHistory(false)
    }

    const startEditHistory = (h: WarrantyHistory) => {
        setEditingHistoryId(h.id)
        setEditHistoryForm({
            issue_description: h.issue_description || '',
            repair_action: h.repair_action || '',
            repair_status: h.repair_status,
        })
    }

    const handleUpdateHistory = async (historyId: string, cardId: string) => {
        if (!editHistoryForm.issue_description.trim()) return
        setSavingHistory(true)

        await supabase.from('warranty_history').update({
            issue_description: editHistoryForm.issue_description,
            repair_action: editHistoryForm.repair_action || null,
            repair_status: editHistoryForm.repair_status,
        }).eq('id', historyId)

        // Refresh history
        const { data } = await supabase
            .from('warranty_history')
            .select('*')
            .eq('warranty_card_id', cardId)
            .order('request_date', { ascending: false })

        if (data) {
            setHistories(prev => ({ ...prev, [cardId]: data }))
        }

        setEditingHistoryId(null)
        setEditHistoryForm(emptyHistoryForm)
        setSavingHistory(false)
    }

    const deleteHistory = async (historyId: string, cardId: string) => {
        await supabase.from('warranty_history').delete().eq('id', historyId)

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

    const totalPages = Math.ceil(totalCount / PAGE_SIZE)

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-none">
                            <ShieldCheck size={22} className="text-white" />
                        </div>
                        Quản lý Bảo hành
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Thêm, sửa, xoá thẻ bảo hành sản phẩm</p>
                </div>
                <button
                    id="btn-create-warranty"
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-300 shadow-lg shadow-orange-200 dark:shadow-none active:scale-95"
                >
                    <Plus size={18} />
                    Thêm thẻ bảo hành
                </button>
            </div>

            {/* Search & Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        id="admin-warranty-search"
                        type="text"
                        placeholder="Tìm theo SĐT, tên, sản phẩm, serial..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                            id="admin-warranty-filter"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(0) }}
                            className="pl-8 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 appearance-none cursor-pointer"
                        >
                            <option value="all">Tất cả</option>
                            <option value="active">Còn BH</option>
                            <option value="expired">Hết hạn</option>
                            <option value="voided">Đã huỷ</option>
                        </select>
                    </div>
                    <button
                        onClick={() => { fetchCards() }}
                        className="p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-slate-500 hover:text-orange-500 transition-colors"
                        title="Làm mới"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="p-12 flex flex-col items-center justify-center gap-3">
                        <Loader2 size={28} className="animate-spin text-orange-500" />
                        <p className="text-slate-400 text-sm">Đang tải dữ liệu...</p>
                    </div>
                ) : cards.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShieldCheck size={28} className="text-slate-300 dark:text-slate-500" />
                        </div>
                        <h3 className="text-slate-600 dark:text-slate-300 font-semibold mb-1">Không có dữ liệu</h3>
                        <p className="text-slate-400 text-sm">Chưa có thẻ bảo hành nào. Hãy thêm mới!</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                                    <th className="text-left py-3.5 px-4 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">Khách hàng</th>
                                    <th className="text-left py-3.5 px-4 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">Sản phẩm</th>
                                    <th className="text-left py-3.5 px-4 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider hidden lg:table-cell">Serial</th>
                                    <th className="text-left py-3.5 px-4 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Ngày mua</th>
                                    <th className="text-left py-3.5 px-4 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider hidden md:table-cell">Hết hạn</th>
                                    <th className="text-left py-3.5 px-4 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">Trạng thái</th>
                                    <th className="text-right py-3.5 px-4 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                                {cards.map((card) => {
                                    const status = statusConfig[card.status] || statusConfig.active
                                    const isExpanded = expandedCard === card.id
                                    const cardHistories = histories[card.id] || []

                                    return (
                                        <React.Fragment key={card.id}>
                                            <tr className="hover:bg-orange-50/30 dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <div>
                                                        <p className="font-medium text-slate-800 dark:text-white">{card.customer_name || '—'}</p>
                                                        <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                                                            <Phone size={10} />
                                                            {card.customer_phone}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <p className="text-slate-700 dark:text-slate-200 font-medium">{card.product_name}</p>
                                                </td>
                                                <td className="py-3.5 px-4 hidden lg:table-cell">
                                                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{card.serial_number || '—'}</span>
                                                </td>
                                                <td className="py-3.5 px-4 hidden md:table-cell">
                                                    <span className="text-slate-500 dark:text-slate-400 text-xs">{formatDate(card.purchase_date)}</span>
                                                </td>
                                                <td className="py-3.5 px-4 hidden md:table-cell">
                                                    <span className="text-slate-500 dark:text-slate-400 text-xs">{formatDate(card.expiry_date)}</span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${status.color}`}>
                                                        {status.icon}
                                                        {status.label}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => loadHistory(card.id)}
                                                            className={`p-2 rounded-lg transition-colors ${isExpanded ? 'bg-orange-100 text-orange-600 dark:bg-orange-500/10' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10'}`}
                                                            title="Lịch sử BH"
                                                        >
                                                            <History size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => openEdit(card)}
                                                            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors"
                                                            title="Sửa"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        {deleteConfirm === card.id ? (
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() => handleDelete(card.id)}
                                                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-xs font-semibold"
                                                                >
                                                                    Xoá
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteConfirm(null)}
                                                                    className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setDeleteConfirm(card.id)}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                                title="Xoá"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Expanded history rows */}
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan={7} className="p-0">
                                                        <div className="bg-slate-50/80 dark:bg-slate-900/50 border-y border-orange-100 dark:border-orange-500/10 px-6 py-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                                                    <History size={16} className="text-orange-500" />
                                                                    Lịch sử bảo hành — {card.product_name}
                                                                </h4>
                                                                <button
                                                                    onClick={() => {
                                                                        setShowHistoryForm(showHistoryForm === card.id ? null : card.id)
                                                                        setHistoryForm(emptyHistoryForm)
                                                                    }}
                                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                                                                >
                                                                    <Plus size={14} />
                                                                    Thêm lịch sử
                                                                </button>
                                                            </div>

                                                            {/* History add form */}
                                                            {showHistoryForm === card.id && (
                                                                <div className="mb-4 p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl space-y-3">
                                                                    <div>
                                                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Mô tả vấn đề *</label>
                                                                        <textarea
                                                                            value={historyForm.issue_description}
                                                                            onChange={e => setHistoryForm(prev => ({ ...prev, issue_description: e.target.value }))}
                                                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none"
                                                                            rows={2}
                                                                            placeholder="Mô tả lỗi / vấn đề của sản phẩm"
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Hành động xử lý</label>
                                                                        <textarea
                                                                            value={historyForm.repair_action}
                                                                            onChange={e => setHistoryForm(prev => ({ ...prev, repair_action: e.target.value }))}
                                                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none"
                                                                            rows={2}
                                                                            placeholder="Cách xử lý: thay thế linh kiện, sửa chữa..."
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Trạng thái</label>
                                                                        <select
                                                                            value={historyForm.repair_status}
                                                                            onChange={e => setHistoryForm(prev => ({ ...prev, repair_status: e.target.value }))}
                                                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                                                        >
                                                                            {repairStatusOptions.map(opt => (
                                                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div className="flex justify-end gap-2">
                                                                        <button
                                                                            onClick={() => setShowHistoryForm(null)}
                                                                            className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                                        >
                                                                            Huỷ
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleSaveHistory(card.id)}
                                                                            disabled={savingHistory || !historyForm.issue_description.trim()}
                                                                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                                                                        >
                                                                            {savingHistory ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                                            Lưu
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* History list */}
                                                            {cardHistories.length === 0 ? (
                                                                <p className="text-slate-400 text-sm text-center py-4">Chưa có lịch sử bảo hành</p>
                                                            ) : (
                                                                <div className="space-y-2">
                                                                    {cardHistories.map(h => {
                                                                        const repairOpt = repairStatusOptions.find(o => o.value === h.repair_status)
                                                                        const isEditing = editingHistoryId === h.id
                                                                        return (
                                                                            <div key={h.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 group overflow-hidden">
                                                                                {isEditing ? (
                                                                                    /* Inline edit form */
                                                                                    <div className="p-4 space-y-3 bg-orange-50/50 dark:bg-orange-500/5">
                                                                                        <div className="flex items-center gap-2 mb-1">
                                                                                            <Edit3 size={14} className="text-orange-500" />
                                                                                            <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">Chỉnh sửa lịch sử — {formatDate(h.request_date)}</span>
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Mô tả vấn đề *</label>
                                                                                            <textarea
                                                                                                value={editHistoryForm.issue_description}
                                                                                                onChange={e => setEditHistoryForm(prev => ({ ...prev, issue_description: e.target.value }))}
                                                                                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none"
                                                                                                rows={2}
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Hành động xử lý</label>
                                                                                            <textarea
                                                                                                value={editHistoryForm.repair_action}
                                                                                                onChange={e => setEditHistoryForm(prev => ({ ...prev, repair_action: e.target.value }))}
                                                                                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 resize-none"
                                                                                                rows={2}
                                                                                            />
                                                                                        </div>
                                                                                        <div>
                                                                                            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Trạng thái</label>
                                                                                            <select
                                                                                                value={editHistoryForm.repair_status}
                                                                                                onChange={e => setEditHistoryForm(prev => ({ ...prev, repair_status: e.target.value }))}
                                                                                                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                                                                            >
                                                                                                {repairStatusOptions.map(opt => (
                                                                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                                                ))}
                                                                                            </select>
                                                                                        </div>
                                                                                        <div className="flex justify-end gap-2">
                                                                                            <button
                                                                                                onClick={() => { setEditingHistoryId(null); setEditHistoryForm(emptyHistoryForm) }}
                                                                                                className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                                                            >
                                                                                                Huỷ
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => handleUpdateHistory(h.id, card.id)}
                                                                                                disabled={savingHistory || !editHistoryForm.issue_description.trim()}
                                                                                                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                                                                                            >
                                                                                                {savingHistory ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                                                                Lưu
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    /* Normal display */
                                                                                    <div className="flex items-start gap-3 p-3">
                                                                                        <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                                <span className="text-xs text-slate-400">{formatDate(h.request_date)}</span>
                                                                                                <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-medium">
                                                                                                    {repairOpt?.label || h.repair_status}
                                                                                                </span>
                                                                                            </div>
                                                                                            {h.issue_description && <p className="text-sm text-slate-600 dark:text-slate-300">{h.issue_description}</p>}
                                                                                            {h.repair_action && <p className="text-sm text-slate-400 mt-0.5">→ {h.repair_action}</p>}
                                                                                        </div>
                                                                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                                                            <button
                                                                                                onClick={() => startEditHistory(h)}
                                                                                                className="p-1 text-slate-300 hover:text-orange-500 transition-colors"
                                                                                                title="Sửa"
                                                                                            >
                                                                                                <Edit3 size={14} />
                                                                                            </button>
                                                                                            <button
                                                                                                onClick={() => deleteHistory(h.id, card.id)}
                                                                                                className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                                                                                                title="Xoá"
                                                                                            >
                                                                                                <Trash2 size={14} />
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-slate-700">
                        <span className="text-xs text-slate-400">
                            Hiển thị {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} / {totalCount}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                disabled={page === 0}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-300 font-medium">
                                {page + 1} / {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={page >= totalPages - 1}
                                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* CREATE / EDIT Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)} />

                    {/* Modal content */}
                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-slate-700">
                        {/* Modal header */}
                        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <ShieldCheck size={20} className="text-orange-500" />
                                {editingCard ? 'Sửa thẻ bảo hành' : 'Thêm thẻ bảo hành'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form body */}
                        <div className="p-6 space-y-5">
                            {/* Customer info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        <Phone size={14} className="text-slate-400" />
                                        Số điện thoại <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="form-customer-phone"
                                        type="tel"
                                        value={formData.customer_phone}
                                        onChange={e => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all"
                                        placeholder="0901234567"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        <User size={14} className="text-slate-400" />
                                        Tên khách hàng
                                    </label>
                                    <input
                                        id="form-customer-name"
                                        type="text"
                                        value={formData.customer_name}
                                        onChange={e => setFormData(prev => ({ ...prev, customer_name: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all"
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>
                            </div>

                            {/* Product info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        <Package size={14} className="text-slate-400" />
                                        Sản phẩm <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="form-product-name"
                                        type="text"
                                        value={formData.product_name}
                                        onChange={e => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all"
                                        placeholder="Ampe kìm Hioki CM4375"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        <Hash size={14} className="text-slate-400" />
                                        Số Serial
                                    </label>
                                    <input
                                        id="form-serial"
                                        type="text"
                                        value={formData.serial_number}
                                        onChange={e => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all font-mono"
                                        placeholder="SN-20250213-001"
                                    />
                                </div>
                            </div>

                            {/* Warranty period */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        <Calendar size={14} className="text-slate-400" />
                                        Ngày mua
                                    </label>
                                    <input
                                        id="form-purchase-date"
                                        type="date"
                                        value={formData.purchase_date}
                                        onChange={e => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        <Clock size={14} className="text-slate-400" />
                                        Thời hạn (tháng)
                                    </label>
                                    <input
                                        id="form-warranty-months"
                                        type="number"
                                        min={1}
                                        value={formData.warranty_months}
                                        onChange={e => setFormData(prev => ({ ...prev, warranty_months: parseInt(e.target.value) || 12 }))}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                        <Calendar size={14} className="text-slate-400" />
                                        Ngày hết hạn
                                    </label>
                                    <div className="w-full px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-sm font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                        <CheckCircle2 size={14} />
                                        {computedExpiryDate ? new Date(computedExpiryDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                                        <AlertCircle size={10} />
                                        Tự động tính từ ngày mua + thời hạn
                                    </p>
                                </div>
                            </div>

                            {/* Status */}
                            {editingCard && (
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">Trạng thái</label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(statusConfig).map(([key, config]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, status: key }))}
                                                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${formData.status === key
                                                    ? `${config.color} ring-2 ring-offset-1 ring-current/20`
                                                    : 'bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-slate-500'
                                                    }`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                                                {config.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Note */}
                            <div>
                                <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                                    <FileText size={14} className="text-slate-400" />
                                    Ghi chú
                                </label>
                                <textarea
                                    id="form-note"
                                    value={formData.note}
                                    onChange={e => setFormData(prev => ({ ...prev, note: e.target.value }))}
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 transition-all resize-none"
                                    placeholder="Ghi chú thêm về sản phẩm / bảo hành..."
                                />
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="sticky bottom-0 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-5 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors font-medium"
                            >
                                Huỷ
                            </button>
                            <button
                                id="btn-save-warranty"
                                onClick={handleSave}
                                disabled={saving || !formData.customer_phone.trim() || !formData.product_name.trim() || !computedExpiryDate}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-200 dark:shadow-none active:scale-95"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                {editingCard ? 'Cập nhật' : 'Tạo mới'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
