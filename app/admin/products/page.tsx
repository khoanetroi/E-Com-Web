import AdminProductsPage from "@/views/Admin/Products/List";

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ page?: string; search?: string }>;
}) {
    const params = await searchParams;
    return <AdminProductsPage searchParams={params} />;
}