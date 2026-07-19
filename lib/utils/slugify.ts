/**
 * Generate a URL-friendly slug from a Vietnamese product name.
 *
 * Examples:
 *   "Đồng hồ vạn năng Fluke 101"  →  "dong-ho-van-nang-fluke-101"
 *   "Ampe kìm AC/DC 600A"         →  "ampe-kim-ac-dc-600a"
 */
export function generateSlug(name: string): string {
    return name
        .normalize("NFD")                       // decompose diacritics
        .replace(/[\u0300-\u036f]/g, "")        // remove combining marks
        .replace(/đ/g, "d")                     // Vietnamese đ → d
        .replace(/Đ/g, "d")                     // Vietnamese Đ → d
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")           // remove non-alphanumeric (keep spaces & dashes)
        .replace(/\s+/g, "-")                   // spaces → dashes
        .replace(/-+/g, "-")                    // collapse multiple dashes
        .replace(/^-|-$/g, "");                 // trim leading/trailing dashes
}
