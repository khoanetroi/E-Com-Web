export interface BrandItem {
    id: string;
    brand_name: string;
    logo_url: string | null;
    created_at?: string;
}

export const BRAND_LIST: BrandItem[] = [
    {
        id: "03fde88e-4fd2-45f1-a5b3-f9dda8b65701",
        brand_name: "PROVA",
        logo_url: "https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcSw3qUfqPj9-Ib_ciuPCB0LDAK_oNAaCVsvi1aYJLoe6f_8pAxI",
        created_at: "2026-03-01 04:00:57.785603+00"
    },
    {
        id: "04a878c0-38c5-4da9-9cc3-e72e1cf4d197",
        brand_name: "ACCUTEST",
        logo_url: "https://zqhksdkenxfubtpglmix.supabase.co/storage/v1/object/public/products/brand-logos/accutest-1772337512694.webp",
        created_at: "2026-03-01 03:58:32.665871+00"
    },
    {
        id: "1487ef49-eaa4-4c43-b7e0-f214e3bb422f",
        brand_name: "WELLINK",
        logo_url: "https://zqhksdkenxfubtpglmix.supabase.co/storage/v1/object/public/products/brand-logos/wellink-1772352559056.webp",
        created_at: "2026-03-01 08:09:19.020042+00"
    },
    {
        id: "22692219-d585-4cae-bf6d-ee8c76a43df7",
        brand_name: "HIOKI",
        logo_url: "https://www.hioki.com/sites/default/files/2021-03/client_upload_13_1450226237909.jpeg",
        created_at: "2026-03-01 03:14:43.710234+00"
    },
    {
        id: "4e441005-f316-4ee1-af0a-83fb83bac8c0",
        brand_name: "APECH",
        logo_url: "https://zqhksdkenxfubtpglmix.supabase.co/storage/v1/object/public/products/brand-logos/apech-1772272162310.webp",
        created_at: "2026-02-28 04:38:33.050685+00"
    },
    {
        id: "5365c08c-2b43-41e2-9a7d-d8bce7f6e42d",
        brand_name: "VICTOR",
        logo_url: "https://cherkessk.pribor-x.ru/upload/iblock/dd4/4hasqoj9mheg0xju9pnxac9jroz6j7ny/victor-logo.png",
        created_at: "2026-03-01 03:47:52.910637+00"
    },
    {
        id: "62033a38-6b5e-4f22-8918-d8671d78889e",
        brand_name: "CENTER",
        logo_url: "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcR9EtMdyCu2_v5bd4VphXl-h2d2tIjMHmc4LI61JhrGErYKqlnW",
        created_at: "2026-03-01 04:02:06.702225+00"
    },
    {
        id: "6261e980-c2a7-4c58-a75f-da6b024aac57",
        brand_name: "FLUS",
        logo_url: "https://sc04.alicdn.com/kf/Hf2b8a59a4670451badfb92ed0c9f563eN.jpg",
        created_at: "2026-03-01 04:04:13.265896+00"
    },
    {
        id: "754dcd1a-f605-442a-b6b6-523ce3259604",
        brand_name: "FLUKE",
        logo_url: "https://upload.wikimedia.org/wikipedia/commons/6/62/Fluke_Corporation_logo.svg",
        created_at: "2026-02-28 04:38:37.975688+00"
    },
    {
        id: "8bbe6e15-fd41-407c-a860-53be7273b21b",
        brand_name: "SANWA",
        logo_url: "https://upload.wikimedia.org/wikipedia/commons/a/ad/Sanwa.logo.png",
        created_at: "2026-03-01 03:59:50.354529+00"
    },
    {
        id: "92c8923d-d4bc-46c1-9443-03261c8f44fd",
        brand_name: "AMPROBE",
        logo_url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRnUKFebVEumIOvz3EA-Qy2C69xe1OIf052fw&s",
        created_at: "2026-03-01 04:02:38.887822+00"
    },
    {
        id: "c32ec611-a1f9-4aba-87ca-164fa7383c4f",
        brand_name: "KYORITSU",
        logo_url: "https://linhkiennganhlanh.com/wp-content/uploads/2019/07/kyoritsu-logo.jpg",
        created_at: "2026-03-01 03:57:29.521218+00"
    },
    {
        id: "c43e60f1-e03d-4ab9-89ee-827885b0e2a9",
        brand_name: "LUTRON",
        logo_url: "https://anphaco.com/wp-content/uploads/2024/09/0065_lutron-logo.jpg.jpg",
        created_at: "2026-03-01 04:03:12.508868+00"
    },
    {
        id: "df536997-1a70-425d-8512-0d0b510eaf45",
        brand_name: "DER EE",
        logo_url: "https://storage.googleapis.com/www.taiwantradeshow.com.tw/exhibitor-logo/202507/T-66057192.jpg",
        created_at: "2026-03-01 04:00:25.932887+00"
    }
];

/**
 * Get brand logo URL by brand name (case-insensitive)
 */
export function getBrandLogo(brandName?: string | null): string | null {
    if (!brandName || brandName === "NoBrand") return null;
    const match = BRAND_LIST.find(b => b.brand_name.toLowerCase() === brandName.toLowerCase());
    return match?.logo_url || null;
}

/**
 * Get BrandItem object by brand name (case-insensitive)
 */
export function getBrandByName(brandName?: string | null): BrandItem | undefined {
    if (!brandName) return undefined;
    return BRAND_LIST.find(b => b.brand_name.toLowerCase() === brandName.toLowerCase());
}
