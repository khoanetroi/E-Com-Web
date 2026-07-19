"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface BrandLogo {
    brand_name: string;
    logo_url: string | null;
}

export function BrandMarquee() {
    const supabase = useMemo(() => createClient(), []);
    const [brands, setBrands] = useState<BrandLogo[]>([]);

    useEffect(() => {
        supabase
            .from("brand_logos")
            .select("brand_name, logo_url")
            .not("logo_url", "is", null)
            .order("brand_name")
            .then(({ data }) => {
                if (data && data.length > 0) setBrands(data as BrandLogo[]);
            });
    }, [supabase]);

    if (brands.length === 0) return null;

    const ITEM_WIDTH = 224;
    const SPEED = 50;
    const trackPx = brands.length * ITEM_WIDTH;
    const duration = Math.max(12, Math.round(trackPx / SPEED));

    const doubled = [...brands, ...brands];

    return (
        <section className="py-10 bg-slate-50 dark:bg-[#161c2a] border-t border-slate-200 dark:border-white/5">
            <div className="container mx-auto max-w-7xl px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        Đối tác & Thương hiệu <span className="text-electric-orange">Hàng đầu</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
                        Phân phối chính hãng các thương hiệu nổi tiếng thế giới
                    </p>
                </div>

                {/* Ticker — nằm trong container, overflow hidden */}
                <div
                    className="relative overflow-hidden rounded-xl"
                    style={{
                        maskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
                        WebkitMaskImage: "linear-gradient(to right, transparent, black 5%, black 95%, transparent)",
                    }}
                >
                    <div
                        className="flex w-max"
                        style={{ animation: `marquee ${duration}s linear infinite` }}
                    >
                        {doubled.map((brand, i) => (
                            <Link
                                key={i}
                                href={`/products?brand=${encodeURIComponent(brand.brand_name)}`}
                                title={`Xem sản phẩm ${brand.brand_name}`}
                                style={{ width: `${ITEM_WIDTH - 24}px`, margin: "0 12px" }}
                                className="flex-shrink-0 h-[88px] bg-white dark:bg-[#1b2133] rounded-xl border border-slate-200 dark:border-white/5 flex items-center justify-center p-5 hover:border-electric-orange hover:shadow-lg transition-all duration-300 group"
                            >
                                {brand.logo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={brand.logo_url}
                                        alt={brand.brand_name}
                                        className="max-w-full max-h-[52px] object-contain transition-all duration-500"
                                    />
                                ) : (
                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white transition-colors text-center leading-tight">
                                        {brand.brand_name}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
