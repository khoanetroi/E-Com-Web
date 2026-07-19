"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Zap, ArrowRight, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/* ─── Types ─── */
interface SubCategory { id: string; name: string; slug: string; }
interface Product {
    id: string;
    slug: string;
    name: string;
    price: number | null;
    original_price: number | null;
    thumbnail: string | null;
    brand: string | null;
    discount_percent?: number;
}
interface BrandInfo { name: string; logoUrl?: string | null; }

interface CategorySectionProps {
    categoryName: string;
    categorySlug: string;
    accentColor?: string;
    accentBorderColor?: string;
    icon?: React.ReactNode;
    pinnedProductIds?: string[];
    bannerUrl?: string | null;
    sectionTitle?: string | null;
    pinnedBrandNames?: string[];
}

/* ─── Helpers ─── */
function fmt(n: number) {
    return n ? n.toLocaleString("vi-VN") + "đ" : "";
}
function pct(price: number | null, orig: number | null) {
    if (!price || !orig || orig <= price) return null;
    return Math.round(((orig - price) / orig) * 100);
}

/* Extract raw Tailwind color for inline CSS (e.g. "bg-red-600" → for border/shadow) */
const COLOR_MAP: Record<string, string> = {
    "bg-red-600": "#dc2626",
    "bg-blue-600": "#2563eb",
    "bg-orange-500": "#f97316",
    "bg-emerald-600": "#059669",
    "bg-purple-600": "#9333ea",
    "bg-indigo-600": "#4f46e5",
};

/* ─── Product Card ─── */
const ProductCard = ({ p, accent }: { p: Product; accent: string }) => {
    const disc = pct(p.price, p.original_price) ?? (p.discount_percent || 0);
    const accentHex = COLOR_MAP[accent] || "#dc2626";
    return (
        <Link
            href={`/${p.slug}`}
            className="bg-white dark:bg-[#1b2133] relative group flex flex-col h-full min-h-[280px] overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 hover:z-10"
        >
            {/* Discount badge */}
            {disc > 0 ? (
                <div
                    className="absolute top-2.5 right-2.5 text-white rounded-full w-10 h-10 flex items-center justify-center text-[11px] font-black z-10 shadow-lg"
                    style={{ background: accentHex }}
                >
                    -{disc}%
                </div>
            ) : null}

            {/* Image */}
            <div className="relative bg-slate-50 dark:bg-[#141928] flex items-center justify-center overflow-hidden"
                style={{ height: "210px" }}>
                <img
                    src={p.thumbnail || "/img/placeholder.png"}
                    alt={p.name}
                    className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-500"
                />
                {/* Bottom gradient overlay on hover */}
                <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            {/* Info */}
            <div className="flex flex-col flex-1 p-3 gap-1">
                {p.brand && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{p.brand}</span>
                )}
                <h3 className="text-[12.5px] font-medium text-slate-700 dark:text-slate-200 line-clamp-2 leading-snug flex-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {p.name}
                </h3>

                {/* Price */}
                <div className="flex items-baseline gap-2 mt-1.5 pt-1.5 border-t border-slate-100 dark:border-white/5">
                    {p.price ? (
                        <>
                            <span className="text-[15px] font-black" style={{ color: accentHex }}>
                                {fmt(p.price)}
                            </span>
                            {p.original_price && p.original_price > p.price && (
                                <span className="text-slate-400 line-through text-[11px]">
                                    {fmt(p.original_price)}
                                </span>
                            )}
                        </>
                    ) : (
                        <span className="text-[13px] font-bold text-slate-500">Liên hệ</span>
                    )}
                </div>
            </div>
        </Link>
    );
};

/* ─── Main Component ─── */
export function CategorySection({
    categoryName,
    categorySlug,
    accentColor = "bg-red-600",
    accentBorderColor = "border-red-600",
    icon,
    pinnedProductIds = [],
    bannerUrl,
    sectionTitle,
    pinnedBrandNames = [],
}: CategorySectionProps) {
    const supabase = useMemo(() => createClient(), []);
    const accentHex = COLOR_MAP[accentColor] || "#dc2626";

    const [parentCatId, setParentCatId] = useState<string | null>(null);
    const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
    const [brands, setBrands] = useState<BrandInfo[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [activeSubSlug, setActiveSubSlug] = useState<string | null>(null);
    const [loadingProds, setLoadingProds] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // 1 – Load parent category
    useEffect(() => {
        if (!categorySlug) {
            setLoadingProds(false);
            return;
        }
        const resolveCategory = async () => {
            try {
                const { data } = await supabase.from("categories").select("id").eq("slug", categorySlug).maybeSingle();
                if (data) setParentCatId(data.id);
                else setLoadingProds(false);
            } catch (err) {
                console.error("Error resolving category:", err);
                setLoadingProds(false);
            }
        };
        resolveCategory();
    }, [categorySlug, supabase]);

    // 2 – Load brand logos (pinned only)
    useEffect(() => {
        if (!parentCatId) return;
        supabase.from("categories").select("id, name, slug").eq("parent_id", parentCatId).order("name")
            .then(({ data }) => { if (data && data.length > 0) setSubCategories(data); });

        const fetchBrandLogos = async () => {
            if (!pinnedBrandNames || pinnedBrandNames.length === 0) { setBrands([]); return; }
            const { data: logos } = await supabase.from("brand_logos").select("brand_name, logo_url").in("brand_name", pinnedBrandNames);
            setBrands(pinnedBrandNames.map(name => {
                const logo = logos?.find(l => l.brand_name.toLowerCase() === name.toLowerCase());
                return { name, logoUrl: logo?.logo_url || null };
            }));
        };
        fetchBrandLogos();
    }, [parentCatId, supabase, pinnedBrandNames]);

    // 3 – Load products
    useEffect(() => {
        if (!parentCatId) return;
        setLoadingProds(true);
        const fetchAll = async () => {
            try {
                let catIds: string[] = [parentCatId];
                if (activeSubSlug) {
                    const { data } = await supabase.from("categories").select("id").eq("slug", activeSubSlug).maybeSingle();
                    if (data) catIds = [data.id];
                } else {
                    // Fetch immediate sub-categories and their children (2 levels deep for now as a safe bet)
                    const { data: subs } = await supabase.from("categories").select("id").eq("parent_id", parentCatId);
                    const subIds = (subs || []).map(s => s.id);

                    if (subIds.length > 0) {
                        const { data: grandSubs } = await supabase.from("categories").select("id").in("parent_id", subIds);
                        catIds = [parentCatId, ...subIds, ...(grandSubs || []).map(gs => gs.id)];
                    } else {
                        catIds = [parentCatId];
                    }
                }

                let pinnedList: any[] = [];
                if (!activeSubSlug && pinnedProductIds && pinnedProductIds.length > 0) {
                    const { data: pp } = await supabase.from("products")
                        .select("id, name, thumbnail, brand, category_id, slug")
                        .in("id", pinnedProductIds);
                    pinnedList = pp || [];
                }

                const limit = 8 - pinnedList.length;
                const excludeIds = pinnedList.length > 0 && pinnedProductIds?.length > 0 ? pinnedProductIds : [];
                let latestList: any[] = [];
                if (limit > 0) {
                    // Fetch product IDs from mapping table if we have multiple categories
                    const { data: mappingData } = await supabase
                        .from("product_categories_mapping")
                        .select("product_id")
                        .in("category_id", catIds);

                    const matchedIds = [...new Set((mappingData || []).map(m => m.product_id))];

                    if (matchedIds.length > 0) {
                        let query = supabase.from("products")
                            .select("id, name, thumbnail, brand, category_id, slug")
                            .in("id", matchedIds)
                            .order("created_at", { ascending: false }).limit(limit);

                        if (excludeIds.length > 0) query = query.not("id", "in", `(${excludeIds.join(",")})`);
                        const { data } = await query;
                        latestList = data || [];
                    }
                }

                const combined = [...pinnedList, ...latestList].slice(0, 8);
                if (combined.length === 0) { setProducts([]); return; }

                const ids = combined.map((p: any) => p.id);
                const { data: variants } = await supabase.from("product_variants")
                    .select("product_id, price, discount_percent").in("product_id", ids);

                const priceMap: Record<string, { minPrice: number; origPrice: number; maxDiscount: number }> = {};
                (variants || []).forEach((v: any) => {
                    const vdp = v.discount_percent || 0;
                    const discountedPrice = vdp > 0 ? v.price * (1 - vdp / 100) : v.price;
                    if (!priceMap[v.product_id]) {
                        priceMap[v.product_id] = { minPrice: discountedPrice, origPrice: v.price, maxDiscount: vdp };
                    } else {
                        if (discountedPrice < priceMap[v.product_id].minPrice) {
                            priceMap[v.product_id].minPrice = discountedPrice;
                            priceMap[v.product_id].origPrice = v.price;
                        }
                        if (vdp > priceMap[v.product_id].maxDiscount) priceMap[v.product_id].maxDiscount = vdp;
                    }
                });

                setProducts(combined.map((p: any) => {
                    const info = priceMap[p.id];
                    const price = info?.minPrice ?? null;
                    const orig = info && info.maxDiscount > 0 ? info.origPrice : null;
                    const dp = info?.maxDiscount || 0;
                    return { id: p.id, slug: p.slug, name: p.name, thumbnail: p.thumbnail, brand: p.brand, price, original_price: orig, discount_percent: dp };
                }));
            } catch (err) {
                console.error("Error in fetchAll:", err);
            } finally {
                setLoadingProds(false);
            }
        };
        fetchAll();
    }, [activeSubSlug, parentCatId, subCategories, supabase, pinnedProductIds, pinnedBrandNames]);

    if (!loadingProds && products.length === 0 && brands.length === 0) return null;

    const displayTitle = sectionTitle || categoryName;

    return (
        <section className="container mx-auto max-w-7xl px-4 mt-10 mb-14">

            {/* ── HEADER ── */}
            <div className="flex flex-col lg:flex-row items-stretch mb-4">
                {/* Title pill */}
                <div
                    className="flex lg:w-[260px] items-center justify-center gap-2.5 px-5 py-3 text-white font-black text-[15px] uppercase tracking-wide rounded-l-lg shadow-md shrink-0"
                    style={{ background: `linear-gradient(135deg, ${accentHex}, ${accentHex}cc)` }}
                >
                    {icon ?? <Zap className="w-4 h-4 shrink-0" />}
                    <span>{displayTitle}</span>
                </div>

                {/* Sub-category tabs & Mobile Dropdown */}
                <div className="flex-1 flex items-center bg-white dark:bg-[#1b2133] border border-l-0 lg:border-l-0 border-slate-200 dark:border-white/5 rounded-r-lg px-2 lg:px-4 gap-1 relative">
                    {/* Desktop Tabs */}
                    <div className="hidden lg:flex flex-1 items-center gap-1 overflow-x-auto scrollbar-hide">
                        <button
                            onClick={() => setActiveSubSlug(null)}
                            className={`shrink-0 text-[13px] px-4 py-1.5 min-w-[110px] rounded-full font-medium transition-all ${!activeSubSlug
                                ? "text-white shadow-sm"
                                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                                }`}
                            style={!activeSubSlug ? { background: accentHex } : {}}
                        >
                            Tất cả
                        </button>
                        {subCategories.map(sub => (
                            <button
                                key={sub.id}
                                onClick={() => setActiveSubSlug(sub.slug)}
                                className={`shrink-0 text-[13px] px-4 py-1.5 min-w-[110px] rounded-full font-medium transition-all ${activeSubSlug === sub.slug
                                    ? "text-white shadow-sm"
                                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                                    }`}
                                style={activeSubSlug === sub.slug ? { background: accentHex } : {}}
                            >
                                {sub.name}
                            </button>
                        ))}
                    </div>

                    {/* Mobile Custom Dropdown UI */}
                    <div className="flex lg:hidden flex-1 relative px-2 items-center">
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-full h-10 flex items-center justify-between text-[13px] font-bold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-white/5 px-4 rounded-lg border border-slate-200 dark:border-white/10 transition-all active:scale-[0.98]"
                        >
                            <span className="truncate">
                                {activeSubSlug
                                    ? subCategories.find(s => s.slug === activeSubSlug)?.name || "Danh mục"
                                    : "Tất cả danh mục"}
                            </span>
                            <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-300 ml-2", isDropdownOpen ? "rotate-180" : "")} />
                        </button>

                        {isDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-[60]"
                                    onClick={() => setIsDropdownOpen(false)}
                                />
                                <div className="absolute top-[80%] left-2 right-2 mt-2 bg-white dark:bg-[#1b2133] border border-slate-200 dark:border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                                    <div className="max-h-[320px] overflow-y-auto py-2 scrollbar-hide">
                                        <button
                                            onClick={() => { setActiveSubSlug(null); setIsDropdownOpen(false); }}
                                            className={cn(
                                                "w-full text-left px-5 py-3 text-[13px] font-bold transition-colors",
                                                !activeSubSlug
                                                    ? "text-white"
                                                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                                            )}
                                            style={!activeSubSlug ? { background: accentHex } : {}}
                                        >
                                            Tất cả danh mục
                                        </button>
                                        {subCategories.map(sub => (
                                            <button
                                                key={sub.id}
                                                onClick={() => { setActiveSubSlug(sub.slug); setIsDropdownOpen(false); }}
                                                className={cn(
                                                    "w-full text-left px-5 py-3 text-[13px] font-bold transition-colors",
                                                    activeSubSlug === sub.slug
                                                        ? "text-white"
                                                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5"
                                                )}
                                                style={activeSubSlug === sub.slug ? { background: accentHex } : {}}
                                            >
                                                {sub.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="hidden lg:block flex-1" />
                    <Link
                        href={`/products?category=${categorySlug}`}
                        className="shrink-0 flex items-center gap-1 text-[13px] font-semibold transition-colors ml-2 pr-2 lg:pr-0"
                        style={{ color: accentHex }}
                    >
                        <span className="hidden sm:inline">Xem tất cả</span> <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>

            {/* ── BODY ── */}
            <div className="flex flex-col lg:flex-row gap-3">

                {/* ── SIDEBAR (Hidden on Mobile) ── */}
                {brands.length > 0 ? (
                    <div className="hidden lg:flex w-full lg:w-[260px] shrink-0 flex-col gap-2">
                        {/* Brand logos — 1 cột, tối đa 4 hàng, cuộn nếu nhiều hơn */}
                        <div className="bg-white dark:bg-[#1b2133] rounded-xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
                            <div
                                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 text-center"
                                style={{ background: `${accentHex}22`, color: accentHex }}
                            >
                                Thương hiệu
                            </div>
                            <div className="scrollbar-hide" style={{ maxHeight: `${70 * 4}px`, overflowY: brands.length > 4 ? "auto" : "hidden" }}>
                                {brands.map((b) => (
                                    <Link
                                        key={b.name}
                                        href={`/products?brand=${encodeURIComponent(b.name)}`}
                                        title={`Xem sản phẩm ${b.name}`}
                                        className="flex items-center justify-center h-[70px] w-full px-5 border-t border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group"
                                    >
                                        {b.logoUrl ? (
                                            <img
                                                src={b.logoUrl}
                                                alt={b.name}
                                                className="w-full object-contain group-hover:scale-105 transition-transform duration-300"
                                                style={{ maxHeight: "44px" }}
                                            />
                                        ) : (
                                            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 group-hover:text-slate-800 dark:group-hover:text-white transition-colors text-center">
                                                {b.name}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Banner */}
                        <Link
                            href={`/products?category=${categorySlug}`}
                            className="relative flex-1 rounded-xl overflow-hidden group min-h-[200px] shadow-sm"
                            style={{ minHeight: brands.length > 0 ? "180px" : "340px" }}
                        >
                            <img
                                src={bannerUrl || `/img/category-banners/${categorySlug}.jpg`}
                                onError={(e) => { (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=600&auto=format&fit=crop"; }}
                                alt={displayTitle}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 absolute inset-0"
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                            {/* Accent top bar */}
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: accentHex }} />
                            {/* CTA text */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 text-center">
                                <p className="text-white/70 text-[10px] uppercase tracking-widest font-medium mb-1">Khám phá</p>
                                <p className="text-white font-black text-sm uppercase leading-tight drop-shadow">{displayTitle}</p>
                                <div
                                    className="mt-2 mx-auto text-[10px] font-bold text-white px-3 py-1 rounded-full w-fit opacity-80 group-hover:opacity-100 transition-opacity"
                                    style={{ background: accentHex }}
                                >
                                    Xem ngay →
                                </div>
                            </div>
                        </Link>
                    </div>
                ) : null}

                {/* ── PRODUCT GRID ── */}
                <div className="flex-1 min-w-0">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {loadingProds ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="bg-white dark:bg-[#1b2133] rounded-xl overflow-hidden animate-pulse">
                                    <div className="bg-slate-200 dark:bg-slate-700 h-[210px]" />
                                    <div className="p-3 space-y-2">
                                        <div className="bg-slate-200 dark:bg-slate-700 h-3 w-3/4 rounded" />
                                        <div className="bg-slate-200 dark:bg-slate-700 h-3 w-full rounded" />
                                        <div className="bg-slate-200 dark:bg-slate-700 h-4 w-1/2 rounded" />
                                    </div>
                                </div>
                            ))
                        ) : products.length === 0 ? (
                            <div className="col-span-full flex items-center justify-center bg-white dark:bg-[#1b2133] rounded-xl h-[280px] text-slate-400 text-sm">
                                Chưa có sản phẩm trong danh mục này.
                            </div>
                        ) : (
                            <>
                                {products.map((product) => (
                                    <div key={product.id} className="rounded-xl overflow-hidden border border-slate-100 dark:border-white/5 shadow-sm">
                                        <ProductCard p={product} accent={accentColor} />
                                    </div>
                                ))}
                                {/* Empty placeholders to keep grid full */}
                                {products.length < 8 && Array.from({ length: 8 - products.length }).map((_, i) => (
                                    <div key={`empty-${i}`} className="hidden lg:block rounded-xl bg-slate-50/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/5 min-h-[280px]" />
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}