"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Zap, ArrowRight, Flame } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { createClient } from "@/lib/supabase/client";

export function FlashSale() {
    const supabase = createClient();
    const [campaign, setCampaign] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [emblaRef] = useEmblaCarousel({ align: "start", dragFree: true });

    useEffect(() => {
        const fetchActiveCampaign = async () => {
            const now = new Date().toISOString();

            // Find all active campaigns
            const { data: activeCampaigns } = await supabase
                .from("campaigns")
                .select("*")
                .eq("is_active", true)
                .lte("start_time", now)
                .gte("end_time", now)
                .order("end_time", { ascending: true });

            if (activeCampaigns && activeCampaigns.length > 0) {
                // Loop through active campaigns to find one that actually has items
                for (const potentialCampaign of activeCampaigns) {
                    const { data: itemsData } = await supabase
                        .from("campaign_items")
                        .select("*, products(*), product_variants(price)")
                        .eq("campaign_id", potentialCampaign.id);

                    if (itemsData && itemsData.length > 0) {
                        setCampaign(potentialCampaign);
                        setProducts(itemsData);

                        // Calculate initial time left in seconds
                        const end = new Date(potentialCampaign.end_time).getTime();
                        setTimeLeft(Math.floor((end - new Date().getTime()) / 1000));

                        break; // Stop looking once we found a campaign with products
                    }
                }
            }
        };

        fetchActiveCampaign();
    }, [supabase]);

    useEffect(() => {
        if (!campaign) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setCampaign(null); // Hide campaign when time is up
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [campaign]);

    const formatTime = (seconds: number) => {
        if (seconds < 0) seconds = 0;
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return { d, h, m, s };
    };

    if (!campaign || products.length === 0) return null;

    const { d, h, m, s } = formatTime(timeLeft);

    return (
        <section className="py-8 bg-slate-50 dark:bg-industrial-black">
            <div className="container mx-auto max-w-7xl px-4">

                {/* ===== Header Strip ===== */}
                <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-t-xl px-4 py-3 md:px-5 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6 w-full md:w-auto">
                        {/* Title */}
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5 md:w-6 md:h-6 text-yellow-300 shrink-0" fill="currentColor" />
                            <span className="text-white font-black text-xl md:text-2xl uppercase tracking-wider whitespace-nowrap">
                                {campaign.name}
                            </span>
                        </div>

                        {/* Countdown */}
                        <div className="flex items-center gap-1 font-mono">
                            <div className="bg-white text-red-600 font-bold text-sm md:text-base px-2 py-1 rounded min-w-[28px] text-center leading-tight">
                                {d.toString().padStart(2, "0")}
                            </div>
                            <span className="text-white/80 text-[10px] font-semibold">ngày</span>
                            <div className="bg-white text-red-600 font-bold text-sm md:text-base px-2 py-1 rounded min-w-[28px] text-center leading-tight">
                                {h.toString().padStart(2, "0")}
                            </div>
                            <span className="text-white font-bold text-sm">:</span>
                            <div className="bg-white text-red-600 font-bold text-sm md:text-base px-2 py-1 rounded min-w-[28px] text-center leading-tight">
                                {m.toString().padStart(2, "0")}
                            </div>
                            <span className="text-white font-bold text-sm">:</span>
                            <div className="bg-white text-red-600 font-bold text-sm md:text-base px-2 py-1 rounded min-w-[28px] text-center leading-tight">
                                {s.toString().padStart(2, "0")}
                            </div>
                        </div>
                    </div>

                    {/* View all */}
                    <Link href="/products" className="text-white text-sm font-semibold flex items-center gap-1 hover:underline transition-all group whitespace-nowrap hidden md:flex">
                        Xem tất cả <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>

                {/* ===== Product Cards Carousel ===== */}
                <div className="bg-white dark:bg-[#1a1f2e] rounded-b-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-6">
                    <div className="overflow-hidden" ref={emblaRef}>
                        <div className="flex gap-4 md:gap-5 pb-4 pt-1">
                            {products.map((item) => {
                                const originalPrice = item.product_variants?.price || 0;
                                const hasOriginalPrice = originalPrice > item.sale_price;
                                const discountPercent = hasOriginalPrice
                                    ? Math.round(((originalPrice - item.sale_price) / originalPrice) * 100)
                                    : 0;

                                const stockQty = item.stock_quantity ?? 100;
                                const soldCount = item.sold_count || 0;
                                const soldPercent = Math.min(Math.round((soldCount / stockQty) * 100), 100);

                                return (
                                    <Link
                                        href={`/${item.products?.slug || item.product_id}`}
                                        key={item.id}
                                        className="flex-[0_0_80%] sm:flex-[0_0_45%] md:flex-[0_0_30%] lg:flex-[0_0_22%] min-w-0 flex flex-col bg-white dark:bg-[#1e2330] 
                                        border border-slate-200 dark:border-slate-700/50 rounded-xl
                                        transition-all duration-300 group relative
                                        hover:-translate-y-1
                                        hover:border-electric-orange dark:hover:border-electric-orange hover:shadow-lg dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden"
                                    >
                                        {/* Sharp Discount Ribbon */}
                                        {discountPercent > 0 && (
                                            <div className="absolute top-2 right-2 z-10 px-2 py-1 bg-red-500 text-white font-bold rounded flex items-center justify-center shadow-sm">
                                                <span className="text-[11px] leading-none">-{discountPercent}%</span>
                                            </div>
                                        )}

                                        {/* Thumbnail */}
                                        <div className="aspect-square relative overflow-hidden bg-white dark:bg-[#151924] border-b border-slate-100 dark:border-slate-800/50">
                                            {item.products?.thumbnail ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={item.products.thumbnail}
                                                    alt={item.products.name}
                                                    className="w-full h-full object-contain p-4 mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                                                    <Zap className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Info Container */}
                                        <div className="p-3 md:p-4 flex flex-col flex-1">
                                            {/* Product Name */}
                                            <h3 className="text-slate-800 dark:text-slate-200 text-sm font-bold line-clamp-2 h-10 mb-3 group-hover:text-electric-orange dark:group-hover:text-electric-orange transition-colors leading-snug">
                                                {item.products?.name}
                                            </h3>

                                            {/* Pricing Group */}
                                            <div className="mt-auto flex flex-col pt-2 border-t border-slate-100 dark:border-slate-700/50">

                                                {/* Original Price */}
                                                <div className="h-4 flex justify-end mb-0.5">
                                                    {hasOriginalPrice && (
                                                        <span className="text-slate-400 text-[11px] font-mono line-through">
                                                            {new Intl.NumberFormat('vi-VN').format(originalPrice)}₫
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                                        Giá Flash
                                                    </span>
                                                    <span className="text-red-500 font-black text-lg md:text-xl font-mono tracking-tight">
                                                        {new Intl.NumberFormat('vi-VN').format(item.sale_price)}
                                                        <span className="text-[13px] align-top ml-0.5 underline">₫</span>
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Clean Progress Bar */}
                                            <div className="mt-4 flex flex-col gap-1.5 mb-1 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                        <Zap className="w-3 h-3 text-electric-orange fill-electric-orange" /> BÁN {soldCount}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                                                        CÒN: {stockQty - soldCount}
                                                    </span>
                                                </div>

                                                {/* Progress Container */}
                                                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mx-auto">
                                                    {/* Fill */}
                                                    <div
                                                        className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                                                        style={{ width: `${Math.max(soldPercent, 5)}%` }} // Ensure minimum bar visibility
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Mobile View All */}
                <div className="mt-4 md:hidden flex justify-center">
                    <Link href="/products" className="text-red-600 bg-red-50 dark:bg-red-950/30 text-sm font-bold flex items-center gap-2 transition-all px-6 py-2 rounded border border-red-200 dark:border-red-900/50">
                        Xem tất cả Flash Sale <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

            </div>
        </section>
    );
}
