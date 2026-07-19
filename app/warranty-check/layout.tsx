import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Tra Cứu Bảo Hành | TLECTRIC",
    description: "Tra cứu thông tin bảo hành sản phẩm TLECTRIC bằng số điện thoại. Kiểm tra tình trạng bảo hành nhanh chóng và chính xác.",
};

export default function WarrantyCheckLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
