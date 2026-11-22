import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const MASTER_PATH = path.join(ROOT, 'data/processed/sft_vietlaw_master.json');

const GOLDEN_QPPL = `### a) Khái niệm quy phạm pháp luật
Quy phạm pháp luật là quy tắc xử sự chung, có hiệu lực bắt buộc chung, do Nhà nước ban hành hoặc thừa nhận và bảo đảm thực hiện nhằm điều chỉnh các quan hệ xã hội theo những mục đích nhất định.

Quy phạm pháp luật được áp dụng nhiều lần đối với nhiều chủ thể trong những trường hợp mà pháp luật quy định.

### b) Cấu trúc của quy phạm pháp luật
Một quy phạm pháp luật thông thường gồm ba bộ phận: **Giả định**, **Quy định** và **Chế tài**.

1. **Giả định**:
   - Nêu lên những hoàn cảnh, điều kiện, thời gian, địa điểm, chủ thể mà trong đó quy phạm pháp luật được áp dụng.
   - Trả lời câu hỏi: *Ai? Khi nào? Trong hoàn cảnh nào?*
   - *Ví dụ*: Trong quy định *"Người nào điều khiển phương tiện giao thông..."*, phần xác định chủ thể và hoàn cảnh điều khiển phương tiện chính là giả định.

2. **Quy định**:
   - Nêu lên cách xử sự mà chủ thể được phép, phải hoặc không được phép thực hiện.
   - Trả lời câu hỏi: *Chủ thể phải làm gì, được làm gì hoặc không được làm gì?*

3. **Chế tài**:
   - Nêu lên những biện pháp tác động mà Nhà nước dự kiến áp dụng đối với chủ thể không thực hiện hoặc thực hiện không đúng quy định pháp luật.
   - Chế tài có thể là: Cảnh cáo, phạt tiền, tước quyền, bồi thường, phạt tù, các biện pháp khác theo quy định pháp luật.

### c) Ví dụ minh họa và xác định 3 bộ phận
**Ví dụ**: Quy định về xử phạt hành vi vượt đèn đỏ khi tham gia giao thông.
- **Giả định**: Người điều khiển phương tiện tham gia giao thông trong trường hợp đèn tín hiệu giao thông đã chuyển sang màu đỏ.
- **Quy định**: Người điều khiển phương tiện phải dừng lại.
- **Chế tài**: Nếu vi phạm thì có thể bị xử phạt theo quy định pháp luật giao thông.

> 💡 **Lưu ý khi thi**: Không phải mọi điều luật đều thể hiện đầy đủ cả ba bộ phận trong cùng một điều luật. Có trường hợp một quy phạm được thể hiện ở nhiều điều, khoản khác nhau hoặc có bộ phận bị ẩn (như quy phạm hình sự thường ẩn bộ phận quy định).`;

const GOLDEN_QHPL = `### a) Khái niệm quan hệ pháp luật
Quan hệ pháp luật là quan hệ xã hội được các quy phạm pháp luật điều chỉnh, trong đó các bên tham gia có các quyền và nghĩa vụ pháp lý nhất định được Nhà nước bảo đảm thực hiện.

- **Ví dụ**: A ký hợp đồng mua điện thoại của B. Khi đó giữa A và B phát sinh quan hệ pháp luật dân sự.

### b) Ba yếu tố cấu thành của quan hệ pháp luật
Một quan hệ pháp luật thông thường gồm ba yếu tố cấu thành: **Chủ thể**, **Nội dung** và **Khách thể**.

1. **Chủ thể**:
   - Là cá nhân, tổ chức có năng lực chủ thể (gồm năng lực pháp luật và năng lực hành vi) tham gia vào quan hệ pháp luật.
   - *Ví dụ trong hợp đồng mua bán*:
     + Người mua là chủ thể.
     + Người bán là chủ thể.

2. **Nội dung**:
   - Là tổng hợp các quyền và nghĩa vụ pháp lý của các chủ thể tham gia quan hệ pháp luật.
   - *Ví dụ*:
     + Người mua có: Quyền nhận tài sản; Nghĩa vụ trả tiền.
     + Người bán có: Quyền nhận tiền; Nghĩa vụ giao tài sản.

3. **Khách thể**:
   - Là lợi ích vật chất, tinh thần hoặc những giá trị xã hội mà các chủ thể hướng tới khi tham gia quan hệ pháp luật và là đối tượng tác động của quan hệ đó.
   - *Ví dụ*: Trong hợp đồng mua điện thoại, chiếc điện thoại và lợi ích mà các bên hướng tới chính là khách thể liên quan của quan hệ.`;

export function cleanBoilerplate(text, sampleId) {
  if (!text || typeof text !== 'string') return '';
  let out = text;

  // 1. Áp dụng mẫu chuẩn vàng trực tiếp cho các câu cốt lõi
  if (sampleId === 'SFT_THEORY_QPPL_STRUCT_IDENTIFY') {
    return GOLDEN_QPPL;
  }
  if (sampleId === 'SFT_LLM_CIVIL_RELATION_3_ELEMENTS') {
    return GOLDEN_QHPL;
  }

  // 2. Gỡ bỏ các mảnh trích dẫn prompt còn sót ở đầu
  out = out.replace(/^[^\n#]*\.\.\."\s*\n*/g, '');
  out = out.replace(/^[^\n#]*\bgiúp ph\.\.\."\s*\n*/g, '');
  out = out.replace(/^[^\n#]*\bnhất hai luận điểm\b[^\n]*\n*/g, '');
  out = out.replace(/^[^#\n]*?"\s*\n+(?=###\s*2\.)/g, '');

  // 3. Gỡ bỏ khối mở đầu lặp lại máy móc
  out = out.replace(/^###\s*(?:1\.|I\.)\s*Tóm tắt vấn đề pháp lý(?:\s*&[^\n]*)?\s*\n+Vấn đề lý luận pháp lý cần làm rõ:[^\n]*\s*\n*/gi, '');
  out = out.replace(/^###\s*(?:1\.|I\.)\s*Tóm tắt vấn đề pháp lý(?:\s*&[^\n]*)?\s*\n+Yêu cầu đối chiếu, phân biệt giữa các đối tượng pháp lý:[^\n]*\s*\n*/gi, '');
  out = out.replace(/^###\s*(?:1\.|I\.)\s*Tóm tắt vấn đề pháp lý(?:\s*&[^\n]*)?\s*\n+Tình huống đặt ra yêu cầu giải quyết vấn đề pháp lý trọng tâm:[^\n]*\s*\n*/gi, '');

  // 4. Nếu mở đầu là Căn cứ chung chung (chỉ trích dẫn giáo trình chung mà không có số Điều luật cụ thể)
  const genericCanCuOnly = /^###\s*(?:2\.|II\.)\s*Căn cứ pháp lý[^\n]*\s*\n+-\s*(?:\*\*Giáo trình Pháp luật đại cương \(Bộ GD&ĐT\)\*\*:[^\n]*|Quy định tại các văn bản quy phạm pháp luật thực định và Giáo trình[^\n]*)\s*\n+/i;
  out = out.replace(genericCanCuOnly, '');

  // 5. Nếu mở đầu còn sót header "### 3. Phân tích chi tiết từng ý"
  out = out.replace(/^###\s*(?:3\.|III\.)\s*Phân tích chi tiết từng ý(?:\s*\(Bảng so sánh đối chiếu\))?\s*\n*/gi, '');

  // 6. Gỡ bỏ kết luận sáo rỗng máy móc
  out = out.replace(/\n+###\s*(?:4\.|IV\.)\s*Kết luận\s*\n+Tóm lại\s*\(căn cứ Giáo trình[^)]*\)[^\n]*/gi, '');
  out = out.replace(/\n+###\s*(?:4\.|IV\.)\s*Kết luận\s*\n+Nội dung phân tích nêu trên phản ánh đầy đủ bản chất[^\n]*/gi, '');
  out = out.replace(/\n+###\s*(?:4\.|IV\.)\s*Kết luận\s*\n+Việc phân biệt rõ ràng các khái niệm[^\n]*/gi, '');
  out = out.replace(/\n+###\s*(?:4\.|IV\.)\s*Kết luận\s*\n+Căn cứ các phân tích chi tiết và đối chiếu điều luật nêu trên[^\n]*/gi, '');

  // 7. Xóa các ký tự '#' đứng trơ trọi và khoảng trống thừa
  out = out.replace(/^\s*#\s*$/gm, '');
  out = out.replace(/\n{3,}/g, '\n\n');
  out = out.replace(/---\s*\n+---/g, '---');

  return out.trim();
}

async function main() {
  console.log('[*] Đang đọc master dataset:', MASTER_PATH);
  const raw = fs.readFileSync(MASTER_PATH, 'utf-8');
  const dataset = JSON.parse(raw);
  console.log(`[*] Tổng số mẫu: ${dataset.length}`);

  let cleanedCount = 0;
  for (const item of dataset) {
    const oldOut = item.output || '';
    const newOut = cleanBoilerplate(oldOut, item.sample_id);
    if (newOut !== oldOut) {
      item.output = newOut;
      cleanedCount++;
    }
    // Đồng bộ lại messages nếu có
    if (Array.isArray(item.messages)) {
      const lastMsg = item.messages[item.messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.content = item.output;
      }
    }
  }

  console.log(`[+] Đã tinh gọn và loại bỏ văn phong dài dòng máy móc cho: ${cleanedCount} mẫu!`);

  // Ghi lại master dataset
  fs.writeFileSync(MASTER_PATH, JSON.stringify(dataset, null, 2), 'utf-8');
  console.log('[+] Đã lưu sft_vietlaw_master.json hoàn tất!');

  // Đồng bộ các file phân chia train/val/test và csv
  console.log('[*] Đồng bộ sang train/validation/test split...');
  const trainCount = Math.floor(dataset.length * 0.8);
  const valCount = Math.floor(dataset.length * 0.1);

  const trainSet = dataset.slice(0, trainCount);
  const valSet = dataset.slice(trainCount, trainCount + valCount);
  const testSet = dataset.slice(trainCount + valCount);

  fs.writeFileSync(path.join(ROOT, 'data/processed/sft_vietlaw_train.jsonl'), trainSet.map(s => JSON.stringify(s)).join('\n'), 'utf-8');
  fs.writeFileSync(path.join(ROOT, 'data/processed/sft_vietlaw_validation.jsonl'), valSet.map(s => JSON.stringify(s)).join('\n'), 'utf-8');
  fs.writeFileSync(path.join(ROOT, 'data/processed/sft_vietlaw_test.jsonl'), testSet.map(s => JSON.stringify(s)).join('\n'), 'utf-8');

  // Ghi flat CSV
  const csvHeader = 'sample_id,intent_code,instruction,input,output\n';
  const csvRows = dataset.map(s => {
    const cleanCol = (txt) => `"${(txt || '').replace(/"/g, '""').replace(/\r?\n/g, '\\n')}"`;
    return [
      cleanCol(s.sample_id),
      cleanCol(s.intent_code),
      cleanCol(s.instruction),
      cleanCol(s.input),
      cleanCol(s.output)
    ].join(',');
  }).join('\n');
  fs.writeFileSync(path.join(ROOT, 'data/processed/sft_vietlaw_flat.csv'), csvHeader + csvRows, 'utf-8');

  console.log('✅ Hoàn tất tinh gọn và đồng bộ 100% dữ liệu!');
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
  process.exit(1);
});
