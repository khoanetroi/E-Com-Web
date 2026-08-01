"use client";

import React from "react";
import DefaultLayout from "@/components/layout/DefaultLayout";
import { HomeHero } from "./components/HomeHero";
import { TrustBadges } from "./components/TrustBadges";
import { FlashSale } from "./components/FlashSale";
import { CategorySection } from "./components/CategorySection";
import { BrandMarquee } from "./components/BrandMarquee";
import { Gauge, Thermometer, Wind, Zap, Settings, LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Màu sắc và icon mặc định cho từng section danh mục
const ACCENT_COLORS = [
    "bg-red-600", "bg-blue-600", "bg-orange-500",
    "bg-emerald-600", "bg-purple-600", "bg-cyan-600",
];
const ICON_LIST = [Gauge, Wind, Thermometer, Zap, Settings, LayoutGrid];

export default function HomePage() {
    const supabase = React.useMemo(() => createClient(), []);
    const [categorySettings, setCategorySettings] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchCategories = async () => {
            // Lấy danh mục gốc (không có parent_id) từ bảng categories
            const { data, error } = await supabase
                .from("categories")
                .select("id, name, slug")
                .is("parent_id", null)
                .order("created_at", { ascending: true });

            if (error) {
                console.error("Error fetching categories:", error);
                setCategorySettings([]);
            } else if (data && data.length > 0) {
                // Map mỗi danh mục gốc thành 1 section trên trang chủ
                const mapped = data.map((cat, index) => ({
                    id: cat.id,
                    accent_color: ACCENT_COLORS[index % ACCENT_COLORS.length],
                    categories: { name: cat.name, slug: cat.slug },
                    pinned_product_ids: [],
                    banner_url: null,
                    section_title: null,
                    pinned_brand_names: [],
                }));
                setCategorySettings(mapped);
            }
            setLoading(false);
        };
        fetchCategories();
    }, [supabase]);

    return (
        <DefaultLayout>
            <div className="bg-[#f5f5f7] dark:bg-[#0f1118] min-h-screen">
                <HomeHero />
                <TrustBadges />
                <FlashSale />

                {!loading && categorySettings.map((item, index) => {
                    const IconComp = ICON_LIST[index % ICON_LIST.length];
                    return (
                        <CategorySection
                            key={item.id || index}
                            categoryName={item.categories?.name || "Category"}
                            categorySlug={item.categories?.slug || ""}
                            accentColor={item.accent_color}
                            accentBorderColor={item.accent_color.replace("bg-", "border-")}
                            icon={<IconComp className="w-4 h-4" />}
                            pinnedProductIds={item.pinned_product_ids || []}
                            bannerUrl={item.banner_url || null}
                            sectionTitle={item.section_title || null}
                            pinnedBrandNames={item.pinned_brand_names || []}
                        />
                    );
                })}

                <BrandMarquee />
            </div>
        </DefaultLayout>
    );
}
