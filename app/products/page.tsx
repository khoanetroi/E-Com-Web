import { Metadata } from "next";
import { createStaticClient } from "@/lib/supabase/server";
import ProductsPage from "@/views/Products";
import Link from "next/link";

const SITE_URL = "https://www.telectric.vn";

export const metadata: Metadata = {
    title: "Sản Phẩm | TELECTRIC - Dụng Cụ Đo Lường Chính Hãng",
    description:
        "Khám phá toàn bộ dụng cụ đo lường điện chính hãng tại TELECTRIC. Ampe kìm, đồng hồ vạn năng, máy đo điện trở cách điện, nhiệt kế hồng ngoại và nhiều sản phẩm khác với giá tốt nhất thị trường.",
    alternates: {
        canonical: `${SITE_URL}/products`,
    },
    openGraph: {
        title: "Sản Phẩm | TELECTRIC - Dụng Cụ Đo Lường Chính Hãng",
        description:
            "Khám phá toàn bộ dụng cụ đo lường điện chính hãng tại TELECTRIC. Ampe kìm, đồng hồ vạn năng, máy đo điện trở và nhiều sản phẩm khác.",
        type: "website",
        url: `${SITE_URL}/products`,
    },
    twitter: {
        card: "summary_large_image",
        title: "Sản Phẩm | TELECTRIC - Dụng Cụ Đo Lường Chính Hãng",
        description:
            "Khám phá toàn bộ dụng cụ đo lường điện chính hãng tại TELECTRIC.",
    },
};

function fmtPrice(n: number) {
    return n ? n.toLocaleString("vi-VN") + "₫" : "Liên hệ";
}

export default async function Page() {
    const supabase = await createStaticClient();

    // ── Server-side: Fetch products for SEO ──
    const { data: allProducts } = await supabase
        .from("products")
        .select("id, name, slug, brand, origin, thumbnail, description")
        .order("created_at", { ascending: false })
        .limit(50);

    const products = allProducts || [];

    // Fetch variant prices
    const productIds = products.map((p) => p.id);
    const { data: variants } = await supabase
        .from("product_variants")
        .select("product_id, price, discount_percent")
        .in("product_id", productIds);

    const priceMap: Record<string, { min: number }> = {};
    (variants || []).forEach((v: any) => {
        const dp = v.discount_percent || 0;
        const finalPrice = dp > 0 ? v.price * (1 - dp / 100) : v.price;
        if (!priceMap[v.product_id]) {
            priceMap[v.product_id] = { min: finalPrice };
        } else {
            priceMap[v.product_id].min = Math.min(priceMap[v.product_id].min, finalPrice);
        }
    });

    // Fetch categories for breadcrumb links
    const { data: categories } = await supabase
        .from("categories")
        .select("id, name, slug, parent_id")
        .order("name");

    // Fetch distinct brands
    const { data: brandData } = await supabase
        .from("products")
        .select("brand")
        .not("brand", "is", null);
    const uniqueBrands = [...new Set((brandData || []).map((d: any) => d.brand).filter(Boolean))].sort() as string[];

    // JSON-LD: BreadcrumbList
    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Trang chủ",
                item: SITE_URL,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Sản phẩm",
                item: `${SITE_URL}/products`,
            },
        ],
    };

    // JSON-LD: ItemList
    const itemListJsonLd = {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Tất cả sản phẩm tại TELECTRIC",
        numberOfItems: products.length,
        itemListElement: products.slice(0, 20).map((p, idx) => ({
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
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
            />

            {/* SEO: Server-rendered product listing for Google */}
            <div className="sr-only" role="region" aria-label="Danh sách sản phẩm TELECTRIC">
                <h1>Sản Phẩm Dụng Cụ Đo Lường Điện Chính Hãng - TELECTRIC</h1>
                <p>
                    Tổng hợp toàn bộ thiết bị đo lường điện chính hãng tại TELECTRIC.
                    Đồng hồ vạn năng, ampe kìm, máy đo điện trở cách điện, nhiệt kế hồng ngoại,
                    máy đo khoảng cách laser từ Fluke, Hioki, Kyoritsu, Sanwa, APECH, Yokogawa.
                </p>

                {/* Danh mục */}
                <nav aria-label="Danh mục sản phẩm">
                    <h2>Danh mục</h2>
                    <ul>
                        {(categories || []).filter((c: any) => !c.parent_id).map((cat: any) => (
                            <li key={cat.id}>
                                <Link href={`/products?category=${cat.slug}`}>{cat.name}</Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Thương hiệu */}
                <nav aria-label="Lọc theo thương hiệu">
                    <h2>Thương hiệu</h2>
                    <ul>
                        {uniqueBrands.map((brand) => (
                            <li key={brand}>
                                <Link href={`/products?brand=${encodeURIComponent(brand)}`}>{brand}</Link>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Sản phẩm */}
                <section aria-label="Danh sách sản phẩm">
                    <h2>Tất cả sản phẩm ({products.length})</h2>
                    <ul>
                        {products.map((p) => {
                            const price = priceMap[p.id];
                            return (
                                <li key={p.id}>
                                    <Link href={`/${p.slug}`}>
                                        <h3>{p.name}</h3>
                                        {p.brand && <span>Thương hiệu: {p.brand}</span>}
                                        {p.origin && <span> | Xuất xứ: {p.origin}</span>}
                                        {price && <span> | Giá: {fmtPrice(price.min)}</span>}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            </div>

            {/* Client-side interactive UI */}
            <ProductsPage />
        </>
    );
}
