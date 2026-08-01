import type { WarrantyTicketAnalysis } from "@/lib/warranty-ticket";

const DEFAULT_MODEL = "gemini-3.5-flash";

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function extractJsonBlock(rawText: string) {
  const fenced = rawText.match(/```json\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1];

  const firstBrace = rawText.indexOf("{");
  const lastBrace = rawText.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return rawText.slice(firstBrace, lastBrace + 1);
  }

  return rawText;
}

export function buildWarrantyTicketPrompt(input: {
  productName?: string | null;
  serialNumber?: string | null;
  issueDescription: string;
}) {
  return [
    "Bạn là trợ lý kỹ thuật hậu mãi cho hệ thống thương mại điện tử thiết bị điện / công nghiệp Telectric.",
    "Nhiệm vụ: phân tích ticket lỗi do khách hàng mô tả và đưa ra chẩn đoán sơ bộ cùng lời khuyên xử lý tạm thời cho quản trị viên.",
    "Không tư vấn bán hàng, không gợi ý sản phẩm, không suy diễn ngoài nội dung mô tả của ticket.",
    "Nếu dữ liệu chưa đủ, nêu rõ giới hạn thông tin; không khẳng định chắc chắn hoặc suy diễn ngoài ticket.",
    "Trả về đúng JSON với các khóa: diagnosis, temporaryAdvice, severity, confidence, followUpQuestions.",
    "severity chỉ được là low, medium hoặc high.",
    "confidence là số từ 0 đến 1.",
    "followUpQuestions là mảng câu hỏi cần hỏi thêm nếu còn thiếu thông tin.",
    "Ngôn ngữ phản hồi phải là tiếng Việt, ngắn gọn, thực dụng, phù hợp cho admin xem nhanh.",
    "",
    `Thông tin ticket:\n- Sản phẩm: ${input.productName || "Không có"}\n- Serial: ${input.serialNumber || "Không có"}\n- Mô tả lỗi: ${input.issueDescription}`,
  ].join("\n");
}

export async function analyzeWarrantyTicketWithGemini(input: {
  productName?: string | null;
  serialNumber?: string | null;
  issueDescription: string;
}): Promise<WarrantyTicketAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const prompt = buildWarrantyTicketPrompt(input);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  let response: Response;

  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2048,
            thinkingConfig: { thinkingLevel: "low" },
            responseMimeType: "application/json",
            responseJsonSchema: {
              type: "object",
              properties: {
                diagnosis: { type: "string" },
                temporaryAdvice: { type: "string" },
                severity: { type: "string", enum: ["low", "medium", "high"] },
                confidence: { type: "number" },
                followUpQuestions: { type: "array", items: { type: "string" } },
              },
              required: ["diagnosis", "temporaryAdvice", "severity", "confidence", "followUpQuestions"],
            },
          },
        }),
      },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Gemini request timed out");
    }
    throw new Error("Could not connect to Gemini");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`Gemini request failed: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
  const parsed = safeJsonParse<WarrantyTicketAnalysis>(extractJsonBlock(text));

  if (!parsed) {
    throw new Error("Gemini response is not valid JSON");
  }

  return {
    diagnosis: parsed.diagnosis || "Chưa xác định",
    temporaryAdvice: parsed.temporaryAdvice || "Kiểm tra thêm thông tin lỗi.",
    severity: ["low", "medium", "high"].includes(parsed.severity) ? parsed.severity : "medium",
    confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
    followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions.filter(Boolean).slice(0, 5) : [],
  };
}
