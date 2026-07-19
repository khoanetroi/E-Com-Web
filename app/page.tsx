import { Metadata } from "next";
import { createStaticClient } from "@/lib/supabase/server";
import DefaultLayout from "@/components/layout/DefaultLayout";
import HomePage from "@/views/Home";
import Link from "next/link";

const SITE_URL = "https://www.telectric.vn";

export const metadata: Metadata = {
    title: "TELECTRIC - Chuyên Dụng Cụ Đo Lường Điện Chính Hãng | Giá Tốt Nhất",
    description:
        "TELECTRIC - Nhà phân phối dụng cụ đo lường điện chính hãng hàng đầu Việt Nam. Đồng hồ vạn năng, ampe kìm, máy đo điện trở Fluke, Hioki, Kyoritsu, Sanwa. Cam kết chính hãng, giá tốt nhất, bảo hành uy tín.",
    alternates: {
        canonical: SITE_URL,
    },
    openGraph: {
        title: "TELECTRIC - Chuyên Dụng Cụ Đo Lường Điện Chính Hãng",
        description:
            "Nhà phân phối dụng cụ đo lường điện chính hãng hàng đầu. Đồng hồ vạn năng, ampe kìm, máy đo điện trở Fluke, Hioki, Kyoritsu. Giá tốt nhất thị trường.",
        type: "website",
        siteName: "TELECTRIC",
        url: SITE_URL,
    },
    twitter: {
        card: "summary_large_image",
        title: "TELECTRIC - Chuyên Dụng Cụ Đo Lường Điện Chính Hãng",
        description:
            "Nhà phân phối dụng cụ đo lường điện chính hãng hàng đầu. Giá tốt nhất thị trường.",
    },
};

// Helper: format price for SSR
function fmtPrice(n: number) {
    return n ? n.toLocaleString("vi-VN") + "₫" : "Liên hệ";
}

export default async function Home() {
    const supabase = await createStaticClient();

    // ── Fetch categories for SEO (server-side) ──
    const { data: allCategories } = await supabase
        .from("categories")
        .select("id, name, slug, parent_id")
        .order("created_at", { ascending: true });

    const categories = allCategories || [];
    const rootCategories = categories.filter((c) => !c.parent_id);
    const categoryTree = rootCategories.map((root) => ({
        ...root,
        children: categories.filter((c) => c.parent_id === root.id),
    }));

    // ── Fetch featured products for SEO (server-side) ──
    const { data: featuredProducts } = await supabase
        .from("products")
        .select("id, name, slug, brand, thumbnail, description")
        .order("created_at", { ascending: false })
        .limit(24);

    const products = featuredProducts || [];

    // Fetch variant prices for these products
    const productIds = products.map((p) => p.id);
    const { data: variants } = await supabase
        .from("product_variants")
        .select("product_id, price, discount_percent")
        .in("product_id", productIds);

    const priceMap: Record<string, { min: number; max: number }> = {};
    (variants || []).forEach((v: any) => {
        const dp = v.discount_percent || 0;
        const finalPrice = dp > 0 ? v.price * (1 - dp / 100) : v.price;
        if (!priceMap[v.product_id]) {
            priceMap[v.product_id] = { min: finalPrice, max: finalPrice };
        } else {
            priceMap[v.product_id].min = Math.min(priceMap[v.product_id].min, finalPrice);
            priceMap[v.product_id].max = Math.max(priceMap[v.product_id].max, finalPrice);
        }
    });

    // ── Fetch brands for SEO ──
    const { data: brands } = await supabase
        .from("brand_logos")
        .select("brand_name")
        .not("logo_url", "is", null)
        .order("brand_name");

    // ── JSON-LD: WebSite + SearchAction ──
    const websiteJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "TELECTRIC",
        url: SITE_URL,
        description: "Chuyên cung cấp dụng cụ đo lường điện chính hãng. Fluke, Hioki, Kyoritsu, Sanwa, APECH.",
        potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/products?q={search_term_string}`,
            "query-input": "required name=search_term_string",
        },
    };

    // ── JSON-LD: ItemList for top products ──
    const itemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Sản phẩm nổi bật tại TELECTRIC",
        numberOfItems: products.length,
        itemListElement: products.slice(0, 12).map((p, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            url: `${SITE_URL}/${p.slug}`,
            name: p.name,
        })),
    };

    return (
        <>
            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
            />

            {/* 
                SEO: Server-rendered content cho Google crawler đọc.
                Nội dung này được render server-side, Google thấy đầy đủ.
                User vẫn thấy UI đẹp từ HomePage client component.
            */}
            <div className="sr-only" role="region" aria-label="Nội dung SEO trang chủ TELECTRIC">
                <h1>TELECTRIC - Chuyên Dụng Cụ Đo Lường Điện Chính Hãng</h1>
                <p>
                    TELECTRIC là nhà phân phối uy tín các thiết bị đo lường điện chính hãng tại Việt Nam.
                    Chúng tôi cung cấp đồng hồ vạn năng, ampe kìm, máy đo điện trở cách điện, nhiệt kế hồng ngoại 
                    từ các thương hiệu hàng đầu thế giới như Fluke, Hioki, Kyoritsu, Sanwa, APECH, Yokogawa.
                </p>

                {/* Danh mục sản phẩm */}
                <nav aria-label="Danh mục sản phẩm">
                    <h2>Danh mục sản phẩm</h2>
                    <ul>
                        {categoryTree.map((cat) => (
                            <li key={cat.id}>
                                <Link href={`/products?category=${cat.slug}`}>{cat.name}</Link>
                                {cat.children.length > 0 && (
                                    <ul>
                                        {cat.children.map((sub: any) => (
                                            <li key={sub.id}>
                                                <Link href={`/products?category=${sub.slug}`}>{sub.name}</Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Sản phẩm nổi bật */}
                <section aria-label="Sản phẩm nổi bật">
                    <h2>Sản phẩm nổi bật</h2>
                    <ul>
                        {products.map((p) => {
                            const price = priceMap[p.id];
                            return (
                                <li key={p.id}>
                                    <Link href={`/${p.slug}`}>
                                        <h3>{p.name}</h3>
                                        {p.brand && <span>Thương hiệu: {p.brand}</span>}
                                        {price && <span>Giá: {fmtPrice(price.min)}</span>}
                                        {p.description && <p>{p.description}</p>}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </section>

                {/* Thương hiệu */}
                {brands && brands.length > 0 && (
                    <section aria-label="Thương hiệu đối tác">
                        <h2>Thương hiệu đối tác</h2>
                        <ul>
                            {brands.map((b: any) => (
                                <li key={b.brand_name}>
                                    <Link href={`/products?brand=${encodeURIComponent(b.brand_name)}`}>
                                        {b.brand_name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </div>

            {/* Client-side interactive UI */}
            <HomePage />
        </>
    );
}
