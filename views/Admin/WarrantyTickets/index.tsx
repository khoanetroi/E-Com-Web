'use client'

import React, { useEffect, useState } from 'react'
import { Loader2, RefreshCw, Sparkles, Ticket, Wand2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

type WarrantyTicket = {
  id: string
  customer_name: string | null
  customer_phone: string
  product_name: string | null
  serial_number: string | null
  issue_description: string
  status: string
  ai_diagnosis: string | null
  ai_temporary_advice: string | null
  ai_confidence: number | null
  admin_note: string | null
  created_at: string
}

export default function AdminWarrantyTicketsPage() {
  const [tickets, setTickets] = useState<WarrantyTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selected, setSelected] = useState<WarrantyTicket | null>(null)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchTickets = async (p = 1) => {
    setLoading(true)
    const res = await fetch(`/api/warranty-tickets?page=${p}&limit=10`, { credentials: 'include' })
    const json = await res.json()
    setTickets(json.data || [])
    setPage(json.page || 1)
    setTotalPages(json.totalPages || 1)
    setLoading(false)
  }

  useEffect(() => {
    fetchTickets(1)
  }, [])

  const analyzeTicket = async (ticketId: string) => {
    setProcessingId(ticketId)
    const res = await fetch(`/api/warranty-tickets/${ticketId}/analyze`, {
      method: 'POST',
      credentials: 'include',
    })

    const json = await res.json().catch(() => null)
    if (res.ok) {
      await fetchTickets(page)
      const ticket = json?.data?.ticket
      if (ticket) setSelected(ticket)
    }

    setProcessingId(null)
  }

  const updateStatus = async (ticketId: string, status: string) => {
    await fetch(`/api/warranty-tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    })
    await fetchTickets(page)
    if (selected?.id === ticketId) {
      setSelected(prev => prev ? { ...prev, status } : null)
    }
  }

  const deleteTicket = async (ticketId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa ticket này? Hành động này không thể hoàn tác.')) {
      return;
    }
    setDeletingId(ticketId);
    const res = await fetch(`/api/warranty-tickets/${ticketId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    
    if (res.ok) {
      if (selected?.id === ticketId) setSelected(null);
      await fetchTickets(page);
    } else {
      alert('Không thể xóa ticket. Có thể bạn không có quyền.');
    }
    setDeletingId(null);
  }

  const statusTranslations: Record<string, string> = {
    received: 'Đã tiếp nhận',
    processing: 'Đang xử lý',
    resolved: 'Đã xử lý',
    closed: 'Đóng ticket'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 text-xs font-semibold mb-3">
            <Ticket size={14} />
            Admin ticket
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Quản lý ticket lỗi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tiếp nhận ticket, phân tích bằng Gemini và phản hồi chẩn đoán sơ bộ.</p>
        </div>
        <button
          onClick={() => fetchTickets(page)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors"
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          {loading ? (
            <div className="py-16 flex items-center justify-center text-slate-400 gap-2"><Loader2 size={18} className="animate-spin" /> Đang tải...</div>
          ) : tickets.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">Chưa có ticket nào.</div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 flex-1">
                {tickets.map(ticket => (
                  <div key={ticket.id} className={`p-4 transition-colors ${selected?.id === ticket.id ? 'bg-orange-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-950/60'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="font-semibold text-slate-900 dark:text-white truncate">{ticket.product_name || 'Chưa rõ sản phẩm'}</span>
                          <StatusBadge status={ticket.status} />
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{ticket.issue_description}</p>
                        <div className="text-xs text-slate-400 mt-2">{ticket.customer_phone} {ticket.customer_name ? `· ${ticket.customer_name}` : ''}</div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                        <button
                          onClick={() => setSelected(ticket)}
                          className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:text-orange-600 whitespace-nowrap"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => deleteTicket(ticket.id)}
                          disabled={deletingId === ticket.id}
                          className="p-2 rounded-xl border border-red-200 dark:border-red-900/50 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                          title="Xóa ticket"
                        >
                          {deletingId === ticket.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    Trang {page} / {totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fetchTickets(page - 1)}
                      disabled={page <= 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-white dark:hover:bg-slate-800"
                    >
                      <ChevronLeft size={16} /> Trước
                    </button>
                    <button
                      onClick={() => fetchTickets(page + 1)}
                      disabled={page >= totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-white dark:hover:bg-slate-800"
                    >
                      Sau <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 p-6 space-y-4 h-fit sticky top-6">
          <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm">
            <Sparkles size={16} />
            Kết quả chẩn đoán
          </div>

          {!selected ? (
            <div className="text-sm text-white/60">Chọn một ticket để xem chi tiết và phản hồi AI.</div>
          ) : (
            <>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="text-sm text-white/50">Ticket</div>
                  <button
                    onClick={() => analyzeTicket(selected.id)}
                    disabled={processingId === selected.id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {processingId === selected.id ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                    Phân tích lại
                  </button>
                </div>
                <div className="font-semibold">{selected.product_name || 'Chưa rõ sản phẩm'}</div>
                <div className="text-sm text-white/70 whitespace-pre-line">{selected.issue_description}</div>
              </div>

              <ResultBlock title="Chẩn đoán sơ bộ" value={selected.ai_diagnosis || 'Chưa có kết quả AI. Hãy bấm Phân tích lại.'} />
              <ResultBlock title="Lời khuyên xử lý tạm thời" value={selected.ai_temporary_advice || 'Chưa có kết quả AI.'} />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/40 mb-1">Số điện thoại</div>
                  <div className="text-sm">{selected.customer_phone}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-wide text-white/40 mb-1">Mức tin cậy AI</div>
                  <div className="text-sm">{selected.ai_confidence ? `${Math.round(selected.ai_confidence * 100)}%` : 'Chưa có'}</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10 mt-4 pt-4">
                {['received', 'processing', 'resolved', 'closed'].map(status => (
                  <button
                    key={status}
                    onClick={() => updateStatus(selected.id, status)}
                    className={`px-3 py-2 rounded-xl border text-sm transition-colors ${selected.status === status ? 'border-orange-500/50 bg-orange-500/10 text-orange-300' : 'border-white/10 text-white/80 hover:bg-white/10'}`}
                  >
                    {statusTranslations[status] || status}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    new: { label: 'Mới', className: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
    received: { label: 'Đã tiếp nhận', className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' },
    analyzing: { label: 'Đang phân tích', className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' },
    processing: { label: 'Đang xử lý', className: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300' },
    resolved: { label: 'Đã xử lý', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' },
    closed: { label: 'Đã đóng', className: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
  }

  const item = map[status] || map.new
  return <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold ${item.className}`}>{item.label}</span>
}

function ResultBlock({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-wide text-white/40 mb-2">{title}</div>
      <div className="text-sm leading-relaxed whitespace-pre-line text-white/85">{value}</div>
    </div>
  )
}
