# Cải tiến tính năng Warranty Tickets

Kế hoạch triển khai các tính năng mới cho hệ thống Warranty Tickets theo yêu cầu của bạn, bao gồm:
1. Tùy chọn chẩn đoán AI khi tạo ticket.
2. Cho phép người dùng xóa ticket lỗi.
3. Phân trang cho danh sách ticket (Admin & User).
4. Việt hóa các nút thay đổi trạng thái ticket ở phía Admin.

## User Review Required

> [!IMPORTANT]
> **Database**: Phân trang sẽ sử dụng tham số `page` và `limit` qua query string (ví dụ: `?page=1&limit=10`). Cả Admin và User UI sẽ được cập nhật để hiển thị nút chuyển trang. Bạn có đồng ý với UI phân trang đơn giản (Nút "Trang trước" - "Trang sau") không?

> [!WARNING]
> **Xóa Ticket**: Khi user xóa ticket, chúng ta sẽ xóa cứng (Hard Delete) khỏi database luôn hay chỉ cập nhật trạng thái thành `deleted` (Soft Delete)? Trong plan này, tôi đề xuất sử dụng **Hard Delete** (xóa khỏi bảng Supabase) để tiết kiệm dung lượng, vì ticket gửi nhầm thường không có giá trị lưu trữ.

## Proposed Changes

---

### API Changes

#### [MODIFY] [route.ts](file:///d:/CODING/E-Com-Web/app/api/warranty-tickets/route.ts)
- **GET**: 
  - Hỗ trợ query params `page` và `limit`.
  - Trả về cấu trúc `{ data: tickets, total, page, totalPages }`.
- **POST**:
  - Nhận thêm field `run_ai_diagnosis` (boolean) từ request body.
  - Nếu `run_ai_diagnosis` là `true`, gọi hàm `analyzeWarrantyTicket` từ `lib/gemini.ts` trước khi lưu vào cơ sở dữ liệu.
  - Cập nhật payload lưu vào database với kết quả AI (nếu có).

#### [MODIFY] [route.ts](file:///d:/CODING/E-Com-Web/app/api/warranty-tickets/%5Bid%5D/route.ts)
- **DELETE (New Method)**:
  - Thêm method `DELETE` để xử lý yêu cầu xóa ticket.
  - Xác thực user, chỉ cho phép xóa nếu user là admin (User thường sẽ nhận lỗi 403 Forbidden).

---

### UI Changes - User Side

#### [MODIFY] [index.tsx](file:///d:/CODING/E-Com-Web/views/Account/Tickets/index.tsx)
- Thêm checkbox "Sử dụng AI để chẩn đoán sơ bộ (Miễn phí)" trong form tạo ticket. Trạng thái mặc định là không check.
- Cập nhật logic fetch data để gửi kèm tham số `page` và hiển thị UI Phân trang (Pagination) ở dưới danh sách ticket.

---

### UI Changes - Admin Side

#### [MODIFY] [index.tsx](file:///d:/CODING/E-Com-Web/views/Admin/WarrantyTickets/index.tsx)
- Thêm nút "Xóa" cho mỗi ticket (kèm theo popup xác nhận để tránh xóa nhầm).

#### [MODIFY] [index.tsx](file:///d:/CODING/E-Com-Web/views/Admin/WarrantyTickets/index.tsx)
- Cập nhật logic fetch data tương tự phía User để hỗ trợ tham số `page`, thêm UI Phân trang.
- Sửa text của các nút cập nhật trạng thái trong phần chi tiết ticket:
  - `received` -> "Đã tiếp nhận"
  - `processing` -> "Đang xử lý"
  - `resolved` -> "Đã xử lý"
  - `closed` -> "Đóng ticket"

## Verification Plan

### Automated Tests
- Không có automated test hiện tại.

### Manual Verification
1. Đăng nhập với tài khoản User:
   - Tạo ticket **không có** tick AI -> Kiểm tra hiển thị tốc độ nhanh, không có kết quả chẩn đoán.
   - Tạo ticket **có** tick AI -> Đợi AI chạy, kiểm tra hiển thị kết quả chẩn đoán luôn sau khi tạo.
   - Click chuyển trang xem ticket cũ.
   - Xóa thử một ticket, đảm bảo ticket biến mất.
2. Đăng nhập với tài khoản Admin:
   - Kiểm tra UI phân trang hoạt động tốt.
   - Chọn một ticket, kiểm tra các nút đổi trạng thái đã hiển thị đúng tiếng Việt ("Đã tiếp nhận", "Đang xử lý"...) và nhấn thử để cập nhật trạng thái.
