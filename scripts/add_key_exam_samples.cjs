const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'data', 'processed', 'sft_vietlaw_500.json');
const dataset = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const existingIds = new Set(dataset.map(it => it.sample_id));

const newSamples = [
  {
    sample_id: 'SFT_PLDC_STATE_NATURE_001',
    intent_code: 'DEFINITION',
    instruction: 'Nêu rõ bản chất của Nhà nước. Tại sao nói: "Bản chất của Nhà nước bao gồm cả tính giai cấp và tính xã hội"?',
    input: 'Nêu rõ bản chất của Nhà nước. Tại sao nói: "Bản chất của Nhà nước bao gồm cả tính giai cấp và tính xã hội"?',
    output: `### I. KHÁI NIỆM VÀ BẢN CHẤT CỦA NHÀ NƯỚC
Theo quan điểm của Chủ nghĩa Mác - Lênin và giáo trình **Pháp luật Đại cương** (Bộ GD&ĐT):
- **Nhà nước** là tổ chức quyền lực chính trị đặc biệt của xã hội có giai cấp, gồm một lớp người được tách ra để chuyên thực thi quyền lực nhằm quản lý xã hội, bảo vệ trật tự và lợi ích của giai cấp thống trị, đồng thời bảo đảm các nhu cầu chung của toàn xã hội.
- Bản chất của Nhà nước là một thể thống nhất hữu cơ giữa hai thuộc tính cơ bản: **Tính giai cấp** và **Tính xã hội**. Bất kỳ nhà nước nào trong lịch sử (từ Chiếm hữu nô lệ, Phong kiến, Tư sản đến Xã hội chủ nghĩa) cũng đều mang hai tính chất này.

---

### II. PHÂN TÍCH TÍNH GIAI CẤP CỦA NHÀ NƯỚC
1. **Nguồn gốc phát sinh**:
   - Nhà nước không tồn tại vĩnh viễn mà là sản phẩm và biểu hiện của các cuộc đấu tranh giai cấp không thể điều hòa được. Nhà nước chỉ ra đời khi xã hội xuất hiện chế độ tư hữu và phân hóa thành các giai cấp đối kháng.
2. **Biểu hiện của tính giai cấp**:
   - **Nhà nước là công cụ chuyên chính của giai cấp thống trị**: Nhà nước được thiết lập trước hết để bảo vệ lợi ích và củng cố địa vị thống trị của giai cấp cầm quyền trong xã hội.
   - **Thể hiện trên 3 phương diện quyền lực cơ bản**:
     + *Về kinh tế*: Giai cấp thống trị nắm quyền sở hữu các tư liệu sản xuất chủ yếu của xã hội, qua đó bóc lột và chi phối các giai cấp khác về mặt kinh tế.
     + *Về chính trị*: Nhà nước nắm giữ bộ máy bạo lực chuyên nghiệp (quân đội, cảnh sát, tòa án, nhà tù...) có quyền lực cưỡng chế đặc biệt để đàn áp sự phản kháng của các giai cấp bị trị.
     + *Về tư tưởng*: Giai cấp thống trị thông qua Nhà nước tuyên truyền, áp đặt hệ tư tưởng của giai cấp mình trở thành hệ tư tưởng thống trị trong xã hội.

---

### III. PHÂN TÍCH TÍNH XÃ HỘI CỦA NHÀ NƯỚC
1. **Nguồn gốc và sự tất yếu**:
   - Nhà nước sinh ra từ trong lòng xã hội, là đại diện chính thức cho toàn bộ xã hội. Dù thuộc kiểu nhà nước nào, Nhà nước cũng không thể tồn tại đơn thuần bằng bạo lực và đàn áp giai cấp, mà bắt buộc phải giải quyết các công việc chung vì sự tồn tại và phát triển của toàn thể cộng đồng.
2. **Biểu hiện của tính xã hội**:
   - **Quản lý và giải quyết các nhu cầu công cộng**: Nhà nước tổ chức xây dựng các công trình công cộng hạ tầng (đường sá, đê điều, cầu cống, công trình thủy lợi, cấp thoát nước).
   - **Phát triển văn hóa - xã hội**: Tổ chức và quản lý hệ thống y tế, phòng chống dịch bệnh, phát triển giáo dục, cứu trợ thiên tai, bảo đảm an sinh xã hội cho người dân.
   - **Duy trì trật tự an toàn công cộng**: Thiết lập trật tự pháp luật, phòng ngừa tội phạm, giải quyết các tranh chấp trong đời sống dân sự, bảo vệ môi trường sinh thái.
   - **Bảo vệ độc lập dân tộc**: Tổ chức phòng thủ quốc gia, bảo vệ biên giới lãnh thổ chống giặc ngoại xâm vì sự sinh tồn của cả quốc gia, dân tộc.

---

### IV. MỐI QUAN HỆ BIỆN CHỨNG GIỮA TÍNH GIAI CẤP VÀ TÍNH XÃ HỘI
1. **Mối quan hệ gắn bó hữu cơ, không thể tách rời**:
   - Tính giai cấp và tính xã hội luôn cùng tồn tại trong một thể thống nhất. Nếu không có tính giai cấp thì không còn là Nhà nước (vì Nhà nước là tổ chức quyền lực chính trị); ngược lại, nếu Nhà nước từ bỏ tính xã hội, không chăm lo các lợi ích chung của cộng đồng thì xã hội sẽ rơi vào hỗn loạn, khủng hoảng và chính Nhà nước đó sẽ bị sụp đổ.
2. **Sự biến đổi tương quan theo lịch sử**:
   - Trong các kiểu nhà nước bóc lột trước đây (Chủ nô, Phong kiến), tính giai cấp biểu hiện vô cùng gay gắt và chiếm ưu thế tuyệt đối.
   - Cùng với sự tiến bộ của lịch sử và sự phát triển của nền văn minh nhân loại, tính xã hội của Nhà nước ngày càng được mở rộng và phát huy mạnh mẽ.

---

### V. LIÊN HỆ BẢN CHẤT NHÀ NƯỚC CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
- Theo **Hiến pháp năm 2013** (Điều 2): Nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam là Nhà nước pháp quyền xã hội chủ nghĩa của Nhân dân, do Nhân dân, vì Nhân dân; do giai cấp công nhân lãnh đạo thông qua Đảng Cộng sản Việt Nam.
- Tính giai cấp và tính xã hội trong Nhà nước ta có sự thống nhất sâu sắc: Lợi ích của giai cấp công nhân hoàn toàn thống nhất với lợi ích của nhân dân lao động và của toàn thể dân tộc Việt Nam. Mục tiêu cao nhất của Nhà nước là: *"Dân giàu, nước mạnh, dân chủ, công bằng, văn minh"*.`
  },
  {
    sample_id: 'SFT_TF_CIVIL_CAPACITY_AGE_001',
    intent_code: 'TRUE_FALSE',
    instruction: 'Các nhận định sau đây đúng hay sai? Hãy giải thích ngắn gọn: Năng lực hành vi dân sự của cá nhân phát sinh từ khi người đó đủ 18 tuổi.',
    input: 'Năng lực hành vi dân sự của cá nhân phát sinh từ khi người đó đủ 18 tuổi.',
    output: `### I. KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.

---

### II. CĂN CỨ PHÁP LÝ VÀ PHÂN TÍCH
Căn cứ theo quy định tại **Điều 19, Điều 20 và Điều 21 Bộ luật Dân sự 2015**:

1. **Khái niệm và đặc điểm phát sinh**:
   - Căn cứ **Điều 19 BLDS 2015**: Năng lực hành vi dân sự của cá nhân là khả năng của cá nhân bằng hành vi của mình xác lập, thực hiện quyền, nghĩa vụ dân sự.
   - Năng lực hành vi dân sự **không phải đến khi đủ 18 tuổi mới phát sinh**, mà nó hình thành và phát triển dần theo các mốc độ tuổi và khả năng nhận thức của cá nhân:
     + *Dưới 6 tuổi*: Chưa có năng lực hành vi dân sự; các giao dịch dân sự do người đại diện theo pháp luật xác lập, thực hiện (Khoản 2 Điều 21).
     + *Từ đủ 6 tuổi đến chưa đủ 15 tuổi*: Đã phát sinh năng lực hành vi dân sự một phần; cá nhân được tự mình xác lập, thực hiện các giao dịch dân sự phục vụ nhu cầu sinh hoạt hàng ngày phù hợp với lứa tuổi (Khoản 3 Điều 21).
     + *Từ đủ 15 tuổi đến chưa đủ 18 tuổi*: Tự mình xác lập, thực hiện các giao dịch dân sự, trừ giao dịch liên quan đến bất động sản, động sản phải đăng ký... (Khoản 4 Điều 21).

2. **Ý nghĩa pháp lý của mốc "Đủ 18 tuổi"**:
   - Căn cứ **Điều 20 BLDS 2015**: Người từ **đủ 18 tuổi trở lên** là người thành niên có **năng lực hành vi dân sự đầy đủ**, trừ trường hợp bị Tòa án tuyên bố mất hoặc hạn chế năng lực hành vi.
   - Như vậy, mốc 18 tuổi là thời điểm cá nhân đạt được năng lực hành vi dân sự **ĐẦY ĐỦ**, chứ không phải là thời điểm **bắt đầu phát sinh**. Do đó, khẳng định trên là sai.`
  },
  {
    sample_id: 'SFT_TF_ALL_VIOLATIONS_CRIMINAL_001',
    intent_code: 'TRUE_FALSE',
    instruction: 'Các nhận định sau đây đúng hay sai? Hãy giải thích ngắn gọn: Mọi hành vi vi phạm pháp luật đều phải chịu trách nhiệm hình sự.',
    input: 'Mọi hành vi vi phạm pháp luật đều phải chịu trách nhiệm hình sự.',
    output: `### I. KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.

---

### II. CƠ SỞ LÝ LUẬN VÀ CĂN CỨ PHÁP LÝ
1. **Phân loại 4 hình thức vi phạm pháp luật và trách nhiệm pháp lý tương ứng**:
   Theo lý luận chung về Nhà nước và Pháp luật và hệ thống pháp luật Việt Nam, vi phạm pháp luật được phân chia thành **4 loại** với các mức độ nguy hiểm cho xã hội và chế tài trách nhiệm pháp lý khác nhau:
   - **Vi phạm hình sự (Tội phạm)**: Chịu **Trách nhiệm hình sự** (căn cứ Bộ luật Hình sự 2015, sửa đổi 2017).
   - **Vi phạm hành chính**: Chịu **Trách nhiệm hành chính** (xử phạt cảnh cáo, phạt tiền theo Luật Xử lý vi phạm hành chính 2012, sửa đổi 2020).
   - **Vi phạm dân sự**: Chịu **Trách nhiệm dân sự** (bồi thường thiệt hại, khắc phục hậu quả theo Bộ luật Dân sự 2015).
   - **Vi phạm kỷ luật**: Chịu **Trách nhiệm kỷ luật** (áp dụng với cán bộ, công chức, viên chức, người lao động theo Luật Cán bộ, công chức và Bộ luật Lao động 2019).

2. **Ranh giới của Trách nhiệm hình sự**:
   - Căn cứ **Khoản 1 Điều 8 Bộ luật Hình sự 2015**: Chỉ những hành vi nguy hiểm cho xã hội ở **mức độ đáng kể** cấu thành **Tội phạm** được quy định trong Bộ luật Hình sự mới bị truy cứu trách nhiệm hình sự.
   - Các hành vi vi phạm pháp luật hành chính, dân sự, kỷ luật không phải là tội phạm và hoàn toàn không phải chịu trách nhiệm hình sự. Do đó, khẳng định "mọi hành vi vi phạm pháp luật đều phải chịu trách nhiệm hình sự" là hoàn toàn sai.`
  },
  {
    sample_id: 'SFT_TF_MULTI_CAPACITY_CRIME_001',
    intent_code: 'TRUE_FALSE',
    instruction: 'Các nhận định sau đây đúng hay sai? Hãy giải thích ngắn gọn:\n1. Năng lực hành vi dân sự của cá nhân phát sinh từ khi người đó đủ 18 tuổi.\n2. Mọi hành vi vi phạm pháp luật đều phải chịu trách nhiệm hình sự.',
    input: 'Các nhận định sau đây đúng hay sai? Hãy giải thích ngắn gọn:\n1. Năng lực hành vi dân sự của cá nhân phát sinh từ khi người đó đủ 18 tuổi.\n2. Mọi hành vi vi phạm pháp luật đều phải chịu trách nhiệm hình sự.',
    output: `### GIẢI ĐÁP CHI TIẾT CÁC NHẬN ĐỊNH ĐÚNG / SAI

---

#### 1. Nhận định: "Năng lực hành vi dân sự của cá nhân phát sinh từ khi người đó đủ 18 tuổi."
- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Căn cứ pháp lý & Giải thích**:
  Căn cứ theo quy định tại **Điều 19, Điều 20 và Điều 21 Bộ luật Dân sự 2015**:
  1. Năng lực hành vi dân sự của cá nhân là khả năng của cá nhân bằng hành vi của mình xác lập, thực hiện quyền, nghĩa vụ dân sự. Năng lực này **phát sinh và phát triển dần theo độ tuổi và khả năng nhận thức** của cá nhân, chứ không phải đến 18 tuổi mới bắt đầu phát sinh:
     - *Dưới 6 tuổi*: Không có năng lực hành vi dân sự (giao dịch do người đại diện xác lập - Khoản 2 Điều 21).
     - *Từ đủ 6 tuổi đến chưa đủ 15 tuổi*: Đã phát sinh năng lực hành vi dân sự một phần (được tự mình xác lập giao dịch phục vụ nhu cầu sinh hoạt hàng ngày phù hợp lứa tuổi - Khoản 3 Điều 21).
     - *Từ đủ 15 tuổi đến dưới 18 tuổi*: Tự mình xác lập, thực hiện các giao dịch dân sự, trừ giao dịch liên quan đến bất động sản, động sản phải đăng ký... (Khoản 4 Điều 21).
  2. Căn cứ **Điều 20 BLDS 2015**: Người từ **đủ 18 tuổi trở lên** là người thành niên có **năng lực hành vi dân sự đầy đủ**.
  ➔ Như vậy, mốc 18 tuổi là thời điểm đạt được năng lực hành vi dân sự **ĐẦY ĐỦ**, còn năng lực hành vi đã phát sinh từng phần từ trước đó (từ khi đủ 6 tuổi). Vì vậy nhận định trên là SAI.

---

#### 2. Nhận định: "Mọi hành vi vi phạm pháp luật đều phải chịu trách nhiệm hình sự."
- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Căn cứ pháp lý & Cơ sở lý luận**:
  1. Trong khoa học pháp lý và hệ thống pháp luật Việt Nam, vi phạm pháp luật được phân chia thành **4 loại** với **4 chế tài trách nhiệm pháp lý** tương ứng:
     - **Vi phạm hình sự (Tội phạm)**: Chịu **Trách nhiệm hình sự** (loại trách nhiệm pháp lý nghiêm khắc nhất do Tòa án áp dụng theo Bộ luật Hình sự 2015).
     - **Vi phạm hành chính**: Chịu **Trách nhiệm hành chính** (phạt cảnh cáo, phạt tiền theo Luật Xử lý vi phạm hành chính).
     - **Vi phạm dân sự**: Chịu **Trách nhiệm dân sự** (bồi thường thiệt hại, hoàn trả tài sản theo Bộ luật Dân sự 2015).
     - **Vi phạm kỷ luật**: Chịu **Trách nhiệm kỷ luật** (khiển trách, cảnh cáo, cách chức, buộc thôi việc theo Luật Cán bộ, công chức và Bộ luật Lao động 2019).
  2. Căn cứ **Khoản 1 Điều 8 Bộ luật Hình sự 2015**: Chỉ những hành vi nguy hiểm cho xã hội ở mức độ đáng kể cấu thành **Tội phạm** mới phải chịu trách nhiệm hình sự. Các hành vi vi phạm hành chính, dân sự, kỷ luật không phải là tội phạm và hoàn toàn không phải chịu trách nhiệm hình sự. Vì vậy nhận định trên là SAI.`
  }
];

let added = 0;
for (const s of newSamples) {
  if (!existingIds.has(s.sample_id)) {
    dataset.push(s);
    existingIds.add(s.sample_id);
    added++;
  } else {
    const idx = dataset.findIndex(it => it.sample_id === s.sample_id);
    if (idx !== -1) {
      dataset[idx] = s;
      console.log('Updated sample:', s.sample_id);
    }
  }
}

fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2), 'utf8');
console.log('Done! Added or updated samples in sft_vietlaw_500.json:', added);
