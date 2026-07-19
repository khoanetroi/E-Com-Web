import PolicyLayout from "@/views/Policies/PolicyLayout";

export const metadata = {
    title: "Giải Quyết Tranh Chấp và Khiếu Nại | Telectric.vn",
    description: "Quy trình giải quyết tranh chấp và khiếu nại tại Telectric.vn",
};

export default function GiaiQuyetKhieuNaiPage() {
    return (
        <PolicyLayout title="Quy Trình Giải Quyết Tranh Chấp và Khiếu Nại">
            <p>Telectric.vn luôn đề cao việc giải quyết các khiếu nại và tranh chấp trên tinh thần hợp tác, thương lượng, đảm bảo quyền lợi hợp pháp của người tiêu dùng.</p>

            <h2>Bước 1: Tiếp nhận khiếu nại</h2>
            <p>Khách hàng có thể gửi khiếu nại qua các kênh liên hệ chính thức:</p>
            <ul>
                <li>Hotline: <strong>093.400.14.35</strong></li>
                <li>Email: <strong>cskh@telectric.vn</strong></li>
                <li>Trực tiếp tại văn phòng: <strong>61/9/6 ĐHT03, tổ 12, khu phố 5, Phường Tân Hưng Thuận, Quận 12, TP.HCM</strong></li>
            </ul>

            <h2>Bước 2: Phân tích và đánh giá</h2>
            <p>Bộ phận Chăm sóc Khách hàng sẽ tiếp nhận, xác minh thông tin và chuyển yêu cầu đến các bộ phận liên quan (Kỹ thuật, Kho, Vận chuyển) để xử lý. Thời gian phản hồi ban đầu không quá 24h làm việc.</p>

            <h2>Bước 3: Giải quyết và phản hồi</h2>
            <p>Telectric.vn sẽ đưa ra phương án giải quyết dựa trên chính sách hiện hành và liên hệ lại với Quý khách để thống nhất. Tùy thuộc vào tính chất phức tạp của vấn đề, thời gian xử lý dứt điểm có thể kéo dài từ 3 - 7 ngày làm việc.</p>

            <h2>Bước 4: Thương lượng và hòa giải</h2>
            <p>Nếu khách hàng không đồng ý với phương án đưa ra, hai bên sẽ tiến hành thương lượng để tìm ra giải pháp chung. Trong trường hợp không thể đạt được thỏa thuận, vụ việc có thể được đưa ra Cơ quan Nhà nước có thẩm quyền hoặc Tòa án để giải quyết theo quy định của pháp luật Việt Nam.</p>

            <hr className="my-8 border-slate-200 dark:border-slate-800" />

            <h3>Thông tin liên hệ Telectric.vn</h3>
            <ul>
                <li><strong>Địa chỉ:</strong> 61/9/6 ĐHT03, tổ 12, khu phố 5, Phường Tân Hưng Thuận, Quận 12, TP.HCM</li>
                <li><strong>Hotline:</strong> <strong>093.400.14.35</strong></li>
                <li><strong>Email:</strong> cskh@telectric.vn / telectric1992@gmail.com</li>
            </ul>
        </PolicyLayout>
    );
}
