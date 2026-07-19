import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProductTable from "./product-table";

export default async function AdminProductsPage({
    searchParams,
}: {
    searchParams?: { page?: string; search?: string };
}) {
    const supabase = await createClient();

    // 1. Kiểm tra quyền Admin
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/?login=true&redirect=/admin/products");

    const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") redirect("/");

    // 2. Phân trang
    const currentPage = Number(searchParams?.page) || 1;
    const ITEMS_PER_PAGE = 10;
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    // 3. Query products
    let query = supabase
        .from("products")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

    if (searchParams?.search) {
        query = query.ilike("name", `%${searchParams.search}%`);
    }

    const { data: products, count } = await query;

    // 4. Query variant aggregates for each product
    let productsWithStats: any[] = [];
    if (products && products.length > 0) {
        const productIds = products.map((p: any) => p.id);

        const { data: variants } = await supabase
            .from("product_variants")
            .select("product_id, price, stock, discount_percent")
            .in("product_id", productIds);

        // Aggregate per product
        const variantMap: Record<string, { count: number; minPrice: number; maxPrice: number; totalStock: number; maxDiscount: number }> = {};
        (variants || []).forEach((v: any) => {
            if (!variantMap[v.product_id]) {
                variantMap[v.product_id] = { count: 0, minPrice: Infinity, maxPrice: 0, totalStock: 0, maxDiscount: 0 };
            }
            const entry = variantMap[v.product_id];
            const vdp = v.discount_percent || 0;
            entry.count++;
            entry.minPrice = Math.min(entry.minPrice, Number(v.price));
            entry.maxPrice = Math.max(entry.maxPrice, Number(v.price));
            entry.totalStock += Number(v.stock);
            if (vdp > entry.maxDiscount) entry.maxDiscount = vdp;
        });

        productsWithStats = products.map((p: any) => {
            const stats = variantMap[p.id];
            return {
                id: p.id,
                slug: p.slug,
                name: p.name,
                brand: p.brand || "NoBrand",
                origin: p.origin || "Việt Nam",
                thumbnail: p.thumbnail,
                images: p.images || [],
                created_at: p.created_at,
                updated_at: p.updated_at,
                variant_count: stats?.count || 0,
                min_price: stats ? stats.minPrice : 0,
                max_price: stats ? stats.maxPrice : 0,
                total_stock: stats?.totalStock || 0,
                discount_percent: stats?.maxDiscount || 0,
            };
        });
    }

    return (
        <ProductTable
            initialProducts={productsWithStats}
            totalCount={count || 0}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
        />
    );
}