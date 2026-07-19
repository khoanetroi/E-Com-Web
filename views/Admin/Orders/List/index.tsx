"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { OrderTable } from "./order-table";
import { Loader2 } from "lucide-react";

interface Props {
    searchParams?: {
        search?: string;
        status?: string;
        page?: string;
    };
}

const PAGE_SIZE = 10;

export default function OrderListPage({ searchParams }: Props) {
    // useMemo để tránh tạo mới client mỗi render
    const supabase = useMemo(() => createClient(), []);
    const { toast } = useToast();

    const [orders, setOrders] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [stats, setStats] = useState({
        total: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0
    });
    const [loading, setLoading] = useState(true);

    const search = searchParams?.search || "";
    const statusFilter = searchParams?.status || "all";
    const page = parseInt(searchParams?.page || "1");

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        try {
            let query = supabase
                .from("orders")
                .select(`
                    *,
                    order_items (
                        quantity,
                        price_at_purchase,
                        product_variants (
                            attributes,
                            products ( name, thumbnail )
                        )
                    )
                `, { count: "exact" })
                .order("created_at", { ascending: false })
                .range(from, to);

            if (search) {
                query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
            }

            if (statusFilter !== "all") {
                query = query.eq("status", statusFilter);
            }

            const { data, count, error } = await query;
            if (error) throw error;

            setOrders(data || []);
            setTotalCount(count || 0);

            // Stats song song
            const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
            const statsPromises = statuses.map(s =>
                supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", s)
            );
            const totalPromise = supabase.from("orders").select("*", { count: "exact", head: true });
            const results = await Promise.all([...statsPromises, totalPromise]);

            setStats({
                pending: results[0].count || 0,
                processing: results[1].count || 0,
                shipped: results[2].count || 0,
                delivered: results[3].count || 0,
                cancelled: results[4].count || 0,
                total: results[5].count || 0,
            });
        } catch (error: any) {
            toast({
                title: "Lỗi hệ thống",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter, page, supabase, toast]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 min-h-[400px]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                    <p className="text-sm text-slate-500 font-medium">Đang tải danh sách đơn hàng...</p>
                </div>
            </div>
        );
    }

    return (
        <OrderTable
            orders={orders}
            totalCount={totalCount}
            currentPage={page}
            pageSize={PAGE_SIZE}
            search={search}
            statusFilter={statusFilter}
            stats={stats}
            onRefresh={fetchOrders}
        />
    );
}