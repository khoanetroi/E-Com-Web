import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isWarrantyTicketStatus } from "@/lib/warranty-ticket";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (body.status !== undefined && !isWarrantyTicketStatus(body.status)) {
    return NextResponse.json({ error: "Invalid ticket status" }, { status: 400 });
  }
  if (isWarrantyTicketStatus(body.status)) updateData.status = body.status;
  if (typeof body.admin_note === "string") updateData.admin_note = body.admin_note;
  if (typeof body.ai_diagnosis === "string") updateData.ai_diagnosis = body.ai_diagnosis;
  if (typeof body.ai_temporary_advice === "string") updateData.ai_temporary_advice = body.ai_temporary_advice;
  if (typeof body.ai_confidence === "number") updateData.ai_confidence = body.ai_confidence;

  const { data, error } = await supabase
    .from("warranty_tickets")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
