import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://oruauodjvprscllyzyvw.supabase.co";
const DEFAULT_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydWF1b2RqdnByc2NsbHl6eXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTUzMDk4NCwiZXhwIjoyMTAxMTA2OTg0fQ.DMiuajXs6hbFbLU0eKWZ20KjGxTjPcwuDFiCETgTEwQ";

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;
    return createClient(supabaseUrl, key);
}

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!id) {
            return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
        }

        const supabase = getSupabase();
        const trimmedId = id.trim().toLowerCase();

        let order: any = null;

        // 1. Nếu là UUID đầy đủ (36 ký tự)
        if (trimmedId.length === 36) {
            const { data, error } = await supabase
                .from("orders")
                .select("id, status, payment_status, total_amount, tracking_number, notes")
                .eq("id", trimmedId)
                .maybeSingle();

            if (!error && data) {
                order = data;
            }
        }

        // 2. Nếu là tracking number (ORD-XXXXXXXX)
        if (!order && trimmedId.startsWith("ord-")) {
            const { data, error } = await supabase
                .from("orders")
                .select("id, status, payment_status, total_amount, tracking_number, notes")
                .eq("tracking_number", trimmedId.toUpperCase())
                .maybeSingle();

            if (!error && data) {
                order = data;
            }
        }

        // 3. Nếu là 8 ký tự hex hoặc chưa tìm thấy -> Quét các đơn hàng gần đây và khớp prefix
        if (!order) {
            const { data: recentOrders } = await supabase
                .from("orders")
                .select("id, status, payment_status, total_amount, tracking_number, notes")
                .order("created_at", { ascending: false })
                .limit(100);

            if (recentOrders && recentOrders.length > 0) {
                order = recentOrders.find((o: any) =>
                    o.id.toLowerCase().startsWith(trimmedId) ||
                    (o.tracking_number && o.tracking_number.toLowerCase().includes(trimmedId))
                ) || null;
            }
        }

        if (!order) {
            return NextResponse.json({ error: "Order not found", isPaid: false }, { status: 404 });
        }

        const isPaid = order.payment_status === "paid";

        return NextResponse.json({
            id: order.id,
            status: order.status,
            paymentStatus: order.payment_status,
            isPaid,
            totalAmount: order.total_amount,
            trackingNumber: order.tracking_number,
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal error", isPaid: false }, { status: 500 });
    }
}
