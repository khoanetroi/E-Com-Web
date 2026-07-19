"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DefaultLayout from "@/components/layout/DefaultLayout";
import { ProductGrid } from "./components/ProductGrid";
import { ProductSidebar, MobileToolbar, DesktopToolbar, FilterState } from "./components/ProductFilters";
import { ProductCardData } from "./components/ProductCard";
import { Home, ChevronRight, Package } from "lucide-react";
import Link from "next/link";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";

const PAGE_SIZE = 16;

function ProductsPageInner() {
    const supabase = useMemo(() => createClient(), []);
    const searchParams = useSearchParams();

    const [products, setProducts] = useState<ProductCardData[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);

    const [availableBrands, setAvailableBrands] = useState<string[]>([]);
    const [availableOrigins, setAvailableOrigins] = useState<string[]>([]);

    // Parse brand param: supports ?brand=FLUKE or ?brand=FLUKE&brand=APECH
    const initialBrands = useMemo(() => {
        const single = searchParams?.get("brand");
        const multi = searchParams?.getAll("brand");
        if (multi && multi.length > 1) return multi;
        if (single) return [single];
        return [];
    }, [searchParams]);

    const [filters, setFilters] = useState<FilterState>({
        search: searchParams?.get("search") || searchParams?.get("q") || "",
        categorySlug: searchParams?.get("category") || null,
        brands: initialBrands,
        origins: [],
        sort: "newest",
        inStockOnly: false,
    });

    // Keep filters in sync with URL search params changes
    useEffect(() => {
        const querySearch = searchParams?.get("search") || searchParams?.get("q") || "";
        const queryCategory = searchParams?.get("category") || null;
        const queryBrands = searchParams?.getAll("brand") || [];
        const singleBrand = searchParams?.get("brand");
        const finalBrands = queryBrands.length > 0 ? queryBrands : (singleBrand ? [singleBrand] : []);

        setFilters(prev => {
            const searchChanged = prev.search !== querySearch;
            const categoryChanged = prev.categorySlug !== queryCategory;
            const brandsChanged = prev.brands.join(",") !== finalBrands.join(",");

            if (searchChanged || categoryChanged || brandsChanged) {
                setLoading(true);
                setPage(1);
                window.scrollTo({ top: 0, behavior: "smooth" });
                return {
                    ...prev,
                    search: querySearch,
                    categorySlug: queryCategory,
                    brands: finalBrands,
                    origins: [], // Reset origins when category/brand changes from URL
                };
            }
            return prev;
        });
    }, [searchParams]);

    const activeFilterCount = useMemo(() => {
        let c = 0;
        if (filters.categorySlug) c++;
        c += filters.brands.length;
        c += filters.origins.length;
        if (filters.inStockOnly) c++;
        if (filters.search) c++;
        return c;
    }, [filters]);

    // Fetch brands & origins once
    useEffect(() => {
        const go = async () => {
            const [{ data: bd }, { data: od }] = await Promise.all([
                supabase.from("products").select("brand").not("brand", "is", null),
                supabase.from("products").select("origin").not("origin", "is", null),
            ]);
            setAvailableBrands([...new Set((bd || []).map((d: any) => d.brand).filter(Boolean))].sort() as string[]);
            setAvailableOrigins([...new Set((od || []).map((d: any) => d.origin).filter(Boolean))].sort() as string[]);
        };
        go();
    }, [supabase]);

    // Fetch products
    useEffect(() => {
        let isAborted = false;

        const fetchData = async () => {
            setLoading(true);

            try {
                // Resolve category
                let categoryId: string | null = null;
                let categoryChildIds: string[] = [];
                if (filters.categorySlug) {
                    const { data: cat } = await supabase
                        .from("categories")
                        .select("id, parent_id")
                        .eq("slug", filters.categorySlug)
                        .maybeSingle();
                    if (cat) {
                        categoryId = cat.id;
                        if (!cat.parent_id) {
                            const { data: ch } = await supabase.from("categories").select("id").eq("parent_id", cat.id);
                            categoryChildIds = (ch || []).map((c: any) => c.id);
                        }
                    }
                }

                if (isAborted) return;

                // Build query
                let selectStr = "id, name, brand, origin, thumbnail, category_id, created_at, slug";
                if (categoryId) {
                    selectStr += ", product_categories_mapping!inner(category_id)";
                }

                let query = supabase.from("products").select(selectStr, { count: "exact" });

                if (filters.search.trim()) {
                    const keyword = filters.search.trim().replace(/'/g, "''");
                    query = query.or(`name.ilike.%${keyword}%,brand.ilike.%${keyword}%`);
                }
                if (categoryId) {
                    query = query.in("product_categories_mapping.category_id", [categoryId, ...categoryChildIds]);
                }
                if (filters.brands.length > 0) query = query.in("brand", filters.brands.map(b => b.replace(/'/g, "''")));
                if (filters.origins.length > 0) query = query.in("origin", filters.origins);

                switch (filters.sort) {
                    case "name_asc": query = query.order("name", { ascending: true }); break;
                    case "price_asc":
                    case "price_desc":
                        // Sorting by price is handled after fetching variants for simplicity 
                        // unless we want to do complex joins. We'll stick to client-side sort for small PAGE_SIZE
                        query = query.order("created_at", { ascending: false });
                        break;
                    default: query = query.order("created_at", { ascending: false }); break;
                }

                const from = (page - 1) * PAGE_SIZE;
                query = query.range(from, from + PAGE_SIZE - 1);

                const { data: rows, count, error } = await query;
                if (error) throw error;
                if (isAborted) return;

                setTotalCount(count || 0);

                if (rows && rows.length > 0) {
                    const ids = rows.map((p: any) => p.id);
                    const [{ data: variants }, { data: allMappings }] = await Promise.all([
                        supabase.from("product_variants").select("product_id, price, stock, discount_percent").in("product_id", ids),
                        supabase.from("product_categories_mapping").select("product_id, category_id, categories(name)").in("product_id", ids),
                    ]);

                    if (isAborted) return;

                    const prodCatMap: Record<string, string[]> = {};
                    (allMappings || []).forEach((m: any) => {
                        if (!prodCatMap[m.product_id]) prodCatMap[m.product_id] = [];
                        if (m.categories?.name) prodCatMap[m.product_id].push(m.categories.name);
                    });

                    const vMap: Record<string, { prices: number[]; discountedPrices: number[]; stocks: number[]; count: number; maxDiscount: number }> = {};
                    (variants || []).forEach((v: any) => {
                        if (!vMap[v.product_id]) vMap[v.product_id] = { prices: [], discountedPrices: [], stocks: [], count: 0, maxDiscount: 0 };
                        const vdp = v.discount_percent || 0;
                        const discountedPrice = vdp > 0 ? v.price * (1 - vdp / 100) : v.price;
                        vMap[v.product_id].prices.push(v.price);
                        vMap[v.product_id].discountedPrices.push(discountedPrice);
                        vMap[v.product_id].stocks.push(v.stock);
                        vMap[v.product_id].count++;
                        if (vdp > vMap[v.product_id].maxDiscount) vMap[v.product_id].maxDiscount = vdp;
                    });

                    let enriched: ProductCardData[] = rows.map((p: any) => {
                        const v = vMap[p.id];
                        const catNames = prodCatMap[p.id] || [];
                        return {
                            id: p.id,
                            slug: p.slug,
                            name: p.name,
                            brand: p.brand,
                            origin: p.origin,
                            thumbnail: p.thumbnail,
                            category_name: catNames.length > 0 ? catNames[0] : null,
                            min_price: v ? Math.min(...v.discountedPrices) : 0,
                            max_price: v ? Math.max(...v.discountedPrices) : 0,
                            total_stock: v ? v.stocks.reduce((a, b: number) => a + b, 0) : 0,
                            variant_count: v ? v.count : 0,
                            discount_percent: v ? v.maxDiscount : 0,
                        };
                    });

                    if (filters.inStockOnly) enriched = enriched.filter(p => p.total_stock > 0);
                    if (filters.sort === "price_asc") enriched.sort((a, b) => a.min_price - b.min_price);
                    else if (filters.sort === "price_desc") enriched.sort((a, b) => b.min_price - a.min_price);

                    if (!isAborted) setProducts(enriched);
                } else {
                    if (!isAborted) setProducts([]);
                }
            } catch (err) {
                console.error("Fetch products error:", err);
            } finally {
                if (!isAborted) setLoading(false);
            }
        };

        fetchData();
        return () => { isAborted = true; };
    }, [supabase, filters, page]);

    const handleFiltersChange = (f: FilterState) => { setFilters(f); setPage(1); };

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    const paginationRange = () => {
        const d = 2;
        const r: (number | "dots")[] = [];
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - d && i <= page + d)) r.push(i);
            else if (r[r.length - 1] !== "dots") r.push("dots");
        }
        return r;
    };

    const filterProps = {
        filters,
        onFiltersChange: handleFiltersChange,
        availableBrands,
        availableOrigins,
        activeFilterCount,
    };

    return (
        <DefaultLayout>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950">

                {/* Content */}
                <div className="container mx-auto max-w-7xl px-4 py-5">

                    {/* Mobile toolbar */}
                    <MobileToolbar {...filterProps} />

                    {/* Main flex: sidebar + grid */}
                    <div className="flex gap-5">

                        {/* Sidebar — desktop only */}
                        <ProductSidebar {...filterProps} />

                        {/* Right column */}
                        <div className="flex-1 min-w-0">

                            {/* Desktop toolbar */}
                            <DesktopToolbar filters={filters} onFiltersChange={handleFiltersChange} />

                            {/* Grid */}
                            <ProductGrid products={products} loading={loading} totalCount={totalCount} />

                            {/* Pagination */}
                            {totalPages > 1 && !loading && (
                                <div className="mt-8 flex justify-center">
                                    <Pagination>
                                        <PaginationContent>
                                            {page > 1 && (
                                                <PaginationItem>
                                                    <PaginationPrevious href="#" onClick={e => { e.preventDefault(); setPage(p => Math.max(1, p - 1)); }} />
                                                </PaginationItem>
                                            )}
                                            {paginationRange().map((item, i) =>
                                                item === "dots" ? (
                                                    <PaginationItem key={`d${i}`}><PaginationEllipsis /></PaginationItem>
                                                ) : (
                                                    <PaginationItem key={item}>
                                                        <PaginationLink
                                                            href="#"
                                                            isActive={item === page}
                                                            onClick={e => { e.preventDefault(); setPage(item as number); }}
                                                        >
                                                            {item}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                )
                                            )}
                                            {page < totalPages && (
                                                <PaginationItem>
                                                    <PaginationNext href="#" onClick={e => { e.preventDefault(); setPage(p => Math.min(totalPages, p + 1)); }} />
                                                </PaginationItem>
                                            )}
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </DefaultLayout>
    );
}

// Wrap in Suspense since useSearchParams requires it in Next.js
export default function ProductsPage() {
    return (
        <Suspense fallback={
            <DefaultLayout>
                <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                    <div className="h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
            </DefaultLayout>
        }>
            <ProductsPageInner />
        </Suspense>
    );
}
