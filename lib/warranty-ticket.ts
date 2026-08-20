export type WarrantyTicketStatus =
  | "new"
  | "received"
  | "analyzing"
  | "processing"
  | "resolved"
  | "closed";

export type WarrantyTicket = {
  id: string;
  warranty_card_id: string | null;
  customer_name: string | null;
  customer_phone: string;
  customer_user_id: string | null;
  product_name: string | null;
  serial_number: string | null;
  issue_description: string;
  issue_images: string[] | null;
  status: WarrantyTicketStatus;
  ai_diagnosis: string | null;
  ai_temporary_advice: string | null;
  ai_confidence: number | null;
  ai_severity: "low" | "medium" | "high" | null;
  ai_follow_up_questions: string[] | null;
  client_ai_diagnosis: string | null;
  client_ai_temporary_advice: string | null;
  client_ai_confidence: number | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export type WarrantyTicketInput = {
  warranty_card_id?: string | null;
  customer_name?: string | null;
  customer_phone: string;
  product_name?: string | null;
  serial_number?: string | null;
  issue_description: string;
  issue_images?: string[] | null;
};

export type WarrantyTicketAnalysis = {
  diagnosis: string;
  temporaryAdvice: string;
  severity: "low" | "medium" | "high";
  confidence: number;
  followUpQuestions: string[];
};

export function normalizeTicketPhone(phone: string) {
  return phone.replace(/\s/g, "").trim();
}

export const warrantyTicketStatuses = ["new", "received", "analyzing", "processing", "resolved", "closed"] as const;

export function isWarrantyTicketStatus(value: unknown): value is WarrantyTicketStatus {
  return typeof value === "string" && warrantyTicketStatuses.includes(value as WarrantyTicketStatus);
}
