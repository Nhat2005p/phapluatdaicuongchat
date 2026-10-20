import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file500 = path.resolve(__dirname, '../data/processed/sft_vietlaw_500.json');
const fileMaster = path.resolve(__dirname, '../data/processed/sft_vietlaw_master.json');

const corruptionHarmSample = {
  sample_id: "SFT_CORRUPTION_HARM_001",
  intent_code: "GENERAL_THEORY",
  instruction: "Phân tích 3 tác hại lớn của tham nhũng đối với chính trị, kinh tế và xã hội theo giáo trình Pháp luật đại cương và Luật Phòng, chống tham nhũng 2018.",
  input: "Tham nhũng gây ra rất nhiều hậu quả nghiêm trọng trên tất cả các lĩnh vực của đời sống xã hội. Bằng kiến thức đã học anh (chị) hãy phân tích tác hại của tham nhũng?",
  output: `### I. KHÁI NIỆM VÀ BẢN CHẤT CỦA THAM NHŨNG
Căn cứ **Khoản 1 Điều 3 Luật Phòng, chống tham nhũng 2018**:
- **Tham nhũng** là hành vi của người có chức vụ, quyền hạn đã lợi dụng chức vụ, quyền hạn đó vì vụ lợi.
- Tham nhũng là hiện tượng tiêu cực mang tính xã hội - lịch sử, xâm hại hoạt động đúng đắn của bộ máy nhà nước và gây ra hậu quả đặc biệt nghiêm trọng trên mọi lĩnh vực của đời sống xã hội.

---

### II. PHÂN TÍCH 3 TÁC HẠI LỚN CỦA THAM NHŨNG (CHUẨN BAREM BỘ GD&ĐT)

Theo giáo trình Pháp luật đại cương, sinh viên cần phân tích sâu sắc 3 tác hại cốt lõi sau:

#### 1. Tác hại về Chính trị
- **Làm suy giảm nghiêm trọng lòng tin của nhân dân**: Tham nhũng làm xói mòn niềm tin của quần chúng nhân dân đối với sự lãnh đạo của Đảng, sự quản lý của Nhà nước và tính nghiêm minh của pháp luật.
- **Làm tha hóa đội ngũ cán bộ, công chức**: Làm suy đồi đạo đức công vụ của một bộ phận người có chức vụ, quyền hạn; biến quyền lực công được nhân dân ủy thác thành công cụ trục lợi cá nhân, lợi ích nhóm.
- **Làm suy yếu hiệu lực, hiệu quả quản lý nhà nước**: Làm tê liệt bộ máy chính quyền, cản trở việc thực thi các chủ trương, chính sách đúng đắn; đe dọa sự tồn vong của chế độ xã hội chủ nghĩa và sự ổn định chính trị quốc gia.

#### 2. Tác hại về Kinh tế
- **Gây thất thoát, lãng phí đặc biệt lớn tài sản công**: Tham nhũng biển thủ trực tiếp ngân sách nhà nước, các nguồn tài nguyên quốc gia và tiền thuế của nhân dân thông qua các dự án đầu tư công kém hiệu quả, đội vốn, rút ruột công trình.
- **Làm méo mó môi trường đầu tư, kinh doanh**: Làm biến dạng quy luật cạnh tranh lành mạnh trên thị trường; tạo ra cơ chế xin - cho, thị trường ngầm, đẩy chi phí không chính thức (tiền bôi trơn, phong bì) của doanh nghiệp lên cao.
- **Kìm hãm tốc độ tăng trưởng kinh tế**: Cản trở thu hút vốn đầu tư nước ngoài (FDI), làm giảm năng lực cạnh tranh quốc gia và giảm hiệu quả phân bổ các nguồn lực tài chính xã hội.

#### 3. Tác hại về Xã hội (Văn hóa - Xã hội)
- **Gia tăng bất công xã hội và khoét sâu khoảng cách giàu - nghèo**: Những kẻ tham nhũng chiếm đoạt nguồn phúc lợi xã hội đáng lẽ phải dành cho y tế, giáo dục, an sinh xã hội cho người nghèo và đối tượng yếu thế, làm gia tăng phân hóa giai tầng.
- **Xói mòn đạo đức và thuần phong mỹ tục**: Tạo ra tâm lý sùng bái đồng tiền, coi thường kỷ cương phép nước; hình thành thói quen xấu xem việc đưa hối lộ, chạy chọt là điều tất yếu để giải quyết công việc.
- **Gây bức xúc dư luận, đe dọa an ninh trật tự**: Làm gia tăng đơn thư khiếu kiện kéo dài, tạo ra những điểm nóng về an ninh trật tự xã hội và là mảnh đất màu mỡ cho các thế lực thù địch lợi dụng kích động, chống phá.

---

### III. KẾT LUẬN VÀ LIÊN HỆ THỰC TIỄN
- Đảng và Nhà nước ta xác định tham nhũng là **"giặc nội xâm"**, là một trong 4 nguy cơ lớn đe dọa sự tồn vong của chế độ.
- Để ngăn chặn tác hại của tham nhũng, cần thực hiện đồng bộ 4 mục tiêu: Xây dựng cơ chế *"không thể tham nhũng, không dám tham nhũng, không muốn tham nhũng và không cần tham nhũng"* gắn với xử lý nghiêm minh, không có vùng cấm, không có ngoại lệ theo quy định của **Luật Phòng, chống tham nhũng 2018** và **Bộ luật Hình sự 2015**.`
};

const lawTheorySample = {
  sample_id: "SFT_THEORY_001",
  intent_code: "GENERAL_THEORY",
  instruction: "Pháp luật là gì? Phân tích nguồn gốc, bản chất và vai trò của pháp luật theo giáo trình Pháp luật đại cương.",
  input: "Pháp luật là gì? Phân tích nguồn gốc, bản chất và vai trò của pháp luật?",
  output: `### I. KHÁI NIỆM PHÁP LUẬT
Pháp luật là hệ thống các quy tắc xử sự mang tính bắt buộc chung do Nhà nước ban hành hoặc thừa nhận và đảm bảo thực hiện bằng sức mạnh cưỡng chế của Nhà nước, thể hiện ý chí của giai cấp thống trị nhằm điều chỉnh các quan hệ xã hội phát triển theo một trật tự nhất định.

---

### II. NGUỒN GỐC CỦA PHÁP LUẬT
- Trong xã hội cộng sản nguyên thủy chưa có Nhà nước và chưa có Pháp luật; trật tự xã hội được duy trì bằng các phong tục tập quán và tín điều tôn giáo tự phát.
- Khi lực lượng sản xuất phát triển dẫn đến sự ra đời của chế độ tư hữu và xã hội phân chia thành các giai cấp đối kháng, tập quán chung không còn điều hòa được mâu thuẫn giai cấp. Nhà nước ra đời và cùng với nó, Pháp luật hình thành theo 2 con đường:
  + Nhà nước chọn lọc, thừa nhận các tập quán có sẵn trong xã hội và nâng lên thành luật (Tập quán pháp).
  + Nhà nước ban hành mới các văn bản quy phạm pháp luật và thừa nhận các án lệ của tòa án (Tiền lệ pháp / Văn bản quy phạm pháp luật).

---

### III. BẢN CHẤT CỦA PHÁP LUẬT
1. **Tính giai cấp**: Pháp luật phản ánh ý chí nhà nước của giai cấp thống trị; bảo vệ trước hết lợi ích kinh tế, chính trị của giai cấp cầm quyền.
2. **Tính xã hội**: Pháp luật còn là thước đo hành vi chuẩn mực của con người, ghi nhận các giá trị đạo đức, công bằng chung và bảo vệ lợi ích chính đáng của các tầng lớp dân cư để duy trì sự ổn định của toàn xã hội.

---

### IV. VAI TRÒ CỦA PHÁP LUẬT
- Là phương tiện chủ yếu để Nhà nước quản lý mọi mặt đời sống kinh tế - xã hội.
- Là công cụ bảo vệ quyền con người, quyền và lợi ích hợp pháp của công dân.
- Là cơ sở tạo lập các quan hệ xã hội mới và mở rộng hợp tác quốc tế.`
};

function updateFile(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  const list = JSON.parse(fs.readFileSync(targetPath, 'utf8'));

  // 1. Cập nhật SFT_THEORY_001
  const idx1 = list.findIndex(x => x.sample_id === 'SFT_THEORY_001');
  if (idx1 >= 0) {
    list[idx1] = lawTheorySample;
  } else {
    list.push(lawTheorySample);
  }

  // 2. Thêm hoặc cập nhật SFT_CORRUPTION_HARM_001
  const idx2 = list.findIndex(x => x.sample_id === 'SFT_CORRUPTION_HARM_001');
  if (idx2 >= 0) {
    list[idx2] = corruptionHarmSample;
  } else {
    list.push(corruptionHarmSample);
  }

  fs.writeFileSync(targetPath, JSON.stringify(list, null, 2), 'utf8');
  console.log(`Updated ${path.basename(targetPath)} with independent samples! Total items:`, list.length);
}

updateFile(file500);
updateFile(fileMaster);
