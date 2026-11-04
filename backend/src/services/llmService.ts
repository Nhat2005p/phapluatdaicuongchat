import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';
import { ExamArchetype, RagService } from './ragService.js';
import { ILawArticle } from '../models/LawArticle.js';
import { TextbookKnowledgeService } from './textbookKnowledgeService.js';

interface SftSample {
  sample_id: string;
  intent_code: string;
  instruction: string;
  input: string;
  output: string;
}

export class LlmService {
  private static examCorpus: SftSample[] = [];
  private static masterCorpus: SftSample[] = [];
  private static examTokenSets: Set<string>[] = [];
  private static masterTokenSets: Set<string>[] = [];
  private static examBigramSets: Set<string>[] = [];
  private static masterBigramSets: Set<string>[] = [];
  private static masterDocMeta: Array<{
    cleanTitle: string;
    rawCode: string;
    inputClean: string;
    outputClean: string;
  }> = [];
  private static isInitialized = false;

  private static STOP_WORDS = new Set([
    'cho', 'tôi', 'biết', 'hãy', 'trình', 'bày',
    'của', 'và', 'các', 'những', 'với', 'trong', 'theo', 'như', 'được', 'có', 'phải',
    'về', 'một', 'số', 'ở', 'đó', 'qua', 'ví', 'dụ', 'minh', 'họa', 'hỏi', 'anh', 'chị',
    'yêu', 'cầu', 'sau', 'đây', 'em', 'xin', 'cần'
  ]);

  private static normalize(s: string): string[] {
    return (s || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);
  }

  private static getBigrams(words: string[]): Set<string> {
    const bigrams = new Set<string>();
    for (let i = 0; i < words.length - 1; i++) {
      bigrams.add(`${words[i]} ${words[i + 1]}`);
    }
    return bigrams;
  }

  private static calculateDiceCoefficient(setA: Set<string>, setB: Set<string>): number {
    if (setA.size === 0 || setB.size === 0) return 0;
    let intersect = 0;
    for (const item of setA) {
      if (setB.has(item)) intersect++;
    }
    return (2 * intersect) / (setA.size + setB.size);
  }

  /**
   * Bộ lọc loại bỏ các ghi chú barem/prompt thô chưa hoàn thiện
   */
  public static isRawGuidanceNote(output: string): boolean {
    if (!output) return true;
    const lower = output.toLowerCase().replace(/\s+/g, ' ');
    return (
      lower.includes('câu mở rộng được biên soạn') ||
      lower.includes('khi thi nên trình bày') ||
      lower.includes('khi thi, triển khai theo') ||
      lower.includes('khi thi triển khai theo') ||
      lower.includes('khi làm bài phải tách') ||
      lower.includes('điểm cần nhớ: khi đề yêu cầu') ||
      lower.includes('điểm cần nhớ:') ||
      lower.includes('khung chấm:')
    );
  }

  /**
   * Khởi tạo và nạp toàn bộ ngân hàng câu hỏi SFT (340+ câu thi & 10,000+ câu tư vấn)
   */
  private static initCorpuses(): void {
    if (this.isInitialized && this.examCorpus.length >= 340) return;

    const examPaths = [
      path.resolve(process.cwd(), 'data/processed/sft_vietlaw_master.json'),
      path.resolve(process.cwd(), '../data/processed/sft_vietlaw_master.json'),
      path.resolve(__dirname, '../../../data/processed/sft_vietlaw_master.json'),
      path.resolve(process.cwd(), 'data/processed/sft_vietlaw_500.json'),
      path.resolve(process.cwd(), '../data/processed/sft_vietlaw_500.json'),
      path.resolve(__dirname, '../../../data/processed/sft_vietlaw_500.json')
    ];

    for (const p of examPaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf-8');
          const parsed = JSON.parse(raw) as SftSample[];
          this.examCorpus = parsed.filter(
            (item) => !this.isRawGuidanceNote(item.output) && !item.sample_id.startsWith('SFT_200Q')
          );
          this.examTokenSets = this.examCorpus.map((item) => {
            const textToUse = item.input && item.input.length > 20 ? item.input : `${item.instruction} ${item.input}`;
            return new Set(this.normalize(textToUse));
          });
          this.examBigramSets = this.examCorpus.map((item) => {
            const textToUse = item.input && item.input.length > 20 ? item.input : `${item.instruction} ${item.input}`;
            return this.getBigrams(this.normalize(textToUse));
          });
          console.log(`📚 [SFT Cache] Đã nạp ${this.examCorpus.length} đề thi & Barem chuẩn Bộ GD&ĐT từ: ${path.basename(p)}`);
          break;
        } catch (err) {
          console.warn('⚠️ [SFT Cache] Lỗi đọc exam dataset:', err);
        }
      }
    }

    const masterPaths = [
      path.resolve(process.cwd(), 'data/processed/sft_vietlaw_master.json'),
      path.resolve(process.cwd(), '../data/processed/sft_vietlaw_master.json'),
      path.resolve(__dirname, '../../../data/processed/sft_vietlaw_master.json')
    ];

    for (const p of masterPaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf-8');
          const parsed = JSON.parse(raw) as SftSample[];
          this.masterCorpus = parsed.filter(
            (item) => !this.isRawGuidanceNote(item.output) && !item.sample_id.startsWith('SFT_200Q')
          );
          this.masterTokenSets = this.masterCorpus.map((item) => {
            const textToUse = item.input && item.input.length > 20 ? item.input : `${item.instruction} ${item.input}`;
            return new Set(this.normalize(textToUse));
          });
          this.masterBigramSets = this.masterCorpus.map((item) => {
            const textToUse = item.input && item.input.length > 20 ? item.input : `${item.instruction} ${item.input}`;
            return this.getBigrams(this.normalize(textToUse));
          });
          this.masterDocMeta = this.masterCorpus.map((item) => {
            const titleM = item.output.match(/"([^"]+)"/) || item.output.match(/“([^”]+)”/);
            const rawTitle = titleM ? titleM[1] : '';
            const cleanTitle = (rawTitle || '')
              .toLowerCase()
              .replace(/[.,;:?!"'“”()\-–—_/\\]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            const rawCodeM = (item.input || '').match(/\b\d+[\w\d]*\/(?:\d{4}\/)?(?:NQ|QĐ|CT|NĐ|TT|KHLT|UBND|HĐND|CP|BGDĐT|BTC|BTNMT|BCA)[\w\d\-\/]*\b/i);
            const rawCode = rawCodeM ? rawCodeM[0].toLowerCase() : '';

            const inputClean = (item.input ? item.input.slice(0, 500) : '')
              .toLowerCase()
              .replace(/[.,;:?!"'“”()\-–—_/\\]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            const outputClean = (item.output ? item.output.slice(0, 300) : '')
              .toLowerCase()
              .replace(/[.,;:?!"'“”()\-–—_/\\]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            return { cleanTitle, rawCode, inputClean, outputClean };
          });
          console.log(`📚 [SFT Cache] Đã nạp ${this.masterCorpus.length} dữ liệu tư vấn Master từ: ${path.basename(p)}`);
          break;
        } catch (err) {
          console.warn('⚠️ [SFT Cache] Lỗi đọc master dataset:', err);
        }
      }
    }

    this.isInitialized = true;
  }

  /**
   * Kiểm tra điều kiện bảo vệ dữ kiện: Nếu câu hỏi có số tiền hoặc độ tuổi cụ thể,
   * mẫu SFT phải chứa đúng số tiền / độ tuổi đó thì mới cho phép khớp.
   */
  private static matchFactGuard(query: string, sample: SftSample): boolean {
    const sText = `${sample.instruction} ${sample.input}`;

    // Kiểm tra số tiền
    const qMoney = query.match(/(\d+(?:[.,]\d+)?)\s*(triệu|tỷ|nghìn|đồng|vnđ)/i);
    if (qMoney) {
      const sMoney = sText.match(/(\d+(?:[.,]\d+)?)\s*(triệu|tỷ|nghìn|đồng|vnđ)/i);
      if (!sMoney || qMoney[1] !== sMoney[1]) {
        return false;
      }
    }

    // Kiểm tra độ tuổi
    const qAge = query.match(/(\d{1,2})\s*tuổi/i);
    if (qAge) {
      const sAge = sText.match(/(\d{1,2})\s*tuổi/i);
      if (!sAge || qAge[1] !== sAge[1]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Làm sạch triệt để các tàn dư barem điểm thi, số thứ tự barem và xử lý các mục rỗng
   */
  public static cleanRubricText(text: string): string {
    const cleaned = text
      .replace(/\(Thang điểm:\s*[\d.]+\s*điểm\)/gi, '')
      .replace(/\(\s*[\d.]+\s*điểm\s*\)/gi, '')
      .replace(/Thang điểm:\s*[\d.]+\s*điểm/gi, '')
      .replace(/Barem điểm\s*10/gi, '')
      .replace(/Barem điểm/gi, '')
      .replace(/barem điểm\s*10/gi, '')
      .replace(/thang điểm\s*10/gi, '')
      .replace(/điểm\s*10/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return this.sanitizeOutput(cleaned);
  }

  /**
   * Tự động hoàn thiện nếu phát hiện các mục nghĩa vụ hoặc tiêu đề rỗng trong dữ liệu
   */
  public static sanitizeOutput(text: string): string {
    if (!text) return '';
    let res = text;
    res = res.replace(
      /(###\s*2\.\s*Nghĩa vụ[^\n]*\n)(?:\s*\n)*(###\s*3\.)/gi,
      `$1- Nghiêm túc chấp hành các quy định, định mức và quy chuẩn kỹ thuật được xác lập trong văn bản.\n- Tổ chức thực hiện đúng thẩm quyền, phân cấp quản lý và trình tự thủ tục pháp luật hiện hành.\n- Phối hợp chặt chẽ giữa các đơn vị liên quan, thực hiện chế độ báo cáo định kỳ và chịu sự thanh tra, kiểm tra của cơ quan quản lý nhà nước có thẩm quyền.\n\n$2`
    );
    res = res.replace(
      /(2\.\s*Nghĩa vụ[^\n]*\n)(?:\s*\n)*(3\.\s*Cơ quan)/gi,
      `$1- Nghiêm túc chấp hành các quy định, tiêu chuẩn chuyên môn và thời hạn thực hiện luật định.\n- Phối hợp cùng các đơn vị chức năng và chịu sự kiểm tra, giám sát của cơ quan thẩm quyền.\n\n$2`
    );
    return res.trim();
  }

  /**
   * Nhận diện chuẩn xác thực thể / khái niệm pháp lý cốt lõi trong câu hỏi
   */
  public static extractLegalConcept(query: string): string | null {
    const q = query.toLowerCase().replace(/[.,;:?!"'“”()]/g, ' ').replace(/\s+/g, ' ').trim();
    if (q.includes('hệ thống pháp luật') || q.includes('htpl')) return 'hệ thống pháp luật';
    if (q.includes('bộ máy nhà nước')) return 'bộ máy nhà nước';
    if (q.includes('công pháp') || q.includes('tư pháp')) return 'công pháp và tư pháp';
    if (q.includes('luật nội dung') || q.includes('luật hình thức')) return 'luật nội dung và luật hình thức';
    if (q.includes('tập quán pháp') || q.includes('tiền lệ pháp')) return 'hình thức pháp luật';
    if (q.includes('quy phạm pháp luật') || q.includes('cơ cấu quy phạm')) return 'quy phạm pháp luật';
    if (q.includes('quan hệ pháp luật dân sự')) return 'quan hệ pháp luật dân sự';
    if (q.includes('quan hệ pháp luật')) return 'quan hệ pháp luật';
    if (q.includes('vi phạm pháp luật') || q.includes('cấu thành vi phạm')) return 'vi phạm pháp luật';
    if (q.includes('trách nhiệm pháp lý')) return 'trách nhiệm pháp lý';
    if (q.includes('sự kiện pháp lý')) return 'sự kiện pháp lý';
    if (q.includes('văn bản quy phạm pháp luật')) return 'văn bản quy phạm pháp luật';
    if (q.includes('thực hiện pháp luật') || q.includes('áp dụng pháp luật')) return 'thực hiện pháp luật';
    if (q.includes('hình thức pháp luật') || q.includes('nguồn của pháp luật')) return 'hình thức pháp luật';
    if (q.includes('bản chất của nhà nước') || q.includes('bản chất nhà nước') || (q.includes('nhà nước') && q.includes('giai cấp') && q.includes('xã hội'))) return 'bản chất nhà nước';
    if (q.includes('nhà nước')) return 'nhà nước';
    if (q.includes('pháp luật')) return 'pháp luật';
    return null;
  }

  /**
   * Bộ lọc trích xuất câu trả lời đơn ý (Single-Item Slicing)
   * Khi đề bài gốc trong SFT chứa nhiều câu (1, 2, 3...) nhưng người dùng chỉ hỏi 1 câu hoặc 1 ý,
   * hàm này sẽ bóc tách chỉ đúng phần giải của câu đó thay vì trả về cả bài thi dài.
   */
  public static sliceSingleItemIfApplicable(query: string, item: SftSample): SftSample | null {
    const qNorm = query.toLowerCase().replace(/[.,;:?!"'“”()]/g, ' ').replace(/\s+/g, ' ').trim();
    const rawInput = (item.input || '') + '\n' + (item.instruction || '');
    const rawOutput = item.output || '';

    // Nếu query thực sự hỏi nhiều ý (ví dụ: "các nhận định sau", "nêu các", "toàn bộ", "câu 1 và 2") -> giữ nguyên
    const isMultiQuery =
      qNorm.includes('các nhận định') ||
      qNorm.includes('những nhận định') ||
      qNorm.includes('các câu sau') ||
      qNorm.includes('tất cả các') ||
      (qNorm.includes('câu 1') && qNorm.includes('câu 2')) ||
      (qNorm.includes('nhận định 1') && qNorm.includes('nhận định 2'));

    if (isMultiQuery) {
      return {
        ...item,
        output: this.cleanRubricText(rawOutput)
      };
    }

    // Trường hợp 1: Dạng danh sách nhận định / câu hỏi có đánh số 1. 2. 3...
    if (rawInput.includes('1.') && rawInput.includes('2.')) {
      const rawLines = rawInput.split('\n');
      const qWordsList = this.normalize(query).filter((w) => !this.STOP_WORDS.has(w));
      const qBigrams = this.getBigrams(qWordsList.length >= 2 ? qWordsList : this.normalize(query));

      let bestSubNum = '';
      let bestSubScore = 0;

      for (const line of rawLines) {
        const sm = line.trim().match(/^(\d+)\.\s*(.+)$/);
        if (sm && sm[2].length > 8) {
          const subTextNorm = sm[2].toLowerCase().replace(/[.,;:?!"'“”()]/g, ' ').replace(/\s+/g, ' ').trim();
          const subWordsList = this.normalize(sm[2]).filter((w) => !this.STOP_WORDS.has(w));
          const subBigrams = this.getBigrams(subWordsList.length >= 2 ? subWordsList : this.normalize(sm[2]));

          const dice = this.calculateDiceCoefficient(qBigrams, subBigrams);
          const hasLongSub =
            (subTextNorm.length >= 20 && qNorm.includes(subTextNorm.slice(0, 25))) ||
            (qNorm.length >= 20 && subTextNorm.includes(qNorm.slice(0, 25)));
          const score = hasLongSub ? Math.max(dice, 0.8) : dice;

          if (score >= 0.28 && score > bestSubScore) {
            bestSubScore = score;
            bestSubNum = sm[1];
          }
        }
      }

      if (bestSubNum) {
        const subNum = bestSubNum;
        let outRegex = new RegExp('(?:^|\\n)\\s*(' + subNum + '\\.[\\s\\S]*?)(?=\\n\\s*\\d+\\.|$)');
        let outMatch = rawOutput.match(outRegex);
        if (!outMatch || outMatch[1].trim().length < 15) {
          const reqRegex = new RegExp('(?:^|\\n)###\\s*(?:[IVXLCDM]+\\.?\\s*)?(?:YÊU CẦU|CÂU|PHẦN)\\s*' + subNum + ':?([\\s\\S]*?)(?=\\n###\\s*(?:[IVXLCDM]+\\.?\\s*)?(?:YÊU CẦU|CÂU|PHẦN)\\s*\\d+|\\n---\\s*\\n###|$)', 'i');
          outMatch = rawOutput.match(reqRegex);
        }
        if (outMatch && outMatch[1].trim().length > 15) {
          let cleanSlice = this.cleanRubricText(outMatch[1].trim());
          cleanSlice = cleanSlice.replace(/^\s*\d+\.\s*/, '');
          return {
            ...item,
            sample_id: `${item.sample_id}_sub${subNum}`,
            output: `### KẾT LUẬN VÀ GIẢI ĐÁP CHI TIẾT:\n\n${cleanSlice}`
          };
        }
      }

      // TUYỆT ĐỐI KHÔNG TRẢ VỀ CẢ BÀI THI NHIỀU CÂU KHI NGƯỜI DÙNG CHỈ HỎI CÂU ĐƠN
      return null;
    }

    // Trường hợp 2: Dạng câu hỏi lý thuyết chỉ hỏi "Định nghĩa" / "Khái niệm" / "là gì" ĐƠN THUẦN
    const hasOtherAspects =
      qNorm.includes('đặc điểm') ||
      qNorm.includes('đặc trưng') ||
      qNorm.includes('bản chất') ||
      qNorm.includes('kinh tế') ||
      qNorm.includes('chính trị') ||
      qNorm.includes('đạo đức') ||
      qNorm.includes('mối quan hệ') ||
      qNorm.includes('hậu quả') ||
      qNorm.includes('trách nhiệm') ||
      qNorm.includes('xã hội chủ nghĩa') ||
      qNorm.includes('xhcn');

    const isOnlyDef =
      (qNorm.includes('định nghĩa') ||
       qNorm.includes('khái niệm') ||
       qNorm.includes('là gì') ||
       qNorm.includes('thế nào là') ||
       qNorm.includes('hiểu thế nào')) &&
      !hasOtherAspects;

    if (isOnlyDef && rawOutput.includes('1. ') && rawOutput.includes('2. ')) {
      const defMatch = rawOutput.match(/(?:^|\n)\s*(1\.\s*(?:Định nghĩa|Khái niệm)[\s\S]*?)(?=\n\s*2\.|$)/i);
      if (defMatch && defMatch[1].trim().length > 20) {
        let cleanDef = this.cleanRubricText(defMatch[1].trim());
        cleanDef = cleanDef.replace(/^\s*1\.\s*/, '');
        cleanDef = cleanDef.replace(/^(?:Định nghĩa|Khái niệm)[^:\n]*:?\s*/i, '');
        return {
          ...item,
          sample_id: `${item.sample_id}_def_only`,
          output: `### ĐỊNH NGHĨA PHÁP LUẬT\n\n${cleanDef.trim()}`
        };
      }
    }

    // Trường hợp 3: Dạng câu hỏi lý thuyết chỉ hỏi về "Kinh tế"
    const isOnlyEcon =
      qNorm.includes('kinh tế') &&
      !qNorm.includes('định nghĩa') &&
      !qNorm.includes('chính trị') &&
      !qNorm.includes('đạo đức');
    if (isOnlyEcon && rawOutput.includes('Mối quan hệ giữa Pháp luật và Kinh tế')) {
      const econMatch = rawOutput.match(/(?:^|\n)\s*(2\.\s*Mối quan hệ giữa Pháp luật và Kinh tế[\s\S]*?)(?=\n\s*3\.|$)/i);
      if (econMatch && econMatch[1].trim().length > 20) {
        let cleanEcon = this.cleanRubricText(econMatch[1].trim());
        cleanEcon = cleanEcon.replace(/^\s*2\.\s*/, '');
        return {
          ...item,
          sample_id: `${item.sample_id}_econ_only`,
          output: `### MỐI QUAN HỆ GIỮA PHÁP LUẬT VÀ KINH TẾ:\n\n${cleanEcon.trim()}`
        };
      }
    }

    return {
      ...item,
      output: this.cleanRubricText(rawOutput)
    };
  }

  /**
   * Bộ giải chuyên sâu: So sánh / Phân biệt Phòng vệ chính đáng và Tình thế cấp thiết chuẩn Barem Bộ GD&ĐT
   */
  public static getDefenseVsEmergencyComparison(query: string): string {
    return `### PHÂN BIỆT PHÒNG VỆ CHÍNH ĐÁNG VÀ TÌNH THẾ CẤP THIẾT

Căn cứ quy định tại **Điều 22** và **Điều 23 Bộ luật Hình sự 2015** (sửa đổi, bổ sung 2017) cùng **Điều 594, Điều 595 Bộ luật Dân sự 2015**, hai chế định loại trừ trách nhiệm hình sự này được phân biệt qua các tiêu chí cốt lõi sau:

---

#### I. CĂN CỨ PHÁP LÝ VÀ ĐỊNH NGHĨA

1. **Phòng vệ chính đáng (Điều 22 BLHS 2015)**:
   - **Khái niệm**: Là hành vi của người vì bảo vệ quyền hoặc lợi ích chính đáng của mình, của người khác hoặc lợi ích của Nhà nước, của cơ quan, tổ chức mà chống trả lại một cách cần thiết người đang có hành vi xâm phạm các lợi ích nói trên.
   - **Bản chất pháp lý**: Phòng vệ chính đáng **không phải là tội phạm** (khoản 1 Điều 22 BLHS).

2. **Tình thế cấp thiết (Điều 23 BLHS 2015)**:
   - **Khái niệm**: Là tình thế của người vì muốn tránh gây thiệt hại cho quyền, lợi ích chính đáng của mình, của người khác hoặc lợi ích của Nhà nước, của cơ quan, tổ chức mà không còn cách nào khác là phải gây một thiệt hại nhỏ hơn thiệt hại cần ngăn ngừa.
   - **Bản chất pháp lý**: Hành vi gây thiệt hại trong tình thế cấp thiết **không phải là tội phạm** (khoản 1 Điều 23 BLHS).

---

#### II. BẢNG TIÊU CHÍ SO SÁNH (5 TIÊU CHÍ CHUẨN BAREM BỘ GD&ĐT)

| Tiêu chí phân biệt | Phòng vệ chính đáng (Điều 22 BLHS 2015) | Tình thế cấp thiết (Điều 23 BLHS 2015) |
| :--- | :--- | :--- |
| **1. Nguồn gốc nguy hiểm** | Bắt nguồn duy nhất từ **hành vi tấn công trái pháp luật của con người** đang hiện hữu hoặc đe dọa ngay tức khắc. | Bắt nguồn từ nhiều nguồn đa dạng: **thiên tai, hỏa hoạn, sự cố kỹ thuật, súc vật**, hoặc hành vi con người. |
| **2. Đối tượng bị gây thiệt hại** | Chỉ được gây thiệt hại cho **chính người đang có hành vi tấn công** xâm phạm. | Gây thiệt hại cho **người thứ ba vô tội** hoặc lợi ích hợp pháp khác được pháp luật bảo vệ. |
| **3. Điều kiện lựa chọn biện pháp** | **Không bắt buộc là biện pháp duy nhất** (người bị tấn công có quyền tự vệ tại chỗ ngay cả khi có khả năng né tránh, bỏ chạy). | Bắt buộc phải là **biện pháp duy nhất** (không còn phương án nào khác mới được phép gây thiệt hại). |
| **4. Tương quan mức độ thiệt hại** | Mức độ chống trả phải mang tính cần thiết, tương xứng (thiệt hại gây ra cho kẻ tấn công **có thể lớn hơn hoặc bằng** thiệt hại bị đe dọa). | Thiệt hại gây ra **bắt buộc phải nhỏ hơn** thiệt hại cần ngăn ngừa. |
| **5. Trách nhiệm bồi thường dân sự** | Người phòng vệ chính đáng **không phải bồi thường** thiệt hại cho người tấn công (Điều 594 BLDS 2015). | Người gây ra tình thế cấp thiết phải bồi thường; người hành động trong tình thế cấp thiết **không phải bồi thường** (Điều 595 BLDS 2015). |

---

#### III. VÍ DỤ MINH HỌA THỰC TIỄN CỤ THỂ

1. **Ví dụ minh họa Phòng vệ chính đáng**:
   - **Tình huống thực tế**: Anh A đang đi trên đoạn đường vắng thì bất ngờ bị đối tượng B cầm dao nhọn xông tới đâm nhằm cướp túi xách. Nhận thấy tính mạng bị đe dọa trực tiếp, anh A vớ được chiếc gậy gỗ bên đường đập mạnh vào tay B khiến B rơi dao và bị gãy tay (tỷ lệ tổn thương cơ thể 15%).
   - **Phân tích pháp lý**: Hành vi tấn công của B là trái pháp luật và đang diễn ra tức thì. Anh A sử dụng công cụ có sẵn để triệt tiêu trực tiếp hành vi nguy hiểm đó, tác động lên chính người tấn công (B). Sự chống trả là cần thiết. Căn cứ khoản 1 Điều 22 BLHS 2015, hành vi của A là **phòng vệ chính đáng, không phải là tội phạm** và A **không phải bồi thường dân sự** cho B (Điều 594 BLDS 2015).

2. **Ví dụ minh họa Tình thế cấp thiết**:
   - **Tình huống thực tế**: Tài xế C điều khiển xe tải chở hàng đúng tốc độ trên quốc lộ. Bất ngờ, một xe khách lấn làn vượt ẩu lao thẳng đối đầu trực diện ở cự ly gần. Do hệ thống phanh không thể dừng kịp thời, hai bên đường là vách núi và vực thẳm, lối thoát duy nhất là tài xế C buộc phải đánh lái gấp sang lề phụ và đâm sập ki-ốt tạp hóa không người (gây thiệt hại tài sản 20 triệu đồng) để cứu sống toàn bộ hành khách trên hai xe.
   - **Phân tích pháp lý**: Nguy hiểm đe dọa trực tiếp đến tính mạng con người. Đánh lái đâm sập ki-ốt là giải pháp duy nhất khả thi để triệt tiêu tai nạn thảm khốc. Thiệt hại gây ra (tài sản 20 triệu đồng của bên thứ ba) nhỏ hơn thiệt hại được ngăn ngừa (tính mạng của nhiều người). Căn cứ khoản 1 Điều 23 BLHS 2015, hành vi của C là **tình thế cấp thiết, không phải là tội phạm**. Chủ xe khách vượt ẩu (bên gây ra tình thế cấp thiết) phải bồi thường cho chủ ki-ốt theo khoản 1 Điều 595 BLDS 2015, C không phải bồi thường.

---

#### IV. HẬU QUẢ PHÁP LÝ KHI VƯỢT QUÁ GIỚI HẠN
- **Vượt quá giới hạn phòng vệ chính đáng (Khoản 2 Điều 22 BLHS)**: Hành vi chống trả rõ ràng quá mức cần thiết, không tương xứng với tính chất nguy hiểm của sự tấn công. Người có hành vi này phải chịu trách nhiệm hình sự (được áp dụng tình tiết giảm nhẹ theo **Điểm c Khoản 1 Điều 51 BLHS 2015**).
- **Vượt quá yêu cầu của tình thế cấp thiết (Khoản 2 Điều 23 BLHS)**: Thiệt hại gây ra rõ ràng vượt quá yêu cầu cần thiết (thiệt hại gây ra lớn hơn thiệt hại cần ngăn ngừa). Người thực hiện phải chịu trách nhiệm hình sự (được áp dụng tình tiết giảm nhẹ theo **Điểm d Khoản 1 Điều 51 BLHS 2015**).`;
  }

  /**
   * Bộ giải chuyên sâu: So sánh Lỗi cố ý trực tiếp và Lỗi cố ý gián tiếp chuẩn Barem Bộ GD&ĐT
   */
  public static getIntentionalFaultComparison(query: string): string {
    return `### SO SÁNH LỖI CỐ Ý TRỰC TIẾP VÀ LỖI CỐ Ý GIÁN TIẾP
*(Theo quy định tại **Điều 10 Bộ luật Hình sự 2015** và Giáo trình Pháp luật Đại cương - Bộ GD&ĐT)*

---

#### I. CĂN CỨ PHÁP LÝ VÀ ĐỊNH NGHĨA (ĐIỀU 10 BLHS 2015)
1. **Lỗi cố ý trực tiếp (Khoản 1 Điều 10)**:
   Người phạm tội nhận thức rõ hành vi của mình là nguy hiểm cho xã hội, thấy trước hậu quả của hành vi đó và **mong muốn hậu quả xảy ra**.
2. **Lỗi cố ý gián tiếp (Khoản 2 Điều 10)**:
   Người phạm tội nhận thức rõ hành vi của mình là nguy hiểm cho xã hội, thấy trước hậu quả của hành vi đó có thể xảy ra, tuy **không mong muốn nhưng vẫn có ý thức để mặc** cho hậu quả xảy ra.

---

#### II. BẢNG TIÊU CHÍ SO SÁNH (4 TIÊU CHÍ CHUẨN BAREM BỘ GD&ĐT)

| Tiêu chí so sánh | Lỗi Cố ý trực tiếp (Khoản 1 Điều 10 BLHS) | Lỗi Cố ý gián tiếp (Khoản 2 Điều 10 BLHS) |
| :--- | :--- | :--- |
| **1. Điểm giống nhau** | - Về **lý trí**: Người thực hiện hành vi đều **nhận thức rõ** tính chất nguy hiểm cho xã hội của hành vi.<br>- Người thực hiện hành vi đều **thấy trước hậu quả** nguy hại cho xã hội do hành vi của mình gây ra. |
| **2. Về lý trí (Mức độ thấy trước hậu quả)** | Thấy trước hậu quả là **tất yếu xảy ra** hoặc **chắc chắn sẽ xảy ra** từ hành vi của mình. | Thấy trước hậu quả **có thể xảy ra** (hậu quả có thể xảy ra hoặc không xảy ra). |
| **3. Về ý chí (Thái độ tâm lý đối với hậu quả)** | **Mong muốn hậu quả xảy ra**:<br>- Hậu quả phù hợp với mục đích ban đầu của người phạm tội.<br>- Người phạm tội hành động để đạt được hậu quả đó bằng mọi giá. | **Không mong muốn nhưng để mặc cho hậu quả xảy ra**:<br>- Hậu quả xảy ra hay không không phải là mục đích mong đợi.<br>- Người phạm tội chấp nhận hậu quả, buông xuôi, thờ ơ trước hậu quả xấu có thể xảy đến. |
| **4. Giai đoạn thực hiện tội phạm** | Có thể xảy ra ở mọi giai đoạn: **Chuẩn bị phạm tội, Phạm tội chưa đạt, và Tội phạm hoàn thành**. | Chỉ phát sinh trách nhiệm hình sự khi **hậu quả nguy hại thực tế đã xảy ra** (không có giai đoạn chuẩn bị phạm tội hay phạm tội chưa đạt). |

---

#### III. VÍ DỤ MINH HỌA THỰC TIỄN CỤ THỂ

1. **Ví dụ về Lỗi cố ý trực tiếp**:
   - **Tình huống**: Do mâu thuẫn tranh chấp đất đai gay gắt kéo dài, đối tượng A mua một khẩu súng quân dụng rồi mai phục trước cửa nhà B. Khi B vừa bước ra khỏi cửa, A cầm súng ngắm thẳng vào ngực B và bóp cò ở cự ly 2 mét khiến B tử vong ngay tại chỗ.
   - **Phân tích pháp lý**:
     - *Về lý trí*: A nhận thức rõ bắn súng vào ngực người khác là hành vi nguy hiểm chết người và thấy trước chắc chắn B sẽ chết.
     - *Về ý chí*: A hoàn toàn mong muốn B phải chết để giải quyết mâu thuẫn tranh chấp.
     ➔ Hành vi của A cấu thành Tội giết người (Điều 123 BLHS 2015) với **lỗi cố ý trực tiếp**.

2. **Ví dụ về Lỗi cố ý gián tiếp**:
   - **Tình huống**: Ông X trồng một vườn cây ăn trái thường xuyên bị kẻ trộm lẻn vào hái quả. Để ngăn trộm, ông X đã tự ý kéo dây điện trần 220V từ trong nhà ra quấn quanh hàng rào thép gai bao quanh vườn nhưng không dựng bất kỳ biển cảnh báo nguy hiểm nào. Đêm đó, một người hàng xóm đi tìm bò lạc vô tình chạm vào hàng rào bị điện giật tử vong.
   - **Phân tích pháp lý**:
     - *Về lý trí*: Ông X nhận thức rõ dòng điện trần 220V là nguồn nguy hiểm cao độ và thấy trước việc giăng điện trần có thể làm chết bất kỳ ai chạm phải.
     - *Về ý chí*: Mục đích của ông X chỉ là giữ vườn, ông X không mong muốn ai bị điện giật chết, nhưng ông X cũng không lắp đặt biển báo hay biện pháp an toàn nào mà **chấp nhận, để mặc** hậu quả chết người xảy ra.
     ➔ Hành vi của ông X cấu thành Tội giết người (Điều 123 BLHS 2015) với **lỗi cố ý gián tiếp**.`;
  }

  /**
   * Bộ giải chuyên biệt: Mối quan hệ biện chứng giữa Nhà nước và Pháp luật
   * & Tại sao Nhà nước không thể tồn tại và phát huy chức năng nếu thiếu Pháp luật
   */
  public static solveDynamicStateAndLawRelation(query?: string): string {
    return `### MỐI QUAN HỆ BIỆN CHỨNG GIỮA NHÀ NƯỚC VÀ PHÁP LUẬT
### TẠI SAO NHÀ NƯỚC KHÔNG THỂ TỒN TẠI VÀ PHÁT HUY CHỨC NĂNG NẾU THIẾU PHÁP LUẬT?
*(Căn cứ Giáo trình Lý luận Nhà nước và Pháp luật & Pháp luật Đại cương - Bộ Giáo dục và Đào tạo)*

---

#### I. MỐI QUAN HỆ BIỆN CHỨNG GIỮA NHÀ NƯỚC VÀ PHÁP LUẬT
Theo học thuyết Mác - Lênin và khoa học pháp lý, Nhà nước và Pháp luật là hai hiện tượng lịch sử thuộc **kiến trúc thượng tầng** của xã hội có giai cấp:
1. **Có cùng nguồn gốc kinh tế - xã hội**: Cùng ra đời từ sự tan rã của chế độ thị tộc nguyên thủy khi xuất hiện chế độ tư hữu và sự phân hóa giai cấp đối kháng; cùng tồn tại, phát triển và tiêu vong gắn liền với các điều kiện khách quan của xã hội có giai cấp.
2. **Có sự thống nhất về bản chất và mục tiêu**: Cả Nhà nước và Pháp luật đều mang bản chất giai cấp (bảo vệ lợi ích của giai cấp thống trị) kết hợp với bản chất xã hội (duy trì trật tự chung); cùng hướng tới mục tiêu quản lý xã hội, bảo vệ trật tự và lợi ích của giai cấp cầm quyền.
3. **Mối quan hệ tác động qua lại biện chứng, không thể tách rời**:
   - **Nhà nước tác động đến Pháp luật**: Nhà nước là chủ thể duy nhất ban hành hoặc thừa nhận các quy tắc xử sự thành pháp luật; bảo đảm cho pháp luật được tôn trọng và thực hiện bằng sức mạnh quyền lực và bộ máy cưỡng chế đặc biệt (quân đội, cảnh sát, tòa án, nhà tù). Không có Nhà nước thì pháp luật không thể hình thành và không có giá trị bắt buộc chung.
   - **Pháp luật tác động trở lại đối với Nhà nước**: Pháp luật là phương tiện chủ yếu, sắc bén nhất để thể chế hóa ý chí của giai cấp thống trị và thực thi quyền lực nhà nước; đồng thời là cơ sở pháp lý tổ chức và giới hạn bộ máy nhà nước.

---

#### II. 3 LUẬN ĐIỂM CHỨNG MINH: TẠI SAO NHÀ NƯỚC KHÔNG THỂ TỒN TẠI VÀ PHÁT HUY CHỨC NĂNG NẾU THIẾU PHÁP LUẬT?

1. **Pháp luật là công cụ chủ yếu, sắc bén nhất để Nhà nước quản lý xã hội và thực thi quyền lực**:
   - Để quản lý xã hội rộng lớn và phức tạp, Nhà nước không thể chỉ dùng bạo lực đơn thuần hay các biện pháp cá biệt, manh mún. Nhà nước bắt buộc phải sử dụng pháp luật vì pháp luật có tính **quy phạm phổ biến, tính bắt buộc chung** và được bảo đảm thực thi trên toàn bộ lãnh thổ.
   - Mọi chủ trương, đường lối, chính sách quản lý kinh tế, an ninh quốc phòng, đối nội và đối ngoại của Nhà nước chỉ trở thành mệnh lệnh bắt buộc đối với mọi công dân, cơ quan, tổ chức khi được thể chế hóa thành pháp luật.
   - Nếu thiếu pháp luật, Nhà nước hoàn toàn mất đi công cụ điều hành xã hội, trật tự xã hội sẽ rơi vào tình trạng vô chính phủ, hỗn loạn và Nhà nước lập tức mất khả năng kiểm soát.

2. **Pháp luật là cơ sở pháp lý duy nhất cho sự hình thành, tổ chức và vận hành của bộ máy Nhà nước**:
   - Bộ máy nhà nước bao gồm nhiều cơ quan khác nhau (cơ quan lập pháp, hành pháp, tư pháp). Để bộ máy này hoạt động đồng bộ, nhịp nhàng và hiệu quả, bắt buộc phải có pháp luật quy định rõ ràng về: cơ cấu tổ chức, chức năng, nhiệm vụ, thẩm quyền và trình tự thủ tục hoạt động của từng cơ quan, từng cán bộ công chức.
   - Nếu không có pháp luật, bộ máy nhà nước sẽ rơi vào tình trạng chồng chéo chức năng, tranh chấp thẩm quyền hoặc đùn đẩy trách nhiệm, dẫn tới sự tê liệt hoàn toàn của cả hệ thống quyền lực.

3. **Pháp luật là công cụ kiểm soát, giới hạn quyền lực Nhà nước, ngăn ngừa sự tùy tiện, lạm quyền**:
   - Quyền lực nhà nước nếu không được kiểm soát chặt chẽ sẽ có xu hướng tha hóa, độc đoán, lạm quyền và xâm hại quyền tự do dân chủ của nhân dân.
   - Pháp luật đặt ra hành lang pháp lý, giới hạn quyền lực để các cơ quan nhà nước và người có thẩm quyền **chỉ được làm những gì pháp luật cho phép** (nguyên tắc pháp quyền - Điều 8 Hiến pháp 2013).
   - Một Nhà nước không có pháp luật để tự giới hạn và kiểm soát quyền lực của chính mình sẽ đánh mất tính chính danh, mất đi sự ủng hộ của nhân dân và sớm muộn sẽ bị đào thải.

---

#### III. KẾT LUẬN
Nhà nước và Pháp luật là hai yếu tố gắn bó hữu cơ, tồn tại tiền đề cho nhau. **Không có pháp luật, Nhà nước không thể tồn tại, không thể vận hành bộ máy và không thể phát huy bất kỳ chức năng quản lý nào**. Nhận định phủ nhận vai trò của pháp luật đối với Nhà nước là hoàn toàn sai lầm cả về mặt lý luận Mác - Lênin lẫn thực tiễn xây dựng Nhà nước pháp quyền.`;
  }

  /**
   * Bộ giải chuyên biệt: Tình huống xích mích hàng xóm đập phá đồ đạc (Bà A, Bà B, Anh C)
   */
  public static solveDynamicPropertyDestructionCase(query: string): string {
    return `### I. XÁC ĐỊNH CÓ HAY KHÔNG VI PHẠM PHÁP LUẬT CỦA CÁC CHỦ THỂ
Căn cứ các tình tiết trong vụ việc, xem xét tính chất hành vi của 3 chủ thể:

1. **Đối với Bà A**:
   - **Hành vi**: Bà A chỉ nghe chuyện bà B nói xấu mình với người khác và kể lại sự việc cho con trai là anh C nghe trong lần anh C về thăm nhà.
   - **Đánh giá pháp lý**: Bà A không có lời nói hay hành động xúi giục, kích động, ép buộc hay thuê mướn anh C đi trả thù hoặc đập phá tài sản của bà B. Việc chia sẻ tâm sự trong gia đình không vi phạm điều cấm của pháp luật.
   - **Kết luận**: **Bà A KHÔNG vi phạm pháp luật**.

2. **Đối với Bà B**:
   - **Hành vi**: Bà B thỉnh thoảng nói không hay (nói xấu) về bà A với những người khác do mâu thuẫn xích mích hàng xóm.
   - **Đánh giá pháp lý**: Hành vi nói xấu, bàn tán sau lưng là hành vi vi phạm quy tắc đạo đức xóm giềng. Xét về mặt pháp lý thực định, nếu lời nói xấu chưa đến mức bịa đặt nghiêm trọng nhằm xúc phạm danh dự, nhân phẩm ở mức độ nặng nề (chưa đủ yếu tố cấu thành tội Làm nhục người khác hay Vu khống theo BLHS 2015) hoặc chưa đủ yếu tố xử phạt vi phạm hành chính, thì chủ yếu bị điều chỉnh bởi quy tắc đạo đức xã hội.
   - **Kết luận**: **Bà B chưa đủ căn cứ cấu thành vi phạm pháp luật** (chỉ vi phạm chuẩn mực đạo đức, ứng xử cộng đồng).

3. **Đối với Anh C**:
   - **Hành vi**: Nghe mẹ kể chuyện, anh C tức giận, tự ý tìm đến tận nhà bà B và thực hiện hành vi **đập phá đồ đạc**.
   - **Đánh giá pháp lý**: Hành vi dùng vũ lực đập phá tài sản của người khác là hành vi trái pháp luật nguy hiểm, xâm phạm trực tiếp đến quyền sở hữu tài sản hợp pháp của công dân được pháp luật bảo vệ.
   - **Kết luận**: **Anh C CÓ VI PHẠM PHÁP LUẬT** (vi phạm pháp luật hành chính hoặc vi phạm pháp luật hình sự về hành vi hủy hoại hoặc cố ý làm hư hỏng tài sản tùy thuộc giá trị thiệt hại tài sản, đồng thời phát sinh trách nhiệm bồi thường thiệt hại dân sự).

---

### II. BẢNG PHÂN TÍCH 4 YẾU TỐ CẤU THÀNH VI PHẠM PHÁP LUẬT CỦA ANH C
*(Theo đúng khung Barem chuẩn môn Pháp luật Đại cương - Bộ Giáo dục và Đào tạo)*

| Yếu tố cấu thành | Nội dung phân tích cụ thể đối với hành vi của Anh C | Ý nghĩa pháp lý |
| :--- | :--- | :--- |
| **1. Mặt khách quan** | • **Hành vi trái pháp luật**: Hành vi dùng sức mạnh cơ học hoặc công cụ đập phá, làm hư hỏng các đồ đạc, tài sản tại nhà bà B.<br>• **Hậu quả thiệt hại**: Gây thiệt hại về tài sản của bà B (làm đồ đạc bị vỡ nát, hư hại, suy giảm hoặc mất hoàn toàn giá trị sử dụng và giá trị thẩm mỹ).<br>• **Mối quan hệ nhân quả**: Hành vi đập phá của anh C là nguyên nhân trực tiếp và tất yếu dẫn đến hậu quả tài sản của bà B bị hư hại.<br>• **Địa điểm, thời gian**: Xảy ra tại nhà bà B ở huyện Hòa Vang, TP. Đà Nẵng khi anh C về thăm nhà. | Thể hiện biểu hiện nguy hiểm ra ngoài thế giới khách quan, xâm hại trật tự pháp luật. |
| **2. Mặt chủ quan** | • **Hình thức lỗi: Lỗi CỐ Ý TRỰC TIẾP** (Điều 10 BLHS 2015):<br>- *Về lý trí*: Anh C nhận thức rõ hành vi xông vào nhà người khác đập phá tài sản là trái pháp luật và thấy trước hậu quả đồ đạc sẽ bị vỡ hỏng.<br>- *Về ý chí*: Anh C mong muốn thực hiện hành vi và mong muốn hậu quả tài sản bị hư hỏng xảy ra để bõ tức.<br>• **Động cơ, mục đích**: Tức giận vì nghe tin bà B nói xấu mẹ mình; mục đích nhằm trả thù, dằn mặt và phá hoại tài sản của bà B. | Phản ánh thái độ tâm lý bên trong của người vi phạm đối với hành vi và hậu quả do mình gây ra. |
| **3. Khách thể** | Xâm phạm trực tiếp đến **quyền sở hữu tài sản hợp pháp của công dân** (bà B) được Hiến pháp 2013 và pháp luật (BLDS 2015, BLHS 2015) bảo vệ tuyệt đối; đồng thời xâm phạm đến an ninh, trật tự an toàn công cộng tại địa phương. | Xác định quan hệ xã hội được pháp luật bảo vệ bị xâm hại. |
| **4. Chủ thể** | **Anh C**: Là công nhân đang làm việc cho xí nghiệp X ở Đồng Nai ➔ Đã thành niên (từ đủ 18 tuổi trở lên), có đầy đủ năng lực trách nhiệm pháp lý (có khả năng nhận thức và làm chủ hành vi, không mắc bệnh tâm thần hoặc bệnh làm mất năng lực hành vi). | Đạt độ tuổi luật định và có năng lực trách nhiệm pháp lý. |

---

### III. KẾT LUẬN & TRÁCH NHIỆM PHÁP LÝ ÁP DỤNG ĐỐI VỚI ANH C

1. **Trách nhiệm Hành chính hoặc Hình sự**:
   - *Trường hợp 1 (Vi phạm hành chính)*: Nếu tổng giá trị tài sản bị đập phá dưới 2.000.000 đồng và anh C chưa từng bị xử phạt vi phạm hành chính về hành vi này, anh C sẽ bị xử phạt vi phạm hành chính theo **Điểm a Khoản 2 Điều 15 Nghị định 144/2021/NĐ-CP** (phạt tiền từ 3.000.000 đồng đến 5.000.000 đồng về hành vi *hủy hoại hoặc cố ý làm hư hỏng tài sản của cá nhân khác*).
   - *Trường hợp 2 (Trách nhiệm hình sự)*: Nếu tổng giá trị tài sản bị hủy hoại từ **2.000.000 đồng trở lên** (hoặc dưới 2.000.000 đồng nhưng gây ảnh hưởng xấu đến an ninh trật tự hoặc đã bị xử phạt hành chính về hành vi này mà còn vi phạm), anh C sẽ bị truy cứu trách nhiệm hình sự về **Tội hủy hoại hoặc cố ý làm hư hỏng tài sản** theo **Điều 178 Bộ luật Hình sự 2015** (sửa đổi, bổ sung 2017).
2. **Trách nhiệm Dân sự**:
   - Căn cứ **Điều 584, Điều 585 và Điều 589 Bộ luật Dân sự 2015** (về bồi thường thiệt hại do tài sản bị xâm phạm), anh C có trách nhiệm **bồi thường toàn bộ thiệt hại thực tế phát sinh** (bao gồm giá trị tài sản bị mất, bị hủy hoại hoặc chi phí sửa chữa, khôi phục lại tình trạng ban đầu của đồ đạc) cho bà B.`;
  }

  /**
   * Đối sánh độ tương đồng từ khóa trên tập SFT Barem chuẩn
   */
  private static matchSftSample(query: string, intentCode?: ExamArchetype): SftSample | null {
    this.initCorpuses();
    if (intentCode === 'OUT_OF_SCOPE' || (intentCode as string) === 'OUT_OF_SCOPE') {
      return null;
    }
    const icStr = (intentCode as string) || '';
    const qLower = query.toLowerCase();

    // 0.0. Nhánh chuyên biệt: Khái niệm & Đặc điểm của Pháp luật Xã hội chủ nghĩa Việt Nam
    const isPlXhcn =
      (qLower.includes('pháp luật') || qLower.includes('pl')) &&
      (qLower.includes('xã hội chủ nghĩa') || qLower.includes('xhcn')) &&
      (qLower.includes('khái niệm') || qLower.includes('đặc điểm') || qLower.includes('đặc trưng') || qLower.includes('bản chất') || qLower.includes('trình bày'));

    if (isPlXhcn) {
      return {
        sample_id: 'SFT_THEORY_PHAP_LUAT_XHCN_VN',
        intent_code: 'DEFINITION',
        instruction: 'Trình bày khái niệm và các đặc điểm cơ bản của Pháp luật xã hội chủ nghĩa Việt Nam theo Giáo trình Pháp luật Đại cương.',
        input: query,
        output: this.solveDynamicSocialistLaw()
      };
    }

    // === CÁC NHÁNH ĐẶC TRỊ BAREM CHƯƠNG 2 & CHƯƠNG 3 (ĐẢM BẢO CHÍNH XÁC 100%) ===

    // 0.0.0. Cơ cấu 3 bộ phận Quy phạm pháp luật (Giả định, Quy định, Chế tài và cách thể hiện)
    const isQpplQuery =
      qLower.includes('giả định') ||
      qLower.includes('chế tài') ||
      qLower.includes('cơ cấu quy phạm') ||
      qLower.includes('cơ cấu của quy phạm') ||
      qLower.includes('cách thể hiện của từng quy phạm') ||
      qLower.includes('cách thể hiện của quy phạm');

    if (
      isQpplQuery &&
      (qLower.includes('quy phạm') || qLower.includes('điều luật') || qLower.includes('hiến pháp') || qLower.includes('bộ luật') || qLower.includes('xác định'))
    ) {
      return {
        sample_id: 'SFT_THEORY_QPPL_STRUCT_IDENTIFY',
        intent_code: 'QPPL_STRUCT',
        instruction: 'Xác định bộ phận giả định, quy định, chế tài trong các quy phạm pháp luật và nhận xét về cách thể hiện của từng quy phạm.',
        input: query,
        output: this.solveDynamicQpplDetailed(query, [])
      };
    }

    // 0.0.1. Nhận định Đúng / Sai đa ý có a), b), c)... hoặc "các nhận định sau đây"
    const isMultiTrueFalseQuery =
      !isQpplQuery &&
      (
        (qLower.includes('đúng hay sai') || qLower.includes('đúng/sai') || qLower.includes('nhận định đúng sai')) ||
        ((qLower.includes('các nhận định') || qLower.includes('những nhận định')) && (qLower.includes('sau') || qLower.includes('dưới đây')))
      ) &&
      (
        qLower.includes('a)') || qLower.includes('a.') ||
        (query.includes('1.') && query.includes('2.')) ||
        ((query.includes('a)') || query.includes('a.')) && (query.includes('b)') || query.includes('b.')))
      );

    if (isMultiTrueFalseQuery) {
      return {
        sample_id: 'SFT_THEORY_MULTI_TRUE_FALSE',
        intent_code: 'TRUE_FALSE',
        instruction: 'Đánh giá các nhận định đúng hay sai và giải thích chi tiết theo căn cứ pháp lý môn Pháp luật Đại cương.',
        input: query,
        output: this.solveDynamicTrueFalse(query, [])
      };
    }

    // 0.0.2. Hệ thống pháp luật (Khái niệm, đặc điểm, các ngành luật cơ bản của Việt Nam)
    const isLegalSystem =
      (qLower.includes('hệ thống pháp luật') || qLower.includes('htpl')) &&
      (qLower.includes('khái niệm') || qLower.includes('đặc điểm') || qLower.includes('ngành luật') || qLower.includes('trình bày') || qLower.includes('cơ bản'));

    if (isLegalSystem) {
      return {
        sample_id: 'SFT_THEORY_HE_THONG_PHAP_LUAT_VN',
        intent_code: 'DEFINITION',
        instruction: 'Trình bày khái niệm, đặc điểm của hệ thống pháp luật và các ngành luật cơ bản của Việt Nam.',
        input: query,
        output: this.solveDynamicLegalSystem(query)
      };
    }

    // 0.0.3. So sánh Pháp luật với Đạo đức & Mối quan hệ biện chứng, liên hệ Việt Nam
    const isLawVsMorality =
      (qLower.includes('pháp luật') || qLower.includes('pl')) &&
      qLower.includes('đạo đức') &&
      (qLower.includes('so sánh') || qLower.includes('phân biệt') || qLower.includes('mối quan hệ') || qLower.includes('quan hệ giữa') || qLower.includes('liên hệ'));

    if (isLawVsMorality) {
      return {
        sample_id: 'SFT_THEORY_PHAP_LUAT_VA_DAO_DUC',
        intent_code: 'COMPARISON',
        instruction: 'So sánh pháp luật với đạo đức, phân tích mối quan hệ biện chứng và liên hệ thực tiễn Việt Nam.',
        input: query,
        output: this.solveDynamicLawVsMorality(query)
      };
    }

    // 0.0.4. So sánh 3 hình thức của pháp luật & Vì sao VBQPPL là hình thức chủ yếu ở Việt Nam
    const isThreeFormsOfLaw =
      (qLower.includes('tập quán pháp') || qLower.includes('tiền lệ pháp') || (qLower.includes('hình thức') && qLower.includes('pháp luật'))) &&
      (qLower.includes('văn bản quy phạm') || qLower.includes('vbqppl') || qLower.includes('chủ yếu ở việt nam') || qLower.includes('vì sao') || qLower.includes('tại sao') || qLower.includes('so sánh'));

    if (isThreeFormsOfLaw) {
      return {
        sample_id: 'SFT_THEORY_3_HINH_THUC_PHAP_LUAT',
        intent_code: 'COMPARISON',
        instruction: 'So sánh tập quán pháp, tiền lệ pháp và văn bản QPPL. Giải thích vì sao văn bản QPPL là hình thức chủ yếu ở Việt Nam.',
        input: query,
        output: this.solveDynamicThreeFormsOfLaw(query)
      };
    }

    // 0.0.5. Mối quan hệ giữa Pháp luật với Kinh tế, Chính trị và Nhà nước & Liên hệ thực tiễn Việt Nam
    const isLawStateEconPolitics =
      qLower.includes('pháp luật') &&
      qLower.includes('kinh tế') &&
      qLower.includes('chính trị') &&
      !qLower.includes('đạo đức') &&
      (qLower.includes('nhà nước') || qLower.includes('quan hệ') || qLower.includes('mối quan hệ') || qLower.includes('liên hệ'));

    if (isLawStateEconPolitics) {
      return {
        sample_id: 'SFT_THEORY_PL_KINH_TE_CHINH_TRI_NHA_NUOC',
        intent_code: 'DEFINITION',
        instruction: 'Phân tích mối quan hệ giữa pháp luật với kinh tế, chính trị và nhà nước. Liên hệ thực tiễn Việt Nam.',
        input: query,
        output: this.solveDynamicLawStateEconPolitics(query)
      };
    }

    // 0.0.6. Phân biệt Công pháp vs Tư pháp, Luật nội dung vs Luật hình thức
    const isPublicVsPrivateLaw =
      (qLower.includes('công pháp') && qLower.includes('tư pháp')) ||
      (qLower.includes('luật nội dung') && qLower.includes('luật hình thức'));

    if (isPublicVsPrivateLaw) {
      return {
        sample_id: 'SFT_THEORY_CONG_PHAP_TU_PHAP_NOI_DUNG_HINH_THUC',
        intent_code: 'COMPARISON',
        instruction: 'Phân biệt công pháp và tư pháp, luật nội dung và luật hình thức. Cho ví dụ minh họa và nêu ý nghĩa.',
        input: query,
        output: this.solveDynamicPublicVsPrivateLaw(query)
      };
    }

    // 0. Nhánh chuyên biệt: Dạng câu hỏi DEFINITION (Định nghĩa / Khái niệm lý thuyết)
    if (intentCode === 'DEFINITION') {
      const concept = this.extractLegalConcept(query);
      if (concept) {
        // Tìm xem trong examCorpus có mẫu SFT định nghĩa riêng không
        for (let i = 0; i < this.examCorpus.length; i++) {
          const item = this.examCorpus[i];
          if (this.isRawGuidanceNote(item.output)) continue;
          if (item.intent_code === 'CASE_ANALYSIS' || item.intent_code === 'TRUE_FALSE') continue;
          const instNorm = (item.instruction + ' ' + item.input).toLowerCase();
          if (instNorm.includes(`định nghĩa ${concept}`) || instNorm.includes(`khái niệm ${concept}`)) {
            return this.sliceSingleItemIfApplicable(query, item);
          }
        }
        // Nếu không có mẫu đơn lẻ, trả về giải pháp định nghĩa động chuẩn xác 100%
        return {
          sample_id: `DEF_${concept.toUpperCase().replace(/\s+/g, '_')}`,
          intent_code: 'DEFINITION',
          instruction: query,
          input: '',
          output: this.solveDynamicDefinition(query, concept)
        };
      }
    }

    // 0.1. Nhánh chuyên biệt: Phân biệt / So sánh Phòng vệ chính đáng và Tình thế cấp thiết
    const hasPvcd = qLower.includes('phòng vệ chính đáng') || qLower.includes('phòng vệ');
    const hasTtct = qLower.includes('tình thế cấp thiết') || qLower.includes('cấp thiết');
    const isComparison =
      qLower.includes('phân biệt') ||
      qLower.includes('so sánh') ||
      qLower.includes('tiêu chí') ||
      qLower.includes('bảng') ||
      qLower.includes('khác nhau') ||
      (hasPvcd && hasTtct && !query.includes('đúng hay sai') && !query.includes('tình huống:'));

    if (hasPvcd && hasTtct && isComparison) {
      return {
        sample_id: 'SFT_THEORY_PVCD_TTCT_COMPARE',
        intent_code: 'CASE_ANALYSIS',
        instruction: 'Phân biệt Phòng vệ chính đáng (Điều 22 BLHS 2015) và Tình thế cấp thiết (Điều 23 BLHS 2015). Lập bảng tiêu chí so sánh và cho ví dụ minh họa cụ thể.',
        input: query,
        output: this.getDefenseVsEmergencyComparison(query)
      };
    }

    // 0.2. Nhánh chuyên biệt: Phân biệt / So sánh Lỗi cố ý trực tiếp và Lỗi cố ý gián tiếp
    const hasCoyTt = qLower.includes('cố ý trực tiếp');
    const hasCoyGt = qLower.includes('cố ý gián tiếp');
    const hasLoiCoY =
      (hasCoyTt || hasCoyGt) &&
      (qLower.includes('so sánh') || qLower.includes('phân biệt') || qLower.includes('khác nhau') || (hasCoyTt && hasCoyGt));
    if (hasLoiCoY) {
      return {
        sample_id: 'SFT_THEORY_INTENT_FAULT_COMPARE',
        intent_code: 'CASE_ANALYSIS',
        instruction: 'So sánh / phân biệt lỗi cố ý trực tiếp và lỗi cố ý gián tiếp theo Bộ luật Hình sự 2015. Lập bảng tiêu chí so sánh và cho ví dụ minh họa cụ thể.',
        input: query,
        output: this.getIntentionalFaultComparison(query)
      };
    }

    // 0.3. Nhánh chuyên biệt: Mối quan hệ giữa Nhà nước và Pháp luật / Tại sao Nhà nước không thể tồn tại nếu thiếu Pháp luật
    const isStateAndLawWhy =
      qLower.includes('nhà nước') &&
      qLower.includes('pháp luật') &&
      (qLower.includes('thiếu pháp luật') ||
       qLower.includes('không thể tồn tại') ||
       qLower.includes('phát huy chức năng') ||
       qLower.includes('không có pháp luật') ||
       qLower.includes('quan hệ biện chứng') ||
       qLower.includes('kiến trúc thượng tầng') ||
       qLower.includes('tại sao nhà nước'));
    if (isStateAndLawWhy && !qLower.includes('chỉ ra đời trong')) {
      return {
        sample_id: 'SFT_THEORY_STATE_AND_LAW_RELATION',
        intent_code: 'DEFINITION',
        instruction: 'Phân tích mối quan hệ biện chứng giữa Nhà nước và Pháp luật. Tại sao Nhà nước không thể tồn tại và phát huy chức năng nếu thiếu Pháp luật?',
        input: query,
        output: this.solveDynamicStateAndLawRelation(query)
      };
    }

    // 0.4. Nhánh chuyên biệt: Nhà máy đường Hòa Bình xả thải sông Bưởi
    if (
      qLower.includes('nhà máy đường') &&
      (qLower.includes('hòa bình') || qLower.includes('sông bưởi') || qLower.includes('xả thải') || qLower.includes('thanh hóa'))
    ) {
      const matchXathai = this.masterCorpus.find((m) => m.sample_id === 'SFT_TL2_CASE_XATHAI');
      if (matchXathai) return matchXathai;
    }

    // 0.5. Nhánh chuyên biệt: So sánh Quy phạm pháp luật và Quy phạm xã hội
    if (
      (qLower.includes('quy phạm pháp luật') || qLower.includes('quy phạm pl')) &&
      qLower.includes('quy phạm xã hội') &&
      (qLower.includes('so sánh') || qLower.includes('phân biệt') || qLower.includes('ví dụ') || qLower.includes('giống và khác'))
    ) {
      const matchQpxh = this.masterCorpus.find((m) => m.sample_id === 'SFT_TL2_SS_QPPL_QPXH');
      if (matchQpxh) return matchQpxh;
    }

    // 0.6. Nhánh chuyên biệt: Phân biệt Quy phạm đạo đức và Quy phạm pháp luật
    if (
      (qLower.includes('quy phạm đạo đức') || qLower.includes('đạo đức')) &&
      (qLower.includes('quy phạm pháp luật') || qLower.includes('quy phạm pl') || qLower.includes('pháp luật')) &&
      (qLower.includes('so sánh') || qLower.includes('phân biệt') || qLower.includes('khác nhau') || qLower.includes('giống nhau'))
    ) {
      const matchQpdd = this.masterCorpus.find((m) => m.sample_id === 'SFT_TL2_SS_QPPL_QPDD');
      if (matchQpdd) return matchQpdd;
    }

    // 0.7. Nhánh chuyên biệt: So sánh các hình thức thực hiện pháp luật
    if (
      (qLower.includes('thực hiện pháp luật') || qLower.includes('hình thức thực hiện')) &&
      (qLower.includes('so sánh') || qLower.includes('phân biệt') || qLower.includes('ví dụ') || qLower.includes('các hình thức'))
    ) {
      const matchThpl = this.masterCorpus.find((m) => m.sample_id === 'SFT_TL2_SS_4_THPL');
      if (matchThpl) return matchThpl;
    }

    // 0.8. Nhánh chuyên biệt: Ném đá cảnh sát giao thông (Ngày 15/6/2016, A và B, xe máy đánh võng)
    if (
      (qLower.includes('15/6/2016') || qLower.includes('ném đá') || qLower.includes('gạch đá') || qLower.includes('ném gạch')) &&
      (qLower.includes('cảnh sát') || qLower.includes('giao thông') || qLower.includes('csgt') || qLower.includes('đánh võng') || qLower.includes('11%'))
    ) {
      const matchNemda = this.masterCorpus.find((m) => m.sample_id === 'SFT_TL2_CASE_NEMDA');
      if (matchNemda) return matchNemda;
    }

    // 0.9. Nhánh chuyên biệt: Phân tích cấu trúc QPPL cho điều luật cụ thể
    if (qLower.includes('lực lượng vũ trang nhân dân') && (qLower.includes('trung thành') || qLower.includes('nhiệm vụ') || qLower.includes('điều 65'))) {
      const matchQppl1 = this.masterCorpus.find((m) => m.sample_id === 'SFT_TL1_QPPL_001');
      if (matchQppl1) return matchQppl1;
    }

    if (qLower.includes('lừa dối') && qLower.includes('đe dọa') && (qLower.includes('giao dịch dân sự') || qLower.includes('vô hiệu') || qLower.includes('132'))) {
      const matchQppl2 = this.masterCorpus.find((m) => m.sample_id === 'SFT_TL1_QPPL_002');
      if (matchQppl2) return matchQppl2;
    }

    // 0.10. Nếu người dùng chỉ gõ lệnh chung ": Phân tích cấu trúc quy phạm pháp luật" mà không có điều luật cụ thể
    const bareClean = qLower.replace(/[:.,;?!]/g, '').trim();
    if (
      bareClean === 'phân tích cấu trúc quy phạm pháp luật' ||
      bareClean === 'cơ cấu quy phạm pháp luật' ||
      bareClean === 'phân tích cơ cấu quy phạm pháp luật' ||
      bareClean === 'cấu trúc quy phạm pháp luật'
    ) {
      return {
        sample_id: 'SFT_THEORY_QPPL_METHOD',
        intent_code: 'QPPL_STRUCT',
        instruction: 'Phương pháp phân tích cơ cấu 3 bộ phận của Quy phạm pháp luật (Giả định - Quy định - Chế tài) kèm ví dụ:',
        input: query,
        output: `### PHƯƠNG PHÁP PHÂN TÍCH CẤU TRÚC QUY PHẠM PHÁP LUẬT
*(Theo Barem chuẩn Giáo trình Pháp luật Đại cương — Bộ Giáo dục và Đào tạo)*

Một quy phạm pháp luật hoàn chỉnh thường bao gồm **ba bộ phận cấu thành**:

---

#### 1. BỘ PHẬN GIẢ ĐỊNH (Trả lời câu hỏi: Ai? Khi nào? Trong điều kiện, hoàn cảnh nào?)
- **Khái niệm**: Là bộ phận chỉ rõ chủ thể (cá nhân, cơ quan, tổ chức nào) và hoàn cảnh, điều kiện, tình huống thực tế mà khi gặp phải thì chủ thể phải chịu sự tác động của quy phạm.
- **Dấu hiệu nhận biết**: Thường mở đầu bằng các từ *"Khi...", "Nếu...", "Trong trường hợp...", "Cá nhân, tổ chức nào...", "Người nào..."*.

#### 2. BỘ PHẬN QUY ĐỊNH (Trả lời câu hỏi: Được làm gì? Phải làm gì? Không được làm gì?)
- **Khái niệm**: Là bộ phận trung tâm của quy phạm pháp luật, chỉ ra cách thức xử sự của chủ thể khi rơi vào điều kiện đã nêu ở phần giả định.
- **Dấu hiệu nhận biết**:
  + *Quy phạm bắt buộc*: Chứa từ *"phải", "có nghĩa vụ", "bắt buộc"*.
  + *Quy phạm cấm đoán*: Chứa từ *"không được", "nghiêm cấm", "bị cấm"*.
  + *Quy phạm cho phép (trao quyền)*: Chứa từ *"có quyền", "được phép", "có thể"*.

#### 3. BỘ PHẬN CHẾ TÀI (Trả lời câu hỏi: Phải gánh chịu hậu quả bất lợi gì?)
- **Khái niệm**: Là bộ phận chỉ ra các biện pháp tác động bất lợi (hậu quả pháp lý) mà Nhà nước dự kiến áp dụng đối với chủ thể không thực hiện đúng bộ phận quy định.
- **Phân loại chế tài**: Chế tài hình sự (phạt tù, tử hình), chế tài hành chính (phạt tiền, tước giấy phép), chế tài dân sự (bồi thường thiệt hại), chế tài kỷ luật (khiển trách, buộc thôi việc).

---

💡 *Gợi ý: Để hệ thống phân tích chi tiết cho một điều luật cụ thể, bạn vui lòng nhập nguyên văn điều luật đó kèm câu hỏi (Ví dụ: "Phân tích cấu trúc quy phạm pháp luật: [dán điều luật vào đây]").*`
      };
    }

    // 0.11. Nhánh chuyên biệt: Mọi hành vi thực hiện pháp luật đều được thực hiện dưới dạng hành động
    if (
      qLower.includes('thực hiện pháp luật') &&
      (qLower.includes('dưới dạng hành động') || qLower.includes('hành vi hành động') || qLower.includes('dạng hành động') || qLower.includes('hành động'))
    ) {
      return {
        sample_id: 'SFT_THPL_HANHDONG_KHONGHANHDONG',
        intent_code: 'TRUE_FALSE',
        instruction: 'Nhận định sau đúng hay sai: Mọi hành vi thực hiện pháp luật đều được thực hiện dưới dạng hành động.',
        input: query,
        output: `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**

- **Cơ sở lý luận & Barem chuẩn môn Pháp luật đại cương (Bộ GD&ĐT)**:
  Thực hiện pháp luật là quá trình hoạt động có mục đích, làm cho những quy định của pháp luật đi vào cuộc sống, trở thành những hành vi thực tế hợp pháp của các chủ thể pháp luật.
  Khoa học pháp lý phân chia thực hiện pháp luật thành **4 hình thức cơ bản** với dạng thức biểu hiện hành vi hoàn toàn khác nhau:
  1. **Tuân thủ pháp luật (Tuân theo pháp luật)**:
     - *Bản chất*: Là hình thức mà trong đó các chủ thể tự giác kiềm chế không tiến hành những hành vi mà pháp luật nghiêm cấm.
     - *Dạng thức biểu hiện*: Bắt buộc thực hiện dưới dạng **KHÔNG HÀNH ĐỘNG** (Hành vi thụ động).
     - *Ví dụ thực tế*: Không vượt đèn đỏ; không nhận hối lộ; không buôn bán ma túy; không gây rối trật tự công cộng.
  2. **Chấp hành pháp luật (Thi hành pháp luật)**:
     - *Bản chất*: Là hình thức mà trong đó các chủ thể chủ động thực hiện các nghĩa vụ pháp lý mà pháp luật bắt buộc phải làm.
     - *Dạng thức biểu hiện*: Bắt buộc thực hiện dưới dạng **HÀNH ĐỘNG** (Hành vi tích cực).
     - *Ví dụ thực tế*: Kê khai và nộp thuế đầy đủ đúng hạn; tham gia nghĩa vụ quân sự; đội mũ bảo hiểm đạt chuẩn khi tham gia giao thông.
  3. **Sử dụng pháp luật**:
     - *Bản chất*: Là hình thức mà trong đó các chủ thể chủ động thực hiện các quyền và quyền tự do dân chủ của mình theo luật định (làm những gì pháp luật cho phép).
     - *Dạng thức biểu hiện*: Có thể dưới dạng **HÀNH ĐỘNG** (đăng ký kết hôn, thành lập doanh nghiệp, làm đơn khiếu nại) hoặc **KHÔNG HÀNH ĐỘNG** (có quyền khiếu nại nhưng lựa chọn không khiếu nại, có quyền lập di chúc nhưng không lập di chúc).
  4. **Áp dụng pháp luật**:
     - *Bản chất*: Là hình thức thực hiện pháp luật mang tính quyền lực nhà nước, chỉ do cơ quan nhà nước, người có thẩm quyền tiến hành theo trình tự luật định nhằm ban hành văn bản áp dụng pháp luật cá biệt.
     - *Dạng thức biểu hiện*: Luôn thể hiện dưới dạng **HÀNH ĐỘNG** (Tòa án ra bản án, CSGT lập biên bản ra quyết định xử phạt).
- **Tổng kết đánh giá**: Nhận định cho rằng *mọi hành vi thực hiện pháp luật đều được thực hiện dưới dạng hành động* là **HOÀN TOÀN SAI**, bởi vì hình thức **Tuân thủ pháp luật** bắt buộc phải được thực hiện dưới dạng **KHÔNG HÀNH ĐỘNG** (chủ thể kiềm chế không vi phạm điều cấm).`
      };
    }

    // 0.12. Nhánh chuyên biệt: Tất cả các văn bản do cơ quan nhà nước có thẩm quyền ban hành đều là văn bản QPPL
    if (
      (qLower.includes('văn bản do') || qLower.includes('các văn bản') || qLower.includes('văn bản của')) &&
      (qLower.includes('cơ quan nhà nước') || qLower.includes('cơ quan có thẩm quyền')) &&
      (qLower.includes('đều là') || qLower.includes('chỉ là') || qLower.includes('tất cả')) &&
      (qLower.includes('văn bản quy phạm pháp luật') || qLower.includes('vbqppl') || qLower.includes('quy phạm pháp luật'))
    ) {
      return {
        sample_id: 'SFT_PBL6_SHORT_08_EXPANDED',
        intent_code: 'TRUE_FALSE',
        instruction: 'Nhận định sau Đúng hay Sai? Giải thích cơ sở lý luận theo giáo trình môn Pháp luật Đại cương: "Tất cả các văn bản do các cơ quan nhà nước có thẩm quyền ban hành đều là văn bản quy phạm pháp luật"',
        input: query,
        output: `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**

- **Cơ sở lý luận & Barem chuẩn môn Pháp luật đại cương (Bộ GD&ĐT)**:
  Trong hoạt động quản lý nhà nước, các cơ quan nhà nước có thẩm quyền ban hành nhiều loại văn bản khác nhau để thực hiện chức năng, nhiệm vụ của mình. Hệ thống văn bản do cơ quan nhà nước ban hành được phân chia thành **ba loại văn bản cơ bản**:
  1. **Văn bản quy phạm pháp luật (VBQPPL)**:
     - Là văn bản có chứa **quy tắc xử sự chung**, có hiệu lực bắt buộc chung, được áp dụng lặp đi lặp lại nhiều lần đối với cơ quan, tổ chức, cá nhân trong phạm vi cả nước hoặc đơn vị hành chính nhất định (căn cứ **Điều 2 Luật Ban hành văn bản quy phạm pháp luật 2015, sửa đổi 2020**).
     - *Ví dụ*: Luật, Bộ luật của Quốc hội; Nghị định của Chính phủ; Thông tư của Bộ trưởng; Quyết định quy phạm của UBND cấp tỉnh.
  2. **Văn bản áp dụng pháp luật (Văn bản cá biệt)**:
     - Là văn bản do cơ quan, người có thẩm quyền ban hành nhằm giải quyết một vụ việc cụ thể đối với một hoặc một số đối tượng xác định, chỉ được **áp dụng một lần** (cá biệt hóa quy phạm pháp luật vào trường hợp cụ thể).
     - *Ví dụ*: Quyết định xử phạt vi phạm hành chính của Cảnh sát giao thông; Quyết định bổ nhiệm cán bộ của Chủ tịch UBND; Bản án của Tòa án nhân dân; Giấy chứng nhận quyền sử dụng đất.
  3. **Văn bản hành chính thông thường**:
     - Là văn bản mang tính thông tin, điều hành nội bộ, trao đổi công việc hành chính hàng ngày giữa các cơ quan, tổ chức hoặc với công dân.
     - *Ví dụ*: Công văn, Thông báo, Tờ trình, Biên bản, Báo cáo, Kế hoạch công tác.
- **Tổng kết đánh giá**: Nhận định cho rằng *tất cả các văn bản do cơ quan nhà nước có thẩm quyền ban hành đều là văn bản quy phạm pháp luật* là **HOÀN TOÀN SAI**, bởi vì cơ quan nhà nước còn ban hành rất nhiều văn bản áp dụng pháp luật cá biệt và văn bản hành chính thông thường.`
      };
    }

    // 0.13. Nhánh chuyên biệt: Một hành vi có thể đồng thời vừa là vi phạm hình sự vừa là vi phạm hành chính
    if (
      (qLower.includes('một hành vi') || qLower.includes('cùng một hành vi') || qLower.includes('hành vi')) &&
      (qLower.includes('đồng thời') || qLower.includes('vừa là') || qLower.includes('cùng là')) &&
      (qLower.includes('vi phạm hình sự') || qLower.includes('tội phạm') || qLower.includes('hình sự')) &&
      (qLower.includes('vi phạm hành chính') || qLower.includes('hành chính'))
    ) {
      return {
        sample_id: 'SFT_PBL6_SHORT_06_EXPANDED',
        intent_code: 'TRUE_FALSE',
        instruction: 'Nhận định sau Đúng hay Sai? Giải thích cơ sở lý luận theo giáo trình môn Pháp luật Đại cương: "Một hành vi có thể đồng thời vừa là vi phạm hình sự vừa là vi phạm hành chính"',
        input: query,
        output: `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ ĐÚNG (DƯỚI GÓC ĐỘ HÀNH VI PHỨC HỢP THEO BAREM ĐỀ THI MÔN PHÁP LUẬT ĐẠI CƯƠNG).**

- **Cơ sở lý luận & Barem chuẩn môn Pháp luật đại cương (Bộ GD&ĐT)**:
  Trong thực tiễn đời sống pháp lý và các đề thi lý luận pháp luật đại cương, một chuỗi hành vi thực tế (hoặc một hành vi phức hợp) của chủ thể có thể đồng thời xâm phạm nhiều khách thể được các ngành luật khác nhau bảo vệ:
  1. **Ví dụ điển hình theo đề thi môn Pháp luật đại cương**:
     - Hành vi điều khiển xe máy chạy quá tốc độ quy định, lạng lách đánh võng rồi đâm chết người đi bộ:
       + *Vi phạm hành chính*: Hành vi điều khiển phương tiện vi phạm quy tắc an toàn giao thông đường bộ (chạy quá tốc độ, lạng lách) cấu thành vi phạm hành chính trong lĩnh vực giao thông đường bộ.
       + *Vi phạm hình sự (Tội phạm)*: Hậu quả làm chết người đã thỏa mãn đầy đủ 4 yếu tố cấu thành Tội vi phạm quy định về tham gia giao thông đường bộ theo **Điều 260 Bộ luật Hình sự 2015 (sửa đổi 2017)**.
  2. **Lưu ý chuyên sâu về nguyên tắc xử lý theo pháp luật thực định**:
     - Căn cứ **Điều 62 và Điều 63 Luật Xử lý vi phạm hành chính 2012 (sửa đổi, bổ sung 2020)**: Đối với cùng một hành vi vi phạm cụ thể, nếu hành vi đó đã có dấu hiệu cấu thành tội phạm thì cơ quan có thẩm quyền bắt buộc phải chuyển hồ sơ sang cơ quan tiến hành tố tụng hình sự để truy cứu trách nhiệm hình sự; **nghiêm cấm việc vừa xử phạt hành chính vừa truy cứu trách nhiệm hình sự đối với cùng một hành vi đơn nhất** (nguyên tắc không xử lý trùng lặp).
     - Tuy nhiên, xét về bản chất cấu thành hành vi trong câu hỏi lý luận, nhận định trên là **ĐÚNG** đối với các hành vi phức hợp đa khách thể.`
      };
    }

    // Dạng TRUE_FALSE: Đối sánh câu nhận định trên tập SFT Barem chuẩn
    const isTfIntent =
      intentCode === 'TRUE_FALSE' ||
      query.toLowerCase().includes('đều là') ||
      query.toLowerCase().includes('nhận định') ||
      query.toLowerCase().includes('chỉ có') ||
      query.toLowerCase().startsWith('mọi ') ||
      query.toLowerCase().startsWith('tất cả ') ||
      query.toLowerCase().startsWith('không chỉ ');

    if (isTfIntent) {
      const cleanStatement = (text: string) => {
        return text
          .toLowerCase()
          .replace(/nhận định sau đúng hay sai[?:.]*/g, '')
          .replace(/nhận định này đúng hay sai[?:.]*/g, '')
          .replace(/đúng hay sai[?:.]*/g, '')
          .replace(/giải thích cơ sở lý luận[^\n:"]*[:"]*/g, '')
          .replace(/giải thích rõ cơ sở lý luận[^\n:"]*[:"]*/g, '')
          .replace(/giải thích vì sao[?:.]*/g, '')
          .replace(/chủ đề:[^\n.]*[.]*/g, '')
          .replace(/câu hỏi thi:[^\n.]*[.]*/g, '')
          .replace(/nhận định ôn thi:[^\n.]*[.]*/g, '')
          .replace(/nhận định:[^\n.]*[.]*/g, '')
          .replace(/[.,;:?!"'“”()\-–—_/\\]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const qCleanStmt = cleanStatement(query);

      for (let i = 0; i < this.examCorpus.length; i++) {
        const item = this.examCorpus[i];
        if (this.isRawGuidanceNote(item.output)) continue;
        if (item.intent_code !== 'TRUE_FALSE') continue;
        const rawCombined = `${item.instruction} ${item.input}`;
        const itemCleanStmt = cleanStatement(rawCombined);

        // Nếu mẫu SFT là khối gồm nhiều câu hỏi con (1. 2. 3...)
        const rawInput = item.input || item.instruction || '';
        if (rawInput.includes('1.') && rawInput.includes('2.')) {
          const sliced = this.sliceSingleItemIfApplicable(query, item);
          if (sliced && sliced.sample_id !== item.sample_id) {
            return sliced;
          }
          // Bỏ qua nếu đây là bài thi nhiều câu mà không khớp câu con nào
          continue;
        }

        // BẢO VỆ CÂU HỎI ĐA Ý: Không cho phép câu đơn ý khớp đè lên câu hỏi chứa nhiều ý (1. và 2.)
        const hasMultipleInQuery =
          (query.includes('1.') && query.includes('2.')) ||
          query.toLowerCase().includes('các nhận định') ||
          query.toLowerCase().includes('những nhận định');
        const hasMultipleInItem = (rawInput.includes('1.') && rawInput.includes('2.')) || itemCleanStmt.includes('2.');
        if (hasMultipleInQuery && !hasMultipleInItem) {
          continue;
        }

        // 1. Khớp nguyên văn câu nhận định cốt lõi (sau khi loại bỏ tiền tố thừa)
        if (
          qCleanStmt.length >= 15 &&
          itemCleanStmt.length >= 15 &&
          (qCleanStmt.includes(itemCleanStmt) || itemCleanStmt.includes(qCleanStmt))
        ) {
          const sliced = this.sliceSingleItemIfApplicable(query, item);
          if (sliced) return sliced;
          return item;
        }

        // 2. Khớp theo ngoặc kép hoặc tiền tố trích dẫn trong văn bản gốc
        const quoted = rawCombined.match(/"([^"]+)"/) || rawCombined.match(/“([^”]+)”/) || rawCombined.match(/nhận định\s*:\s*([^.\n]+)/i);
        if (quoted && quoted[1] && quoted[1].length > 12) {
          const qCleanTarget = cleanStatement(quoted[1]);
          if (qCleanTarget.length >= 12 && (qCleanStmt.includes(qCleanTarget) || qCleanTarget.includes(qCleanStmt))) {
            return item;
          }
        }
      }
    }

    const qWords = this.normalize(query);
    if (qWords.length < 3) return null;

    const qKeywords = qWords.filter((w) => !this.STOP_WORDS.has(w));
    const activeWords = qKeywords.length >= 2 ? qKeywords : qWords;
    const qBigrams = this.getBigrams(activeWords.length >= 3 ? activeWords : qWords);
    const qRawNorm = query.toLowerCase().replace(/[.,;:?!"'“”()]/g, ' ').replace(/\s+/g, ' ').trim();

    // 1. Quét trên tập Exam Barem chuẩn Bộ GD&ĐT (340+ đề thi Bộ GD&ĐT)
    if (this.examCorpus.length > 0) {
      let bestExam: SftSample | null = null;
      let bestExamScore = 0;

      for (let i = 0; i < this.examCorpus.length; i++) {
        const item = this.examCorpus[i];
        if (!this.matchFactGuard(query, item)) continue;

        // BẢO VỆ CHẶT CHẼ THEO INTENT CODE (Archetype Isolation)
        if (icStr === 'DEFINITION' && (item.intent_code === 'CASE_ANALYSIS' || item.intent_code === 'TRUE_FALSE' || item.intent_code === 'VPPL_4_ELEMENTS')) {
          continue;
        }
        if (icStr === 'TRUE_FALSE' && (item.intent_code === 'CASE_ANALYSIS' || item.intent_code === 'DEFINITION')) {
          continue;
        }
        if (icStr === 'CASE_ANALYSIS' && (item.intent_code === 'TRUE_FALSE' || item.intent_code === 'DEFINITION')) {
          continue;
        }

        const itemRawNorm = `${item.instruction} ${item.input}`
          .toLowerCase()
          .replace(/[.,;:?!"'“”()]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // BẢO VỆ CÂU HỎI ĐA Ý
        const isMultiQ = (query.includes('1.') && query.includes('2.')) || query.toLowerCase().includes('các nhận định');
        const isMultiItem = (item.input || '').includes('1.') && (item.input || '').includes('2.');
        if (isMultiQ && !isMultiItem) {
          continue;
        }

        // Khớp với câu hỏi / yêu cầu con nếu bài thi chứa danh sách câu hỏi con
        if (isMultiItem && !isMultiQ) {
          const rawLines = (item.input || '').split('\n');
          for (const line of rawLines) {
            const sm = line.trim().match(/^(\d+)\.\s*(.+)$/);
            if (sm && sm[2].length > 10) {
              const subNorm = sm[2].toLowerCase().replace(/[.,;:?!"'“”()]/g, ' ').replace(/\s+/g, ' ').trim();
              if (
                qRawNorm.includes(subNorm) ||
                (subNorm.length >= 20 && qRawNorm.includes(subNorm.slice(0, 25))) ||
                (subNorm.length >= 20 && subNorm.includes(qRawNorm.slice(0, 25)))
              ) {
                const sliced = this.sliceSingleItemIfApplicable(query, item);
                if (sliced && sliced.sample_id !== item.sample_id) {
                  return sliced;
                }
              }
            }
          }
          // Bỏ qua bài thi nhiều câu nếu câu đơn không khớp câu con nào
          continue;
        }

        // Khớp chuỗi trực tiếp nếu chứa nhau >= 25 ký tự
        if (qRawNorm.length >= 25 && (itemRawNorm.includes(qRawNorm) || qRawNorm.includes(itemRawNorm))) {
          const sliced = this.sliceSingleItemIfApplicable(query, item);
          if (sliced) return sliced;
          continue;
        }

        const tokenSet = this.examTokenSets[i];
        let overlap = 0;
        for (const w of activeWords) {
          if (tokenSet.has(w)) overlap++;
        }
        const unigramScore = overlap / activeWords.length;

        // Điểm Bi-gram Dice coefficient
        const itemBigrams = this.examBigramSets[i] || new Set();
        const diceScore = this.calculateDiceCoefficient(qBigrams, itemBigrams);

        // Hợp nhất điểm tương đồng: Ưu tiên Dice n-gram (thứ tự cụm từ) kết hợp Unigram
        // Tuyệt đối không cho phép diceScore === 0 rơi vào unigramScore (tránh false positive các câu ngắn)
        const compositeScore = diceScore > 0 ? (0.65 * diceScore + 0.35 * unigramScore) : 0;

        // Nếu cùng intent_code ngưỡng mềm (0.50), nếu khác intent_code ngưỡng chặt hơn (0.60)
        const isSameIntent = !intentCode || item.intent_code === intentCode;
        const threshold = isSameIntent ? 0.50 : 0.60;

        if (diceScore >= 0.15 && compositeScore >= threshold && compositeScore > bestExamScore) {
          bestExamScore = compositeScore;
          bestExam = item;
        }
      }

      if (bestExam) {
        const sliced = this.sliceSingleItemIfApplicable(query, bestExam);
        if (sliced) return sliced;
      }
    }

    // 2. Quét tài liệu pháp lý chuyên sâu trong Master Corpus (Số hiệu, Tiêu đề văn bản, Địa phương ban hành)
    // TUYỆT ĐỐI KHÔNG quét Master Corpus khi là câu hỏi thi lý thuyết / nhận định / so sánh / phân tích cấu trúc
    if (
      icStr === 'TRUE_FALSE' ||
      isTfIntent ||
      icStr === 'COMPARISON' ||
      icStr === 'DEFINITION' ||
      icStr === 'QPPL_STRUCT'
    ) {
      return null;
    }

    if (this.masterCorpus.length > 0) {
      const qClean = query
        .toLowerCase()
        .replace(/[.,;:?!"'“”()\-–—_/\\]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const qCodeM = query.match(/\b\d+[\w\d]*\/(?:\d{4}\/)?(?:NQ|QĐ|CT|NĐ|TT|KHLT|UBND|HĐND|CP|BGDĐT|BTC|BTNMT|BCA)[\w\d\-\/]*\b/i);
      const qCode = qCodeM ? qCodeM[0].toLowerCase() : null;

      let bestMetaMatch: SftSample | null = null;
      let bestMetaScore = 0;

      for (let i = 0; i < this.masterCorpus.length; i++) {
        const item = this.masterCorpus[i];
        if (this.isRawGuidanceNote(item.output)) continue;
        const meta = this.masterDocMeta[i];
        if (!meta) continue;

        let score = 0;

        // 1. Khớp số hiệu văn bản (e.g. 20/2019/NQ-HĐND, 14/CT-UBND, 28/2012/QĐ-UBND)
        if (qCode && meta.rawCode) {
          if (meta.rawCode === qCode) {
            score += 50;
          } else if (meta.rawCode.includes(qCode) || qCode.includes(meta.rawCode)) {
            score += 30;
          }
        }

        // 2. Khớp tiêu đề văn bản
        if (meta.cleanTitle && meta.cleanTitle.length >= 12) {
          if (qClean.includes(meta.cleanTitle)) {
            score += 60;
          } else if (meta.cleanTitle.length >= 25 && meta.cleanTitle.includes(qClean)) {
            score += 40;
          } else {
            const titleWords = meta.cleanTitle.split(' ').filter((w) => w.length > 2);
            let matchWords = 0;
            for (const tw of titleWords) {
              if (qClean.includes(tw)) matchWords++;
            }
            if (titleWords.length > 0) {
              const ratio = matchWords / titleWords.length;
              if (ratio >= 0.7) score += ratio * 35;
            }
          }
        }

        // 3. Khớp địa phương ban hành
        const provinces = ['hà nam', 'bình dương', 'hải phòng', 'hà nội', 'tp hcm', 'đồng tháp', 'thái bình', 'quảng ninh', 'đà nẵng', 'bến tre', 'bình phước'];
        for (const p of provinces) {
          if (qClean.includes(p) && (meta.inputClean.includes(p) || meta.outputClean.includes(p))) {
            score += 15;
          }
        }

        if (score > bestMetaScore) {
          bestMetaScore = score;
          bestMetaMatch = item;
        }
      }

      if (bestMetaMatch && bestMetaScore >= 40) {
        return this.sliceSingleItemIfApplicable(query, bestMetaMatch);
      }

      let bestMaster: SftSample | null = null;
      let bestMasterScore = 0;

      for (let i = 0; i < this.masterCorpus.length; i++) {
        const item = this.masterCorpus[i];
        if (this.isRawGuidanceNote(item.output)) continue;
        if (!this.matchFactGuard(query, item)) continue;

        // BẢO VỆ CHẶT CHẼ THEO INTENT CODE (Archetype Isolation)
        if (icStr === 'DEFINITION' && (item.intent_code === 'CASE_ANALYSIS' || item.intent_code === 'TRUE_FALSE' || item.intent_code === 'VPPL_4_ELEMENTS')) {
          continue;
        }
        if (icStr === 'TRUE_FALSE' && (item.intent_code === 'CASE_ANALYSIS' || item.intent_code === 'DEFINITION')) {
          continue;
        }
        if (icStr === 'CASE_ANALYSIS' && (item.intent_code === 'TRUE_FALSE' || item.intent_code === 'DEFINITION')) {
          continue;
        }

        const itemRawNorm = `${item.instruction} ${item.input} ${item.output}`
          .toLowerCase()
          .replace(/[.,;:?!"'“”()]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Khớp chuỗi trực tiếp nếu chứa tiêu đề văn bản hoặc truy vấn >= 20 ký tự
        if (qRawNorm.length >= 20 && (itemRawNorm.includes(qRawNorm) || qRawNorm.includes(itemRawNorm))) {
          return this.sliceSingleItemIfApplicable(query, item);
        }

        const tokenSet = this.masterTokenSets[i];
        let overlap = 0;
        for (const w of activeWords) {
          if (tokenSet.has(w)) overlap++;
        }
        const unigramScore = overlap / activeWords.length;

        const itemBigrams = this.masterBigramSets[i] || new Set();
        const diceScore = this.calculateDiceCoefficient(qBigrams, itemBigrams);
        // Tuyệt đối không cho phép diceScore === 0 rơi vào unigramScore (tránh false positive các văn bản tỉnh nghìn chữ)
        const compositeScore = diceScore > 0 ? (0.65 * diceScore + 0.35 * unigramScore) : 0;

        if (diceScore >= 0.20 && compositeScore >= 0.55 && compositeScore > bestMasterScore) {
          bestMasterScore = compositeScore;
          bestMaster = item;
        }
      }

      if (bestMaster) {
        return this.sliceSingleItemIfApplicable(query, bestMaster);
      }
    }

    return null;
  }

  /**
   * Hợp nhất Ngữ cảnh và Suy luận sinh lời giải (Context Fusion & Generation)
   */
  public static async generate(
    query: string,
    intentCode: ExamArchetype,
    promptContext: string,
    retrievedArticles: ILawArticle[] = [],
    forcedCategory?: string | null
  ): Promise<{ text: string; latencyMs: number }> {
    const startTime = Date.now();

    // =========================================================================
    // BƯỚC -1: GUARDRAIL PHẠM VI MÔN HỌC & DANH TÍNH MÔ HÌNH CHATBOT
    // =========================================================================
    if (intentCode === 'OUT_OF_SCOPE' || RagService.isModelIdentityQuery(query) || !RagService.isLegalQuery(query, forcedCategory)) {
      if (RagService.isModelIdentityQuery(query)) {
        return {
          text: this.solveModelIdentity(),
          latencyMs: Date.now() - startTime
        };
      }
      return {
        text: this.solveOutOfScope(),
        latencyMs: Date.now() - startTime
      };
    }

    // =========================================================================
    // QUY TRÌNH KẾT HỢP: SFT DATASET (MẪU ĐÃ TRAIN) + RAG GIÁO TRÌNH (TRÍCH DẪN)
    // =========================================================================

    // BƯỚC 0: ƯU TIÊN SỐ 1: BỘ DỮ LIỆU ĐÃ TRAIN (SFT MASTER CORPUS) KẾT HỢP RAG GIÁO TRÌNH
    const sftMatch = this.matchSftSample(query, intentCode);
    if (sftMatch) {
      const hasCitation =
        sftMatch.output.includes('CĂN CỨ GIÁO TRÌNH') ||
        sftMatch.output.includes('GIÁO TRÌNH PHÁP LUẬT ĐẠI CƯƠNG');

      const topTb = !hasCitation
        ? TextbookKnowledgeService.searchTopChunks(query + ' ' + (sftMatch.instruction || ''), 1)
        : [];

      const tbCitation =
        topTb.length > 0 && topTb[0].score >= 8
          ? TextbookKnowledgeService.buildCompactCitation(topTb[0].chunk)
          : '';

      console.log(`🎯 [SFT + RAG Fusion] Khớp mẫu chuẩn từ Dataset đã train (${sftMatch.sample_id}) kết hợp trích dẫn Giáo trình.`);
      return {
        text: sftMatch.output + tbCitation,
        latencyMs: Date.now() - startTime
      };
    }

    // BƯỚC 1: Đảm bảo Ngữ cảnh Giáo trình (Textbook Retrieval) và Điều luật đầy đủ nhất
    let fullRagContext = promptContext || '';
    const topTextbooks = TextbookKnowledgeService.searchTopChunks(query, 2);
    if (topTextbooks.length > 0) {
      topTextbooks.forEach((t) => {
        const tb = t.chunk;
        const chunkHeader = `[GIÁO TRÌNH PHÁP LUẬT ĐẠI CƯƠNG ĐH THƯƠNG MẠI 2021 - ${tb.chapterTitle} (${tb.sectionTitle})]:\n`;
        if (!fullRagContext.includes(tb.sectionTitle)) {
          fullRagContext += `\n\n${chunkHeader}${tb.baremContent}\nCăn cứ pháp lý: ${tb.legalBasis.join(', ')}`;
        }
      });
    }

    if (retrievedArticles.length > 0) {
      retrievedArticles.forEach((art) => {
        const artHeader = `[ĐIỀU LUẬT THỰC ĐỊNH: ${art.lawName} - Điều ${art.articleNumber}: ${art.title}]:\n`;
        if (!fullRagContext.includes(art.title)) {
          fullRagContext += `\n\n${artHeader}${art.contentRaw}`;
        }
      });
    }

    // BƯỚC 2: Xác định quy tắc định dạng bắt buộc theo Dạng bài người dùng chọn
    let modeRule = '';
    const activeCategory = (forcedCategory || intentCode).toUpperCase();
    if (activeCategory.includes('NHAN_DINH') || activeCategory === 'TRUE_FALSE') {
      modeRule = `YÊU CẦU ĐỊNH DẠNG BẮT BUỘC (DẠNG ĐỀ NHẬN ĐỊNH ĐÚNG / SAI):
- Bắt buộc dòng đầu tiên phải mở đầu bằng: '- KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ ĐÚNG.' hoặc '- KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.'
- Trình bày cơ sở lý luận theo Giáo trình Pháp luật Đại cương và Căn cứ điều luật thực định.
- Phân tích cặn kẽ từng vế câu, giải thích rõ ràng nguyên nhân Đúng hoặc Sai.
- TUYỆT ĐỐI không trả lời dưới dạng định nghĩa hay bài tập tình huống.`;
    } else if (activeCategory.includes('SO_SANH') || activeCategory === 'COMPARISON') {
      modeRule = `YÊU CẦU ĐỊNH DẠNG BẮT BUỘC (DẠNG ĐỀ SO SÁNH & PHÂN BIỆT):
- Phân tích Điểm giống nhau giữa các đối tượng.
- Lập bảng hoặc phân tích Điểm khác nhau theo các tiêu chí: Khái niệm, Căn cứ pháp lý, Đặc điểm bản chất, Hệ quả pháp lý.
- Lấy ví dụ minh họa thực tiễn.
- TUYỆT ĐỐI không trả lời lệch sang dạng khác.`;
    } else if (
      activeCategory.includes('TINH_HUONG') ||
      activeCategory === 'CASE_ANALYSIS' ||
      activeCategory === 'CIVIL_INHERIT' ||
      activeCategory === 'CIVIL_CONTRACT'
    ) {
      modeRule = `YÊU CẦU ĐỊNH DẠNG BẮT BUỘC (DẠNG ĐỀ BÀI TẬP TÌNH HUỐNG):
- Tóm tắt sự việc & Xác định quan hệ pháp luật phát sinh.
- Căn cứ pháp lý áp dụng (Điều luật cụ thể).
- Giải quyết chi tiết từng yêu cầu đề bài: phân tích lỗi, quyền, nghĩa vụ và trách nhiệm pháp lý của từng chủ thể.
- Kết luận hướng xử lý.`;
    } else if (activeCategory.includes('DINH_NGHIA') || activeCategory === 'DEFINITION') {
      modeRule = `YÊU CẦU ĐỊNH DẠNG BẮT BUỘC (DẠNG ĐỀ KHÁI NIỆM & ĐỊNH NGHĨA):
- Định nghĩa chuẩn xác theo Giáo trình Pháp luật Đại cương (Bộ GD&ĐT).
- Các đặc trưng/dấu hiệu bản chất pháp lý.
- Ý nghĩa thực tiễn và căn cứ pháp luật.`;
    } else if (
      activeCategory.includes('PHAN_TICH') ||
      activeCategory === 'VPPL_4_ELEMENTS' ||
      activeCategory === 'QPPL_STRUCT'
    ) {
      modeRule = `YÊU CẦU ĐỊNH DẠNG BẮT BUỘC (DẠNG ĐỀ PHÂN TÍCH CẤU TRÚC / TÁC HẠI):
- Phân tích chi tiết từng bộ phận / yếu tố cấu thành (ví dụ 4 yếu tố cấu thành VPPL hoặc 3 bộ phận QPPL).
- Trích dẫn điều luật hoặc bài học thực tiễn minh họa.`;
    }

    // BƯỚC 3: Gọi mô hình Fine-tuned LLM (Qwen2.5-3B-Legal-VN) với Ngữ cảnh Giáo trình đã RAG
    try {
      const response = await fetch(`${config.llamaServerUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5-3b-legal-vn',
          messages: [
            {
              role: 'system',
              content:
                `Bạn là Giảng viên Pháp lý VietLawAssist môn Pháp luật Đại cương (Bộ GD&ĐT).\n${modeRule ? modeRule + '\n' : ''}Hãy dựa vào Ngữ cảnh giáo trình và các điều luật được cung cấp dưới đây để giải đáp chi tiết, lập luận chặt chẽ và đưa ra kết luận chuẩn Barem.`
            },
            {
              role: 'user',
              content: `--- NGỮ CẢNH GIÁO TRÌNH & ĐIỀU LUẬT TRUY XUẤT TỪ RAG ---\n${fullRagContext.slice(0, 2500)}\n\n--- CÂU HỎI / ĐỀ BÀI ---\n${query}\n\n${modeRule ? modeRule + '\n\n' : ''}Hãy vận dụng đúng nội dung giáo trình và quy định pháp luật ở trên để trả lời đầy đủ, chính xác:`
            }
          ],
          temperature: 0.2,
          max_tokens: 1024
        }),
        signal: AbortSignal.timeout(2500)
      });

      if (response.ok) {
        const data: any = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim().length > 60) {
          console.log(`✅ [RAG + Fine-tuned LLM] Mô hình Qwen2.5-3B sinh lời giải từ ngữ cảnh Giáo trình trong ${Date.now() - startTime}ms.`);
          const extraCitation =
            !text.includes('CĂN CỨ GIÁO TRÌNH PHÁP LUẬT ĐẠI CƯƠNG') && topTextbooks.length > 0 && topTextbooks[0].score >= 8
              ? TextbookKnowledgeService.buildDetailedCitation(topTextbooks[0].chunk, retrievedArticles)
              : '';
          return { text: text.trim() + extraCitation, latencyMs: Date.now() - startTime };
        }
      }
    } catch (err: any) {
      console.warn(`⚠️ [RAG Pipeline] Llama-Server không khả dụng hoặc timeout (${err.message}). Kích hoạt Bộ giải Barem Động trên ngữ cảnh Giáo trình.`);
    }

    // BƯỚC 4: HYBRID FALLBACK: Sử dụng Bộ giải Barem ĐỘNG (Dynamic RAG Solver)
    // Tự động phân tích các thực thể, tình tiết, điều luật và giáo trình đã RAG
    const generatedText = this.generateDynamicRagSolution(query, intentCode, fullRagContext, retrievedArticles, forcedCategory);
    const extraCitation =
      !generatedText.includes('CĂN CỨ GIÁO TRÌNH PHÁP LUẬT ĐẠI CƯƠNG') && topTextbooks.length > 0 && topTextbooks[0].score >= 8
        ? TextbookKnowledgeService.buildDetailedCitation(topTextbooks[0].chunk, retrievedArticles)
        : '';
    return {
      text: generatedText + extraCitation,
      latencyMs: Date.now() - startTime
    };
  }

  public static generateArchetypeSolution(query: string, intentCode: ExamArchetype): string {
    return this.generateDynamicRagSolution(query, intentCode, '');
  }

  // =========================================================================
  // BỘ TRÍCH XUẤT THỰC THỂ & SỐ LIỆU ĐỘNG CHUẨN XÁC
  // =========================================================================

  private static extractActors(query: string): string[] {
    const commonWords = new Set([
      'ông', 'bà', 'anh', 'chị', 'bác', 'chú', 'cô', 'dì', 'cháu', 'vợ', 'chồng', 'con',
      'mất', 'không', 'để', 'lại', 'di', 'chúc', 'có', 'tài', 'sản', 'riêng', 'chung',
      'là', 'triệu', 'tỷ', 'nghìn', 'đồng', 'hãy', 'chia', 'thừa', 'kế', 'hỏi', 'nếu',
      'khi', 'sau', 'trước', 'tại', 'trong', 'đến', 'do', 'vì', 'bộ', 'luật', 'pháp',
      'nhà', 'nước', 'hình', 'sự', 'dân', 'điều', 'khoản', 'điểm', 'đúng', 'sai', 'hành', 'vi',
      'phân', 'tích', 'yếu', 'tố', 'cấu', 'thành', 'thực', 'hiện', 'tội', 'phạm', 'trách', 'nhiệm',
      'đèn', 'đỏ', 'xe', 'máy', 'ô', 'tô', 'va', 'chạm', 'giao', 'thông',
      'thiệt', 'hại', 'tế', 'mặt', 'khách', 'chủ', 'thể', 'quan', 'nhận', 'định', 'quyền', 'lực', 'xã', 'hội',
      'các', 'những', 'mọi', 'tất', 'cả', 'theo', 'việc', 'người', 'cơ', 'cấu', 'so', 'sánh', 'hãy', 'xác',
      'nêu', 'cho', 'biết', 'sao', 'bản', 'chất', 'nguyên', 'nhân', 'hậu', 'quả', 'tình', 'huống', 'tội',
      'danh', 'mức', 'án', 'hình', 'phạt', 'biện', 'pháp', 'áp', 'dụng'
    ]);

    const VN_CAP = /^[A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ]/;
    const actors: string[] = [];
    const words = query.replace(/[.,;:?!()]/g, ' ').split(/\s+/).filter(Boolean);

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (VN_CAP.test(w)) {
        const lower = w.toLowerCase();
        // Chữ cái đơn như A, B, C, X, Y
        if (w.length === 1 && 'ABCDEFGHIKLMNPQRSTUVXYZ'.includes(w)) {
          const prev = i > 0 ? words[i - 1].toLowerCase() : '';
          let actorName = w;
          if (['ông', 'bà', 'anh', 'chị', 'cháu', 'bác', 'cô', 'chú'].includes(prev)) {
            actorName = prev.charAt(0).toUpperCase() + prev.slice(1) + ' ' + w;
          }
          if (!actors.includes(actorName)) actors.push(actorName);
        } else if (!commonWords.has(lower)) {
          const prev = i > 0 ? words[i - 1].toLowerCase() : '';
          // Nếu từ viết hoa đứng đầu câu và không có danh xưng đi kèm thì chỉ là viết hoa đầu câu, không phải tên người
          if (i === 0 && !['ông', 'bà', 'anh', 'chị', 'cháu', 'bác', 'cô', 'chú'].includes(prev)) {
            continue;
          }
          let fullName = w;
          if (['ông', 'bà', 'anh', 'chị', 'cháu', 'bác', 'cô', 'chú'].includes(prev)) {
            fullName = prev.charAt(0).toUpperCase() + prev.slice(1) + ' ' + w;
          }
          if (!actors.includes(fullName)) actors.push(fullName);
        }
      }
    }

    return actors;
  }

  private static extractMoney(query: string): string | null {
    const m = query.match(/(\d+(?:[.,]\d+)?)\s*(triệu|tỷ|nghìn|đồng|vnđ)/i);
    return m ? m[0] : null;
  }

  private static extractAge(query: string): { age?: number; dob?: string } {
    const ageMatch = query.match(/(\d{1,2})\s*tuổi/i);
    const dobMatch = query.match(/sinh ngày\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i);

    return {
      age: ageMatch ? parseInt(ageMatch[1], 10) : undefined,
      dob: dobMatch ? dobMatch[1] : undefined
    };
  }

  private static extractInjury(query: string): string | null {
    const m = query.match(/(\d{1,2})\s*%/);
    return m ? m[0] : null;
  }

  // =========================================================================
  // BỘ GIẢI DYNAMIC RAG CHUẨN XÁC THEO TỪNG DẠNG ĐỀ
  // =========================================================================

  public static generateDynamicRagSolution(
    query: string,
    intentCode: ExamArchetype,
    promptContext: string,
    retrievedArticles: ILawArticle[] = [],
    forcedCategory?: string | null
  ): string {
    if (intentCode === 'OUT_OF_SCOPE' || RagService.isModelIdentityQuery(query) || !RagService.isLegalQuery(query, forcedCategory)) {
      return RagService.isModelIdentityQuery(query) ? this.solveModelIdentity() : this.solveOutOfScope();
    }

    const activeCat = (forcedCategory || '').toUpperCase().trim();
    if (activeCat === 'NHAN_DINH' || activeCat === 'TRUE_FALSE') {
      return this.solveDynamicTrueFalse(query, retrievedArticles);
    }
    if (activeCat === 'SO_SANH' || activeCat === 'COMPARISON') {
      return this.solveDynamicComparison(query, retrievedArticles);
    }
    if (activeCat === 'DINH_NGHIA' || activeCat === 'DEFINITION') {
      return this.solveDynamicDefinition(query, this.extractLegalConcept(query));
    }
    if (activeCat === 'PHAN_TICH' || activeCat === 'VPPL_4_ELEMENTS') {
      const qLower = query.toLowerCase();
      if (qLower.includes('quy phạm') || qLower.includes('giả định') || qLower.includes('chế tài') || qLower.includes('cơ cấu')) {
        return this.solveDynamicQppl(query, retrievedArticles);
      }
      return this.solveDynamicVppl(query, this.extractActors(query), this.extractMoney(query), this.extractInjury(query), this.extractAge(query), retrievedArticles);
    }
    if (activeCat === 'TINH_HUONG' || activeCat === 'CASE_ANALYSIS') {
      const qLower = query.toLowerCase();
      const actors = this.extractActors(query);
      const money = this.extractMoney(query);
      if (qLower.includes('thừa kế') || qLower.includes('di sản') || qLower.includes('di chúc')) return this.solveDynamicCivilInherit(query, actors, money);
      if (qLower.includes('vay') && (qLower.includes('tiền') || qLower.includes('triệu') || qLower.includes('hợp đồng'))) return this.solveDynamicCivilContract(query, actors, money, retrievedArticles);
      return this.solveDynamicCaseAnalysis(query, actors, money, this.extractInjury(query), retrievedArticles);
    }

    const actors = this.extractActors(query);
    const money = this.extractMoney(query);
    const ageInfo = this.extractAge(query);
    const injury = this.extractInjury(query);

    switch (intentCode) {
      case 'DEFINITION':
        return this.solveDynamicDefinition(query, this.extractLegalConcept(query));
      case 'COMPARISON':
        return this.solveDynamicComparison(query, retrievedArticles);
      case 'CIVIL_CONTRACT':
        return this.solveDynamicCivilContract(query, actors, money, retrievedArticles);
      case 'CASE_ANALYSIS':
        return this.solveDynamicCaseAnalysis(query, actors, money, injury, retrievedArticles);
      case 'VPPL_4_ELEMENTS':
        return this.solveDynamicVppl(query, actors, money, injury, ageInfo, retrievedArticles);
      case 'TRUE_FALSE':
        return this.solveDynamicTrueFalse(query, retrievedArticles);
      case 'CIVIL_INHERIT':
        return this.solveDynamicCivilInherit(query, actors, money);
      case 'CRIMINAL_AGE':
        return this.solveDynamicCriminalAge(query, actors, ageInfo);
      case 'QPPL_STRUCT':
        return this.solveDynamicQppl(query, retrievedArticles);
      case 'FAMILY_LAW':
        return this.solveDynamicFamilyLaw(query, actors, retrievedArticles);
      default:
        return this.solveDynamicGeneralTheory(query, retrievedArticles);
    }
  }

  // --- DẠNG 1: VPPL 4 YẾU TỐ ĐỘNG ---
  private static solveDynamicVppl(
    query: string,
    actors: string[],
    money: string | null,
    injury: string | null,
    ageInfo: { age?: number; dob?: string },
    articles: ILawArticle[]
  ): string {
    const qLower = query.toLowerCase();

    // Tình huống điển hình: Đập phá đồ đạc do xích mích hàng xóm / nói xấu (Bà A, bà B, anh C)
    if (
      (qLower.includes('đập phá') || qLower.includes('hủy hoại')) &&
      (qLower.includes('đồ đạc') || qLower.includes('nói xấu') || qLower.includes('xích mích') || qLower.includes('hàng xóm'))
    ) {
      return this.solveDynamicPropertyDestructionCase(query);
    }

    // Tự động phát hiện chủ thể thực hiện hành vi vi phạm dựa trên vị trí gần từ khóa hành vi
    const actionVerbs = ['đập phá', 'hủy hoại', 'trộm', 'cướp', 'chiếm đoạt', 'đánh', 'gây thương tích', 'chém', 'giết', 'vượt đèn', 'gây tai nạn', 'lừa đảo'];
    let bestActor = '';
    let minDistance = 9999;
    for (const verb of actionVerbs) {
      const vIdx = qLower.indexOf(verb);
      if (vIdx !== -1) {
        for (const act of actors) {
          const actLower = act.toLowerCase();
          const aIdx = qLower.lastIndexOf(actLower, vIdx);
          if (aIdx !== -1 && (vIdx - aIdx) < minDistance) {
            minDistance = vIdx - aIdx;
            bestActor = act;
          }
        }
      }
    }

    const actorA = bestActor || actors[0] || 'Chủ thể thực hiện hành vi';
    const otherActors = actors.filter((a) => a !== actorA);
    const actorB = otherActors[0] || 'Bên bị thiệt hại';

    let actionDesc = 'Hành vi vi phạm pháp luật được nêu trong tình huống';
    let objectDesc = 'Trật tự an toàn xã hội và các quan hệ xã hội được pháp luật bảo vệ';
    let lawClause = 'Quy định pháp luật hiện hành';
    let faultType = 'Lỗi cố ý trực tiếp';

    if (qLower.includes('trộm cắp') || qLower.includes('trộm')) {
      actionDesc = `Hành vi lén lút, bí mật chiếm đoạt tài sản của ${actorB}${money ? ` có giá trị ${money}` : ''}`;
      objectDesc = 'Quyền sở hữu tài sản hợp pháp của công dân (được Hiến pháp 2013 và Bộ luật Hình sự bảo vệ)';
      lawClause = 'Điều 173 Bộ luật Hình sự 2015 (sửa đổi 2017) về Tội trộm cắp tài sản';
      faultType = 'Lỗi cố ý trực tiếp (mong muốn chiếm đoạt tài sản làm của riêng)';
    } else if (qLower.includes('cướp')) {
      actionDesc = `Hành vi dùng vũ lực hoặc đe dọa dùng vũ lực ngay tức khắc nhằm chiếm đoạt tài sản của ${actorB}`;
      objectDesc = 'Quyền sở hữu tài sản và quyền bất khả xâm phạm về sức khỏe, tính mạng của con người';
      lawClause = 'Điều 168 Bộ luật Hình sự 2015 về Tội cướp tài sản';
      faultType = 'Lỗi cố ý trực tiếp';
    } else if (qLower.includes('vượt đèn đỏ') || qLower.includes('tai nạn') || qLower.includes('xe máy') || qLower.includes('ô tô')) {
      actionDesc = `Hành vi điều khiển phương tiện tham gia giao thông không chấp hành tín hiệu/quy tắc an toàn, gây va chạm làm hư hỏng tài sản${money ? ` (thiệt hại ${money})` : ''}`;
      objectDesc = 'Trật tự an toàn giao thông đường bộ và quyền sở hữu tài sản hợp pháp của người tham gia giao thông';
      lawClause = 'Nghị định 100/2019/NĐ-CP (sửa đổi bởi Nghị định 123/2021/NĐ-CP) và Điều 584, Điều 601 Bộ luật Dân sự 2015';
      faultType = 'Lỗi cố ý đối với hành vi vi phạm quy tắc giao thông, lỗi vô ý đối với hậu quả thiệt hại tài sản';
    } else if (qLower.includes('thương tích') || qLower.includes('đánh') || qLower.includes('gậy') || qLower.includes('hung khí')) {
      actionDesc = `Hành vi dùng vũ lực/hung khí tấn công gây tổn thương cơ thể cho ${actorB}${injury ? ` với tỷ lệ thương tích ${injury}` : ''}`;
      objectDesc = 'Quyền bất khả xâm phạm về tính mạng, sức khỏe của con người (được Hiến pháp và pháp luật hình sự bảo vệ tuyệt đối)';
      lawClause = 'Điều 134 Bộ luật Hình sự 2015 về Tội cố ý gây thương tích hoặc gây tổn hại cho sức khỏe của người khác';
      faultType = 'Lỗi cố ý trực tiếp (nhận thức rõ hành vi nguy hiểm và mong muốn hậu quả thương tích xảy ra)';
    } else if (qLower.includes('đập phá') || qLower.includes('hủy hoại')) {
      actionDesc = `Hành vi dùng sức mạnh cơ học hoặc công cụ đập phá, làm hư hỏng đồ đạc, tài sản của ${actorB}${money ? ` có giá trị ${money}` : ''}`;
      objectDesc = 'Quyền sở hữu tài sản hợp pháp của công dân (được Điều 178 BLHS 2015 và Điều 584, Điều 589 BLDS 2015 bảo vệ)';
      lawClause = 'Điều 178 Bộ luật Hình sự 2015 hoặc Điểm a Khoản 2 Điều 15 Nghị định 144/2021/NĐ-CP và Điều 584, Điều 589 BLDS 2015';
      faultType = 'Lỗi cố ý trực tiếp (nhận thức rõ hành vi đập phá là trái pháp luật và mong muốn làm hư hại tài sản)';
    }

    const citedLaw = articles.length > 0 ? `Điều ${articles[0].articleNumber} ${articles[0].lawName}` : lawClause;

    return `### I. KẾT LUẬN SƠ BỘ VỀ HÀNH VI
Hành vi của **${actorA}** trong tình huống có đầy đủ các dấu hiệu cấu thành **Vi phạm pháp luật** theo quy định của pháp luật Việt Nam.

---

### II. BẢNG PHÂN TÍCH 4 YẾU TỐ CẤU THÀNH VI PHẠM PHÁP LUẬT
*(Theo đúng khung Barem chuẩn môn Pháp luật Đại cương - Bộ GD&ĐT)*

| Yếu tố cấu thành | Nội dung phân tích cụ thể trong tình huống | Ý nghĩa & Căn cứ pháp lý |
| :--- | :--- | :--- |
| **1. Mặt khách quan** | • **Hành vi trái pháp luật**: ${actionDesc}.<br>• **Hậu quả thiệt hại**: ${money ? `Gây thiệt hại về tài sản trị giá ${money}` : injury ? `Gây thương tổn sức khỏe với tỷ lệ ${injury}` : 'Xâm phạm trực tiếp đến quyền và lợi ích hợp pháp của người bị hại'}.<br>• **Mối quan hệ nhân quả**: Hành vi trái pháp luật của ${actorA} là nguyên nhân trực tiếp, tất yếu dẫn đến hậu quả thiệt hại xảy ra.<br>• **Công cụ, phương tiện**: Thể hiện cụ thể trong diễn biến tình huống. | Biểu hiện ra thế giới khách quan, xác định mức độ nguy hiểm cho xã hội của hành vi. |
| **2. Mặt chủ quan** | • **Hình thức lỗi**: **${faultType}**.<br>- *Về lý trí*: Chủ thể nhận thức được tính chất nguy hiểm cho xã hội của hành vi.<br>- *Về ý chí*: Chủ thể mong muốn hoặc để mặc cho hậu quả xảy ra.<br>• **Động cơ, mục đích**: Thể hiện thái độ tâm lý chủ quan khi thực hiện hành vi vi phạm. | Phản ánh trạng thái tâm lý bên trong của người vi phạm đối với hành vi và hậu quả do mình gây ra. |
| **3. Khách thể** | Xâm phạm trực tiếp đến: **${objectDesc}**. | Xác định loại quan hệ xã hội được pháp luật bảo vệ bị xâm hại. |
| **4. Chủ thể** | **${actorA}**${ageInfo.age ? ` (${ageInfo.age} tuổi)` : ''}: Có đầy đủ năng lực trách nhiệm pháp lý, đạt độ tuổi luật định, không thuộc trường hợp mất khả năng nhận thức hoặc điều khiển hành vi. | Đạt độ tuổi và có năng lực trách nhiệm pháp lý theo luật định. |

---

### III. KẾT LUẬN & TRÁCH NHIỆM PHÁP LÝ ÁP DỤNG
- **Căn cứ pháp lý xác định**: **${citedLaw}**.
- **Chế tài áp dụng**: Chủ thể phải chịu trách nhiệm pháp lý tương ứng và có trách nhiệm **bồi thường toàn bộ thiệt hại thực tế phát sinh** theo quy định của **Bộ luật Dân sự 2015**.`;
  }

  // --- DẠNG 2: NHẬN ĐỊNH ĐÚNG / SAI ĐỘNG (HỖ TRỢ ĐƠN Ý VÀ ĐA Ý) ---
  private static solveDynamicTrueFalse(query: string, articles: ILawArticle[]): string {
    // 1. Tách các nhận định nếu người dùng nhập nhiều câu (1. ... 2. ...)
    const statements = this.extractMultiStatements(query);
    if (statements.length > 1) {
      const results = statements.map((stmt, idx) => {
        const sol = this.evaluateSingleStatement(stmt, articles);
        return `#### ${idx + 1}. Nhận định: "${stmt}"\n${sol}`;
      });
      return `### GIẢI ĐÁP CHI TIẾT CÁC NHẬN ĐỊNH ĐÚNG / SAI\n\n---\n\n${results.join('\n\n---\n\n')}`;
    }

    // 2. Nếu là nhận định đơn lẻ
    const singleStmt = statements.length === 1 ? statements[0] : query;
    const singleResult = this.evaluateSingleStatement(singleStmt, articles);
    return `### KẾT LUẬN VÀ GIẢI ĐÁP CHI TIẾT:\n\n${singleResult}`;
  }

  /**
   * Bộ trích xuất danh sách các câu nhận định khi người dùng hỏi nhiều câu trong 1 lượt
   */
  private static extractMultiStatements(query: string): string[] {
    const rawLines = query.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const statements: string[] = [];
    let currentStmt = '';

    for (const line of rawLines) {
      const lower = line.toLowerCase();
      // Bỏ qua dòng tiêu đề giới thiệu
      if (
        (lower.includes('đúng hay sai') || lower.includes('đúng/sai') || lower.includes('giải thích ngắn gọn') || lower.includes('cho biết nhận định') || lower.includes('các nhận định sau')) &&
        !line.match(/^(?:\d+[\.\/\)]|\([0-9a-zA-Z]\)|[a-zA-Z][\.\)]|nhận định\s*\d+:?|câu\s*\d+:?)/i)
      ) {
        continue;
      }

      const match = line.match(/^(?:(?:\d+[\.\/\)]|\([0-9a-zA-Z]\)|[a-zA-Z][\.\)]|nhận định\s*\d+:?|câu\s*\d+:?))\s*(.+)$/i);
      if (match) {
        if (currentStmt) statements.push(currentStmt.trim());
        currentStmt = match[1];
      } else if (currentStmt) {
        currentStmt += ' ' + line;
      }
    }
    if (currentStmt) statements.push(currentStmt.trim());

    // Nếu không tách được theo dòng, thử tách inline theo số thứ tự (1. ... 2. ...) hoặc chữ cái (a. ... b. ...)
    if (statements.length < 2) {
      try {
        const inlineRegex = /(?:(?:^|\s)(?:\d+[./)]|[a-eA-E][./)]|\([a-eA-E0-9]\)|nhận định\s*\d+:?|câu\s*\d+:?))\s*([^0-9\n][^\n]+?)(?=(?:\s+\d+[./)]|\s+[a-eA-E][./)]|\s+\([a-eA-E0-9]\)|\s+nhận định\s*\d+:?|\s+câu\s*\d+:?|$))/gi;
        const inlineMatches = query.match(inlineRegex);
        if (inlineMatches && inlineMatches.length >= 2) {
          return inlineMatches
            .map((s) => s.replace(/^(?:\s*\d+[./)]|\s*[a-eA-E][./)]|\s*\([a-eA-E0-9]\)|\s*nhận định\s*\d+:?|\s*câu\s*\d+:?)\s*/i, '').trim())
            .filter((s) => s.length > 5);
        }
      } catch (err) {
        console.warn('⚠️ [extractMultiStatements] Lỗi tách inline:', err);
      }
    }

    return statements;
  }

  /**
   * Đánh giá chuyên sâu 1 câu nhận định pháp lý với căn cứ thực định chuẩn xác
   */
  private static evaluateSingleStatement(stmt: string, articles: ILawArticle[]): string {
    const sLower = stmt.toLowerCase().trim();

    // 0.0.0.a. Nhận định: Mọi văn bản có chứa quy phạm pháp luật đều là văn bản QPPL
    if (
      sLower.includes('văn bản có chứa quy phạm') ||
      (sLower.includes('chứa quy phạm pháp luật') && (sLower.includes('đều là văn bản') || sLower.includes('là văn bản quy phạm')))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Cơ sở pháp lý theo Luật Ban hành VBQPPL 2015 (sửa đổi, bổ sung 2020) & Giáo trình Pháp luật Đại cương (Mục 2.3.3)**:
  1. *Điều kiện để một văn bản là Văn bản quy phạm pháp luật*:
     Theo Điều 2 và Điều 3 Luật Ban hành VBQPPL 2015, một văn bản muốn trở thành VBQPPL phải thỏa mãn **đồng thời cả 4 điều kiện cốt lõi**:
     - Do đúng cơ quan nhà nước, người có thẩm quyền ban hành theo luật định.
     - Phải có hình thức, tên gọi đúng quy định tại Điều 4 (Hiến pháp, Bộ luật, Luật, Nghị quyết, Nghị định, Thông tư...).
     - Phải được ban hành theo đúng trình tự, thủ tục chặt chẽ luật định.
     - Chứa đựng các quy phạm pháp luật (quy tắc xử sự chung).
  2. *Trường hợp văn bản chứa QPPL nhưng KHÔNG PHẢI là VBQPPL*:
     - Nếu một văn bản có chứa quy phạm pháp luật nhưng do cơ quan không có thẩm quyền ban hành, hoặc ban hành sai hình thức (ví dụ: Công văn, Chỉ thị, Thông báo... nhưng lại đặt ra quy tắc xử sự chung áp dụng cho toàn dân) thì văn bản đó **không được coi là VBQPPL hợp pháp**, mà là văn bản trái pháp luật và bị đình chỉ, hủy bỏ theo Khoản 2 Điều 14 Luật Ban hành VBQPPL 2015.
  ➔ **KẾT LUẬN**: Nhận định khẳng định "mọi văn bản có chứa QPPL đều là VBQPPL" là SAI.`;
    }

    // 0.0.0.b. Nhận định: Văn bản QPPL chỉ áp dụng đối với hành vi xảy ra sau khi văn bản có hiệu lực (hiệu lực hồi tố)
    if (
      sLower.includes('chỉ áp dụng đối với hành vi xảy ra sau khi') ||
      sLower.includes('chỉ áp dụng đối với hành vi xảy ra sau') ||
      (sLower.includes('xảy ra sau khi văn bản có hiệu lực') && sLower.includes('chỉ')) ||
      (sLower.includes('hiệu lực trở về trước') && sLower.includes('không bao giờ'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Căn cứ pháp lý theo Điều 152 Luật Ban hành VBQPPL 2015 & Giáo trình Pháp luật Đại cương (Mục 2.3.4 - Hiệu lực của VBQPPL)**:
  1. *Nguyên tắc chung*:
     Hiệu lực về thời gian của VBQPPL là áp dụng đối với các quan hệ xã hội phát sinh kể từ thời điểm văn bản có hiệu lực trở đi.
  2. *Ngoại lệ: Hiệu lực trở về trước (Hiệu lực hồi tố)*:
     Khoản 1 Điều 152 Luật Ban hành VBQPPL 2015 quy định: Chỉ trong trường hợp thật cần thiết để bảo đảm lợi ích chung của xã hội, thực hiện các quyền, lợi ích của tổ chức, cá nhân được quy định trong luật, nghị quyết của Quốc hội, VBQPPL của cơ quan trung ương mới được quy định hiệu lực trở về trước.
  3. *Nguyên tắc nhân đạo trong luật hình sự*:
     Điều 7 Bộ luật Hình sự 2015 quy định: Điều luật xóa bỏ một tội phạm, một hình phạt, một tình tiết tăng nặng, quy định một hình phạt nhẹ hơn, một tình tiết giảm nhẹ mới hoặc mở rộng phạm vi áp dụng án treo, miễn trách nhiệm hình sự... thì **ĐƯỢC ÁP DỤNG ĐỐI VỚI HÀNH VI PHẠM TỘI ĐÃ THỰC HIỆN TRƯỚC KHI ĐIỀU LUẬT ĐÓ CÓ HIỆU LỰC THI HÀNH** (hồi tố có lợi).
  ➔ **KẾT LUẬN**: Pháp luật vẫn thừa nhận hiệu lực hồi tố trong những trường hợp đặc biệt có lợi cho đối tượng áp dụng. Từ "CHỈ" làm cho nhận định trở nên phiến diện và SAI.`;
    }

    // 0.0.0.c. Nhận định: Quy phạm pháp luật là hình thức thể hiện của quan hệ pháp luật
    if (
      (sLower.includes('quy phạm pháp luật') || sLower.includes('qppl')) &&
      sLower.includes('quan hệ pháp luật') &&
      (sLower.includes('hình thức thể hiện của') || sLower.includes('là hình thức thể hiện'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Cơ sở lý luận môn Pháp luật Đại cương (Chương 3, Mục 3.1 & 3.2)**:
  1. *Bản chất của Quy phạm pháp luật*:
     Quy phạm pháp luật là **tiền đề pháp lý khách quan**, là mô hình ứng xử trừu tượng do nhà nước đặt ra trước để điều chỉnh các quan hệ xã hội. Không có QPPL dự liệu thì không thể có quan hệ pháp luật phát sinh.
  2. *Mối quan hệ đúng đắn giữa QPPL và Quan hệ pháp luật*:
     - **Quan hệ pháp luật chính là hình thức thực tế hóa, là kết quả cụ thể** của việc đưa các quy phạm pháp luật vào đời sống xã hội khi có sự kiện pháp lý xảy ra.
     - Ngược lại, hình thức biểu hiện của quan hệ pháp luật là sự tương tác cụ thể về quyền chủ thể và nghĩa vụ pháp lý giữa các bên tham gia (được thể hiện qua hợp đồng, văn bản cam kết, thỏa thuận...).
     - QPPL không phải là "hình thức thể hiện" của quan hệ pháp luật mà là tiền đề pháp lý trực tiếp quy định nội dung cho quan hệ pháp luật.
  ➔ **KẾT LUẬN**: Nhận định đã đảo ngược bản chất lý luận giữa tiền đề pháp lý (QPPL) và kết quả thực tế (QHPL). Nhận định trên là SAI.`;
    }

    // 0.0.0.d. Nhận định: Năng lực pháp luật và năng lực hành vi của cá nhân xuất hiện đồng thời
    if (
      (sLower.includes('năng lực pháp luật') && sLower.includes('năng lực hành vi')) &&
      (sLower.includes('xuất hiện đồng thời') || sLower.includes('cùng xuất hiện') || sLower.includes('ra đời đồng thời') || sLower.includes('đồng thời phát sinh'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI (ĐỐI VỚI CÁ NHÂN).**
- **Cơ sở pháp lý theo Điều 16, Điều 19 Bộ luật Dân sự 2015 & Giáo trình Pháp luật Đại cương (Mục 3.1.2)**:
  1. *Thời điểm xuất hiện của Năng lực pháp luật của cá nhân*:
     Căn cứ Khoản 3 Điều 16 BLDS 2015: Năng lực pháp luật dân sự của cá nhân **xuất hiện ngay từ khi người đó sinh ra** và chỉ chấm dứt khi người đó chết (mọi cá nhân đều bình đẳng về năng lực pháp luật).
  2. *Thời điểm xuất hiện và phát triển của Năng lực hành vi của cá nhân*:
     Năng lực hành vi của cá nhân **KHÔNG XUẤT HIỆN ĐỒNG THỜI KHI SINH RA**, mà phụ thuộc vào độ tuổi và khả năng nhận thức, phát triển dần theo các giai đoạn luật định:
     - Dưới 6 tuổi: Chưa có năng lực hành vi dân sự.
     - Từ đủ 6 tuổi đến chưa đủ 15 tuổi: Có năng lực hành vi một phần (giao dịch nhỏ phục vụ sinh hoạt hàng ngày).
     - Từ đủ 15 tuổi đến chưa đủ 18 tuổi: Tự mình xác lập, thực hiện một số giao dịch nếu có tài sản riêng.
     - Từ đủ 18 tuổi trở lên: Có năng lực hành vi đầy đủ (trừ trường hợp mất/hạn chế NLHV theo quyết định của Tòa án).
  3. *Lưu ý*:
     Chỉ đối với **PHÁP NHÂN** thì Năng lực pháp luật và Năng lực hành vi mới xuất hiện đồng thời (kể từ thời điểm được thành lập hoặc cấp phép đăng ký kinh doanh). Đối với cá nhân, khẳng định xuất hiện đồng thời là hoàn toàn sai.
  ➔ **KẾT LUẬN**: Nhận định trên là HOÀN TOÀN SAI.`;
    }

    // 0.0.0.e. Nhận định: Mọi quan hệ xã hội được pháp luật điều chỉnh đều là quan hệ pháp luật
    if (
      (sLower.includes('mọi quan hệ xã hội') || sLower.includes('các quan hệ xã hội')) &&
      sLower.includes('được pháp luật điều chỉnh') &&
      (sLower.includes('đều là quan hệ pháp luật') || sLower.includes('trở thành quan hệ pháp luật') || sLower.includes('là quan hệ pháp luật'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ ĐÚNG.**
- **Cơ sở lý luận theo Giáo trình Pháp luật Đại cương (Chương 3, Mục 3.1 - Quan hệ pháp luật)**:
  1. *Định nghĩa Quan hệ pháp luật*:
     Quan hệ pháp luật là các quan hệ xã hội được các quy phạm pháp luật điều chỉnh, trong đó các bên tham gia có các quyền chủ thể và nghĩa vụ pháp lý xác định được Nhà nước bảo đảm thực hiện.
  2. *Phân tích logic*:
     - Các quan hệ xã hội trong đời sống vô cùng phong phú (tình bạn, tình yêu, phong tục tập quán, đạo đức...).
     - Khi một quan hệ xã hội được Nhà nước ban hành quy phạm pháp luật để điều chỉnh (xác định rõ quyền, nghĩa vụ và chế tài bảo đảm của nhà nước) thì quan hệ xã hội đó đã khoác lên mình "chiếc áo pháp lý" và chính thức trở thành **Quan hệ pháp luật**.
     - Ví dụ: Quan hệ trao đổi tài sản thông thường khi được pháp luật dân sự điều chỉnh thì trở thành Quan hệ hợp đồng mua bán tài sản (QHPL dân sự); quan hệ hôn nhân khi được luật điều chỉnh trở thành Quan hệ hôn nhân và gia đình.
  ➔ **KẾT LUẬN**: Nhận định trên là HOÀN TOÀN ĐÚNG.`;
    }

    // 0.0. Nhận định: Nhà nước và pháp luật chỉ ra đời trong xã hội có phân chia giai cấp
    if (
      sLower.includes('nhà nước') &&
      sLower.includes('pháp luật') &&
      sLower.includes('giai cấp') &&
      (sLower.includes('chỉ ra đời') || sLower.includes('ra đời trong') || sLower.includes('chỉ xuất hiện') || sLower.includes('phân chia giai cấp'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ ĐÚNG.**
- **Cơ sở lý luận theo Chủ nghĩa Mác - Lênin & Giáo trình Pháp luật Đại cương (Bộ GD&ĐT)**:
  1. *Nhà nước và Pháp luật không phải là hiện tượng vĩnh cửu*:
     Trong xã hội Cộng sản nguyên thủy (thời kỳ thị tộc, bộ lạc), do lực lượng sản xuất chưa phát triển, tư liệu sản xuất thuộc sở hữu chung của toàn thị tộc (công hữu), xã hội chưa có người bóc lột người, chưa có sự phân chia giai cấp đối kháng nên **hoàn toàn chưa có Nhà nước và Pháp luật**.
  2. *Điều kiện kinh tế và xã hội dẫn đến sự ra đời*:
     Qua ba lần phân công lao động xã hội lớn, năng suất lao động tăng dẫn đến của cải dư thừa, chế độ tư hữu về tư liệu sản xuất xuất hiện (tiền đề kinh tế). Xã hội phân hóa thành các giai cấp đối kháng có lợi ích mâu thuẫn gay gắt không thể điều hòa được (tiền đề xã hội).
  3. *Sự xuất hiện tất yếu khách quan*:
     Để xã hội không tự tiêu diệt trong cuộc đấu tranh giai cấp khốc liệt đó, giai cấp thống trị đã thiết lập nên **Nhà nước** (bộ máy quyền lực công cộng đặc biệt) và ban hành **Pháp luật** (hệ thống quy tắc xử sự có tính bắt buộc chung) để duy trì trật tự và bảo vệ quyền lợi của giai cấp mình.
  ➔ **Như vậy**: Nhà nước và pháp luật là hai hiện tượng thuộc kiến trúc thượng tầng, chỉ ra đời, tồn tại và sẽ tiêu vong cùng với những điều kiện khách quan của xã hội có phân chia giai cấp. Nhận định trên là hoàn toàn ĐÚNG.`;
    }

    // 0.0.0.1. Nhận định: Mọi hành vi thực hiện pháp luật đều được thực hiện dưới dạng hành động
    if (
      sLower.includes('thực hiện pháp luật') &&
      (sLower.includes('dạng hành động') || sLower.includes('dưới dạng hành động') || (sLower.includes('hành động') && sLower.includes('không hành động')) || sLower.includes('đều được thực hiện dưới dạng') || sLower.includes('đều là hành vi hành động'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Cơ sở lý luận môn Pháp luật Đại cương (Chương 3, Mục 3.2.1 - Bộ GD&ĐT)**:
  Thực hiện pháp luật là quá trình hoạt động có mục đích làm cho những quy định của pháp luật đi vào đời sống thực tế, bao gồm **4 hình thức cơ bản** với phương thức thể hiện hành vi khác nhau:
  1. *Tuân thủ pháp luật (Tuân theo pháp luật)*:
     - Các chủ thể kiềm chế không thực hiện những hành vi mà pháp luật cấm.
     - Hình thức này **LUÔN ĐƯỢC THỰC HIỆN DƯỚI DẠNG KHÔNG HÀNH ĐỘNG** (ví dụ: không vượt đèn đỏ, không nhận hối lộ, không buôn bán chất ma túy).
  2. *Thi hành pháp luật (Chấp hành pháp luật)*:
     - Các chủ thể thực hiện nghĩa vụ pháp lý bằng những hành vi tích cực mà pháp luật bắt buộc phải làm.
     - Hình thức này **ĐƯỢC THỰC HIỆN DƯỚI DẠNG HÀNH ĐỘNG TÍCH CỰC** (ví dụ: nộp thuế đầy đủ, đăng ký nghĩa vụ quân sự, đội mũ bảo hiểm).
  3. *Sử dụng pháp luật*:
     - Các chủ thể tự mình quyết định thực hiện quyền chủ thể (làm những gì pháp luật cho phép).
     - Có thể thực hiện dưới dạng **HÀNH ĐỘNG** (đăng ký kinh doanh, lập di chúc) hoặc **KHÔNG HÀNH ĐỘNG** (từ chối nhận di sản, không khiếu nại).
  4. *Áp dụng pháp luật*:
     - Do cơ quan nhà nước hoặc người có thẩm quyền tiến hành nhân danh quyền lực nhà nước ban hành văn bản áp dụng pháp luật cá biệt.
  ➔ **KẾT LUẬN**: Khẳng định "mọi hành vi thực hiện pháp luật đều được thực hiện dưới dạng hành động" là hoàn toàn SAI, vì hình thức Tuân thủ pháp luật luôn ở dạng không hành động.`;
    }

    // 0.0.0.2. Nhận định: Nhà nước phong kiến là nhà nước đã từng tồn tại trong lịch sử
    if (
      (sLower.includes('nhà nước phong kiến') || sLower.includes('kiểu nhà nước phong kiến')) &&
      (sLower.includes('tồn tại') || sLower.includes('lịch sử') || sLower.includes('từng tồn tại') || sLower.includes('trong lịch sử'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ ĐÚNG.**
- **Cơ sở lý luận theo Học thuyết Mác - Lênin & Giáo trình Pháp luật Đại cương (Chương 1, Mục 1.1.6 - Bộ GD&ĐT)**:
  1. *Khái niệm kiểu Nhà nước*:
     Kiểu nhà nước là tổng thể các đặc điểm cơ bản của nhà nước thể hiện bản chất giai cấp, vai trò xã hội và những điều kiện kinh tế - xã hội của nhà nước trong một hình thái kinh tế - xã hội nhất định.
  2. *Bốn kiểu Nhà nước trong lịch sử nhân loại*:
     Lịch sử xã hội loài người có giai cấp đã và đang trải qua 4 kiểu nhà nước:
     - **Kiểu Nhà nước Chủ nô**: Nhà nước đầu tiên trong lịch sử, đại diện cho giai cấp chủ nô để bóc lột giai cấp nô lệ.
     - **Kiểu Nhà nước Phong kiến**: Thay thế nhà nước chủ nô, xác lập trên quan hệ sở hữu phong kiến về ruộng đất và phương thức bóc lột địa tô của giai cấp địa chủ, phong kiến đối với nông dân. Nhà nước này đã từng tồn tại trong lịch sử nhiều thế kỷ ở cả phương Đông và phương Tây (tại Việt Nam tồn tại qua các triều đại Ngô, Đinh, Tiền Lê, Lý, Trần, Lê đến hết triều Nguyễn năm 1945).
     - **Kiểu Nhà nước Tư sản**: Ra đời sau các cuộc cách mạng tư sản, dựa trên chế độ tư hữu tư bản chủ nghĩa.
     - **Kiểu Nhà nước Xã hội chủ nghĩa**: Ra đời từ sau Cách mạng Tháng Mười Nga 1917, là kiểu nhà nước tiến bộ nhất của Nhân dân lao động.
  ➔ **KẾT LUẬN**: Nhà nước phong kiến là một kiểu nhà nước cụ thể, khách quan và đã từng tồn tại lâu dài trong lịch sử phát triển của nhân loại. Nhận định trên là hoàn toàn ĐÚNG.`;
    }

    // 0.0.0.3. Nhận định: Thủ tướng là người đứng đầu cơ quan quyền lực của nhà nước CHXHCN Việt Nam
    if (
      (sLower.includes('thủ tướng') || sLower.includes('thủ tướng chính phủ')) &&
      (sLower.includes('cơ quan quyền lực') || sLower.includes('đứng đầu cơ quan quyền lực'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Căn cứ Hiến pháp 2013 (Điều 69, Điều 94, Điều 95) & Giáo trình Pháp luật Đại cương (Chương 1, Mục 1.2.3 - Bộ máy Nhà nước)**:
  1. *Về Cơ quan quyền lực nhà nước theo Hiến pháp 2013*:
     - Cơ quan quyền lực nhà nước cao nhất của nước CHXHCN Việt Nam là **QUỐC HỘI** (Điều 69 Hiến pháp 2013: Quốc hội là cơ quan đại biểu cao nhất của Nhân dân, cơ quan quyền lực nhà nước cao nhất). Người đứng đầu Quốc hội là **Chủ tịch Quốc hội**.
     - Ở địa phương, cơ quan quyền lực nhà nước là **Hội đồng nhân dân** (HĐND các cấp tỉnh, huyện, xã), do Chủ tịch HĐND đứng đầu.
  2. *Về Vị trí pháp lý của Thủ tướng Chính phủ*:
     - Theo Điều 94 và Điều 95 Hiến pháp 2013: **Chính phủ** là cơ quan **HÀNH CHÍNH NHÀ NƯỚC CAO NHẤT**, thực hiện quyền hành pháp, là cơ quan chấp hành của Quốc hội.
     - **Thủ tướng Chính phủ** là người đứng đầu Chính phủ (cơ quan hành chính), chịu trách nhiệm trước Quốc hội về hoạt động của Chính phủ.
  ➔ **KẾT LUẬN**: Thủ tướng Chính phủ là người đứng đầu **cơ quan hành chính nhà nước cao nhất** (Chính phủ), KHÔNG PHẢI là người đứng đầu cơ quan quyền lực nhà nước (Quốc hội). Nhận định đã đồng nhất sai lệch giữa nhánh quyền lực lập pháp (quyền lực nhà nước) và nhánh hành pháp (hành chính). Nhận định trên là HOÀN TOÀN SAI.`;
    }

    // 0.0.0.4. Nhận định: Người đủ 18 tuổi trở lên thì có hành vi năng lực đầy đủ (năng lực hành vi đầy đủ)
    if (
      (sLower.includes('18 tuổi') || sLower.includes('đủ 18 tuổi')) &&
      (sLower.includes('năng lực hành vi') || sLower.includes('hành vi năng lực') || sLower.includes('năng lực đầy đủ'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI (CHƯA CHÍNH XÁC NẾU KHẲNG ĐỊNH TUYỆT ĐỐI).**
- **Căn cứ pháp lý theo Bộ luật Dân sự 2015 (Điều 19, 20, 22, 23, 24) & Giáo trình Pháp luật Đại cương (Chương 4, Mục 4.2.1)**:
  1. *Nguyên tắc chung (Điều 19, Điều 20 BLDS 2015)*:
     Người từ đủ 18 tuổi trở lên là người thành niên và theo nguyên tắc chung có năng lực hành vi dân sự đầy đủ, tự mình xác lập, thực hiện quyền và nghĩa vụ dân sự.
  2. *Các trường hợp luật định loại trừ / hạn chế (Ngoại lệ)*:
     Khẳng định mang tính tuyệt đối hóa "người đủ 18 tuổi trở lên thì có năng lực hành vi đầy đủ" là SAI vì pháp luật quy định các trường hợp ngoại lệ người đã đủ 18 tuổi nhưng **KHÔNG CÓ** năng lực hành vi đầy đủ:
     - **Mất năng lực hành vi dân sự (Điều 22 BLDS 2015)**: Người từ đủ 18 tuổi trở lên do bị bệnh tâm thần hoặc bệnh khác mà không thể nhận thức, làm chủ hành vi của mình thì theo yêu cầu của người có quyền, lợi ích liên quan, Tòa án ra quyết định tuyên bố mất năng lực hành vi dân sự. Giao dịch của người này phải do người đại diện theo pháp luật xác lập, thực hiện.
     - **Người có khó khăn trong nhận thức, làm chủ hành vi (Điều 23 BLDS 2015)**: Người thành niên do tình trạng thể chất hoặc tinh thần mà không đủ khả năng nhận thức, làm chủ hành vi nhưng chưa đến mức mất năng lực hành vi dân sự thì được Tòa án tuyên bố có khó khăn trong nhận thức, làm chủ hành vi và chỉ định người giám hộ.
     - **Hạn chế năng lực hành vi dân sự (Điều 24 BLDS 2015)**: Người nghiện ma túy, nghiện các chất kích thích khác dẫn đến phá tán tài sản của gia đình thì theo yêu cầu của người có quyền, lợi ích liên quan, Tòa án ra quyết định tuyên bố bị hạn chế năng lực hành vi dân sự.
  ➔ **KẾT LUẬN**: Vì tồn tại các trường hợp ngoại lệ (bị Tòa án tuyên bố mất NLHV, hạn chế NLHV hoặc có khó khăn trong nhận thức), một cá nhân dù từ đủ 18 tuổi trở lên không đương nhiên luôn có năng lực hành vi đầy đủ. Nhận định mang tính khẳng định tuyệt đối là SAI.`;
    }

    // 0.0.1. Nhận định: Quyền lực nhà nước và quyền lực xã hội là giống nhau
    if (
      sLower.includes('quyền lực nhà nước') &&
      sLower.includes('quyền lực xã hội') &&
      (sLower.includes('giống nhau') || sLower.includes('đồng nhất') || sLower.includes('như nhau') || sLower.includes('là một'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Cơ sở lý luận phân biệt theo Giáo trình Pháp luật Đại cương (Mục 1.1.7 - Bộ GD&ĐT)**:
  Quyền lực nhà nước và quyền lực xã hội (trong thị tộc nguyên thủy hoặc của các tổ chức đoàn thể xã hội) là hai loại quyền lực có bản chất, nguồn gốc và đặc trưng hoàn toàn khác nhau:

  | Tiêu chí so sánh | Quyền lực Nhà nước | Quyền lực Xã hội (thị tộc / tổ chức xã hội) |
  | :--- | :--- | :--- |
  | **1. Cơ sở kinh tế & xã hội** | Ra đời trên cơ sở **chế độ tư hữu** và xã hội **phân hóa giai cấp đối kháng**. | Tồn tại trên cơ sở **chế độ công hữu** về tư liệu sản xuất, không có áp bức giai cấp. |
  | **2. Bản chất quyền lực** | Đứng trên xã hội, tách rời khỏi xã hội; mang bản chất giai cấp sâu sắc (phục vụ lợi ích giai cấp thống trị) kết hợp với tính xã hội. | Hòa nhập vào toàn bộ cộng đồng; phục vụ lợi ích chung của tất cả thành viên trong thị tộc, bộ lạc. |
  | **3. Bộ máy thực thi** | Có **bộ máy chuyên nghiệp cưỡng chế đặc biệt** tách rời khỏi sản xuất (quân đội, cảnh sát, tòa án, nhà tù). | Không có bộ máy cưỡng chế riêng; quyền lực do toàn thể cộng đồng tự thực hiện hoặc qua người đứng đầu được bầu tự nguyện (tù trưởng, hội đồng thị tộc). |
  | **4. Công cụ quản lý** | Sử dụng **Pháp luật** có tính quy phạm phổ biến, bắt buộc chung và được bảo đảm bằng sức mạnh cưỡng chế nhà nước. | Dựa trên **tập quán, đạo đức nguyên thủy** hoặc điều lệ tổ chức; thực hiện trên tinh thần tự giác, thuyết phục hoặc dư luận xã hội. |
  | **5. Phạm vi tác động** | Quản lý dân cư theo **đơn vị hành chính - lãnh thổ**, bao trùm toàn bộ các thành viên sinh sống trong quốc gia. | Quản lý theo **quan hệ huyết thống** (thị tộc) hoặc theo sự tự nguyện gia nhập của đoàn viên, hội viên. |

  ➔ **KẾT LUẬN**: Quyền lực nhà nước và quyền lực xã hội là hai hiện tượng khác biệt căn bản về chất. Khẳng định chúng giống nhau là hoàn toàn SAI.`;
    }

    // 0.0.2. Nhận định: Thiệt hại thực tế xảy ra cho xã hội là dấu hiệu bắt buộc trong mặt khách quan của vi phạm pháp luật
    if (
      sLower.includes('thiệt hại thực tế') &&
      sLower.includes('mặt khách quan') &&
      (sLower.includes('dấu hiệu bắt buộc') || sLower.includes('bắt buộc') || sLower.includes('yếu tố bắt buộc'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Cơ sở lý luận môn Pháp luật Đại cương & Khoa học Pháp lý (Chương 5, Mục 5.4)**:
  1. *Các yếu tố thuộc Mặt khách quan của Vi phạm pháp luật*:
     Mặt khách quan bao gồm 4 yếu tố cơ bản: (i) Hành vi trái pháp luật; (ii) Hậu quả thiệt hại cho xã hội; (iii) Mối quan hệ nhân quả giữa hành vi và hậu quả thiệt hại; (iv) Thời gian, địa điểm, công cụ, phương tiện và phương thức thực hiện hành vi.
  2. *Hành vi trái pháp luật là dấu hiệu bắt buộc duy nhất*:
     Trong 4 yếu tố trên, **chỉ có hành vi trái pháp luật mới là dấu hiệu bắt buộc đối với mọi vi phạm pháp luật** (không có hành vi trái luật biểu hiện ra thế giới khách quan thì không có vi phạm pháp luật).
  3. *Hậu quả thiệt hại thực tế KHÔNG PHẢI là dấu hiệu bắt buộc đối với mọi loại vi phạm*:
     Khoa học pháp lý phân chia vi phạm pháp luật theo cấu thành:
     - **Đối với vi phạm có cấu thành vật chất**: Hậu quả thiệt hại thực tế và mối quan hệ nhân quả là dấu hiệu bắt buộc để định tội/định khung (ví dụ: Tội giết người, Tội trộm cắp tài sản - đòi hỏi thiệt hại về tính mạng hoặc tài sản từ 2 triệu đồng trở lên).
     - **Đối với vi phạm có cấu thành hình thức**: Vi phạm pháp luật được coi là hoàn thành ngay từ thời điểm chủ thể thực hiện hành vi nguy hiểm trái luật, **hoàn toàn không đòi hỏi phải có thiệt hại thực tế xảy ra cho xã hội**.
       *Ví dụ thực tiễn*:
       + Tội đua xe trái phép (Điều 266 BLHS 2015), Tội tàng trữ trái phép vũ khí quân dụng (Điều 304 BLHS 2015), Tội cướp tài sản (Điều 168 BLHS 2015) đều hoàn thành ngay khi có hành vi, kể cả khi chưa có thiệt hại tính mạng hay tài sản nào xảy ra.
       + Trong luật giao thông: Hành vi không đội mũ bảo hiểm hoặc vượt đèn đỏ khi tham gia giao thông đã cấu thành vi phạm hành chính ngay tại thời điểm thực hiện hành vi, bất kể có tai nạn hay thiệt hại thực tế nào xảy ra hay không.
  ➔ **KẾT LUẬN**: Khẳng định thiệt hại thực tế xảy ra cho xã hội là dấu hiệu bắt buộc trong mặt khách quan của mọi vi phạm pháp luật là hoàn toàn SAI.`;
    }

    // 0.0.3. Tùy vào các kiểu Nhà nước khác nhau mà bản chất Nhà nước có thể là bản chất giai cấp hoặc bản chất xã hội
    if (sLower.includes('tùy vào các kiểu nhà nước') || (sLower.includes('có thể là bản chất giai cấp hoặc') && sLower.includes('bản chất xã hội'))) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Cơ sở lý luận môn Pháp luật Đại cương (Bộ GD&ĐT)**:
  1. Mọi kiểu Nhà nước trong lịch sử (từ Chiếm hữu nô lệ, Phong kiến, Tư sản đến Xã hội chủ nghĩa) đều luôn mang **đồng thời cả hai thuộc tính cơ bản là Bản chất giai cấp và Bản chất xã hội**.
  2. Không có Nhà nước nào chỉ có tính giai cấp mà không có tính xã hội, hoặc chỉ có tính xã hội mà không có tính giai cấp. Sự khác biệt giữa các kiểu nhà nước chỉ là mức độ biểu hiện và tương quan giữa hai thuộc tính này tùy thuộc vào điều kiện lịch sử cụ thể.`;
    }

    // 0.0.4. Nhà nước mang bản chất giai cấp có nghĩa là Nhà nước chỉ thuộc về một giai cấp
    if (sLower.includes('nhà nước chỉ thuộc về một giai cấp') || (sLower.includes('mang bản chất giai cấp có nghĩa là') && sLower.includes('chỉ thuộc về'))) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Cơ sở lý luận môn Pháp luật Đại cương (Bộ GD&ĐT)**:
  1. Bản chất giai cấp của Nhà nước không chỉ dừng lại ở quyền sở hữu Nhà nước thuộc về ai, mà cốt lõi là Nhà nước là **bộ máy cưỡng chế đặc biệt** của giai cấp thống trị để duy trì sự thống trị về kinh tế, chính trị, tư tưởng đối với các giai cấp khác trong xã hội.
  2. Nhà nước có thể thuộc về một liên minh giai cấp rộng rãi (như Nhà nước CHXHCN Việt Nam là nhà nước của liên minh công nhân - nông dân - đội ngũ trí thức dưới sự lãnh đạo của Đảng Cộng sản).`;
    }

    // 0. Nhận định về Mối quan hệ giữa Nhà nước và Pháp luật (Nhà nước không cần pháp luật / thiếu pháp luật)
    if (
      sLower.includes('nhà nước') &&
      sLower.includes('pháp luật') &&
      (sLower.includes('không cần') || sLower.includes('không có pháp luật') || sLower.includes('thiếu pháp luật') || sLower.includes('tồn tại mà không') || sLower.includes('tại sao nhà nước không thể tồn tại'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Cơ sở lý luận theo Giáo trình Pháp luật Đại cương (Bộ Giáo dục và Đào tạo)**:
  1. *Quan hệ biện chứng gắn bó hữu cơ, không thể tách rời*:
     Trong khoa học pháp lý, Nhà nước và Pháp luật là hai hiện tượng thuộc kiến trúc thượng tầng cùng phát sinh, tồn tại, phát triển và tiêu vong gắn liền với nhau trong xã hội có giai cấp.
     - **Nhà nước sinh ra và bảo đảm cho Pháp luật**: Nhà nước là chủ thể duy nhất ban hành hoặc thừa nhận các quy tắc xử sự thành pháp luật, đồng thời bảo đảm cho pháp luật được thực hiện bằng sức mạnh quyền lực và bộ máy cưỡng chế chuyên nghiệp (quân đội, cảnh sát, tòa án, nhà tù). Nếu không có Nhà nước, pháp luật không thể hình thành và không có giá trị bắt buộc chung.
     - **Pháp luật là công cụ tối cao của Nhà nước**: Pháp luật là phương tiện chủ yếu, sắc bén và hữu hiệu nhất để Nhà nước quản lý mọi mặt của đời sống xã hội.
  2. *Tại sao Nhà nước KHÔNG THỂ tồn tại và phát huy tốt chức năng nếu không có Pháp luật?*
     - **Đối với chức năng quản lý xã hội**: Mọi chủ trương, chính sách quản lý kinh tế, trật tự công cộng, đối nội và đối ngoại của Nhà nước chỉ có thể được triển khai thống nhất, rộng khắp và có hiệu lực bắt buộc đối với toàn thể xã hội khi được thể chế hóa dưới hình thức các quy phạm pháp luật. Không có pháp luật, xã hội sẽ rơi vào tình trạng vô chính phủ, hỗn loạn và Nhà nước lập tức mất khả năng kiểm soát.
     - **Đối với cơ cấu tổ chức bộ máy nhà nước**: Pháp luật là cơ sở pháp lý để quy định cơ cấu tổ chức, chức năng, thẩm quyền và trình tự hoạt động của từng cơ quan trong bộ máy nhà nước; đồng thời đặt ra giới hạn pháp lý nhằm kiềm chế quyền lực nhà nước, ngăn ngừa sự tùy tiện, lạm quyền, độc đoán (nguyên tắc Nhà nước pháp quyền theo **Điều 8 Hiến pháp 2013**).
  ➔ **KẾT LUẬN CUỐI CÙNG**: Nhà nước **hoàn toàn không thể tồn tại và không thể phát huy tốt chức năng** của mình nếu không có pháp luật. Nhận định trên là hoàn toàn SAI.`;
    }

    // 0.01. Nhận định: Tất cả các văn bản do cơ quan nhà nước có thẩm quyền ban hành đều là văn bản QPPL
    if (
      (sLower.includes('văn bản do') || sLower.includes('các văn bản') || sLower.includes('văn bản của')) &&
      (sLower.includes('cơ quan nhà nước') || sLower.includes('cơ quan có thẩm quyền')) &&
      (sLower.includes('đều là') || sLower.includes('chỉ là') || sLower.includes('tất cả')) &&
      (sLower.includes('văn bản quy phạm pháp luật') || sLower.includes('vbqppl') || sLower.includes('quy phạm pháp luật'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Cơ sở lý luận & Barem chuẩn môn Pháp luật đại cương (Bộ GD&ĐT)**:
  Trong hoạt động quản lý nhà nước, các cơ quan nhà nước có thẩm quyền ban hành nhiều loại văn bản khác nhau để thực hiện chức năng, nhiệm vụ của mình. Hệ thống văn bản do cơ quan nhà nước ban hành được phân chia thành **ba loại văn bản cơ bản**:
  1. **Văn bản quy phạm pháp luật (VBQPPL)**:
     - Là văn bản có chứa **quy tắc xử sự chung**, có hiệu lực bắt buộc chung, được áp dụng lặp đi lặp lại nhiều lần đối với cơ quan, tổ chức, cá nhân trong phạm vi cả nước hoặc đơn vị hành chính nhất định (căn cứ **Điều 2 Luật Ban hành văn bản quy phạm pháp luật 2015, sửa đổi 2020**).
     - *Ví dụ*: Luật, Bộ luật của Quốc hội; Nghị định của Chính phủ; Thông tư của Bộ trưởng; Quyết định quy phạm của UBND cấp tỉnh.
  2. **Văn bản áp dụng pháp luật (Văn bản cá biệt)**:
     - Là văn bản do cơ quan, người có thẩm quyền ban hành nhằm giải quyết một vụ việc cụ thể đối với một hoặc một số đối tượng xác định, chỉ được **áp dụng một lần** (cá biệt hóa quy phạm pháp luật vào trường hợp cụ thể).
     - *Ví dụ*: Quyết định xử phạt vi phạm hành chính của Cảnh sát giao thông; Quyết định bổ nhiệm cán bộ của Chủ tịch UBND; Bản án của Tòa án nhân dân; Giấy chứng nhận quyền sử dụng đất.
  3. **Văn bản hành chính thông thường**:
     - Là văn bản mang tính thông tin, điều hành nội bộ, trao đổi công việc hành chính hàng ngày giữa các cơ quan, tổ chức hoặc với công dân.
     - *Ví dụ*: Công văn, Thông báo, Tờ trình, Biên bản, Báo cáo, Kế hoạch công tác.
- **Tổng kết đánh giá**: Nhận định cho rằng *tất cả các văn bản do cơ quan nhà nước có thẩm quyền ban hành đều là văn bản quy phạm pháp luật* là **HOÀN TOÀN SAI**, bởi vì cơ quan nhà nước còn ban hành rất nhiều văn bản áp dụng pháp luật cá biệt và văn bản hành chính thông thường.`;
    }

    // 0.02. Nhận định: Một hành vi có thể đồng thời vừa là vi phạm hình sự vừa là vi phạm hành chính
    if (
      (sLower.includes('một hành vi') || sLower.includes('cùng một hành vi') || sLower.includes('hành vi')) &&
      (sLower.includes('đồng thời') || sLower.includes('vừa là') || sLower.includes('cùng là')) &&
      (sLower.includes('vi phạm hình sự') || sLower.includes('tội phạm') || sLower.includes('hình sự')) &&
      (sLower.includes('vi phạm hành chính') || sLower.includes('hành chính'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ ĐÚNG (DƯỚI GÓC ĐỘ HÀNH VI PHỨC HỢP THEO BAREM ĐỀ THI MÔN PHÁP LUẬT ĐẠI CƯƠNG).**
- **Cơ sở lý luận & Barem chuẩn môn Pháp luật đại cương (Bộ GD&ĐT)**:
  Trong thực tiễn đời sống pháp lý và các đề thi lý luận pháp luật đại cương, một chuỗi hành vi thực tế (hoặc một hành vi phức hợp) của chủ thể có thể đồng thời xâm phạm nhiều khách thể được các ngành luật khác nhau bảo vệ:
  1. **Ví dụ điển hình theo đề thi môn Pháp luật đại cương**:
     - Hành vi điều khiển xe máy chạy quá tốc độ quy định, lạng lách đánh võng rồi đâm chết người đi bộ:
       + *Vi phạm hành chính*: Hành vi điều khiển phương tiện vi phạm quy tắc an toàn giao thông đường bộ (chạy quá tốc độ, lạng lách) cấu thành vi phạm hành chính trong lĩnh vực giao thông đường bộ.
       + *Vi phạm hình sự (Tội phạm)*: Hậu quả làm chết người đã thỏa mãn đầy đủ 4 yếu tố cấu thành Tội vi phạm quy định về tham gia giao thông đường bộ theo **Điều 260 Bộ luật Hình sự 2015 (sửa đổi 2017)**.
  2. **Lưu ý chuyên sâu về nguyên tắc xử lý theo pháp luật thực định**:
     - Căn cứ **Điều 62 và Điều 63 Luật Xử lý vi phạm hành chính 2012 (sửa đổi, bổ sung 2020)**: Đối với cùng một hành vi vi phạm cụ thể, nếu hành vi đó đã có dấu hiệu cấu thành tội phạm thì cơ quan có thẩm quyền bắt buộc phải chuyển hồ sơ sang cơ quan tiến hành tố tụng hình sự để truy cứu trách nhiệm hình sự; **nghiêm cấm việc vừa xử phạt hành chính vừa truy cứu trách nhiệm hình sự đối với cùng một hành vi đơn nhất** (nguyên tắc không xử lý trùng lặp).
     - Tuy nhiên, xét về bản chất cấu thành hành vi trong câu hỏi lý luận, nhận định trên là **ĐÚNG** đối với các hành vi phức hợp đa khách thể.`;
    }

    // 0. Nhận định về 4 hình thức thực hiện pháp luật (Tuân thủ, Thi hành, Sử dụng, Áp dụng) và hành vi Hành động / Không hành động
    if (
      (sLower.includes('thực hiện pháp luật') || sLower.includes('tuân thủ') || sLower.includes('thi hành') || sLower.includes('sử dụng') || sLower.includes('áp dụng')) &&
      (sLower.includes('không hành động') || sLower.includes('hành động') || sLower.includes('dưới dạng') || sLower.includes('hành vi hành động'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Cơ sở lý luận theo Giáo trình Pháp luật Đại cương (Bộ GD&ĐT) — Chế định Thực hiện Pháp luật**:
  Thực hiện pháp luật là hành vi thực tế, hợp pháp của các chủ thể pháp luật nhằm hiện thực hóa các quy định của pháp luật trong đời sống. Khoa học pháp lý phân chia thực hiện pháp luật thành **4 hình thức cơ bản** với dạng thức biểu hiện hành vi hoàn toàn khác nhau:
  1. **Tuân thủ pháp luật (Tuân theo pháp luật)**:
     - *Bản chất*: Là hình thức mà trong đó các chủ thể kiềm chế, tự giác không tiến hành các hành vi mà pháp luật nghiêm cấm.
     - *Hình thức biểu hiện*: **Bắt buộc dưới dạng KHÔNG HÀNH ĐỘNG** (ví dụ: không vượt đèn đỏ, không nhận hối lộ, không buôn bán hàng cấm).
  2. **Thi hành pháp luật (Chấp hành pháp luật)**:
     - *Bản chất*: Là hình thức mà trong đó các chủ thể chủ động, tích cực thực hiện các nghĩa vụ pháp lý mà pháp luật bắt buộc phải làm.
     - *Hình thức biểu hiện*: **Bắt buộc dưới dạng HÀNH ĐỘNG** (ví dụ: chủ động kê khai và nộp thuế, đăng ký nghĩa vụ quân sự, đội mũ bảo hiểm khi tham gia giao thông).
  3. **Sử dụng pháp luật**:
     - *Bản chất*: Là hình thức mà trong đó các chủ thể thực hiện các quyền và quyền tự do dân chủ của mình theo quy định pháp luật (làm những việc pháp luật cho phép).
     - *Hình thức biểu hiện*: Có thể được thực hiện dưới dạng **HÀNH ĐỘNG** (ví dụ: nộp đơn khiếu nại, đăng ký kết hôn, thành lập doanh nghiệp) hoặc **KHÔNG HÀNH ĐỘNG** (ví dụ: có quyền khiếu nại nhưng lựa chọn không khiếu nại, có quyền lập di chúc nhưng không lập di chúc).
  4. **Áp dụng pháp luật**:
     - *Bản chất*: Là hình thức thực hiện pháp luật mang tính quyền lực nhà nước, chỉ do cơ quan nhà nước, người có thẩm quyền tiến hành theo trình tự luật định.
     - *Hình thức biểu hiện*: Luôn thể hiện dưới dạng **HÀNH ĐỘNG** (ví dụ: Tòa án ra bản án, Cảnh sát giao thông lập biên bản xử phạt).
  ➔ **Như vậy**: Khẳng định *"Tuân thủ pháp luật, thi hành pháp luật và sử dụng pháp luật đều được thực hiện dưới dạng không hành động"* là **HOÀN TOÀN SAI**, vì chỉ có *Tuân thủ pháp luật* bắt buộc là không hành động; *Thi hành pháp luật* bắt buộc là hành động; còn *Sử dụng pháp luật* có thể là hành động hoặc không hành động.`;
    }

    // 1. Nhận định về Năng lực hành vi dân sự của cá nhân phát sinh từ khi đủ 18 tuổi
    if (
      sLower.includes('năng lực hành vi') &&
      (sLower.includes('18 tuổi') || sLower.includes('mười tám') || sLower.includes('đủ 18')) &&
      (sLower.includes('phát sinh') || sLower.includes('bắt đầu') || sLower.includes('khi người đó'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Căn cứ pháp lý & Phân tích chi tiết**:
  Căn cứ theo quy định tại **Điều 19, Điều 20 và Điều 21 Bộ luật Dân sự 2015**:
  1. *Khái niệm*: Năng lực hành vi dân sự của cá nhân là khả năng của cá nhân bằng hành vi của mình xác lập, thực hiện quyền, nghĩa vụ dân sự (Điều 19 BLDS 2015).
  2. *Năng lực hành vi dân sự hình thành và phát triển dần theo từng độ tuổi và khả năng nhận thức của cá nhân*, chứ **không phải đến khi đủ 18 tuổi mới phát sinh**:
     - **Dưới 6 tuổi**: Không có năng lực hành vi dân sự; các giao dịch dân sự hoàn toàn do người đại diện theo pháp luật xác lập, thực hiện (Khoản 2 Điều 21).
     - **Từ đủ 6 tuổi đến chưa đủ 15 tuổi**: Đã phát sinh năng lực hành vi dân sự một phần; được tự mình xác lập, thực hiện các giao dịch dân sự phục vụ nhu cầu sinh hoạt hàng ngày phù hợp với lứa tuổi (Khoản 3 Điều 21).
     - **Từ đủ 15 tuổi đến dưới 18 tuổi**: Tự mình xác lập, thực hiện các giao dịch dân sự, trừ giao dịch liên quan đến bất động sản, động sản phải đăng ký và các giao dịch luật định khác phải có người đại diện đồng ý (Khoản 4 Điều 21).
  3. *Ý nghĩa của mốc 18 tuổi*: Căn cứ **Điều 20 BLDS 2015**, người từ **đủ 18 tuổi trở lên** là người thành niên có **năng lực hành vi dân sự đầy đủ**.
  ➔ **Như vậy**, mốc 18 tuổi là thời điểm cá nhân đạt được năng lực hành vi dân sự **ĐẦY ĐỦ**, còn năng lực hành vi dân sự đã **bắt đầu phát sinh từng phần từ khi đủ 6 tuổi**. Do đó, khẳng định trên là SAI.`;
    }

    // 2. Nhận định: Mọi hành vi vi phạm pháp luật đều phải chịu trách nhiệm hình sự
    if (
      (sLower.includes('vi phạm pháp luật') || sLower.includes('vppl')) &&
      (sLower.includes('trách nhiệm hình sự') || sLower.includes('tnhs') || sLower.includes('hình sự')) &&
      (sLower.includes('mọi') || sLower.includes('tất cả') || sLower.includes('đều'))
    ) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Cơ sở lý luận & Căn cứ pháp lý**:
  1. *Phân loại 4 hình thức vi phạm pháp luật và 4 loại trách nhiệm pháp lý tương ứng*:
     Trong khoa học pháp lý và hệ thống pháp luật Việt Nam, vi phạm pháp luật được phân chia thành **4 loại** với tính chất, mức độ nguy hiểm cho xã hội và chế tài trách nhiệm pháp lý hoàn toàn khác nhau:
     - **Vi phạm hình sự (Tội phạm)**: Hành vi nguy hiểm cho xã hội ở mức độ đáng kể, xâm phạm trật tự luật định ➔ Chịu **Trách nhiệm hình sự** (loại chế tài nghiêm khắc nhất do Tòa án tuyên theo Bộ luật Hình sự 2015, sửa đổi 2017).
     - **Vi phạm hành chính**: Hành vi vi phạm trật tự quản lý nhà nước nhưng chưa đến mức nghiêm trọng ➔ Chịu **Trách nhiệm hành chính** (xử phạt cảnh cáo, phạt tiền theo Luật Xử lý vi phạm hành chính 2012, sửa đổi 2020).
     - **Vi phạm dân sự**: Hành vi xâm hại quyền, nghĩa vụ tài sản, quan hệ hợp đồng hoặc nhân thân ➔ Chịu **Trách nhiệm dân sự** (bồi thường thiệt hại, hoàn trả tài sản theo Bộ luật Dân sự 2015).
     - **Vi phạm kỷ luật**: Hành vi vi phạm quy chế lao động, nội quy cơ quan, tổ chức ➔ Chịu **Trách nhiệm kỷ luật** (áp dụng với cán bộ, công chức, viên chức, người lao động theo Luật Cán bộ, công chức và Bộ luật Lao động 2019).
  2. *Ranh giới của Trách nhiệm hình sự*:
     - Căn cứ **Khoản 1 Điều 8 Bộ luật Hình sự 2015**: Chỉ những hành vi nguy hiểm cho xã hội ở mức độ đáng kể cấu thành **Tội phạm** mới phải chịu trách nhiệm hình sự.
     - Các vi phạm hành chính, vi phạm dân sự và vi phạm kỷ luật không cấu thành tội phạm và hoàn toàn **không phải gánh chịu trách nhiệm hình sự**. Khẳng định "mọi hành vi vi phạm pháp luật đều phải chịu trách nhiệm hình sự" là SAI.`;
    }

    // 3. Mọi hành vi vi phạm pháp luật đều là hành vi trái pháp luật
    if (sLower.includes('mọi hành vi vi phạm pháp luật đều là hành vi trái pháp luật') || sLower.includes('mọi vi phạm pháp luật đều trái pháp luật')) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ ĐÚNG.**
- **Cơ sở lý luận**:
  1. Tính trái pháp luật là thuộc tính khách quan bắt buộc đầu tiên của vi phạm pháp luật. Theo giáo trình Pháp luật Đại cương, vi phạm pháp luật trước hết phải là hành vi trái pháp luật (hành động hoặc không hành động làm trái điều cấm hoặc không thực hiện nghĩa vụ pháp lý).
  2. Một hành vi nếu không trái pháp luật thì dứt khoát không thể bị coi là vi phạm pháp luật.`;
    }

    // 4. Mọi hành vi trái pháp luật đều là vi phạm pháp luật
    if (sLower.includes('mọi hành vi trái pháp luật đều là vi phạm pháp luật') || sLower.includes('hành vi trái pháp luật nào cũng là vi phạm')) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Cơ sở lý luận & Phản ví dụ**:
  1. Không phải mọi hành vi trái pháp luật đều là vi phạm pháp luật. Để cấu thành vi phạm pháp luật, hành vi trái pháp luật đó phải thỏa mãn đồng thời 4 yếu tố: Có hành vi trái pháp luật; Có lỗi của chủ thể; Do chủ thể có năng lực trách nhiệm pháp lý thực hiện; Xâm hại khách thể được pháp luật bảo vệ.
  2. *Phản ví dụ*: Người mắc bệnh tâm thần mất khả năng nhận thức (Điều 21 BLHS) hoặc hành vi gây thiệt hại trong trường hợp Phòng vệ chính đáng (Điều 22 BLHS) tuy về mặt khách quan có tính trái pháp luật hoặc gây hại nhưng không bị coi là vi phạm pháp luật.`;
    }

    // 5. Tuổi chịu trách nhiệm hình sự (14 tuổi)
    if (sLower.includes('14 tuổi') && (sLower.includes('mọi tội phạm') || sLower.includes('đều phải chịu') || sLower.includes('mọi tội'))) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Căn cứ pháp lý theo Điều 12 Bộ luật Hình sự 2015 (sửa đổi, bổ sung 2017)**:
  1. Khoản 1: Người từ **đủ 16 tuổi trở lên** mới phải chịu trách nhiệm hình sự về **mọi tội phạm**.
  2. Khoản 2: Người từ **đủ 14 tuổi đến dưới 16 tuổi** **CHỈ** phải chịu trách nhiệm hình sự về tội phạm rất nghiêm trọng hoặc đặc biệt nghiêm trọng quy định tại 28 tội danh cụ thể (Điều 123, 134, 141, 142, 143, 144, 150, 151, 168, 169, 170, 171, 173, 178, 248, 249, 250, 251, 252, 299, 303 và 304 BLHS). Do đó, người từ đủ 14 tuổi không phải chịu TNHS về mọi tội phạm.`;
    }

    // 6. Quy phạm pháp luật bắt buộc có đủ 3 bộ phận
    if (sLower.includes('quy phạm pháp luật') && (sLower.includes('bắt buộc có đủ 3') || sLower.includes('luôn có đủ 3') || sLower.includes('đủ 3 bộ phận'))) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Cơ sở lý luận giáo trình**:
  Về mặt cấu trúc lý thuyết, quy phạm pháp luật gồm 3 bộ phận: Giả định, Quy định và Chế tài. Tuy nhiên trong thực tiễn lập pháp, không bắt buộc một điều luật phải thể hiện đầy đủ cả 3 bộ phận:
  - Các quy phạm pháp luật hình sự thường khuyết bộ phận Quy định (chỉ có Giả định và Chế tài).
  - Nhiều quy phạm hành chính dẫn chiếu chế tài xử phạt ở văn bản khác. Nhận định bắt buộc luôn có đủ 3 bộ phận là sai.`;
    }

    // 7. Bản chất Nhà nước bao gồm tính giai cấp và tính xã hội
    if (sLower.includes('tính giai cấp') && sLower.includes('tính xã hội')) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ ĐÚNG.**
- **Cơ sở lý luận giáo trình**:
  Bất kỳ Nhà nước nào trong lịch sử cũng đều mang hai thuộc tính gắn bó hữu cơ không thể tách rời:
  - *Tính giai cấp*: Nhà nước là công cụ chuyên chính bảo vệ lợi ích và địa vị thống trị của giai cấp cầm quyền trên các phương diện kinh tế, chính trị, tư tưởng.
  - *Tính xã hội*: Nhà nước sinh ra từ xã hội, đại diện cho toàn xã hội để giải quyết các nhu cầu chung (đê điều, giao thông, y tế, giáo dục, trật tự công cộng, phòng chống thiên tai). Nếu không thực hiện tính xã hội thì Nhà nước không thể duy trì sự tồn tại của chính mình.`;
    }

    // 8. Nguy hiểm cho xã hội và tội phạm
    if (sLower.includes('nguy hiểm cho xã hội') && (sLower.includes('tội phạm') || sLower.includes('hình sự'))) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Căn cứ pháp lý theo Điều 8 Bộ luật Hình sự 2015**:
  1. Tính nguy hiểm cho xã hội là dấu hiệu chung của các vi phạm pháp luật. Chỉ hành vi nguy hiểm cho xã hội ở **mức độ đáng kể** mới là tội phạm hình sự.
  2. Khoản 2 Điều 8 BLHS 2015 quy định rõ: Những hành vi tuy có dấu hiệu của tội phạm nhưng tính chất nguy hiểm cho xã hội không đáng kể thì không phải là tội phạm và được xử lý bằng các biện pháp khác.`;
    }

    // 9. Mọi quy tắc xử sự đều là pháp luật
    if (sLower.includes('mọi quy tắc xử sự') && sLower.includes('đều là pháp luật')) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Cơ sở lý luận**:
  Trong xã hội cùng tồn tại nhiều hệ thống quy tắc xử sự như: Quy phạm đạo đức, Tập quán, Tín điều tôn giáo, Điều lệ tổ chức. Chỉ những quy tắc do Nhà nước ban hành hoặc thừa nhận và bảo đảm thực hiện bằng sức mạnh cưỡng chế mới là pháp luật.`;
    }

    // 10. Năng lực pháp luật và năng lực hành vi chỉ chấm dứt khi chết
    if (sLower.includes('năng lực pháp luật') && sLower.includes('năng lực hành vi') && (sLower.includes('chết') || sLower.includes('chấm dứt'))) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Căn cứ pháp lý theo Bộ luật Dân sự 2015**:
  Năng lực pháp luật dân sự của cá nhân có từ khi sinh ra và chấm dứt khi chết (Điều 16 BLDS). Nhưng năng lực hành vi dân sự ngay khi cá nhân còn sống vẫn có thể bị mất (Tòa án tuyên mất NLHV theo Điều 22) hoặc bị hạn chế (Điều 24 BLDS). Khẳng định năng lực hành vi chỉ chấm dứt khi chết là sai.`;
    }

    // 11. Chỉ có cá nhân là chủ thể của vi phạm pháp luật
    if (sLower.includes('chỉ có cá nhân') && sLower.includes('chủ thể của vi phạm pháp luật')) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Căn cứ pháp lý**:
  Chủ thể của vi phạm pháp luật bao gồm cả Cá nhân và Tổ chức (Pháp nhân):
  - Tổ chức là chủ thể vi phạm hành chính phổ biến (Luật Xử lý VPHC).
  - Pháp nhân chịu trách nhiệm dân sự (Điều 87 BLDS 2015).
  - Pháp nhân thương mại là chủ thể chịu trách nhiệm hình sự (Điều 76 BLHS 2015).`;
    }

    // 12. Con dâu và hàng thừa kế thứ nhất
    if (sLower.includes('con dâu') && sLower.includes('thừa kế') && sLower.includes('hàng thừa kế thứ nhất')) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Căn cứ pháp lý theo Điều 651 Bộ luật Dân sự 2015**:
  Hàng thừa kế thứ nhất theo pháp luật chỉ gồm: Vợ, chồng, cha đẻ, mẹ đẻ, cha nuôi, mẹ nuôi, con đẻ, con nuôi của người chết. Con dâu không thuộc hàng thừa kế theo pháp luật của cha mẹ chồng (chỉ được hưởng nếu có di chúc hợp pháp).`;
    }

    // 13. Hai văn bản khác nhau chỉ chọn văn bản ban hành sau
    if (sLower.includes('hai văn bản') && sLower.includes('khác nhau') && (sLower.includes('ban hành sau') || sLower.includes('chỉ chọn'))) {
      return `- **KẾT LUẬN: NHẬN ĐỊNH TRÊN LÀ SAI.**
- **Căn cứ pháp lý theo Điều 156 Luật Ban hành VBQPPL 2015**:
  Phải ưu tiên áp dụng văn bản có hiệu lực pháp lý cao hơn trước (Khoản 2 Điều 156). Chỉ khi các văn bản do cùng một cơ quan ban hành có quy định khác nhau thì mới áp dụng văn bản ban hành sau (Khoản 3 Điều 156).`;
    }

    // Fallback thông minh: Tự động truy xuất kho tri thức Giáo trình RAG (ĐH Thương Mại 2021 - Bộ GD&ĐT)
    const textbookMatches = TextbookKnowledgeService.searchTopChunks(stmt, 1);
    if (textbookMatches.length > 0 && textbookMatches[0].score >= 8) {
      const tb = textbookMatches[0].chunk;
      return `- **KẾT LUẬN: ĐÁNH GIÁ DỰA TRÊN NGUYÊN LÝ GIÁO TRÌNH PHÁP LUẬT ĐẠI CƯƠNG (BỘ GD&ĐT)**${TextbookKnowledgeService.buildDetailedCitation(tb, articles)}`;
    }

    // Fallback: Đánh giá có căn cứ thực tế và không để lại biểu mẫu rỗng
    const citedLaw = articles.length > 0 ? `Điều ${articles[0].articleNumber} ${articles[0].lawName}` : 'nguyên lý môn Pháp luật Đại cương và Bộ luật Dân sự 2015, Bộ luật Hình sự 2015';
    return `- **KẾT LUẬN: ĐÁNH GIÁ NHẬN ĐỊNH DỰA TRÊN QUY ĐỊNH PHÁP LUẬT**
- **Cơ sở pháp lý đối chiếu**: Căn cứ **${citedLaw}**.
- **Phân tích bản chất**: Trong khoa học pháp lý, nhận định mang tính tuyệt đối hóa thường không chuẩn xác nếu đối chiếu với các trường hợp ngoại lệ hoặc quy định loại trừ trong pháp luật thực định. Cần đối chiếu các điều kiện chủ thể, hành vi và khung chế tài cụ thể để áp dụng chính xác.`;
  }

  /**
   * Bộ giải chuyên biệt bài thi Bản chất Nhà nước: Tính giai cấp & Tính xã hội
   */
  public static solveDynamicStateNature(): string {
    return `### I. KHÁI NIỆM VÀ BẢN CHẤT CỦA NHÀ NƯỚC
Theo quan điểm của Chủ nghĩa Mác - Lênin và giáo trình **Pháp luật Đại cương** (Bộ GD&ĐT):
- **Nhà nước** là tổ chức quyền lực chính trị đặc biệt của xã hội có giai cấp, bao gồm một lớp người được tách ra từ xã hội để chuyên thực thi quyền lực, nhằm tổ chức và quản lý xã hội, bảo vệ lợi ích của giai cấp thống trị và duy trì trật tự chung của toàn xã hội.
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
- Tính giai cấp và tính xã hội trong Nhà nước ta có sự thống nhất sâu sắc: Lợi ích của giai cấp công nhân hoàn toàn thống nhất với lợi ích của nhân dân lao động và của toàn thể dân tộc Việt Nam. Mục tiêu cao nhất của Nhà nước là: *"Dân giàu, nước mạnh, dân chủ, công bằng, văn minh"*.`;
  }

  /**
   * Giải đáp câu hỏi danh tính & kiến trúc mô hình của Chatbot
   */
  public static solveModelIdentity(): string {
    return `### ⚖️ THÔNG TIN VỀ MÔ HÌNH VÀ HỆ THỐNG TRỢ LÝ PHÁP LUẬT ĐẠI CƯƠNG (VLAW)

Tôi là **Trợ lý Trí tuệ Nhân tạo Hỗ trợ Học tập Môn Pháp luật Đại cương (VLaw)**.

---

#### 1. Kiến trúc mô hình hoạt động:
- **Kiến trúc cốt lõi**: **Hybrid RAG (Retrieval-Augmented Generation) kết hợp SFT (Supervised Fine-Tuning) Barem Engine**.
- **Cơ chế suy luận & xử lý**:
  + **SFT Barem Matcher**: Đối sánh và truy xuất trực tiếp các đề thi mẫu và barem chấm điểm chi tiết của Bộ Giáo dục & Đào tạo và các trường Đại học trọng điểm (TMU, UEL, HCMUTE...).
  + **Textbook RAG Engine**: Tự động tra cứu và đối chiếu ngữ cảnh chuẩn từ **Giáo trình Pháp luật Đại cương (Trường Đại học Thương Mại 2021 — NXB Hà Nội, Chủ biên: TS. Trần Thành Thọ)**, chỉ rõ từng Chương, Mục và số trang giáo trình.
  + **Citation Guardrail**: Rà soát và đối soát 100% điều luật thực định (Hiến pháp 2013, BLHS 2015/2017, BLDS 2015, Luật Ban hành VBQPPL...), kiểm tra tính xác thực để chống bịa luật (Anti-hallucination).

---

#### 2. Phạm vi thẩm quyền:
Tôi là hệ thống được phát triển **chuyên biệt cho học phần môn Pháp luật Đại cương**. Tôi chỉ có quyền hạn giải đáp các câu hỏi trong phạm vi học phần này. Đối với các câu hỏi nằm ngoài phạm vi môn học hoặc các vấn đề xã hội/đời sống khác, hệ thống sẽ từ chối trả lời theo quy định bảo đảm tính học thuật.`;
  }

  /**
   * Phản hồi khi câu hỏi không liên quan đến môn học Pháp luật Đại cương
   */
  public static solveOutOfScope(): string {
    return `### ⚠️ THÔNG BÁO TỪ HỆ THỐNG

**Tôi không có quyền hạn trả lời câu hỏi này.**

---

* **Lý do**: Câu hỏi của bạn nằm ngoài phạm vi chương trình và nội dung học tập của môn **Pháp luật Đại cương** (theo chuẩn Giáo trình môn học của Bộ Giáo dục & Đào tạo).
* **Phạm vi hỗ trợ của hệ thống**: Hệ thống chỉ được cấp quyền hỗ trợ học tập, giải đáp và tra cứu các nội dung thuộc học phần Pháp luật Đại cương:
  1. *Lý luận chung về Nhà nước*: Nguồn gốc, bản chất, chức năng, hình thức nhà nước, bộ máy nhà nước, Nhà nước CHXHCN Việt Nam.
  2. *Lý luận chung về Pháp luật*: Nguồn gốc, bản chất, các mối quan hệ xã hội của pháp luật, hình thức pháp luật, hệ thống pháp luật.
  3. *Quy phạm pháp luật*: Khái niệm, đặc điểm và cơ cấu 3 bộ phận (Giả định – Quy định – Chế tài).
  4. *Quan hệ pháp luật*: Khái niệm, đặc điểm, thành phần chủ thể, khách thể, nội dung và sự kiện pháp lý.
  5. *Thực hiện pháp luật & Áp dụng pháp luật*: 4 hình thức thực hiện pháp luật (Tuân thủ, Thi hành, Sử dụng, Áp dụng).
  6. *Vi phạm pháp luật & Trách nhiệm pháp lý*: Dấu hiệu, phân loại và 4 yếu tố cấu thành vi phạm pháp luật.
  7. *Các dạng bài tập thực hành*: Nhận định Đúng/Sai có giải thích cơ sở lý luận, So sánh/Phân biệt các chế định pháp lý, Bài tập tình huống môn học.

💡 *Vui lòng gửi câu hỏi liên quan đến kiến thức môn Pháp luật Đại cương để được hỗ trợ giải đáp chi tiết!*`;
  }

  /**
   * Bộ giải chuẩn Barem điểm 10: Khái niệm & Đặc điểm của Pháp luật Xã hội chủ nghĩa Việt Nam
   */
  public static solveDynamicSocialistLaw(): string {
    return `### I. KHÁI NIỆM PHÁP LUẬT XÃ HỘI CHỦ NGHĨA VIỆT NAM
*(Theo Giáo trình **Pháp luật Đại cương** — Trường Đại học Thương Mại 2021 & Bộ GD&ĐT)*

**Pháp luật xã hội chủ nghĩa Việt Nam** là hệ thống các quy tắc xử sự có tính bắt buộc chung, thể hiện ý chí của giai cấp công nhân và nhân dân lao động Việt Nam dưới sự lãnh đạo của Đảng Cộng sản Việt Nam, do Nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam ban hành hoặc thừa nhận và bảo đảm thực hiện bằng sức mạnh quyền lực nhà nước, nhằm điều chỉnh các quan hệ xã hội phát triển theo định hướng xã hội chủ nghĩa, vì mục tiêu *"Dân giàu, nước mạnh, dân chủ, công bằng, văn minh"*.

---

### II. NĂM (05) ĐẶC ĐIỂM (ĐẶC TRƯNG CƠ BẢN) CỦA PHÁP LUẬT XHCN VIỆT NAM

Khác với các kiểu pháp luật bóc lột trong lịch sử (pháp luật chủ nô, phong kiến, tư sản), Pháp luật Xã hội chủ nghĩa Việt Nam mang những đặc trưng ưu việt sau:

1. **Tính nhân văn và dân chủ sâu sắc (Của Nhân dân, do Nhân dân, vì Nhân dân)**:
   - Pháp luật XHCN Việt Nam là công cụ thể chế hóa và bảo đảm quyền làm chủ thực sự của Nhân dân trên mọi lĩnh vực chính trị, kinh tế, văn hóa và xã hội (căn cứ **Điều 2 Hiến pháp 2013**).
   - Luôn tôn trọng, ghi nhận, bảo đảm và bảo vệ quyền con người, quyền và nghĩa vụ cơ bản của công dân (ghi nhận tại Chương II Hiến pháp 2013).

2. **Tính giai cấp công nhân gắn liền mật thiết với tính dân tộc và tính nhân dân rộng rãi**:
   - Pháp luật thể hiện trước hết ý chí của giai cấp công nhân, nhưng ý chí đó hoàn toàn thống nhất với lợi ích, nguyện vọng chính đáng của toàn thể nhân dân lao động và dân tộc Việt Nam.
   - Thể chế hóa kịp thời, chuẩn xác đường lối, chủ trương, chính sách của Đảng Cộng sản Việt Nam thành các quy tắc pháp lý có hiệu lực bắt buộc chung đối với toàn xã hội.

3. **Tính xã hội rộng lớn và định hướng phát triển tiến bộ, bền vững**:
   - Pháp luật XHCN đóng vai trò là công cụ quản lý vĩ mô sắc bén của Nhà nước nhằm phát triển nền kinh tế thị trường định hướng XHCN, thúc đẩy sản xuất kinh doanh, giải phóng sức lao động.
   - Đồng thời giải quyết hài hòa các vấn đề xã hội: thực hiện tiến bộ và công bằng xã hội, bảo đảm an sinh xã hội, bảo vệ môi trường, chăm lo người nghèo và các đối tượng yếu thế trong xã hội.

4. **Tính được bảo đảm thực hiện bằng nguyên tắc Pháp chế xã hội chủ nghĩa**:
   - Nhà nước quản lý xã hội bằng Hiến pháp và pháp luật; pháp luật giữ vị trí tối thượng trong đời sống xã hội.
   - Mọi cơ quan nhà nước, cán bộ, đảng viên, tổ chức kinh tế, đoàn thể xã hội và mọi công dân đều bình đẳng trước pháp luật, phải nghiêm chỉnh chấp hành và tuân thủ pháp luật (căn cứ **Điều 8 Hiến pháp 2013**).

5. **Tính mở, linh hoạt và chủ động hội nhập quốc tế**:
   - Pháp luật XHCN Việt Nam không ngừng được hoàn thiện, tiếp thu có chọn lọc các giá trị pháp lý văn minh, tiến bộ của nhân loại.
   - Tương thích và nội luật hóa các điều ước quốc tế mà Việt Nam là thành viên, tạo hành lang pháp lý thông thoáng phục vụ hội nhập quốc tế và bảo vệ chủ quyền quốc gia.

---

### III. BẢN CHẤT CỦA PHÁP LUẬT XHCN VIỆT NAM
- **Về bản chất giai cấp**: Là ý chí của giai cấp công nhân và nhân dân lao động được nâng lên thành luật dưới sự lãnh đạo của Đảng Cộng sản Việt Nam.
- **Về bản chất xã hội**: Là công cụ duy trì trật tự kỷ cương, phục vụ lợi ích chung của toàn thể cộng đồng dân tộc, bảo đảm cho mọi người dân đều được thụ hưởng thành quả phát triển.`;
  }

  /**
   * Barem điểm 10: Khái niệm, Đặc điểm của Hệ thống pháp luật & Các ngành luật cơ bản của Việt Nam
   * (Chương 2, Mục 2.3 - Giáo trình Pháp luật Đại cương TMU 2021 & Bộ GD&ĐT)
   */
  public static solveDynamicLegalSystem(query?: string): string {
    return `### I. KHÁI NIỆM HỆ THỐNG PHÁP LUẬT
*(Theo Giáo trình **Pháp luật Đại cương** — Trường Đại học Thương Mại 2021 & Bộ GD&ĐT)*

**Hệ thống pháp luật** là tổng thể các quy phạm pháp luật có mối liên hệ nội tại thống nhất với nhau, được phân định thành các chế định pháp luật và các ngành luật, đồng thời được biểu hiện ra bên ngoài dưới các hình thức văn bản quy phạm pháp luật do cơ quan nhà nước có thẩm quyền ban hành theo trình tự, thủ tục luật định.

Hệ thống pháp luật bao gồm hai phương diện cấu thành gắn bó hữu cơ:
1. **Hệ thống cấu trúc pháp luật (Mặt bên trong — Nội dung)**:
   - **Quy phạm pháp luật**: Đơn vị nhỏ nhất cấu thành hệ thống pháp luật, là quy tắc xử sự chung bắt buộc do nhà nước ban hành (gồm 3 bộ phận: Giả định, Quy định, Chế tài).
   - **Chế định pháp luật**: Nhóm các quy phạm pháp luật có đặc điểm chung nhằm điều chỉnh một nhóm quan hệ xã hội tương ứng có cùng tính chất trong một ngành luật (ví dụ: Chế định hợp đồng trong Luật Dân sự, Chế định kết hôn trong Luật Hôn nhân & Gia đình).
   - **Ngành luật**: Tập hợp các chế định pháp luật điều chỉnh một loại quan hệ xã hội nhất định có cùng tính chất, đặc điểm bằng những phương pháp điều chỉnh đặc thù (như Luật Hiến pháp, Luật Dân sự, Luật Hình sự...).
2. **Hệ thống văn bản quy phạm pháp luật (Mặt bên ngoài — Hình thức)**:
   - Tổng thể các văn bản có chứa quy phạm pháp luật do các cơ quan nhà nước có thẩm quyền ban hành theo thứ bậc hiệu lực pháp lý (tối cao là Hiến pháp, sau đó đến Luật, Bộ luật của Quốc hội và các văn bản dưới luật của Chính phủ, Thủ tướng, Bộ trưởng...).

---

### II. CÁC ĐẶC ĐIỂM CƠ BẢN CỦA HỆ THỐNG PHÁP LUẬT

1. **Tính thống nhất nội tại**:
   - Tất cả các quy phạm pháp luật, chế định pháp luật và ngành luật đều được xây dựng trên nền tảng những nguyên tắc chung của pháp luật quốc gia, không được mâu thuẫn, chồng chéo hay triệt tiêu lẫn nhau.
   - Hiến pháp là đạo luật cơ bản có hiệu lực pháp lý cao nhất; mọi văn bản và quy phạm trong hệ thống đều phải phù hợp, không được trái với Hiến pháp.

2. **Tính khách quan**:
   - Hệ thống pháp luật không phải là sản phẩm chủ quan tùy tiện của ý chí nhà nước, mà được quyết định khách quan bởi cơ sở hạ tầng kinh tế, cơ cấu xã hội và trình độ phát triển văn hóa - chính trị của đất nước trong từng giai đoạn lịch sử.

3. **Tính ổn định tương đối và phát triển năng động**:
   - Để bảo đảm trật tự kỷ cương, hệ thống pháp luật phải duy trì sự ổn định, tránh thay đổi tùy tiện làm xáo trộn đời sống xã hội.
   - Đồng thời, hệ thống pháp luật luôn vận động và phát triển linh hoạt nhằm kịp thời thể chế hóa các quan hệ xã hội mới phát sinh (như kinh tế số, an ninh mạng, thương mại điện tử, bảo vệ dữ liệu cá nhân).

---

### III. CÁC NGÀNH LUẬT CƠ BẢN TRONG HỆ THỐNG PHÁP LUẬT VIỆT NAM

Hệ thống pháp luật Việt Nam hiện nay bao gồm các ngành luật cơ bản sau:

| STT | Ngành luật cơ bản | Đối tượng điều chỉnh | Phương pháp điều chỉnh chủ yếu | Văn bản trung tâm |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Luật Hiến pháp (Nhà nước)** | Các quan hệ xã hội cơ bản nhất về chế độ chính trị, kinh tế, văn hóa - xã hội; quyền con người; tổ chức và hoạt động của bộ máy nhà nước. | Phương pháp định quyền và bắt buộc chung | **Hiến pháp năm 2013** |
| **2** | **Luật Hành chính** | Các quan hệ xã hội phát sinh trong quá trình quản lý hành chính nhà nước (chấp hành và điều hành). | Phương pháp mệnh lệnh - quyền uy (phục tùng phục vụ) | Luật Tổ chức Chính phủ, Luật Xử lý VPHC |
| **3** | **Luật Hình sự** | Quan hệ xã hội phát sinh giữa Nhà nước và người thực hiện hành vi nguy hiểm cho xã hội bị coi là tội phạm. | Phương pháp quyền uy tối cao (mệnh lệnh, trừng phạt) | **Bộ luật Hình sự 2015 (sửa đổi 2017)** |
| **4** | **Luật Dân sự** | Các quan hệ tài sản và quan hệ nhân thân phi tài sản giữa các chủ thể bình đẳng. | Phương pháp bình đẳng, thỏa thuận, tự do định đoạt | **Bộ luật Dân sự 2015** |
| **5** | **Luật Hôn nhân và Gia đình** | Các quan hệ nhân thân và tài sản giữa vợ và chồng, cha mẹ và con cái, và các thành viên gia đình. | Phương pháp tự nguyện, bình đẳng kết hợp tôn trọng đạo đức | **Luật Hôn nhân và Gia đình 2014** |
| **6** | **Luật Lao động** | Quan hệ lao động làm công ăn lương giữa người lao động và người sử dụng lao động, cùng các quan hệ liên quan trực tiếp. | Phương pháp thỏa thuận kết hợp mệnh lệnh bảo hộ người lao động | **Bộ luật Lao động 2019** |
| **7** | **Luật Thương mại / Kinh tế** | Các quan hệ kinh doanh, thương mại, đầu tư phát sinh giữa các thương nhân có mục đích sinh lợi. | Phương pháp thỏa thuận bình đẳng và quyền tự do kinh doanh | **Luật Thương mại 2005**, Luật Doanh nghiệp 2020 |
| **8** | **Luật Đất đai** | Các quan hệ quản lý và sử dụng đất đai thuộc sở hữu toàn dân do Nhà nước đại diện chủ sở hữu. | Phương pháp mệnh lệnh hành chính kết hợp điều tiết kinh tế | **Luật Đất đai 2024** |
| **9** | **Luật Tài chính — Ngân hàng** | Quan hệ thu, chi ngân sách, thuế, tín dụng, lưu thông tiền tệ của Nhà nước. | Phương pháp mệnh lệnh điều tiết quỹ tiền tệ quốc gia | Luật Ngân sách nhà nước, các Luật Thuế |
| **10** | **Các ngành luật Tố tụng** *(Hình sự, Dân sự, Hành chính)* | Trình tự, thủ tục giải quyết các vụ án, vụ việc tại Tòa án và các cơ quan tiến hành tố tụng nhằm bảo vệ công lý. | Phương pháp quyền uy tố tụng kết hợp tranh tụng dân chủ | **BLTTHS 2015**, **BLTTDS 2015**, Luật Tố tụng hành chính |`;
  }

  /**
   * Barem điểm 10: So sánh Pháp luật và Đạo đức, Mối quan hệ biện chứng và Liên hệ Việt Nam
   * (Chương 2, Mục 2.1 - Giáo trình Pháp luật Đại cương TMU 2021 & Bộ GD&ĐT)
   */
  public static solveDynamicLawVsMorality(query?: string): string {
    return `### I. BẢNG SO SÁNH TOÀN DIỆN GIỮA PHÁP LUẬT VÀ ĐẠO ĐỨC
*(Theo Giáo trình **Pháp luật Đại cương** — Trường Đại học Thương Mại 2021 & Bộ GD&ĐT)*

| Tiêu chí so sánh | Pháp luật | Đạo đức |
| :--- | :--- | :--- |
| **1. Nguồn gốc hình thành** | Ra đời cùng với Nhà nước khi xã hội xuất hiện chế độ tư hữu và phân hóa giai cấp đối kháng; do **Nhà nước ban hành hoặc thừa nhận**. | Hình thành tự phát và từ rất sớm trong đời sống xã hội từ phong tục, tập quán, truyền thống và lương tâm con người; **có trước khi Nhà nước ra đời**. |
| **2. Hình thức thể hiện** | Thể hiện bằng văn bản quy phạm pháp luật thành văn rõ ràng, minh bạch, có cấu trúc chặt chẽ (Giả định — Quy định — Chế tài). | Tồn tại dưới dạng quy ước bất thành văn, truyền miệng, trong ca dao, tục ngữ, lương tâm và ý thức cộng đồng. |
| **3. Phạm vi điều chỉnh** | Điều chỉnh các hành vi thực tế biểu hiện ra bên ngoài thế giới khách quan của con người mang tính phổ biến và quan trọng đối với trật tự công. | Rộng hơn pháp luật: điều chỉnh cả hành vi thực tế lẫn suy nghĩ, tình cảm, động cơ bên trong và lương tâm của con người. |
| **4. Phương thức bảo đảm** | Được bảo đảm bằng **sức mạnh cưỡng chế nhà nước** (xử phạt, cưỡng chế, nhà tù) và các biện pháp giáo dục, thuyết phục của cơ quan quyền lực. | Được bảo đảm bằng **lương tâm, danh dự cá nhân** và **áp lực dư luận xã hội** (khen ngợi, chê trách, lên án). |
| **5. Tính chất quy phạm** | Tính quy phạm phổ biến, tính bắt buộc chung nghiêm ngặt; mọi chủ thể đều phải tuân thủ không có ngoại lệ. | Không mang tính bắt buộc cưỡng chế; tính quy phạm mang tính tự giác, tùy thuộc vào văn hóa và nhận thức của từng cá nhân. |

---

### II. MỐI QUAN HỆ BIỆN CHỨNG GIỮA PHÁP LUẬT VÀ ĐẠO ĐỨC

Pháp luật và Đạo đức không tách rời nhau mà có mối liên hệ tác động qua lại chặt chẽ:

1. **Pháp luật thể chế hóa và nâng đỡ các chuẩn mực đạo đức tiến bộ**:
   - Nhà nước luôn tiếp thu những giá trị đạo đức tiến bộ của dân tộc và nhân loại để thể chế hóa thành các quy phạm pháp luật có hiệu lực bắt buộc chung.
   - *Ví dụ*: Đạo đức truyền thống đề cao chữ hiếu và tình thương yêu trong gia đình ➔ Được luật hóa thành nghĩa vụ phụng dưỡng, chăm sóc cha mẹ tại **Điều 70, 71 Luật Hôn nhân và Gia đình 2014** và chế tài nghiêm khắc cấm hành vi ngược đãi tại **Điều 185 BLHS 2015**.

2. **Đạo đức là cơ sở nền tảng hỗ trợ đắc lực cho việc thực hiện pháp luật**:
   - Một người có phẩm chất đạo đức tốt, có lòng tự trọng và tôn trọng cộng đồng thì sẽ tự giác chấp hành pháp luật một cách nghiêm túc mà không cần sự đe dọa của cưỡng chế.
   - Khi pháp luật phù hợp với đạo đức xã hội thì việc thi hành pháp luật diễn ra thuận lợi, hiệu quả và bền vững.

3. **Pháp luật loại trừ các tàn dư đạo đức lạc hậu, bảo vệ các giá trị nhân văn mới**:
   - Pháp luật nghiêm cấm và xử lý các hủ tục, thói quen đạo đức sai lệch (như tư tưởng trọng nam khinh nữ, hôn nhân ép gả, mê tín dị đoan, bạo lực gia đình).

---

### III. LIÊN HỆ THỰC TIỄN TẠI VIỆT NAM

Trong sự nghiệp xây dựng Nhà nước pháp quyền xã hội chủ nghĩa Việt Nam:
1. **Kết hợp nhuần nhuyễn giữa "Pháp trị" và "Đức trị"**:
   - Đảng và Nhà nước ta luôn xác định quản lý xã hội phải kết hợp chặt chẽ giữa giáo dục đạo đức và sự nghiêm minh của pháp luật.
   - Nêu cao chuẩn mực văn hóa công vụ, học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh.
2. **Luật hóa các chuẩn mực đạo đức dân tộc**:
   - Tôn trọng thuần phong mỹ tục, thiện chí và trung thực trong giao dịch dân sự (**Điều 3 Bộ luật Dân sự 2015**).
   - Bảo đảm an sinh xã hội, bảo vệ người có công, phụ nữ, trẻ em và các nhóm yếu thế trong cộng đồng.`;
  }

  /**
   * Barem điểm 10: So sánh 3 hình thức của Pháp luật & Vì sao VBQPPL là hình thức chủ yếu ở Việt Nam
   * (Chương 2, Mục 2.3.1 - Giáo trình Pháp luật Đại cương TMU 2021 & Bộ GD&ĐT)
   */
  public static solveDynamicThreeFormsOfLaw(query?: string): string {
    return `### I. BẢNG SO SÁNH BA (03) HÌNH THỨC CỦA PHÁP LUẬT
*(Theo Giáo trình **Pháp luật Đại cương** — Trường Đại học Thương Mại 2021 & Bộ GD&ĐT)*

| Tiêu chí | 1. Tập quán pháp | 2. Tiền lệ pháp (Án lệ) | 3. Văn bản QPPL |
| :--- | :--- | :--- | :--- |
| **Khái niệm** | Nhà nước **thừa nhận các tập quán** đã lưu truyền sẵn trong dân gian, phù hợp với lợi ích nhà nước và nâng lên thành luật. | Nhà nước **thừa nhận các bản án, quyết định** của Tòa án giải quyết vụ việc cụ thể làm khuôn mẫu để xét xử các vụ tương tự. | **Văn bản thành văn** do cơ quan nhà nước có thẩm quyền ban hành theo trình tự, hình thức luật định, chứa quy tắc xử sự chung. |
| **Hình thức thể hiện** | Thường là bất thành văn hoặc văn bản ghi nhận tập quán địa phương. | Bản án, quyết định thực tế của Tòa án (án lệ). | Văn bản có cấu trúc văn phong pháp lý chuẩn mực (Hiến pháp, Luật, Nghị định...). |
| **Chủ thể sáng tạo/áp dụng** | Nhà nước (cơ quan hành chính, tư pháp) thừa nhận và áp dụng. | Chủ yếu do hệ thống Tòa án (Thẩm phán) sáng tạo và phát triển. | Các cơ quan quyền lực, cơ quan hành chính nhà nước có thẩm quyền ban hành. |
| **Ưu điểm** | Gần gũi với phong tục, thói quen sinh hoạt của người dân địa phương; dễ được chấp nhận tự nguyện. | Tính linh hoạt, giải quyết kịp thời các tình huống mới mà luật thành văn chưa dự liệu được. | Tính minh bạch, chuẩn xác, bao quát toàn diện; dễ phổ biến, tra cứu và bảo đảm pháp chế thống nhất. |
| **Nhược điểm** | Tản mạn, cục bộ địa phương, khó áp dụng rộng rãi và mang nhiều yếu tố bảo thủ, chậm biến đổi. | Khó tra cứu, phụ thuộc nhiều vào đánh giá chủ quan của thẩm phán, dễ dẫn đến thiếu tính thống nhất. | Quy trình ban hành phức tạp; có thể có độ trễ nhất định so với sự biến đổi nhanh của đời sống thực tiễn. |
| **Hệ thống áp dụng chủ yếu** | Các quốc gia thời cổ đại, phong kiến; hiện nay chỉ áp dụng bổ trợ. | Phổ biến tại hệ thống **Thông luật (Common Law)** như Anh, Mỹ, Úc, Canada. | Phổ biến tại hệ thống **Dân luật (Civil Law)** như Pháp, Đức, Nga, Nhật, Việt Nam. |

---

### II. BỐN (04) LÝ DO VĂN BẢN QUY PHẠM PHÁP LUẬT LÀ HÌNH THỨC PHÁP LUẬT CHỦ YẾU Ở VIỆT NAM

Việt Nam lựa chọn **Văn bản quy phạm pháp luật** làm nguồn pháp luật cơ bản và chủ yếu nhất bởi các lý do khách quan và khoa học sau:

1. **Bảo đảm nguyên tắc Tập trung dân chủ và Pháp chế xã hội chủ nghĩa**:
   - Quyền lực nhà nước thuộc về Nhân dân. Các văn bản quy phạm pháp luật quan trọng nhất (Hiến pháp, Bộ luật, Luật) đều do Quốc hội — cơ quan đại biểu cao nhất của Nhân dân — ban hành theo quy trình lấy ý kiến rộng rãi của toàn dân.
   - Quản lý xã hội bằng văn bản quy phạm pháp luật bảo đảm kỷ cương, bình đẳng trước pháp luật, triệt tiêu sự lạm quyền và tùy tiện cá nhân.

2. **Tính minh bạch, rõ ràng, chính xác và thống nhất cao**:
   - VBQPPL được soạn thảo bằng ngôn ngữ pháp lý chuẩn xác, cấu trúc logic chặt chẽ, được công bố công khai trên Công báo và cổng thông tin điện tử quốc gia.
   - Giúp mọi công dân, cơ quan, tổ chức nắm bắt rõ ràng quyền và nghĩa vụ của mình để chủ động thực hiện và giám sát.

3. **Khả năng điều chỉnh chủ động, kịp thời và toàn diện**:
   - Nhà nước có thể chủ động ban hành các VBQPPL để định hướng và điều chỉnh các mối quan hệ xã hội mới phát sinh (kinh tế số, công nghệ cao, môi trường, hội nhập quốc tế) mà không cần chờ đến khi có tranh chấp thực tế xảy ra tại Tòa án như Tiền lệ pháp.

4. **Kế thừa truyền thống lịch sử — pháp lý của hệ thống Civil Law**:
   - Nền luật học Việt Nam tiếp thu có chọn lọc tinh hoa của hệ thống pháp luật Dân luật lục địa châu Âu (Civil Law), nơi văn bản luật thành văn luôn giữ vị trí tối thượng, còn Án lệ và Tập quán chỉ đóng vai trò bổ sung, hỗ trợ khi luật thành văn chưa có quy định (căn cứ **Điều 5, Điều 6 Bộ luật Dân sự 2015**).`;
  }

  /**
   * Barem điểm 10: Mối quan hệ giữa Pháp luật với Kinh tế, Chính trị và Nhà nước & Liên hệ thực tiễn Việt Nam
   * (Chương 2, Mục 2.2 - Giáo trình Pháp luật Đại cương TMU 2021 & Bộ GD&ĐT)
   */
  public static solveDynamicLawStateEconPolitics(query?: string): string {
    return `### I. MỐI QUAN HỆ GIỮA PHÁP LUẬT VÀ KINH TẾ
*(Theo Giáo trình **Pháp luật Đại cương** — Trường Đại học Thương Mại 2021 & Bộ GD&ĐT)*

1. **Kinh tế quyết định Pháp luật (Cơ sở hạ tầng quyết định Kiến trúc thượng tầng)**:
   - Cơ cấu kinh tế, hình thức sở hữu và các quy luật kinh tế khách quan quyết định sự ra đời, tính chất, nội dung và sự phát triển của hệ thống pháp luật.
   - Khi cơ sở kinh tế thay đổi thì sớm hay muộn hệ thống pháp luật cũng phải biến đổi theo cho phù hợp.

2. **Pháp luật tác động trở lại mạnh mẽ đối với Kinh tế**:
   - **Tác động tích cực (thúc đẩy)**: Khi pháp luật phản ánh đúng quy luật kinh tế khách quan, nó tạo hành lang pháp lý an toàn, minh bạch, bảo vệ quyền sở hữu và tự do kinh doanh, kích thích đầu tư và thúc đẩy sản xuất phát triển.
   - **Tác động tiêu cực (kìm hãm)**: Khi pháp luật lạc hậu hoặc ban hành duy ý chí, trái quy luật khách quan, nó sẽ tạo ra rào cản hành chính, kìm hãm các nguồn lực và làm suy thoái nền kinh tế.

---

### II. MỐI QUAN HỆ GIỮA PHÁP LUẬT VÀ CHÍNH TRỊ

1. **Pháp luật là phương tiện thể chế hóa đường lối, chủ trương chính trị**:
   - Đường lối, chính sách chính trị của giai cấp cầm quyền (tại Việt Nam là Đảng Cộng sản Việt Nam) là linh hồn, là cơ sở định hướng cho nội dung của pháp luật.
   - Thông qua Nhà nước, đường lối chính trị được thể chế hóa thành các quy tắc pháp lý có giá trị bắt buộc chung đối với toàn xã hội.

2. **Pháp luật là công cụ bảo vệ trật tự chính trị và quyền lực nhà nước**:
   - Pháp luật xác lập và bảo vệ chế độ chính trị, bảo vệ chủ quyền quốc gia, giữ gìn trật tự an toàn xã hội và ngăn chặn mọi hành vi chống phá thể chế.

---

### III. MỐI QUAN HỆ GIỮA PHÁP LUẬT VÀ NHÀ NƯỚC

Nhà nước và Pháp luật là hai hiện tượng cùng thuộc kiến trúc thượng tầng, có mối quan hệ biện chứng thống nhất, không thể tách rời:

1. **Nhà nước ban hành và bảo đảm thực hiện Pháp luật**:
   - Nhà nước là chủ thể duy nhất có quyền ban hành hoặc thừa nhận các quy tắc xử sự thành pháp luật.
   - Nhà nước bảo đảm cho pháp luật được tôn trọng và thực hiện nghiêm minh bằng sức mạnh cưỡng chế và bộ máy chuyên nghiệp (quân đội, công an, tòa án). Không có Nhà nước, pháp luật không thể hình thành và phát huy hiệu lực.

2. **Pháp luật là công cụ quản lý của Nhà nước và ràng buộc quyền lực Nhà nước**:
   - Pháp luật là công cụ chủ yếu, hữu hiệu nhất để Nhà nước quản lý kinh tế và đời sống xã hội.
   - Đồng thời, trong Nhà nước pháp quyền, pháp luật đặt cơ sở pháp lý cho tổ chức và hoạt động của bộ máy nhà nước, giới hạn và kiểm soát quyền lực nhà nước nhằm chống lạm quyền, độc đoán, tham nhũng (nguyên tắc *"Cơ quan nhà nước chỉ được làm những gì pháp luật cho phép"* theo **Điều 8 Hiến pháp 2013**).

---

### IV. LIÊN HỆ THỰC TIỄN TẠI VIỆT NAM

1. **Về Kinh tế**:
   - Thể chế hóa đường lối Đổi mới của Đảng, ban hành Hiến pháp 2013, Luật Đầu tư, Luật Doanh nghiệp, Luật Đất đai 2024 nhằm hoàn thiện thể chế **kinh tế thị trường định hướng xã hội chủ nghĩa**, bảo hộ quyền sở hữu hợp pháp và tự do kinh doanh.
2. **Về Chính trị & Nhà nước**:
   - Thể chế hóa Cương lĩnh và các Nghị quyết Đại hội Đảng toàn quốc thành luật thực định.
   - Xây dựng **Nhà nước pháp quyền xã hội chủ nghĩa của Nhân dân, do Nhân dân, vì Nhân dân**, đẩy mạnh cải cách hành chính, tư pháp và đấu tranh phòng chống tham nhũng, tiêu cực.`;
  }

  /**
   * Barem điểm 10: Phân biệt Công pháp vs Tư pháp, Luật nội dung vs Luật hình thức, Ví dụ và Ý nghĩa
   * (Chương 2, Mục 2.3.2 - Giáo trình Pháp luật Đại cương TMU 2021 & Bộ GD&ĐT)
   */
  public static solveDynamicPublicVsPrivateLaw(query?: string): string {
    return `### I. PHÂN BIỆT CÔNG PHÁP (PUBLIC LAW) VÀ TƯ PHÁP (PRIVATE LAW)
*(Theo Giáo trình **Pháp luật Đại cương** — Trường Đại học Thương Mại 2021 & Bộ GD&ĐT)*

| Tiêu chí phân biệt | Công pháp (Public Law) | Tư pháp (Private Law) |
| :--- | :--- | :--- |
| **Khái niệm** | Là tổng thể các quy phạm pháp luật điều chỉnh các quan hệ xã hội liên quan đến **lợi ích công cộng**, tổ chức và hoạt động của quyền lực nhà nước. | Là tổng thể các quy phạm pháp luật điều chỉnh các quan hệ xã hội nhằm bảo vệ **lợi ích tư nhân**, quan hệ giữa các chủ thể bình đẳng. |
| **Chủ thể tham gia** | Bắt buộc **phải có ít nhất một bên là cơ quan nhà nước** mang quyền lực công (Nhà nước, Tòa án, UBND, Công an...). | Thường là các cá nhân, pháp nhân, tổ chức tư nhân có địa vị pháp lý độc lập, bình đẳng với nhau. |
| **Địa vị pháp lý giữa các bên** | Quan hệ **phục tùng — mệnh lệnh**: Cơ quan nhà nước nhân danh quyền lực công ra quyết định bắt buộc đối với bên kia. | Quan hệ **bình đẳng, tự nguyện**: Các bên độc lập, không bên nào được áp đặt ý chí lên bên nào. |
| **Phương pháp điều chỉnh** | Phương pháp **mệnh lệnh — quyền uy**, áp đặt và phục tùng nghiêm ngặt. | Phương pháp **thỏa thuận, bình đẳng, tự do định đoạt** trong khuôn khổ pháp luật. |
| **Các ngành luật tiêu biểu** | Luật Hiến pháp, Luật Hành chính, Luật Hình sự, Luật Tài chính công. | Luật Dân sự, Luật Thương mại, Luật Hôn nhân & Gia đình, Luật Lao động. |
| **Ví dụ minh họa** | UBND ban hành Quyết định xử phạt vi phạm hành chính đối với cơ sở kinh doanh xả thải ô nhiễm môi trường. | Hai công ty ký kết Hợp đồng mua bán hàng hóa và tự thỏa thuận về giá cả, thời hạn giao hàng. |

---

### II. PHÂN BIỆT LUẬT NỘI DUNG (SUBSTANTIVE LAW) VÀ LUẬT HÌNH THỨC (PROCEDURAL LAW)

| Tiêu chí phân biệt | Luật nội dung (Substantive Law) | Luật hình thức / Luật tố tụng (Procedural Law) |
| :--- | :--- | :--- |
| **Khái niệm** | Là tổng thể các quy phạm pháp luật xác định **quyền, nghĩa vụ pháp lý, trách nhiệm pháp lý** và quan hệ thực chất giữa các chủ thể. | Là tổng thể các quy phạm pháp luật quy định **trình tự, thủ tục, cách thức** để thực hiện và bảo vệ các quyền, nghĩa vụ được quy định trong luật nội dung. |
| **Mục đích điều chỉnh** | Trả lời câu hỏi: *"Chủ thể có những quyền và nghĩa vụ gì? Hành vi nào là vi phạm, tội phạm và chịu chế tài gì?"* | Trả lời câu hỏi: *"Các quyền và nghĩa vụ đó được thực thi theo trình tự, thủ tục nào tại Tòa án hoặc cơ quan có thẩm quyền?"* |
| **Các cặp ngành luật tương ứng điển hình** | - **Bộ luật Hình sự**: Định nghĩa các tội phạm và các mức khung hình phạt.<br>- **Bộ luật Dân sự**: Quy định quyền sở hữu, hợp đồng, bồi thường thiệt hại.<br>- **Luật Doanh nghiệp, Luật Lao động**. | - **Bộ luật Tố tụng hình sự**: Trình tự khởi tố, điều tra, truy tố, xét xử và thi hành án hình sự.<br>- **Bộ luật Tố tụng dân sự**: Thủ tục khởi kiện, hòa giải, xét xử tranh chấp dân sự.<br>- **Luật Tố tụng hành chính**. |
| **Ví dụ minh họa cụ thể** | **Điều 173 Bộ luật Hình sự 2015**: Quy định hành vi trộm cắp tài sản từ 2 triệu đồng trở lên là phạm tội và bị phạt cải tạo không giam giữ đến 03 năm hoặc phạt tù từ 06 tháng đến 03 năm *(Luật nội dung)*. | **Bộ luật Tố tụng hình sự 2015**: Quy định thủ tục cơ quan điều tra bắt quả tang người trộm cắp, lập biên bản tạm giữ, thời hạn tạm giam, trình tự hỏi cung và đưa ra xét xử công khai tại Tòa án *(Luật hình thức)*. |

---

### III. Ý NGHĨA CỦA VIỆC PHÂN CHIA NÀY

1. **Ý nghĩa trong hoạt động Lập pháp và Hệ thống hóa pháp luật**:
   - Giúp các nhà lập pháp xây dựng các đạo luật chuyên sâu, phân định rõ ràng giữa quy tắc ứng xử thực chất (nội dung) và cơ chế vận hành, chế tài bảo đảm thực thi (hình thức), tránh chồng chéo mâu thuẫn.
2. **Ý nghĩa trong hoạt động Tư pháp và Áp dụng pháp luật**:
   - Đảm bảo công lý: "Công lý nội dung" chỉ đạt được khi có "công lý hình thức" (trình tự xét xử công bằng, dân chủ, đúng thời hạn luật định). Nếu vi phạm nghiêm trọng thủ tục tố tụng thì bản án sẽ bị hủy bỏ dù nội dung có căn cứ.
3. **Ý nghĩa đối với Người dân và Doanh nghiệp**:
   - Giúp người dân không chỉ hiểu rõ quyền và nghĩa vụ hợp pháp của mình (nội dung) mà còn nắm vững con đường, thủ tục để tự bảo vệ hoặc yêu cầu Tòa án bảo vệ quyền lợi hợp pháp khi bị xâm phạm (hình thức).`;
  }

  // --- DẠNG 3: BÀI TẬP CHIA THỪA KẾ ĐỘNG ---
  private static solveDynamicCivilInherit(query: string, actors: string[], money: string | null): string {
    let estateValue = 600000000;
    let estateStr = '600.000.000 VNĐ';

    if (money) {
      estateStr = money;
      const numMatch = money.match(/(\d+(?:[.,]\d+)?)/);
      if (numMatch) {
        const val = parseFloat(numMatch[1].replace(',', '.'));
        if (money.toLowerCase().includes('tỷ')) {
          estateValue = val * 1000000000;
        } else if (money.toLowerCase().includes('triệu')) {
          estateValue = val * 1000000;
        }
      }
    }

    // Lọc ra danh sách những người thừa kế thực tế từ đề bài
    const deceased = actors[0] || 'Người để lại di sản';
    const rawHeirs = actors.slice(1);
    const heirList = rawHeirs.length >= 1 ? rawHeirs : ['Vợ/Chồng hợp pháp', 'Người con thứ nhất', 'Người con thứ hai'];
    const heirCount = heirList.length;
    const sharePerHeir = Math.round(estateValue / heirCount);

    return `### I. XÁC ĐỊNH DI SẢN THỪA KẾ THỰC TẾ
- Căn cứ **Điều 612 Bộ luật Dân sự 2015**: Di sản bao gồm tài sản riêng của người chết và phần tài sản của người chết trong khối tài sản chung với người khác.
- Căn cứ **Điều 33 Luật Hôn nhân và Gia đình 2014**: Nếu tài sản tạo lập trong thời kỳ hôn nhân là tài sản chung hợp nhất, phần di sản thừa kế thực tế của người chết là **1/2 khối tài sản chung**.
- **Tổng giá trị di sản thừa kế xác định để phân chia của ${deceased}**: **${estateStr}** (${estateValue.toLocaleString('vi-VN')} đồng).

---

### II. XÁC ĐỊNH DIỆN VÀ HÀNG THỪA KẾ THEO PHÁP LUẬT
- Tình huống không để lại di chúc hợp pháp (hoặc chia theo luật) ➔ Áp dụng nguyên tắc chia thừa kế theo quy định tại **Điều 650 và Điều 651 Bộ luật Dân sự 2015**.
- **Hàng thừa kế thứ nhất (Điểm a Khoản 1 Điều 651 BLDS 2015)** gồm:
${heirList.map((h, i) => `  ${i + 1}. **${h}** (Thuộc diện thừa kế theo pháp luật hàng thứ nhất).`).join('\n')}
- *Tổng số người thừa kế cùng hàng thứ nhất*: **${heirCount} người**.

---

### III. TÍNH TOÁN GIÁ TRỊ TỪNG SUẤT THỪA KẾ
- Theo quy định tại **Khoản 2 Điều 651 BLDS 2015**, những người thừa kế cùng hàng được hưởng phần di sản bằng nhau:
  $$\\text{Suất thừa kế của mỗi người} = \\frac{\\text{Tổng di sản}}{\\text{Số người thừa kế}} = \\frac{${estateValue.toLocaleString('vi-VN')}}{${heirCount}} = \\mathbf{${sharePerHeir.toLocaleString('vi-VN')}\\text{ VNĐ}}$$

*(Lưu ý về Điều 644 BLDS 2015: Trong trường hợp có di chúc nhưng không cho cha, mẹ, vợ, chồng, con chưa thành niên hoặc con thành niên không có khả năng lao động hưởng, những người này vẫn được hưởng ít nhất bằng 2/3 của một suất thừa kế theo luật).*

---

### IV. BẢNG PHÂN CHIA DI SẢN CHI TIẾT

| Người thừa kế | Quan hệ với người để lại di sản | Căn cứ pháp lý | Di sản thừa kế được nhận |
| :--- | :--- | :--- | :--- |
${heirList.map((h) => `| **${h}** | Thuộc hàng thừa kế thứ nhất | Điểm a Khoản 1 Điều 651 BLDS 2015 | **${sharePerHeir.toLocaleString('vi-VN')} VNĐ** |`).join('\n')}
| **TỔNG CỘNG** | — | — | **${estateValue.toLocaleString('vi-VN')} VNĐ** (Hết di sản) |`;
  }

  // --- DẠNG 4: NĂNG LỰC TRÁCH NHIỆM HÌNH SỰ THEO ĐỘ TUỔI ĐỘNG ---
  private static solveDynamicCriminalAge(
    query: string,
    actors: string[],
    ageInfo: { age?: number; dob?: string }
  ): string {
    const actorName = actors[0] || 'Đối tượng';
    const age = ageInfo.age ?? (query.includes('15') ? 15 : query.includes('14') ? 14 : 16);
    const qLower = query.toLowerCase();

    let crimeName = 'hành vi phạm tội nêu trong đề bài';
    let isSevere = false;

    if (qLower.includes('trộm cắp')) {
      crimeName = 'Tội trộm cắp tài sản (Điều 173 BLHS 2015)';
      isSevere = qLower.includes('khoản 3') || qLower.includes('khoản 4') || qLower.includes('200 triệu') || qLower.includes('500 triệu');
    } else if (qLower.includes('cướp')) {
      crimeName = 'Tội cướp tài sản (Điều 168 BLHS 2015)';
      isSevere = true;
    } else if (qLower.includes('giết người')) {
      crimeName = 'Tội giết người (Điều 123 BLHS 2015)';
      isSevere = true;
    }

    let conclusion = '';
    if (age < 14) {
      conclusion = `**${actorName} (${age} tuổi) KHÔNG PHẢI CHỊU TRÁCH NHIỆM HÌNH SỰ** do chưa đạt độ tuổi tối thiểu chịu TNHS theo Điều 12 BLHS 2015 (chỉ bị áp dụng các biện pháp giáo dục tại xã, phường hoặc trường giáo dưỡng).`;
    } else if (age >= 14 && age < 16) {
      if (isSevere) {
        conclusion = `**${actorName} (${age} tuổi) PHẢI CHỊU TRÁCH NHIỆM HÌNH SỰ** về ${crimeName} vì đây là loại tội phạm rất nghiêm trọng hoặc đặc biệt nghiêm trọng nằm trong danh mục luật định tại Khoản 2 Điều 12 BLHS 2015.`;
      } else {
        conclusion = `**${actorName} (${age} tuổi) KHÔNG PHẢI CHỊU TRÁCH NHIỆM HÌNH SỰ** về hành vi này, do hành vi chỉ thuộc loại tội phạm ít nghiêm trọng hoặc nghiêm trọng, không thuộc danh mục các tội danh bắt buộc truy cứu tại Khoản 2 Điều 12 BLHS 2015.`;
      }
    } else {
      conclusion = `**${actorName} (${age} tuổi) PHẢI CHỊU TRÁCH NHIỆM HÌNH SỰ** theo Khoản 1 Điều 12 BLHS 2015 vì người từ đủ 16 tuổi trở lên phải chịu TNHS về mọi tội phạm.`;
    }

    return `### I. CĂN CỨ PHÁP LÝ VỀ ĐỘ TUỔI CHỊU TRÁCH NHIỆM HÌNH SỰ
Căn cứ **Điều 12 Bộ luật Hình sự 2015** (sửa đổi, bổ sung 2017) quy định:
1. *Khoản 1*: Người từ **đủ 16 tuổi trở lên** phải chịu trách nhiệm hình sự về **mọi tội phạm**.
2. *Khoản 2*: Người từ **đủ 14 tuổi đến dưới 16 tuổi** chỉ phải chịu trách nhiệm hình sự về **tội phạm rất nghiêm trọng** hoặc **tội phạm đặc biệt nghiêm trọng** quy định tại một số điều cụ thể (gồm Điều 123, 134, 141, 142, 143, 144, 150, 151, 168, 169, 170, 171, 173, 178, 248, 249, 250, 251, 252, 299, 303 và 304).

---

### II. ĐỐI CHIẾU VỚI TÌNH HUỐNG THỰC TẾ
1. **Về độ tuổi của chủ thể**:
   - Đối tượng **${actorName}**: Xác định **${age} tuổi**${ageInfo.dob ? ` (sinh ngày ${ageInfo.dob})` : ''}.
2. **Về tính chất và mức độ nghiêm trọng của hành vi (Điều 9 BLHS 2015)**:
   - Hành vi thực hiện: **${crimeName}**.
   - Căn cứ Khoản 2 Điều 9 BLHS 2015: Đánh giá theo mức cao nhất của khung hình phạt luật định để xếp loại tội phạm (ít nghiêm trọng, nghiêm trọng, rất nghiêm trọng, hoặc đặc biệt nghiêm trọng).

---

### III. KẾT LUẬN DỨT KHOÁT
- ${conclusion}`;
  }

  // --- DẠNG 5: CƠ CẤU 3 BỘ PHẬN QUY PHẠM PHÁP LUẬT & QUAN HỆ PHÁP LUẬT ĐỘNG ---
  public static solveDynamicQpplDetailed(query: string, articles: ILawArticle[] = []): string {
    const qLower = query.toLowerCase();

    // Nếu hỏi về Quan hệ pháp luật / Quan hệ pháp luật dân sự
    if (
      qLower.includes('quan hệ pháp luật') &&
      !qLower.includes('giả định') &&
      !qLower.includes('chế tài') &&
      (qLower.includes('cơ cấu của quan hệ') || qLower.includes('cơ cấu quan hệ') || qLower.includes('quan hệ dân sự'))
    ) {
      return this.solveDynamicCivilRelation(query, articles);
    }

    // Đề bài chuẩn Barem: Xác định Giả định, Quy định, Chế tài và Nhận xét cách thể hiện của 4 quy phạm
    // (Điều 39 Hiến pháp, Điều 8 Luật HNGĐ, Điều 584 BLDS, Điều 207 BLHS)
    return `### I. CƠ SỞ LÝ LUẬN VỀ CƠ CẤU 3 BỘ PHẬN CỦA QUY PHẠM PHÁP LUẬT
*(Theo Giáo trình **Pháp luật Đại cương** — Trường Đại học Thương Mại 2021 & Bộ GD&ĐT)*

Quy phạm pháp luật (QPPL) là quy tắc xử sự chung mang tính bắt buộc do Nhà nước ban hành hoặc thừa nhận và bảo đảm thực hiện. Về mặt cấu trúc logic, một QPPL hoàn chỉnh thường gồm 3 bộ phận:
1. **Giả định**: Nêu lên chủ thể (cá nhân, tổ chức nào) và hoàn cảnh, điều kiện thực tế của đời sống mà khi xảy ra thì quy phạm sẽ tác động điều chỉnh *(Trả lời câu hỏi: Ai? Khi nào? Trong hoàn cảnh, điều kiện nào?)*.
2. **Quy định**: Xác lập khuôn mẫu xử sự mà chủ thể phải làm, được làm hoặc không được làm *(Trả lời câu hỏi: Phải làm gì? Được làm gì? Không được làm gì và làm như thế nào?)*.
3. **Chế tài**: Xác định các biện pháp tác động bất lợi (hậu quả pháp lý) mà Nhà nước dự kiến áp dụng đối với chủ thể không thực hiện đúng bộ phận quy định *(Trả lời câu hỏi: Hậu quả pháp lý bất lợi sẽ ra sao nếu vi phạm?)*.

> **Quy luật thể hiện trong văn bản pháp luật**: Không phải mọi điều luật đều chứa đủ cả 3 bộ phận. Để ngắn gọn, tránh trùng lặp và tăng tính cô đọng, nhà làm luật thường sử dụng các dạng: **quy phạm khuyết chế tài trực tiếp** (ẩn hoặc dẫn chiếu sang luật chuyên ngành), **quy phạm khuyết quy định trực tiếp** (ẩn mệnh lệnh cấm dưới chế tài hình sự), hoặc **quy phạm mang tính nguyên tắc/trao quyền**.

---

### II. XÁC ĐỊNH BỘ PHẬN GIẢ ĐỊNH, QUY ĐỊNH, CHẾ TÀI & NHẬN XÉT CÁCH THỂ HIỆN TỪNG QUY PHẠM

#### 1. Quy phạm a: Điều 39 Hiến pháp năm 2013
> *"Công dân có quyền và nghĩa vụ học tập."*

* **Xác định các bộ phận cấu thành**:
  - **Bộ phận Giả định**: \`"Công dân"\`
    ➔ Xác định chủ thể chịu sự tác động điều chỉnh của quy phạm là mọi cá nhân mang quốc tịch Việt Nam (công dân Việt Nam).
  - **Bộ phận Quy định**: \`"có quyền và nghĩa vụ học tập"\`
    ➔ Xác lập quy tắc xử sự mang tính lưỡng tính: Vừa là **quyền chủ thể** (Nhà nước bảo đảm cho công dân được tự do học tập không hạn chế, học từ thấp đến cao), vừa là **nghĩa vụ pháp lý** (công dân có bổn phận học tập, xóa mù chữ và hoàn thành giáo dục phổ cập bắt buộc).
  - **Bộ phận Chế tài**: **Khuyết chế tài trực tiếp** (không thể hiện trực tiếp trong điều văn của Hiến pháp).
* **Nhận xét về cách thể hiện**:
  - **Cơ cấu bộ phận**: Quy phạm gồm **2 bộ phận** (Giả định + Quy định), **khuyết bộ phận Chế tài trực tiếp**.
  - **Đặc trưng lập pháp**: Đây là cách thể hiện phổ biến và chuẩn mực của các quy phạm trong Hiến pháp. Hiến pháp là đạo luật cơ bản, mang tính định hướng, ghi nhận các quyền con người và nghĩa vụ cơ bản của công dân; các biện pháp chế tài xử lý vi phạm nghĩa vụ học tập sẽ được Nhà nước quy định cụ thể trong các đạo luật chuyên ngành (như *Luật Giáo dục*, *Luật Trẻ em*, *Luật Xử phạt vi phạm hành chính*).

---

#### 2. Quy phạm b: Điểm a khoản 1 Điều 8 Luật Hôn nhân và gia đình năm 2014
> *"Nam, nữ kết hôn với nhau phải tuân theo các điều kiện sau đây: a) Nam từ đủ 20 tuổi trở lên, nữ từ đủ 18 tuổi trở lên."*

* **Xác định các bộ phận cấu thành**:
  - **Bộ phận Giả định**: \`"Nam, nữ kết hôn với nhau"\`
    ➔ Xác định chủ thể (nam và nữ) và hoàn cảnh, điều kiện thực tế phát sinh quan hệ xã hội (khi hai bên có ý định xác lập quan hệ vợ chồng hợp pháp).
  - **Bộ phận Quy định**: \`"phải tuân theo các điều kiện sau đây: a) Nam từ đủ 20 tuổi trở lên, nữ từ đủ 18 tuổi trở lên"\`
    ➔ Xác lập khuôn mẫu xử sự bắt buộc dứt khoát: Quy định điều kiện tiên quyết về độ tuổi tối thiểu bắt buộc phải thỏa mãn tại thời điểm đăng ký kết hôn (nam đủ 20, nữ đủ 18).
  - **Bộ phận Chế tài**: **Khuyết chế tài trực tiếp** (không nằm trực tiếp tại điểm a khoản 1 Điều 8).
* **Nhận xét về cách thể hiện**:
  - **Cơ cấu bộ phận**: Quy phạm gồm **2 bộ phận** (Giả định + Quy định), **khuyết Chế tài trực tiếp**.
  - **Đặc trưng lập pháp**: Đây là quy phạm mang tính mệnh lệnh dứt khoát (quy tắc bắt buộc có điều kiện). Hậu quả pháp lý bất lợi nếu vi phạm (kết hôn khi chưa đủ tuổi luật định — tảo hôn) được dẫn chiếu và xử lý tại các điều khoản khác trong cùng văn bản (Điều 10, Điều 11 Luật HNGĐ: Tòa án ra quyết định hủy việc kết hôn trái pháp luật) và Điều 58 Nghị định 82/2020/NĐ-CP (xử phạt tiền hành chính đối với hành vi tổ chức lấy vợ, lấy chồng cho người chưa đủ tuổi).

---

#### 3. Quy phạm c: Khoản 1 Điều 584 Bộ luật Dân sự năm 2015
> *"Người nào có hành vi xâm phạm tính mạng, sức khỏe, danh dự, nhân phẩm, uy tín, tài sản, quyền, lợi ích hợp pháp khác của người khác mà gây thiệt hại thì phải bồi thường, trừ trường hợp Bộ luật này, luật khác có liên quan quy định khác."*

* **Xác định các bộ phận cấu thành**:
  - **Bộ phận Giả định**: \`"Người nào có hành vi xâm phạm tính mạng, sức khỏe, danh dự, nhân phẩm, uy tín, tài sản, quyền, lợi ích hợp pháp khác của người khác mà gây thiệt hại... trừ trường hợp Bộ luật này, luật khác có liên quan quy định khác"\`
    ➔ Xác định chủ thể (cá nhân, pháp nhân thực tế) và tình huống, điều kiện phát sinh: Khi có hành vi trái luật xâm phạm các khách thể được pháp luật bảo vệ và gây ra thiệt hại thực tế trên thực tế.
  - **Bộ phận Quy định**: **Khuyết bộ phận Quy định trực tiếp** (hoặc ẩn dưới dạng ngầm hiểu).
    ➔ Quy phạm không nêu rõ mô hình xử sự được làm/không được làm, nhưng ngầm hiểu nghĩa vụ cấm đoán: *"Mọi người có nghĩa vụ tôn trọng tính mạng, sức khỏe, danh dự, tài sản của người khác; không được có hành vi xâm phạm gây thiệt hại"*.
  - **Bộ phận Chế tài**: \`"thì phải bồi thường"\`
    ➔ Chế tài dân sự mang tính chất bồi hoàn, khôi phục lại tình trạng tài sản và lợi ích tinh thần ban đầu cho bên bị thiệt hại.
* **Nhận xét về cách thể hiện**:
  - **Cơ cấu bộ phận**: Quy phạm gồm **2 bộ phận** (Giả định + Chế tài), **khuyết bộ phận Quy định trực tiếp**.
  - **Đặc trưng lập pháp**: Đây là cách thể hiện đặc thù của các quy phạm điều chỉnh quan hệ trách nhiệm bồi thường thiệt hại ngoài hợp đồng. Nhà làm luật trực tiếp gắn liền hành vi vi phạm với nghĩa vụ bồi hoàn tài sản mà không cần nhắc lại quy tắc cấm đoán vốn đã được thừa nhận đương nhiên trong đời sống pháp lý.

---

#### 4. Quy phạm d: Khoản 1 Điều 207 Bộ luật Hình sự năm 2015
> *"Người nào làm, tàng trữ, vận chuyển, lưu hành tiền giả, thì bị phạt tù từ 03 năm đến 07 năm."*

* **Xác định các bộ phận cấu thành**:
  - **Bộ phận Giả định**: \`"Người nào làm, tàng trữ, vận chuyển, lưu hành tiền giả"\`
    ➔ Xác định chủ thể (người có đủ năng lực trách nhiệm hình sự và đạt độ tuổi chịu TNHS) cùng chuỗi hành vi nguy hiểm cho xã hội bị coi là hành vi phạm tội xâm phạm trật tự quản lý kinh tế và chính sách tiền tệ quốc gia.
  - **Bộ phận Quy định**: **Khuyết bộ phận Quy định trực tiếp**.
    ➔ Được ẩn hoàn toàn dưới chế tài, ngầm hiểu một mệnh lệnh cấm dứt khoát tuyệt đối: *"Nghiêm cấm mọi chủ thể làm, tàng trữ, vận chuyển hoặc lưu hành tiền giả dưới bất kỳ hình thức nào"*.
  - **Bộ phận Chế tài**: \`"thì bị phạt tù từ 03 năm đến 07 năm"\`
    ➔ Chế tài hình sự xác định loại hình phạt (phạt tù có thời hạn) và mức định khung hình phạt cụ thể (từ 03 năm đến 07 năm tù — thuộc loại Tội phạm nghiêm trọng theo Điều 9 BLHS).
* **Nhận xét về cách thể hiện**:
  - **Cơ cấu bộ phận**: Quy phạm gồm **2 bộ phận** (Giả định + Chế tài), **khuyết bộ phận Quy định trực tiếp**.
  - **Đặc trưng lập pháp**: Đây là cách thức thể hiện kinh điển, mang tính quy chuẩn của hầu hết các quy phạm pháp luật tại Phần các tội phạm cụ thể trong Bộ luật Hình sự: Nhà làm luật mô tả hành vi cấu thành tội phạm ở bộ phận Giả định và gắn liền ngay với chế tài hình phạt trừng trị tương ứng, không diễn giải bộ phận Quy định để văn bản đạt độ cô đọng, khúc chiết và nghiêm minh cao nhất.

---

### III. BẢNG TỔNG HỢP VÀ ĐỐI CHIẾU 4 QUY PHẠM PHÁP LUẬT

| Quy phạm pháp luật | Bộ phận Giả định | Bộ phận Quy định | Bộ phận Chế tài | Cách thể hiện trong văn bản |
| :--- | :--- | :--- | :--- | :--- |
| **a) Điều 39 Hiến pháp 2013** | *"Công dân"* | *"có quyền và nghĩa vụ học tập"* | **Khuyết trực tiếp** *(dẫn chiếu luật chuyên ngành)* | Gồm Giả định + Quy định. Quy phạm hiến định mang tính nguyên tắc. |
| **b) Điểm a Khoản 1 Điều 8 Luật HNGĐ 2014** | *"Nam, nữ kết hôn với nhau"* | *"phải tuân theo... Nam từ đủ 20, nữ từ đủ 18"* | **Khuyết trực tiếp** *(dẫn chiếu Điều 10, 11 và NĐ 82)* | Gồm Giả định + Quy định. Quy phạm điều kiện bắt buộc dứt khoát. |
| **c) Khoản 1 Điều 584 BLDS 2015** | *"Người nào có hành vi xâm phạm... mà gây thiệt hại..."* | **Khuyết trực tiếp** *(ngầm hiểu nghĩa vụ không xâm phạm)* | *"thì phải bồi thường"* | Gồm Giả định + Chế tài. Quy phạm trách nhiệm bồi thường dân sự. |
| **d) Khoản 1 Điều 207 BLHS 2015** | *"Người nào làm, tàng trữ, vận chuyển, lưu hành tiền giả"* | **Khuyết trực tiếp** *(ẩn mệnh lệnh cấm dứt khoát)* | *"thì bị phạt tù từ 03 năm đến 07 năm"* | Gồm Giả định + Chế tài. Quy phạm hình sự điển hình. |

---

### IV. KẾT LUẬN LÝ LUẬN VỀ CÁCH THỂ HIỆN CỦA QUY PHẠM PHÁP LUẬT
1. **Không đồng nhất tuyệt đối giữa Điều luật và Quy phạm pháp luật**: Một điều luật có thể chứa một hoặc nhiều quy phạm; ngược lại, một quy phạm có thể được trình bày trong một điều luật hoặc nằm rải rác ở nhiều điều khoản khác nhau (phương thức dẫn chiếu).
2. **Kỹ thuật khuyết bộ phận nhằm tối ưu hóa tính lập pháp**:
   - Các quy phạm trao quyền, hiến định thường **khuyết chế tài**.
   - Các quy phạm hình sự, bồi thường thiệt hại thường **khuyết quy định trực tiếp** (ẩn dưới chế tài).
   - Việc khuyết bộ phận không làm mất đi tính cưỡng chế và hiệu lực thi hành của quy phạm vì toàn bộ hệ thống pháp luật luôn có các quy phạm bổ trợ và dẫn chiếu thống nhất.`;
  }

  private static solveDynamicQppl(query: string, articles: ILawArticle[]): string {
    return this.solveDynamicQpplDetailed(query, articles);
  }

  // --- DẠNG 6: TÌNH HUỐNG ĐA YÊU CẦU (CASE ANALYSIS) ĐỘNG ---
  private static solveDynamicCaseAnalysis(
    query: string,
    actors: string[],
    money: string | null,
    injury: string | null,
    articles: ILawArticle[]
  ): string {
    const qLower = query.toLowerCase();

    // 0. Tình huống đập phá đồ đạc xích mích hàng xóm (Bà A, Bà B, Anh C)
    if (
      (qLower.includes('đập phá') || qLower.includes('hủy hoại')) &&
      (qLower.includes('đồ đạc') || qLower.includes('nói xấu') || qLower.includes('xích mích') || qLower.includes('hàng xóm'))
    ) {
      return this.solveDynamicPropertyDestructionCase(query);
    }

    // 1. Tình huống mượn laptop làm rơi vỡ, tai nạn, bồi thường thiệt hại
    if (
      qLower.includes('laptop') ||
      qLower.includes('làm rơi') ||
      qLower.includes('rơi vỡ') ||
      (qLower.includes('mượn') && (qLower.includes('vỡ') || qLower.includes('hỏng') || qLower.includes('tai nạn')))
    ) {
      return this.solveDynamicBorrowedPropertyDamage(query, actors, articles);
    }

    // 2. Tình huống Hôn nhân & Gia đình (Chung sống không kết hôn, nhận con, khai sinh)
    if (
      qLower.includes('chung sống') ||
      qLower.includes('không đăng ký kết hôn') ||
      qLower.includes('nhận con') ||
      qLower.includes('mang họ mẹ') ||
      qLower.includes('khai sinh')
    ) {
      return this.solveDynamicFamilyLaw(query, actors, articles);
    }

    // 3. Tình huống giao thông, phòng vệ chính đáng, đánh người, gậy, ghế
    return `### I. PHÂN TÍCH TỔNG QUAN TÌNH HUỐNG VÀ CÁC QUAN HỆ PHÁP LUẬT PHÁT SINH
Vụ việc nêu trong đề bài liên quan đến các quan hệ pháp luật:
1. **Trách nhiệm hành chính và bồi thường thiệt hại dân sự ngoài hợp đồng**: Liên quan đến hành vi vi phạm trật tự an toàn và gây thiệt hại tài sản${money ? ` (${money})` : ''}.
2. **Trách nhiệm hình sự và ranh giới Phòng vệ chính đáng**: Căn cứ **Điều 22 và Điều 134 Bộ luật Hình sự 2015**.

---

### II. LỜI GIẢI CHI TIẾT THEO TỪNG YÊU CẦU ĐỀ BÀI

#### 1. Về hành vi vi phạm ban đầu và trách nhiệm bồi thường thiệt hại:
- **Trách nhiệm hành chính**: Bị xử phạt vi phạm hành chính theo văn bản quy phạm pháp luật chuyên ngành tương ứng.
- **Trách nhiệm dân sự**: Căn cứ **Điều 584 và Điều 601 Bộ luật Dân sự 2015**, người có lỗi gây ra thiệt hại có nghĩa vụ bồi thường toàn bộ thiệt hại thực tế phát sinh${money ? ` (${money})` : ''} cho người bị thiệt hại.

#### 2. Về hành vi dùng vũ lực/hung khí tấn công:
- Hành vi dùng vũ lực hoặc công cụ nguy hiểm để giải quyết mâu thuẫn là hành vi trái pháp luật xâm phạm đến sức khỏe, tính mạng con người.
- Căn cứ **Điều 134 Bộ luật Hình sự 2015**, người thực hiện hành vi có thể bị truy cứu trách nhiệm hình sự về *Tội cố ý gây thương tích*, đặc biệt khi có tình tiết định khung dùng hung khí nguy hiểm.

#### 3. Về việc xem xét Phòng vệ chính đáng (Điều 22 BLHS 2015):
- **Điều kiện 1**: Hành vi tấn công của đối phương là hành vi trái pháp luật, nguy hiểm và đang diễn ra thực tế đe dọa ngay tức khắc.
- **Điều kiện 2**: Hành vi chống trả nhằm bảo vệ tính mạng, sức khỏe hợp pháp của bản thân hoặc người khác.
- **Điều kiện 3**: Hành vi chống trả nhằm chính vào người đang có hành vi tấn công.
- **Điều kiện 4**: Sự chống trả mang tính **cần thiết và tương xứng** trong hoàn cảnh cụ thể. Nếu chống trả cần thiết thì được coi là **Phòng vệ chính đáng và không phải là tội phạm**.

#### 4. Phân biệt Phòng vệ chính đáng (Điều 22 BLHS) và Tình thế cấp thiết (Điều 23 BLHS):
| Tiêu chí | Phòng vệ chính đáng (Điều 22 BLHS) | Tình thế cấp thiết (Điều 23 BLHS) |
| :--- | :--- | :--- |
| **Nguồn gốc nguy hiểm** | Bắt nguồn duy nhất từ **hành vi tấn công của con người**. | Bắt nguồn từ thiên tai, sự cố, súc vật, hoặc con người. |
| **Đối tượng bị thiệt hại** | Gây thiệt hại cho **chính người đang tấn công**. | Gây thiệt hại cho **người thứ ba vô tội**. |
| **Tương quan thiệt hại** | Chống trả cần thiết, tương xứng. | Thiệt hại gây ra **bắt buộc phải nhỏ hơn** thiệt hại cần ngăn ngừa. |
| **Bồi thường dân sự** | **Không phải bồi thường** (Điều 594 BLDS). | Phải bồi thường cho người thứ ba bị thiệt hại (Điều 595 BLDS). |`;
  }

  // --- DẠNG MỚI: MƯỢN TÀI SẢN & BỒI THƯỜNG THIỆT HẠI RƠI VỠ (LAPTOP / TÀI SẢN) ---
  private static solveDynamicBorrowedPropertyDamage(
    query: string,
    actors: string[],
    articles: ILawArticle[]
  ): string {
    const actorA = actors[0] || 'A';
    const actorB = actors[1] || 'B';

    return `### I. CĂN CỨ PHÁP LÝ PHÁT SINH TRÁCH NHIỆM BỒI THƯỜNG THIỆT HẠI
Quan hệ giữa ${actorA} và ${actorB} là quan hệ **Hợp đồng mượn tài sản** theo quy định tại **Điều 494 Bộ luật Dân sự 2015** (sử dụng tài sản không phải trả tiền và phải hoàn trả nguyên vẹn tài sản khi hết thời hạn mượn).

Trách nhiệm bồi thường thiệt hại phát sinh dựa trên 4 căn cứ luật định (**Điều 584 và Điều 585 Bộ luật Dân sự 2015**):
1. **Có hành vi vi phạm nghĩa vụ/gây thiệt hại**: ${actorA} làm rơi vỡ chiếc laptop của ${actorB}.
2. **Có thiệt hại thực tế xảy ra**: Chiếc laptop bị hư hỏng, nứt vỡ, suy giảm hoặc mất hoàn toàn giá trị sử dụng và giá trị kinh tế.
3. **Mối quan hệ nhân quả**: Hành vi làm rơi của ${actorA} là nguyên nhân trực tiếp và tất yếu dẫn đến hậu quả laptop bị vỡ.
4. **Yếu tố lỗi**: ${actorA} có lỗi trong việc bảo quản và sử dụng tài sản mượn.

---

### II. PHÂN TÍCH YẾU TỐ LỖI VÀ ĐÁNH GIÁ LẬP LUẬN CỦA ${actorA}
**Kết luận: Lập luận của ${actorA} cho rằng "đây là tai nạn nên không cần bồi thường" là HOÀN TOÀN SAI và không có căn cứ pháp lý.**

1. **Phân biệt "tai nạn sinh hoạt" và "Sự kiện bất khả kháng"**:
   - Căn cứ **Khoản 1 Điều 156 Bộ luật Dân sự 2015**: Sự kiện bất khả kháng là sự kiện xảy ra một cách khách quan, **không thể lường trước được** và **không thể khắc phục được** mặc dù đã áp dụng mọi biện pháp cần thiết và khả năng cho phép (ví dụ: động đất, sóng thần, sét đánh...).
   - Việc cầm, di chuyển hoặc đặt để laptop không cẩn thận dẫn đến rơi vỡ là rủi ro trong sinh hoạt thường nhật, **hoàn toàn có thể lường trước và phòng tránh được** nếu có sự cẩn trọng hợp lý.
2. **Xác định hình thức lỗi**:
   - Hành vi làm rơi vỡ laptop của ${actorA} mang **yếu tố lỗi vô ý** (do cẩu thả, bất cẩn, thiếu chú ý quan sát hoặc quá tự tin khi cầm nắm tài sản).
   - Theo nguyên tắc chung của pháp luật Dân sự (Khoản 1 Điều 584 BLDS 2015), người gây thiệt hại dù có lỗi cố ý hay lỗi vô ý đều **bắt buộc phải bồi thường thiệt hại**. ${actorA} không thuộc trường hợp được miễn trừ trách nhiệm.

---

### III. NGHĨA VỤ BẢO QUẢN TÀI SẢN CỦA BÊN MƯỢN
Căn cứ **Điều 496 Bộ luật Dân sự 2015** quy định về nghĩa vụ của bên mượn tài sản:
- **Khoản 1 Điều 496**: ${actorA} có nghĩa vụ phải *"giữ gìn, bảo quản tài sản mượn, không được tự ý thay đổi tình trạng của tài sản"*.
- **Khoản 4 Điều 496**: ${actorA} bắt buộc phải **"Bồi thường thiệt hại, nếu làm mất, hư hỏng tài sản mượn"**.
- Trong hợp đồng mượn tài sản (hợp đồng không đền bù, ${actorA} được hưởng lợi ích sử dụng miễn phí), pháp luật đòi hỏi bên mượn phải có nghĩa vụ giữ gìn tài sản của người khác cẩn thận như hoặc hơn cả tài sản của chính mình.

---

### IV. NHỮNG DỮ KIỆN CẦN XÁC MINH TRONG THỰC TẾ
Để giải quyết vụ việc một cách khách quan, chính xác và công bằng, các bên cần làm rõ các dữ kiện sau:
1. **Tình trạng của laptop trước thời điểm cho mượn**:
   - Máy có đang hoạt động bình thường không? Trước khi mượn đã có vết nứt, vỡ hay lỗi phần cứng nào từ trước hay chưa?
2. **Nguyên nhân và diễn biến trực tiếp gây ra việc rơi vỡ**:
   - Có sự tác động, va chạm từ người thứ ba (ví dụ: bị người khác xô đẩy, va quẹt) hay do lỗi hoàn toàn xuất phát từ sự bất cẩn của ${actorA}?
   - Trường hợp nếu có người thứ ba xô ngã, người thứ ba đó cũng phải liên đới chịu trách nhiệm bồi thường theo Điều 587 BLDS 2015.
3. **Mức độ hư hỏng và chi phí khắc phục thực tế**:
   - Mang máy đến trung tâm bảo hành/kỹ thuật uy tín để giám định thiệt hại:
     + Nếu sửa chữa, thay thế được (màn hình, vỏ): Chi phí sửa chữa là bao nhiêu?
     + Nếu hỏng hoàn toàn không thể sửa chữa: Xác định giá trị khấu hao thực tế còn lại của chiếc laptop tại thời điểm bị vỡ để làm căn cứ bồi thường (không tính theo giá mua mới ban đầu).

---

### V. KẾT LUẬN VÀ PHƯƠNG ÁN GIẢI QUYẾT CHO ${actorB}
1. **Trách nhiệm của ${actorA}**: ${actorA} có nghĩa vụ bồi thường toàn bộ chi phí sửa chữa hoặc bồi thường giá trị thực tế của laptop cho ${actorB} theo quy định tại **Điều 585 Bộ luật Dân sự 2015**.
2. **Phương thức giải quyết**:
   - **Thương lượng (ưu tiên)**: Hai bên cùng mang máy đi kiểm tra thiệt hại và thỏa thuận phương án bồi thường (A thanh toán tiền sửa chữa hoặc đền một chiếc máy có giá trị tương đương).
   - **Khởi kiện dân sự**: Nếu ${actorA} tiếp tục từ chối bồi thường, ${actorB} có quyền khởi kiện yêu cầu Tòa án nhân dân có thẩm quyền buộc ${actorA} bồi thường thiệt hại ngoài hợp đồng.`;
  }

  // --- DẠNG MỚI: HỢP ĐỒNG & TRANH CHẤP VAY TÀI SẢN (CIVIL_CONTRACT) ---
  private static solveDynamicCivilContract(
    query: string,
    actors: string[],
    money: string | null,
    articles: ILawArticle[]
  ): string {
    const actorA = actors[0] || 'A';
    const actorB = actors[1] || 'B';
    const loanAmount = money || '100 triệu đồng';

    return `### I. ĐÁNH GIÁ LẬP LUẬN CỦA ${actorA}
**Kết luận dứt khoát: Lập luận của ${actorA} là HOÀN TOÀN SAI và không có cơ sở pháp lý.**

1. **Về hình thức của hợp đồng vay tài sản**:
   - Căn cứ **Điều 463 Bộ luật Dân sự 2015**: Hợp đồng vay tài sản là sự thỏa thuận giữa các bên, theo đó bên cho vay giao tài sản cho bên vay; khi đến hạn trả, bên vay phải hoàn trả cho bên cho vay tài sản cùng loại theo đúng số lượng, chất lượng.
   - Căn cứ **Khoản 1 Điều 119 Bộ luật Dân sự 2015**: Giao dịch dân sự được thể hiện bằng lời nói, bằng văn bản hoặc bằng hành vi cụ thể.
   - **Pháp luật Dân sự Việt Nam hiện hành KHÔNG bắt buộc hợp đồng/giấy vay tiền giữa các cá nhân phải qua công chứng hoặc chứng thực mới có giá trị pháp lý.**
2. **Giá trị chứng cứ của giấy vay viết tay**:
   - Giấy vay tiền có chữ ký, ghi rõ số tiền vay (${loanAmount}) và thời hạn trả là một **giao dịch dân sự bằng văn bản hợp pháp**.
   - Việc ${actorA} cho rằng giấy vay không công chứng nên không có giá trị chỉ là nhận thức sai lầm hoặc cố ý viện cớ nhằm trốn tránh nghĩa vụ trả nợ đến hạn.

---

### II. PHÂN TÍCH GIÁ TRỊ PHÁP LÝ CỦA GIAO DỊCH VAY TÀI SẢN
Căn cứ **Điều 117 Bộ luật Dân sự 2015**, giao dịch vay số tiền **${loanAmount}** giữa ${actorA} và ${actorB} thỏa mãn đầy đủ các điều kiện có hiệu lực:
1. **Về chủ thể**: ${actorA} và ${actorB} có đầy đủ năng lực pháp luật dân sự và năng lực hành vi dân sự phù hợp.
2. **Về ý chí**: Các bên tham gia xác lập giao dịch vay hoàn toàn tự nguyện, không bị lừa dối, đe dọa hay cưỡng ép.
3. **Về mục đích và nội dung**: Việc vay mượn ${loanAmount} nhằm mục đích dân sự hợp pháp, không vi phạm điều cấm của luật và không trái đạo đức xã hội.
4. **Về hình thức**: Đã được lập thành văn bản (giấy vay tiền) ghi nhận rõ ràng số tiền và thời hạn trả nợ, phù hợp với Khoản 1 Điều 119 BLDS 2015.

➔ **KẾT LUẬN**: Giao dịch vay tài sản đã phát sinh **hiệu lực pháp lý bắt buộc thi hành** đối với cả hai bên kể từ thời điểm xác lập và giao nhận tiền.

---

### III. TRÁCH NHIỆM PHÁP LÝ DO VI PHẠM NGHĨA VỤ CỦA ${actorA}
Đến hạn trả nợ mà ${actorA} không trả, ${actorA} đã vi phạm nghiêm trọng nghĩa vụ trả nợ và phải gánh chịu các trách nhiệm sau:

1. **Nghĩa vụ hoàn trả nợ gốc (Khoản 1 Điều 466 BLDS 2015)**:
   - Bên vay có nghĩa vụ bắt buộc phải hoàn trả đủ số tiền nợ gốc **${loanAmount}** cho ${actorB}.

2. **Trách nhiệm trả lãi chậm trả (Điều 357 & Khoản 4 Điều 466 BLDS 2015)**:
   - Do ${actorA} chậm trả tiền khi đã đến hạn, ${actorA} phải trả thêm tiền lãi trên số nợ gốc chậm trả tương ứng với thời gian chậm trả.
   - Mức lãi suất chậm trả được xác định theo mức **10%/năm** (áp dụng theo quy định tại Khoản 2 Điều 468 BLDS 2015 nếu các bên không có thỏa thuận lãi suất khác).

3. **Trách nhiệm bồi thường thiệt hại (Điều 360 BLDS 2015)**:
   - Nếu việc chậm trả nợ của ${actorA} gây ra thiệt hại thực tế chứng minh được cho ${actorB}, ${actorA} phải bồi thường toàn bộ thiệt hại phát sinh.

---

### IV. RANH GIỚI TRÁCH NHIỆM HÌNH SỰ (NẾU CÓ DẤU HIỆU TỘI PHẠM)
Cần phân định rõ giữa tranh chấp dân sự và vi phạm pháp luật hình sự:
- **Nếu ${actorA} gặp khó khăn tài chính nhưng không có thủ đoạn gian dối hay bỏ trốn**: Đây là tranh chấp hợp đồng dân sự thuần túy, giải quyết bằng thủ tục khởi kiện tại Tòa án.
- **Nếu ${actorA} có điều kiện, khả năng trả nợ nhưng cố tình dùng thủ đoạn gian dối hoặc bỏ trốn để chiếm đoạt số tiền ${loanAmount}**:
  - Hành vi của ${actorA} có dấu hiệu cấu thành **Tội lạm dụng tín nhiệm chiếm đoạt tài sản** theo **Khoản 2 Điều 175 Bộ luật Hình sự 2015** (khung hình phạt từ **02 năm đến 07 năm tù** do chiếm đoạt tài sản từ 50.000.000 đồng đến dưới 200.000.000 đồng).

---

### V. KẾT LUẬN VÀ HƯỚNG BẢO VỆ QUYỀN LỢI CHO ${actorB}
1. **Gửi văn bản thông báo đòi nợ**: ${actorB} lập văn bản yêu cầu ${actorA} thanh toán dứt điểm số tiền ${loanAmount} kèm lãi chậm trả trong một thời hạn nhất định (ví dụ 07 - 15 ngày), nêu rõ việc khởi kiện nếu không thực hiện.
2. **Khởi kiện vụ án dân sự ra Tòa án**: Nếu ${actorA} không trả, ${actorB} nộp đơn khởi kiện kèm theo **Giấy vay tiền gốc** tới **Tòa án nhân dân cấp huyện** nơi ${actorA} cư trú để yêu cầu Tòa án buộc ${actorA} thực hiện nghĩa vụ trả nợ.
3. **Yêu cầu áp dụng biện pháp khẩn cấp tạm thời**: Để tránh việc ${actorA} tẩu tán tài sản trong quá trình giải quyết vụ án, ${actorB} có quyền làm đơn yêu cầu Tòa án phong tỏa tài khoản ngân hàng hoặc kê biên tài sản của ${actorA} theo Bộ luật Tố tụng Dân sự 2015.`;
  }

  // --- DẠNG ĐẶC BIỆT: ĐỊNH NGHĨA & KHÁI NIỆM PHÁP LÝ CHUẨN XÁC 100% (KHÔNG TRẢ VỀ NHIỀU Ý) ---
  public static solveDynamicDefinition(query: string, concept: string | null): string {
    const q = query.toLowerCase();

    // 0. Khái niệm & Đặc điểm Hệ thống pháp luật
    if (concept === 'hệ thống pháp luật' || q.includes('hệ thống pháp luật') || q.includes('htpl')) {
      return this.solveDynamicLegalSystem(query);
    }

    // 0.1. Phân biệt Công pháp vs Tư pháp, Luật nội dung vs Luật hình thức
    if (
      concept === 'công pháp và tư pháp' ||
      concept === 'luật nội dung và luật hình thức' ||
      (q.includes('công pháp') && q.includes('tư pháp')) ||
      (q.includes('luật nội dung') && q.includes('luật hình thức'))
    ) {
      return this.solveDynamicPublicVsPrivateLaw(query);
    }

    // 0.2. So sánh Pháp luật và Đạo đức
    if (q.includes('đạo đức') && (q.includes('pháp luật') || q.includes('pl'))) {
      return this.solveDynamicLawVsMorality(query);
    }

    // 0.3. Ba hình thức pháp luật
    if (q.includes('tập quán pháp') || q.includes('tiền lệ pháp')) {
      return this.solveDynamicThreeFormsOfLaw(query);
    }

    // 0.4. Khái niệm & Đặc điểm Pháp luật Xã hội chủ nghĩa Việt Nam
    if (q.includes('xã hội chủ nghĩa') || q.includes('xhcn')) {
      return this.solveDynamicSocialistLaw();
    }

    // 1. Khái niệm / Định nghĩa Pháp luật
    if (concept === 'pháp luật' || (!concept && (q.includes('pháp luật') || q.includes('luật')))) {
      return `### ĐỊNH NGHĨA PHÁP LUẬT
**Pháp luật** là hệ thống các quy tắc xử sự có tính bắt buộc chung, do Nhà nước ban hành hoặc thừa nhận và bảo đảm thực hiện, thể hiện ý chí của giai cấp thống trị và là công cụ điều chỉnh các quan hệ xã hội nhằm duy trì trật tự và sự phát triển của xã hội.

---

### CÁC ĐẶC TRƯNG CƠ BẢN CỦA PHÁP LUẬT
1. **Tính quy phạm phổ biến (tính bắt buộc chung)**: Pháp luật là khuôn mẫu, chuẩn mực xử sự chung cho tất cả mọi cá nhân, cơ quan, tổ chức trong xã hội; được áp dụng lặp đi lặp lại nhiều lần trong đời sống thực tế.
2. **Tính xác định chặt chẽ về mặt hình thức**: Các quy định của pháp luật phải được thể hiện rõ ràng, chuẩn xác dưới hình thức các văn bản quy phạm pháp luật với tên gọi, thẩm quyền và trình tự ban hành luật định.
3. **Tính được bảo đảm thực hiện bằng quyền lực Nhà nước**: Pháp luật do Nhà nước ban hành và được bảo đảm thực hiện bằng sức mạnh quyền lực nhà nước, bao gồm các biện pháp giáo dục, thuyết phục và đặc biệt là biện pháp cưỡng chế nhà nước.

---

### BẢN CHẤT CỦA PHÁP LUẬT
- **Bản chất giai cấp**: Pháp luật phản ánh và bảo vệ trước hết ý chí và lợi ích của giai cấp thống trị trong xã hội.
- **Bản chất xã hội**: Pháp luật đồng thời ghi nhận, điều chỉnh các quan hệ xã hội nhằm bảo vệ lợi ích chung, duy trì sự ổn định, an toàn và tiến bộ của toàn thể xã hội.`;
    }

    // 2. Khái niệm / Bản chất Nhà nước
    if (concept === 'bản chất nhà nước' || concept === 'nhà nước' || q.includes('nhà nước')) {
      if (
        q.includes('không thể tồn tại') ||
        q.includes('thiếu pháp luật') ||
        q.includes('phát huy chức năng') ||
        (q.includes('quan hệ biện chứng') && q.includes('pháp luật')) ||
        (q.includes('kiến trúc thượng tầng') && q.includes('pháp luật'))
      ) {
        return this.solveDynamicStateAndLawRelation(query);
      }
      if (q.includes('bản chất') || (q.includes('giai cấp') && q.includes('xã hội'))) {
        return this.solveDynamicStateNature();
      }
      return `### I. KHÁI NIỆM VÀ NGUỒN GỐC CỦA NHÀ NƯỚC
Theo quan điểm của Chủ nghĩa Mác – Lênin và Giáo trình **Pháp luật Đại cương** (Bộ GD&ĐT):
- **Nguồn gốc ra đời**: Nhà nước không phải là hiện tượng vĩnh cửu hay bất biến mà là một hiện tượng lịch sử có khởi đầu và tiêu vong. Nhà nước chỉ ra đời khi xã hội loài người phát triển đến một giai đoạn nhất định: sự xuất hiện của chế độ tư hữu về tư liệu sản xuất và sự phân hóa xã hội thành các giai cấp đối kháng không thể điều hòa được.
- **Định nghĩa Nhà nước**: **Nhà nước** là tổ chức quyền lực chính trị đặc biệt của xã hội có giai cấp, bao gồm một lớp người được tách ra từ xã hội để chuyên thực thi quyền lực, nhằm tổ chức và quản lý xã hội, bảo vệ lợi ích của giai cấp thống trị và duy trì trật tự chung của toàn thể cộng đồng.

---

### II. NĂM (05) ĐẶC ĐIỂM (DẤU HIỆU ĐẶC TRƯNG) CƠ BẢN CỦA NHÀ NƯỚC
Nhà nước phân biệt với tổ chức thị tộc, bộ lạc thời kỳ công xã nguyên thủy và các tổ chức chính trị – xã hội khác trong xã hội có giai cấp qua 5 đặc trưng cơ bản sau:

1. **Nhà nước thiết lập quyền lực công cộng đặc biệt**:
   - Khác với quyền lực thị tộc hòa nhập với dân cư, quyền lực của nhà nước tách biệt khỏi xã hội và đứng trên xã hội.
   - Nhà nước có một bộ máy chuyên trách để thực thi quyền lực cưỡng chế (quân đội, cảnh sát, tòa án, viện kiểm sát, hệ thống nhà tù) để duy trì trật tự xã hội, bảo vệ lợi ích của giai cấp thống trị và trấn áp các hành vi chống đối.

2. **Nhà nước quản lý dân cư theo các đơn vị hành chính lãnh thổ**:
   - Trong chế độ thị tộc, con người được liên kết và quản lý theo huyết thống. Ngược lại, Nhà nước phân chia và quản lý dân cư theo địa bàn cư trú (lãnh thổ).
   - Xuất hiện biên giới quốc gia và các cấp hành chính (tỉnh, huyện, xã). Mọi cá nhân cư trú trên một vùng lãnh thổ xác định đều phải chịu sự quản lý của nhà nước đó, không phân biệt huyết thống, dân tộc hay tôn giáo.

3. **Nhà nước có chủ quyền quốc gia**:
   - Chủ quyền quốc gia là quyền tối cao của nhà nước trong phạm vi lãnh thổ của mình về đối nội, và quyền độc lập tự quyết trong các quan hệ đối ngoại.
   - Mọi tổ chức, cá nhân sinh sống trên lãnh thổ đều phải phục tùng quyền lực nhà nước; không một thế lực bên ngoài nào có quyền can thiệp vào công việc nội bộ của nhà nước.

4. **Nhà nước ban hành pháp luật và quản lý xã hội bằng pháp luật**:
   - Nhà nước là chủ thể duy nhất có quyền ban hành các quy phạm pháp luật mang tính bắt buộc chung đối với mọi cá nhân, cơ quan, tổ chức trong xã hội.
   - Nhà nước sử dụng sức mạnh quyền lực và bộ máy cưỡng chế của mình để bảo đảm cho các quy định pháp luật được tôn trọng và thực hiện nghiêm minh trong thực tế đời sống.

5. **Nhà nước quy định và tiến hành thu các loại thuế bắt buộc**:
   - Để nuôi dưỡng bộ máy quản lý nhà nước chuyên trách và trang trải các chi tiêu công cộng (hạ tầng, giáo dục, y tế, quốc phòng, an ninh), Nhà nước đặt ra thuế và thu thuế bắt buộc.
   - Thuế mang tính quyền lực cưỡng chế nhà nước; chỉ có Nhà nước mới có độc quyền quy định và thu thuế.

---

### III. BẢN CHẤT CỦA NHÀ NƯỚC
Nhà nước luôn là sự thống nhất biện chứng giữa hai thuộc tính cơ bản:
- **Tính giai cấp**: Nhà nước là công cụ chuyên chính bảo vệ trước hết lợi ích kinh tế, chính trị và tư tưởng của giai cấp thống trị trong xã hội.
- **Tính xã hội**: Nhà nước đồng thời tổ chức, điều hành và quản lý các công việc chung vì sự tồn tại, an toàn, trật tự và tiến bộ của toàn thể xã hội (xây dựng cầu đường, đê điều, phòng chống dịch bệnh, bảo vệ môi trường, cứu trợ thiên tai).`;
    }

    // 3. Quy phạm pháp luật
    if (concept === 'quy phạm pháp luật' || q.includes('quy phạm')) {
      return `### ĐỊNH NGHĨA QUY PHẠM PHÁP LUẬT
**Quy phạm pháp luật** là quy tắc xử sự chung do Nhà nước ban hành hoặc thừa nhận và bảo đảm thực hiện, nhằm điều chỉnh các quan hệ xã hội theo định hướng và bảo vệ trật tự nhà nước.

---

### CƠ CẤU 3 BỘ PHẬN CỦA QUY PHẠM PHÁP LUẬT
1. **Giả định**: Xác định hoàn cảnh, điều kiện, đối tượng (Ai? Khi nào? Trong hoàn cảnh nào?) chịu sự tác động của quy phạm.
2. **Quy định**: Nêu lên cách thức xử sự của chủ thể (Được làm gì? Phải làm gì? Không được làm gì? Làm như thế nào?).
3. **Chế tài**: Biện pháp tác động bất lợi (hậu quả pháp lý) áp dụng khi chủ thể không thực hiện đúng phần quy định (Hình sự, hành chính, dân sự, kỷ luật).`;
    }

    // 4. Quan hệ pháp luật
    if (concept === 'quan hệ pháp luật' || concept === 'quan hệ pháp luật dân sự' || q.includes('quan hệ pháp luật')) {
      return `### ĐỊNH NGHĨA QUAN HỆ PHÁP LUẬT
**Quan hệ pháp luật** là các quan hệ xã hội được các quy phạm pháp luật điều chỉnh, trong đó các bên tham gia mang các quyền và nghĩa vụ pháp lý được Nhà nước bảo đảm thực hiện.

---

### CƠ CẤU 3 YẾU TỐ CỦA QUAN HỆ PHÁP LUẬT
1. **Chủ thể**: Cá nhân, pháp nhân có năng lực chủ thể (năng lực pháp luật và năng lực hành vi pháp lý).
2. **Khách thể**: Lợi ích vật chất, giá trị tinh thần hoặc hành vi mà các chủ thể hướng tới để thỏa mãn nhu cầu.
3. **Nội dung**: Tổng hợp các quyền pháp lý và nghĩa vụ pháp lý của các bên tham gia quan hệ pháp luật.`;
    }

    // 5. Vi phạm pháp luật
    if (concept === 'vi phạm pháp luật' || q.includes('vi phạm pháp luật')) {
      return `### ĐỊNH NGHĨA VI PHẠM PHÁP LUẬT
**Vi phạm pháp luật** là hành vi trái pháp luật, có lỗi do chủ thể có năng lực trách nhiệm pháp lý thực hiện, xâm hại đến các quan hệ xã hội được pháp luật bảo vệ.

---

### 4 DẤU HIỆU CƠ BẢN CỦA VI PHẠM PHÁP LUẬT
1. **Là hành vi xác định của con người**: Dưới dạng hành động hoặc không hành động.
2. **Là hành vi trái pháp luật**: Vi phạm điều cấm hoặc không thực hiện nghĩa vụ luật định.
3. **Có lỗi của chủ thể**: Trạng thái tâm lý tiêu cực đối với hành vi và hậu quả (lỗi cố ý hoặc vô ý).
4. **Do chủ thể có năng lực trách nhiệm pháp lý thực hiện**: Đủ tuổi luật định và có khả năng nhận thức, làm chủ hành vi.`;
    }

    // 6. Trách nhiệm pháp lý
    if (concept === 'trách nhiệm pháp lý' || q.includes('trách nhiệm pháp lý')) {
      return `### ĐỊNH NGHĨA TRÁCH NHIỆM PHÁP LÝ
**Trách nhiệm pháp lý** là hậu quả pháp lý bất lợi mà Nhà nước buộc chủ thể vi phạm pháp luật phải gánh chịu do hành vi vi phạm của mình gây ra.

---

### 4 HÌNH THỨC TRÁCH NHIỆM PHÁP LÝ
1. **Trách nhiệm hình sự**: Nghiêm khắc nhất, áp dụng với tội phạm, do Tòa án tuyên án.
2. **Trách nhiệm hành chính**: Áp dụng với vi phạm hành chính, do cơ quan hành chính nhà nước xử phạt.
3. **Trách nhiệm dân sự**: Bồi thường thiệt hại, hoàn trả tài sản do vi phạm hợp đồng hoặc bồi thường ngoài hợp đồng.
4. **Trách nhiệm kỷ luật**: Áp dụng đối với cán bộ, công chức, viên chức, người lao động vi phạm kỷ luật cơ quan.`;
    }

    // Mặc định tổng quát
    return `### ĐỊNH NGHĨA VÀ NGUYÊN LÝ PHÁP LÝ
Căn cứ giáo trình Pháp luật Đại cương chuẩn của Bộ Giáo dục và Đào tạo:
Khái niệm pháp lý được định hình nhằm xác lập khuôn khổ chuẩn mực điều chỉnh hành vi con người và bảo đảm trật tự công cộng trong xã hội có Nhà nước.`;
  }

  // --- DẠNG SO SÁNH & PHÂN BIỆT ĐỘNG (BẢNG TIÊU CHÍ SO SÁNH CHUẨN BAREM) ---
  public static solveDynamicComparison(query: string, articles: ILawArticle[] = []): string {
    const qLower = query.toLowerCase();

    // 0.1. So sánh Pháp luật và Đạo đức
    if ((qLower.includes('pháp luật') || qLower.includes('pl')) && qLower.includes('đạo đức')) {
      return this.solveDynamicLawVsMorality(query);
    }

    // 0.2. So sánh 3 hình thức của Pháp luật (Tập quán pháp, tiền lệ pháp, văn bản QPPL)
    if (
      qLower.includes('tập quán pháp') ||
      qLower.includes('tiền lệ pháp') ||
      (qLower.includes('hình thức') && (qLower.includes('pháp luật') || qLower.includes('văn bản quy phạm')))
    ) {
      return this.solveDynamicThreeFormsOfLaw(query);
    }

    // 0.3. Phân biệt Công pháp vs Tư pháp, Luật nội dung vs Luật hình thức
    if (
      (qLower.includes('công pháp') && qLower.includes('tư pháp')) ||
      (qLower.includes('luật nội dung') && qLower.includes('luật hình thức'))
    ) {
      return this.solveDynamicPublicVsPrivateLaw(query);
    }

    // 1. So sánh Phòng vệ chính đáng vs Tình thế cấp thiết
    if (
      (qLower.includes('phòng vệ') || qLower.includes('chính đáng')) &&
      (qLower.includes('cấp thiết') || qLower.includes('tình thế'))
    ) {
      return `### BẢNG SO SÁNH: PHÒNG VỆ CHÍNH ĐÁNG VS TÌNH THẾ CẤP THIẾT

| Tiêu chí so sánh | Phòng vệ chính đáng (Điều 22 BLHS 2015) | Tình thế cấp thiết (Điều 23 BLHS 2015) |
| :--- | :--- | :--- |
| **Bản chất pháp lý** | Hành vi chống trả người đang có hành vi xâm hại quyền, lợi ích hợp pháp | Hành vi nhằm tránh một nguy cơ đang thực tế đe dọa lợi ích hợp pháp |
| **Nguồn gốc nguy hiểm** | Xuất phát từ **hành vi tấn công trái pháp luật của con người** | Xuất phát từ con người, thiên tai, súc vật hoặc sự cố kỹ thuật |
| **Đối tượng tác động** | Tác động trực tiếp vào **chính người đang có hành vi tấn công** | Tác động gây thiệt hại cho **người thứ ba vô tội** |
| **Mức độ thiệt hại gây ra** | Thiệt hại gây ra cho người tấn công có thể **ngang bằng hoặc lớn hơn** thiệt hại bị đe dọa (miễn không quá mức cần thiết) | Thiệt hại gây ra **bắt buộc phải nhỏ hơn** thiệt hại cần ngăn ngừa |
| **Trách nhiệm pháp lý** | Không phải là tội phạm và không phải bồi thường thiệt hại | Không phải là tội phạm. Người gây ra tình thế cấp thiết phải bồi thường (Điều 595 BLDS 2015) |

---
### ĐIỂM GIỐNG NHAU:
1. Đều là những trường hợp **loại trừ trách nhiệm hình sự** theo quy định tại Chương IV Bộ luật Hình sự 2015.
2. Mục đích chung là nhằm bảo vệ lợi ích của Nhà nước, tổ chức, quyền và lợi ích hợp pháp của cá nhân.
3. Nếu vượt quá giới hạn luật định (vượt quá giới hạn phòng vệ chính đáng hoặc vượt quá yêu cầu của tình thế cấp thiết) thì người thực hiện vẫn phải chịu trách nhiệm hình sự.`;
    }

    // 2. So sánh Năng lực pháp luật và Năng lực hành vi
    if (
      qLower.includes('năng lực pháp luật') &&
      qLower.includes('năng lực hành vi')
    ) {
      return `### BẢNG SO SÁNH: NĂNG LỰC PHÁP LUẬT DÂN SỰ VS NĂNG LỰC HÀNH VI DÂN SỰ

| Tiêu chí | Năng lực pháp luật dân sự (Điều 16 BLDS 2015) | Năng lực hành vi dân sự (Điều 19 BLDS 2015) |
| :--- | :--- | :--- |
| **Khái niệm** | Là khả năng của cá nhân **có quyền dân sự và nghĩa vụ dân sự** | Là khả năng của cá nhân **bằng hành vi của mình** xác lập, thực hiện quyền, nghĩa vụ dân sự |
| **Thời điểm phát sinh** | Có từ khi cá nhân **sinh ra** | Hình thành và phát triển dần theo **độ tuổi và mức độ nhận thức** (đầy đủ từ đủ 18 tuổi) |
| **Thời điểm chấm dứt** | Chỉ chấm dứt khi cá nhân **chết** | Chấm dứt khi cá nhân chết; hoặc bị mất/hạn chế ngay khi còn sống theo quyết định của Tòa án |
| **Tính phụ thuộc chủ thể** | Mọi cá nhân đều bình đẳng và như nhau, không phụ thuộc vào độ tuổi, sức khỏe tâm thần | Phụ thuộc chặt chẽ vào độ tuổi và khả năng nhận thức, điều khiển hành vi của từng người |
| **Khả năng bị tước đoạt** | Không thể bị hạn chế, trừ trường hợp luật định do Tòa án quyết định | Có thể bị Tòa án tuyên mất NLHV (Điều 22) hoặc hạn chế NLHV (Điều 24) |

---
### MỐI QUAN HỆ BIỆN CHỨNG:
- Năng lực pháp luật là tiền đề của năng lực hành vi. Nếu không có năng lực pháp luật thì không thể có năng lực hành vi.
- Cả hai yếu tố này hợp thành **Năng lực chủ thể** của cá nhân khi tham gia vào các quan hệ pháp luật dân sự cụ thể.`;
    }

    // 3. So sánh Vi phạm Hình sự (Tội phạm) và Vi phạm Hành chính
    if (
      (qLower.includes('tội phạm') || qLower.includes('hình sự')) &&
      (qLower.includes('hành chính') || qLower.includes('vphc'))
    ) {
      return `### BẢNG SO SÁNH: VI PHẠM HÌNH SỰ (TỘI PHẠM) VS VI PHẠM HÀNH CHÍNH

| Tiêu chí | Vi phạm hình sự (Tội phạm - BLHS 2015) | Vi phạm hành chính (Luật Xử lý VPHC 2012) |
| :--- | :--- | :--- |
| **Mức độ nguy hiểm cho xã hội** | Nguy hiểm cho xã hội ở **mức độ đáng kể** (Khoản 1 Điều 8 BLHS) | Tính chất nguy hiểm cho xã hội **thấp hơn**, chưa đến mức nghiêm trọng |
| **Khách thể xâm hại** | Xâm hại các quan hệ xã hội quan trọng bậc nhất (độc lập chủ quyền, tính mạng, sức khỏe, an ninh quốc gia) | Xâm hại trật tự quản lý nhà nước trên các lĩnh vực kinh tế, văn hóa, giao thông |
| **Chủ thể áp dụng chế tài** | Chỉ duy nhất do **Tòa án** xét xử và nhân danh Nhà nước tuyên bản án | Các cơ quan quản lý nhà nước (UBND, Công an, Hải quan, Quản lý thị trường, Thanh tra) |
| **Hệ thống chế tài** | Các hình phạt nghiêm khắc: Cảnh cáo, phạt tiền, cải tạo không giam giữ, tù có thời hạn, tù chung thân, tử hình | Xử phạt hành chính: Cảnh cáo, phạt tiền; biện pháp khắc phục hậu quả; cưỡng chế hành chính |
| **Hậu quả pháp lý** | Bị kết án và phát sinh **Án tích** (lý lịch tư pháp ghi nhận tiền án) | **Không bị án tích**, hết thời hạn 01 năm coi như chưa bị xử phạt |`;
    }

    // 4. So sánh Hợp đồng vô hiệu tuyệt đối vs vô hiệu tương đối
    if (
      qLower.includes('vô hiệu') &&
      (qLower.includes('tuyệt đối') || qLower.includes('tương đối'))
    ) {
      return `### BẢNG SO SÁNH: HỢP ĐỒNG DÂN SỰ VÔ HIỆU TUYỆT ĐỐI VS VÔ HIỆU TƯƠNG ĐỐI

| Tiêu chí | Hợp đồng vô hiệu tuyệt đối (Đương nhiên vô hiệu) | Hợp đồng vô hiệu tương đối (Tùy nghi vô hiệu) |
| :--- | :--- | :--- |
| **Nguyên nhân vô hiệu** | Vi phạm điều cấm của luật hoặc trái đạo đức xã hội (Điều 123 BLDS 2015); Hợp đồng giả tạo (Điều 124) | Do nhầm lẫn (Điều 126), bị lừa dối, đe dọa, cưỡng ép (Điều 127); do người chưa thành niên, mất NLHV xác lập (Điều 125) |
| **Thời điểm phát sinh hậu quả** | Vô hiệu ngay từ **thời điểm giao kết**, không làm phát sinh bất kỳ quyền và nghĩa vụ nào | Có hiệu lực tạm thời cho đến khi **Tòa án tuyên bố vô hiệu** theo yêu cầu của bên bị thiệt hại |
| **Thời hiệu yêu cầu Tòa án tuyên** | **Không bị hạn chế thời hiệu** (bất kỳ thời điểm nào cũng có quyền yêu cầu) | **Thời hiệu là 02 năm** kể từ ngày người có quyền biết hoặc phải biết giao dịch bị vi phạm |
| **Hậu quả pháp lý** | Các bên khôi phục lại tình trạng ban đầu, hoàn trả cho nhau những gì đã nhận | Nếu hết 02 năm không yêu cầu thì hợp đồng tiếp tục có hiệu lực pháp luật |`;
    }

    // Fallback: Tìm trong giáo trình và dựng bảng so sánh tổng quát
    const topTb = TextbookKnowledgeService.searchTopChunks(query, 1);
    const contextContent = topTb.length > 0 ? topTb[0].chunk.baremContent : '';

    return `### KẾT QUẢ SO SÁNH & PHÂN BIỆT CHI TIẾT (CHUẨN BAREM GIÁO TRÌNH)

1. **ĐIỂM GIỐNG NHAU**:
   - Đều là các chế định pháp lý quan trọng được quy định trong hệ thống pháp luật Việt Nam và giáo trình Pháp luật Đại cương.
   - Đều hướng tới mục tiêu điều chỉnh hành vi của các chủ thể, duy trì trật tự pháp luật và bảo vệ quyền, lợi ích hợp pháp của Nhà nước, tổ chức và công dân.

2. **ĐIỂM KHÁC NHAU (BẢNG TIÊU CHÍ ĐỐI CHIẾU)**:
   - **Cơ sở pháp lý**: Căn cứ vào các văn bản quy phạm pháp luật chuyên ngành tương ứng.
   - **Bản chất pháp lý & Dấu hiệu đặc trưng**: Phụ thuộc vào tính chất hành vi, mức độ lỗi và năng lực chủ thể.
   - **Hệ quả pháp lý**: Áp dụng các biện pháp chế tài và trách nhiệm pháp lý tương ứng.

${contextContent ? `\n---\n**TÀI LIỆU GIÁO TRÌNH THAM CHIẾU**:\n${contextContent}` : ''}`;
  }

  // --- DẠNG 7: LÝ THUYẾT TỔNG HỢP & DỰ PHÒNG THÔNG MINH ---
  private static solveDynamicGeneralTheory(query: string, articles: ILawArticle[]): string {
    const qLower = query.toLowerCase();

    // 0.0. Ưu tiên mối quan hệ giữa Nhà nước và Pháp luật
    if (
      qLower.includes('nhà nước') &&
      qLower.includes('pháp luật') &&
      (qLower.includes('thiếu pháp luật') ||
       qLower.includes('không thể tồn tại') ||
       qLower.includes('phát huy chức năng') ||
       qLower.includes('quan hệ biện chứng') ||
       qLower.includes('kiến trúc thượng tầng') ||
       qLower.includes('tại sao nhà nước')) &&
      !qLower.includes('chỉ ra đời trong')
    ) {
      return this.solveDynamicStateAndLawRelation(query);
    }

    // 0. Ưu tiên câu hỏi về Bản chất Nhà nước (tính giai cấp & tính xã hội)
    if (
      qLower.includes('bản chất của nhà nước') ||
      qLower.includes('bản chất nhà nước') ||
      (qLower.includes('tính giai cấp') && qLower.includes('tính xã hội')) ||
      (qLower.includes('nhà nước') && qLower.includes('bản chất'))
    ) {
      return this.solveDynamicStateNature();
    }

    // Kiểm tra ưu tiên nếu là câu hỏi định nghĩa / khái niệm
    const isDef = qLower.includes('là gì') || qLower.includes('thế nào là') || qLower.includes('định nghĩa') || qLower.includes('khái niệm');
    const concept = this.extractLegalConcept(query);
    if (isDef) {
      return this.solveDynamicDefinition(query, concept);
    }

    // Nếu là câu hỏi nhận định / đánh giá đúng sai / thực hiện pháp luật
    if (
      qLower.includes('đúng hay sai') ||
      qLower.includes('nhận định') ||
      qLower.includes('tuân thủ') ||
      qLower.includes('thi hành') ||
      qLower.includes('sử dụng pháp luật') ||
      qLower.includes('áp dụng pháp luật') ||
      qLower.includes('không hành động') ||
      qLower.includes('đều được') ||
      qLower.includes('đều là') ||
      qLower.includes('chỉ có')
    ) {
      return this.solveDynamicTrueFalse(query, articles);
    }

    // Nếu câu hỏi liên quan đến so sánh & phân biệt
    if (qLower.includes('so sánh') || qLower.includes('phân biệt') || qLower.includes('đối chiếu')) {
      return this.solveDynamicComparison(query, articles);
    }

    // Nếu câu hỏi liên quan đến vay nợ, hợp đồng, nghĩa vụ
    if (qLower.includes('vay') || qLower.includes('mượn') || qLower.includes('hợp đồng') || qLower.includes('công chứng')) {
      const actors = this.extractActors(query);
      const money = this.extractMoney(query);
      return this.solveDynamicCivilContract(query, actors, money, articles);
    }

    // Nếu câu hỏi về Quan hệ pháp luật / Quan hệ pháp luật dân sự
    if (qLower.includes('quan hệ pháp luật') || qLower.includes('cơ cấu của quan hệ') || qLower.includes('quan hệ dân sự')) {
      return this.solveDynamicCivilRelation(query, articles);
    }

    // Nếu câu hỏi về Hôn nhân & Gia đình / nhận con / chung sống
    if (qLower.includes('chung sống') || qLower.includes('không đăng ký kết hôn') || qLower.includes('nhận con') || qLower.includes('khai sinh')) {
      const actors = this.extractActors(query);
      return this.solveDynamicFamilyLaw(query, actors, articles);
    }

    // Nếu câu hỏi tình huống có xô xát, giao thông, phòng vệ
    if (qLower.includes('giao thông') || qLower.includes('đánh') || qLower.includes('vượt đèn đỏ') || qLower.includes('va chạm') || qLower.includes('phòng vệ')) {
      const actors = this.extractActors(query);
      const money = this.extractMoney(query);
      return this.solveDynamicCaseAnalysis(query, actors, money, null, articles);
    }

    if (qLower.includes('thực hiện pháp luật') || qLower.includes('tuân thủ') || qLower.includes('thi hành')) {
      return `### I. KHÁI NIỆM THỰC HIỆN PHÁP LUẬT
Theo giáo trình Pháp luật Đại cương:
**Thực hiện pháp luật** là quá trình hoạt động có mục đích làm cho những quy định của pháp luật đi vào đời sống thực tế, trở thành hành vi hợp pháp của các chủ thể pháp luật.

---

### II. BẢNG SO SÁNH 4 HÌNH THỨC THỰC HIỆN PHÁP LUẬT

| Tiêu chí | 1. Tuân thủ pháp luật | 2. Thi hành (Chấp hành) pháp luật | 3. Sử dụng (Vận dụng) pháp luật | 4. Áp dụng pháp luật |
| :--- | :--- | :--- | :--- | :--- |
| **Bản chất hành vi** | **Thụ động** (Kiềm chế không làm). | **Chủ động** (Làm nghĩa vụ bắt buộc). | **Chủ động** (Tự quyết định quyền). | **Mang quyền lực Nhà nước** (Ra văn bản cá biệt). |
| **Quy phạm tương ứng** | Quy phạm **cấm đoán**. | Quy phạm **bắt buộc**. | Quy phạm **trao quyền (tùy nghi)**. | Quy phạm cần sự can thiệp của Nhà nước. |
| **Nội dung** | Không làm điều pháp luật cấm. | Làm điều pháp luật bắt buộc làm. | Làm điều pháp luật cho phép làm. | Cơ quan có thẩm quyền ra quyết định áp dụng vào vụ việc. |
| **Chủ thể** | Mọi cá nhân, cơ quan, tổ chức. | Mọi cá nhân, cơ quan, tổ chức. | Mọi cá nhân, cơ quan, tổ chức. | **Chỉ có cơ quan Nhà nước, người có thẩm quyền**. |
| **Ví dụ** | Không vượt đèn đỏ; không nhận hối lộ. | Nộp thuế đầy đủ; đăng ký nghĩa vụ quân sự. | Kết hôn; lập di chúc; khiếu nại. | Tòa án tuyên án phạt tù; CSGT ra quyết định xử phạt vi phạm. |`;
    }

    // Kiểm tra kho tri thức Giáo trình RAG (ĐH Thương Mại 2021 - Chủ biên TS. Trần Thành Thọ)
    const textbookMatches = TextbookKnowledgeService.searchTopChunks(query, 1);
    if (textbookMatches.length > 0 && textbookMatches[0].score >= 10) {
      return TextbookKnowledgeService.buildTextbookResponse(query, textbookMatches[0]);
    }

    return `### I. TỔNG QUAN LÝ THUYẾT PHÁP LUẬT ĐẠI CƯƠNG
Căn cứ giáo trình Pháp luật Đại cương chuẩn của Bộ Giáo dục và Đào tạo:
- Phân tích các thuộc tính, bản chất giai cấp và bản chất xã hội của Nhà nước và Pháp luật.
- Xác định hệ thống văn bản quy phạm pháp luật và nguyên tắc áp dụng pháp luật theo **Luật Ban hành văn bản quy phạm pháp luật 2015**.

---

### II. CĂN CỨ PHÁP LÝ LIÊN QUAN
${articles.length > 0 ? articles.map((a) => `- **Văn bản**: ${a.lawName} - Điều ${a.articleNumber}: *${a.title}*\n  Trích yếu: ${a.contentRaw.slice(0, 150)}...`).join('\n') : '- Căn cứ các nguyên lý cơ bản của Hiến pháp 2013 và hệ thống pháp luật Việt Nam.'}`;
  }

  // --- DẠNG 8: QUAN HỆ PHÁP LUẬT DÂN SỰ & CƠ CẤU 3 YẾU TỐ ---
  private static solveDynamicCivilRelation(query: string, articles: ILawArticle[]): string {
    return `### I. KHÁI NIỆM QUAN HỆ PHÁP LUẬT DÂN SỰ
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
  + *Quyền của Anh B*: Quyền nhận xe và quyền sở hữu hợp pháp đối với xe; *Nghĩa vụ của Anh B*: Thanh toán đầy đủ tiền mua xe đúng thời hạn cho Ông A.`;
  }

  // --- DẠNG 9: HÔN NHÂN & GIA ĐÌNH / XÁC ĐỊNH CHA MẸ CON ---
  private static solveDynamicFamilyLaw(query: string, actors: string[], articles: ILawArticle[]): string {
    const actorA = actors[0] || 'Chị A';
    const actorB = actors[1] || 'Anh T';

    return `### I. HẬU QUẢ PHÁP LÝ CỦA VIỆC CHUNG SỐNG KHÔNG ĐĂNG KÝ KẾT HÔN
Căn cứ **Điều 14 Luật Hôn nhân và Gia đình 2014**:
1. **Về quan hệ giữa nam và nữ**:
   - Khoản 1 Điều 14 quy định: Nam, nữ có đủ điều kiện kết hôn chung sống với nhau như vợ chồng mà không đăng ký kết hôn thì **không làm phát sinh quyền, nghĩa vụ giữa vợ và chồng**.
   - Do đó, về mặt pháp lý, giữa **${actorA}** và **${actorB}** không tồn tại quan hệ hôn nhân hợp pháp (không được pháp luật công nhận là vợ chồng).
2. **Về việc xác lập quan hệ hôn nhân (nếu muốn hàn gắn)**:
   - Nếu ${actorA} và ${actorB} muốn chính thức trở thành vợ chồng hợp pháp, hai bên phải cùng đến cơ quan nhà nước có thẩm quyền làm thủ tục **đăng ký kết hôn**. Quan hệ hôn nhân chỉ được xác lập kể từ **thời điểm đăng ký kết hôn** (Khoản 2 Điều 14).

---

### II. QUYỀN NHẬN CON CỦA ${actorB.toUpperCase()} VÀ SỰ ĐỒNG THUẬN CỦA ${actorA.toUpperCase()}
Căn cứ **Khoản 2 Điều 14, Điều 15 và Điều 91 Luật Hôn nhân và Gia đình 2014**:
1. **Quyền nhận con không phụ thuộc vào tình trạng hôn nhân**:
   - Điều 15 quy định: Quyền, nghĩa vụ giữa nam, nữ chung sống với nhau như vợ chồng mà không đăng ký kết hôn và con được giải quyết theo quy định về **quyền, nghĩa vụ của cha mẹ và con**.
   - Con sinh ra ngoài thời kỳ hôn nhân được pháp luật bảo vệ bình đẳng, có đầy đủ quyền và nghĩa vụ như con sinh ra trong thời kỳ hôn nhân.
2. **Điều kiện để ${actorB} nhận con gái**:
   - Căn cứ **Khoản 1 và Khoản 2 Điều 91 Luật HNGĐ 2014**: Cha, mẹ có quyền nhận con. Do cháu bé là con chưa thành niên, việc nhận con **phải có sự đồng ý của người mẹ** (${actorA}).
   - Trong tình huống nêu trong đề bài, **${actorA} đã đồng ý** cho ${actorB} nhận con gái, do đó điều kiện luật định về sự đồng thuận hoàn toàn được đáp ứng.

---

### III. THẨM QUYỀN VÀ THỦ TỤC ĐĂNG KÝ NHẬN CHA CHO CON
Căn cứ **Khoản 1 Điều 101 Luật Hôn nhân và Gia đình 2014** và quy định của **Luật Hộ tịch 2014**:
1. **Về thẩm quyền giải quyết**:
   - Căn cứ Khoản 1 Điều 101: Do việc nhận cha con là **hoàn toàn tự nguyện, có sự đồng thuận của cả cha và mẹ, không có tranh chấp**, thẩm quyền giải quyết thuộc về **Ủy ban nhân dân cấp xã** (nơi cư trú của ${actorB} hoặc của người con), không phải giải quyết tại Tòa án.
2. **Hồ sơ và trình tự thực hiện tại UBND cấp xã**:
   - ${actorB} và ${actorA} cùng nộp **Tờ khai đăng ký nhận cha, mẹ, con** theo mẫu quy định.
   - Nộp kèm chứng cứ chứng minh quan hệ cha con (văn bản xét nghiệm ADN, hoặc văn bản cam đoan/xác nhận của các bên và người làm chứng theo quy định tại Thông tư 04/2020/TT-BTP).
   - Công chức tư pháp - hộ tịch kiểm tra hồ sơ, ghi vào Sổ hộ tịch và cấp **Trích lục đăng ký nhận cha, mẹ, con** cho các bên.
3. **Thủ tục bổ sung, thay đổi thông tin trong Giấy khai sinh của cháu bé**:
   - Căn cứ Trích lục nhận cha con, cơ quan hộ tịch tiến hành thủ tục **bổ sung thông tin của ${actorB} vào mục "Cha" trong Giấy khai sinh** của người con (căn cứ Luật Hộ tịch 2014).
   - Nếu ${actorA} và ${actorB} có thỏa thuận về việc đổi họ của cháu bé từ họ mẹ sang họ cha, cơ quan hộ tịch sẽ thực hiện thủ tục **thay đổi họ cho con** theo quy định tại Điều 26 Luật Hộ tịch 2014 và Điều 27 Bộ luật Dân sự 2015.

---

### IV. NGHĨA VỤ VÀ QUYỀN CỦA CHA MẸ ĐỐI VỚI CON CHUNG
Căn cứ **Điều 69, 70, 71, 72 Luật Hôn nhân và Gia đình 2014**:
- Sau khi hoàn tất thủ tục nhận con, **${actorB}** chính thức có đầy đủ quyền và nghĩa vụ của người cha:
  + Nghĩa vụ cùng ${actorA} trông nom, chăm sóc, nuôi dưỡng, giáo dục con;
  + Nghĩa vụ cùng đóng góp tài chính cấp dưỡng nuôi con;
  + Quyền được thăm nom, chăm sóc con mà không ai được cản trở.`;
  }
}
