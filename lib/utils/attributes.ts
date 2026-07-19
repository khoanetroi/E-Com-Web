export function getAttributeSortPriority(attributeName: string): number {
    const lower = attributeName.toLowerCase();

    // Priority 1: Base product selection (Sản phẩm, Máy, Model, Phân loại)
    if (
        lower.includes("sản phẩm") ||
        lower.includes("máy") ||
        lower.includes("model") ||
        lower.includes("phân loại") ||
        lower === "chọn sản phẩm"
    ) {
        return 1;
    }

    // Priority 2: Primary variations (Color, Storage, Material)
    if (
        lower.includes("màu") ||
        lower.includes("color") ||
        lower.includes("dunh lượng") ||
        lower.includes("bộ nhớ") ||
        lower.includes("chất liệu")
    ) {
        return 2;
    }

    // Priority 3: Secondary variations/Accessories (Dây đo, Phụ kiện, Combo)
    if (
        lower.includes("dây đo") ||
        lower.includes("phụ kiện") ||
        lower.includes("combo") ||
        lower.includes("kèm")
    ) {
        return 3;
    }

    // Priority 4: Size/Specs (Kích thước, Size, Chiều dài)
    if (
        lower.includes("kích thước") ||
        lower.includes("size") ||
        lower.includes("chiều dài")
    ) {
        return 4;
    }

    // Default priority for everything else
    return 99;
}

export function sortAttributes(a: string, b: string): number {
    const priorityA = getAttributeSortPriority(a);
    const priorityB = getAttributeSortPriority(b);

    if (priorityA === priorityB) {
        // Fallback to alphabetical if same priority
        return a.localeCompare(b);
    }

    return priorityA - priorityB;
}
