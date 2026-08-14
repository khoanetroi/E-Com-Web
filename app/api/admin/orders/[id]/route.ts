import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;
    if (!orderId) {
      return NextResponse.json({ error: "Thiếu mã đơn hàng" }, { status: 400 });
    }

    const body = await request.json();
    const { status: newStatus, payment_status: newPaymentStatus } = body;

    const supabase = createAdminClient();

    // 1. Fetch current order
    const { data: currentOrder, error: fetchErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchErr || !currentOrder) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng trong hệ thống" },
        { status: 404 }
      );
    }

    // 2. Prepare update data
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (newStatus) updateData.status = newStatus;
    if (newPaymentStatus) updateData.payment_status = newPaymentStatus;

    // 3. Update order in database
    const { data: updatedOrder, error: updateErr } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json(
        { error: updateErr.message || "Cập nhật đơn hàng thất bại" },
        { status: 500 }
      );
    }

    // 4. Handle warranty logic if order status changed
    let warrantyNotice: string | null = null;
    const currentOrderStatus = currentOrder.status;
    const statusActuallyChanged = newStatus && newStatus !== currentOrderStatus;

    if (statusActuallyChanged && newStatus === "delivered") {
      try {
        const { data: orderData } = await supabase
          .from("orders")
          .select(`
            customer_name, customer_phone,
            order_items (
              quantity,
              product_variants (
                products ( name, warranty_months )
              )
            )
          `)
          .eq("id", orderId)
          .single();

        if (orderData?.order_items) {
          const now = new Date();
          const shortOrderId = (orderId || "").replace(/-/g, "").slice(0, 8).toUpperCase();
          const items = orderData.order_items as any[];

          let totalCount = 0;
          items.forEach((item) => {
            totalCount += item.quantity || 1;
          });

          const warrantyCards: any[] = [];
          let seq = 1;

          items.forEach((item: any) => {
            const product = item.product_variants?.products;
            const warrantyMonths = product?.warranty_months ?? 12;
            const quantity = item.quantity || 1;

            for (let q = 0; q < quantity; q++) {
              const expiryDate = new Date(now);
              expiryDate.setMonth(expiryDate.getMonth() + warrantyMonths);

              const serialNumber =
                totalCount > 1
                  ? `SR-${shortOrderId}-${seq}`
                  : `SR-${shortOrderId}`;
              seq++;

              warrantyCards.push({
                customer_phone: orderData.customer_phone,
                customer_name: orderData.customer_name,
                product_name: product?.name || "Sản phẩm",
                serial_number: serialNumber,
                purchase_date: now.toISOString().split("T")[0],
                warranty_months: warrantyMonths,
                expiry_date: expiryDate.toISOString().split("T")[0],
                status: "active",
              });
            }
          });

          if (warrantyCards.length > 0) {
            await supabase.from("warranty_cards").insert(warrantyCards);
            warrantyNotice = `Đã tạo ${warrantyCards.length} phiếu bảo hành tự động (Serial: ${warrantyCards[0].serial_number}${warrantyCards.length > 1 ? "..." : ""})`;
          }
        }
      } catch (warrantyErr) {
        console.error("Auto-create warranty failed:", warrantyErr);
      }
    }

    if (statusActuallyChanged && newStatus === "cancelled") {
      try {
        const { data: orderData } = await supabase
          .from("orders")
          .select(`
            customer_phone,
            order_items (
              product_variants (
                products ( name )
              )
            )
          `)
          .eq("id", orderId)
          .single();

        if (orderData?.customer_phone && orderData?.order_items) {
          const productNames = (orderData.order_items as any[])
            .map((item: any) => item.product_variants?.products?.name)
            .filter(Boolean);

          if (productNames.length > 0) {
            const { count } = await supabase
              .from("warranty_cards")
              .update({ status: "voided", updated_at: new Date().toISOString() })
              .eq("customer_phone", orderData.customer_phone)
              .in("product_name", productNames)
              .eq("status", "active");

            if (count && count > 0) {
              warrantyNotice = `Đã hủy ${count} phiếu bảo hành do đơn bị hủy`;
            }
          }
        }
      } catch (voidErr) {
        console.error("Auto-void warranty failed:", voidErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      warrantyNotice,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Lỗi server khi cập nhật đơn hàng" },
      { status: 500 }
    );
  }
}
