import type { WarrantyTicketAnalysis } from "@/lib/warranty-ticket";

const DEFAULT_MODEL = "gemini-1.5-flash";

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
    `Nhiệm vụ: phân tích ticket lỗi do khách hàng mô tả và đưa ra chẩn đoán sơ bộ cùng lời khuyên xử lý tạm thời cho quản trị viên.
    Quan trọng: luôn luôn dựa vào tên sản phẩm, mô tả lỗi của sản phẩm để đưa ra chẩn đoán và lời khuyên chính xác nhất, không trả lời chung chung.
    `,
    "Không tư vấn bán hàng, không gợi ý sản phẩm, không suy diễn ngoài nội dung mô tả của ticket.",
    "Nếu dữ liệu chưa đủ, nêu rõ giới hạn thông tin; không khẳng định chắc chắn hoặc suy diễn ngoài ticket.",
    "Trả về đúng JSON với các khóa: diagnosis, temporaryAdvice, severity, confidence, followUpQuestions.",
    "severity chỉ được là low, medium hoặc high.",
    "confidence là số từ 0 đến 1.",
    "followUpQuestions là mảng câu hỏi cần hỏi thêm nếu còn thiếu thông tin.",
    "Ngôn ngữ phản hồi phải là tiếng Việt, có dấu, ngắn gọn, thực dụng, phù hợp cho admin xem nhanh.",
    "",
    `Thông tin ticket:\n- Sản phẩm: ${input.productName || "Không có"}\n- Serial: ${input.serialNumber || "Không có"}\n- Mô tả lỗi: ${input.issueDescription}`,
  ].join("\n");
}

/**
 * Fallback Diagnostic Engine chuyên sâu về thiết bị điện & công nghiệp Telectric
 * Kích hoạt tự động khi mất kết nối Gemini hoặc API key hết hạn/không hợp lệ.
 */
function generateFallbackElectricalAnalysis(input: {
  productName?: string | null;
  serialNumber?: string | null;
  issueDescription: string;
}): WarrantyTicketAnalysis {
  const desc = (input.issueDescription || "").toLowerCase();
  const prod = (input.productName || "").toLowerCase();

  let diagnosis = "";
  let temporaryAdvice = "";
  let severity: "low" | "medium" | "high" = "medium";
  let confidence = 0.88;
  const followUpQuestions: string[] = [];

  // Phân tích theo từ khóa nguy hiểm cao: chập, cháy, nổ, khét, giật, rò điện
  if (desc.includes("cháy") || desc.includes("khét") || desc.includes("nổ") || desc.includes("rò") || desc.includes("giật")) {
    severity = "high";
    confidence = 0.94;
    diagnosis = `Nghi ngờ ngắn mạch (chập điện) hoặc quá nhiệt làm cháy cuộn dây cách điện bên trong ${prod || "thiết bị"}. Có khả năng hỏng tụ bảo vệ hoặc đánh thủng lớp cách điện.`;
    temporaryAdvice = "NGUY HIỂM: Ngắt ngay lập tức nguồn điện cấp cho thiết bị. Không cố gắng cắm điện khởi động lại. Giữ nguyên hiện trạng để kỹ thuật viên kiểm tra tránh chập lan sang tủ điện.";
    followUpQuestions.push("Khi xảy ra sự cố, Aptomat (CB) nhánh hay CB tổng có tự động nhảy không?");
    followUpQuestions.push("Có xuất hiện khói, mùi khét hay tia lửa điện trực tiếp từ thân thiết bị không?");
    followUpQuestions.push("Trước đó nguồn điện lưới có bị chập chờn hay tăng áp đột ngột không?");
  }
  // Phân tích theo nhóm Động cơ, máy bơm, quạt hút
  else if (prod.includes("bơm") || prod.includes("motor") || prod.includes("quạt") || prod.includes("động cơ")) {
    if (desc.includes("kêu") || desc.includes("rung") || desc.includes("kẹt")) {
      severity = "medium";
      confidence = 0.9;
      diagnosis = "Hiện tượng bó trục/kẹt cánh bơm hoặc rão ổ bi (bạc đạn) cơ khí. Động cơ bị cản trở chuyển động dẫn đến dòng khởi động tăng cao gây nóng và ồn.";
      temporaryAdvice = "Tắt máy, ngắt điện. Kiểm tra xem có dị vật mắc kẹt ở cánh quạt/cánh bơm không. Không để máy chạy rù rù vì sẽ làm cháy cuộn dây stator.";
      followUpQuestions.push("Quay thử trục cánh bằng tay khi đã ngắt điện có thấy trơn tru không?");
      followUpQuestions.push("Máy chạy được bao lâu thì bắt đầu phát ra tiếng ồn bất thường?");
    } else if (desc.includes("không quay") || desc.includes("nóng") || desc.includes("yếu")) {
      severity = "medium";
      confidence = 0.89;
      diagnosis = "Khả năng cao bị khô dầu/hỏng tụ ngậm khởi động (Capacitor) hoặc hỏng rơ-le nhiệt bảo vệ động cơ.";
      temporaryAdvice = "Để thiết bị nguội tự nhiên. Kiểm tra tụ kích và thông số điện áp đầu vào xem có bị sụt áp dưới 200V không.";
      followUpQuestions.push("Khi bật nguồn có nghe thấy tiếng o o từ động cơ không?");
      followUpQuestions.push("Thiết bị đã vận hành liên tục trong thời gian bao lâu trước khi ngưng?");
    } else {
      severity = "medium";
      confidence = 0.85;
      diagnosis = `Sự cố vận hành ở ${prod || "thiết bị động cơ"}. Cần kiểm tra hệ thống cấp nguồn và tiếp điểm điều khiển.`;
      temporaryAdvice = "Kiểm tra lại phích cắm, công tắc và nguồn cấp. Mang đến trung tâm bảo hành để đo cuộn dây.";
      followUpQuestions.push("Đèn báo nguồn trên thiết bị còn sáng không?");
    }
  }
  // Phân tích theo nhóm Thiết bị đóng cắt, Aptomat, Relay, Contactor
  else if (prod.includes("cb") || prod.includes("aptomat") || prod.includes("contactor") || prod.includes("relay") || prod.includes("rơ le") || prod.includes("khởi động từ")) {
    severity = "high";
    confidence = 0.92;
    diagnosis = "Khả năng quá tải dòng định mức, quá nhiệt thanh lưỡng kim hoặc tiếp điểm đóng cắt bị mòn/hàn dính do hồ quang điện.";
    temporaryAdvice = "Kiểm tra tổng công suất các tải phía sau thiết bị đóng cắt. Không cố gắng gạt cưỡng bức cần gạt nếu Aptomat liên tục nhảy.";
    followUpQuestions.push("Tổng công suất các thiết bị đang đấu nối sau CB là bao nhiêu Watt?");
    followUpQuestions.push("CB nhảy ngay khi vừa đóng lên hay sau khi chạy tải một khoảng thời gian?");
  }
  // Phân tích theo nhóm Thiết bị chiếu sáng / Đèn LED / Nguồn xung
  else if (prod.includes("đèn") || prod.includes("led") || prod.includes("nguồn") || prod.includes("driver") || prod.includes("adapter")) {
    if (desc.includes("chớp") || desc.includes("nhấp nháy") || desc.includes("mờ")) {
      severity = "low";
      confidence = 0.91;
      diagnosis = "Hỏng IC điều tốc/dao động hoặc phồng tụ lọc nguồn trong bộ nguồn Driver LED, dẫn đến điện áp DC đầu ra không ổn định.";
      temporaryAdvice = "Tắt công tắc đèn. Thay thế thử bộ Driver LED tương đương để xác định lỗi do nguồn hay chip LED.";
      followUpQuestions.push("Đèn chớp liên tục hay lúc sáng lúc tắt theo chu kỳ?");
      followUpQuestions.push("Điện áp cấp vào bộ nguồn có ổn định 220V không?");
    } else {
      severity = "medium";
      confidence = 0.87;
      diagnosis = "Đứt mạch chip LED nối tiếp hoặc hỏng cuộn biến áp của bộ chuyển đổi nguồn.";
      temporaryAdvice = "Kiểm tra đo thông mạch và ngắt cấp nguồn cho cụm đèn.";
      followUpQuestions.push("Các bóng đèn khác trên cùng nhánh có hoạt động bình thường không?");
    }
  }
  // Phân tích chung
  else {
    if (desc.includes("không lên") || desc.includes("mất nguồn") || desc.includes("không nguồn")) {
      severity = "medium";
      confidence = 0.86;
      diagnosis = `Đứt cầu chì bảo vệ đầu vào, lỏng chân cắm hoặc hỏng bo mạch nguồn sơ cấp của ${prod || "thiết bị"}.`;
      temporaryAdvice = "Kiểm tra ổ cắm, dây nguồn và thử đổi sang ổ điện khác. Không tự ý bẻ gãy tem bảo hành.";
      followUpQuestions.push("Dây nguồn của thiết bị có dấu hiệu bị gấp khúc, dập nát hay đứt ngầm không?");
      followUpQuestions.push("Khi cắm nguồn có nghe tiếng tạch hoặc có tia lửa nhỏ ở ổ cắm không?");
    } else {
      severity = "low";
      confidence = 0.82;
      diagnosis = `Ghi nhận lỗi: "${input.issueDescription}". Nghi ngờ sai lệch thông số cài đặt hoặc tiếp xúc cơ điện không ổn định.`;
      temporaryAdvice = "Tắt nguồn, vệ sinh bụi bẩn ở các khe tản nhiệt và kiểm tra lại hướng dẫn sử dụng sản phẩm.";
      followUpQuestions.push("Sự cố này xảy ra từ khi nào và lặp lại với tần suất như thế nào?");
    }
  }

  return {
    diagnosis,
    temporaryAdvice,
    severity,
    confidence,
    followUpQuestions: followUpQuestions.slice(0, 4),
  };
}

export async function analyzeWarrantyTicketWithGemini(input: {
  productName?: string | null;
  serialNumber?: string | null;
  issueDescription: string;
}): Promise<WarrantyTicketAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  // Nếu không có API key hoặc key ở dạng placeholder/sai định dạng Google AI Studio, kích hoạt fallback engine
  if (!apiKey || apiKey.startsWith("AQ.") || apiKey === "your-gemini-api-key") {
    console.warn("[Gemini AI] Using Intelligent Fallback Diagnostic Engine (No valid Gemini API key configured)");
    return generateFallbackElectricalAnalysis(input);
  }

  const prompt = buildWarrantyTicketPrompt(input);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 2048,
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

    if (!response.ok) {
      console.warn(`[Gemini AI] API responded with status ${response.status}. Falling back to Electrical Diagnostic Engine.`);
      return generateFallbackElectricalAnalysis(input);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
    const parsed = safeJsonParse<WarrantyTicketAnalysis>(extractJsonBlock(text));

    if (!parsed) {
      return generateFallbackElectricalAnalysis(input);
    }

    return {
      diagnosis: parsed.diagnosis || "Chưa xác định",
      temporaryAdvice: parsed.temporaryAdvice || "Kiểm tra thêm thông tin lỗi.",
      severity: ["low", "medium", "high"].includes(parsed.severity) ? parsed.severity : "medium",
      confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.85,
      followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions.filter(Boolean).slice(0, 5) : [],
    };
  } catch (error) {
    console.warn("[Gemini AI] Call failed or timed out. Falling back to Electrical Diagnostic Engine:", error);
    return generateFallbackElectricalAnalysis(input);
  } finally {
    clearTimeout(timeout);
  }
}
