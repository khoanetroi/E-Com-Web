import { Metadata } from "next"
import BrandPage from "@/views/Brand"
import DefaultLayout from "@/components/layout/DefaultLayout"

const SITE_URL = "https://www.telectric.vn";

export const metadata: Metadata = {
    title: "Thương Hiệu | TELECTRIC - Điểm Tựa Kỹ Thuật",
    description:
        "TELECTRIC - Chuyên gia thiết bị đo điện chính hãng. Phân phối Fluke, Hioki, Kyoritsu, Sanwa, APECH. Cam kết đền gấp 10 lần nếu phát hiện hàng giả.",
    alternates: {
        canonical: `${SITE_URL}/brands`,
    },
    openGraph: {
        title: "Thương Hiệu | TELECTRIC - Điểm Tựa Kỹ Thuật",
        description:
            "TELECTRIC - Chuyên gia thiết bị đo điện chính hãng. Phân phối Fluke, Hioki, Kyoritsu, Sanwa, APECH.",
        type: "website",
        url: `${SITE_URL}/brands`,
    },
}

export default function Page() {
    return (
        <DefaultLayout>
            <BrandPage />
        </DefaultLayout>
    )
}
