# Module AI Báo Lỗi Bảo Hành (Gemini)

## 1. Mục tiêu module
Module này chỉ phục vụ **nghiệp vụ báo lỗi / bảo hành**, đúng với yêu cầu đề tài:
- Khách hàng gửi mô tả lỗi bằng ngôn ngữ tự nhiên.
- Hệ thống lưu ticket lỗi vào database.
- Admin xem ticket, nhận **phản hồi chẩn đoán** và **lời khuyên xử lý tạm thời** từ Gemini.
- AI không dùng cho tư vấn bán hàng hay gợi ý sản phẩm.

## 2. Trạng thái hiện tại của hệ thống
Dựa trên code hiện có:
- Đã có trang tra cứu bảo hành cho khách ở `views/WarrantyCheck/index.tsx`.
- Đã có màn quản lý bảo hành cho admin ở `views/Admin/Warranty/index.tsx`.
- Hệ thống đã có `warranty_cards` và `warranty_history` để lưu thẻ bảo hành và lịch sử xử lý.
- Hiện tại chưa thấy luồng cho khách tạo ticket lỗi mới và gửi lên hệ thống.
- Hiện tại cũng chưa có tích hợp Gemini/OpenAI trong codebase.

Kết luận: module AI báo lỗi **chưa được xây**, nhưng nền tảng dữ liệu hậu mãi đã có thể tận dụng.

## 3. Phạm vi nên làm để khớp đề tài
Nên triển khai đúng 3 phần sau:

### 3.1. Khách hàng gửi ticket lỗi
- Có form nhập:
  - số điện thoại hoặc mã bảo hành
  - sản phẩm liên quan
  - mô tả lỗi bằng tiếng Việt tự nhiên
  - ảnh lỗi nếu cần
- Ticket được lưu vào database.
- Ticket ở trạng thái ban đầu như `new` hoặc `received`.

### 3.2. AI hỗ trợ chẩn đoán cho admin
- Admin mở ticket và bấm nút "Phân tích bằng AI".
- Backend gửi nội dung ticket sang Gemini.
- AI trả về:
  - chẩn đoán sơ bộ
  - mức độ nghiêm trọng ước lượng
  - gợi ý kiểm tra thêm
  - lời khuyên xử lý tạm thời
  - cảnh báo nếu cần chuyển kỹ thuật viên

### 3.3. Admin quản lý kết quả
- Admin xem kết quả AI ngay trong ticket.
- Admin có thể sửa lại kết luận thủ công nếu cần.
- Admin cập nhật trạng thái xử lý của ticket.

## 4. Gợi ý luồng nghiệp vụ
1. Khách gửi mô tả lỗi.
2. Hệ thống tạo ticket mới trong bảng `warranty_tickets` hoặc tương đương.
3. Admin mở ticket.
4. Backend gọi Gemini với nội dung ticket + ngữ cảnh sản phẩm.
5. Gemini trả về chẩn đoán và lời khuyên.
6. Hệ thống lưu phản hồi AI vào ticket.
7. Admin xác nhận hoặc chỉnh sửa kết luận.

## 5. Cấu trúc dữ liệu nên có
Nếu chưa có bảng riêng cho ticket, nên thêm một bảng riêng thay vì nhét vào `warranty_history`.

### Gợi ý bảng `warranty_tickets`
- `id`
- `warranty_card_id`
- `customer_name`
- `customer_phone`
- `product_name`
- `serial_number`
- `issue_description`
- `issue_images`
- `status`
- `ai_diagnosis`
- `ai_temporary_advice`
- `ai_confidence`
- `created_at`
- `updated_at`

### Gợi ý trạng thái ticket
- `new`
- `received`
- `analyzing`
- `processing`
- `resolved`
- `closed`

## 6. Prompt Gemini nên thiết kế thế nào
Prompt nên giới hạn rõ:
- Chỉ trả lời trong vai trò trợ lý kỹ thuật hậu mãi.
- Chỉ dựa trên mô tả lỗi và dữ liệu sản phẩm có sẵn.
- Không bịa nếu thiếu dữ liệu.
- Kết quả phải ngắn gọn, thực dụng, dùng tiếng Việt.
- Tách rõ 2 phần:
  - chẩn đoán sơ bộ
  - lời khuyên xử lý tạm thời

### Ví dụ đầu ra mong muốn
- Chẩn đoán sơ bộ: khả năng cao lỗi nguồn / dây / cảm biến / tiếp xúc / quá nhiệt.
- Cần kiểm tra thêm: nguồn cấp, dây cáp, thao tác khởi động, pin, ngoại lực.
- Xử lý tạm thời: ngắt nguồn, kiểm tra kết nối, thử nguồn thay thế, chụp thêm ảnh lỗi.

## 7. Kiến trúc kỹ thuật nên làm trong Next.js
### 7.1. Frontend
- Tạo form gửi ticket lỗi.
- Tạo màn chi tiết ticket cho admin.
- Thêm nút gọi AI trong màn admin.

### 7.2. Backend
- Tạo route handler, ví dụ:
  - `app/api/warranty-tickets/route.ts`
  - `app/api/warranty-tickets/[id]/analyze/route.ts`
- Route analyze sẽ:
  - kiểm tra quyền admin
  - lấy nội dung ticket
  - gọi Gemini API
  - lưu kết quả vào database

### 7.3. Biến môi trường
- `GEMINI_API_KEY`
- `GEMINI_MODEL` nếu muốn cấu hình model linh hoạt

## 8. Các file nên bổ sung
Gợi ý tối thiểu:
- `app/api/warranty-tickets/route.ts`
- `app/api/warranty-tickets/[id]/analyze/route.ts`
- `views/Account/WarrantyTicketCreate/`
- `views/Admin/WarrantyTickets/`
- `lib/gemini.ts`
- `lib/ticket-ai-prompt.ts`

Nếu muốn đơn giản hơn, có thể để toàn bộ phần admin trong một view mới và chưa cần tách quá nhiều component.

## 9. Nên làm theo thứ tự nào
1. Xác định model dữ liệu ticket.
2. Tạo API lưu ticket.
3. Tạo trang khách gửi ticket.
4. Tạo màn admin xem ticket.
5. Tích hợp Gemini vào route analyze.
6. Lưu kết quả AI vào database.
7. Hiển thị kết quả trong admin.
8. Viết phần mô tả vào báo cáo đồ án.

## 10. Gemini API key free có khả thi không
### Câu trả lời ngắn
**Có, khả thi cho đồ án / demo / dự án nhỏ.**

### Khi nào nên dùng
- Dùng để làm đồ án tốt nghiệp / thực tập.
- Lượng request thấp.
- Chỉ cần phân tích ticket theo từng lần người dùng gửi.
- Không yêu cầu SLA production.

### Điểm cần lưu ý
- Có quota và rate limit.
- Có thể thay đổi theo chính sách Google.
- Không nên lộ API key ở client.
- Không nên dùng cho tải lớn hoặc hệ thống production quan trọng.
- Nên có cơ chế fallback nếu AI lỗi, ví dụ admin vẫn nhập chẩn đoán thủ công.

### Kết luận thực tế
- **Khả thi:** có.
- **Khuyến nghị:** dùng cho môi trường demo, học tập, đồ án.
- **Không nên quảng cáo là production-ready** nếu chỉ dùng free key.

## 11. Cách viết trong báo cáo để đúng đề tài
Bạn nên mô tả module theo hướng sau:
- Hệ thống cho phép khách gửi mô tả lỗi bằng ngôn ngữ tự nhiên.
- Admin nhận ticket và dùng AI để hỗ trợ chẩn đoán sơ bộ.
- AI trả về lời khuyên xử lý tạm thời giúp rút ngắn thời gian phản hồi.
- AI chỉ hỗ trợ nghiệp vụ hậu mãi, không áp dụng cho tư vấn bán hàng.

## 12. Checklist triển khai nhanh
- [ ] Có bảng ticket riêng
- [ ] Có form gửi ticket phía khách
- [ ] Có trang admin quản lý ticket
- [ ] Có nút phân tích AI trong admin
- [ ] Có route gọi Gemini ở server
- [ ] Có lưu kết quả AI vào DB
- [ ] Có fallback khi Gemini lỗi
- [ ] Có tài liệu mô tả module trong báo cáo

## 13. Ghi chú quan trọng
Nếu mục tiêu chỉ là bám sát yêu cầu đề tài, thì không cần làm AI gợi ý sản phẩm. Module AI chỉ cần xoay quanh:
- mô tả lỗi
- chẩn đoán sơ bộ
- lời khuyên xử lý tạm thời
- hỗ trợ admin xử lý ticket

Đây là phạm vi vừa đủ, rõ ràng, và đúng với yêu cầu trong ảnh đề tài.

## 14. Những gì đã được scaffold trong repo
Các phần dưới đây đã được tạo sẵn để bạn tiếp tục dùng ngay:
- `lib/warranty-ticket.ts`: kiểu dữ liệu ticket và helper chuẩn hóa số điện thoại.
- `lib/gemini.ts`: hàm gọi Gemini API và ép phản hồi về JSON.
- `app/api/warranty-tickets/route.ts`: API tạo ticket và lấy danh sách ticket.
- `app/api/warranty-tickets/[id]/route.ts`: API cập nhật ticket cho admin.
- `app/api/warranty-tickets/[id]/analyze/route.ts`: API gọi Gemini để phân tích ticket.
- `views/Account/Tickets/index.tsx`: màn khách gửi ticket lỗi.
- `views/Admin/WarrantyTickets/index.tsx`: màn admin xử lý ticket và bấm phân tích AI.
- `app/account/tickets/page.tsx`: route trang ticket phía khách.
- `app/admin/warranty-tickets/page.tsx`: route trang ticket phía admin.
- `app/account/layout.tsx`: đã thêm menu Ticket báo lỗi.
- `components/layout/AdminLayout.tsx`: đã thêm menu Ticket lỗi.

## 15. Thiết lập cần có để chạy thật
Tạo file `.env.local` và thêm:
```env
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-1.5-flash
```

Bạn cũng cần một bảng dữ liệu `warranty_tickets` trong Supabase. Tối thiểu nên có các cột:
- `id`
- `warranty_card_id`
- `customer_user_id`
- `customer_name`
- `customer_phone`
- `product_name`
- `serial_number`
- `issue_description`
- `issue_images`
- `status`
- `ai_diagnosis`
- `ai_temporary_advice`
- `ai_confidence`
- `admin_note`
- `created_at`
- `updated_at`

## 16. Các bước tiếp theo để chạy module hoàn chỉnh
1. Tạo bảng `warranty_tickets` trong Supabase.
2. Thêm policy RLS phù hợp cho user và admin.
3. Cấu hình `.env.local` với Gemini API key.
4. Chạy app và thử gửi ticket ở `/account/tickets`.
5. Vào `/admin/warranty-tickets` để phân tích ticket bằng Gemini.

## 17. Kết luận về Gemini free key
Với module này, Gemini free key là **đủ khả thi** cho đồ án vì:
- mỗi ticket chỉ gọi AI khi admin chủ động bấm phân tích
- lượng request thấp
- output cần ngắn và theo mẫu JSON nên tiết kiệm token

Rủi ro chính vẫn là quota và rate limit, nên tốt nhất giữ fallback thủ công cho admin nếu AI lỗi.
