import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeTicketPhone, type WarrantyTicketInput } from "@/lib/warranty-ticket";

const MAX_ISSUE_DESCRIPTION_LENGTH = 4_000;

export async function GET() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  const baseQuery = supabase
    .from("warranty_tickets")
    .select("*")
    .order("created_at", { ascending: false });

  const { data, error } = isAdmin
    ? await baseQuery
    : await baseQuery.eq("customer_user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data || [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: WarrantyTicketInput;
  try {
    body = (await request.json()) as WarrantyTicketInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.customer_phone?.trim() || !body.issue_description?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (body.issue_description.trim().length > MAX_ISSUE_DESCRIPTION_LENGTH) {
    return NextResponse.json({ error: "Issue description is too long" }, { status: 400 });
  }

  const payload = {
    warranty_card_id: body.warranty_card_id || null,
    customer_user_id: user.id,
    customer_name: body.customer_name || user.user_metadata?.full_name || user.user_metadata?.name || null,
    customer_phone: normalizeTicketPhone(body.customer_phone),
    product_name: body.product_name || null,
    serial_number: body.serial_number || null,
    issue_description: body.issue_description.trim(),
    issue_images: body.issue_images || null,
    status: "new",
    ai_diagnosis: null,
    ai_temporary_advice: null,
    ai_confidence: null,
    ai_severity: null,
    ai_follow_up_questions: null,
    admin_note: null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("warranty_tickets")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
