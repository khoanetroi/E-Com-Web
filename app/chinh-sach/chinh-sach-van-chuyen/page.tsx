import PolicyLayout from "@/views/Policies/PolicyLayout";

export const metadata = {
    title: "Chính Sách Vận Chuyển và Thanh Toán | Telectric.vn",
    description: "Chính sách vận chuyển và thanh toán tại Telectric.vn",
};

export default function ChinhSachVanChuyenPage() {
    return (
        <PolicyLayout title="Chính Sách Vận Chuyển và Thanh Toán">
            <h2>2.1. Chính Sách Vận Chuyển</h2>
            <p>Telectric.vn hợp tác với các đơn vị vận chuyển uy tín để đảm bảo hàng hóa đến tay Quý khách an toàn và nhanh chóng.</p>

            <p><strong>Phương Thức Giao Hàng:</strong></p>
            <ul>
                <li><strong>Chuyển phát nhanh (GHTK, Viettel Post, J&T...):</strong> Áp dụng toàn quốc.</li>
                <li><strong>Giao qua Chành xe:</strong> Theo chỉ định của Quý khách (yêu cầu thanh toán trước 100% hoặc cọc theo thỏa thuận).</li>
                <li><strong>Giao hỏa tốc (Grab, Ahamove...):</strong> Áp dụng nội thành TP.HCM (nhận hàng trong 1-2 giờ, khách hàng cần thanh toán trước 100% phí đơn hàng để việc vận chuyển nhanh và thuận lợi.)</li>
                <li><strong>Giao bởi nhân viên Telectric.vn:</strong> Hỗ trợ giao tận nơi tại TP.HCM đối với các đơn hàng giá trị cao hoặc thiết bị cần lắp đặt/hướng dẫn chuyên sâu.</li>
            </ul>

            <p><strong>Cước Phí Vận Chuyển:</strong></p>
            <ul>
                <li><strong>Miễn phí vận chuyển:</strong> Áp dụng cho đơn hàng trong khu vực thành phố hoặc địa điểm thuận tiện giao hàng (hỗ trợ tối đa 25.000đ).</li>
                <li><strong>Hỗ trợ cước phí:</strong> Với đơn hàng trên 5.000.000đ, hỗ trợ phí lên đến 70.000đ.</li>
                <li><strong>Đơn hàng dưới 500.000đ:</strong> Quý khách thanh toán phí vận chuyển cố định 25.000đ/đơn</li>
            </ul>

            <p><strong>Thời Gian Giao Hàng Dự Kiến:</strong></p>
            <ul>
                <li>Nội thành TP.HCM: 1 - 4 giờ hoặc trong ngày làm việc.</li>
                <li>Các tỉnh thành khác: 2 - 4 ngày làm việc, theo thời gian giao nhận của đơn vị vận chuyển.</li>
            </ul>

            <h2>2.2. Phương Thức Thanh Toán</h2>
            <p>Chúng tôi cung cấp các hình thức thanh toán linh hoạt:</p>
            <ul>
                <li><strong>Thanh toán khi nhận hàng (COD):</strong> Quý khách kiểm tra ngoại quan kiện hàng, vỏ hộp nguyên vẹn trước khi thanh toán cho nhân viên giao hàng. Chỉ xử lý khi có Video, Clip mở hàng.</li>
                <li><strong>Chuyển khoản / Ví điện tử:</strong> Thanh toán 100% giá trị đơn hàng, hoặc đặt cọc 50% (đối với hàng đặt trước) và thanh toán 50% còn lại khi nhận hàng.</li>
                <li><strong>Thanh toán trực tiếp:</strong> Bằng tiền mặt, thẻ ngân hàng hoặc quét mã QR tại văn phòng/kho hàng của Telectric.vn.</li>
            </ul>
        </PolicyLayout>
    );
}
