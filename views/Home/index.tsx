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

const ICON_MAP: Record<string, any> = {
    Zap: Zap,
    Gauge: Gauge,
    Wind: Wind,
    Thermometer: Thermometer,
    Settings: Settings,
    LayoutGrid: LayoutGrid,
};

export default function HomePage() {
    const supabase = React.useMemo(() => createClient(), []);
    const [featuredSettings, setFeaturedSettings] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchSettings = async () => {
            const { data, error } = await supabase
                .from("home_featured_categories")
                .select(`
                    *,
                    categories!category_id (
                        name,
                        slug
                    )
                `)
                .order("order_index");

            if (error) {
                console.error("Error fetching homepage settings:", error);
                // Fallback to defaults if table doesn't exist yet
                setFeaturedSettings([
                    { order_index: 0, accent_color: "bg-red-600", icon_name: "Gauge", categories: { name: "Đồng hồ đo điện", slug: "dong-ho" }, pinned_product_ids: [] },
                    { order_index: 1, accent_color: "bg-blue-600", icon_name: "Wind", categories: { name: "Thiết bị điện tử", slug: "thiet-bi-dien-tu" }, pinned_product_ids: [] },
                    { order_index: 2, accent_color: "bg-orange-500", icon_name: "Thermometer", categories: { name: "Thiết bị đo nhiệt độ", slug: "ngan" }, pinned_product_ids: [] },
                ]);
            } else if (data && data.length > 0) {
                setFeaturedSettings(data);
            }
            setLoading(false);
        };
        fetchSettings();
    }, [supabase]);

    return (
        <DefaultLayout>
            <div className="bg-[#f5f5f7] dark:bg-[#0f1118] min-h-screen">
                <HomeHero />
                <TrustBadges />
                <FlashSale />

                {!loading && featuredSettings.map((item, index) => {
                    const IconComp = ICON_MAP[item.icon_name] || Zap;
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
