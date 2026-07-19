import PolicyLayout from "@/views/Policies/PolicyLayout";

export const metadata = {
    title: "Bảo Hành, Đổi Trả & Hỗ Trợ Kỹ Thuật | Telectric.vn",
    description: "Chính sách bảo hành, đổi trả và hỗ trợ kỹ thuật tại Telectric.vn",
};

export default function ChinhSachBaoHanhPage() {
    return (
        <PolicyLayout title="Chính Sách Bảo Hành, Đổi Trả & Hỗ Trợ Kỹ Thuật">
            <p>Telectric.vn cam kết cung cấp các sản phẩm chính hãng và dịch vụ hậu mãi chất lượng "5 sao". Chỉ tiếp nhận bảo hành đối với các sản phẩm được mua trực tiếp tại hệ thống Telectric.vn.</p>

            <p className="italic bg-yellow-50 dark:bg-yellow-900/20 p-4 border-l-4 border-yellow-500 rounded text-yellow-800 dark:text-yellow-200">
                Lưu ý: Khách hàng cần quay video toàn bộ quá trình khui hộp (còn nguyên đai nguyên kiện) để được hỗ trợ trong trường hợp thiếu phụ kiện, lỗi ngoại quan (trầy xước, móp méo).
            </p>

            <h2>3.1. Đối Với Sản Phẩm Còn Hạn Bảo Hành</h2>

            <p><strong>Điều Kiện Áp Dụng:</strong></p>
            <ul>
                <li>Tem bảo hành còn nguyên vẹn, không bị rách, tẩy xóa.</li>
                <li>Thiết bị không có dấu hiệu bị cạy mở, tự ý sửa chữa bởi bên thứ ba.</li>
                <li>Số series trên máy trùng khớp với thông tin trên Phiếu bảo hành/hệ thống lưu trữ.</li>
                <li>Trường hợp đổi trả: Sản phẩm phải mới 100%, đầy đủ hộp, phụ kiện đi kèm.</li>
                <li><em>Phụ kiện tiêu hao (pin, dây đo, thẻ nhớ, cáp...):</em> Không bảo hành. Chỉ hỗ trợ đổi mới trong 3 ngày đầu nếu lỗi do nhà sản xuất.</li>
            </ul>

            <h3>A. Các Lỗi Do Nhà Sản Xuất (Không bao gồm lỗi ngoại quan)</h3>
            <div className="overflow-x-auto">
                <table>
                    <thead>
                        <tr>
                            <th>Trường Hợp</th>
                            <th>Chính Sách Giải Quyết</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Thiết bị lỗi, hoạt động không bình thường</strong></td>
                            <td><strong>Trong 7 ngày đầu:</strong> 1 đổi 1 (cùng model). Nếu hết hàng, Quý khách được quyền chọn model khác cùng tính năng (bù trừ chênh lệch nếu có).<br /><br /><strong>Từ ngày thứ 8 đến hết thời gian bảo hành:</strong> Bảo hành sửa chữa theo chính sách của Hãng.</td>
                        </tr>
                        <tr>
                            <td><strong>Thiết bị sai số (Có chứng nhận kiểm định)</strong></td>
                            <td>Chỉ áp dụng khi có kết quả kiểm định không đạt từ các tổ chức uy tín (VD: QUATEST 3). Không chấp nhận so sánh với thiết bị cá nhân khác.<br /><br /><strong>Giải quyết:</strong> 1 đổi 1 (cùng model) hoặc đổi model tương đương (bù trừ chênh lệch).</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3>B. Sản Phẩm Không Có Lỗi Kỹ Thuật</h3>
            <div className="overflow-x-auto">
                <table>
                    <thead>
                        <tr>
                            <th>Trường Hợp</th>
                            <th>Chính Sách Giải Quyết</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Do nhân viên tư vấn sai nhu cầu</strong></td>
                            <td><strong>Trong 7 ngày đầu:</strong> Hỗ trợ đổi thiết bị phù hợp hoặc hoàn tiền 100% (sau khi trừ chi phí phát sinh) nếu không có thiết bị đáp ứng. Yêu cầu: Máy mới 100%, nguyên tem, đủ phụ kiện, không lỗi ngoại quan.<br /><br /><strong>Sau 7 ngày:</strong> Từ chối giải quyết đổi/trả.</td>
                        </tr>
                        <tr>
                            <td><strong>Do khách hàng mua sai nhu cầu</strong></td>
                            <td><strong>Trong 7 ngày đầu:</strong> Hỗ trợ đổi thiết bị khác (có thể phát sinh phí đổi trả tùy tình trạng hàng hóa). Yêu cầu: Máy mới 100%, nguyên tem, hộp và phụ kiện.<br /><br /><strong>Sau 7 ngày:</strong> Từ chối giải quyết trả hàng/hoàn tiền với lý do cá nhân.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3>C. Lỗi Phát Sinh Từ Người Sử Dụng</h3>
            <div className="overflow-x-auto">
                <table>
                    <thead>
                        <tr>
                            <th>Trường Hợp</th>
                            <th>Chính Sách Giải Quyết</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Khách hàng sử dụng sai hướng dẫn, tự ý tháo mở, thiết bị vô nước, rò rỉ pin, rách tem...</td>
                            <td><strong>Từ chối bảo hành/đổi trả.</strong> Telectric.vn sẽ hỗ trợ kiểm tra và báo giá phí sửa chữa (hoặc gửi về Hãng). Khách hàng chịu toàn bộ chi phí phát sinh.</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h2>3.2. Đối Với Sản Phẩm Hết Hạn Bảo Hành</h2>
            <p>Telectric.vn hỗ trợ kiểm tra, sửa chữa với mức phí tối ưu nhất hoặc gửi về Trung tâm bảo hành của Hãng. Quý khách hàng sẽ được báo giá chi tiết chi phí vật tư, linh kiện và nhân công trước khi tiến hành sửa chữa.</p>

            <h2>3.3. Hỗ Trợ Hậu Mãi</h2>
            <ul>
                <li>Hỗ trợ kỹ thuật, hướng dẫn sử dụng trực tiếp tại Showroom hoặc qua Video Call.</li>
                <li>Hỗ trợ nhận thiết bị bảo hành tận nơi (áp dụng tùy khu vực), giúp Quý khách tiết kiệm thời gian di chuyển</li>
            </ul>
        </PolicyLayout>
    );
}
