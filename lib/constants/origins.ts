// Danh sách quốc gia chuẩn (tiếng Anh) + alias để match dữ liệu cũ
export interface OriginEntry {
    label: string;       // Tên chuẩn hiển thị
    aliases: string[];   // Các biến thể có thể gặp (lowercase)
}

export const ORIGIN_LIST: OriginEntry[] = [
    { label: "Japan", aliases: ["japan", "jp", "nhật bản", "nhat ban", "nhật", "nhat"] },
    { label: "China", aliases: ["china", "cn", "trung quốc", "trung quoc"] },
    { label: "Thailand", aliases: ["thailand", "thai lan", "thailan", "thái lan", "th"] },
    { label: "Taiwan", aliases: ["taiwan", "tw", "đài loan", "dai loan"] },
    { label: "USA", aliases: ["usa", "us", "mỹ", "my", "united states", "america"] },
    { label: "South Korea", aliases: ["south korea", "korea", "kr", "hàn quốc", "han quoc"] },
    { label: "Malaysia", aliases: ["malaysia", "mã lai", "ma lai"] },
    { label: "Switzerland", aliases: ["switzerland", "ch", "thụy sĩ", "thuy si", "thuỵ sĩ"] },
    { label: "Germany", aliases: ["germany", "de", "đức", "duc"] },
    { label: "Vietnam", aliases: ["vietnam", "vn", "việt nam", "viet nam"] },
    { label: "India", aliases: ["india", "in", "ấn độ", "an do"] },
    { label: "Indonesia", aliases: ["indonesia", "id"] },
    { label: "Singapore", aliases: ["singapore", "sg"] },
    { label: "Italy", aliases: ["italy", "it", "ý", "italia"] },
    { label: "France", aliases: ["france", "fr", "pháp", "phap"] },
    { label: "UK", aliases: ["uk", "united kingdom", "england", "anh", "great britain"] },
    { label: "Australia", aliases: ["australia", "au", "úc", "uc"] },
    { label: "Philippines", aliases: ["philippines", "ph", "phi"] },
    { label: "Netherlands", aliases: ["netherlands", "nl", "hà lan", "ha lan"] },
    { label: "Spain", aliases: ["spain", "es", "tây ban nha", "tay ban nha"] },
    { label: "Canada", aliases: ["canada", "ca"] },
    { label: "Brazil", aliases: ["brazil", "br"] },
    { label: "Mexico", aliases: ["mexico", "mx"] },
    { label: "Sweden", aliases: ["sweden", "se", "thụy điển", "thuy dien"] },
    { label: "Denmark", aliases: ["denmark", "dk", "đan mạch", "dan mach"] },
];

/**
 * Normalize một chuỗi origin thô về tên chuẩn.
 * "JAPAN" → "Japan", "thai lan" → "Thailand", "Mỹ" → "USA"
 */
export function normalizeOrigin(raw: string): string {
    if (!raw) return raw;
    const lower = raw.toLowerCase().trim().replace(/\s+/g, " ");

    for (const entry of ORIGIN_LIST) {
        // Match exact label (case-insensitive)
        if (entry.label.toLowerCase() === lower) return entry.label;
        // Match any alias
        if (entry.aliases.includes(lower)) return entry.label;
    }

    // Không match → trả về nguyên gốc (capitalize first letter)
    return raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1).toLowerCase();
}

/**
 * Nhóm danh sách origins thô theo tên chuẩn.
 * Input: ["Japan", "JAPAN", "japan", "China", "Trung Quốc"]
 * Output: Map { "Japan" => ["Japan", "JAPAN", "japan"], "China" => ["China", "Trung Quốc"] }
 */
export function groupOrigins(rawOrigins: string[]): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const raw of rawOrigins) {
        const normalized = normalizeOrigin(raw);
        if (!map.has(normalized)) map.set(normalized, []);
        map.get(normalized)!.push(raw);
    }
    return map;
}
