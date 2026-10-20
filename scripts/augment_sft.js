import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, '../data/processed/sft_vietlaw_500.json');
const list = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const newSamples = [
  {
    sample_id: 'SFT_CIVIL_RELATION_001',
    intent_code: 'QPPL_STRUCT',
    instruction: 'Quan hệ pháp luật dân sự là gì? Phân tích cơ cấu của quan hệ pháp luật dân sự (lấy ví dụ minh họa).',
    input: '',
    output: `### I. KHÁI NIỆM QUAN HỆ PHÁP LUẬT DÂN SỰ
Theo giáo trình Pháp luật Đại cương (Bộ GD&ĐT) và quy định tại **Điều 1, Điều 3 Bộ luật Dân sự 2015**:
- **Quan hệ pháp luật dân sự**: Là quan hệ xã hội được các quy phạm pháp luật dân sự điều chỉnh, trong đó các bên tham gia **độc lập về tổ chức và tài sản**, **bình đẳng về địa vị pháp lý**, quyền và nghĩa vụ các bên được Nhà nước bảo đảm thông qua các biện pháp cưỡng chế.
- **Đặc trưng cơ bản**:
  1. Các chủ thể tham gia bình đẳng, không bên nào có quyền ra lệnh hay áp đặt ý chí lên bên nào.
  2. Các bên tự do cam kết, thỏa thuận ý chí trong khuôn khổ không vi phạm điều cấm của luật và không trái đạo đức xã hội.
  3. Quyền tài sản và quyền nhân thân là hai nhóm khách thể chủ yếu của quan hệ.

---

### II. CƠ CẤU CỦA QUAN HỆ PHÁP LUẬT DÂN SỰ
Quan hệ pháp luật dân sự có **ba bộ phận cấu thành** gồm: **Chủ thể**, **Khách thể** và **Nội dung**.

#### 1. Chủ thể của quan hệ pháp luật dân sự
Là những người tham gia vào quan hệ pháp luật dân sự, mang quyền và nghĩa vụ dân sự trong quan hệ đó:
- **Cá nhân**: Là chủ thể phổ biến nhất (công dân Việt Nam, người nước ngoài, người không quốc tịch sống tại Việt Nam). Để trở thành chủ thể, cá nhân phải có:
  + **Năng lực pháp luật dân sự**: Khả năng của cá nhân có quyền và nghĩa vụ dân sự (có từ khi sinh ra và chỉ chấm dứt khi cá nhân chết theo Khoản 3 Điều 16 BLDS 2015).
  + **Năng lực hành vi dân sự**: Khả năng của cá nhân bằng hành vi của mình xác lập, thực hiện quyền và nghĩa vụ dân sự (phát triển theo độ tuổi từ chưa thành niên đến từ đủ 18 tuổi trở lên theo Điều 19 - 24 BLDS 2015).
- **Pháp nhân (Điều 74 Bộ luật Dân sự 2015)**: Là các tổ chức (công ty, doanh nghiệp, cơ quan nhà nước, tổ chức xã hội...) tham gia vào quan hệ dân sự với tư cách chủ thể độc lập. Một tổ chức được công nhận là pháp nhân khi đáp ứng đủ 4 điều kiện:
  1. Được thành lập hợp pháp theo quy định của pháp luật;
  2. Có cơ cấu tổ chức chặt chẽ;
  3. Có tài sản độc lập với cá nhân, pháp nhân khác và tự chịu trách nhiệm bằng tài sản của mình;
  4. Nhân danh mình tham gia các quan hệ pháp luật một cách độc lập.
- **Hộ gia đình và Tổ hợp tác (Điều 101 BLDS 2015)**: Là hai chủ thể đặc biệt, chủ thể hạn chế trong quan hệ pháp luật dân sự (thường tham gia trong các quan hệ sản xuất nông - lâm - ngư nghiệp hoặc hoạt động hợp tác kinh doanh cụ thể).

#### 2. Khách thể của quan hệ pháp luật dân sự
- Khách thể là những **lợi ích vật chất, giá trị tinh thần hoặc hành vi** mà các chủ thể hướng tới nhằm thỏa mãn nhu cầu của mình khi tham gia vào quan hệ dân sự.
- Khách thể bao gồm: Tài sản (vật, tiền, giấy tờ có giá, quyền tài sản), hành vi thực hiện hoặc không thực hiện một công việc nhất định, và các giá trị nhân thân phi tài sản (danh dự, nhân phẩm, uy tín, quyền tác giả...).

#### 3. Nội dung của quan hệ pháp luật dân sự
Là tổng hợp các **Quyền dân sự** và **Nghĩa vụ dân sự** giữa các bên tham gia:
- **Quyền dân sự**: Là cách xử sự được phép của người có quyền năng, bao gồm:
  + Quyền chiếm hữu, sử dụng, định đoạt tài sản thuộc sở hữu của mình;
  + Quyền yêu cầu người có nghĩa vụ phải thực hiện hoặc kiềm chế không thực hiện những hành vi nhất định;
  + Quyền tự bảo vệ hoặc yêu cầu cơ quan nhà nước có thẩm quyền bảo vệ khi quyền dân sự của mình bị xâm phạm.
- **Nghĩa vụ dân sự**: Là cách xử sự bắt buộc của người có nghĩa vụ theo quy định của pháp luật hoặc theo thỏa thuận của hợp đồng:
  + Phải chuyển giao tài sản, trả tiền hoặc thực hiện công việc nhất định;
  + Không được thực hiện hành vi trái pháp luật, trái đạo đức xã hội;
  + Phải bồi thường thiệt hại nếu không thực hiện hoặc thực hiện không đúng nghĩa vụ gây thiệt hại cho bên kia.

---

### III. VÍ DỤ MINH HỌA THỰC TIỄN
**Ví dụ: Quan hệ hợp đồng mua bán xe máy giữa Ông A và Anh B:**
- **Chủ thể**:
  + Ông A (Bên bán) và Anh B (Bên mua) — cả hai là cá nhân có đầy đủ năng lực pháp luật và năng lực hành vi dân sự.
- **Khách thể**:
  + Chiếc xe máy (tài sản/lợi ích vật chất) và số tiền thanh toán mua xe.
- **Nội dung**:
  + *Quyền của Ông A*: Quyền nhận đủ số tiền bán xe theo giá thỏa thuận; *Nghĩa vụ của Ông A*: Bàn giao xe kèm đầy đủ giấy tờ đăng ký xe hợp pháp đúng thời hạn cam kết.
  + *Quyền của Anh B*: Quyền nhận xe và quyền sở hữu hợp pháp đối với xe; *Nghĩa vụ của Anh B*: Thanh toán đầy đủ tiền mua xe đúng thời hạn cho Ông A.`
  },
  {
    sample_id: 'SFT_FAMILY_LAW_001',
    intent_code: 'FAMILY_LAW',
    instruction: 'Chị A chung sống với anh T nhưng không đăng ký kết hôn. Do mâu thuẫn nên T bỏ đi và không biết rằng A có thai với T. Sau khi sinh được một bé gái, chị A làm thủ tục khai sinh cho con, chị cho đứa bé mang họ mẹ và trong giấy khai sinh của cháu không có tên người cha. Gần đây, T biết chị A sinh con, qua tìm hiểu biết đó là con mình nên T đã quay lại xin nhận con, hàn gắn mối quan hệ trước đây. Chị A đồng ý cho anh T nhận con gái. Hãy tư vấn pháp lý cho anh T và chị A.',
    input: '',
    output: `### I. HẬU QUẢ PHÁP LÝ CỦA VIỆC CHUNG SỐNG KHÔNG ĐĂNG KÝ KẾT HÔN
Căn cứ **Điều 14 Luật Hôn nhân và Gia đình 2014**:
1. **Về quan hệ giữa nam và nữ**:
   - Khoản 1 Điều 14 quy định: Nam, nữ có đủ điều kiện kết hôn chung sống với nhau như vợ chồng mà không đăng ký kết hôn thì **không làm phát sinh quyền, nghĩa vụ giữa vợ và chồng**.
   - Do đó, về mặt pháp lý, giữa **Chị A** và **Anh T** không tồn tại quan hệ hôn nhân hợp pháp (không được pháp luật công nhận là vợ chồng).
2. **Về việc xác lập quan hệ hôn nhân (nếu muốn hàn gắn)**:
   - Nếu Chị A và Anh T muốn chính thức trở thành vợ chồng hợp pháp, hai bên phải cùng đến cơ quan nhà nước có thẩm quyền làm thủ tục **đăng ký kết hôn**. Quan hệ hôn nhân chỉ được xác lập kể từ **thời điểm đăng ký kết hôn** (Khoản 2 Điều 14).

---

### II. QUYỀN NHẬN CON CỦA ANH T VÀ SỰ ĐỒNG THUẬN CỦA CHỊ A
Căn cứ **Khoản 2 Điều 14, Điều 15 và Điều 91 Luật Hôn nhân và Gia đình 2014**:
1. **Quyền nhận con không phụ thuộc vào tình trạng hôn nhân**:
   - Điều 15 quy định: Quyền, nghĩa vụ giữa nam, nữ chung sống với nhau như vợ chồng mà không đăng ký kết hôn và con được giải quyết theo quy định về **quyền, nghĩa vụ của cha mẹ và con**.
   - Con sinh ra ngoài thời kỳ hôn nhân được pháp luật bảo vệ bình đẳng, có đầy đủ quyền và nghĩa vụ như con sinh ra trong thời kỳ hôn nhân.
2. **Điều kiện để Anh T nhận con gái**:
   - Căn cứ **Khoản 1 và Khoản 2 Điều 91 Luật HNGĐ 2014**: Cha, mẹ có quyền nhận con. Do cháu bé là con chưa thành niên, việc nhận con **phải có sự đồng ý của người mẹ (Chị A)**.
   - Trong tình huống nêu trong đề bài, **Chị A đã đồng ý** cho Anh T nhận con gái, do đó điều kiện luật định về sự đồng thuận hoàn toàn được đáp ứng.

---

### III. THẨM QUYỀN VÀ THỦ TỤC ĐĂNG KÝ NHẬN CHA CHO CON
Căn cứ **Khoản 1 Điều 101 Luật Hôn nhân và Gia đình 2014** và quy định của **Luật Hộ tịch 2014**:
1. **Về thẩm quyền giải quyết**:
   - Căn cứ Khoản 1 Điều 101: Do việc nhận cha con là **hoàn toàn tự nguyện, có sự đồng thuận của cả cha và mẹ, không có tranh chấp**, thẩm quyền giải quyết thuộc về **Ủy ban nhân dân cấp xã** (nơi cư trú của Anh T hoặc của cháu bé), không phải giải quyết tại Tòa án.
2. **Hồ sơ và trình tự thực hiện tại UBND cấp xã**:
   - Anh T và Chị A cùng nộp **Tờ khai đăng ký nhận cha, mẹ, con** theo mẫu quy định.
   - Nộp kèm chứng cứ chứng minh quan hệ cha con (văn bản xét nghiệm ADN, hoặc văn bản cam đoan/xác nhận của các bên và người làm chứng theo quy định tại Thông tư 04/2020/TT-BTP).
   - Công chức tư pháp - hộ tịch kiểm tra hồ sơ, ghi vào Sổ hộ tịch và cấp **Trích lục đăng ký nhận cha, mẹ, con** cho các bên.
3. **Thủ tục bổ sung, thay đổi thông tin trong Giấy khai sinh của cháu bé**:
   - Căn cứ Trích lục nhận cha con, cơ quan hộ tịch tiến hành thủ tục **bổ sung thông tin của Anh T vào mục "Cha" trong Giấy khai sinh** của người con (căn cứ Luật Hộ tịch 2014).
   - Nếu Chị A và Anh T có thỏa thuận về việc đổi họ của cháu bé từ họ mẹ sang họ cha, cơ quan hộ tịch sẽ thực hiện thủ tục **thay đổi họ cho con** theo quy định tại Điều 26 Luật Hộ tịch 2014 và Điều 27 Bộ luật Dân sự 2015.

---

### IV. NGHĨA VỤ VÀ QUYỀN CỦA CHA MẸ ĐỐI VỚI CON CHUNG
Căn cứ **Điều 69, 70, 71, 72 Luật Hôn nhân và Gia đình 2014**:
- Sau khi hoàn tất thủ tục nhận con, **Anh T** chính thức có đầy đủ quyền và nghĩa vụ của người cha: Nghĩa vụ cùng Chị A trông nom, chăm sóc, nuôi dưỡng, giáo dục con; nghĩa vụ đóng góp cấp dưỡng; và quyền thăm nom con mà không ai được cản trở.`
  },
  {
    sample_id: 'SFT_LAPTOP_BAILMENT_001',
    intent_code: 'CASE_ANALYSIS',
    instruction: 'A mượn laptop của B rồi làm rơi vỡ. A cho rằng đây là tai nạn nên không cần bồi thường. Phân tích căn cứ phát sinh trách nhiệm bồi thường, lỗi, nghĩa vụ bảo quản tài sản và những dữ kiện cần xác minh.',
    input: '',
    output: `### I. CĂN CỨ PHÁP LÝ PHÁT SINH TRÁCH NHIỆM BỒI THƯỜNG THIỆT HẠI
Quan hệ giữa A và B là quan hệ **Hợp đồng mượn tài sản** theo quy định tại **Điều 494 Bộ luật Dân sự 2015** (sử dụng tài sản không phải trả tiền và phải hoàn trả nguyên vẹn tài sản khi hết thời hạn mượn).

Trách nhiệm bồi thường thiệt hại phát sinh dựa trên 4 căn cứ luật định (**Điều 584 và Điều 585 Bộ luật Dân sự 2015**):
1. **Có hành vi vi phạm nghĩa vụ/gây thiệt hại**: A làm rơi vỡ chiếc laptop của B.
2. **Có thiệt hại thực tế xảy ra**: Chiếc laptop bị hư hỏng, nứt vỡ, suy giảm hoặc mất hoàn toàn giá trị sử dụng và giá trị kinh tế.
3. **Mối quan hệ nhân quả**: Hành vi làm rơi của A là nguyên nhân trực tiếp và tất yếu dẫn đến hậu quả laptop bị vỡ.
4. **Yếu tố lỗi**: A có lỗi trong việc bảo quản và sử dụng tài sản mượn.

---

### II. PHÂN TÍCH YẾU TỐ LỖI VÀ ĐÁNH GIÁ LẬP LUẬN CỦA A
**Kết luận: Lập luận của A cho rằng "đây là tai nạn nên không cần bồi thường" là HOÀN TOÀN SAI và không có căn cứ pháp lý.**

1. **Phân biệt "tai nạn sinh hoạt" và "Sự kiện bất khả kháng"**:
   - Căn cứ **Khoản 1 Điều 156 Bộ luật Dân sự 2015**: Sự kiện bất khả kháng là sự kiện xảy ra một cách khách quan, **không thể lường trước được** và **không thể khắc phục được** mặc dù đã áp dụng mọi biện pháp cần thiết và khả năng cho phép.
   - Việc cầm, di chuyển hoặc đặt để laptop không cẩn thận dẫn đến rơi vỡ là rủi ro trong sinh hoạt thường nhật, **hoàn toàn có thể lường trước và phòng tránh được** nếu có sự cẩn trọng hợp lý.
2. **Xác định hình thức lỗi**:
   - Hành vi làm rơi vỡ laptop của A mang **yếu tố lỗi vô ý** (do cẩu thả, bất cẩn, thiếu chú ý quan sát hoặc quá tự tin khi cầm nắm tài sản).
   - Theo nguyên tắc chung của pháp luật Dân sự (Khoản 1 Điều 584 BLDS 2015), người gây thiệt hại dù có lỗi cố ý hay lỗi vô ý đều **bắt buộc phải bồi thường thiệt hại**.

---

### III. NGHĨA VỤ BẢO QUẢN TÀI SẢN CỦA BÊN MƯỢN
Căn cứ **Điều 496 Bộ luật Dân sự 2015** quy định về nghĩa vụ của bên mượn tài sản:
- **Khoản 1 Điều 496**: A có nghĩa vụ phải *"giữ gìn, bảo quản tài sản mượn, không được tự ý thay đổi tình trạng của tài sản"*.
- **Khoản 4 Điều 496**: A bắt buộc phải **"Bồi thường thiệt hại, nếu làm mất, hư hỏng tài sản mượn"**.

---

### IV. NHỮNG DỮ KIỆN CẦN XÁC MINH TRONG THỰC TẾ
1. Tình trạng của laptop trước thời điểm cho mượn.
2. Nguyên nhân và diễn biến trực tiếp gây ra việc rơi vỡ (có bên thứ ba tác động không).
3. Mức độ hư hỏng và chi phí khắc phục thực tế (thay thế linh kiện hay bồi thường giá trị khấu hao còn lại).

---

### V. KẾT LUẬN VÀ PHƯƠNG ÁN GIẢI QUYẾT CHO B
1. **Trách nhiệm của A**: A có nghĩa vụ bồi thường toàn bộ chi phí sửa chữa hoặc bồi thường giá trị thực tế của laptop cho B (Điều 585 BLDS 2015).
2. **Phương thức giải quyết**: Thương lượng hòa giải hoặc Khởi kiện ra Tòa án nhân dân cấp huyện nơi A cư trú.`
  },
  {
    sample_id: 'SFT_CIVIL_LOAN_001',
    intent_code: 'CIVIL_CONTRACT',
    instruction: 'A vay B số tiền 100 triệu đồng có giấy viết tay không công chứng. Đến hạn A không trả và cho rằng giấy viết tay không có giá trị pháp lý. Phân tích giá trị pháp lý của giấy vay và hướng giải quyết cho B.',
    input: '',
    output: `### I. ĐÁNH GIÁ LẬP LUẬN CỦA A
**Kết luận dứt khoát: Lập luận của A là HOÀN TOÀN SAI và không có cơ sở pháp lý.**

1. **Về hình thức của hợp đồng vay tài sản**:
- Căn cứ **Điều 463 Bộ luật Dân sự 2015**: Hợp đồng vay tài sản là sự thỏa thuận giữa các bên, theo đó bên cho vay giao tài sản cho bên vay; khi đến hạn trả, bên vay phải hoàn trả cho bên cho vay tài sản cùng loại theo đúng số lượng, chất lượng.
- Căn cứ **Khoản 1 Điều 119 Bộ luật Dân sự 2015**: Giao dịch dân sự được thể hiện bằng lời nói, bằng văn bản hoặc bằng hành vi cụ thể.
- **Pháp luật Dân sự Việt Nam hiện hành KHÔNG bắt buộc hợp đồng/giấy vay tiền giữa các cá nhân phải qua công chứng hoặc chứng thực mới có giá trị pháp lý.**

2. **Giá trị chứng cứ của giấy vay viết tay**:
- Giấy vay tiền có chữ ký, ghi rõ số tiền vay (100 triệu đồng) và thời hạn trả là một **giao dịch dân sự bằng văn bản hợp pháp**.
- Việc A cho rằng giấy vay không công chứng nên không có giá trị chỉ là nhận thức sai lầm hoặc cố ý viện cớ nhằm trốn tránh nghĩa vụ trả nợ đến hạn.

---

### II. PHÂN TÍCH GIÁ TRỊ PHÁP LÝ CỦA GIAO DỊCH VAY TÀI SẢN
Căn cứ **Điều 117 Bộ luật Dân sự 2015**, giao dịch vay số tiền **100 triệu đồng** giữa A và B thỏa mãn đầy đủ 4 điều kiện có hiệu lực: Chủ thể, Ý chí tự nguyện, Mục đích và nội dung hợp pháp, và Hình thức văn bản (Khoản 1 Điều 119 BLDS 2015).

---

### III. TRÁCH NHIỆM PHÁP LÝ DO VI PHẠM NGHĨA VỤ CỦA A
1. Nghĩa vụ hoàn trả nợ gốc (Khoản 1 Điều 466 BLDS 2015): 100 triệu đồng.
2. Trách nhiệm trả lãi chậm trả (Điều 357 & Khoản 4 Điều 466 BLDS 2015): Mức lãi suất 10%/năm.
3. Trách nhiệm bồi thường thiệt hại (Điều 360 BLDS 2015).

---

### IV. RANH GIỚI TRÁCH NHIỆM HÌNH SỰ
- Nếu khó khăn tài chính thông thường: Tranh chấp dân sự tại Tòa án.
- Nếu có điều kiện mà cố tình gian dối hoặc bỏ trốn để chiếm đoạt 100 triệu: Dấu hiệu cấu thành Tội lạm dụng tín nhiệm chiếm đoạt tài sản (Khoản 2 Điều 175 BLHS 2015).

---

### V. HƯỚNG BẢO VỆ QUYỀN LỢI CHO B
1. Gửi văn bản thông báo đòi nợ ấn định thời hạn 07 - 15 ngày.
2. Khởi kiện vụ án dân sự ra Tòa án nhân dân cấp huyện nơi A cư trú kèm Giấy vay tiền gốc.
3. Yêu cầu áp dụng biện pháp khẩn cấp tạm thời (phong tỏa tài khoản, kê biên tài sản).`
  }
];

newSamples.forEach(sample => {
  const idx = list.findIndex(x => x.sample_id === sample.sample_id);
  if (idx >= 0) {
    list[idx] = sample;
  } else {
    list.push(sample);
  }
});

fs.writeFileSync(filePath, JSON.stringify(list, null, 2), 'utf8');
console.log('Successfully saved to:', filePath, 'Total items:', list.length);
