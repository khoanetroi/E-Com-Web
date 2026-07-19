"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Search, SlidersHorizontal, X, ArrowUpDown,
    Layers, Tag, MapPin
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { groupOrigins } from "@/lib/constants/origins";

interface Category {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
}

export interface FilterState {
    search: string;
    categorySlug: string | null;
    brands: string[];
    origins: string[];
    sort: string;
    inStockOnly: boolean;
}

interface FilterProps {
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    availableBrands: string[];
    availableOrigins: string[];
    activeFilterCount: number;
}

/* ============================================================
   Reusable filter body — rendered in both sidebar & mobile sheet
   ============================================================ */
function FilterBody({
    filters,
    onFiltersChange,
    availableBrands,
    availableOrigins,
    activeFilterCount,
    categories,
}: FilterProps & { categories: Category[] }) {
    const rootCategories = useMemo(() => categories.filter(c => !c.parent_id), [categories]);
    const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);

    const update = (partial: Partial<FilterState>) => onFiltersChange({ ...filters, ...partial });

    const toggleArr = (key: "brands" | "origins", val: string) => {
        const cur = filters[key];
        update({ [key]: cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val] });
    };

    const clearAll = () =>
        onFiltersChange({ search: "", categorySlug: null, brands: [], origins: [], sort: "newest", inStockOnly: false });

    return (
        <div className="space-y-5">
            {/* Categories */}
            {categories.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                        <Layers className="h-3.5 w-3.5 text-orange-500" /> Danh mục
                    </h4>
                    <div className="space-y-0.5">
                        <button
                            onClick={() => update({ categorySlug: null })}
                            className={cn(
                                "w-full text-left px-3 py-2 rounded-lg text-sm transition-all",
                                !filters.categorySlug
                                    ? "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-semibold"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                            )}
                        >
                            Tất cả
                        </button>
                        {rootCategories.map(parent => {
                            const children = getChildren(parent.id);
                            const isActive = filters.categorySlug === parent.slug;
                            const childActive = children.some(c => c.slug === filters.categorySlug);

                            return (
                                <div key={parent.id}>
                                    <button
                                        onClick={() => update({ categorySlug: parent.slug })}
                                        className={cn(
                                            "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between",
                                            isActive
                                                ? "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-semibold"
                                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                        )}
                                    >
                                        {parent.name}
                                        {children.length > 0 && (
                                            <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-normal">
                                                {children.length}
                                            </Badge>
                                        )}
                                    </button>
                                    {(isActive || childActive) && children.length > 0 && (
                                        <div className="ml-3 mt-0.5 space-y-0.5 border-l-2 border-orange-200 dark:border-orange-800/50 pl-3">
                                            {children.map(child => (
                                                <button
                                                    key={child.id}
                                                    onClick={() => update({ categorySlug: child.slug })}
                                                    className={cn(
                                                        "w-full text-left px-2 py-1.5 rounded text-xs transition-all",
                                                        filters.categorySlug === child.slug
                                                            ? "text-orange-600 dark:text-orange-400 font-semibold"
                                                            : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
                                                    )}
                                                >
                                                    {child.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <Separator />

            {/* Brands */}
            {availableBrands.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5 text-orange-500" /> Thương hiệu
                    </h4>
                    <div className="space-y-2">
                        {availableBrands.map(brand => (
                            <label key={brand} className="flex items-center gap-2.5 cursor-pointer group">
                                <Checkbox
                                    checked={filters.brands.includes(brand)}
                                    onCheckedChange={() => toggleArr("brands", brand)}
                                    className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                />
                                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                    {brand}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <Separator />

            {/* Origins (normalized) */}
            {availableOrigins.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-orange-500" /> Xuất xứ
                    </h4>
                    <div className="space-y-2">
                        {Array.from(groupOrigins(availableOrigins)).sort((a, b) => a[0].localeCompare(b[0])).map(([normalized, rawValues]) => {
                            // Check if ANY of the raw values for this group are selected
                            const isChecked = rawValues.some(v => filters.origins.includes(v));
                            return (
                                <label key={normalized} className="flex items-center gap-2.5 cursor-pointer group">
                                    <Checkbox
                                        checked={isChecked}
                                        onCheckedChange={() => {
                                            if (isChecked) {
                                                // Remove all raw values of this group
                                                update({ origins: filters.origins.filter(o => !rawValues.includes(o)) });
                                            } else {
                                                // Add all raw values of this group
                                                update({ origins: [...filters.origins, ...rawValues] });
                                            }
                                        }}
                                        className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                                    />
                                    <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                                        {normalized}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}

            <Separator />

            {/* In stock */}
            <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                    checked={filters.inStockOnly}
                    onCheckedChange={(val) => update({ inStockOnly: val === true })}
                    className="data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Chỉ còn hàng</span>
            </label>

            {/* Clear */}
            {activeFilterCount > 0 && (
                <Button variant="outline" size="sm" onClick={clearAll} className="w-full text-xs">
                    <X className="h-3.5 w-3.5 mr-1.5" /> Xóa bộ lọc ({activeFilterCount})
                </Button>
            )}
        </div>
    );
}

/* ============================================================
   Desktop Sidebar — used directly in page layout
   ============================================================ */
export function ProductSidebar(props: FilterProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        supabase.from("categories").select("id, name, slug, parent_id").order("name")
            .then(({ data }) => setCategories(data || []));
    }, [supabase]);

    return (
        <aside className="hidden lg:block w-[260px] flex-shrink-0">
            <Card className="sticky top-24 border-slate-200 dark:border-slate-700/60 shadow-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <SlidersHorizontal className="h-4 w-4 text-orange-500" /> Bộ lọc
                        {props.activeFilterCount > 0 && (
                            <Badge className="bg-orange-500 text-white text-[10px] h-5 px-1.5 ml-auto">
                                {props.activeFilterCount}
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                    <ScrollArea className="h-[calc(100vh-200px)] pr-3">
                        <FilterBody {...props} categories={categories} />
                    </ScrollArea>
                </CardContent>
            </Card>
        </aside>
    );
}

/* ============================================================
   Mobile Toolbar — search, filter sheet, sort
   ============================================================ */
export function MobileToolbar(props: FilterProps) {
    const [categories, setCategories] = useState<Category[]>([]);
    const supabase = useMemo(() => createClient(), []);

    useEffect(() => {
        supabase.from("categories").select("id, name, slug, parent_id").order("name")
            .then(({ data }) => setCategories(data || []));
    }, [supabase]);

    const update = (partial: Partial<FilterState>) => props.onFiltersChange({ ...props.filters, ...partial });

    return (
        <div className="lg:hidden flex items-center gap-2 mb-4">
            {/* Search */}
            <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    value={props.filters.search}
                    onChange={e => update({ search: e.target.value })}
                    placeholder="Tìm sản phẩm..."
                    className="pl-9 h-9 text-sm"
                />
                {props.filters.search && (
                    <button onClick={() => update({ search: "" })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Filter Sheet */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="relative h-9 w-9 flex-shrink-0">
                        <SlidersHorizontal className="h-4 w-4" />
                        {props.activeFilterCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                                {props.activeFilterCount}
                            </span>
                        )}
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                    <SheetHeader className="p-4 border-b">
                        <SheetTitle className="flex items-center gap-2 text-sm">
                            <SlidersHorizontal className="h-4 w-4 text-orange-500" /> Bộ lọc
                        </SheetTitle>
                    </SheetHeader>
                    <ScrollArea className="h-[calc(100vh-72px)]">
                        <div className="p-4">
                            <FilterBody {...props} categories={categories} />
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>

            {/* Sort */}
            <Select value={props.filters.sort} onValueChange={v => update({ sort: v })}>
                <SelectTrigger className="w-auto min-w-[120px] h-9 text-xs flex-shrink-0">
                    <ArrowUpDown className="h-3 w-3 mr-1 text-slate-400" />
                    <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="price_asc">Giá tăng dần</SelectItem>
                    <SelectItem value="price_desc">Giá giảm dần</SelectItem>
                    <SelectItem value="name_asc">Tên A-Z</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}

/* ============================================================
   Desktop Toolbar — search bar + active badge chips + sort
   ============================================================ */
export function DesktopToolbar({
    filters,
    onFiltersChange,
}: {
    filters: FilterState;
    onFiltersChange: (f: FilterState) => void;
}) {
    const update = (partial: Partial<FilterState>) => onFiltersChange({ ...filters, ...partial });

    return (
        <div className="hidden lg:flex items-center gap-3 mb-5">
            {/* Search */}
            <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    value={filters.search}
                    onChange={e => update({ search: e.target.value })}
                    placeholder="Tìm kiếm sản phẩm..."
                    className="pl-9 h-9 text-sm"
                />
                {filters.search && (
                    <button onClick={() => update({ search: "" })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>

            {/* Active filter badges */}
            <div className="flex-1 flex items-center gap-1.5 flex-wrap min-w-0">
                {filters.categorySlug && (
                    <Badge
                        variant="secondary"
                        className="text-[11px] cursor-pointer hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors gap-1"
                        onClick={() => update({ categorySlug: null })}
                    >
                        {filters.categorySlug} <X className="h-3 w-3" />
                    </Badge>
                )}
                {filters.brands.map(b => (
                    <Badge key={b} variant="secondary" className="text-[11px] cursor-pointer hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors gap-1"
                        onClick={() => update({ brands: filters.brands.filter(x => x !== b) })}>
                        {b} <X className="h-3 w-3" />
                    </Badge>
                ))}
                {(() => {
                    const groups = groupOrigins(filters.origins);
                    return Array.from(groups).map(([normalized, rawValues]) => (
                        <Badge key={normalized} variant="secondary" className="text-[11px] cursor-pointer hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors gap-1"
                            onClick={() => update({ origins: filters.origins.filter(x => !rawValues.includes(x)) })}>
                            {normalized} <X className="h-3 w-3" />
                        </Badge>
                    ));
                })()}
                {filters.inStockOnly && (
                    <Badge variant="secondary" className="text-[11px] cursor-pointer hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors gap-1"
                        onClick={() => update({ inStockOnly: false })}>
                        Còn hàng <X className="h-3 w-3" />
                    </Badge>
                )}
            </div>

            {/* Sort */}
            <Select value={filters.sort} onValueChange={v => update({ sort: v })}>
                <SelectTrigger className="w-auto min-w-[150px] h-9 text-xs">
                    <ArrowUpDown className="h-3 w-3 mr-1 text-slate-400" />
                    <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="newest">Mới nhất</SelectItem>
                    <SelectItem value="price_asc">Giá tăng dần</SelectItem>
                    <SelectItem value="price_desc">Giá giảm dần</SelectItem>
                    <SelectItem value="name_asc">Tên A-Z</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
