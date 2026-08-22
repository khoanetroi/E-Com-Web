import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://oruauodjvprscllyzyvw.supabase.co";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_z-GVqg-oqJaOOWoMOQgtnQ_z6C46axk";
    return createClient(supabaseUrl, anonKey);
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

        // Tìm theo full ID hoặc 8 ký tự đầu
        let query = supabase.from("orders").select("id, status, payment_status, total_amount, tracking_number, notes");

        if (id.length === 8) {
            query = query.ilike("id", `${id}%`);
        } else {
            query = query.eq("id", id);
        }

        const { data: order, error } = await query.maybeSingle();

        if (error || !order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        return NextResponse.json({
            id: order.id,
            status: order.status,
            paymentStatus: order.payment_status,
            isPaid: order.payment_status === "paid",
            totalAmount: order.total_amount,
            trackingNumber: order.tracking_number,
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Internal error" }, { status: 500 });
    }
}
