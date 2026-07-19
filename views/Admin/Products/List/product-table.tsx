"use client";

import { useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// shadcn UI
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

// Icons
import {
    Plus, Search, MoreHorizontal, Eye, Pencil, Trash2, Copy,
    ChevronLeft, ChevronRight, Package, Loader2, AlertTriangle,
    ArrowUpDown, Filter, Download, RefreshCw, TrendingUp, Layers, Box
} from "lucide-react";

// ============================================
// TYPES
// ============================================
export interface ProductRow {
    id: string;
    slug: string;
    name: string;
    brand: string;
    origin: string;
    thumbnail: string;
    images: string[];
    created_at: string;
    updated_at: string;
    variant_count: number;
    min_price: number;
    max_price: number;
    total_stock: number;
    discount_percent: number;
}

interface ProductTableProps {
    initialProducts: ProductRow[];
    totalCount: number;
    currentPage: number;
    itemsPerPage: number;
}

// ============================================
// HELPERS
// ============================================
function formatVND(value: number) {
    if (!value && value !== 0) return "—";
    return new Intl.NumberFormat("vi-VN").format(value) + " ₫";
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric"
    });
}

function getStockColor(stock: number) {
    if (stock > 20) return { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-500/20" };
    if (stock > 0) return { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-200 dark:border-amber-500/20" };
    return { bg: "bg-red-50 dark:bg-red-500/10", text: "text-red-600 dark:text-red-400", border: "border-red-200 dark:border-red-500/20" };
}

// ============================================
// SUB: Action Menu (shared between mobile & desktop)
// ============================================
function ProductActions({
    product,
    onDelete,
    align = "end",
    triggerClassName = "",
    currentPage,
}: {
    product: ProductRow;
    onDelete: () => void;
    align?: "start" | "end";
    triggerClassName?: string;
    currentPage?: number;
}) {
    const router = useRouter();
    const page = currentPage || 1;
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className={`h-8 w-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all ${triggerClassName}`}>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-52 rounded-xl shadow-xl dark:bg-[#1e2330] dark:border-white/10 p-1">
                <DropdownMenuItem onClick={() => router.push(`/${product.slug}`)} className="rounded-lg gap-3 px-3 py-2.5 cursor-pointer">
                    <Eye className="h-4 w-4 text-blue-500" /> <span>Xem chi tiết</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push(`/admin/products/create?edit=${product.id}&returnPage=${page}`)} className="rounded-lg gap-3 px-3 py-2.5 cursor-pointer">
                    <Pencil className="h-4 w-4 text-orange-500" /> <span>Chỉnh sửa</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(product.id)} className="rounded-lg gap-3 px-3 py-2.5 cursor-pointer">
                    <Copy className="h-4 w-4 text-slate-400" /> <span>Sao chép ID</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 dark:bg-white/5" />
                <DropdownMenuItem onClick={onDelete} className="rounded-lg gap-3 px-3 py-2.5 cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-500/10">
                    <Trash2 className="h-4 w-4" /> <span>Xoá sản phẩm</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// ============================================
// SUB: Toolbar
// ============================================
function ProductTableToolbar({
    onSearch,
    selectedCount,
    onDeleteSelected,
}: {
    onSearch: (term: string) => void;
    selectedCount: number;
    onDeleteSelected: () => void;
}) {
    const [searchValue, setSearchValue] = useState("");

    return (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchValue}
                        onChange={(e) => {
                            setSearchValue(e.target.value);
                            onSearch(e.target.value);
                        }}
                        className="pl-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-slate-100 focus-visible:ring-orange-500/30 focus-visible:border-orange-400 transition-all"
                    />
                </div>
                {selectedCount > 0 && (
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={onDeleteSelected}
                        className="whitespace-nowrap rounded-xl h-10 px-4 shadow-sm"
                    >
                        <Trash2 className="h-4 w-4 mr-1.5" />
                        Xoá ({selectedCount})
                    </Button>
                )}
            </div>
            <Button asChild className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md shadow-orange-500/20 rounded-xl h-10 px-5 font-medium transition-all hover:shadow-lg hover:shadow-orange-500/25">
                <Link href="/admin/products/create">
                    <Plus className="h-4 w-4 mr-2" /> Thêm sản phẩm
                </Link>
            </Button>
        </div>
    );
}

// ============================================
// SUB: Desktop Table Row
// ============================================
function ProductTableRow({
    product,
    isSelected,
    onToggleSelect,
    onDelete,
    currentPage,
}: {
    product: ProductRow;
    isSelected: boolean;
    onToggleSelect: () => void;
    onDelete: () => void;
    currentPage?: number;
}) {
    const stockColor = getStockColor(product.total_stock);

    return (
        <TableRow className={`border-slate-100 dark:border-white/5 transition-all duration-150 group ${isSelected ? "bg-orange-50/50 dark:bg-orange-500/5" : "hover:bg-slate-50/80 dark:hover:bg-white/[0.02]"}`}>
            {/* Checkbox */}
            <TableCell className="w-[44px] pl-4">
                <Checkbox checked={isSelected} onCheckedChange={onToggleSelect} className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500" />
            </TableCell>

            {/* Product */}
            <TableCell className="max-w-0 py-3">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex-shrink-0 shadow-sm">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={product.thumbnail || "https://placehold.co/100x100/f1f5f9/94a3b8?text=No+Img"}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        <Link
                            href={`/${product.slug}`}
                            className="font-semibold text-[13px] text-slate-800 dark:text-slate-100 hover:text-orange-600 dark:hover:text-orange-400 transition-colors block truncate leading-snug"
                            title={product.name}
                        >
                            {product.name}
                        </Link>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{product.brand} • {product.origin}</p>
                    </div>
                </div>
            </TableCell>

            {/* Price */}
            <TableCell className="py-3">
                {product.min_price !== null && product.min_price !== undefined ? (
                    <div>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                            <span className="font-bold text-[13px] text-slate-800 dark:text-slate-100">{formatVND(product.min_price)}</span>
                            {product.discount_percent > 0 && (
                                <span className="inline-flex items-center rounded-md bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[9px] font-bold px-1.5 py-0.5 leading-none shadow-sm">
                                    -{product.discount_percent}%
                                </span>
                            )}
                        </div>
                        {product.min_price !== product.max_price && (
                            <p className="text-[10px] text-slate-400 mt-0.5">→ {formatVND(product.max_price)}</p>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-slate-400 italic">Chưa có giá</span>
                )}
            </TableCell>

            {/* Stock */}
            <TableCell className="py-3">
                <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg ${stockColor.bg} ${stockColor.text} ${stockColor.border} border`}>
                    {product.total_stock ?? 0}
                </span>
            </TableCell>

            {/* Variants */}
            <TableCell className="py-3">
                <span className="inline-flex items-center text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg">
                    {product.variant_count ?? 0}
                </span>
            </TableCell>

            {/* Date */}
            <TableCell className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap py-3">
                {formatDate(product.created_at)}
            </TableCell>

            {/* Actions */}
            <TableCell className="py-3 pr-4">
                <ProductActions product={product} onDelete={onDelete} currentPage={currentPage} />
            </TableCell>
        </TableRow>
    );
}

// ============================================
// SUB: Mobile Product Card
// ============================================
function ProductCard({
    product,
    isSelected,
    onToggleSelect,
    onDelete,
    currentPage,
}: {
    product: ProductRow;
    isSelected: boolean;
    onToggleSelect: () => void;
    onDelete: () => void;
    currentPage?: number;
}) {
    const stockColor = getStockColor(product.total_stock);

    return (
        <div className={`flex items-start gap-3 px-4 py-3.5 transition-all duration-150 ${isSelected ? "bg-orange-50/60 dark:bg-orange-500/5" : "hover:bg-slate-50/80 dark:hover:bg-white/[0.02]"}`}>
            <Checkbox
                checked={isSelected}
                onCheckedChange={onToggleSelect}
                className="flex-shrink-0 mt-1 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
            />
            <div className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200/80 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex-shrink-0 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={product.thumbnail || "https://placehold.co/100x100/f1f5f9/94a3b8?text=No+Img"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="min-w-0 flex-1">
                <Link
                    href={`/${product.slug}`}
                    className="font-semibold text-sm text-slate-800 dark:text-slate-100 hover:text-orange-600 transition-colors line-clamp-2 leading-snug"
                    title={product.name}
                >
                    {product.name}
                </Link>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {product.min_price !== null && product.min_price !== undefined ? (
                        <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                            {formatVND(product.min_price)}
                        </span>
                    ) : (
                        <span className="text-xs text-slate-400 italic">Chưa có giá</span>
                    )}
                    {product.discount_percent > 0 && (
                        <span className="inline-flex items-center rounded-md bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[9px] font-bold px-1.5 py-0.5 leading-none shadow-sm">
                            -{product.discount_percent}%
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md ${stockColor.bg} ${stockColor.text} ${stockColor.border} border`}>
                       Kho: {product.total_stock ?? 0}
                    </span>
                    <span className="inline-flex items-center text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                        {product.variant_count ?? 0} biến thể
                    </span>
                    <span className="text-[10px] text-slate-400">
                        {formatDate(product.created_at)}
                    </span>
                </div>
            </div>
            <ProductActions product={product} onDelete={onDelete} triggerClassName="flex-shrink-0 mt-0.5" currentPage={currentPage} />
        </div>
    );
}

// ============================================
// SUB: Delete Confirmation Dialog
// ============================================
function DeleteDialog({
    open,
    onOpenChange,
    productName,
    onConfirm,
    isDeleting,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    productName: string;
    onConfirm: () => void;
    isDeleting: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px] rounded-2xl">
                <DialogHeader>
                    <div className="mx-auto w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-2">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                    </div>
                    <DialogTitle className="text-center text-lg">Xác nhận xoá</DialogTitle>
                    <DialogDescription className="text-center">
                        Bạn có chắc chắn muốn xoá <strong className="text-slate-900 dark:text-white">{productName}</strong>?
                        <br />
                        <span className="text-red-500 text-xs">Hành động này không thể hoàn tác.</span>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex gap-2 sm:gap-2 mt-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isDeleting} className="flex-1 rounded-xl">
                        Huỷ bỏ
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={isDeleting} className="flex-1 rounded-xl shadow-md shadow-red-500/20">
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Xoá
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// SUB: Pagination
// ============================================
function PaginationBar({
    currentPage,
    totalPages,
    totalCount,
    itemsPerPage,
    onPageChange,
}: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
}) {
    const from = (currentPage - 1) * itemsPerPage + 1;
    const to = Math.min(currentPage * itemsPerPage, totalCount);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-5">
            <p className="text-xs text-slate-400 dark:text-slate-500 order-2 sm:order-1">
                Hiển thị <span className="font-semibold text-slate-600 dark:text-slate-300">{from}–{to}</span> trong <span className="font-semibold text-slate-600 dark:text-slate-300">{totalCount}</span> sản phẩm
            </p>
            <div className="flex items-center gap-1 order-1 sm:order-2">
                <Button
                    variant="outline" size="icon"
                    className="h-9 w-9 rounded-xl dark:border-white/10 dark:text-slate-300 disabled:opacity-30"
                    disabled={currentPage <= 1}
                    onClick={() => onPageChange(currentPage - 1)}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                        pageNum = i + 1;
                    } else if (currentPage <= 3) {
                        pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                    } else {
                        pageNum = currentPage - 2 + i;
                    }
                    const isActive = currentPage === pageNum;
                    return (
                        <Button
                            key={pageNum}
                            variant={isActive ? "default" : "outline"}
                            size="icon"
                            className={`h-9 w-9 rounded-xl text-xs font-medium transition-all ${isActive
                                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/20 border-transparent hover:from-orange-600 hover:to-orange-700"
                                : "dark:border-white/10 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                            }`}
                            onClick={() => onPageChange(pageNum)}
                        >
                            {pageNum}
                        </Button>
                    );
                })}

                <Button
                    variant="outline" size="icon"
                    className="h-9 w-9 rounded-xl dark:border-white/10 dark:text-slate-300 disabled:opacity-30"
                    disabled={currentPage >= totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}

// ============================================
// SUB: Empty State
// ============================================
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-50 dark:from-orange-500/10 dark:to-amber-500/10 flex items-center justify-center mb-5">
                <Package className="h-10 w-10 text-orange-400" />
            </div>
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1">Chưa có sản phẩm nào</h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 mb-5 text-center max-w-xs">Bắt đầu bằng cách thêm sản phẩm đầu tiên cho cửa hàng của bạn</p>
            <Button asChild className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md shadow-orange-500/20 rounded-xl h-10 px-6 font-medium">
                <Link href="/admin/products/create">
                    <Plus className="h-4 w-4 mr-2" /> Thêm sản phẩm
                </Link>
            </Button>
        </div>
    );
}


// ============================================
// MAIN COMPONENT
// ============================================
export default function ProductTable({
    initialProducts,
    totalCount,
    currentPage,
    itemsPerPage,
}: ProductTableProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    const { toast } = useToast();

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPending, startTransition] = useTransition();

    const totalPages = Math.ceil(totalCount / itemsPerPage);

    // --- Computed Stats ---
    const totalStock = initialProducts.reduce((sum, p) => sum + (p.total_stock ?? 0), 0);
    const totalVariants = initialProducts.reduce((sum, p) => sum + (p.variant_count ?? 0), 0);

    // --- Search ---
    const handleSearch = useCallback((term: string) => {
        const params = new URLSearchParams(searchParams?.toString() || "");
        if (term) params.set("search", term); else params.delete("search");
        params.set("page", "1");
        startTransition(() => {
            router.push(`?${params.toString()}`);
        });
    }, [searchParams, router]);

    // --- Pagination ---
    const handlePageChange = useCallback((page: number) => {
        const params = new URLSearchParams(searchParams?.toString() || "");
        params.set("page", page.toString());
        startTransition(() => {
            router.push(`?${params.toString()}`);
        });
    }, [searchParams, router]);

    // --- Selection ---
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === initialProducts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(initialProducts.map(p => p.id)));
        }
    };

    // --- Delete ---
    const handleDeleteSingle = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        const { error } = await supabase.from("products").delete().eq("id", deleteTarget.id);
        setIsDeleting(false);
        setDeleteTarget(null);

        if (error) {
            toast({ title: "Lỗi xoá sản phẩm", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Đã xoá!", description: `${deleteTarget.name} đã được xoá.`, className: "bg-green-600 text-white" });
            router.refresh();
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;
        setIsDeleting(true);
        const { error } = await supabase.from("products").delete().in("id", Array.from(selectedIds));
        setIsDeleting(false);

        if (error) {
            toast({ title: "Lỗi xoá", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Đã xoá!", description: `${selectedIds.size} sản phẩm đã được xoá.`, className: "bg-green-600 text-white" });
            setSelectedIds(new Set());
            router.refresh();
        }
    };

    // --- Stat Cards Data ---
    const stats = [
        {
            label: "Tổng sản phẩm",
            value: totalCount,
            icon: <Package className="h-5 w-5" />,
            gradient: "from-orange-500 to-amber-500",
            bgLight: "bg-orange-50 dark:bg-orange-500/10",
            textColor: "text-orange-600 dark:text-orange-400",
        },
        {
            label: "Tồn kho",
            value: totalStock,
            icon: <Box className="h-5 w-5" />,
            gradient: "from-emerald-500 to-teal-500",
            bgLight: "bg-emerald-50 dark:bg-emerald-500/10",
            textColor: "text-emerald-600 dark:text-emerald-400",
        },
        {
            label: "Biến thể",
            value: totalVariants,
            icon: <Layers className="h-5 w-5" />,
            gradient: "from-violet-500 to-purple-500",
            bgLight: "bg-violet-50 dark:bg-violet-500/10",
            textColor: "text-violet-600 dark:text-violet-400",
        },
        {
            label: "Trang",
            value: `${currentPage}/${totalPages}`,
            icon: <TrendingUp className="h-5 w-5" />,
            gradient: "from-blue-500 to-cyan-500",
            bgLight: "bg-blue-50 dark:bg-blue-500/10",
            textColor: "text-blue-600 dark:text-blue-400",
        },
    ];

    return (
        <>
            {/* ======================== STAT CARDS ======================== */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                {stats.map((stat, i) => (
                    <div
                        key={i}
                        className="group relative bg-white dark:bg-[#1e2330] rounded-2xl border border-slate-200/80 dark:border-white/5 p-4 md:p-5 overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 dark:hover:shadow-none hover:-translate-y-0.5"
                    >
                        {/* Gradient accent line */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient} opacity-80`} />

                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                                <p className={`text-2xl md:text-3xl font-bold ${stat.textColor} tracking-tight`}>{stat.value}</p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl ${stat.bgLight} flex items-center justify-center ${stat.textColor} transition-transform group-hover:scale-110`}>
                                {stat.icon}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ======================== MAIN CARD ======================== */}
            <div className="bg-white dark:bg-[#1e2330] rounded-2xl border border-slate-200/80 dark:border-white/5 overflow-hidden shadow-sm">
                {/* Header */}
                <div className="px-4 md:px-6 pt-5 md:pt-6 pb-4 md:pb-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20">
                                <Package className="h-4.5 w-4.5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-800 dark:text-white leading-tight">Quản lý sản phẩm</h2>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500 hidden sm:block">{totalCount} sản phẩm • Trang {currentPage}/{totalPages}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost" size="sm"
                            onClick={() => router.refresh()}
                            className="text-slate-400 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-xl transition-all h-9 px-3"
                        >
                            <RefreshCw className={`h-4 w-4 mr-1.5 ${isPending ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline text-xs">Làm mới</span>
                        </Button>
                    </div>

                    <ProductTableToolbar
                        onSearch={handleSearch}
                        selectedCount={selectedIds.size}
                        onDeleteSelected={handleDeleteSelected}
                    />
                </div>

                {/* ======================== MOBILE: Card List ======================== */}
                <div className="md:hidden">
                    {initialProducts.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-white/5 border-t border-slate-100 dark:border-white/5">
                            {initialProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    isSelected={selectedIds.has(product.id)}
                                    onToggleSelect={() => toggleSelect(product.id)}
                                    onDelete={() => setDeleteTarget(product)}
                                    currentPage={currentPage}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* ======================== DESKTOP: Table ======================== */}
                <div className="hidden md:block border-t border-slate-100 dark:border-white/5">
                    {initialProducts.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/80">
                                    <TableHead className="w-[44px] pl-4">
                                        <Checkbox
                                            checked={initialProducts.length > 0 && selectedIds.size === initialProducts.length}
                                            onCheckedChange={toggleSelectAll}
                                            className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                        />
                                    </TableHead>
                                    <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Sản phẩm</TableHead>
                                    <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[150px]">Giá bán</TableHead>
                                    <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[90px]">Tồn kho</TableHead>
                                    <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[90px]">Biến thể</TableHead>
                                    <TableHead className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[100px]">Ngày tạo</TableHead>
                                    <TableHead className="w-[50px] pr-4">
                                        <span className="sr-only">Thao tác</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {initialProducts.map(product => (
                                    <ProductTableRow
                                        key={product.id}
                                        product={product}
                                        isSelected={selectedIds.has(product.id)}
                                        onToggleSelect={() => toggleSelect(product.id)}
                                        onDelete={() => setDeleteTarget(product)}
                                        currentPage={currentPage}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Pagination */}
                {totalCount > 0 && (
                    <div className="px-4 md:px-6 pb-5 border-t border-slate-100 dark:border-white/5 pt-1">
                        <PaginationBar
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalCount={totalCount}
                            itemsPerPage={itemsPerPage}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>

            {/* Delete Dialog */}
            <DeleteDialog
                open={!!deleteTarget}
                onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
                productName={deleteTarget?.name || ""}
                onConfirm={handleDeleteSingle}
                isDeleting={isDeleting}
            />
        </>
    );
}