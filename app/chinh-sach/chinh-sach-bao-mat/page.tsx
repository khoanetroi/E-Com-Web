import PolicyLayout from "@/views/Policies/PolicyLayout";

export const metadata = {
    title: "Chính Sách Bảo Mật Thông Tin | Telectric.vn",
    description: "Chính sách bảo mật thông tin tại Telectric.vn",
};

export default function ChinhSachBaoMatPage() {
    return (
        <PolicyLayout title="Chính Sách Bảo Mật Thông Tin">
            <p>Telectric.vn tôn trọng và cam kết bảo vệ dữ liệu cá nhân của người dùng tuân thủ theo các quy định của pháp luật Việt Nam.</p>

            <h2>1. Mục đích và phạm vi thu thập</h2>
            <p>Thông tin thu thập (Họ tên, SĐT, Email, Địa chỉ) được sử dụng để liên hệ tư vấn, xác nhận đơn hàng, giao hàng và phục vụ công tác bảo hành. Telectric.vn không lưu trữ thông tin thẻ tín dụng/tài khoản ngân hàng của khách hàng trên máy chủ.</p>

            <h2>2. Phạm vi sử dụng thông tin</h2>
            <ul>
                <li>Hỗ trợ tạo và quản lý đơn hàng.</li>
                <li>Gửi hóa đơn, thông tin bảo hành điện tử.</li>
                <li>Cung cấp các bản cập nhật phần mềm thiết bị.</li>
                <li>Giải đáp khiếu nại, gửi thông tin khuyến mãi (nếu khách hàng đồng ý).</li>
                <li><strong>Cam kết:</strong> Không cung cấp/chuyển giao thông tin cá nhân cho bên thứ ba vì mục đích thương mại, ngoại trừ đối tác vận chuyển để thực hiện giao hàng.</li>
            </ul>

            <h2>3. Thời gian lưu trữ</h2>
            <p>Dữ liệu cá nhân được lưu trữ bảo mật trên hệ thống để đối soát thông tin bảo hành thiết bị (lên đến 24 tháng hoặc theo vòng đời sản phẩm).</p>
        </PolicyLayout>
    );
}
