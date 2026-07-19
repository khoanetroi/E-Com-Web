"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Package, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface RelatedProduct {
    id: string;
    slug: string;
    name: string;
    brand: string;
    origin: string;
    thumbnail: string;
    min_price: number;
    max_price: number;
    discount_percent?: number | null;
    total_stock: number;
    variant_count: number;
}

function formatVND(value: number) {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function RelatedProductCard({ product }: { product: RelatedProduct }) {
    const dp = product.discount_percent || 0;
    const minPrice = dp > 0 ? product.min_price * (1 - dp / 100) : product.min_price;
    const maxPrice = dp > 0 ? product.max_price * (1 - dp / 100) : product.max_price;
    const isOutOfStock = product.total_stock === 0;

    return (
        <Link
            href={product.slug ? `/${product.slug}` : "#"}
            className="group relative bg-white dark:bg-[#1c212c] rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm hover:border-electric-orange dark:hover:border-orange-500/50 hover:shadow-[0_8px_24px_rgba(249,115,22,0.1)] transition-all duration-300 overflow-hidden flex flex-col"
        >
            {/* Discount badge */}
            {dp > 0 && !isOutOfStock && (
                <span className="absolute top-3 left-3 z-10 bg-[#ff424e] text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm leading-none">
                    -{dp}%
                </span>
            )}

            {/* Image */}
            <div className="relative aspect-square w-full bg-transparent p-4 flex items-center justify-center">
                {product.thumbnail ? (
                    <div className="relative w-full h-[160px]">
                        <Image
                            src={product.thumbnail}
                            alt={product.name}
                            fill
                            className="object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500"
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        />
                        {/* Hover overlay */}
                        <div className="absolute inset-0 flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <span className="bg-white/95 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[12px] font-semibold px-4 py-1.5 rounded-full shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                <Eye className="w-3.5 h-3.5" />
                                Xem chi tiết
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="w-full h-[160px] flex items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                        <Package className="h-12 w-12 stroke-1" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 pt-2 flex flex-col flex-1">
                <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1 truncate">
                    {product.brand}
                </p>
                <h3 className="text-[13px] sm:text-[14px] font-bold text-slate-800 dark:text-slate-100 leading-snug line-clamp-2 h-[40px] group-hover:text-electric-orange dark:group-hover:text-orange-400 transition-colors">
                    {product.name}
                </h3>

                {/* Stock */}
                <div className="flex items-center gap-1.5 mt-2 mb-3">
                    {isOutOfStock ? (
                        <>
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            <span className="text-[11px] font-bold text-slate-400">Hết hàng</span>
                        </>
                    ) : product.total_stock <= 5 ? (
                        <>
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                            <span className="text-[11px] font-bold text-orange-500">Sắp hết</span>
                        </>
                    ) : (
                        <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-[11px] font-bold text-emerald-500">Sẵn hàng</span>
                        </>
                    )}
                </div>

                <div className="flex-1" />

                {/* Price */}
                <div className="mt-auto bg-[#f8f9fa] dark:bg-slate-800/40 rounded-xl p-2.5">
                    {isOutOfStock ? (
                        <span className="text-sm font-bold text-slate-400">Đang cập nhật</span>
                    ) : (
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-[14px] font-bold text-red-600 dark:text-red-500 tracking-tight">
                                {formatVND(minPrice)}
                            </span>
                            {minPrice !== maxPrice && (
                                <>
                                    <span className="text-[12px] text-slate-400">~</span>
                                    <span className="text-[12px] text-slate-500 dark:text-slate-400">
                                        {formatVND(maxPrice)}
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}

interface RelatedProductsProps {
    currentProductId: string;
    brand: string;
    origin: string;
}

export function RelatedProducts({ currentProductId, brand, origin }: RelatedProductsProps) {
    const supabase = createClient();
    const [products, setProducts] = useState<RelatedProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [startIndex, setStartIndex] = useState(0);

    const VISIBLE = 4; // desktop visible cards

    useEffect(() => {
        async function fetchRelated() {
            setLoading(true);

            // Query: same brand OR same origin, excluding current product
            // Prioritize same brand first, then supplement with same origin
            const { data } = await supabase
                .rpc("get_related_products", {
                    p_product_id: currentProductId,
                    p_brand: brand,
                    p_origin: origin,
                    p_limit: 12,
                })
                .select("*");

            if (data && data.length > 0) {
                // RPC có thể không trả slug → fetch slug riêng
                const needSlug = data.filter((p: any) => !p.slug);
                if (needSlug.length > 0) {
                    const ids = needSlug.map((p: any) => p.id);
                    const { data: slugData } = await supabase
                        .from("products")
                        .select("id, slug")
                        .in("id", ids);

                    if (slugData) {
                        const slugMap = new Map(slugData.map((s: any) => [s.id, s.slug]));
                        data.forEach((p: any) => {
                            if (!p.slug && slugMap.has(p.id)) {
                                p.slug = slugMap.get(p.id);
                            }
                        });
                    }
                }
                setProducts(data.filter((p: any) => p.slug));
            } else {
                // Fallback: simple brand/origin query without RPC
                const { data: branded } = await supabase
                    .from("product_variants")
                    .select(`
                        product_id,
                        price,
                        stock,
                        products!inner(id, name, brand, origin, thumbnail, images, discount_percent, slug)
                    `)
                    .neq("products.id", currentProductId)
                    .or(`products.brand.eq.${brand},products.origin.eq.${origin}`)
                    .limit(60);

                if (branded && branded.length > 0) {
                    // Aggregate by product
                    const map = new Map<string, RelatedProduct>();
                    branded.forEach((row: any) => {
                        const p = row.products;
                        if (!p || p.id === currentProductId || !p.slug) return;
                        if (!map.has(p.id)) {
                            map.set(p.id, {
                                id: p.id,
                                slug: p.slug,
                                name: p.name,
                                brand: p.brand,
                                origin: p.origin,
                                thumbnail: p.thumbnail,
                                discount_percent: p.discount_percent,
                                min_price: row.price,
                                max_price: row.price,
                                total_stock: row.stock,
                                variant_count: 1,
                            });
                        } else {
                            const existing = map.get(p.id)!;
                            existing.min_price = Math.min(existing.min_price, row.price);
                            existing.max_price = Math.max(existing.max_price, row.price);
                            existing.total_stock += row.stock;
                            existing.variant_count += 1;
                        }
                    });

                    // Sort: same brand first
                    const list = Array.from(map.values()).sort((a, b) => {
                        const aMatch = a.brand === brand ? 0 : 1;
                        const bMatch = b.brand === brand ? 0 : 1;
                        return aMatch - bMatch;
                    });

                    setProducts(list.slice(0, 12));
                }
            }

            setLoading(false);
        }

        if (currentProductId && brand) {
            fetchRelated();
        }
    }, [currentProductId, brand, origin]);

    if (loading) {
        return (
            <div className="mt-16">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-7 w-7 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                    <div className="h-6 w-48 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse aspect-[3/4]" />
                    ))}
                </div>
            </div>
        );
    }

    if (products.length === 0) return null;

    const canPrev = startIndex > 0;
    const canNext = startIndex + VISIBLE < products.length;

    const visibleProducts = products.slice(startIndex, startIndex + VISIBLE);

    return (
        <section className="mt-16 pt-10 border-t border-gray-100 dark:border-white/5">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1 h-7 rounded-full bg-electric-orange" />
                    <h2 className="text-lg sm:text-xl font-black text-industrial-black dark:text-slate-100 uppercase tracking-wide">
                        Sản phẩm liên quan
                    </h2>
                    <span className="text-sm text-slate-400 font-medium hidden sm:inline">
                        ({products.length} sản phẩm)
                    </span>
                </div>

                {/* Nav Arrows */}
                {products.length > VISIBLE && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setStartIndex(i => Math.max(0, i - VISIBLE))}
                            disabled={!canPrev}
                            className={cn(
                                "h-9 w-9 rounded-full border flex items-center justify-center transition-all duration-200",
                                canPrev
                                    ? "border-electric-orange text-electric-orange hover:bg-electric-orange hover:text-white"
                                    : "border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                            )}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setStartIndex(i => Math.min(products.length - VISIBLE, i + VISIBLE))}
                            disabled={!canNext}
                            className={cn(
                                "h-9 w-9 rounded-full border flex items-center justify-center transition-all duration-200",
                                canNext
                                    ? "border-electric-orange text-electric-orange hover:bg-electric-orange hover:text-white"
                                    : "border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                            )}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Product Grid — desktop: slide window; mobile: horizontal scroll */}
            <div className="hidden sm:grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 transition-all duration-300">
                {visibleProducts.map(p => (
                    <RelatedProductCard key={p.id} product={p} />
                ))}
            </div>

            {/* Mobile: horizontal scroll */}
            <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x snap-mandatory">
                {products.map(p => (
                    <div key={p.id} className="snap-start flex-shrink-0 w-[170px]">
                        <RelatedProductCard product={p} />
                    </div>
                ))}
            </div>

            {/* Dots indicator */}
            {products.length > VISIBLE && (
                <div className="hidden sm:flex justify-center gap-1.5 mt-6">
                    {Array.from({ length: Math.ceil(products.length / VISIBLE) }).map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setStartIndex(i * VISIBLE)}
                            className={cn(
                                "h-1.5 rounded-full transition-all duration-300",
                                Math.floor(startIndex / VISIBLE) === i
                                    ? "w-6 bg-electric-orange"
                                    : "w-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300"
                            )}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
