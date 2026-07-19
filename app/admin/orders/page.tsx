import OrderListPage from "@/views/Admin/Orders/List";

export default async function Page({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
    const params = await searchParams;
    return <OrderListPage searchParams={params} />;
}
