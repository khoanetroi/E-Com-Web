"use client";

import React, { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Zap } from "lucide-react";

interface BrandLogo {
    brand_name: string;
    logo_url?: string | null;
}

const DEFAULT_BRANDS: BrandLogo[] = [
    { brand_name: "Panasonic" },
    { brand_name: "Schneider Electric" },
    { brand_name: "Philips" },
    { brand_name: "Mitsubishi Electric" },
    { brand_name: "LS Electric" },
    { brand_name: "Cadivi" },
    { brand_name: "Sino - Vanlock" },
    { brand_name: "Paragon" },
    { brand_name: "Senko" },
    { brand_name: "Rạng Đông" },
];

export function BrandMarquee() {
    const supabase = useMemo(() => createClient(), []);
    const [brands, setBrands] = useState<BrandLogo[]>(DEFAULT_BRANDS);

    useEffect(() => {
        const loadBrands = async () => {
            try {
                // Ưu tiên lấy từ bảng brand_logos (có logo ảnh)
                const { data: logoData } = await supabase
                    .from("brand_logos")
                    .select("brand_name, logo_url")
                    .not("logo_url", "is", null)
                    .order("brand_name");

                if (logoData && logoData.length > 0) {
                    setBrands(logoData);
                    return;
                }

                // Fallback 1: Lấy danh sách hãng từ bảng products
                const { data: productData } = await supabase
                    .from("products")
                    .select("brand")
                    .not("brand", "is", null);

                if (productData && productData.length > 0) {
                    const uniqueBrands = Array.from(new Set(productData.map(p => p.brand).filter(Boolean)))
                        .map(name => ({ brand_name: name as string, logo_url: null }));
                    
                    if (uniqueBrands.length > 0) {
                        setBrands(uniqueBrands);
                        return;
                    }
                }
            } catch {
                // Giữ default brands
            }
        };
        loadBrands();
    }, [supabase]);

    if (brands.length === 0) return null;

    const ITEM_WIDTH = 220;
    const SPEED = 40;
    const trackPx = Math.max(brands.length, 6) * ITEM_WIDTH;
    const duration = Math.max(16, Math.round(trackPx / SPEED));

    // Double/Triple for smooth marquee loop
    const doubled = [...brands, ...brands, ...brands];

    return (
        <section className="py-10 bg-slate-50 dark:bg-[#121624] border-t border-slate-200 dark:border-white/5">
            <div className="container mx-auto max-w-7xl px-4">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/40 text-electric-orange text-xs font-semibold mb-2">
                        <Zap size={14} />
                        Đối tác chính hãng
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Thương hiệu <span className="text-electric-orange">Hàng đầu</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
                        Phân phối thiết bị điện và công nghiệp từ các nhà sản xuất uy tín thế giới
                    </p>
                </div>

                {/* Ticker */}
                <div
                    className="relative overflow-hidden rounded-xl py-2"
                    style={{
                        maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
                        WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
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
                                className="flex-shrink-0 h-[76px] bg-white dark:bg-[#1a2030] rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-center p-4 hover:border-electric-orange hover:shadow-md transition-all duration-300 group"
                            >
                                {brand.logo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={brand.logo_url}
                                        alt={brand.brand_name}
                                        className="max-w-full max-h-[46px] object-contain transition-transform duration-300 group-hover:scale-105"
                                    />
                                ) : (
                                    <span className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 group-hover:text-electric-orange transition-colors text-center leading-tight">
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
