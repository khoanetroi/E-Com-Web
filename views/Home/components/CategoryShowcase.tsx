"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, ArrowRight, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CategoryShowcaseProps {
    categorySlug: string;
    categoryName: string;
    brandImages: string[];
    bannerColor?: string;
}

export function CategoryShowcase({ categorySlug, categoryName, brandImages, bannerColor = "from-electric-orange to-orange-400" }: CategoryShowcaseProps) {
    const supabase = createClient();
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        const fetchProducts = async () => {
            // First find the category ID
            const { data: catData } = await supabase.from("categories").select("id").eq("slug", categorySlug).single();
            if (catData) {
                // Fetch top 8 products in this category
                const { data } = await supabase
                    .from("products")
                    .select("*, categories(name), slug")
                    .eq("category_id", catData.id)
                    .limit(8);
                if (data) setProducts(data);
            }
        };
        fetchProducts();
    }, [categorySlug, supabase]);

    if (products.length === 0) return null;

    return (
        <section className="py-8 md:py-12 bg-white dark:bg-industrial-black/50 border-t border-slate-200 dark:border-white/5 transition-colors duration-300">
            <div className="container mx-auto max-w-7xl px-4">

                {/* Header */}
                <div className="flex items-center justify-between mb-8 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${bannerColor} text-white`}>
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                            {categoryName}
                        </h2>
                    </div>
                    <Link href={`/products?category=${categorySlug}`} className="text-sm font-semibold text-slate-500 hover:text-electric-orange dark:text-slate-400 dark:hover:text-electric-orange flex items-center gap-1 transition-colors group">
                        Xem tất cả <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Left: Brand Wall & Banner */}
                    <div className="lg:w-1/4 flex-shrink-0 flex flex-col gap-4">
                        <div className={`rounded-xl bg-gradient-to-br ${bannerColor} p-6 text-white min-h-[150px] flex flex-col justify-end shadow-md relative overflow-hidden group`}>
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500 z-10" />
                            <h3 className="text-2xl font-black leading-tight mb-2 relative z-20">Sản phẩm<br />Bán chạy nhất</h3>
                            <Link href={`/products?category=${categorySlug}`} className="text-sm font-bold flex items-center gap-2 hover:translate-x-2 transition-transform w-fit relative z-20">
                                Mua ngay <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Brand Wall Grid */}
                        <div className="bg-slate-50 dark:bg-[#1e2330] p-4 rounded-xl border border-slate-200 dark:border-slate-800 h-full">
                            <h4 className="text-xs uppercase font-bold text-slate-400 mb-4 tracking-wider">Thương hiệu đồng hành</h4>
                            <div className="grid grid-cols-2 gap-3">
                                {brandImages.map((src, idx) => (
                                    <div key={idx} className="bg-white dark:bg-industrial-black rounded-lg aspect-video flex items-center justify-center p-2 border border-slate-100 dark:border-slate-800 hover:border-electric-orange dark:hover:border-electric-orange transition-colors cursor-pointer group">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={src} alt="Brand" className="max-w-[80%] max-h-[80%] object-contain filter grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Product Grid */}
                    <div className="lg:w-3/4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                            {products.map((product) => (
                                <Link
                                    href={`/${product.slug}`}
                                    key={product.id}
                                    className="bg-white dark:bg-[#1e2330] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden relative group/card flex flex-col"
                                >
                                    {/* Thumbnail */}
                                    <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative overflow-hidden flex-shrink-0">
                                        {product.thumbnail ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={product.thumbnail}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Zap className="w-12 h-12 text-slate-300 dark:text-slate-600" />
                                            </div>
                                        )}
                                        {/* Hover Overlay Actions */}
                                        <div className="absolute inset-x-0 bottom-0 p-3 flex justify-center translate-y-full group-hover/card:translate-y-0 opacity-0 group-hover/card:opacity-100 transition-all duration-300 bg-gradient-to-t from-black/60 to-transparent">
                                            <span className="text-white text-xs font-semibold px-3 py-1.5 bg-electric-orange rounded-full shadow-lg">Xem chi tiết</span>
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="p-4 flex-1 flex flex-col justify-between">
                                        <h3 className="text-slate-800 dark:text-slate-200 font-medium text-sm line-clamp-2 mb-3 group-hover/card:text-electric-orange transition-colors">
                                            {product.name}
                                        </h3>
                                        <div className="flex flex-col mt-auto">
                                            <span className="text-base font-black text-electric-orange">
                                                Liên hệ báo giá
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}
