import PolicyLayout from "@/views/Policies/PolicyLayout";

export const metadata = {
    title: "Quy Định Chung | Telectric.vn",
    description: "Quy định chung dành cho thành viên / người dùng tại Telectric.vn",
};

export default function QuyDinhChungPage() {
    return (
        <PolicyLayout title="Quy Định Chung Dành Cho Thành Viên / Người Dùng">
            <ol>
                <li><strong>Quyền lợi:</strong> Khách hàng có quyền được tư vấn đầy đủ thông tin, thụ hưởng các chính sách bán hàng và dịch vụ hậu mãi theo cam kết.</li>
                <li><strong>Đóng góp ý kiến:</strong> Nếu phát hiện các lỗi phát sinh trên website hoặc chưa hài lòng về dịch vụ, Quý khách vui lòng thông báo cho Ban quản trị. Chúng tôi luôn trân trọng mọi ý kiến đóng góp.</li>
                <li><strong>Trách nhiệm người dùng:</strong> Tuyệt đối không sử dụng bất kỳ công cụ, phần mềm nào để can thiệp trái phép, làm sai lệch dữ liệu hệ thống. Không tạo đơn hàng ảo hoặc có hành vi phá hoại uy tín của Telectric.vn. Các hành vi vi phạm sẽ bị xử lý theo quy định của pháp luật hiện hành.</li>
                <li><strong>Trách nhiệm của Telectric.vn:</strong> Công bố minh bạch các chính sách trên website, hỗ trợ tối đa các vấn đề liên quan đến sản phẩm và bảo mật tuyệt đối dữ liệu người dùng</li>
            </ol>
        </PolicyLayout>
    );
}
