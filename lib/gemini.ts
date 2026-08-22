import type { WarrantyTicketAnalysis } from "@/lib/warranty-ticket";
import { extractJsonBlock, safeJsonParse } from "./utils/jsonHelper";

const DEFAULT_MODEL = "gemini-1.5-flash";

export function buildWarrantyTicketPrompt(input: {
  productName?: string | null;
  serialNumber?: string | null;
  issueDescription: string;
  requesterRole?: 'client' | 'admin';
}) {
  const isClient = input.requesterRole === 'client';

  const roleInstruction = isClient
    ? `Nhiệm vụ: phân tích ticket lỗi do khách hàng mô tả và đưa ra chẩn đoán sơ bộ cùng lời khuyên xử lý tạm thời trực tiếp cho khách hàng. Lời lẽ cần nhẹ nhàng, trấn an, lịch sự và hướng dẫn cách xử lý cơ bản nhất có thể làm tại nhà hoặc gửi bảo hành.`
    : `Nhiệm vụ: phân tích ticket lỗi do khách hàng mô tả và đưa ra chẩn đoán sơ bộ cùng lời khuyên xử lý tạm thời cho quản trị viên. Chẩn đoán và lời khuyên cần chi tiết để kỹ thuật viên hiểu rõ nhất`;

  return [
    "Bạn là trợ lý kỹ thuật hậu mãi cho hệ thống thương mại điện tử thiết bị điện công nghiệp Telectric.",
    roleInstruction,
    isClient
      ? "Quan trọng: luôn luôn dựa vào tên sản phẩm, mô tả lỗi của sản phẩm để đưa ra chẩn đoán cơ bản, nhẹ nhàng để tránh người dùng cảm thấy tiêu cực về sản phẩm, lời khuyên cần dễ hiểu với người dùng, không nên dùng quá nhiều thuật ngữ kỹ thuật"
      : "Quan trọng: luôn luôn dựa vào tên sản phẩm, mô tả lỗi của sản phẩm để đưa ra chẩn đoán và lời khuyên chính xác nhất, không trả lời chung chung.",
    "Không tư vấn bán hàng, không gợi ý sản phẩm, không suy diễn ngoài nội dung mô tả của ticket.",
    "Nếu dữ liệu chưa đủ, nêu rõ giới hạn thông tin; không khẳng định chắc chắn hoặc suy diễn ngoài ticket.",
    "Trả về đúng JSON với các khóa: diagnosis, temporaryAdvice, severity, confidence, followUpQuestions.",
    "severity chỉ được là low, medium hoặc high.",
    "confidence là số từ 0 đến 1.",
    "followUpQuestions là mảng câu hỏi cần hỏi thêm nếu còn thiếu thông tin.",
    isClient
      ? "Ngôn ngữ phản hồi phải là tiếng Việt, có dấu, nhẹ nhàng, thân thiện, dễ hiểu cho người dùng cuối."
      : "Ngôn ngữ phản hồi phải là tiếng Việt, có dấu, ngắn gọn, thực dụng, phù hợp cho admin và kỹ thuật viên xem và xử lý.",
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
  // Phân tích theo nhóm Đèn chiếu sáng, LED, Driver
  else if (prod.includes("đèn") || prod.includes("led") || prod.includes("driver") || prod.includes("nguồn")) {
    if (desc.includes("chớp") || desc.includes("nhấp nháy") || desc.includes("mờ")) {
      severity = "low";
      confidence = 0.91;
      diagnosis = "Hỏng IC điều tốc/dao động hoặc phồng tụ lọc nguồn trong bộ nguồn Driver LED, dẫn đến điện áp DC đầu ra không ổn định.";
      temporaryAdvice = "Tắt công tắc đèn. Thay thế thử bộ Driver LED tương đương để xác định lỗi do nguồn hay chip LED.";
      followUpQuestions.push("Đèn chớp liên tục hay lúc sáng lúc tắt theo chu kỳ?");
      followUpQuestions.push("Điện áp cấp vào bộ nguồn có ổn định 220V không?");
    } else {
      severity = "low";
      confidence = 0.86;
      diagnosis = "Đứt mạch chip LED nối tiếp hoặc hỏng hoàn toàn bộ nguồn chuyển đổi AC-DC.";
      temporaryAdvice = "Dùng bút thử điện kiểm tra nguồn 220V cấp vào Driver. Nếu có điện vào nhưng đèn không sáng thì thay Driver mới.";
      followUpQuestions.push("Có bao nhiêu bóng/mô-đun trong hệ thống bị tắt cùng lúc?");
    }
  }
  // Phân tích theo nhóm Thiết bị đo điện (Đồng hồ VOM, Ampe kìm, Megomet)
  else if (prod.includes("đồng hồ") || prod.includes("ampe") || prod.includes("vom") || prod.includes("kẹp") || prod.includes("fluke") || prod.includes("hioki") || prod.includes("sanwa")) {
    if (desc.includes("sai") || desc.includes("nhảy số") || desc.includes("lệch")) {
      severity = "medium";
      confidence = 0.88;
      diagnosis = "Pin nguồn yếu dưới mức chuẩn hoặc que đo bị tăng nội trở tiếp xúc; cảm biến Hall/mạch ADC bị lệch chuẩn hiệu chuẩn (Calibration).";
      temporaryAdvice = "Thay pin mới chất lượng cao (Alkaline). Vệ sinh sạch tiếp điểm que đo bằng cồn kỹ thuật.";
      followUpQuestions.push("Biểu tượng cảnh báo pin yếu (Low Battery) có hiển thị trên màn hình không?");
      followUpQuestions.push("Khi chập hai que đo ở thang đo thông mạch/điện trở thì giá trị hiển thị là bao nhiêu?");
    } else {
      severity = "medium";
      confidence = 0.87;
      diagnosis = "Đứt cầu chì bảo vệ quá dòng (Fast-blow fuse) bên trong thiết bị đo do vô tình đo nhầm thang điện áp khi cắm que ở cổng mA/A.";
      temporaryAdvice = "Tháo nắp pin kiểm tra cầu chì bảo vệ. Thay đúng chủng loại và trị số cầu chì khuyến cáo của nhà sản xuất.";
      followUpQuestions.push("Đồng hồ có còn sáng màn hình hoặc phát tiếng bip khi bật nguồn không?");
    }
  }
  // Trường hợp thiết bị khác hoặc mô tả chung
  else {
    severity = "medium";
    confidence = 0.82;
    diagnosis = `Phát hiện bất thường cơ điện tại ${input.productName || "thiết bị"}. Triệu chứng: "${input.issueDescription}". Khả năng phát sinh từ bộ cấp nguồn hoặc linh kiện chấp hành.`;
    temporaryAdvice = "Ngắt thiết bị khỏi nguồn điện chính. Kiểm tra trực quan dây dẫn, giắc cắm và gửi đến trung tâm bảo hành TELECTRIC.";
    followUpQuestions.push("Sự cố xảy ra đột ngột hay có dấu hiệu suy giảm hiệu năng từ trước?");
    followUpQuestions.push("Môi trường làm việc của thiết bị có bị ẩm ướt, nhiều bụi hoặc nhiệt độ cao không?");
  }

  return {
    diagnosis,
    temporaryAdvice,
    severity,
    confidence,
    followUpQuestions
  };
}

export async function analyzeWarrantyTicketWithGemini(input: {
  productName?: string | null;
  serialNumber?: string | null;
  issueDescription: string;
  requesterRole?: 'client' | 'admin';
}): Promise<WarrantyTicketAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  // Nếu không có API Key hoặc key là placeholder/invalid format -> Chạy Fallback Engine
  if (!apiKey || apiKey.length < 20 || apiKey.startsWith("YOUR_") || apiKey.startsWith("AQ.")) {
    console.log("[Gemini AI] Using Intelligent Fallback Diagnostic Engine (No valid Gemini API key configured)");
    return generateFallbackElectricalAnalysis(input);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const prompt = buildWarrantyTicketPrompt(input);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });

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
