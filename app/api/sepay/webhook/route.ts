import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const DEFAULT_SUPABASE_URL = "https://oruauodjvprscllyzyvw.supabase.co";
const DEFAULT_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ydWF1b2RqdnByc2NsbHl6eXZ3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTUzMDk4NCwiZXhwIjoyMTAxMTA2OTg0fQ.DMiuajXs6hbFbLU0eKWZ20KjGxTjPcwuDFiCETgTEwQ";

// Sử dụng Supabase Service Role để bypass RLS và cập nhật trạng thái đơn hàng an toàn
function getSupabaseAdmin() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE_KEY;

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false }
    });
}

/**
 * SePay Webhook Payload Interface
 * https://sepay.vn/docs/webhook
 */
interface SePayWebhookPayload {
    id?: number | string;                        // Mã giao dịch trên SePay
    gateway?: string;                            // Ngân hàng (MBBank, Vietcombank, ...)
    transactionDate?: string;                    // Thời gian giao dịch
    accountNumber?: string;                      // Số tài khoản nhận tiền
    code?: string | null;                        // Mã code SePay (nếu có)
    content?: string;                            // Nội dung chuyển khoản
    transferType?: "in" | "out" | string;        // "in" là tiền vào, "out" là tiền ra
    transferAmount?: number | string;            // Số tiền chuyển
    accumulated?: number | string;               // Số dư lũy kế
    subAccount?: string | null;                  // Tài khoản phụ
    referenceCode?: string | null;               // Mã tham chiếu ngân hàng
    description?: string | null;                 // Chi tiết giao dịch
}

export async function POST(req: NextRequest) {
    try {
        // 1. Kiểm tra API Key / Authorization nếu có cấu hình SEPAY_API_KEY
        const expectedApiKey = process.env.SEPAY_API_KEY;
        if (expectedApiKey && expectedApiKey.trim().length > 0) {
            const authHeader = req.headers.get("authorization") || "";
            const token = authHeader.replace(/^(Apikey|Bearer)\s+/i, "").trim();
            if (token !== expectedApiKey.trim()) {
                console.warn("[SePay Webhook] Unauthorized request - API key mismatch");
                return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
            }
        }

        const body: SePayWebhookPayload = await req.json();
        console.log("[SePay Webhook] Received payload:", JSON.stringify(body, null, 2));

        const transferType = String(body.transferType || "").toLowerCase();
        const rawAmount = typeof body.transferAmount === "number" ? body.transferAmount : parseFloat(String(body.transferAmount || "0").replace(/[^0-9.-]+/g, ""));

        // 2. Chỉ xử lý giao dịch tiền vào (transferType === "in")
        if (transferType !== "in" || rawAmount <= 0) {
            return NextResponse.json({
                success: true,
                message: "Ignored: Not an incoming transfer or invalid amount"
            });
        }

        const supabase = getSupabaseAdmin();
        const rawContent = `${body.content || ""} ${body.description || ""} ${body.code || ""}`.trim();

        // 3. Trích xuất mã đơn hàng từ nội dung chuyển khoản
        let matchedOrder: any = null;

        // Trích xuất tracking number dạng ORD-XXXXXXXX nếu có
        const trackingMatch = rawContent.match(/ORD-([a-fA-F0-9]{8})/i);
        if (trackingMatch) {
            const trackingNumber = `ORD-${trackingMatch[1].toUpperCase()}`;
            const { data: order } = await supabase
                .from("orders")
                .select("id, total_amount, status, payment_status, notes, tracking_number")
                .eq("tracking_number", trackingNumber)
                .maybeSingle();

            if (order) {
                matchedOrder = order;
            }
        }

        // Lấy danh sách 100 đơn hàng gần đây để khớp tiền tố hex 8 ký tự hoặc UUID
        if (!matchedOrder) {
            const { data: recentOrders, error: listErr } = await supabase
                .from("orders")
                .select("id, total_amount, status, payment_status, notes, tracking_number")
                .order("created_at", { ascending: false })
                .limit(100);

            if (!listErr && recentOrders && recentOrders.length > 0) {
                // Khớp bất kỳ cụm 8 ký tự hex nào trong nội dung
                const hexMatches = rawContent.match(/\b([a-fA-F0-9]{8})\b/g) || [];
                for (const hex of hexMatches) {
                    const found = recentOrders.find((o: any) =>
                        o.id.toLowerCase().startsWith(hex.toLowerCase()) ||
                        (o.tracking_number && o.tracking_number.toLowerCase().includes(hex.toLowerCase()))
                    );
                    if (found) {
                        matchedOrder = found;
                        break;
                    }
                }

                // Nếu vẫn chưa tìm thấy, kiểm tra xem có bất kỳ order nào xuất hiện tiền tố trong rawContent
                if (!matchedOrder) {
                    for (const o of recentOrders) {
                        const shortId = o.id.slice(0, 8).toUpperCase();
                        if (rawContent.toUpperCase().includes(shortId)) {
                            matchedOrder = o;
                            break;
                        }
                    }
                }
            }
        }

        if (!matchedOrder) {
            console.warn(`[SePay Webhook] Could not match any order from content: "${rawContent}"`);
            return NextResponse.json({
                success: true,
                message: "Webhook received but no matching order found in content"
            });
        }

        // 4. Nếu đơn đã thanh toán trước đó, ghi nhận và trả về success
        if (matchedOrder.payment_status === "paid") {
            console.log(`[SePay Webhook] Order ${matchedOrder.id} was already marked as paid.`);
            return NextResponse.json({
                success: true,
                message: "Order already paid",
                orderId: matchedOrder.id
            });
        }

        // 5. Cập nhật đơn hàng sang trạng thái "Đã thanh toán"
        const updateNote = [
            matchedOrder.notes || "",
            `[SePay Auto-Paid] GD #${body.id || "N/A"} lúc ${body.transactionDate || new Date().toLocaleString("vi-VN")} (+${rawAmount.toLocaleString("vi-VN")}đ, Ref: ${body.referenceCode || "N/A"})`
        ].filter(Boolean).join(" | ");

        const newStatus = matchedOrder.status === "pending" ? "processing" : matchedOrder.status;

        const { error: updateErr } = await supabase
            .from("orders")
            .update({
                payment_status: "paid",
                status: newStatus,
                notes: updateNote,
                updated_at: new Date().toISOString()
            })
            .eq("id", matchedOrder.id);

        if (updateErr) {
            console.error("[SePay Webhook] Error updating order:", updateErr);
            return NextResponse.json({ success: false, message: "Failed to update order" }, { status: 500 });
        }

        console.log(`✅ [SePay Webhook] Successfully marked Order #${matchedOrder.id.slice(0, 8)} as PAID!`);

        return NextResponse.json({
            success: true,
            message: "Order payment confirmed successfully via SePay",
            orderId: matchedOrder.id,
            amount: rawAmount
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
