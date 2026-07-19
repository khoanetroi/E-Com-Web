import PolicyLayout from "@/views/Policies/PolicyLayout";

export const metadata = {
    title: "Hướng Dẫn Mua Hàng | Telectric.vn",
    description: "Hướng dẫn các phương thức mua hàng tại Telectric.vn",
};

export default function HuongDanMuaHangPage() {
    return (
        <PolicyLayout title="Hướng Dẫn Mua Hàng">
            <h2>1.1. Các Phương Thức Đặt Hàng</h2>
            <p>Chúng tôi hỗ trợ đa dạng các phương thức đặt hàng nhằm mang lại sự tiện lợi tối đa cho Quý khách:</p>
            <p>
                <strong>Cách 1: Đặt hàng qua Hotline/Zalo</strong><br />
                Quý khách có nhu cầu mua sắm hoặc tư vấn kỹ thuật, vui lòng liên hệ Hotline/Zalo: <strong>093.400.14.35</strong>. Đội ngũ tư vấn viên của chúng tôi luôn sẵn sàng hỗ trợ từ 09:00 – 17:30 hàng ngày.
            </p>
            <p>
                <strong>Cách 2: Đặt hàng trực tuyến qua website Telectric.vn</strong>
            </p>
            <ul>
                <li><strong>Bước 1:</strong> Truy cập website <strong>Telectric.vn</strong> và lựa chọn sản phẩm mong muốn.</li>
                <li><strong>Bước 2:</strong> Tại trang chi tiết sản phẩm, nhấp vào <strong>"Đặt hàng và thanh toán"</strong>.</li>
                <li><strong>Bước 3:</strong> Quản lý giỏ hàng:
                    <ul>
                        <li><em>Tiếp tục mua hàng:</em> Để thêm các sản phẩm khác vào giỏ.</li>
                        <li><em>Xem giỏ hàng:</em> Để cập nhật số lượng hoặc xóa sản phẩm.</li>
                    </ul>
                </li>
                <li><strong>Bước 4:</strong> Lựa chọn phương thức thanh toán và đăng nhập:
                    <ul>
                        <li><em>Đã có tài khoản:</em> Đăng nhập bằng email và mật khẩu.</li>
                        <li><em>Chưa có tài khoản:</em> Đăng ký thông tin để dễ dàng theo dõi đơn hàng sau này.</li>
                        <li><em>Mua hàng không cần tài khoản:</em> Điền trực tiếp thông tin giao hàng.</li>
                    </ul>
                </li>
                <li><strong>Bước 5:</strong> Điền đầy đủ thông tin nhận hàng, lựa chọn hình thức vận chuyển, thanh toán và gửi đơn hàng.</li>
                <li><strong>Bước 6:</strong> Telectric.vn sẽ liên hệ lại qua số điện thoại để xác nhận đơn hàng trong thời gian sớm nhất.</li>
            </ul>

            <h2>1.2. Quy Trình Xử Lý Đơn Hàng</h2>
            <ol>
                <li><strong>Tiếp nhận:</strong> Hệ thống ghi nhận sản phẩm, sẽ được kiểm tra trạng thái đơn hàng và liên lạc với khách hàng.</li>
                <li><strong>Kiểm tra chất lượng:</strong> Đội ngũ kỹ thuật kiểm tra tình trạng hoạt động của thiết bị trước khi đóng gói.</li>
                <li><strong>Giao hàng:</strong> Đơn hàng được bàn giao cho đối tác vận chuyển hoặc nhân viên giao hàng nội bộ để tiến hành giao đến tay Quý khách.</li>
            </ol>
        </PolicyLayout>
    );
}
