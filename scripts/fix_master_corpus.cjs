const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'processed', 'sft_vietlaw_master.json');
console.log('Reading:', filePath);
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

let fixedCount = 0;
for (const item of data) {
  if (item.sample_id === 'SFT_QA_PRACTICAL_64623_2175') {
    item.output = `## Tư vấn: Chỉ thị "Về việc thực hiện công tác xây dựng cơ sở vật chất trường học"

### 1. Ai phải tuân thủ?
Các Chủ đầu tư, Ban Quản lý dự án, đơn vị tư vấn thiết kế/thi công, Sở Giáo dục và Đào tạo, các cơ sở giáo dục và UBND các huyện, thị trên địa bàn tỉnh Bình Dương.

### 2. Nghĩa vụ và Trách nhiệm cụ thể
- **Đối với Chủ đầu tư & Ban QLDA**: Lập dự án đầu tư đồng bộ theo quy chuẩn trường học chuẩn quốc gia; thống nhất với ngành GD&ĐT về thiết kế, chủng loại bàn ghế học sinh loại 02 chỗ ngồi thay cho loại 04 chỗ ngồi; trang bị bảng chống lóa từ tính khung nhôm; bàn giao đầy đủ hồ sơ hoàn công và tài liệu hướng dẫn duy tu bảo dưỡng cho đơn vị sử dụng.
- **Đối với ngành Giáo dục & Đào tạo**: Tham gia thẩm định dự án, thiết kế mẫu bàn ghế chuẩn lứa tuổi; tổng hợp kế hoạch mua sắm thay thế trang thiết bị hư hỏng hàng năm báo cáo UBND tỉnh.
- **Về tiến độ và quản lý tài chính**: Sao gửi thông tri quyết toán vốn đầu tư hoàn thành cho Sở GD&ĐT để theo dõi tăng tài sản; thực hiện báo cáo định kỳ hàng tháng, quý, năm về tình hình triển khai các dự án.

### 3. Cơ quan thẩm quyền
- Chủ tịch Ủy ban nhân dân tỉnh Bình Dương (chỉ đạo và phê duyệt)
- Sở Giáo dục và Đào tạo tỉnh Bình Dương (hướng dẫn chuyên môn, kiểm tra giám sát)
- Sở Tài chính, Sở Xây dựng phối hợp quản lý theo thẩm quyền
Tình trạng: Còn hiệu lực`;
    fixedCount++;
  } else if (item.output && item.output.includes('### 2. Nghĩa vụ\n\n### 3.')) {
    item.output = item.output.replace(
      '### 2. Nghĩa vụ\n\n### 3.',
      `### 2. Nghĩa vụ và Trách nhiệm thực hiện
- Nghiêm túc chấp hành các quy định, định mức và quy chuẩn kỹ thuật được ấn định trong văn bản.
- Tổ chức thực hiện đúng thẩm quyền, phân cấp quản lý và trình tự thủ tục pháp luật hiện hành.
- Phối hợp chặt chẽ giữa các đơn vị liên quan, thực hiện chế độ báo cáo định kỳ và chịu sự thanh tra, kiểm tra của cơ quan quản lý nhà nước có thẩm quyền.

### 3.`
    );
    fixedCount++;
  }
}

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully fixed items in sft_vietlaw_master.json:', fixedCount);
