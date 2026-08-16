import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { analyzeWarrantyTicketWithGemini } from "@/lib/gemini";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { data: ticket, error } = await supabase
    .from("warranty_tickets")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !ticket) {
    return NextResponse.json({ error: error?.message || "Ticket not found" }, { status: 404 });
  }

  const { error: startError } = await supabase
    .from("warranty_tickets")
    .update({ status: "analyzing", updated_at: new Date().toISOString() })
    .eq("id", id);

  if (startError) {
    return NextResponse.json({ error: "Could not update ticket status" }, { status: 500 });
  }

  try {
    const analysis = await analyzeWarrantyTicketWithGemini({
      productName: ticket.product_name,
      serialNumber: ticket.serial_number,
      issueDescription: ticket.issue_description,
      requesterRole: 'admin',
    });

    const { data: updatedTicket, error: updateError } = await supabase
      .from("warranty_tickets")
      .update({
        ai_diagnosis: analysis.diagnosis,
        ai_temporary_advice: analysis.temporaryAdvice,
        ai_confidence: analysis.confidence,
        ai_severity: analysis.severity,
        ai_follow_up_questions: analysis.followUpQuestions,
        status: "received",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: { ticket: updatedTicket, analysis } });
  } catch (analysisError) {
    console.error("Lỗi phân tích Gemini:", analysisError);
    await supabase
      .from("warranty_tickets")
      .update({ status: "received", updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json(
      {
        error: "Không thể phân tích ticket bằng AI. Admin vẫn có thể nhập kết luận thủ công.",
      },
      { status: 500 },
    );
  }
}
