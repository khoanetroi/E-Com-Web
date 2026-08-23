import type { WarrantyTicketAnalysis } from "@/lib/warranty-ticket";
import { extractJsonBlock, safeJsonParse } from "./utils/jsonHelper";

const DEFAULT_MODEL = "gemini-3.5-flash";

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

// ---------------------------------------------------------------------------
// Fallback theo danh mục sản phẩm — dùng khi Gemini lỗi/timeout/parse fail.
// Khớp productName với từ khóa của từng danh mục thực tế trên Telectric.
// ---------------------------------------------------------------------------

type ProductCategory =
  | "ampe-kim"
  | "dong-ho-van-nang"
  | "thiet-bi-do-moi-truong"
  | "thiet-bi-do-nhiet-do"
  | "thiet-bi-do-chuyen-dung"
  | "phu-kien"
  | "generic";

const CATEGORY_KEYWORDS: Record<Exclude<ProductCategory, "generic">, string[]> = {
  "ampe-kim": ["ampe kìm", "ampe kim", "kìm đo dòng", "clamp meter", "kim do dong dien"],
  "dong-ho-van-nang": ["đồng hồ vạn năng", "dong ho van nang", "multimeter", "vom"],
  "thiet-bi-do-moi-truong": [
    "đo môi trường", "do moi truong", "đo độ ẩm", "đo ánh sáng", "lux meter",
    "đo tiếng ồn", "sound level", "đo khí", "gas detector", "anemometer", "đo gió",
  ],
  "thiet-bi-do-nhiet-do": [
    "đo nhiệt độ", "do nhiet do", "nhiệt kế", "nhiet ke", "hồng ngoại",
    "thermometer", "infrared", "nhiệt độ ẩm",
  ],
  "thiet-bi-do-chuyen-dung": [
    "megohm", "đo điện trở cách điện", "đo điện trở đất", "earth tester",
    "insulation tester", "đo công suất", "power meter", "osciloscope", "máy hiện sóng",
    "đo cách điện", "phân tích chất lượng điện",
  ],
  "phu-kien": ["que đo", "dây đo", "test lead", "pin", "sạc", "túi đựng", "bao da", "cáp kết nối", "adapter"],
};

function detectProductCategory(productName?: string | null): ProductCategory {
  if (!productName) return "generic";
  const normalized = productName.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    Exclude<ProductCategory, "generic">,
    string[],
  ][]) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      return category;
    }
  }
  return "generic";
}

interface FallbackContent {
  diagnosis: string;
  temporaryAdvice: string;
}

const CATEGORY_FALLBACKS: Record<ProductCategory, { client: FallbackContent; admin: FallbackContent }> = {
  "ampe-kim": {
    client: {
      diagnosis:
        "Hệ thống chưa thể phân tích tự động lỗi trên ampe kìm của bạn lúc này. Đây có thể liên quan đến pin yếu, tiếp xúc que đo hoặc thao tác đo chưa đúng thang đo. Đội kỹ thuật sẽ kiểm tra và phản hồi sớm.",
      temporaryAdvice:
        "Bạn vui lòng kiểm tra và thay pin mới, đảm bảo que đo cắm đúng cổng, chọn đúng thang đo (dòng AC/DC) phù hợp với thiết bị cần đo trước khi sử dụng lại.",
    },
    admin: {
      diagnosis:
        "Không thể phân tích tự động (Gemini lỗi). Cần kỹ thuật viên kiểm tra thủ công — hướng nghi vấn ưu tiên: pin/nguồn, tiếp xúc que đo, hỏng cảm biến dòng (CT), sai thang đo, hoặc lỗi mạch hiển thị.",
      temporaryAdvice:
        "Yêu cầu khách cung cấp thêm: model chính xác, thang đo đang dùng khi lỗi xảy ra, có hiện số/màn hình không, có mùi khét hay không. Kiểm tra lịch sử bảo hành trước khi lên lịch nhận máy.",
    },
  },
  "dong-ho-van-nang": {
    client: {
      diagnosis:
        "Hệ thống chưa thể phân tích tự động lỗi trên đồng hồ vạn năng của bạn lúc này. Lỗi thường gặp liên quan đến pin, cầu chì bên trong máy hoặc que đo. Đội kỹ thuật sẽ kiểm tra và phản hồi sớm.",
      temporaryAdvice:
        "Bạn vui lòng kiểm tra pin, thử đổi que đo khác (nếu có) và xác nhận đã chọn đúng chức năng đo (V/A/Ω) tương ứng với đại lượng cần đo.",
    },
    admin: {
      diagnosis:
        "Không thể phân tích tự động (Gemini lỗi). Cần kỹ thuật viên kiểm tra thủ công — hướng nghi vấn ưu tiên: pin/nguồn, cầu chì nội bộ đứt do đo sai thang, hỏng que đo, lỗi chuyển mạch xoay hoặc hỏng IC ADC.",
      temporaryAdvice:
        "Yêu cầu khách cung cấp thêm: model, chức năng đang đo khi phát hiện lỗi, màn hình có hiển thị gì bất thường không (0L, nhấp nháy, mất nguồn). Kiểm tra cầu chì trước khi trả lời khách.",
    },
  },
  "thiet-bi-do-moi-truong": {
    client: {
      diagnosis:
        "Hệ thống chưa thể phân tích tự động lỗi trên thiết bị đo môi trường của bạn lúc này. Có thể liên quan đến cảm biến hoặc điều kiện môi trường đo. Đội kỹ thuật sẽ kiểm tra và phản hồi sớm.",
      temporaryAdvice:
        "Bạn vui lòng kiểm tra pin/nguồn, vệ sinh nhẹ khu vực cảm biến (không dùng hóa chất mạnh) và đo lại ở môi trường bình thường để đối chiếu kết quả.",
    },
    admin: {
      diagnosis:
        "Không thể phân tích tự động (Gemini lỗi). Cần kỹ thuật viên kiểm tra thủ công — hướng nghi vấn ưu tiên: cảm biến bị bẩn/hỏng, sai lệch do chưa hiệu chuẩn (calibration), pin yếu ảnh hưởng độ chính xác, hoặc lỗi firmware.",
      temporaryAdvice:
        "Yêu cầu khách cung cấp thêm: model, loại cảm biến (độ ẩm/ánh sáng/khí/gió...), giá trị đo được so với giá trị kỳ vọng, thời gian sử dụng/lần hiệu chuẩn gần nhất.",
    },
  },
  "thiet-bi-do-nhiet-do": {
    client: {
      diagnosis:
        "Hệ thống chưa thể phân tích tự động lỗi trên thiết bị đo nhiệt độ của bạn lúc này. Có thể do pin yếu, cảm biến bị che khuất hoặc chưa hiệu chuẩn. Đội kỹ thuật sẽ kiểm tra và phản hồi sớm.",
      temporaryAdvice:
        "Bạn vui lòng kiểm tra pin, đảm bảo đầu cảm biến/mắt hồng ngoại sạch và không bị che, đo lại ở khoảng cách khuyến nghị trong hướng dẫn sử dụng.",
    },
    admin: {
      diagnosis:
        "Không thể phân tích tự động (Gemini lỗi). Cần kỹ thuật viên kiểm tra thủ công — hướng nghi vấn ưu tiên: sai số do chưa hiệu chuẩn, cảm biến hồng ngoại bị bẩn/hỏng, pin yếu, hoặc sai hệ số phát xạ (emissivity) khi đo.",
      temporaryAdvice:
        "Yêu cầu khách cung cấp thêm: model, giá trị đo được vs. giá trị thực tế ước lượng, khoảng cách đo, vật liệu bề mặt đo (ảnh hưởng emissivity).",
    },
  },
  "thiet-bi-do-chuyen-dung": {
    client: {
      diagnosis:
        "Hệ thống chưa thể phân tích tự động lỗi trên thiết bị đo chuyên dụng của bạn lúc này. Đây là dòng thiết bị có thông số kỹ thuật đặc thù, cần kỹ thuật viên xem trực tiếp. Đội kỹ thuật sẽ phản hồi sớm.",
      temporaryAdvice:
        "Bạn vui lòng giữ nguyên hiện trạng thiết bị, chụp ảnh/quay video lỗi (nếu có thể) và mô tả chi tiết thao tác lúc phát sinh lỗi để hỗ trợ xử lý nhanh hơn.",
    },
    admin: {
      diagnosis:
        "Không thể phân tích tự động (Gemini lỗi). Đây là thiết bị đo chuyên dụng (megohm, earth tester, power meter, osciloscope...) — cần kỹ thuật viên có chuyên môn kiểm tra trực tiếp, không nên chẩn đoán chung chung.",
      temporaryAdvice:
        "Yêu cầu khách cung cấp thêm: model chính xác, thông số/thang đo đang sử dụng, log lỗi hoặc mã lỗi hiển thị (nếu có), và lịch sử hiệu chuẩn/bảo trì gần nhất.",
    },
  },
  "phu-kien": {
    client: {
      diagnosis:
        "Hệ thống chưa thể phân tích tự động lỗi trên phụ kiện của bạn lúc này. Phụ kiện (que đo, dây đo, pin, sạc, túi đựng...) thường ít lỗi phức tạp nên sẽ được kiểm tra và phản hồi rất nhanh.",
      temporaryAdvice:
        "Bạn vui lòng kiểm tra kết nối/tiếp xúc của phụ kiện với thiết bị chính, và thử dùng phụ kiện khác tương thích (nếu có) để xác định lỗi ở phụ kiện hay ở máy chính.",
    },
    admin: {
      diagnosis:
        "Không thể phân tích tự động (Gemini lỗi). Phụ kiện đi kèm (que đo/dây đo/pin/sạc/túi đựng...) — ưu tiên kiểm tra nhanh bằng cách thay thế linh kiện tương đương để cô lập lỗi trước khi xử lý bảo hành.",
      temporaryAdvice:
        "Yêu cầu khách xác nhận: phụ kiện đi kèm máy nào, lỗi có xảy ra khi dùng phụ kiện khác thay thế không, có dấu hiệu hư hỏng vật lý (đứt dây, cháy, gãy đầu nối) không.",
    },
  },
  generic: {
    client: {
      diagnosis:
        "Hệ thống chưa thể phân tích tự động lỗi này ngay lúc này. Đội ngũ kỹ thuật sẽ kiểm tra và phản hồi cho bạn sớm nhất có thể.",
      temporaryAdvice:
        "Trong lúc chờ, bạn vui lòng kiểm tra lại nguồn/pin, kết nối và các hướng dẫn sử dụng cơ bản kèm theo sản phẩm.",
    },
    admin: {
      diagnosis:
        "Không thể phân tích tự động (Gemini lỗi). Cần kỹ thuật viên kiểm tra thủ công dựa trên mô tả lỗi của ticket.",
      temporaryAdvice:
        "Kiểm tra thủ công dựa trên mô tả lỗi, ảnh/video đính kèm (nếu có) và lịch sử bảo hành sản phẩm.",
    },
  },
};

function buildFallbackAnalysis(
  input: { productName?: string | null; requesterRole?: 'client' | 'admin' },
  reason: string,
): WarrantyTicketAnalysis {
  const isClient = input.requesterRole === 'client';
  const category = detectProductCategory(input.productName);
  const content = CATEGORY_FALLBACKS[category][isClient ? "client" : "admin"];

  return {
    diagnosis: isClient ? content.diagnosis : `[${reason}] ${content.diagnosis}`,
    temporaryAdvice: content.temporaryAdvice,
    severity: "medium",
    confidence: 0,
    followUpQuestions: [],
  };
}

export async function analyzeWarrantyTicketWithGemini(input: {
  productName?: string | null;
  serialNumber?: string | null;
  issueDescription: string;
  requesterRole?: 'client' | 'admin';
}): Promise<WarrantyTicketAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Missing GEMINI_API_KEY, returning fallback analysis");
    return buildFallbackAnalysis(input, "missing_api_key");
  }

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const prompt = buildWarrantyTicketPrompt(input);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
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
      const reason = error instanceof DOMException && error.name === "AbortError"
        ? "timeout"
        : "network_error";
      console.error(`Gemini fetch failed (${reason}):`, error);
      return buildFallbackAnalysis(input, reason);
    }

    if (!response.ok) {
      console.error(`Gemini request failed: ${response.status}`);
      return buildFallbackAnalysis(input, `http_${response.status}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text || "").join("") || "";
    const parsed = safeJsonParse<WarrantyTicketAnalysis>(extractJsonBlock(text));

    if (!parsed) {
      console.error("Gemini response is not valid JSON:", text);
      return buildFallbackAnalysis(input, "invalid_json");
    }

    return {
      diagnosis: parsed.diagnosis || "Chưa xác định",
      temporaryAdvice: parsed.temporaryAdvice || "Kiểm tra thêm thông tin lỗi.",
      severity: ["low", "medium", "high"].includes(parsed.severity) ? parsed.severity : "medium",
      confidence: typeof parsed.confidence === "number" ? Math.max(0, Math.min(1, parsed.confidence)) : 0.5,
      followUpQuestions: Array.isArray(parsed.followUpQuestions) ? parsed.followUpQuestions.filter(Boolean).slice(0, 5) : [],
    };
  } catch (error) {
    console.error("Unexpected error analyzing warranty ticket:", error);
    return buildFallbackAnalysis(input, "unexpected_error");
  } finally {
    clearTimeout(timeout);
  }
}