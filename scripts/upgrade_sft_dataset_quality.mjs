import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const MASTER_PATH = path.join(ROOT, 'data/processed/sft_vietlaw_master.json');

const SYSTEM_INSTRUCTION_OUTLINE_FIRST = `<system_instruction>
Bạn là trợ lý Pháp luật đại cương (Giảng viên Pháp lý Bộ GD&ĐT). Chỉ sử dụng thông tin trong thẻ <context> và lịch sử hội thoại để trả lời chính xác, giữ đúng vai trò chủ thể và các con số của người dùng.
Mặc định khi trả lời câu hỏi phân tích hoặc tình huống, bắt buộc phải trình bày đầy đủ theo 4 mục sau (Outline-first Prompting), không được bỏ sót mục nào:
1. Tóm tắt vấn đề pháp lý
2. Căn cứ pháp lý (nêu rõ Tên luật, Điều, Khoản)
3. Phân tích chi tiết từng ý
4. Kết luận
</system_instruction>`;

// Danh mục tra cứu tiêu đề điều luật thông dụng
const ARTICLE_TITLES = {
  '12_BLHS': 'Tuổi chịu trách nhiệm hình sự',
  '22_BLHS': 'Phòng vệ chính đáng và vượt quá giới hạn phòng vệ chính đáng',
  '126_BLHS': 'Tội giết người do vượt quá giới hạn phòng vệ chính đáng',
  '123_BLHS': 'Tội giết người',
  '134_BLHS': 'Tội cố ý gây thương tích hoặc gây tổn hại cho sức khỏe của người khác',
  '173_BLHS': 'Tội trộm cắp tài sản',
  '174_BLHS': 'Tội lừa đảo chiếm đoạt tài sản',
  '175_BLHS': 'Tội lạm dụng tín nhiệm chiếm đoạt tài sản',
  '168_BLHS': 'Tội cướp tài sản',
  '18_BLHS': 'Che giấu tội phạm',
  '19_BLHS': 'Không tố giác tội phạm',
  '8_BLHS': 'Khái niệm tội phạm',
  '9_BLHS': 'Phân loại tội phạm',
  '117_BLDS': 'Điều kiện có hiệu lực của giao dịch dân sự',
  '122_BLDS': 'Giao dịch dân sự vô hiệu',
  '127_BLDS': 'Giao dịch dân sự vô hiệu do bị lừa dối, đe dọa, cưỡng ép',
  '129_BLDS': 'Giao dịch dân sự vô hiệu do không tuân thủ quy định về hình thức',
  '131_BLDS': 'Hậu quả pháp lý của giao dịch dân sự vô hiệu',
  '132_BLDS': 'Thời hiệu yêu cầu Tòa án tuyên bố giao dịch dân sự vô hiệu',
  '328_BLDS': 'Đặt cọc',
  '463_BLDS': 'Hợp đồng vay tài sản',
  '466_BLDS': 'Nghĩa vụ trả nợ của bên vay',
  '468_BLDS': 'Lãi suất trong hợp đồng vay tài sản',
  '584_BLDS': 'Căn cứ phát sinh trách nhiệm bồi thường thiệt hại',
  '586_BLDS': 'Năng lực chịu trách nhiệm bồi thường thiệt hại của cá nhân',
  '590_BLDS': 'Thiệt hại do sức khỏe bị xâm phạm',
  '603_BLDS': 'Bồi thường thiệt hại do súc vật gây ra',
  '612_BLDS': 'Di sản thừa kế',
  '644_BLDS': 'Người thừa kế không phụ thuộc vào nội dung của di chúc',
  '650_BLDS': 'Những trường hợp thừa kế theo pháp luật',
  '651_BLDS': 'Người thừa kế theo pháp luật',
  '652_BLDS': 'Thừa kế thế vị',
  '4_VBQPPL': 'Hệ thống văn bản quy phạm pháp luật',
  '152_VBQPPL': 'Hiệu lực trở về trước của văn bản quy phạm pháp luật',
  '156_VBQPPL': 'Áp dụng văn bản quy phạm pháp luật',
  '8_HNGD': 'Điều kiện kết hôn',
  '26_BLLD': 'Tiền lương trong thời gian thử việc'
};

function getArticleTitle(articleNum, lawName) {
  const code = `${articleNum}_${lawName}`;
  return ARTICLE_TITLES[code] || '';
}

// Trích xuất các điều luật được nhắc đến trong Mục 3
function extractArticlesFromSection3(sec3Text) {
  const results = [];
  const rx = /(?:Khoản\s+(\d+)\s+)?Điều\s+(\d+)(?:\s+(Bộ\s+luật\s+(?:Hình\s+sự|Dân\s+sự|Lao\s+động)|Luật\s+[^\n,.;()*:"“”]+|Hiến\s+pháp|Nghị\s+định\s+[^\n,.;()*:"“”]+))?/gi;
  let m;
  while ((m = rx.exec(sec3Text)) !== null) {
    const clause = m[1] ? `Khoản ${m[1]} ` : '';
    const artNum = m[2];
    let law = m[3] ? m[3].trim() : '';

    if (!law) {
      if (/bộ luật hình sự|tội|án tích|phòng vệ/i.test(sec3Text)) law = 'Bộ luật Hình sự 2015';
      else if (/bộ luật dân sự|thừa kế|bồi thường|hợp đồng|đặt cọc/i.test(sec3Text)) law = 'Bộ luật Dân sự 2015';
      else if (/bộ luật lao động|thử việc|lương/i.test(sec3Text)) law = 'Bộ luật Lao động 2019';
      else law = 'pháp luật hiện hành';
    }

    let lawShort = 'BLHS';
    if (/dân sự/i.test(law)) lawShort = 'BLDS';
    else if (/lao động/i.test(law)) lawShort = 'BLLD';
    else if (/hôn nhân/i.test(law)) lawShort = 'HNGD';
    else if (/văn bản/i.test(law)) lawShort = 'VBQPPL';

    const title = getArticleTitle(artNum, lawShort);
    const titleStr = title ? `: ${title}` : '';
    const citation = `${clause}Điều ${artNum} ${law}${titleStr}`.trim();

    if (!results.some((r) => r.artNum === artNum && r.lawShort === lawShort && r.clause === clause)) {
      results.push({ clause, artNum, law, lawShort, title, citation });
    }
  }
  return results;
}

// Tạo câu kết luận trực tiếp, giải quyết dứt điểm vấn đề pháp lý
function synthesizeDirectConclusion(sample, sec3Text, citations) {
  const q = (sample.instruction + ' ' + (sample.input || '')).toLowerCase();
  const sec3Clean = sec3Text.trim();

  // 1. Nếu là tình huống của Hưng đâm Phố
  if (/hưng/i.test(q) && /phố/i.test(q)) {
    return 'Hành vi của Hưng đã hội đủ 4 yếu tố cấu thành tội phạm. Căn cứ Khoản 2 Điều 22 và Điều 126 Bộ luật Hình sự 2015, Hưng phải chịu trách nhiệm hình sự về Tội giết người do vượt quá giới hạn phòng vệ chính đáng hoặc do vượt quá mức cần thiết khi bắt giữ người phạm tội.';
  }

  // 2. Nếu là Đúng/Sai
  if (sample.taxonomy_group === 'G04_TRUE_FALSE' || sample.intent_code === 'TRUE_FALSE') {
    const isSai = /\bSAI\b/i.test(sec3Clean);
    const verdict = isSai ? 'SAI' : 'ĐÚNG';
    const firstCite = citations.length > 0 ? citations[0].citation.replace(/^[-*•\s]+/, '').replace(/:\s*[^:]+$/, '') : 'quy định pháp luật thực định';
    return `Nhận định đưa ra trong đề bài là **${verdict}**. Cần căn cứ chính xác vào ${firstCite} để giải thích đúng bản chất pháp lý và tránh nhầm lẫn trong áp dụng.`;
  }

  // 3. Nếu là thừa kế
  if (sample.intent_code === 'CIVIL_INHERIT' || /thừa kế|di chúc|di sản/i.test(q)) {
    // Trích xuất các dòng phân chia số tiền ở cuối phần 3 nếu có
    const lines = sec3Clean.split('\n');
    const moneyLines = lines.filter((l) => /đồng|vnđ|triệu|suất|hưởng/i.test(l) && /[-*•]|\d+\./.test(l));
    if (moneyLines.length >= 2) {
      const summaryList = moneyLines.slice(-4).map((l) => l.trim()).join('\n');
      return `Việc phân chia di sản thừa kế được chốt lại theo đúng quy định tại Điều 644, Điều 651 và Điều 652 Bộ luật Dân sự 2015 như sau:\n${summaryList}`;
    }
    return 'Di sản thừa kế được phân định rõ ràng giữa kỷ phần theo di chúc và quyền thừa kế bắt buộc không phụ thuộc vào di chúc theo Điều 644 Bộ luật Dân sự 2015; các đồng thừa kế theo pháp luật hưởng các suất bằng nhau theo Điều 651 Bộ luật Dân sự 2015.';
  }

  // 4. Nếu là bài tập 4 yếu tố cấu thành vi phạm pháp luật / tội phạm
  if (sample.intent_code === 'VPPL_4_ELEMENTS' || /cấu thành|vi phạm pháp luật|tội phạm/i.test(q)) {
    // Tìm chủ thể và tội danh
    let subject = 'Chủ thể';
    const subMatch = sec3Clean.match(/CHỦ THỂ[:\s]+(?:Anh|Chị|Ông|Bà|Sinh viên)?\s*([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]+)?)/i);
    if (subMatch) subject = subMatch[1];

    let crime = '';
    const crimeMatch = sec3Clean.match(/Tội\s+([^\n,.;]+)/i);
    if (crimeMatch) crime = `về ${crimeMatch[0].trim()}`;

    const citeStr = citations.length > 0 ? ` theo ${citations[0].citation.replace(/^[-*•\s]+/, '').replace(/:\s*[^:]+$/, '')}` : '';
    return `Hành vi nêu trên đã hội đủ 4 yếu tố cấu thành vi phạm pháp luật/tội phạm (Mặt khách quan, Mặt chủ quan, Khách thể và Chủ thể). Cá nhân vi phạm phải chịu trách nhiệm pháp lý tương ứng ${crime}${citeStr}.`;
  }

  // 5. Nếu là hợp đồng / giao dịch dân sự
  if (sample.intent_code === 'CIVIL_CONTRACT' || /hợp đồng|đặt cọc|vay|mua bán/i.test(q)) {
    const isVoHieu = /vô hiệu/i.test(sec3Clean);
    const status = isVoHieu ? 'vô hiệu (toàn phần hoặc từng phần)' : 'có hiệu lực pháp lý ràng buộc các bên';
    return `Giao dịch/hợp đồng trong tình huống được xác định là **${status}**. Các bên có nghĩa vụ thực hiện đúng quyền và nghĩa vụ hoặc khôi phục lại tình trạng ban đầu, hoàn trả cho nhau những gì đã nhận theo quy định của Bộ luật Dân sự 2015.`;
  }

  // 6. Trường hợp chung: Trích xuất đoạn phán quyết ở cuối Mục 3 nếu có
  const paragraphs = sec3Clean.split(/\n\s*\n/).filter((p) => p.trim().length > 20);
  if (paragraphs.length >= 2) {
    const lastP = paragraphs[paragraphs.length - 1].trim();
    if (!lastP.startsWith('#') && !lastP.toLowerCase().includes('căn cứ các phân tích chi tiết')) {
      return lastP;
    }
  }

  return 'Từ những căn cứ pháp lý và phân tích cụ thể nêu trên, vấn đề pháp lý đặt ra trong tình huống đã được giải quyết trực diện, xác định rõ quyền, nghĩa vụ và trách nhiệm pháp lý của các bên liên quan.';
}

function upgradeDataset() {
  console.log('[*] 1. Nạp sft_vietlaw_master.json...');
  const data = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
  console.log(`[*] Tổng số mẫu: ${data.length}`);

  // Bước 1: Tạo bản đồ khôi phục input từ parent seeds
  const parentInputMap = new Map();
  for (const s of data) {
    if (s.input && s.input.trim().length > 10) {
      parentInputMap.set(s.sample_id, s.input.trim());
    }
  }

  let restoredInputCount = 0;
  let updatedOutlineCount = 0;
  let directConclusionCount = 0;
  let updatedMessagesCount = 0;

  const upgraded = [];

  for (let i = 0; i < data.length; i++) {
    const s = { ...data[i] };

    // 1. Khôi phục input nếu bị trống từ parent seed
    if (!s.input || !s.input.trim()) {
      const parentKey = s.sample_id.replace(/(?:_NAT_\d+)+$/, '');
      if (parentInputMap.has(parentKey)) {
        s.input = parentInputMap.get(parentKey);
        restoredInputCount++;
      } else {
        // Thử tìm parent bỏ _SUB...
        const baseKey = s.sample_id.split('_NAT_')[0];
        if (parentInputMap.has(baseKey)) {
          s.input = parentInputMap.get(baseKey);
          restoredInputCount++;
        }
      }
    }

    // Xử lý riêng cho mẫu SFT_VPPL_011_NAT_1 và các biến thể Hưng - Phố
    if (s.sample_id.startsWith('SFT_VPPL_011')) {
      s.input = 'Tình huống: Trưa ngày 26/12/2015 tại nhà của vợ chồng Hưng (Hà Nội), nhằm ngăn chặn hành vi đánh vợ mình (chị Hà) của Phố, Hưng đã dùng dao đâm một nhát vào ngực của Phố làm Phố tử vong ngay sau đó. Biết Hưng đã đủ tuổi chịu trách nhiệm hình sự và có năng lực hành vi bình thường. Hãy phân tích cấu thành tội phạm của hành vi trên.';
    }

    // 2. Tinh chỉnh cấu trúc Output: Outline-first & Căn cứ đầy đủ & Kết luận trực tiếp
    let out = s.output || '';
    if (out.includes('### 1. Tóm tắt vấn đề pháp lý') && out.includes('### 2. Căn cứ pháp lý') && out.includes('### 3. Phân tích chi tiết từng ý')) {
      // Phân rã 4 phần
      const parts = out.split(/###\s*[1-4]\.\s*/);
      // parts[0] là trước ### 1
      // parts[1] là Tóm tắt
      // parts[2] là Căn cứ
      // parts[3] là Phân tích
      // parts[4] là Kết luận
      if (parts.length >= 5) {
        let sec1 = parts[1].trim();
        let sec2 = parts[2].trim();
        let sec3 = parts[3].trim();
        let sec4 = parts[4].trim();

        // 2.1 Quét Mục 3 để bổ sung các điều luật còn thiếu vào Mục 2
        const articlesInSec3 = extractArticlesFromSection3(sec3);
        const sec2Citations = [];
        const existingLines = sec2.split('\n').filter((l) => l.trim().length > 0);

        for (const l of existingLines) {
          sec2Citations.push(l.trim());
        }

        let addedArt = false;
        for (const a of articlesInSec3) {
          const matchPattern = new RegExp(`Điều\\s+${a.artNum}\\b`, 'i');
          const alreadyInSec2 = existingLines.some((l) => matchPattern.test(l));
          if (!alreadyInSec2 && a.artNum && a.artNum.length <= 4) {
            sec2Citations.push(`- **${a.citation}**`);
            addedArt = true;
          }
        }
        if (addedArt) updatedOutlineCount++;

        const newSec2 = sec2Citations.join('\n');

        // 2.2 Sửa lại phần 4 Kết luận trực tiếp nếu đang là câu chung chung
        if (sec4.toLowerCase().includes('căn cứ các phân tích chi tiết và đối chiếu') || sec4.toLowerCase().includes('đã được giải quyết đầy đủ, rõ ràng')) {
          sec4 = synthesizeDirectConclusion(s, sec3, articlesInSec3);
          directConclusionCount++;
        }

        // Tái tạo lại output
        out = `### 1. ${sec1}\n\n### 2. ${newSec2}\n\n### 3. ${sec3}\n\n### 4. Kết luận\n${sec4}`;
        s.output = out;
      }
    }

    // 3. Chuẩn hóa thẻ <system_instruction> và <user_query> trong messages
    const queryBlock = s.input && s.input.trim() && s.input.trim() !== s.instruction.trim()
      ? `${s.instruction.trim()}\n\n${s.input.trim()}`
      : s.instruction.trim();

    if (s.messages && Array.isArray(s.messages) && s.messages.length >= 5) {
      // Giữ hội thoại đa lượt nhưng cập nhật system prompt chuẩn
      s.messages[0] = { role: 'system', content: SYSTEM_INSTRUCTION_OUTLINE_FIRST };
      s.messages[s.messages.length - 1].content = s.output;
    } else {
      s.messages = [
        { role: 'system', content: SYSTEM_INSTRUCTION_OUTLINE_FIRST },
        {
          role: 'user',
          content: `<context>\n${(s.context || '').trim()}\n</context>\n\n<user_query>\n${queryBlock}\n</user_query>`
        },
        {
          role: 'assistant',
          content: s.output.trim()
        }
      ];
    }
    updatedMessagesCount++;

    upgraded.push(s);
  }

  console.log('[*] Kết quả nâng cấp chất lượng Dataset:');
  console.log(`  - Khôi phục dữ kiện tình huống vào input & <user_query>: ${restoredInputCount} mẫu`);
  console.log(`  - Đồng bộ điều luật Mục 2 & Mục 3 (Outline-first): ${updatedOutlineCount} mẫu`);
  console.log(`  - Thay thế kết luận chung chung bằng kết luận trực tiếp: ${directConclusionCount} mẫu`);
  console.log(`  - Chuẩn hóa <system_instruction> & <user_query> vào messages: ${updatedMessagesCount} mẫu`);

  // Ghi lại sft_vietlaw_master.json
  fs.writeFileSync(MASTER_PATH, JSON.stringify(upgraded, null, 2), 'utf8');
  console.log(`[✔] Đã lưu thành công bộ dữ liệu nâng cấp vào: ${MASTER_PATH}`);
}

upgradeDataset();
