import ProductDetailPage from "@/views/Admin/Products/Detail";
import DefaultLayout from "@/components/layout/DefaultLayout";
import { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import Link from "next/link";

const SITE_URL = "https://www.telectric.vn";

interface PageProps {
    params: Promise<{ slug: string }>;
}

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    );
}

// Giúp next-sitemap tạo URL cho từng sản phẩm trong sitemap.xml
export async function generateStaticParams() {
    const supabase = getSupabase();
    const { data: products } = await supabase
        .from("products")
        .select("slug");

    return (products || []).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = getSupabase();

    const { data: product } = await supabase
        .from("products")
        .select("name, description, thumbnail, brand")
        .eq("slug", slug)
        .single();

    if (!product) {
        return { title: "Sản phẩm không tồn tại | TELECTRIC" };
    }

    const title = `${product.name} | TELECTRIC`;
    const description = product.description
        ? product.description.slice(0, 160)
        : `Mua ${product.name} chính hãng${product.brand ? ` ${product.brand}` : ""} tại TELECTRIC với giá ưu đãi. Bảo hành chính hãng, giao hàng toàn quốc.`;

    return {
        title,
        description,
        alternates: {
            canonical: `${SITE_URL}/${slug}`,
        },
        openGraph: {
            title,
            description,
            type: "article",
            url: `${SITE_URL}/${slug}`,
            images: product.thumbnail ? [{ url: product.thumbnail, width: 800, height: 800, alt: product.name }] : [],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: product.thumbnail ? [product.thumbnail] : [],
        },
    };
}

function fmtPrice(n: number) {
    return n.toLocaleString("vi-VN") + "₫";
}

export default async function Page({ params }: PageProps) {
    const { slug } = await params;
    const supabase = getSupabase();

    // Fetch FULL product data server-side (cho SEO)
    const { data: product } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .single();

    if (!product) notFound();

    // Fetch variants server-side
    const { data: variants } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product.id)
        .order("created_at");

    // Fetch product categories for breadcrumb
    const { data: categoryMappings } = await supabase
        .from("product_categories_mapping")
        .select("category_id, categories(id, name, slug, parent_id)")
        .eq("product_id", product.id)
        .limit(1);

    const category = categoryMappings?.[0]?.categories as any;

    const safeVariants = variants || [];
    const minPrice = safeVariants.length > 0 ? Math.min(...safeVariants.map(v => {
        const dp = v.discount_percent || 0;
        return dp > 0 ? v.price * (1 - dp / 100) : v.price;
    })) : 0;
    const maxPrice = safeVariants.length > 0 ? Math.max(...safeVariants.map(v => v.price)) : 0;

    // ── Structured Data: Product (JSON-LD) cho Google Rich Snippets ──
    const productJsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || "Sản phẩm chính hãng tại TELECTRIC",
        image: product.thumbnail || undefined,
        url: `${SITE_URL}/${product.slug}`,
        brand: {
            "@type": "Brand",
            name: product.brand || "TELECTRIC",
        },
        ...(product.origin && { countryOfOrigin: { "@type": "Country", name: product.origin } }),
        ...(safeVariants.length > 0 && {
            offers: {
                "@type": "AggregateOffer",
                priceCurrency: "VND",
                lowPrice: minPrice,
                highPrice: maxPrice,
                offerCount: safeVariants.length,
                availability: safeVariants.some(v => v.stock > 0)
                    ? "https://schema.org/InStock"
                    : "https://schema.org/OutOfStock",
                seller: {
                    "@type": "Organization",
                    name: "TELECTRIC",
                    url: SITE_URL,
                },
            },
        }),
    };

    // ── Structured Data: BreadcrumbList ──
    const breadcrumbItems = [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Sản phẩm", item: `${SITE_URL}/products` },
    ];
    if (category) {
        breadcrumbItems.push({
            "@type": "ListItem",
            position: 3,
            name: category.name,
            item: `${SITE_URL}/products?category=${category.slug}`,
        });
        breadcrumbItems.push({
            "@type": "ListItem",
            position: 4,
            name: product.name,
            item: `${SITE_URL}/${product.slug}`,
        });
    } else {
        breadcrumbItems.push({
            "@type": "ListItem",
            position: 3,
            name: product.name,
            item: `${SITE_URL}/${product.slug}`,
        });
    }

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems,
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />

            {/* SEO: Server-rendered product content visible cho Google */}
            <div className="sr-only" role="article" aria-label={product.name}>
                {/* Breadcrumb navigation */}
                <nav aria-label="Breadcrumb">
                    <ol>
                        <li><Link href="/">Trang chủ</Link></li>
                        <li><Link href="/products">Sản phẩm</Link></li>
                        {category && (
                            <li><Link href={`/products?category=${category.slug}`}>{category.name}</Link></li>
                        )}
                        <li>{product.name}</li>
                    </ol>
                </nav>

                <h1>{product.name}</h1>
                <p>Thương hiệu: {product.brand || "TELECTRIC"} | Xuất xứ: {product.origin || "Chính hãng"}</p>
                <p>{product.description}</p>
                
                {safeVariants.length > 0 && (
                    <div>
                        <h2>Thông tin giá và phiên bản</h2>
                        <p>Giá từ: {fmtPrice(minPrice)} {maxPrice > minPrice ? `đến ${fmtPrice(maxPrice)}` : ""}</p>
                        <ul>
                            {safeVariants.map(v => (
                                <li key={v.id}>
                                    SKU: {v.sku} - Giá: {fmtPrice(v.price)}
                                    {v.discount_percent > 0 && ` (Giảm ${v.discount_percent}%)`}
                                    {Object.entries(v.attributes || {}).map(([k, val]) => ` | ${k}: ${val}`).join("")}
                                    {v.stock > 0 ? " - Còn hàng" : " - Hết hàng"}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            <ProductDetailPage
                productSlug={slug}
                initialProduct={product}
                initialVariants={safeVariants}
            />
        </>
    );
}
