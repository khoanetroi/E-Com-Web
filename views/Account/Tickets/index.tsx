'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, MessageSquarePlus, RefreshCw, Send, Ticket } from 'lucide-react'

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
  created_at: string
}

const emptyForm = {
  customer_name: '',
  customer_phone: '',
  product_name: '',
  serial_number: '',
  issue_description: '',
}

export default function AccountTicketsPage() {
  const supabase = useMemo(() => createClient(), [])
  const [tickets, setTickets] = useState<WarrantyTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState<string | null>(null)

  const fetchTickets = async () => {
    setLoading(true)
    const res = await fetch('/api/warranty-tickets', { credentials: 'include' })
    const json = await res.json()
    setTickets(json.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customer_phone.trim() || !form.issue_description.trim()) return

    setSaving(true)
    setMessage(null)

    const { data: authData } = await supabase.auth.getUser()
    const profileName = authData.user?.user_metadata?.full_name || authData.user?.user_metadata?.name || ''

    const res = await fetch('/api/warranty-tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        customer_name: form.customer_name || profileName || null,
        customer_phone: form.customer_phone,
        product_name: form.product_name || null,
        serial_number: form.serial_number || null,
        issue_description: form.issue_description,
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      setMessage(json.error || 'Không thể tạo ticket')
    } else {
      setMessage('Đã gửi ticket lỗi thành công')
      setForm(emptyForm)
      await fetchTickets()
    }

    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-col sm:flex-row">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 text-xs font-semibold mb-3">
            <MessageSquarePlus size={14} />
            Ticket báo lỗi
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gửi yêu cầu báo lỗi</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gửi mô tả lỗi để admin tiếp nhận và dùng AI chẩn đoán sơ bộ.</p>
        </div>
        <button
          onClick={fetchTickets}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors"
        >
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Họ tên" value={form.customer_name} onChange={(value) => setForm(prev => ({ ...prev, customer_name: value }))} placeholder="Nguyễn Văn A" />
            <Field label="Số điện thoại *" value={form.customer_phone} onChange={(value) => setForm(prev => ({ ...prev, customer_phone: value }))} placeholder="0901234567" />
            <Field label="Sản phẩm" value={form.product_name} onChange={(value) => setForm(prev => ({ ...prev, product_name: value }))} placeholder="Đồng hồ vạn năng" />
            <Field label="Serial number" value={form.serial_number} onChange={(value) => setForm(prev => ({ ...prev, serial_number: value }))} placeholder="SN-..." />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Mô tả lỗi *</label>
            <textarea
              value={form.issue_description}
              onChange={(e) => setForm(prev => ({ ...prev, issue_description: e.target.value }))}
              rows={6}
              placeholder="Ví dụ: Máy không lên nguồn sau khi cắm pin, màn hình chớp tắt..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
            />
          </div>

          {message && (
            <div className="text-sm rounded-xl px-4 py-3 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={saving || !form.customer_phone.trim() || !form.issue_description.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Gửi ticket
          </button>
        </form>

        <div className="bg-slate-950 text-white rounded-2xl p-6 border border-slate-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-orange-400 mb-4">
            <Ticket size={16} />
            Hướng dẫn cách viết Ticket
          </div>
          <ul className="space-y-3 text-sm text-white/70 leading-relaxed">
            <li>• Mô tả lỗi càng cụ thể càng tốt.</li>
            <li>• Có thể nhắc rõ hoàn cảnh: đang dùng, vừa sạc, vừa bật máy, v.v.</li>
            <li>• Số điện thoại và mô tả lỗi là bắt buộc.</li>
            <li>• Có thể tùy chọn sử dụng AI để nhận chẩn đoán sơ bộ và lời khuyên xử lý tạm thời.</li>
          </ul>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Ticket đã gửi</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Danh sách ticket lỗi của bạn</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex items-center justify-center text-slate-400 gap-2">
            <Loader2 size={18} className="animate-spin" /> Đang tải...
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            Chưa có ticket nào.
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div key={ticket.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{ticket.product_name || 'Ticket báo lỗi'}</span>
                      <StatusBadge status={ticket.status} />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{ticket.issue_description}</p>
                  </div>
                  <div className="text-xs text-slate-400 whitespace-nowrap">{new Date(ticket.created_at).toLocaleString('vi-VN')}</div>
                </div>

                {(ticket.ai_diagnosis || ticket.ai_temporary_advice) && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <InfoBox title="Chẩn đoán AI" value={ticket.ai_diagnosis || 'Đang chờ phân tích'} />
                    <InfoBox title="Xử lý tạm thời" value={ticket.ai_temporary_advice || 'Đang chờ phân tích'} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20"
      />
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

function InfoBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">{title}</div>
      <div className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">{value}</div>
    </div>
  )
}
