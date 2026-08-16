import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeTicketPhone, type WarrantyTicketInput } from "@/lib/warranty-ticket";
import { analyzeWarrantyTicketWithGemini } from "@/lib/gemini";

const MAX_ISSUE_DESCRIPTION_LENGTH = 4_000;

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const offset = (page - 1) * limit;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";
  let baseQuery = supabase
    .from("warranty_tickets")
    .select("*", { count: 'exact' })
    .order("created_at", { ascending: false });

  if (!isAdmin) {
    baseQuery = baseQuery.eq("customer_user_id", user.id);
  }

  const { data, error, count } = await baseQuery.range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / limit)
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData?.user;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: WarrantyTicketInput & { run_ai_diagnosis?: boolean };
  try {
    body = (await request.json()) as WarrantyTicketInput & { run_ai_diagnosis?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.customer_phone?.trim() || !body.issue_description?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (body.issue_description.trim().length > MAX_ISSUE_DESCRIPTION_LENGTH) {
    return NextResponse.json({ error: "Issue description is too long" }, { status: 400 });
  }

  const payload: any = {
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

  if (body.run_ai_diagnosis) {
    try {
      const diagnosis = await analyzeWarrantyTicketWithGemini({
        // customerName: payload.customer_name || 'Khách hàng',
        productName: payload.product_name,
        issueDescription: payload.issue_description,
        requesterRole: 'client',
      });
      if (diagnosis) {
        payload.ai_diagnosis = diagnosis.diagnosis;
        payload.ai_temporary_advice = diagnosis.temporaryAdvice;
        payload.ai_confidence = diagnosis.confidence;
        payload.ai_severity = diagnosis.severity;
        payload.ai_follow_up_questions = diagnosis.followUpQuestions;
      }
    } catch (e) {
      console.error("AI diagnosis failed during ticket creation:", e);
    }
  }

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
