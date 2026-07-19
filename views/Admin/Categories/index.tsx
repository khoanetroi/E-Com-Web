"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
    Layers, Plus, Pencil, Trash2, Loader2, FolderTree, ChevronRight,
    Search, X, Save, ArrowUp, ArrowDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    parent_id: string | null;
    created_at: string;
    updated_at: string;
}

// Helper: tạo slug từ name
function generateSlug(name: string) {
    return name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d").replace(/Đ/g, "D")
        .replace(/\s+/g, "-")
        .replace(/[^a-zA-Z0-9-]/g, "")
        .toLowerCase();
}

export default function AdminCategoriesPage() {
    const supabase = useMemo(() => createClient(), []);
    const { toast } = useToast();

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formName, setFormName] = useState("");
    const [formSlug, setFormSlug] = useState("");
    const [formDescription, setFormDescription] = useState("");
    const [formParentId, setFormParentId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch
    const fetchCategories = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        const { data, error } = await supabase
            .from("categories")
            .select("*")
            .order("created_at", { ascending: true });

        if (error) {
            toast({ title: "Lỗi", description: error.message, variant: "destructive" });
        } else {
            setCategories(data || []);
        }
        if (showLoading) setLoading(false);
    }, [supabase, toast]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Open dialog to add
    const openAddDialog = (parentId: string | null = null) => {
        setEditingId(null);
        setFormName("");
        setFormSlug("");
        setFormDescription("");
        setFormParentId(parentId);
        setDialogOpen(true);
    };

    // Open dialog to edit
    const openEditDialog = (cat: Category) => {
        setEditingId(cat.id);
        setFormName(cat.name);
        setFormSlug(cat.slug);
        setFormDescription(cat.description || "");
        setFormParentId(cat.parent_id);
        setDialogOpen(true);
    };

    // Save
    const handleSave = async () => {
        if (!formName.trim()) {
            toast({ title: "Lỗi", description: "Tên danh mục không được trống", variant: "destructive" });
            return;
        }

        const slug = formSlug.trim() || generateSlug(formName);

        setSaving(true);
        try {
            if (editingId) {
                const { error } = await supabase
                    .from("categories")
                    .update({
                        name: formName.trim(),
                        slug,
                        description: formDescription.trim() || null,
                        parent_id: formParentId || null,
                        updated_at: new Date().toISOString()
                    })
                    .eq("id", editingId);
                if (error) throw error;
                toast({ title: "Đã cập nhật!", className: "bg-green-600 text-white" });
            } else {
                const { error } = await supabase
                    .from("categories")
                    .insert({
                        name: formName.trim(),
                        slug,
                        description: formDescription.trim() || null,
                        parent_id: formParentId || null,
                    });
                if (error) throw error;
                toast({ title: "Đã thêm!", className: "bg-green-600 text-white" });
            }
            setDialogOpen(false);
            await fetchCategories(false);
        } catch (err: any) {
            toast({ title: "Lỗi", description: err.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    // Delete
    const handleDelete = async () => {
        if (!deletingCategory) return;
        setDeleting(true);
        try {
            const { error } = await supabase
                .from("categories")
                .delete()
                .eq("id", deletingCategory.id);
            if (error) throw error;
            toast({ title: "Đã xóa!", className: "bg-green-600 text-white" });
            setDeleteDialogOpen(false);
            setDeletingCategory(null);
            await fetchCategories(false);
        } catch (err: any) {
            toast({ title: "Lỗi", description: err.message, variant: "destructive" });
        } finally {
            setDeleting(false);
        }
    };

    const rootCategories = useMemo(() =>
        categories.filter(c => !c.parent_id), [categories]);

    const getChildren = useCallback((parentId: string) =>
        categories.filter(c => c.parent_id === parentId), [categories]);

    // Handle moving categories
    const handleMove = async (category: Category, direction: "up" | "down", siblings: Category[]) => {
        const currentIndex = siblings.findIndex(c => c.id === category.id);
        if (currentIndex === -1) return;

        let targetIndex = -1;
        if (direction === "up" && currentIndex > 0) targetIndex = currentIndex - 1;
        if (direction === "down" && currentIndex < siblings.length - 1) targetIndex = currentIndex + 1;

        if (targetIndex === -1) return;

        const newSiblings = [...siblings];
        const temp = newSiblings[currentIndex];
        newSiblings[currentIndex] = newSiblings[targetIndex];
        newSiblings[targetIndex] = temp;

        const oldestTime = Math.min(...siblings.map(s => new Date(s.created_at).getTime()));

        // Optimistic update
        const updatedIds = new Set(newSiblings.map(s => s.id));
        setCategories((prev) => {
            const others = prev.filter(c => !updatedIds.has(c.id));
            const updatedSiblings = newSiblings.map((s, i) => ({
                ...s,
                created_at: new Date(oldestTime + i * 1000).toISOString()
            }));
            const combined = [...others, ...updatedSiblings];
            combined.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            return combined;
        });

        try {
            for (let i = 0; i < newSiblings.length; i++) {
                const newT = new Date(oldestTime + i * 1000).toISOString();
                await supabase.from("categories").update({ created_at: newT }).eq("id", newSiblings[i].id);
            }
            // Fetch silently to ensure in-sync
            fetchCategories(false);
        } catch (err: any) {
            toast({ title: "Lỗi khi đổi thứ tự", description: err.message, variant: "destructive" });
            fetchCategories(false); // Revert optimistic changes
        }
    };

    // Filter
    const filteredRoots = useMemo(() => {
        if (!search.trim()) return rootCategories;
        const q = search.toLowerCase();
        return categories.filter(c =>
            c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
        );
    }, [search, rootCategories, categories]);

    // Stats
    const totalRoot = rootCategories.length;
    const totalSub = categories.length - totalRoot;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <Layers className="h-6 w-6 text-orange-500" /> Quản lý Danh mục
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {totalRoot} danh mục gốc, {totalSub} danh mục con
                    </p>
                </div>
                <Button
                    onClick={() => openAddDialog()}
                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200 dark:shadow-none"
                >
                    <Plus className="h-4 w-4 mr-2" /> Thêm danh mục
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Tìm kiếm danh mục..."
                    className="pl-10 pr-10"
                />
                {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Categories Tree */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                </div>
            ) : categories.length === 0 ? (
                <Card className="bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/5">
                    <CardContent className="flex flex-col items-center py-16 text-center">
                        <FolderTree className="h-16 w-16 text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2">Chưa có danh mục nào</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Bắt đầu bằng cách thêm danh mục đầu tiên</p>
                        <Button onClick={() => openAddDialog()} className="bg-orange-600 hover:bg-orange-700 text-white">
                            <Plus className="h-4 w-4 mr-2" /> Thêm danh mục
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredRoots.map((root, index) => (
                        <CategoryCard
                            key={root.id}
                            category={root}
                            children={getChildren(root.id)}
                            getChildren={getChildren}
                            onEdit={openEditDialog}
                            onDelete={(cat) => { setDeletingCategory(cat); setDeleteDialogOpen(true); }}
                            onAddChild={(parentId) => openAddDialog(parentId)}
                            onMove={(cat, dir, siblings) => handleMove(cat, dir, siblings)}
                            siblings={filteredRoots}
                            index={index}
                        />
                    ))}
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/5">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {editingId ? <Pencil className="h-5 w-5 text-orange-500" /> : <Plus className="h-5 w-5 text-orange-500" />}
                            {editingId ? "Chỉnh sửa danh mục" : "Thêm danh mục mới"}
                        </DialogTitle>
                        <DialogDescription>
                            {formParentId
                                ? `Thêm danh mục con cho "${categories.find(c => c.id === formParentId)?.name || ""}"`
                                : "Tạo một danh mục gốc mới"
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label className="text-sm font-medium">Tên danh mục <span className="text-red-500">*</span></Label>
                            <Input
                                value={formName}
                                onChange={e => {
                                    setFormName(e.target.value);
                                    if (!editingId) setFormSlug(generateSlug(e.target.value));
                                }}
                                placeholder="Ví dụ: Thiết bị điện"
                                className="mt-1.5 bg-white dark:bg-[#0f1219] border-slate-200 dark:border-white/5"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Slug (URL)</Label>
                            <Input
                                value={formSlug}
                                onChange={e => setFormSlug(e.target.value)}
                                placeholder="thiet-bi-dien"
                                className="mt-1.5 font-mono text-xs bg-white dark:bg-[#0f1219] border-slate-200 dark:border-white/5"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Danh mục cha</Label>
                            <select
                                value={formParentId || ""}
                                onChange={e => setFormParentId(e.target.value || null)}
                                className="w-full mt-1.5 h-10 px-3 rounded-md border bg-white dark:bg-[#0f1219] border-slate-200 dark:border-white/5 text-sm outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all"
                            >
                                <option value="">— Không có (Danh mục gốc)</option>
                                {categories
                                    .filter(c => c.id !== editingId && !c.parent_id)
                                    .map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))
                                }
                            </select>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Mô tả</Label>
                            <textarea
                                value={formDescription}
                                onChange={e => setFormDescription(e.target.value)}
                                rows={3}
                                placeholder="Mô tả ngắn về danh mục..."
                                className="w-full mt-1.5 px-3 py-2 rounded-md border text-sm outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 transition-all resize-none bg-white dark:bg-[#0f1219] border-slate-200 dark:border-white/5"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Hủy</Button>
                        <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            {editingId ? "Cập nhật" : "Thêm mới"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent className="sm:max-w-sm bg-white dark:bg-[#1e2330] border-slate-200 dark:border-white/5">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <Trash2 className="h-5 w-5" /> Xóa danh mục
                        </DialogTitle>
                        <DialogDescription>
                            Bạn có chắc muốn xóa danh mục <strong>&quot;{deletingCategory?.name}&quot;</strong>?
                            Tất cả danh mục con cũng sẽ bị xóa theo.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>Hủy</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Xóa
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Category Card Component
function CategoryCard({
    category,
    children,
    getChildren,
    onEdit,
    onDelete,
    onAddChild,
    onMove,
    siblings,
    index,
    depth = 0
}: {
    category: Category;
    children: Category[];
    getChildren: (id: string) => Category[];
    onEdit: (cat: Category) => void;
    onDelete: (cat: Category) => void;
    onAddChild: (parentId: string) => void;
    onMove: (cat: Category, dir: "up" | "down", siblings: Category[]) => void;
    siblings: Category[];
    index: number;
    depth?: number;
}) {
    const [expanded, setExpanded] = useState(true);

    return (
        <div className={cn(depth > 0 && "ml-6 border-l-2 border-orange-100 dark:border-orange-900/40 pl-4")}>
            <div className={cn(
                "flex items-center gap-3 p-4 rounded-xl border bg-white dark:bg-[#1e2330] dark:border-white/5",
                "hover:shadow-md transition-all group",
                depth === 0 ? "border-slate-200" : "border-slate-100 dark:border-white/5"
            )}>
                {/* Expand toggle */}
                {children.length > 0 ? (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="h-7 w-7 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 hover:bg-orange-100 transition-colors"
                    >
                        <ChevronRight className={cn("h-4 w-4 transition-transform", expanded && "rotate-90")} />
                    </button>
                ) : (
                    <div className="h-7 w-7 rounded-lg bg-slate-50 dark:bg-[#0f1219] border dark:border-white/5 flex items-center justify-center">
                        <Layers className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{category.name}</h3>
                        {children.length > 0 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                                {children.length} con
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">/{category.slug}</p>
                    {category.description && (
                        <p className="text-xs text-slate-500 mt-1 truncate">{category.description}</p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Move Up/Down */}
                    <div className="flex flex-col mr-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-6 text-slate-400 hover:text-orange-500 hover:bg-orange-50 disabled:opacity-30 disabled:hover:bg-transparent"
                            onClick={() => onMove(category, "up", siblings)}
                            disabled={index === 0}
                            title="Di chuyển lên"
                        >
                            <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-6 text-slate-400 hover:text-orange-500 hover:bg-orange-50 disabled:opacity-30 disabled:hover:bg-transparent"
                            onClick={() => onMove(category, "down", siblings)}
                            disabled={index === siblings.length - 1}
                            title="Di chuyển xuống"
                        >
                            <ArrowDown className="h-3 w-3" />
                        </Button>
                    </div>

                    {depth === 0 && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                            onClick={() => onAddChild(category.id)}
                            title="Thêm danh mục con"
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        onClick={() => onEdit(category)}
                        title="Chỉnh sửa"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => onDelete(category)}
                        title="Xóa"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Children */}
            {expanded && children.length > 0 && (
                <div className="mt-2 space-y-2">
                    {children.map((child, childIndex) => (
                        <CategoryCard
                            key={child.id}
                            category={child}
                            children={getChildren(child.id)}
                            getChildren={getChildren}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddChild={onAddChild}
                            onMove={onMove}
                            siblings={children}
                            index={childIndex}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
