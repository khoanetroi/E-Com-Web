import { MetadataRoute } from "next";
import { createStaticClient } from "@/lib/supabase/server";

export const revalidate = 3600; // Revalidate mỗi 1 giờ (tốt hơn cho SEO so với 0)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = "https://www.telectric.vn";
    const supabase = await createStaticClient();

    // 1. Fetch all published products
    const { data: products } = await supabase
        .from("products")
        .select("slug, updated_at")
        .order("updated_at", { ascending: false });

    // 2. Fetch all published news articles
    const { data: news } = await supabase
        .from("news")
        .select("slug, published_at")
        .eq("is_published", true)
        .order("published_at", { ascending: false });

    // 3. Fetch all categories for category pages
    const { data: categories } = await supabase
        .from("categories")
        .select("slug, parent_id")
        .order("created_at");

    // 4. Fetch distinct brands for brand filter pages
    const { data: brandData } = await supabase
        .from("products")
        .select("brand")
        .not("brand", "is", null);
    const uniqueBrands = [...new Set((brandData || []).map((d: any) => d.brand).filter(Boolean))];

    // 5. Define static routes
    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: `${baseUrl}/products`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.9,
        },
        {
            url: `${baseUrl}/news`,
            lastModified: new Date(),
            changeFrequency: "daily",
            priority: 0.8,
        },
        {
            url: `${baseUrl}/contact`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${baseUrl}/brands`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        {
            url: `${baseUrl}/warranty-check`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.5,
        },
        // Policy pages
        {
            url: `${baseUrl}/chinh-sach/chinh-sach-bao-hanh`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.3,
        },
        {
            url: `${baseUrl}/chinh-sach/chinh-sach-bao-mat`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.3,
        },
        {
            url: `${baseUrl}/chinh-sach/chinh-sach-van-chuyen`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.3,
        },
        {
            url: `${baseUrl}/chinh-sach/giai-quyet-khieu-nai`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.3,
        },
        {
            url: `${baseUrl}/chinh-sach/huong-dan-mua-hang`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.3,
        },
        {
            url: `${baseUrl}/chinh-sach/quy-dinh-chung`,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 0.3,
        },
    ];

    // 6. Map categories to sitemap entries (giúp Google index từng danh mục)
    const categoryEntries: MetadataRoute.Sitemap = (categories || []).map((cat) => ({
        url: `${baseUrl}/products?category=${cat.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: cat.parent_id ? 0.6 : 0.7, // Parent categories have higher priority
    }));

    // 7. Map brands to sitemap entries (giúp Google index từng thương hiệu)
    const brandEntries: MetadataRoute.Sitemap = uniqueBrands.map((brand) => ({
        url: `${baseUrl}/products?brand=${encodeURIComponent(brand)}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
    }));

    // 8. Map products to sitemap entries
    const productEntries: MetadataRoute.Sitemap = (products || []).map((product) => ({
        url: `${baseUrl}/${product.slug}`, // Root level: domain.vn/product-slug
        lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
    }));

    // 9. Map news articles to sitemap entries
    const newsEntries: MetadataRoute.Sitemap = (news || []).map((article) => ({
        url: `${baseUrl}/news/${article.slug}`,
        lastModified: article.published_at ? new Date(article.published_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
    }));

    return [...staticRoutes, ...categoryEntries, ...brandEntries, ...productEntries, ...newsEntries];
}
