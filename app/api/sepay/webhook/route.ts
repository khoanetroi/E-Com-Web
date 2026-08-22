import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Sử dụng Supabase Service Role để bypass RLS và cập nhật trạng thái đơn hàng an toàn
function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://oruauodjvprscllyzyvw.supabase.co";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
}

/**
 * SePay Webhook Payload Interface
 * https://sepay.vn/docs/webhook
 */
interface SePayWebhookPayload {
    id: number;                          // Mã giao dịch trên SePay
    gateway: string;                     // Ngân hàng (MBBank, Vietcombank, ...)
    transactionDate: string;             // Thời gian giao dịch
    accountNumber: string;               // Số tài khoản nhận tiền
    code: string | null;                 // Mã code SePay (nếu có)
    content: string;                     // Nội dung chuyển khoản
    transferType: "in" | "out";          // "in" là tiền vào, "out" là tiền ra
    transferAmount: number;              // Số tiền chuyển
    accumulated: number;                 // Số dư lũy kế
    subAccount: string | null;           // Tài khoản phụ
    referenceCode: string | null;        // Mã tham chiếu ngân hàng
    description: string | null;          // Chi tiết giao dịch
}

export async function POST(req: NextRequest) {
    try {
        // 1. Kiểm tra API Key / Authorization nếu có cấu hình SEPAY_API_KEY
        const expectedApiKey = process.env.SEPAY_API_KEY;
        if (expectedApiKey) {
            const authHeader = req.headers.get("authorization") || "";
            const token = authHeader.replace(/^(Apikey|Bearer)\s+/i, "").trim();
            if (token !== expectedApiKey) {
                console.warn("[SePay Webhook] Unauthorized request - API key mismatch");
                return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
            }
        }

        const body: SePayWebhookPayload = await req.json();
        console.log("[SePay Webhook] Received payload:", JSON.stringify(body, null, 2));

        // 2. Chỉ xử lý giao dịch tiền vào (transferType === "in")
        if (body.transferType !== "in" || !body.transferAmount || body.transferAmount <= 0) {
            return NextResponse.json({
                success: true,
                message: "Ignored: Not an incoming transfer"
            });
        }

        const supabase = getSupabaseAdmin();
        const rawContent = (body.content || "") + " " + (body.description || "");

        // 3. Trích xuất mã đơn hàng từ nội dung chuyển khoản
        // Khớp 8 ký tự hex (ví dụ: TELECTRIC 053E16CE hoặc #053E16CE hoặc 053e16ce)
        let matchedOrderId: string | null = null;
        let matchedByTracking = false;

        // Trích xuất tracking number dạng ORD-XXXXXXXX nếu có
        const trackingMatch = rawContent.match(/ORD-([a-fA-F0-9]{8})/i);
        if (trackingMatch) {
            const trackingNumber = `ORD-${trackingMatch[1].toUpperCase()}`;
            const { data: order } = await supabase
                .from("orders")
                .select("id, total_amount, status, payment_status, notes")
                .eq("tracking_number", trackingNumber)
                .maybeSingle();

            if (order) {
                matchedOrderId = order.id;
                matchedByTracking = true;
            }
        }

        // Nếu chưa tìm thấy theo tracking number, tìm theo tiền tố UUID 8 ký tự
        if (!matchedOrderId) {
            const hexMatches = rawContent.match(/\b([a-fA-F0-9]{8})\b/g);
            if (hexMatches && hexMatches.length > 0) {
                for (const hex of hexMatches) {
                    const { data: order } = await supabase
                        .from("orders")
                        .select("id, total_amount, status, payment_status, notes")
                        .ilike("id", `${hex}%`)
                        .maybeSingle();

                    if (order) {
                        matchedOrderId = order.id;
                        break;
                    }
                }
            }
        }

        if (!matchedOrderId) {
            console.warn(`[SePay Webhook] Could not match any order from content: "${rawContent}"`);
            return NextResponse.json({
                success: true,
                message: "Webhook received but no matching order found in content"
            });
        }

        // 4. Lấy thông tin đơn hàng để kiểm tra số tiền và cập nhật
        const { data: order, error: fetchErr } = await supabase
            .from("orders")
            .select("id, total_amount, status, payment_status, notes")
            .eq("id", matchedOrderId)
            .single();

        if (fetchErr || !order) {
            console.error("[SePay Webhook] Error fetching matched order:", fetchErr);
            return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
        }

        // Nếu đơn đã thanh toán trước đó, ghi nhận và trả về success
        if (order.payment_status === "paid") {
            console.log(`[SePay Webhook] Order ${order.id} was already marked as paid.`);
            return NextResponse.json({
                success: true,
                message: "Order already paid",
                orderId: order.id
            });
        }

        // 5. Cập nhật đơn hàng sang trạng thái "Đã thanh toán"
        const updateNote = [
            order.notes || "",
            `[SePay Auto-Paid] GD #${body.id} lúc ${body.transactionDate} (+${body.transferAmount.toLocaleString("vi-VN")}đ, Ref: ${body.referenceCode || "N/A"})`
        ].filter(Boolean).join(" | ");

        const newStatus = order.status === "pending" ? "processing" : order.status;

        const { error: updateErr } = await supabase
            .from("orders")
            .update({
                payment_status: "paid",
                status: newStatus,
                notes: updateNote,
                updated_at: new Date().toISOString()
            })
            .eq("id", order.id);

        if (updateErr) {
            console.error("[SePay Webhook] Error updating order:", updateErr);
            return NextResponse.json({ success: false, message: "Failed to update order" }, { status: 500 });
        }

        console.log(`✅ [SePay Webhook] Successfully marked Order #${order.id.slice(0, 8)} as PAID!`);

        return NextResponse.json({
            success: true,
            message: "Order payment confirmed successfully via SePay",
            orderId: order.id,
            amount: body.transferAmount
        });

    } catch (error: any) {
        console.error("[SePay Webhook] Unexpected error:", error);
        return NextResponse.json({ success: false, message: error.message || "Internal Server Error" }, { status: 500 });
    }
}

// Hỗ trợ GET để kiểm tra endpoint hoạt động
export async function GET() {
    return NextResponse.json({
        status: "active",
        service: "TELECTRIC SePay Webhook Endpoint",
        timestamp: new Date().toISOString()
    });
}
