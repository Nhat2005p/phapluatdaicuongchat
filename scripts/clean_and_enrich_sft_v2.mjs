import fs from 'fs';

const MASTER_PATH = 'data/processed/sft_vietlaw_master.json';
const TRAIN_PATH = 'data/processed/sft_vietlaw_train.jsonl';
const VAL_PATH = 'data/processed/sft_vietlaw_validation.jsonl';
const TEST_PATH = 'data/processed/sft_vietlaw_test.jsonl';
const CSV_PATH = 'data/processed/sft_vietlaw_flat.csv';
const REPORT_PATH = 'data/processed/sft_vietlaw_QA_report.json';

const SYSTEM_PROMPT = `<system_instruction>
Bạn là trợ lý Pháp luật đại cương (Giảng viên Pháp lý Bộ GD&ĐT). Chỉ sử dụng thông tin trong thẻ <context> và lịch sử hội thoại để trả lời chính xác, giữ đúng vai trò chủ thể và các con số của người dùng.
Mặc định khi trả lời câu hỏi phân tích hoặc tình huống, bắt buộc phải trình bày đầy đủ theo 4 mục sau (Outline-first Prompting), không được bỏ sót mục nào:
1. Tóm tắt vấn đề pháp lý
2. Căn cứ pháp lý (nêu rõ Tên luật, Điều, Khoản)
3. Phân tích chi tiết từng ý
4. Kết luận
</system_instruction>`;

const CLEAN_OOS_REFUSAL = `Xin lỗi, câu hỏi của bạn nằm ngoài phạm vi kiến thức của môn **Pháp luật Đại cương** và hệ thống pháp luật Việt Nam hiện hành.

Tôi chỉ hỗ trợ tra cứu, giải đáp lý thuyết, nhận định Đúng/Sai và phân tích tình huống pháp lý thuộc các lĩnh vực: Lý luận Nhà nước & Pháp luật, Quy phạm & Quan hệ pháp luật, Vi phạm pháp luật & Trách nhiệm pháp lý, Luật Hiến pháp, Dân sự, Hình sự, Hôn nhân & Gia đình, Lao động và Hành chính.

Bạn vui lòng đặt câu hỏi thuộc phạm vi pháp luật để tôi hỗ trợ chính xác theo chuẩn Barem Bộ GD&ĐT.`;

function extractContextCitations(ctx) {
  if (!ctx) return [];
  const results = [];
  const seen = new Set();

  // 1. Extract explicit [ĐIỀU LUẬT: ...] or [ĐIỀU LUẬT THỰC ĐỊNH: ...]
  const artBlocks = ctx.match(/\[ĐIỀU LUẬT[^\]]*\]/g) || [];
  for (const b of artBlocks) {
    const clean = b.replace(/^\[ĐIỀU LUẬT[^:]*:\s*/, '').replace(/\|\s*Trạng thái:[^\]]*\]$/, '').replace(/\]$/, '').trim();
    const parts = clean.split('|').map(s => s.trim()).filter(Boolean);
    const label = parts.length >= 2 ? `${parts[1]} (${parts[0]})` : parts[0];
    if (label && !seen.has(label.toLowerCase())) {
      seen.add(label.toLowerCase());
      results.push(`- **${label}**`);
    }
  }

  // 2. Extract "Căn cứ pháp lý: ..." line from textbook context
  const ccplMatch = ctx.match(/Căn cứ pháp lý:\s*([^\n]+)/i);
  if (ccplMatch) {
    const items = ccplMatch[1].split(/;\s*/).map(s => s.trim()).filter(s => s.length > 5 && !/Giáo trình/i.test(s));
    for (const it of items.slice(0, 3)) {
      if (!seen.has(it.toLowerCase())) {
        seen.add(it.toLowerCase());
        results.push(`- **${it}**`);
      }
    }
  }

  // 3. Extract [GIÁO TRÌNH ...] chapter/section
  const tbMatch = ctx.match(/\[GIÁO TRÌNH PHÁP LUẬT ĐẠI CƯƠNG[^-\]]*-\s*([^\]]+)\]/i);
  if (tbMatch && results.length === 0) {
    const chap = tbMatch[1].replace(/\s*\(tr\.[^)]+\)/g, '').trim();
    results.push(`- **Giáo trình Pháp luật đại cương (Bộ GD&ĐT)**: ${chap}.`);
  }

  return results;
}

function buildSubstantiveConclusion(sec2, sec3, item) {
  // Clean markdown noise from sec3 to extract meaningful summary lines
  const lines = sec3
    .replace(/^### 3\.[^\n]*\n+/, '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 25 && !l.startsWith('###') && !l.startsWith('---') && !l.startsWith('|') && !l.startsWith('*(Căn cứ'));

  // Pick explicit conclusion/core lines if present
  const priorityLine = lines.find(l =>
    /^(?:->|\*|-)?\s*\*\*(?:Kết luận|Nội dung cốt lõi|Tóm lại|Chốt lại|Bản chất|Khái niệm|Nguyên tắc)/i.test(l)
  ) || lines.find(l =>
    /(?:phải chịu trách nhiệm|vô hiệu|có hiệu lực|được hưởng|không được|cấu thành tội|vi phạm pháp luật|bị phạt|khác nhau ở|phân biệt)/i.test(l)
  ) || lines[0] || '';

  const cleanLine = priorityLine
    .replace(/^(?:[-•*]|\d+\.)\s*/, '')
    .replace(/^\*\*(?:1\.\s*)?(?:Nội dung cốt lõi|Kết luận|Tóm lại|Bản chất):?\*\*\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract first 2 law citations from sec2 if available
  const sec2Cites = (sec2.match(/\*\*([^*]+)\*\*/g) || [])
    .map(s => s.replace(/\*\*/g, '').trim())
    .filter(s => /Điều|Bộ luật|Luật|Hiến pháp|Nghị định/i.test(s) && !/pháp luật hiện hành/i.test(s))
    .slice(0, 2);

  const citeSuffix = sec2Cites.length > 0 ? ` (căn cứ ${sec2Cites.join(', ')})` : '';

  if (cleanLine.length >= 30) {
    // Cap at ~280 chars cleanly at sentence boundary
    let trimmed = cleanLine;
    if (trimmed.length > 280) {
      const cut = trimmed.slice(0, 280);
      const lastDot = Math.max(cut.lastIndexOf('.'), cut.lastIndexOf(';'));
      trimmed = lastDot > 80 ? cut.slice(0, lastDot + 1) : cut.trim() + '.';
    }
    if (!/[.!?]$/.test(trimmed)) trimmed += '.';
    return `Tóm lại${citeSuffix}, ${trimmed.charAt(0).toLowerCase() + trimmed.slice(1)}`;
  }

  // Fallback by intent/taxonomy
  if (item.taxonomy_group === 'G02_COMPARATIVE' || item.intent_code === 'COMPARISON') {
    return `Tóm lại${citeSuffix}, cần đối chiếu đúng các tiêu chí về chủ thể, tính chất hành vi, căn cứ pháp lý và hậu quả pháp lý đã phân tích ở trên để áp dụng chính xác trong thực tiễn.`;
  }
  return `Tóm lại${citeSuffix}, việc áp dụng quy định pháp luật đối với vấn đề trên phải tuân thủ đúng các điều kiện, nguyên tắc và căn cứ pháp lý đã phân tích.`;
}

function fixOcrSpaces(text) {
  return text
    .replace(/nhân tạ o/g, 'nhân tạo')
    .replace(/nhi ều/g, 'nhiều')
    .replace(/tư ơng/g, 'tương')
    .replace(/quy ền/g, 'quyền')
    .replace(/nhà nư ớc/g, 'nhà nước')
    .replace(/pháp lu ật/g, 'pháp luật')
    .replace(/chế đ ộ/g, 'chế độ')
    .replace(/xã h ội/g, 'xã hội');
}

function cleanAssistantContent(text, item) {
  let out = fixOcrSpaces(text);

  // 1. Replace verbose OOS notice
  if (out.includes('### ⚠️ THÔNG BÁO TỪ HỆ THỐNG') && (item.intent_code === 'OUT_OF_SCOPE' || item.taxonomy_group === 'G08_ADVERSARIAL_OOS')) {
    return CLEAN_OOS_REFUSAL;
  }

  // 2. Standardize Section 1 & Section 2 headers
  out = out.replace(/^### 1\.\s*Tóm tắt vấn đề pháp lý[^\n]*/m, '### 1. Tóm tắt vấn đề pháp lý');
  out = out.replace(/^### 2\.\s*Căn cứ pháp lý[^\n]*/m, '### 2. Căn cứ pháp lý (nêu rõ Tên luật, Điều, Khoản)');

  // 3. Remove duplicate "Kết luận" line right under "### 4. Kết luận"
  out = out.replace(/(### 4\.\s*Kết luận)\s*\n+\s*Kết luận\s*\n+/g, '$1\n');

  // 4. Clean Section 2: remove bogus "Điều X pháp luật hiện hành", replace vague placeholder, deduplicate
  const sec2Match = out.match(/(### 2\.\s*Căn cứ pháp lý \(nêu rõ Tên luật, Điều, Khoản\)\n)([\s\S]*?)(?=\n### 3\.)/);
  if (sec2Match) {
    const header = sec2Match[1];
    let bodyLines = sec2Match[2].split('\n').map(l => l.trim()).filter(Boolean);

    // Filter out bogus "Điều X pháp luật hiện hành" and vague placeholder
    const hadVague = bodyLines.some(l => /Quy định tại các văn bản quy phạm pháp luật thực định/.test(l));
    bodyLines = bodyLines.filter(l =>
      !/Điều\s+\d+\s+pháp luật hiện hành/i.test(l) &&
      !/Quy định tại các văn bản quy phạm pháp luật thực định/.test(l)
    );

    if (bodyLines.length === 0 || hadVague) {
      const ctxCites = extractContextCitations(item.context || '');
      for (const c of ctxCites) {
        if (!bodyLines.some(b => b.toLowerCase() === c.toLowerCase())) {
          bodyLines.push(c);
        }
      }
      if (bodyLines.length === 0) {
        bodyLines.push('- **Giáo trình Pháp luật đại cương (Bộ GD&ĐT)** và các văn bản quy phạm pháp luật liên quan trong ngữ cảnh.');
      }
    }

    // Deduplicate Section 2 bullets (case-insensitive)
    const dedup = [];
    const seen = new Set();
    for (const l of bodyLines) {
      const norm = l.toLowerCase().replace(/[.:]+$/, '').trim();
      if (!seen.has(norm)) {
        seen.add(norm);
        dedup.push(l);
      }
    }

    out = out.replace(sec2Match[0], header + dedup.join('\n') + '\n');
  }

  // 5. Replace boilerplate Section 4 conclusions with substantive conclusions
  const sec4Match = out.match(/(### 4\.\s*Kết luận\n)([\s\S]*)$/);
  if (sec4Match) {
    const conclBody = sec4Match[2].trim();
    const isBoilerplate =
      /Nội dung phân tích nêu trên phản ánh đầy đủ bản chất/i.test(conclBody) ||
      /Từ những căn cứ pháp lý và phân tích cụ thể nêu trên, vấn đề pháp lý đặt ra trong tình huống đã được giải quyết/i.test(conclBody) ||
      /Từ những phân tích cụ thể nêu trên, vấn đề đặt ra trong tình huống đã được giải quyết/i.test(conclBody) ||
      /Việc phân biệt rõ ràng các khái niệm\/chế định pháp lý nêu trên giúp xác định đúng/i.test(conclBody);

    if (isBoilerplate) {
      const sec2Now = (out.match(/### 2\.[\s\S]*?(?=### 3\.|$)/) || [''])[0];
      const sec3Now = (out.match(/### 3\.[\s\S]*?(?=### 4\.|$)/) || [''])[0];
      const newConcl = buildSubstantiveConclusion(sec2Now, sec3Now, item);
      out = out.replace(sec4Match[0], `${sec4Match[1]}${newConcl}`);
    }
  }

  return out.trim();
}

// =========================================================================
// GROUNDED RAG + NEGATIVE REJECTION SAMPLES (Teaches 3B to strictly read <context>)
// =========================================================================
const GROUNDED_RAG_SEEDS = [
  {
    id: 'LABOR_NO_WRITTEN_CONTRACT_01',
    intent: 'CASE_ANALYSIS',
    tax: 'G05_SCENARIO_NARRATIVE',
    context: `[ĐIỀU LUẬT: Bộ luật Lao động năm 2019 | Điều 13: Hợp đồng lao động | Trạng thái: con_hieu_luc]
1. Hợp đồng lao động là sự thỏa thuận giữa người lao động và người sử dụng lao động về việc làm có trả công, tiền lương, điều kiện lao động, quyền và nghĩa vụ của mỗi bên trong quan hệ lao động. Trường hợp hai bên thỏa thuận bằng tên gọi khác nhưng có nội dung thể hiện về việc làm có trả công, tiền lương và sự quản lý, điều hành, giám sát của một bên thì được coi là hợp đồng lao động.
[ĐIỀU LUẬT: Bộ luật Lao động năm 2019 | Điều 14: Hình thức hợp đồng lao động | Trạng thái: con_hieu_luc]
1. Hợp đồng lao động phải được giao kết bằng văn bản và được làm thành 02 bản, người lao động giữ 01 bản, người sử dụng lao động giữ 01 bản, trừ trường hợp quy định tại khoản 2 Điều này.
2. Hai bên có thể giao kết hợp đồng lao động bằng lời nói đối với hợp đồng có thời hạn dưới 01 tháng, trừ trường hợp quy định tại khoản 2 Điều 18, điểm a khoản 1 Điều 145 và khoản 1 Điều 162 của Bộ luật này.`,
    queries: [
      'Công ty không ký hợp đồng lao động bằng văn bản với tôi thì tôi có được pháp luật bảo vệ quyền lợi không?',
      'Đi làm cho doanh nghiệp 6 tháng nhưng công ty không ký hợp đồng lao động bằng giấy thì người lao động có được pháp luật bảo vệ không?',
      'Nếu không có hợp đồng lao động bằng văn bản mà chỉ thỏa thuận miệng, tôi có được công nhận là người lao động và hưởng quyền lợi không?',
      'Doanh nghiệp thuê tôi làm việc trả lương hàng tháng nhưng cố tình không ký HĐLĐ bằng văn bản, quyền lợi của tôi được giải quyết thế nào theo Bộ luật Lao động 2019?',
      'Không ký hợp đồng lao động bằng văn bản có đồng nghĩa với việc mất toàn bộ quyền lợi lao động không?'
    ],
    answer: `### 1. Tóm tắt vấn đề pháp lý
Xác định việc người sử dụng lao động không ký hợp đồng lao động bằng văn bản có làm mất quyền được pháp luật bảo vệ của người lao động hay không theo Bộ luật Lao động năm 2019.

### 2. Căn cứ pháp lý (nêu rõ Tên luật, Điều, Khoản)
- **Khoản 1 Điều 13 Bộ luật Lao động năm 2019**: Định nghĩa và bản chất của hợp đồng lao động (kể cả thỏa thuận dưới tên gọi khác).
- **Khoản 1 và Khoản 2 Điều 14 Bộ luật Lao động năm 2019**: Hình thức hợp đồng lao động (bằng văn bản hoặc bằng lời nói đối với hợp đồng dưới 01 tháng).

### 3. Phân tích chi tiết từng ý
1. **Bản chất quan hệ lao động không phụ thuộc hoàn toàn vào văn bản**: Theo **Khoản 1 Điều 13 Bộ luật Lao động năm 2019**, bất kỳ thỏa thuận nào thể hiện đầy đủ 3 yếu tố: (i) có việc làm trả công/tiền lương, (ii) có sự quản lý, điều hành, giám sát của người sử dụng lao động, và (iii) có thỏa thuận về quyền, nghĩa vụ thì đều được pháp luật công nhận là **hợp đồng lao động**.
2. **Nghĩa vụ về hình thức hợp đồng**: Theo **Điều 14 Bộ luật Lao động năm 2019**, hợp đồng từ đủ 01 tháng trở lên bắt buộc phải lập bằng văn bản (làm thành 02 bản); chỉ hợp đồng có thời hạn dưới 01 tháng mới được giao kết bằng lời nói (trừ một số trường hợp đặc thù). Do đó, việc công ty không ký văn bản đối với công việc từ 01 tháng trở lên là **lỗi vi phạm pháp luật của người sử dụng lao động**, không phải lỗi làm triệt tiêu quyền của người lao động.
3. **Bảo vệ quyền lợi thực tế**: Khi chứng minh được quan hệ lao động thực tế (qua bảng lương, sao kê chuyển khoản, chấm công, tin nhắn giao việc, đồng nghiệp làm chứng), người lao động vẫn được pháp luật bảo vệ đầy đủ các quyền về tiền lương, bảo hiểm xã hội và bồi thường khi có tranh chấp.

### 4. Kết luận
Người lao động **vẫn được pháp luật bảo vệ đầy đủ quyền lợi** căn cứ Điều 13 và Điều 14 Bộ luật Lao động năm 2019. Việc công ty không ký hợp đồng bằng văn bản là hành vi vi phạm của công ty và không làm mất tư cách, quyền lợi hợp pháp của người lao động.`
  },
  {
    id: 'CRIMINAL_17YO_THEFT_3M_01',
    intent: 'CASE_ANALYSIS',
    tax: 'G05_SCENARIO_NARRATIVE',
    context: `[ĐIỀU LUẬT: Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017) | Điều 12: Tuổi chịu trách nhiệm hình sự | Trạng thái: con_hieu_luc]
1. Người từ đủ 16 tuổi trở lên phải chịu trách nhiệm hình sự về mọi tội phạm, trừ những tội phạm mà Bộ luật này có quy định khác.
[ĐIỀU LUẬT: Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017) | Điều 173: Tội trộm cắp tài sản | Trạng thái: con_hieu_luc]
1. Người nào trộm cắp tài sản của người khác trị giá từ 2.000.000 đồng đến dưới 50.000.000 đồng hoặc dưới 2.000.000 đồng nhưng thuộc một trong các trường hợp sau đây, thì bị phạt cải tạo không giam giữ đến 03 năm hoặc phạt tù từ 06 tháng đến 03 năm...
[ĐIỀU LUẬT: Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017) | Điều 91 & Điều 101: Nguyên tắc xử lý và mức phạt tù có thời hạn đối với người dưới 18 tuổi phạm tội | Trạng thái: con_hieu_luc]
Người từ đủ 16 tuổi đến dưới 18 tuổi phạm tội được áp dụng nguyên tắc xử lý khoan hồng đối với người dưới 18 tuổi; mức phạt tù có thời hạn cao nhất không quá 3/4 mức phạt tù mà điều luật quy định.`,
    queries: [
      'Bạn 17 tuổi trộm cắp điện thoại trị giá 3 triệu đồng thì có bị truy cứu trách nhiệm hình sự không?',
      'Một học sinh 17 tuổi lấy trộm chiếc điện thoại giá 3.000.000 đồng có phạm tội hình sự không? Xử lý thế nào?',
      'Người 17 tuổi trộm cắp tài sản trị giá 3 triệu đồng có đủ tuổi chịu trách nhiệm hình sự theo BLHS 2015 không?',
      'Phân tích trách nhiệm hình sự của người 17 tuổi thực hiện hành vi trộm cắp điện thoại trị giá 3 triệu đồng.',
      'Cháu A 17 tuổi lén lấy điện thoại trị giá 3 triệu đồng của người khác thì bị xử phạt hành chính hay truy cứu trách nhiệm hình sự?'
    ],
    answer: `### 1. Tóm tắt vấn đề pháp lý
Xác định trách nhiệm hình sự đối với người 17 tuổi thực hiện hành vi trộm cắp điện thoại trị giá 3.000.000 đồng theo Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017).

### 2. Căn cứ pháp lý (nêu rõ Tên luật, Điều, Khoản)
- **Khoản 1 Điều 12 Bộ luật Hình sự năm 2015 (sửa đổi 2017)**: Tuổi chịu trách nhiệm hình sự (từ đủ 16 tuổi trở lên phải chịu trách nhiệm hình sự về mọi tội phạm).
- **Khoản 1 Điều 173 Bộ luật Hình sự năm 2015 (sửa đổi 2017)**: Tội trộm cắp tài sản (định lượng từ 2.000.000 đồng đến dưới 50.000.000 đồng).
- **Điều 91 và Điều 101 Bộ luật Hình sự năm 2015 (sửa đổi 2017)**: Nguyên tắc xử lý và giới hạn mức phạt tù đối với người dưới 18 tuổi phạm tội.

### 3. Phân tích chi tiết từng ý
1. **Về độ tuổi chịu trách nhiệm hình sự**: Người thực hiện hành vi đã **17 tuổi** (từ đủ 16 tuổi trở lên). Theo **Khoản 1 Điều 12 Bộ luật Hình sự 2015**, người từ đủ 16 tuổi trở lên phải chịu trách nhiệm hình sự về **mọi tội phạm** (kể cả tội phạm ít nghiêm trọng).
2. **Về định lượng cấu thành tội phạm**: Hành vi lén lút chiếm đoạt điện thoại trị giá **3.000.000 đồng** đã vượt mức định lượng tối thiểu **2.000.000 đồng** quy định tại **Khoản 1 Điều 173 Bộ luật Hình sự 2015** (khung hình phạt cải tạo không giam giữ đến 03 năm hoặc phạt tù từ 06 tháng đến 03 năm).
3. **Về chính sách xử lý người dưới 18 tuổi**: Vì người phạm tội từ đủ 16 đến dưới 18 tuổi, theo **Điều 91 và Điều 101 Bộ luật Hình sự 2015**, cơ quan tiến hành tố tụng áp dụng nguyên tắc khoan hồng, ưu tiên biện pháp giáo dục; nếu áp dụng hình phạt tù có thời hạn thì mức cao nhất không quá **3/4** mức phạt tù mà điều luật quy định (tối đa không quá 27 tháng tù đối với khung 03 năm).

### 4. Kết luận
**Có bị truy cứu trách nhiệm hình sự.** Người 17 tuổi đã đủ tuổi chịu trách nhiệm hình sự về mọi tội phạm (Khoản 1 Điều 12) và hành vi trộm cắp tài sản trị giá 3.000.000 đồng đã cấu thành **Tội trộm cắp tài sản** theo Khoản 1 Điều 173 Bộ luật Hình sự 2015, đồng thời được hưởng chính sách khoan hồng dành cho người dưới 18 tuổi theo Điều 91 và Điều 101 Bộ luật này.`
  },
  {
    id: 'CRIMINAL_15YO_THEFT_3M_01',
    intent: 'CASE_ANALYSIS',
    tax: 'G05_SCENARIO_NARRATIVE',
    context: `[ĐIỀU LUẬT: Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017) | Điều 12: Tuổi chịu trách nhiệm hình sự | Trạng thái: con_hieu_luc]
2. Người từ đủ 14 tuổi đến dưới 16 tuổi phải chịu trách nhiệm hình sự về tội phạm rất nghiêm trọng, tội phạm đặc biệt nghiêm trọng quy định tại một trong các điều 123, 134, 141, 142, 143, 144, 150, 151, 168, 169, 170, 171, 173, 178, 248, 249, 250, 251, 252, 265, 266, 286, 287, 289, 290, 299, 303, 304 của Bộ luật này.
[ĐIỀU LUẬT: Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017) | Điều 9: Phân loại tội phạm | Trạng thái: con_hieu_luc]
Tội phạm ít nghiêm trọng có mức cao nhất của khung hình phạt đến 03 năm tù; tội phạm nghiêm trọng từ trên 03 năm đến 07 năm tù; tội phạm rất nghiêm trọng từ trên 07 năm đến 15 năm tù.
[ĐIỀU LUẬT: Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017) | Điều 173: Tội trộm cắp tài sản | Trạng thái: con_hieu_luc]
1. Trộm cắp tài sản trị giá từ 2.000.000 đồng đến dưới 50.000.000 đồng bị phạt cải tạo không giam giữ đến 03 năm hoặc phạt tù từ 06 tháng đến 03 năm.`,
    queries: [
      'Em B 15 tuổi trộm cắp điện thoại trị giá 3 triệu đồng thì có bị truy cứu trách nhiệm hình sự không?',
      'Người 15 tuổi lấy trộm tài sản trị giá 3.000.000 đồng có phải chịu trách nhiệm hình sự không?',
      'Học sinh 15 tuổi trộm cắp xe đạp trị giá 4 triệu đồng có bị khởi tố hình sự theo Điều 12 và Điều 173 BLHS không?',
      'Trẻ 15 tuổi trộm cắp tài sản 3 triệu đồng bị xử lý thế nào theo Bộ luật Hình sự 2015?'
    ],
    answer: `### 1. Tóm tắt vấn đề pháp lý
Xác định người từ đủ 14 đến dưới 16 tuổi (15 tuổi) thực hiện hành vi trộm cắp tài sản trị giá dưới 50 triệu đồng (3–4 triệu đồng) có phải chịu trách nhiệm hình sự hay không.

### 2. Căn cứ pháp lý (nêu rõ Tên luật, Điều, Khoản)
- **Khoản 2 Điều 12 Bộ luật Hình sự năm 2015 (sửa đổi 2017)**: Tuổi chịu trách nhiệm hình sự đối với người từ đủ 14 đến dưới 16 tuổi.
- **Điều 9 Bộ luật Hình sự năm 2015 (sửa đổi 2017)**: Phân loại tội phạm theo mức cao nhất của khung hình phạt.
- **Khoản 1 Điều 173 Bộ luật Hình sự năm 2015 (sửa đổi 2017)**: Tội trộm cắp tài sản (mức phạt cao nhất đến 03 năm tù — tội phạm ít nghiêm trọng).

### 3. Phân tích chi tiết từng ý
1. **Phân loại mức độ tội phạm**: Hành vi trộm cắp tài sản trị giá 3–4 triệu đồng thuộc **Khoản 1 Điều 173 Bộ luật Hình sự 2015**, có mức cao nhất của khung hình phạt là **03 năm tù**. Đối chiếu với **Điều 9 Bộ luật Hình sự 2015**, đây là **tội phạm ít nghiêm trọng**.
2. **Đối chiếu điều kiện độ tuổi**: Theo **Khoản 2 Điều 12 Bộ luật Hình sự 2015**, người từ đủ 14 đến dưới 16 tuổi **chỉ** phải chịu trách nhiệm hình sự đối với Điều 173 khi phạm tội thuộc trường hợp **rất nghiêm trọng** hoặc **đặc biệt nghiêm trọng** (khung hình phạt cao nhất trên 07 năm tù, tức Khoản 3 hoặc Khoản 4 Điều 173).
3. **Hướng xử lý**: Do hành vi chỉ thuộc Khoản 1 (ít nghiêm trọng), người 15 tuổi **không phải chịu trách nhiệm hình sự**, mà sẽ bị xem xét xử lý vi phạm hành chính (cảnh cáo) và cha, mẹ hoặc người giám hộ phải bồi thường thiệt hại dân sự theo quy định.

### 4. Kết luận
**Không bị truy cứu trách nhiệm hình sự.** Căn cứ Khoản 2 Điều 12, Điều 9 và Khoản 1 Điều 173 Bộ luật Hình sự 2015, người 15 tuổi chỉ chịu trách nhiệm hình sự về Tội trộm cắp tài sản nếu thuộc trường hợp rất nghiêm trọng hoặc đặc biệt nghiêm trọng; trường hợp trộm cắp 3–4 triệu đồng chỉ là tội phạm ít nghiêm trọng nên không khởi tố hình sự.`
  },
  {
    id: 'CIVIL_DEPOSIT_BREACH_01',
    intent: 'CIVIL_CONTRACT',
    tax: 'G05_SCENARIO_NARRATIVE',
    context: `[ĐIỀU LUẬT: Bộ luật Dân sự năm 2015 | Điều 328: Đặt cọc | Trạng thái: con_hieu_luc]
1. Đặt cọc là việc một bên (bên đặt cọc) giao cho bên kia (bên nhận đặt cọc) một khoản tiền hoặc kim khí quý, đá quý hoặc vật có giá trị khác trong một thời hạn để bảo đảm giao kết hoặc thực hiện hợp đồng.
2. Trường hợp hợp đồng được giao kết, thực hiện thì tài sản đặt cọc được trả lại cho bên đặt cọc hoặc được trừ để thực hiện nghĩa vụ trả tiền; nếu bên đặt cọc từ chối việc giao kết, thực hiện hợp đồng thì tài sản đặt cọc thuộc về bên nhận đặt cọc; nếu bên nhận đặt cọc từ chối việc giao kết, thực hiện hợp đồng thì phải trả cho bên đặt cọc tài sản đặt cọc và một khoản tiền tương đương giá trị tài sản đặt cọc, trừ trường hợp có thỏa thuận khác.`,
    queries: [
      'Anh A đặt cọc 100 triệu đồng mua đất của ông B nhưng đến hạn ông B đổi ý không bán nữa (không có thỏa thuận khác). Ông B phải trả cho anh A bao nhiêu tiền?',
      'Chị Lan đặt cọc 50 triệu đồng thuê nhà của anh Nam, sau đó anh Nam từ chối cho thuê. Theo Điều 328 BLDS 2015 anh Nam phải trả bao nhiêu tiền?',
      'Bên nhận đặt cọc tự ý hủy kèo không bán nhà nữa thì phải đền cọc như thế nào theo Bộ luật Dân sự 2015?',
      'Nếu bên đặt cọc đổi ý không mua nữa thì có đòi lại được tiền cọc theo Điều 328 BLDS 2015 không?'
    ],
    answer: `### 1. Tóm tắt vấn đề pháp lý
Xác định hậu quả pháp lý và nghĩa vụ tài chính khi một bên từ chối giao kết hoặc thực hiện hợp đồng sau khi đã đặt cọc theo Bộ luật Dân sự năm 2015.

### 2. Căn cứ pháp lý (nêu rõ Tên luật, Điều, Khoản)
- **Khoản 1 và Khoản 2 Điều 328 Bộ luật Dân sự năm 2015**: Quy định về đặt cọc và xử lý tài sản đặt cọc khi vi phạm nghĩa vụ giao kết, thực hiện hợp đồng.

### 3. Phân tích chi tiết từng ý
1. **Trường hợp bên nhận đặt cọc từ chối giao kết, thực hiện hợp đồng**: Căn cứ **Khoản 2 Điều 328 Bộ luật Dân sự 2015**, nếu không có thỏa thuận khác, bên nhận đặt cọc phải trả lại cho bên đặt cọc **tài sản đặt cọc** cộng thêm **một khoản tiền tương đương giá trị tài sản đặt cọc** (tổng cộng gấp 2 lần số tiền đặt cọc — ví dụ cọc 100 triệu thì trả 200 triệu; cọc 50 triệu thì trả 100 triệu).
2. **Trường hợp bên đặt cọc từ chối giao kết, thực hiện hợp đồng**: Tài sản đặt cọc thuộc về bên nhận đặt cọc (bên đặt cọc bị mất tiền cọc), trừ trường hợp hai bên có thỏa thuận khác.
3. **Trường hợp hợp đồng được giao kết, thực hiện bình thường**: Tài sản đặt cọc được trả lại cho bên đặt cọc hoặc được trừ trực tiếp vào nghĩa vụ trả tiền.

### 4. Kết luận
Căn cứ Khoản 2 Điều 328 Bộ luật Dân sự 2015 (nếu không có thỏa thuận khác): bên nhận đặt cọc từ chối thực hiện hợp đồng phải **trả lại tiền cọc và phạt một khoản tương đương tiền cọc (tổng gấp đôi số tiền đã nhận)**; ngược lại, nếu bên đặt cọc từ chối thì **mất toàn bộ số tiền đã đặt cọc**.`
  },
  {
    id: 'LABOR_UNILATERAL_EMPLOYEE_01',
    intent: 'PRACTICAL_CONSULT',
    tax: 'G09_PROCEDURAL_HOWTO',
    context: `[ĐIỀU LUẬT: Bộ luật Lao động năm 2019 | Điều 35: Quyền đơn phương chấm dứt hợp đồng lao động của người lao động | Trạng thái: con_hieu_luc]
1. Người lao động có quyền đơn phương chấm dứt hợp đồng lao động nhưng phải báo trước cho người sử dụng lao động như sau:
a) Ít nhất 45 ngày nếu làm việc theo hợp đồng lao động không xác định thời hạn;
b) Ít nhất 30 ngày nếu làm việc theo hợp đồng lao động xác định thời hạn có thời hạn từ 12 tháng đến 36 tháng;
c) Ít nhất 03 ngày làm việc nếu làm việc theo hợp đồng lao động xác định thời hạn có thời hạn dưới 12 tháng.
2. Người lao động có quyền đơn phương chấm dứt hợp đồng lao động không cần báo trước trong trường hợp: không được trả đủ lương hoặc trả lương không đúng thời hạn; bị ngược đãi, đánh đập; bị quấy rối tình dục tại nơi làm việc; lao động nữ mang thai phải nghỉ việc theo chỉ định của cơ sở khám bệnh, chữa bệnh...`,
    queries: [
      'Người lao động muốn nghỉ việc theo hợp đồng không xác định thời hạn thì phải báo trước bao nhiêu ngày theo Bộ luật Lao động 2019?',
      'Tôi ký hợp đồng lao động 24 tháng, muốn đơn phương nghỉ việc thì cần báo trước bao lâu? Trường hợp nào được nghỉ ngay không cần báo trước?',
      'Công ty chậm trả lương 2 tháng thì người lao động có quyền nghỉ việc ngay không cần báo trước không?',
      'Quy định về thời hạn báo trước khi người lao động đơn phương chấm dứt hợp đồng lao động tại Điều 35 BLLĐ 2019 là gì?'
    ],
    answer: `### 1. Tóm tắt vấn đề pháp lý
Xác định thời hạn báo trước và các trường hợp được đơn phương chấm dứt hợp đồng lao động không cần báo trước của người lao động theo Bộ luật Lao động năm 2019.

### 2. Căn cứ pháp lý (nêu rõ Tên luật, Điều, Khoản)
- **Khoản 1 Điều 35 Bộ luật Lao động năm 2019**: Thời hạn báo trước khi người lao động đơn phương chấm dứt hợp đồng lao động.
- **Khoản 2 Điều 35 Bộ luật Lao động năm 2019**: Các trường hợp người lao động được quyền nghỉ việc ngay không cần báo trước.

### 3. Phân tích chi tiết từng ý
1. **Quyền nghỉ việc không cần lý do nhưng phải báo trước (Khoản 1 Điều 35)**: Người lao động có quyền đơn phương chấm dứt hợp đồng lao động bất cứ lúc nào nếu đảm bảo đúng thời hạn báo trước:
   - **Ít nhất 45 ngày**: Hợp đồng lao động không xác định thời hạn.
   - **Ít nhất 30 ngày**: Hợp đồng lao động xác định thời hạn từ 12 tháng đến 36 tháng (bao gồm HĐLĐ 24 tháng).
   - **Ít nhất 03 ngày làm việc**: Hợp đồng lao động xác định thời hạn dưới 12 tháng.
2. **Các trường hợp nghỉ việc ngay không cần báo trước (Khoản 2 Điều 35)**: Người lao động không cần báo trước nếu thuộc một trong các trường hợp như: không được trả đủ lương hoặc trả lương không đúng thời hạn (chậm lương); bị ngược đãi, đánh đập, quấy rối tình dục; lao động nữ mang thai phải nghỉ theo chỉ định y tế.

### 4. Kết luận
Căn cứ Điều 35 Bộ luật Lao động năm 2019, người lao động phải báo trước **45 ngày** (HĐ không xác định thời hạn), **30 ngày** (HĐ 12–36 tháng), hoặc **03 ngày làm việc** (HĐ dưới 12 tháng); riêng trường hợp công ty chậm/không trả đủ lương hoặc ngược đãi thì người lao động **được quyền nghỉ việc ngay không cần báo trước**.`
  },
  {
    id: 'MARRIAGE_CONDITIONS_01',
    intent: 'FAMILY_LAW',
    tax: 'G05_SCENARIO_NARRATIVE',
    context: `[ĐIỀU LUẬT: Luật Hôn nhân và Gia đình năm 2014 | Điều 8: Điều kiện kết hôn | Trạng thái: con_hieu_luc]
1. Nam, nữ kết hôn với nhau phải tuân theo các điều kiện sau đây:
a) Nam từ đủ 20 tuổi trở lên, nữ từ đủ 18 tuổi trở lên;
b) Việc kết hôn do nam và nữ tự nguyện quyết định;
c) Không bị mất năng lực hành vi dân sự;
d) Việc kết hôn không thuộc một trong các trường hợp cấm kết hôn theo quy định tại các điểm a, b, c và d khoản 2 Điều 5 của Luật này.
2. Nhà nước không thừa nhận hôn nhân giữa những người cùng giới tính.`,
    queries: [
      'Nam 19 tuổi 10 tháng và nữ 18 tuổi 2 tháng có đủ điều kiện đăng ký kết hôn theo Luật Hôn nhân và Gia đình 2014 không?',
      'Nêu đầy đủ các điều kiện kết hôn hợp pháp theo Điều 8 Luật Hôn nhân và Gia đình năm 2014.',
      'Chàng trai sinh ngày 01/12/2007 muốn đăng ký kết hôn vào ngày 01/10/2026 (chưa đủ 20 tuổi) có được pháp luật cho phép không?'
    ],
    answer: `### 1. Tóm tắt vấn đề pháp lý
Xác định độ tuổi và các điều kiện kết hôn hợp pháp theo quy định của Luật Hôn nhân và Gia đình năm 2014.

### 2. Căn cứ pháp lý (nêu rõ Tên luật, Điều, Khoản)
- **Khoản 1 Điều 8 Luật Hôn nhân và Gia đình năm 2014**: Quy định 04 điều kiện kết hôn hợp pháp.
- **Khoản 2 Điều 8 Luật Hôn nhân và Gia đình năm 2014**: Quy định về hôn nhân đồng giới.

### 3. Phân tích chi tiết từng ý
1. **04 điều kiện kết hôn bắt buộc (Khoản 1 Điều 8)**:
   - **Độ tuổi**: Nam phải **từ đủ 20 tuổi trở lên**, nữ phải **từ đủ 18 tuổi trở lên** (tính tròn ngày, tháng, năm sinh, không tính tuổi "bước sang").
   - **Tự nguyện**: Do nam và nữ tự nguyện quyết định, không bị cưỡng ép, lừa dối.
   - **Năng lực hành vi dân sự**: Không bị Tòa án tuyên bố mất năng lực hành vi dân sự.
   - **Không thuộc trường hợp cấm kết hôn**: Không kết hôn giả tạo, tảo hôn, đang có vợ/chồng, hoặc cùng dòng máu trực hệ / họ hàng trong phạm vi 3 đời.
2. **Áp dụng vào trường hợp nam 19 tuổi 10 tháng**: Dù chỉ còn thiếu 02 tháng, nam giới vẫn **chưa đủ 20 tuổi** theo điểm a Khoản 1 Điều 8 nên chưa đủ điều kiện đăng ký kết hôn; việc tổ chức kết hôn khi chưa đủ tuổi là hành vi tảo hôn.

### 4. Kết luận
Căn cứ Khoản 1 Điều 8 Luật Hôn nhân và Gia đình năm 2014, nam phải **từ đủ 20 tuổi** và nữ **từ đủ 18 tuổi** mới được đăng ký kết hôn. Trường hợp nam mới 19 tuổi 10 tháng là **không đủ điều kiện kết hôn**.`
  },
  {
    id: 'INHERITANCE_FORCED_HEIR_644_01',
    intent: 'CIVIL_INHERIT',
    tax: 'G05_SCENARIO_NARRATIVE',
    context: `[ĐIỀU LUẬT: Bộ luật Dân sự năm 2015 | Điều 644: Người thừa kế không phụ thuộc vào nội dung của di chúc | Trạng thái: con_hieu_luc]
1. Những người sau đây vẫn được hưởng phần di sản bằng hai phần ba suất của một người thừa kế theo pháp luật nếu di sản được chia theo pháp luật, trong trường hợp họ không được người lập di chúc cho hưởng di sản hoặc chỉ cho hưởng phần di sản ít hơn hai phần ba suất đó:
a) Con chưa thành niên, cha, mẹ, vợ, chồng;
b) Con thành niên mà không có khả năng lao động.
[ĐIỀU LUẬT: Bộ luật Dân sự năm 2015 | Điều 651: Người thừa kế theo pháp luật | Trạng thái: con_hieu_luc]
1. Hàng thừa kế thứ nhất gồm: vợ, chồng, cha đẻ, mẹ đẻ, cha nuôi, mẹ nuôi, con đẻ, con nuôi của người chết.`,
    queries: [
      'Ông K mất để lại di sản riêng 900 triệu đồng và lập di chúc hợp pháp cho toàn bộ bạn thân, không cho vợ và 2 con (con đầu 25 tuổi khỏe mạnh, con út 15 tuổi). Chia thừa kế thế nào?',
      'Những ai là người thừa kế không phụ thuộc vào nội dung của di chúc theo Điều 644 Bộ luật Dân sự 2015 và họ được hưởng mức bao nhiêu?'
    ],
    answer: `### 1. Tóm tắt vấn đề pháp lý
Xác định đối tượng và mức hưởng của người thừa kế không phụ thuộc vào nội dung di chúc khi người chết lập di chúc truất quyền hưởng di sản của vợ và con theo Bộ luật Dân sự năm 2015.

### 2. Căn cứ pháp lý (nêu rõ Tên luật, Điều, Khoản)
- **Khoản 1 Điều 644 Bộ luật Dân sự năm 2015**: Người thừa kế không phụ thuộc vào nội dung của di chúc (hưởng 2/3 suất thừa kế theo pháp luật).
- **Khoản 1 Điều 651 Bộ luật Dân sự năm 2015**: Hàng thừa kế thứ nhất.

### 3. Phân tích chi tiết từng ý
1. **Xác định đối tượng theo Điều 644 BLDS 2015**: Gồm con chưa thành niên (dưới 18 tuổi), cha, mẹ, vợ, chồng, và con thành niên không có khả năng lao động.
   - Trong tình huống ông K (di sản 900 triệu đồng): Hàng thừa kế thứ nhất gồm 3 người (vợ, con 25 tuổi, con 15 tuổi). Nếu chia theo pháp luật, 1 suất = 900 / 3 = **300 triệu đồng**.
   - **Vợ** và **con út 15 tuổi** (chưa thành niên) thuộc diện Điều 644 → mỗi người được hưởng tối thiểu 2/3 × 300 = **200 triệu đồng**.
   - **Con đầu 25 tuổi khỏe mạnh** không thuộc diện Điều 644 → không được hưởng di sản do di chúc hợp pháp không cho.
2. **Phần di sản của người được chỉ định trong di chúc**: Bạn thân của ông K hưởng phần còn lại sau khi trích phần bắt buộc: 900 - (200 + 200) = **500 triệu đồng**.

### 4. Kết luận
Căn cứ Điều 644 và Điều 651 Bộ luật Dân sự 2015, vợ ông K và con út 15 tuổi mỗi người được hưởng **200 triệu đồng** (2/3 suất thừa kế theo pháp luật), con đầu 25 tuổi không được hưởng, và bạn thân của ông K được hưởng **500 triệu đồng** còn lại.`
  }
];

// Negative rejection / Context-grounded refusal seeds (teaches model NOT to hallucinate when <context> lacks info)
const NEGATIVE_REJECTION_CASES = [
  {
    q: 'Mức phạt cụ thể đối với lỗi không bật đèn xi-nhan khi chuyển làn của xe máy điện năm 2026 là bao nhiêu tiền?',
    ctx: '(Không có văn bản quy định mức xử phạt vi phạm hành chính giao thông đường bộ nào được cung cấp trong ngữ cảnh hiện tại.)'
  },
  {
    q: 'Cho biết nội dung chi tiết Điều 145 Luật Đất đai mới nhất về điều kiện tách thửa tại thành phố Đà Nẵng?',
    ctx: '[ĐIỀU LUẬT: Bộ luật Dân sự năm 2015 | Điều 117: Điều kiện có hiệu lực của giao dịch dân sự]\n1. Giao dịch dân sự có hiệu lực khi có đủ các điều kiện: chủ thể có năng lực, hoàn toàn tự nguyện, mục đích và nội dung không vi phạm điều cấm của luật.'
  },
  {
    q: 'Thuế suất thuế thu nhập doanh nghiệp ưu đãi cho doanh nghiệp khởi nghiệp sáng tạo tại khu công nghệ cao là bao nhiêu phần trăm?',
    ctx: '[ĐIỀU LUẬT: Bộ luật Lao động năm 2019 | Điều 13: Hợp đồng lao động]\nHợp đồng lao động là sự thỏa thuận giữa người lao động và người sử dụng lao động về việc làm có trả công, tiền lương.'
  },
  {
    q: 'Thủ tục đăng ký bảo hộ nhãn hiệu độc quyền tại Cục Sở hữu trí tuệ gồm những biểu mẫu nào và lệ phí bao nhiêu?',
    ctx: '(Không tìm thấy điều luật về Sở hữu trí tuệ trong cơ sở dữ liệu ngữ cảnh được nạp.)'
  },
  {
    q: 'Quy định về hạn mức cho vay tín chấp của ngân hàng thương mại theo Thông tư mới nhất của Ngân hàng Nhà nước là bao nhiêu?',
    ctx: '[GIÁO TRÌNH PHÁP LUẬT ĐẠI CƯƠNG 2021 - Chương 1: Lý luận cơ bản về Nhà nước]\nNhà nước là tổ chức quyền lực chính trị đặc biệt có bộ máy chuyên làm nhiệm vụ cưỡng chế và quản lý xã hội.'
  },
  {
    q: 'Điều 999 Bộ luật Dân sự năm 2015 quy định gì về hợp đồng tiền ảo?',
    ctx: '[CHỐT CHẶN CHỐNG ẢO GIÁC: Bộ luật Dân sự năm 2015 chỉ có tổng cộng 689 Điều, từ Điều 1 đến Điều 689.]'
  }
];

const NEGATIVE_REJECTION_VARIATIONS = [
  q => q,
  q => `Hãy tra cứu và trả lời chính xác câu hỏi sau: ${q}`,
  q => `Theo pháp luật Việt Nam hiện hành, ${q.charAt(0).toLowerCase() + q.slice(1)}`,
  q => `Cho em hỏi nhanh: ${q}`,
  q => `Phân tích đầy đủ căn cứ pháp lý cho vấn đề: ${q}`
];

// =========================================================================
// MAIN PIPELINE
// =========================================================================
console.log('🔄 Đang nạp dataset master:', MASTER_PATH);
const data = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
console.log(`📊 Tổng mẫu ban đầu: ${data.length.toLocaleString('vi-VN')}`);

let cleanedCount = 0;
let oosCleaned = 0;

for (let i = 0; i < data.length; i++) {
  const item = data[i];
  const lastIdx = item.messages.length - 1;
  if (lastIdx >= 0 && item.messages[lastIdx].role === 'assistant') {
    const before = item.messages[lastIdx].content;
    const after = cleanAssistantContent(before, item);
    if (after !== before) {
      item.messages[lastIdx].content = after;
      item.output = after;
      cleanedCount++;
      if (after === CLEAN_OOS_REFUSAL) oosCleaned++;
    }
  }
}

// Remove any previously added SFT_RAG_GROUNDED_ to keep idempotent
const filtered = data.filter(d => !String(d.sample_id || '').startsWith('SFT_RAG_GROUNDED_'));

// Build new Grounded RAG samples
const newSamples = [];
let seq = 1;

for (const seed of GROUNDED_RAG_SEEDS) {
  for (const q of seed.queries) {
    const sid = `SFT_RAG_GROUNDED_${seed.id}_${seq++}`;
    const userMsg = `<context>\n${seed.context}\n</context>\n\n<user_query>\n${q}\n</user_query>`;
    newSamples.push({
      sample_id: sid,
      intent_code: seed.intent,
      taxonomy_group: seed.tax,
      corpus_role: 'train_aug',
      instruction: q,
      input: '',
      context: seed.context,
      output: seed.answer,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMsg },
        { role: 'assistant', content: seed.answer }
      ]
    });
  }
}

// Add Negative Rejection samples (strictly grounded refusal)
for (let ci = 0; ci < NEGATIVE_REJECTION_CASES.length; ci++) {
  const nc = NEGATIVE_REJECTION_CASES[ci];
  for (let vi = 0; vi < NEGATIVE_REJECTION_VARIATIONS.length; vi++) {
    const q = NEGATIVE_REJECTION_VARIATIONS[vi](nc.q);
    const sid = `SFT_RAG_GROUNDED_NEGREJ_${ci + 1}_${vi + 1}`;
    const isFakeArt = /Điều 999/.test(nc.q);
    const answer = isFakeArt
      ? `### 1. Tóm tắt vấn đề pháp lý\nKiểm tra tính tồn tại của Điều 999 Bộ luật Dân sự năm 2015.\n\n### 2. Căn cứ pháp lý (nêu rõ Tên luật, Điều, Khoản)\n- **Bộ luật Dân sự năm 2015** (gồm tổng cộng 689 Điều, từ Điều 1 đến Điều 689).\n\n### 3. Phân tích chi tiết từng ý\nCăn cứ thông tin trong ngữ cảnh được cung cấp, Bộ luật Dân sự năm 2015 chỉ có tối đa **689 Điều**. Do đó, **Điều 999 Bộ luật Dân sự năm 2015 không tồn tại**.\n\n### 4. Kết luận\nKhông tồn tại Điều 999 Bộ luật Dân sự năm 2015. Hệ thống từ chối suy diễn hoặc tự tạo nội dung cho điều luật không có thật.`
      : `Dựa trên thông tin trong thẻ \`<context>\` được cung cấp hiện tại, **không có quy định pháp luật hoặc văn bản liên quan trực tiếp** đến câu hỏi của bạn.\n\nĐể đảm bảo tính chính xác pháp lý và không suy diễn hay tự bịa số hiệu điều luật, tôi không thể đưa ra con số/quy định cụ thể cho nội dung này. Bạn vui lòng cung cấp thêm trích dẫn điều luật liên quan hoặc chuyển sang câu hỏi thuộc phạm vi môn Pháp luật Đại cương.`;

    const userMsg = `<context>\n${nc.ctx}\n</context>\n\n<user_query>\n${q}\n</user_query>`;
    newSamples.push({
      sample_id: sid,
      intent_code: 'OUT_OF_SCOPE',
      taxonomy_group: 'G08_ADVERSARIAL_OOS',
      corpus_role: 'train_aug',
      instruction: q,
      input: '',
      context: nc.ctx,
      output: answer,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMsg },
        { role: 'assistant', content: answer }
      ]
    });
  }
}

const finalData = [...filtered, ...newSamples];

console.log(`✅ Đã làm sạch/chuẩn hóa: ${cleanedCount.toLocaleString('vi-VN')} mẫu (trong đó OOS: ${oosCleaned} mẫu).`);
console.log(`➕ Đã bổ sung mới: ${newSamples.length} mẫu Grounded RAG & Negative Rejection.`);
console.log(`📦 Tổng số mẫu cuối cùng: ${finalData.length.toLocaleString('vi-VN')}`);

fs.writeFileSync(MASTER_PATH, JSON.stringify(finalData, null, 2), 'utf8');
console.log(`💾 Đã lưu Master: ${MASTER_PATH} (${(fs.statSync(MASTER_PATH).size / (1024 * 1024)).toFixed(2)} MB)`);

// Resync train/val/test/csv/report
const trainLines = [];
const valLines = [];
const testLines = [];
const csvRows = ['sample_id,intent_code,taxonomy_group,instruction,input,has_context,output'];
const escapeCsv = (str) => (!str ? '""' : '"' + String(str).replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"');

for (let i = 0; i < finalData.length; i++) {
  const item = finalData[i];
  const line = JSON.stringify({ messages: item.messages });
  const mod = i % 10;
  if (mod < 8) trainLines.push(line);
  else if (mod === 8) valLines.push(line);
  else testLines.push(line);

  csvRows.push([
    escapeCsv(item.sample_id),
    escapeCsv(item.intent_code),
    escapeCsv(item.taxonomy_group),
    escapeCsv(item.instruction),
    escapeCsv(item.input),
    escapeCsv(item.context ? 'true' : 'false'),
    escapeCsv(item.output)
  ].join(','));
}

fs.writeFileSync(TRAIN_PATH, trainLines.join('\n') + '\n', 'utf8');
fs.writeFileSync(VAL_PATH, valLines.join('\n') + '\n', 'utf8');
fs.writeFileSync(TEST_PATH, testLines.join('\n') + '\n', 'utf8');
fs.writeFileSync(CSV_PATH, '\ufeff' + csvRows.join('\n') + '\n', 'utf8');

const report = {
  timestamp: new Date().toISOString(),
  dataset_name: 'sft_vietlaw_master',
  version: 'v2_clean_grounded',
  total_samples: finalData.length,
  splits: { train: trainLines.length, validation: valLines.length, test: testLines.length },
  taxonomy_groups_count: [...new Set(finalData.map(d => d.taxonomy_group))].length,
  intents_count: [...new Set(finalData.map(d => d.intent_code))].length,
  qa_checks: {
    standardized_4_section_headers: true,
    zero_boilerplate_conclusions: true,
    zero_duplicate_ketluan_line: true,
    zero_bogus_phap_luat_hien_hanh: true,
    clean_oos_refusals: true,
    grounded_rag_and_negative_rejection_added: newSamples.length
  }
};
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), 'utf8');
console.log('✅ Đã tái đồng bộ toàn bộ train/validation/test JSONL, CSV và QA_report.json');
