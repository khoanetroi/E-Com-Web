# Tên đề tài
**Nghiên cứu và xây dựng hệ thống thương mại điện tử tích hợp tra cứu bảo hành trực tuyến và trợ lý AI hỗ trợ mua hàng**

---

## 1. Mục tiêu đề tài
Xây dựng một nền tảng thương mại điện tử hiện đại cung cấp đa dạng mặt hàng, tích hợp các giải pháp công nghệ thông minh và quy trình dịch vụ khép kín nhằm hỗ trợ:
*   **Mua sắm trực tuyến toàn diện**: Cung cấp giao diện trực quan cho phép người dùng tìm kiếm, lọc và phân loại sản phẩm theo nhiều thuộc tính. Hỗ trợ đặt hàng nhanh và tích hợp thanh toán trực tuyến (hoặc giả lập mã VietQR động).
*   **Hệ thống bảo hành điện tử (e-Warranty & Ticketing)**: Số hóa quy trình hậu mãi. Ngoài việc tra cứu thời hạn bảo hành, khách hàng có thể gửi trực tiếp các yêu cầu hỗ trợ sửa chữa/bảo trì (Warranty Ticket) trực tuyến khi sản phẩm gặp lỗi.
*   **Trợ lý AI hỗ trợ mua hàng (AI Assistant)**: Tích hợp AI Chatbot để tư vấn thông tin sản phẩm, giải đáp thắc mắc thông số kỹ thuật và so sánh, gợi ý sản phẩm phù hợp nhất với nhu cầu mua sắm và ngân sách của khách hàng.
*   **Hệ thống quản trị và xử lý nghiệp vụ (Admin Dashboard)**: Giúp người quản trị dễ dàng quản lý sản phẩm, theo dõi đơn hàng, thống kê doanh thu và quản lý, xử lý các yêu cầu bảo hành từ khách hàng.

---

## 2. Phạm vi thực hiện

### Đối với khách hàng (Client Portal)
*   **Quản lý tài khoản**: Đăng ký, đăng nhập và quản lý thông tin hồ sơ cá nhân.
*   **Tìm kiếm & Lọc sản phẩm nâng cao**: Lọc sản phẩm theo danh mục, thương hiệu, khoảng giá và các thuộc tính liên quan.
*   **Đặt hàng & Thanh toán trực tuyến**: 
    *   Quản lý giỏ hàng (thêm, bớt, cập nhật số lượng).
    *   Tiến hành đặt hàng, tích hợp giả lập thanh toán qua cổng sandbox hoặc tạo mã QR thanh toán động (VietQR).
    *   Theo dõi lịch sử đơn hàng và trạng thái vận chuyển/thanh toán.
*   **Tra cứu bảo hành trực tuyến**: Nhập số điện thoại để hiển thị danh sách thẻ bảo hành điện tử (chứa số serial sản phẩm, ngày mua, hạn bảo hành, số ngày còn lại).
*   **Gửi yêu cầu bảo trì trực tuyến (Ticketing)**: Tạo phiếu yêu cầu bảo hành/sửa chữa trực tuyến khi sản phẩm gặp lỗi (mô tả lỗi, tải lên hình ảnh lỗi thực tế).
*   **Theo dõi lịch sử sửa chữa**: Theo dõi quá trình xử lý phiếu bảo trì (ngày tiếp nhận, chẩn đoán lỗi, phương án khắc phục, trạng thái xử lý).
*   **Tương tác với Chatbot AI**: Trò chuyện trực tiếp với trợ lý ảo để nhận tư vấn thông tin sản phẩm, so sánh các dòng máy và nhận gợi ý mua sắm.

### Đối với quản trị viên (Admin/Staff Portal)
*   **Quản lý sản phẩm & danh mục**: CRUD sản phẩm, thiết lập giá bán, khuyến mãi và các biến thể sản phẩm (Variant).
*   **Quản lý & xử lý đơn hàng**: Tiếp nhận đơn hàng mới, cập nhật trạng thái thanh toán và vận chuyển.
*   **Quản lý thẻ bảo hành**: Kích hoạt và cấp thẻ bảo hành điện tử liên kết số serial sản phẩm cho khách hàng khi đơn hàng hoàn thành.
*   **Tiếp nhận & xử lý yêu cầu sửa chữa (Ticket Management)**: 
    *   Theo dõi danh sách yêu cầu bảo hành gửi về từ khách hàng.
    *   Cập nhật chẩn đoán lỗi, phương án xử lý kỹ thuật và đổi trạng thái xử lý ticket (Đang xử lý -> Đã hoàn thành -> Đã giao lại cho khách).
*   **Thống kê & Báo cáo cơ bản**: Thống kê doanh thu bán hàng, số lượng đơn hàng và tỷ lệ sản phẩm phải bảo hành.

---

## 3. Phân chia vai trò thành viên (Dự kiến cho nhóm 3 người)

Để đảm bảo khối lượng công việc đồ án tương đương 50-60% dự án thực tế và chia đều cho nhóm 3 thành viên, vai trò được thiết kế như sau:

*   **Thành viên 1: Trưởng nhóm & Phát triển Module E-Commerce (Giao dịch & Thanh toán)**
    *   Thiết kế giao diện Giỏ hàng, trang Checkout (điền thông tin, tính toán đơn giá).
    *   Tích hợp/Giả lập cổng thanh toán trực tuyến (VietQR/VNPAY Sandbox) và quản lý trạng thái giao dịch.
    *   Xây dựng module quản lý tài khoản người dùng và lịch sử mua hàng.
    *   Đảm nhận thiết kế cơ sở dữ liệu chung cho hệ thống.

*   **Thành viên 2: Phát triển Module e-Warranty & Ticketing (Hậu mãi & Sửa chữa)**
    *   Xây dựng giao diện tra cứu bảo hành điện tử theo Số điện thoại / Số Serial.
    *   Xây dựng module gửi yêu cầu bảo trì trực tuyến (Warranty Ticket) dành cho khách hàng (cho phép tải ảnh lỗi lên Supabase Storage).
    *   Xây dựng giao diện quản lý ticket dành cho nhân viên kỹ thuật (cập nhật chẩn đoán lỗi, phương án khắc phục, cập nhật lịch sử bảo trì).

*   **Thành viên 3: Phát triển Trợ lý AI & Trang Quản trị (Admin Panel)**
    *   Tích hợp AI Chatbot (sử dụng Gemini/OpenAI API) tư vấn sản phẩm, so sánh sản phẩm và hỗ trợ mua hàng.
    *   Xây dựng Dashboard quản trị dành cho Admin: Quản lý sản phẩm (CRUD), quản lý biến thể (Variant), quản lý đơn hàng.
    *   Xây dựng trang báo cáo thống kê doanh thu và chất lượng dịch vụ bảo hành.

---

## 4. Công nghệ dự kiến sử dụng
*   **Frontend**: Next.js 15, React 19, Tailwind CSS, Shadcn/UI.
*   **Backend & Database**: Supabase (Auth, PostgreSQL Database, Storage).
*   **Trí tuệ nhân tạo (AI)**: Google Gemini API (hoặc OpenAI API).
