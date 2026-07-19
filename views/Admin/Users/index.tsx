'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Users,
    Search,
    Filter,
    RefreshCw,
    Loader2,
    ChevronLeft,
    ChevronRight,
    Shield,
    ShieldCheck,
    UserCircle,
    Mail,
    Globe,
    Calendar,
    Edit3,
    X,
    Save,
    Crown,
    UserCog,
    User,
    MoreHorizontal,
    ExternalLink,
    AtSign,
    CheckCircle2
} from 'lucide-react'

type Profile = {
    id: string
    username: string | null
    full_name: string | null
    avatar_url: string | null
    website: string | null
    email: string | null;
    role: 'user' | 'admin' | 'moderator';
    updated_at?: string | null;
}

const roleConfig: Record<string, { label: string; color: string; icon: React.ReactNode; dot: string; bg: string }> = {
    admin: {
        label: 'Admin',
        color: 'text-rose-700 dark:text-rose-400',
        icon: <Crown size={14} />,
        dot: 'bg-rose-500',
        bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
    },
    moderator: {
        label: 'Moderator',
        color: 'text-violet-700 dark:text-violet-400',
        icon: <ShieldCheck size={14} />,
        dot: 'bg-violet-500',
        bg: 'bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20'
    },
    user: {
        label: 'Người dùng',
        color: 'text-slate-600 dark:text-slate-400',
        icon: <User size={14} />,
        dot: 'bg-slate-400',
        bg: 'bg-slate-100 dark:bg-slate-500/10 border-slate-200 dark:border-slate-500/20'
    },
}

const PAGE_SIZE = 12

export default function AdminUsersPage() {
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [page, setPage] = useState(0)
    const [totalCount, setTotalCount] = useState(0)

    // Edit modal
    const [editingUser, setEditingUser] = useState<Profile | null>(null)
    const [editForm, setEditForm] = useState({
        full_name: '',
        username: '',
        email: '',
        website: '',
        role: 'user' as string,
    })
    const [saving, setSaving] = useState(false)

    // Stats
    const [stats, setStats] = useState({ total: 0, admins: 0, mods: 0, users: 0 })

    const supabase = createClient()

    const fetchStats = useCallback(async () => {
        const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        const { count: admins } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin')
        const { count: mods } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'moderator')
        setStats({
            total: total || 0,
            admins: admins || 0,
            mods: mods || 0,
            users: (total || 0) - (admins || 0) - (mods || 0),
        })
    }, [])

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        let query = supabase
            .from('profiles')
            .select('*', { count: 'exact' })
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

        if (searchQuery.trim()) {
            const q = searchQuery.trim()
            query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,username.ilike.%${q}%`)
        }

        if (roleFilter !== 'all') {
            query = query.eq('role', roleFilter)
        }

        const { data, count } = await query

        if (data) {
            setUsers(data)
            setTotalCount(count || 0)
        }
        setLoading(false)
    }, [page, searchQuery, roleFilter])

    useEffect(() => {
        fetchUsers()
        fetchStats()
    }, [fetchUsers, fetchStats])

    const openEdit = (user: Profile) => {
        setEditingUser(user)
        setEditForm({
            full_name: user.full_name || '',
            username: user.username || '',
            email: user.email || '',
            website: user.website || '',
            role: user.role,
        })
    }

    const handleSave = async () => {
        if (!editingUser) return
        setSaving(true)

        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: editForm.full_name || null,
                username: editForm.username || null,
                email: editForm.email || null,
                website: editForm.website || null,
                role: editForm.role
            })
            .eq('id', editingUser.id)

        setSaving(false)

        if (error) {
            alert(`Lỗi cập nhật: ${error.message}`)
            return
        }

        setEditingUser(null)
        fetchUsers()
        fetchStats()
    }

    const formatDate = (dateStr: string | null | undefined) => {
        if (!dateStr) return '—'
        return new Date(dateStr).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        })
    }

    const getInitials = (name: string | null, email: string | null) => {
        if (name) return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        if (email) return email[0].toUpperCase()
        return '?'
    }

    const totalPages = Math.ceil(totalCount / PAGE_SIZE)

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-none">
                        <Users size={22} className="text-white" />
                    </div>
                    Quản lý Người dùng
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Quản lý tài khoản người dùng và phân quyền</p>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <StatCard label="Tổng" value={stats.total} icon={<Users size={18} />} color="from-slate-500 to-slate-600" />
                <StatCard label="Admin" value={stats.admins} icon={<Crown size={18} />} color="from-rose-500 to-rose-600" />
                <StatCard label="Moderator" value={stats.mods} icon={<ShieldCheck size={18} />} color="from-violet-500 to-violet-600" />
                <StatCard label="Người dùng" value={stats.users} icon={<User size={18} />} color="from-sky-500 to-sky-600" />
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        id="admin-users-search"
                        type="text"
                        placeholder="Tìm theo tên, email, username..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0f1219] border border-gray-200 dark:border-white/5 rounded-xl text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/50 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                            id="admin-users-filter"
                            value={roleFilter}
                            onChange={(e) => { setRoleFilter(e.target.value); setPage(0) }}
                            className="pl-8 pr-8 py-2.5 bg-white dark:bg-[#0f1219] border border-gray-200 dark:border-white/5 rounded-xl text-sm text-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 appearance-none cursor-pointer"
                        >
                            <option value="all">Tất cả vai trò</option>
                            <option value="admin">Admin</option>
                            <option value="moderator">Moderator</option>
                            <option value="user">Người dùng</option>
                        </select>
                    </div>
                    <button
                        onClick={() => fetchUsers()}
                        className="p-2.5 bg-white dark:bg-[#1e2330] border border-gray-200 dark:border-white/5 rounded-xl text-slate-500 dark:text-slate-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                        title="Làm mới"
                    >
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* User cards grid */}
            {loading ? (
                <div className="bg-white dark:bg-[#1e2330] border border-gray-200 dark:border-white/5 rounded-2xl p-12 flex flex-col items-center gap-3">
                    <Loader2 size={28} className="animate-spin text-violet-500" />
                    <p className="text-slate-400 text-sm">Đang tải danh sách...</p>
                </div>
            ) : users.length === 0 ? (
                <div className="bg-white dark:bg-[#1e2330] border border-gray-200 dark:border-white/5 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-[#0f1219] rounded-full flex items-center justify-center mx-auto mb-4 border dark:border-white/5">
                        <Users size={28} className="text-slate-300 dark:text-slate-500" />
                    </div>
                    <h3 className="text-slate-600 dark:text-slate-300 font-semibold mb-1">Không tìm thấy</h3>
                    <p className="text-slate-400 text-sm">Không có người dùng nào phù hợp với bộ lọc.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {users.map((user) => {
                        const role = roleConfig[user.role] || roleConfig.user
                        return (
                            <div
                                key={user.id}
                                className="group bg-white dark:bg-[#1e2330] border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-500/20 transition-all duration-300"
                            >
                                {/* Role indicator bar */}
                                <div className={`h-1 w-full ${user.role === 'admin' ? 'bg-gradient-to-r from-rose-500 to-pink-500' : user.role === 'moderator' ? 'bg-gradient-to-r from-violet-500 to-purple-500' : 'bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700'}`} />

                                <div className="p-5">
                                    {/* User info header */}
                                    <div className="flex items-start gap-3 mb-4">
                                        {/* Avatar */}
                                        {user.avatar_url ? (
                                            <img
                                                src={user.avatar_url}
                                                alt={user.full_name || 'Avatar'}
                                                className="w-12 h-12 rounded-xl object-cover border-2 border-white dark:border-white/5 shadow-sm flex-shrink-0"
                                            />
                                        ) : (
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${user.role === 'admin' ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white' : user.role === 'moderator' ? 'bg-gradient-to-br from-violet-500 to-purple-500 text-white' : 'bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-300'}`}>
                                                {getInitials(user.full_name, user.email)}
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                                                {user.full_name || 'Chưa cập nhật'}
                                            </h3>
                                            {user.username && (
                                                <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                                                    <AtSign size={10} />
                                                    {user.username}
                                                </p>
                                            )}
                                        </div>

                                        {/* Role badge */}
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold ${role.bg} ${role.color} flex-shrink-0`}>
                                            {role.icon}
                                            {role.label}
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div className="space-y-2 mb-4">
                                        {user.email && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <Mail size={12} className="text-slate-400 flex-shrink-0" />
                                                <span className="truncate">{user.email}</span>
                                            </div>
                                        )}
                                        {user.website && (
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <Globe size={12} className="text-slate-400 flex-shrink-0" />
                                                <a href={user.website} target="_blank" rel="noopener noreferrer" className="truncate hover:text-violet-500 transition-colors">
                                                    {user.website}
                                                </a>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Calendar size={12} className="flex-shrink-0" />
                                            <span>Cập nhật: {formatDate(user.updated_at)}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5">
                                        <span className="text-[10px] text-slate-300 dark:text-slate-500 font-mono truncate max-w-[160px]">{user.id}</span>
                                        <button
                                            onClick={() => openEdit(user)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 rounded-lg transition-colors"
                                        >
                                            <Edit3 size={14} />
                                            Sửa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-[#1e2330] border border-gray-200 dark:border-white/5 rounded-2xl px-4 py-3">
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
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* EDIT Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingUser(null)} />

                    <div className="relative bg-white dark:bg-[#1e2330] rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-white/5 overflow-hidden">
                        {/* Modal header */}
                        <div className="border-b border-gray-100 dark:border-white/5 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <UserCog size={20} className="text-violet-500" />
                                Chỉnh sửa người dùng
                            </h3>
                            <button onClick={() => setEditingUser(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* User preview */}
                        <div className="px-6 pt-5 pb-4 flex items-center gap-3 bg-slate-50/50 dark:bg-black/20">
                            {editingUser.avatar_url ? (
                                <img src={editingUser.avatar_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                            ) : (
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold">
                                    {getInitials(editingUser.full_name, editingUser.email)}
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-semibold text-slate-800 dark:text-white">{editingUser.full_name || editingUser.email || 'Người dùng'}</p>
                                <p className="text-xs text-slate-400 font-mono">{editingUser.id.slice(0, 8)}...</p>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                        <UserCircle size={12} />
                                        Họ tên
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.full_name}
                                        onChange={e => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f1219] border border-gray-200 dark:border-white/5 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
                                        placeholder="Nguyễn Văn A"
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                        <AtSign size={12} />
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.username}
                                        onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f1219] border border-gray-200 dark:border-white/5 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
                                        placeholder="username"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                    <Mail size={12} />
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={editForm.email}
                                    onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f1219] border border-gray-200 dark:border-white/5 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
                                    placeholder="user@email.com"
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                                    <Globe size={12} />
                                    Website
                                </label>
                                <input
                                    type="url"
                                    value={editForm.website}
                                    onChange={e => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-[#0f1219] border border-gray-200 dark:border-white/5 rounded-xl text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
                                    placeholder="https://..."
                                />
                            </div>

                            {/* Role selector */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
                                    <Shield size={12} />
                                    Vai trò
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.entries(roleConfig).map(([key, config]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setEditForm(prev => ({ ...prev, role: key }))}
                                            className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl text-xs font-medium border-2 transition-all ${editForm.role === key
                                                ? `${config.bg} ${config.color} border-current shadow-sm`
                                                : 'bg-slate-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editForm.role === key
                                                ? `${key === 'admin' ? 'bg-rose-500' : key === 'moderator' ? 'bg-violet-500' : 'bg-slate-400'} text-white`
                                                : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                                                } transition-colors`}>
                                                {config.icon}
                                            </div>
                                            {config.label}
                                            {editForm.role === key && (
                                                <CheckCircle2 size={12} className="absolute top-1.5 right-1.5" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-gray-100 dark:border-white/5 px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-colors font-medium"
                            >
                                Huỷ
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold rounded-xl hover:from-violet-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-violet-200 dark:shadow-none active:scale-95"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Stats card component
function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
    return (
        <div className="bg-white dark:bg-[#1e2330] border border-gray-200 dark:border-white/5 rounded-2xl p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-sm`}>
                    {icon}
                </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{label}</p>
        </div>
    )
}
