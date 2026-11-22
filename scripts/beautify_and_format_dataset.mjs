import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const MASTER_PATH = path.join(ROOT, 'data/processed/sft_vietlaw_master.json');

export function cleanOcr(text) {
  if (!text || typeof text !== 'string') return '';
  let res = text;

  // 1. Chữ 'đ' hoặc 'Đ' bị tách rời bởi khoảng trắng hoặc dấu xuống dòng (ví dụ: 'Đ\n\niều', 'đ\n\nịnh', 'đ ược')
  res = res.replace(/\b([đĐ])\s*\n+\s*(iều|ịnh|ược|ồng|ất|ăng|oạn|ứng|ạo|ội|ạt|iểm|ường|i trí|ối|ối tác|ầu|ạo đức|áp ứng|ơn)/gi, (m, d, rest) => {
    return (d === 'Đ' ? 'Đ' : 'đ') + rest;
  });

  res = res.replace(/(^|[\s(])([đĐ])\s+(iều|ược|ịnh|ồng|ất|ạo|ội|ạt|iểm|ăng|ứng|oạn|ường|ối|ầu|ơn)(?=$|[\s.,;:?!)\"“”/])/g, (m, prefix, d, rest) => {
    return prefix + (d === 'Đ' ? 'Đ' : 'đ') + rest;
  });

  // 2. Chữ 'đ' bị dính vào từ đứng trước do lỗi OCR (ví dụ: quânđ ội -> quân đội, hợpđ ồng -> hợp đồng)
  const shiftedDRe = /([a-zA-Zà-ỹÀ-Ỹ])([đĐ])\s+(iều|ược|ịnh|ồng|ất|ạo|ội|ạt|iểm|ăng|ứng|oạn|ường|ối|ầu|ơn|ến|ọ|ộc|ịch|ảng|áng|ảo|ảm|áp|ập|ậm|ệ|ệch|ộ|ụ|ực)/gi;
  res = res.replace(shiftedDRe, '$1 $2$3');

  // Các từ ghép dính chữ đ cụ thể
  res = res
    .replace(/\bquânđ\s*ội\b/gi, 'quân đội')
    .replace(/\bhợpđ\s*ồng\b/gi, 'hợp đồng')
    .replace(/\blaođ\s*ộng\b/gi, 'lao động')
    .replace(/\bquyếtđ\s*ịnh\b/gi, 'quyết định')
    .replace(/\bliênđ\s*ới\b/gi, 'liên đới')
    .replace(/\bxâmđ\s*oạt\b/gi, 'xâm đoạt')
    .replace(/\bđoạtđ\s*ược\b/gi, 'đoạt được')
    .replace(/\bchủđ\s*ạo\b/gi, 'chủ đạo')
    .replace(/\bthựcđ\s*ịnh\b/gi, 'thực định')
    .replace(/\btácđ\s*ộng\b/gi, 'tác động')
    .replace(/\bcộngđ\s*ồng\b/gi, 'cộng đồng')
    .replace(/\bchếđ\s*ộ\b/gi, 'chế độ');

  // 3. Thiếu phụ âm đầu do scan OCR
  res = res
    .replace(/(^|\s)hân\s+biệt(?=$|[\s.,;:?!])/gi, '$1phân biệt')
    .replace(/(^|\s)iải\s+thích(?=$|[\s.,;:?!])/gi, '$1giải thích')
    .replace(/(^|\s)ỏ\s+qua(?=$|[\s.,;:?!])/gi, '$1bỏ qua');

  // 4. Khử trailing backslashes và khoảng trắng trước dấu câu
  res = res
    .replace(/\\+$/gm, '')
    .replace(/\s+([,.:;?!])/g, '$1')
    .replace(/([(\[])\s+/g, '$1')
    .replace(/\s+([)\]])/g, '$1');

  return res;
}

export function expandAbbreviations(text) {
  if (!text || typeof text !== 'string') return '';
  let res = text;

  const wbL = '(?:^|[\\s.,;:?!"\'“”()\\[\\]\\-–—_/\\\\])';
  const wbR = '(?=$|[\\s.,;:?!"\'“”()\\[\\]\\-–—_/\\\\])';

  // 1. Viết tắt điều/khoản: K1, K2, Đ12,...
  res = res.replace(new RegExp(`(${wbL})K(\\d+)${wbR}`, 'g'), '$1Khoản $2');
  res = res.replace(new RegExp(`(${wbL})k(\\d+)${wbR}`, 'g'), '$1khoản $2');
  res = res.replace(new RegExp(`(${wbL})Đ(\\d+)${wbR}`, 'g'), '$1Điều $2');
  res = res.replace(new RegExp(`(${wbL})đ(\\d+)${wbR}`, 'g'), '$1điều $2');

  // 2. Viết tắt cơ quan, tổ chức, chức danh
  const orgPairs = [
    ['CSGT', 'Cảnh sát giao thông'],
    ['csgt', 'cảnh sát giao thông'],
    ['UBND', 'Ủy ban nhân dân'],
    ['ubnd', 'ủy ban nhân dân'],
    ['HĐND', 'Hội đồng nhân dân'],
    ['hđnd', 'hội đồng nhân dân'],
    ['VKSND', 'Viện kiểm sát nhân dân'],
    ['vksnd', 'viện kiểm sát nhân dân'],
    ['TAND', 'Tòa án nhân dân'],
    ['tand', 'tòa án nhân dân'],
    ['BGD&ĐT', 'Bộ Giáo dục và Đào tạo'],
    ['bgd&đt', 'Bộ Giáo dục và Đào tạo'],
    ['BGDĐT', 'Bộ Giáo dục và Đào tạo']
  ];
  for (const [abbr, exp] of orgPairs) {
    res = res.replace(new RegExp(`(${wbL})${abbr}${wbR}`, 'g'), `$1${exp}`);
  }

  // 3. Viết tắt tên các Bộ luật chính: BLHS -> Bộ luật Hình sự, BLDS -> Bộ luật Dân sự, BLLĐ -> Bộ luật Lao động
  res = res
    .replace(/(?<!Bộ\s+luật\s+Hình\s+sự(?:\s+\d{4})?\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])BLHS(?=$|[\s.,;:?!)\"“”/])/g, (m) => m.replace('BLHS', 'Bộ luật Hình sự'))
    .replace(/(?<!Bộ\s+luật\s+Dân\s+sự(?:\s+\d{4})?\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])BLDS(?=$|[\s.,;:?!)\"“”/])/g, (m) => m.replace('BLDS', 'Bộ luật Dân sự'))
    .replace(/(?<!Bộ\s+luật\s+Lao\s+động(?:\s+\d{4})?\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])BLLĐ(?=$|[\s.,;:?!)\"“”/])/g, (m) => m.replace('BLLĐ', 'Bộ luật Lao động'));

  // 4. Viết tắt thuật ngữ chuyên ngành môn Pháp luật Đại cương (tránh thay thế lồng kép)
  const termPairs = [
    [/(?<!Quy\s+phạm\s+pháp\s+luật\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])QPPL(?=$|[\s.,;:?!)\"“”/])/g, ' quy phạm pháp luật'],
    [/(?<!Quan\s+hệ\s+pháp\s+luật\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])QHPL(?=$|[\s.,;:?!)\"“”/])/g, ' quan hệ pháp luật'],
    [/(?<!Văn\s+bản\s+quy\s+phạm\s+pháp\s+luật\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])VBQPPL(?=$|[\s.,;:?!)\"“”/])/g, ' văn bản quy phạm pháp luật'],
    [/(?<!Vi\s+phạm\s+pháp\s+luật\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])VPPL(?=$|[\s.,;:?!)\"“”/])/g, ' vi phạm pháp luật'],
    [/(?<!Trách\s+nhiệm\s+hình\s+sự\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])TNHS(?=$|[\s.,;:?!)\"“”/])/g, ' trách nhiệm hình sự'],
    [/(?<!Trách\s+nhiệm\s+dân\s+sự\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])TNDS(?=$|[\s.,;:?!)\"“”/])/g, ' trách nhiệm dân sự'],
    [/(?<!Trách\s+nhiệm\s+hành\s+chính\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])TNHC(?=$|[\s.,;:?!)\"“”/])/g, ' trách nhiệm hành chính'],
    [/(?<!Trách\s+nhiệm\s+kỷ\s+luật\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])TNKL(?=$|[\s.,;:?!)\"“”/])/g, ' trách nhiệm kỷ luật'],
    [/(?<!Trách\s+nhiệm\s+pháp\s+lý\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])TNPL(?=$|[\s.,;:?!)\"“”/])/g, ' trách nhiệm pháp lý'],
    [/(?<!Vi\s+phạm\s+hành\s+chính\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])VPHC(?=$|[\s.,;:?!)\"“”/])/g, ' vi phạm hành chính'],
    [/(?<!Phòng\s+vệ\s+chính\s+đáng\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])PVCĐ(?=$|[\s.,;:?!)\"“”/])/g, ' phòng vệ chính đáng'],
    [/(?<!Phòng\s+vệ\s+chính\s+đáng\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])PVCD(?=$|[\s.,;:?!)\"“”/])/g, ' phòng vệ chính đáng'],
    [/(?<!Tình\s+thế\s+cấp\s+thiết\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])TTCT(?=$|[\s.,;:?!)\"“”/])/g, ' tình thế cấp thiết'],
    [/(?<!Sự\s+kiện\s+pháp\s+lý\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])SKPL(?=$|[\s.,;:?!)\"“”/])/g, ' sự kiện pháp lý'],
    [/(?<!Giao\s+dịch\s+dân\s+sự\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])GDDS(?=$|[\s.,;:?!)\"“”/])/g, ' giao dịch dân sự'],
    [/(?<!Bồi\s+thường\s+thiệt\s+hại\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])BTTH(?=$|[\s.,;:?!)\"“”/])/g, ' bồi thường thiệt hại'],
    [/(?<!Hợp\s+đồng\s+lao\s+động\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])HĐLĐ(?=$|[\s.,;:?!)\"“”/])/g, ' hợp đồng lao động'],
    [/(?<!Hợp\s+đồng\s+dân\s+sự\s*(?:\([^)]*\)\s*)?)(?:^|[\s(])HĐDS(?=$|[\s.,;:?!)\"“”/])/g, ' hợp đồng dân sự']
  ];

  for (const [rx, exp] of termPairs) {
    res = res.replace(rx, (m) => {
      const isStart = /^\s/.test(m);
      return (isStart ? ' ' : '') + exp.trim();
    });
  }

  // Viết thường
  const lowerPairs = [
    ['qppl', 'quy phạm pháp luật'],
    ['qhpl', 'quan hệ pháp luật'],
    ['vbqppl', 'văn bản quy phạm pháp luật'],
    ['vppl', 'vi phạm pháp luật'],
    ['tnhs', 'trách nhiệm hình sự'],
    ['tnds', 'trách nhiệm dân sự'],
    ['tnhc', 'trách nhiệm hành chính'],
    ['tnkl', 'trách nhiệm kỷ luật'],
    ['tnpl', 'trách nhiệm pháp lý'],
    ['vphc', 'vi phạm hành chính'],
    ['pvcđ', 'phòng vệ chính đáng'],
    ['pvcd', 'phòng vệ chính đáng'],
    ['ttct', 'tình thế cấp thiết'],
    ['skpl', 'sự kiện pháp lý'],
    ['gdds', 'giao dịch dân sự'],
    ['btth', 'bồi thường thiệt hại'],
    ['hđlđ', 'hợp đồng lao động'],
    ['hđds', 'hợp đồng dân sự'],
    ['plđc', 'pháp luật đại cương'],
    ['pldc', 'pháp luật đại cương'],
    ['bmnn', 'bộ máy nhà nước'],
    ['htpl', 'hệ thống pháp luật'],
    ['qlnn', 'quản lý nhà nước'],
    ['pctnh', 'phòng, chống tham nhũng'],
    ['xhcn', 'xã hội chủ nghĩa']
  ];
  for (const [abbr, exp] of lowerPairs) {
    res = res.replace(new RegExp(`(${wbL})${abbr}${wbR}`, 'g'), `$1${exp}`);
  }

  res = res.replace(/[^\S\r\n]{2,}/g, ' ');

  return res;
}

// Trích xuất các căn cứ pháp lý sạch
function extractCitationsClean(text, context) {
  const combined = (text || '') + '\n' + (context || '');
  const rx = /(?:Khoản\s+\d+\s+)?Điều\s+\d+\s+(?:Bộ\s+luật\s+(?:Dân\s+sự|Hình\s+sự|Lao\s+động|Tố\s+tụng\s+[^\n,.;()*:"“”]+)(?:\s+năm)?(?:\s+\d{4})?|Luật\s+[^\n,.;()*:"“”]+?(?:\s+năm\s+\d{4}|\s+\d{4})|Hiến\s+pháp(?:\s+nước\s+CHXHCN\s+Việt\s+Nam)?(?:\s+năm)?(?:\s+\d{4})?|Nghị\s+định\s+\d+\/\d{4}\/NĐ-CP)/gi;
  const matches = [];
  let m;
  while ((m = rx.exec(combined)) !== null) {
    const c = m[0].trim();
    if (!matches.includes(c) && matches.length < 5) {
      matches.push(c);
    }
  }
  return matches;
}

export function beautifyOutput(sample) {
  let output = expandAbbreviations(cleanOcr(sample.output || ''));
  const instruction = expandAbbreviations(cleanOcr(sample.instruction || ''));
  const context = expandAbbreviations(cleanOcr(sample.context || ''));
  const group = sample.taxonomy_group || '';
  const intent = sample.intent_code || '';

  // 1. Kiểm tra xem output đã có đủ 4 phần chuẩn chưa
  const hasSec1 = /###\s*(?:1\.|I\.)\s*Tóm tắt vấn đề/i.test(output);
  const hasSec2 = /###\s*(?:2\.|II\.)\s*Căn cứ pháp lý/i.test(output);
  const hasSec3 = /###\s*(?:3\.|III\.)\s*Phân tích/i.test(output);
  const hasSec4 = /###\s*(?:4\.|IV\.)\s*Kết luận/i.test(output);

  if (hasSec1 && hasSec2 && hasSec3 && hasSec4) {
    return output;
  }

  // 2. Không ép form 4 phần đối với các câu có format riêng theo yêu cầu đề bài:
  // - Từ chối out-of-scope / gài bẫy ngoài phạm vi
  // - Yêu cầu tóm tắt bằng gạch đầu dòng (ví dụ: '3 gạch đầu dòng')
  // - Yêu cầu chỉ lập bảng so sánh cấp 2
  // - Khai thác khoáng sản trên Mặt Trăng
  if (
    intent === 'OUT_OF_SCOPE' ||
    group === 'G08_ADVERSARIAL_OOS' ||
    instruction.includes('3 gạch đầu dòng') ||
    instruction.includes('học sinh cấp 2') ||
    instruction.includes('Mặt Trăng')
  ) {
    return output;
  }

  // 3. Trích xuất căn cứ pháp lý
  const citations = extractCitationsClean(output, context);
  const lawListStr =
    citations.length > 0
      ? citations.map((c) => `- **${c}**`).join('\n')
      : `- Quy định tại các văn bản quy phạm pháp luật thực định và Giáo trình Pháp luật đại cương (Bộ GD&ĐT).`;

  const issueSummary = instruction.length > 180 ? instruction.slice(0, 177) + '...' : instruction;

  // Trường hợp A: Nhận định Đúng/Sai
  if (group === 'G04_TRUE_FALSE' || group === 'G12_VERIFICATION_YESNO' || intent === 'TRUE_FALSE') {
    let conclusionVal = 'ĐÚNG';
    if (/\bSAI\b/i.test(output) && !/\bĐÚNG\b/i.test(output.slice(0, 100))) {
      conclusionVal = 'SAI';
    }

    return `### 1. Tóm tắt vấn đề pháp lý & Nhận định
Xem xét tính đúng/sai của nhận định: "${issueSummary}"
-> **KẾT LUẬN SƠ BỘ: NHẬN ĐỊNH TRÊN LÀ ${conclusionVal}.**

### 2. Căn cứ pháp lý (nêu rõ Tên luật, Điều, Khoản)
${lawListStr}

### 3. Phân tích chi tiết từng ý
${output}

### 4. Kết luận
Nhận định trong đề bài là **${conclusionVal}**. Cần đối chiếu đúng căn cứ pháp lý và cơ sở lý luận đã phân tích để làm sáng tỏ bản chất vấn đề.`;
  }

  // Trường hợp B: Tình huống / Bài tập / Phân tích vụ việc / Thừa kế / Vi phạm pháp luật
  if (
    group === 'G05_SCENARIO_NARRATIVE' ||
    group === 'G07_AMBIGUOUS_UNDERSPECIFIED' ||
    intent === 'CASE_ANALYSIS' ||
    intent === 'CIVIL_INHERIT' ||
    intent === 'VPPL_4_ELEMENTS' ||
    intent === 'CIVIL_CONTRACT' ||
    intent === 'FAMILY_LAW'
  ) {
    return `### 1. Tóm tắt vấn đề pháp lý
Tình huống đặt ra yêu cầu giải quyết vấn đề pháp lý trọng tâm: ${issueSummary}

### 2. Căn cứ pháp lý (nêu rõ Tên luật, Điều, Khoản)
${lawListStr}

### 3. Phân tích chi tiết từng ý
${output}

### 4. Kết luận
Căn cứ các phân tích chi tiết và đối chiếu điều luật thực định nêu trên, hành vi và các quan hệ pháp luật trong tình huống đã được giải quyết đầy đủ, rõ ràng theo đúng quy định pháp luật hiện hành.`;
  }

  // Trường hợp C: So sánh & Phân biệt
  if (group === 'G02_COMPARATIVE' || intent === 'COMPARISON') {
    return `### 1. Tóm tắt vấn đề pháp lý & Phạm vi đối chiếu
Yêu cầu đối chiếu, phân biệt giữa các đối tượng pháp lý: "${issueSummary}"

### 2. Căn cứ pháp lý (nêu rõ Tên luật, Điều, Khoản)
${lawListStr}

### 3. Phân tích chi tiết từng ý (Bảng so sánh đối chiếu)
${output}

### 4. Kết luận
Việc phân biệt rõ ràng các khái niệm/chế định pháp lý nêu trên giúp xác định đúng tính chất quan hệ pháp luật, quyền, nghĩa vụ và áp dụng chính xác chế tài pháp lý.`;
  }

  // Trường hợp D: Khái niệm / Bản chất / Lý luận chung / Thủ tục
  return `### 1. Tóm tắt vấn đề pháp lý & Khái niệm
Vấn đề lý luận pháp lý cần làm rõ: "${issueSummary}"

### 2. Căn cứ pháp lý & Giáo trình
${lawListStr}

### 3. Phân tích chi tiết từng ý
${output}

### 4. Kết luận
Nội dung phân tích nêu trên phản ánh đầy đủ bản chất, đặc trưng pháp lý cơ bản của đối tượng nghiên cứu theo chuẩn Barem môn học và quy định pháp luật thực định.`;
}

async function main() {
  console.log('[*] Đang đọc sft_vietlaw_master.json...');
  const data = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
  console.log(`[*] Tổng số mẫu: ${data.length}`);

  let ocrFixed = 0;
  let abbrExpanded = 0;
  let beautifiedCount = 0;

  const sysPrompt = `<system_instruction>\nBạn là trợ lý Pháp luật đại cương (Giảng viên Pháp lý Bộ GD&ĐT). Chỉ sử dụng thông tin trong thẻ <context> và lịch sử hội thoại để trả lời chính xác, giữ đúng vai trò chủ thể và các con số của người dùng.\n</system_instruction>`;

  const processed = [];
  for (let i = 0; i < data.length; i++) {
    const item = data[i];

    const rawInst = item.instruction || '';
    const rawInput = item.input || '';
    const rawCtx = item.context || '';
    const rawOut = item.output || '';

    // 1. Sửa lỗi OCR
    const cInst = cleanOcr(rawInst);
    const cInput = cleanOcr(rawInput);
    const cCtx = cleanOcr(rawCtx);
    const cOut = cleanOcr(rawOut);

    if (cInst !== rawInst || cInput !== rawInput || cCtx !== rawCtx || cOut !== rawOut) {
      ocrFixed++;
    }

    // 2. Mở rộng từ viết tắt
    const expInst = expandAbbreviations(cInst);
    const expInput = expandAbbreviations(cInput);
    const expCtx = expandAbbreviations(cCtx);
    const expOut = expandAbbreviations(cOut);

    if (expInst !== cInst || expInput !== cInput || expCtx !== cCtx || expOut !== cOut) {
      abbrExpanded++;
    }

    // 3. Làm đẹp & Chuẩn hóa Form 4 Phần
    const beautifiedOut = beautifyOutput({
      ...item,
      instruction: expInst,
      input: expInput,
      context: expCtx,
      output: expOut
    });

    if (beautifiedOut !== rawOut) {
      beautifiedCount++;
    }

    // 4. Chuẩn hóa messages
    let messages = [];
    if (item.messages && Array.isArray(item.messages) && item.messages.length >= 5) {
      // Giữ hội thoại đa lượt nhưng làm sạch OCR và từ viết tắt
      messages = item.messages.map((m) => ({
        role: m.role,
        content: expandAbbreviations(cleanOcr(m.content))
      }));
    } else {
      let queryText = expInst.trim();
      if (expInput && expInput.trim() && expInput.trim() !== queryText) {
        queryText = `${queryText}\n${expInput.trim()}`;
      }
      messages = [
        { role: 'system', content: sysPrompt },
        {
          role: 'user',
          content: `<context>\n${expCtx.trim()}\n</context>\n\n<user_query>\n${queryText}\n</user_query>`
        },
        { role: 'assistant', content: beautifiedOut.trim() }
      ];
    }

    processed.push({
      ...item,
      instruction: expInst,
      input: expInput,
      context: expCtx,
      output: beautifiedOut,
      messages
    });
  }

  console.log(`[*] Thống kê xử lý:`);
  console.log(`  - Số mẫu được sửa lỗi OCR: ${ocrFixed}`);
  console.log(`  - Số mẫu được mở rộng từ viết tắt: ${abbrExpanded}`);
  console.log(`  - Số mẫu được làm đẹp & chuẩn hóa Form 4 phần: ${beautifiedCount}`);

  // Lưu backup
  const bakPath = MASTER_PATH + '.pre_beautify.bak';
  fs.copyFileSync(MASTER_PATH, bakPath);
  console.log(`[*] Đã tạo bản backup tại: ${bakPath}`);

  // Ghi đè master.json
  fs.writeFileSync(MASTER_PATH, JSON.stringify(processed, null, 2), 'utf8');
  console.log(`[✔] Đã lưu dữ liệu làm đẹp vào ${MASTER_PATH}`);
}

main();
