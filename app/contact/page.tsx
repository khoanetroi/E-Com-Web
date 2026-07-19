import { Metadata } from "next";
import ContactPage from "@/views/Contact/ContactPage";

const SITE_URL = "https://www.telectric.vn";

export const metadata: Metadata = {
    title: "Liên Hệ | TELECTRIC - Điểm Tựa Kỹ Thuật",
    description:
        "Liên hệ TELECTRIC để được tư vấn thiết bị đo lường chính hãng. Hotline: 0934.001.435. Hỗ trợ nhanh chóng qua Zalo, email.",
    alternates: {
        canonical: `${SITE_URL}/contact`,
    },
    openGraph: {
        title: "Liên Hệ | TELECTRIC - Điểm Tựa Kỹ Thuật",
        description:
            "Liên hệ TELECTRIC để được tư vấn thiết bị đo lường chính hãng. Hỗ trợ nhanh chóng qua hotline, email và showroom.",
        type: "website",
        url: `${SITE_URL}/contact`,
    },
};

export default function Page() {
    return <ContactPage />;
}
