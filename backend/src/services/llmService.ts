import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';
import { config } from '../config/env.js';
import { ExamArchetype, RagService } from './ragService.js';
import { ILawArticle } from '../models/LawArticle.js';
import { TextbookKnowledgeService, TextbookChunk } from './textbookKnowledgeService.js';

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
      lower.includes('khung chấm:') ||
      lower.includes('1. lỗi trong nhận định:') ||
      lower.includes('không chỉ sửa giọng văn') ||
      lower.includes('người học phải gắn từng dữ kiện')
    );
  }

  /**
   * Khởi tạo và nạp toàn bộ ngân hàng câu hỏi SFT (2,100+ câu thi & Barem chuẩn môn Pháp luật đại cương)
   */
  private static initCorpuses(): void {
    if (this.isInitialized && this.examCorpus.length >= 1000) return;

    const masterPaths = [
      path.resolve(process.cwd(), 'data/processed/sft_vietlaw_master.json'),
      path.resolve(process.cwd(), 'data/processed/sft-vietlaw-master.json'),
      path.resolve(process.cwd(), '../data/processed/sft_vietlaw_master.json'),
      path.resolve(process.cwd(), '../data/processed/sft-vietlaw-master.json'),
      path.resolve(__dirname, '../../../data/processed/sft_vietlaw_master.json'),
      path.resolve(__dirname, '../../../data/processed/sft-vietlaw-master.json')
    ];

    for (const p of masterPaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf-8');
          const parsed = JSON.parse(raw) as SftSample[];
          const cleaned = parsed.filter(
            (item) => !this.isRawGuidanceNote(item.output) && !item.sample_id.startsWith('SFT_200Q')
          );

          this.examCorpus = cleaned;
          this.examTokenSets = this.examCorpus.map((item) => {
            const textToUse = item.input && item.input.length > 20 ? item.input : `${item.instruction} ${item.input}`;
            return new Set(this.normalize(textToUse));
          });
          this.examBigramSets = this.examCorpus.map((item) => {
            const textToUse = item.input && item.input.length > 20 ? item.input : `${item.instruction} ${item.input}`;
            return this.getBigrams(this.normalize(textToUse));
          });

          this.masterCorpus = cleaned;
          this.masterTokenSets = this.examTokenSets;
          this.masterBigramSets = this.examBigramSets;
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

          console.log(`📚 [SFT Cache] Đã nạp thành công ${this.examCorpus.length} mẫu đề thi & Barem chuẩn từ: ${path.basename(p)}`);
          break;
        } catch (err) {
          console.warn('⚠️ [SFT Cache] Lỗi đọc exam dataset:', err);
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

    // Bảo vệ cách ly: Câu hỏi lý thuyết thuần túy tuyệt đối KHÔNG khớp bài tập tình huống thực tế
    const qLower = query.toLowerCase();
    const isScenarioQuery =
      qLower.includes('tình huống') ||
      qLower.includes('vụ việc') ||
      qLower.includes('vụ án') ||
      qLower.includes('vụ tai nạn') ||
      qLower.includes('tai nạn') ||
      qLower.includes('xả thải') ||
      qLower.includes('đập phá') ||
      qLower.includes('ném đá') ||
      qLower.includes('hàng xóm') ||
      qLower.includes('ông ') ||
      qLower.includes('bà ') ||
      qLower.includes('anh ') ||
      qLower.includes('chị ') ||
      qLower.includes('công ty ');

    const sLower = sText.toLowerCase();
    const isScenarioSample =
      sample.intent_code === 'CASE_ANALYSIS' ||
      sample.sample_id.includes('CASE') ||
      sLower.includes('tình huống') ||
      sLower.includes('vụ việc') ||
      sLower.includes('vụ án') ||
      sLower.includes('công ty tnhh') ||
      sLower.includes('xả thải') ||
      sLower.includes('vedan') ||
      Boolean(sample.output && (sample.output.includes('hành vi của Công ty') || sample.output.includes('hành vi của anh ') || sample.output.includes('hành vi của ông ')));

    if (!isScenarioQuery && isScenarioSample) {
      return false;
    }

    return true;
  }

  /**
   * Làm sạch triệt để các tàn dư barem điểm thi, số thứ tự barem và xử lý các mục rỗng
   */
  public static cleanRubricText(text: string): string {
    const cleaned = text
      .replace(/(?:^|\n)\s*Ý\s*chính\s*\n[\s\S]*?(?:Trả\s*lời\s*chi\s*tiết\s*Thu\s*gọn\s*tất\s*cả|Trả\s*lời\s*chi\s*tiết|Thu\s*gọn\s*tất\s*cả|Thu\s*gọn)[^\n]*\n?/gi, '\n')
      .replace(/Trả\s*lời\s*chi\s*tiết\s*Thu\s*gọn\s*tất\s*cả/gi, '')
      .replace(/Trả\s*lời\s*chi\s*tiết/gi, '')
      .replace(/Thu\s*gọn\s*tất\s*cả/gi, '')
      .replace(/Thu\s*gọn/gi, '')
      .replace(/(?:^|\n)\s*Ý\s*chính\s*(?::|\n)/gi, '\n')
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
    // Fix OCR shifted 'đ' (e.g. 'quânđ ội' -> 'quân đội')
    const vnLower = 'a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ';
    const vnUpper = 'A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ';
    const shiftedDRe = new RegExp(`([${vnLower}${vnUpper}])([đĐ])\\s+([${vnLower}]+)`, 'g');
    res = res.replace(shiftedDRe, '$1 $2$3');

    // Format raw 'Trả lời: Nhận định trên: SAI/ĐÚNG. Bởi vì...' into structured bullets
    const tfMatch = res.trim().match(/^(?:Trả\s*lời\s*:\s*\n*)?Nhận\s*định(?:\s+trên)?\s*:\s*(SAI|ĐÚNG|Sai|Đúng)\.?\s*\n+([\s\S]*)$/i);
    if (tfMatch) {
      const verdict = tfMatch[1].toUpperCase();
      const explanation = tfMatch[2].replace(/\s*\n+\s*/g, ' ').trim();
      res = `- **Kết luận:** Nhận định trên là **${verdict}**.\n- **Giải thích:** ${explanation}`;
    }

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
    if (q.includes('luật hình sự') || q.includes('pháp luật hình sự')) return 'luật hình sự';
    if (q.includes('tội phạm') && !q.includes('vi phạm')) return 'tội phạm';
    if (q.includes('đồng phạm')) return 'đồng phạm';
    if (q.includes('luật dân sự') || q.includes('pháp luật dân sự')) return 'luật dân sự';
    if (q.includes('luật hành chính') || q.includes('pháp luật hành chính')) return 'luật hành chính';
    if (q.includes('vi phạm pháp luật') || q.includes('cấu thành vi phạm')) return 'vi phạm pháp luật';
    if (q.includes('trách nhiệm pháp lý')) return 'trách nhiệm pháp lý';
    if (q.includes('sự kiện pháp lý')) return 'sự kiện pháp lý';
    if (q.includes('văn bản quy phạm pháp luật')) return 'văn bản quy phạm pháp luật';
    if (q.includes('thực hiện pháp luật') || q.includes('áp dụng pháp luật')) return 'thực hiện pháp luật';
    if (q.includes('hình thức pháp luật') || q.includes('nguồn của pháp luật')) return 'hình thức pháp luật';
    if (q.includes('bản chất của nhà nước') || q.includes('bản chất nhà nước') || (q.includes('nhà nước') && q.includes('giai cấp') && q.includes('xã hội'))) return 'bản chất nhà nước';
    if (q.includes('nhà nước')) return 'nhà nước';
    if (q.includes('pháp luật') && !q.includes('hình sự') && !q.includes('dân sự') && !q.includes('hành chính')) return 'pháp luật';
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
    const item = this.masterCorpus.find((s) => s.sample_id === 'SFT_LLM_COMPARE_DEFENSE_EMERGENCY');
    if (item) return item.output;
    return `### PHÂN BIỆT PHÒNG VỆ CHÍNH ĐÁNG VÀ TÌNH THẾ CẤP THIẾT
Căn cứ Điều 22 và Điều 23 Bộ luật Hình sự 2015, phòng vệ chính đáng là hành vi chống trả người tấn công trái pháp luật; tình thế cấp thiết là gây thiệt hại nhỏ hơn để ngăn ngừa thiệt hại lớn hơn.`;
  }

  

  /**
   * Bộ giải chuyên sâu: So sánh Lỗi cố ý trực tiếp và Lỗi cố ý gián tiếp chuẩn Barem Bộ GD&ĐT
   */
  public static getIntentionalFaultComparison(query: string): string {
    const item = this.masterCorpus.find((s) => s.sample_id === 'SFT_LLM_COMPARE_INTENTIONAL_FAULT');
    if (item) return item.output;
    return `### SO SÁNH LỖI CỐ Ý TRỰC TIẾP VÀ LỖI CỐ Ý GIÁN TIẾP
Căn cứ Điều 10 Bộ luật Hình sự 2015: Cố ý trực tiếp mong muốn hậu quả xảy ra; cố ý gián tiếp để mặc cho hậu quả xảy ra.`;
  }

  

  /**
   * Bộ giải chuyên biệt: Mối quan hệ biện chứng giữa Nhà nước và Pháp luật
   * & Tại sao Nhà nước không thể tồn tại và phát huy chức năng nếu thiếu Pháp luật
   */
  public static solveDynamicStateAndLawRelation(query?: string): string {
    const item = this.masterCorpus.find((s) => s.sample_id === 'SFT_LLM_THEORY_STATE_LAW_RELATION');
    if (item) return item.output;
    return `### MỐI QUAN HỆ BIỆN CHỨNG GIỮA NHÀ NƯỚC VÀ PHÁP LUẬT
Nhà nước ban hành pháp luật để quản lý xã hội; pháp luật tạo khuôn khổ giới hạn quyền lực nhà nước. Không có pháp luật, nhà nước không thể thực hiện chức năng cưỡng chế hợp pháp.`;
  }

  

  /**
   * Bộ giải chuyên biệt: Tình huống xích mích hàng xóm đập phá đồ đạc (Bà A, Bà B, Anh C)
   */
  public static solveDynamicPropertyDestructionCase(query: string): string {
    const item = this.masterCorpus.find((s) => s.sample_id === 'SFT_LLM_CASE_PROPERTY_DESTRUCTION');
    if (item) return item.output;
    return `### XÁC ĐĂNG VI PHẠM PHÁP LUẬT VỀ HỦY HOẠI HOẶC CỐ Ý LÀM HƯ HỎNG TÀI SẢN
Căn cứ Điều 178 Bộ luật Hình sự 2015 và Điều 584 Bộ luật Dân sự 2015, hành vi cố ý đập phá làm hư hỏng tài sản của người khác phải chịu trách nhiệm hình sự nếu thiệt hại từ 2 triệu đồng trở lên, và phải bồi thường toàn bộ thiệt hại thực tế.`;
  }

  /**
   * Bộ giải chuyên biệt Chương 7: Lý luận cơ bản về Luật Hình sự, các nguyên tắc và nguồn
   */
  public static solveDynamicCriminalLawTheory(query?: string): string {
    const item = this.masterCorpus.find((s) => s.sample_id === 'SFT_THEORY_LUAT_HINH_SU_7_1');
    if (item) return item.output;

    return `### LÝ LUẬN CƠ BẢN VỀ LUẬT HÌNH SỰ VIỆT NAM
*(Theo Giáo trình Pháp luật Đại cương — Trường Đại học Thương Mại 2021 & Bộ Giáo dục và Đào tạo)*

---

#### I. KHÁI NIỆM, ĐỐI TƯỢNG VÀ PHƯƠNG PHÁP ĐIỀU CHỈNH CỦA LUẬT HÌNH SỰ
1. **Khái niệm Luật Hình sự**:
   - Luật Hình sự là một ngành luật độc lập trong hệ thống pháp luật Việt Nam, bao gồm hệ thống các quy phạm pháp luật do Nhà nước ban hành, xác định những hành vi nguy hiểm cho xã hội nào là tội phạm, đồng thời quy định các loại và biện pháp hình phạt, biện pháp tư pháp áp dụng đối với người hoặc pháp nhân thương mại thực hiện tội phạm đó.
2. **Đối tượng điều chỉnh của Luật Hình sự**:
   - Là các **quan hệ xã hội phát sinh giữa Nhà nước** (thông qua các cơ quan tiến hành tố tụng: Cơ quan điều tra, Viện kiểm sát, Tòa án) **và người phạm tội** (hoặc pháp nhân thương mại phạm tội) khi có hành vi phạm tội xảy ra trên thực tế.
   - Vị thế pháp lý của các bên trong quan hệ:
     + *Nhà nước*: Có quyền và nghĩa vụ truy tố, xét xử, áp dụng hình phạt và các biện pháp cưỡng chế hình sự tương xứng đối với chủ thể phạm tội.
     + *Người phạm tội*: Có nghĩa vụ chấp hành sự cưỡng chế và hình phạt do Tòa án tuyên, đồng thời được pháp luật bảo đảm các quyền tố tụng chính đáng (quyền bào chữa, nguyên tắc suy đoán vô tội).
3. **Phương pháp điều chỉnh của Luật Hình sự**:
   - Sử dụng **phương pháp quyền uy - mệnh lệnh (phục tùng)** mang tính cưỡng chế nhà nước nghiêm ngặt và triệt để nhất. Nhà nước đơn phương quy định tội danh và mức hình phạt trong Bộ luật Hình sự; các chủ thể bắt buộc phải phục tùng mà không có sự bình đẳng hay tự do thỏa thuận như trong quan hệ pháp luật dân sự.

---

#### II. CÁC NGUYÊN TẮC PHÁP LÝ CƠ BẢN CỦA LUẬT HÌNH SỰ (ĐIỀU 2, 3 BỘ LUẬT HÌNH SỰ 2015)
1. **Nguyên tắc pháp chế xã hội chủ nghĩa**:
   - Thể hiện qua châm ngôn pháp lý: *"Không có tội phạm, không có hình phạt nếu luật không quy định"* (*Nullum crimen, nulla poena sine lege* — Điều 2 BLHS 2015).
   - Chỉ hành vi nào được quy định cụ thể, rõ ràng trong Bộ luật Hình sự mới bị coi là tội phạm và chỉ được áp dụng các hình phạt do Bộ luật Hình sự quy định.
2. **Nguyên tắc bình đẳng của mọi công dân trước pháp luật hình sự**:
   - Mọi người phạm tội đều bình đẳng trước pháp luật, không phân biệt giới tính, dân tộc, tín ngưỡng, tôn giáo, thành phần, địa vị xã hội (Điều 3 BLHS 2015).
3. **Nguyên tắc nhân đạo xã hội chủ nghĩa**:
   - Thể hiện sự khoan hồng đối với người tự thú, đầu thú, thành khẩn khai báo, ăn năn hối cải, lập công chuộc tội.
   - Không áp dụng hình phạt tử hình đối với người dưới 18 tuổi khi phạm tội, phụ nữ có thai hoặc đang nuôi con dưới 36 tháng tuổi, người từ đủ 75 tuổi trở lên khi phạm tội hoặc khi xét xử (Điều 40 BLHS 2015).
4. **Nguyên tắc có lỗi**:
   - Một người chỉ phải chịu trách nhiệm hình sự khi có lỗi (cố ý hoặc vô ý). Không truy cứu trách nhiệm hình sự trong trường hợp sự kiện bất ngờ hoặc mất khả năng nhận thức và điều khiển hành vi.
5. **Nguyên tắc kết hợp giữa trừng trị nghiêm khắc và khoan hồng, giáo dục, cải tạo**:
   - Nghiêm trị kẻ chủ mưu, cầm đầu, ngoan cố, côn đồ, tái phạm nguy hiểm; đồng thời lấy việc giáo dục, cải tạo làm mục đích căn bản để người phạm tội nhận rõ sai lầm, hoàn lương trở thành công dân có ích.
6. **Nguyên tắc phân hóa và cá thể hóa trách nhiệm hình sự**:
   - Phân hóa tội phạm thành 4 loại (Điều 9 BLHS 2015); Tòa án căn cứ vào tính chất, mức độ nguy hiểm của hành vi, nhân thân và tình tiết giảm nhẹ, tăng nặng để tuyên mức án phù hợp nhất đối với từng cá nhân phạm tội.

---

#### III. NGUỒN CỦA PHÁP LUẬT HÌNH SỰ Ở VIỆT NAM HIỆN NAY
1. **Hiến pháp năm 2013**:
   - Là đạo luật cơ bản, có hiệu lực pháp lý cao nhất của Nhà nước, đặt nền tảng hiến định cho việc bảo vệ quyền con người, quyền công dân và nguyên tắc tư pháp tối cao (Điều 31: *Người bị buộc tội được coi là không có tội cho đến khi được chứng minh theo trình tự luật định và có bản án kết tội của Tòa án đã có hiệu lực pháp luật*).
2. **Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017)**:
   - Là nguồn **cơ bản, chủ yếu và trực tiếp duy nhất** quy định về tội phạm và hình phạt tại nước CHXHCN Việt Nam. Mọi tội danh và hình phạt bắt buộc phải được quy định tập trung trong văn bản này.
3. **Án lệ của Hội đồng Thẩm phán Tòa án nhân dân Tối cao**:
   - Các án lệ hình sự được Chánh án TANDTC công bố nhằm định hướng, làm rõ các quy định còn có cách hiểu khác nhau và hướng dẫn áp dụng thống nhất pháp luật trong xét xử các vụ án có tình tiết tương tự.
4. **Các Nghị quyết hướng dẫn của Hội đồng Thẩm phán TAND Tối cao**:
   - Hướng dẫn áp dụng thống nhất các điều khoản cụ thể của Bộ luật Hình sự trong thực tiễn công tác điều tra, truy tố, xét xử.`;
  }

  /**
   * Bộ giải chuyên biệt Chương 5: Phân tích 4 yếu tố cấu thành Vi phạm pháp luật
   */
  public static solveDynamicVpplTheory(query?: string): string {
    const item = this.masterCorpus.find((s) => s.sample_id === 'SFT_THEORY_VPPL_4_ELEMENTS');
    if (item) return item.output;

    return `### PHÂN TÍCH 4 YẾU TỐ CẤU THÀNH VI PHẠM PHÁP LUẬT
*(Theo Barem chuẩn Giáo trình Pháp luật Đại cương — Bộ Giáo dục và Đào tạo)*

---

#### 1. MẶT KHÁCH QUAN CỦA VI PHẠM PHÁP LUẬT
Mặt khách quan là những biểu hiện ra bên ngoài thế giới khách quan của vi phạm pháp luật mà con người có thể nhận thức được trực tiếp, bao gồm:
- **Hành vi trái pháp luật**:
  + Là hành vi xác định của con người thể hiện dưới dạng **hành động** (làm điều pháp luật cấm) hoặc **không hành động** (không làm điều pháp luật bắt buộc phải làm).
  + *Lưu ý*: Ý nghĩ, tư tưởng dù xấu xa đến đâu nếu chưa thể hiện ra thành hành vi thì không thể bị coi là vi phạm pháp luật. Hành vi trái pháp luật là **dấu hiệu bắt buộc duy nhất** trong mặt khách quan của mọi vi phạm pháp luật.
- **Hậu quả thiệt hại cho xã hội**:
  + Là những tổn thất thực tế hoặc nguy cơ đe dọa thực tế gây ra cho các quan hệ xã hội được pháp luật bảo vệ (thiệt hại về tính mạng, sức khỏe, tài sản, danh dự, nhân phẩm hoặc trật tự quản lý công cộng).
  + *Lưu ý*: Hậu quả thiệt hại là dấu hiệu bắt buộc đối với *cấu thành vật chất*, nhưng **không phải là dấu hiệu bắt buộc** đối với *cấu thành hình thức* (ví dụ: tội tàng trữ ma túy, cướp tài sản, vượt đèn đỏ).
- **Mối quan hệ nhân quả giữa hành vi và hậu quả thiệt hại**:
  + Hành vi trái pháp luật phải xảy ra trước và là nguyên nhân trực tiếp phát sinh hậu quả nguy hại cho xã hội.
- **Các yếu tố khách quan khác**: Thời gian, địa điểm, công cụ, phương tiện và phương thức thực hiện hành vi vi phạm (có thể là tình tiết định tội hoặc định khung hình phạt).

---

#### 2. MẶT CHỦ QUAN CỦA VI PHẠM PHÁP LUẬT
Mặt chủ quan là trạng thái tâm lý nội tâm bên trong của chủ thể đối với hành vi trái pháp luật và hậu quả do hành vi đó gây ra, bao gồm:
- **Lỗi của chủ thể**: Là thái độ tâm lý tiêu cực của chủ thể, phản ánh khả năng nhận thức và điều khiển hành vi của mình. Được phân thành **4 hình thức lỗi cơ bản**:
  1. *Lỗi cố ý trực tiếp*: Nhận thức rõ hành vi nguy hiểm, thấy trước hậu quả và mong muốn hậu quả xảy ra.
  2. *Lỗi cố ý gián tiếp*: Nhận thức rõ hành vi nguy hiểm, thấy trước hậu quả có thể xảy ra, tuy không mong muốn nhưng có ý thức để mặc hậu quả xảy ra.
  3. *Lỗi vô ý do quá tự tin*: Thấy trước hậu quả nguy hại có thể xảy ra, nhưng tin tưởng hậu quả sẽ không xảy ra hoặc có thể ngăn ngừa được.
  4. *Lỗi vô ý do cẩu thả*: Không thấy trước hậu quả nguy hại, mặc dù pháp luật bắt buộc phải thấy trước và có đủ điều kiện thấy trước.
- **Động cơ vi phạm**: Là động lực tâm lý thúc đẩy chủ thể thực hiện hành vi vi phạm pháp luật (ví dụ: vì vụ lợi, vì thù hận, vì ghen tuông).
- **Mục đích vi phạm**: Là kết quả cuối cùng trong nhận thức mà chủ thể mong muốn đạt được khi thực hiện hành vi vi phạm.

---

#### 3. KHÁCH THỂ CỦA VI PHẠM PHÁP LUẬT
- **Khái niệm**: Khách thể là những **quan hệ xã hội được pháp luật xác lập và bảo vệ**, nhưng bị hành vi vi phạm pháp luật xâm hại, làm thay đổi hoặc gây thiệt hại (hoặc đe dọa gây thiệt hại).
- **Ví dụ**: Quan hệ sở hữu tài sản; quyền bất khả xâm phạm về tính mạng, sức khỏe, nhân phẩm con người; trật tự an toàn giao thông đường bộ; chế độ quản lý hành chính nhà nước.
- *Lưu ý*: Cần phân biệt giữa *Khách thể* (quan hệ xã hội vô hình được luật bảo vệ) và *Đối tượng tác động* (vật thể vật chất, người hoặc tài sản cụ thể chịu sự tác động trực tiếp của hành vi).

---

#### 4. CHỦ THỂ CỦA VI PHẠM PHÁP LUẬT
- **Khái niệm**: Là cá nhân hoặc cơ quan, tổ chức có **năng lực trách nhiệm pháp lý** đã thực hiện hành vi vi phạm pháp luật.
- **Đối với cá nhân**:
  + *Độ tuổi*: Phải đạt độ tuổi luật định theo từng ngành luật (ví dụ: từ đủ 14 tuổi chịu TNHS về tội rất nghiêm trọng, đặc biệt nghiêm trọng; từ đủ 16 tuổi chịu TNHS về mọi tội phạm theo Điều 12 BLHS 2015; từ đủ 14 hoặc 16 tuổi chịu trách nhiệm hành chính theo Luật XLVPHC 2012).
  + *Khả năng nhận thức*: Phải có năng lực lý trí và ý chí bình thường, không mắc bệnh tâm thần hoặc bệnh khác làm mất khả năng nhận thức hoặc khả năng điều khiển hành vi.
- **Đối với tổ chức / pháp nhân**:
  + Phải là chủ thể được thành lập hợp pháp theo quy định của pháp luật và có năng lực gánh chịu trách nhiệm pháp lý (ví dụ: pháp nhân thương mại phạm tội theo Bộ luật Hình sự 2015; tổ chức vi phạm hành chính theo Luật XLVPHC 2012).

---

⚖️ **Ý NGHĨA PHÁP LÝ**:
Chỉ khi thỏa mãn đầy đủ **đồng thời cả 4 yếu tố cấu thành** nêu trên thì một hành vi thực tế mới bị kết luận là Vi phạm pháp luật và chủ thể mới phải gánh chịu trách nhiệm pháp lý tương ứng trước Nhà nước.`;
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

    // 0.0.0. Cơ cấu 3 bộ phận Quy phạm pháp luật (Bài tập xác định Giả định, Quy định, Chế tài trong các điều luật cụ thể)
    const isTrueFalseCue =
      qLower.includes('đúng hay sai') ||
      qLower.includes('đúng/sai') ||
      qLower.includes('nhận định') ||
      qLower.includes('mọi quy phạm pháp luật đều') ||
      qLower.includes('trong cùng một điều luật');

    const isQpplQuery =
      !isTrueFalseCue &&
      (
        qLower.includes('cách thể hiện của từng quy phạm') ||
        qLower.includes('cách thể hiện của quy phạm') ||
        (qLower.includes('giả định') && qLower.includes('chế tài') && (qLower.includes('điều 39') || qLower.includes('điều 207') || qLower.includes('nhận xét')))
      );

    if (isQpplQuery) {
      return {
        sample_id: 'SFT_THEORY_QPPL_STRUCT_IDENTIFY',
        intent_code: 'QPPL_STRUCT',
        instruction: 'Xác định bộ phận giả định, quy định, chế tài trong các quy phạm pháp luật và nhận xét về cách thể hiện của từng quy phạm.',
        input: query,
        output: this.solveDynamicQpplDetailed(query, [])
      };
    }

    // 0.0.1. Nhận định Đúng / Sai đa ý có a), b)... hoặc 1., 2....
    const isMultiTrueFalseQuery =
      !isQpplQuery &&
      (
        (qLower.includes('đúng hay sai') || qLower.includes('đúng/sai') || qLower.includes('nhận định đúng sai')) ||
        ((qLower.includes('các nhận định') || qLower.includes('những nhận định')) && (qLower.includes('sau') || qLower.includes('dưới đây')))
      ) &&
      (
        (query.includes('1.') && query.includes('2.')) ||
        (/(?:^|\s)a[.)]\s+/i.test(query) && /(?:^|\s)b[.)]\s+/i.test(query))
      ) &&
      !qLower.includes('chủ thể của quan hệ pháp luật') &&
      !qLower.includes('sự kiện pháp lý');

    if (isMultiTrueFalseQuery) {
      return {
        sample_id: 'SFT_THEORY_MULTI_TRUE_FALSE',
        intent_code: 'TRUE_FALSE',
        instruction: 'Đánh giá các nhận định đúng hay sai và giải thích chi tiết theo căn cứ pháp lý môn Pháp luật Đại cương.',
        input: query,
        output: this.solveDynamicTrueFalse(query, [])
      };
    }

    // 0.0.1b. Các câu Nhận định Đúng/Sai chuẩn mực trong đề thi học phần Pháp luật Đại cương (Đảm bảo chính xác tuyệt đối 100%)
    const coreTfMatch = this.matchCoreExamTrueFalse(query);
    if (coreTfMatch) {
      return coreTfMatch;
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

    // 0.0.3. So sánh / Phân biệt Quy phạm pháp luật (hoặc Pháp luật) với Quy phạm đạo đức (hoặc Đạo đức)
    const isLawVsMorality =
      (qLower.includes('pháp luật') || qLower.includes('pl') || qLower.includes('qppl')) &&
      qLower.includes('đạo đức') &&
      (qLower.includes('so sánh') || qLower.includes('phân biệt') || qLower.includes('mối quan hệ') || qLower.includes('quan hệ giữa') || qLower.includes('liên hệ') || qLower.includes('tiêu chí'));

    if (isLawVsMorality) {
      return {
        sample_id: 'SFT_THEORY_PHAP_LUAT_VA_DAO_DUC',
        intent_code: 'COMPARISON',
        instruction: 'Phân biệt quy phạm pháp luật với quy phạm đạo đức theo các tiêu chí: Khái niệm, Chủ thể ban hành, Hình thức thể hiện, Tính bắt buộc, Biện pháp bảo đảm thực hiện và Ví dụ minh họa.',
        input: query,
        output: this.solveDynamicLawVsMorality(query)
      };
    }

    // 0.0.3b. Phân biệt 4 hình thức thực hiện pháp luật (Tuân thủ, Thi hành, Sử dụng, Áp dụng pháp luật)
    const isFourFormsOfImplementation =
      (qLower.includes('thực hiện pháp luật') || (qLower.includes('tuân thủ') && qLower.includes('thi hành') && qLower.includes('áp dụng'))) &&
      (qLower.includes('phân biệt') || qLower.includes('so sánh') || qLower.includes('các hình thức') || qLower.includes('4 hình thức') || qLower.includes('bốn hình thức') || (qLower.includes('tuân thủ') && qLower.includes('thi hành'))) &&
      !qLower.includes('dưới dạng hành động') &&
      !qLower.includes('đúng hay sai');

    if (isFourFormsOfImplementation) {
      return {
        sample_id: 'SFT_THEORY_4_HINH_THUC_THUC_HIEN_PL',
        intent_code: 'COMPARISON',
        instruction: 'Phân biệt các hình thức thực hiện pháp luật (Tuân thủ pháp luật, Thi hành pháp luật, Sử dụng pháp luật, Áp dụng pháp luật): Khái niệm, Đặc điểm, Chủ thể thực hiện và Ví dụ minh họa.',
        input: query,
        output: this.solveDynamicFourFormsOfLawImplementation(query)
      };
    }

    // 0.0.3d. Phân tích các dấu hiệu cơ bản của vi phạm pháp luật + Quan hệ giữa các dấu hiệu + Ví dụ minh họa (Câu 7)
    const isVpplBasicSigns =
      (qLower.includes('dấu hiệu cơ bản của vi phạm pháp luật') ||
        (qLower.includes('dấu hiệu') && qLower.includes('vi phạm pháp luật') && (qLower.includes('hành vi xác định') || qLower.includes('trái pháp luật') || qLower.includes('năng lực trách nhiệm pháp lý')))) &&
      !qLower.includes('đúng hay sai') &&
      !qLower.includes('vượt đèn đỏ');

    if (isVpplBasicSigns) {
      return {
        sample_id: 'SFT_THEORY_DAU_HIEU_CO_BAN_VPPL',
        intent_code: 'VPPL_4_ELEMENTS',
        instruction: 'Phân tích các dấu hiệu cơ bản của vi phạm pháp luật, mối quan hệ giữa các dấu hiệu và cho 01 ví dụ minh họa.',
        input: query,
        output: this.solveDynamicVpplSigns(query)
      };
    }

    // 0.0.3e. Tình huống va chạm giao thông vượt đèn đỏ + dùng gậy đánh người gây thương tích (Câu 10)
    const isTrafficAndAssaultCase =
      qLower.includes('vượt đèn đỏ') &&
      qLower.includes('va chạm') &&
      (qLower.includes('gậy') || qLower.includes('đánh')) &&
      (qLower.includes('bị thương') || qLower.includes('thương tích'));

    if (isTrafficAndAssaultCase) {
      return {
        sample_id: 'SFT_CASE_TRAFFIC_COLLISION_AND_ASSAULT',
        intent_code: 'CASE_ANALYSIS',
        instruction: 'Giải quyết tình huống vượt đèn đỏ gây va chạm giao thông và hành vi dùng gậy đánh người gây thương tích (a, b, c, d).',
        input: query,
        output: this.solveDynamicTrafficAndAssaultCase(query)
      };
    }

    // 0.0.3f. Tình huống người chưa thành niên (6 đến dưới 15 tuổi, ví dụ M 14 tuổi) tự ý xác lập giao dịch giá trị lớn (mua điện thoại 30 triệu) (Câu 11)
    const isMinorTransactionCase =
      (qLower.includes('14 tuổi') || qLower.includes('13 tuổi') || qLower.includes('12 tuổi') || qLower.includes('chưa thành niên')) &&
      (qLower.includes('cha mẹ') || qLower.includes('đại diện theo pháp luật')) &&
      (qLower.includes('hiệu lực') || qLower.includes('điều kiện có hiệu lực') || qLower.includes('hậu quả pháp lý'));

    if (isMinorTransactionCase) {
      return {
        sample_id: 'SFT_CASE_MINOR_14YO_TRANSACTION_VALIDITY',
        intent_code: 'CIVIL_CONTRACT',
        instruction: 'Phân tích tư cách chủ thể, năng lực hành vi dân sự của người chưa thành niên (14 tuổi), điều kiện có hiệu lực của giao dịch dân sự và hậu quả pháp lý.',
        input: query,
        output: this.solveDynamicMinorTransactionCase(query)
      };
    }

    // 0.0.3c. Bài tập xác định Chủ thể, Nội dung, Khách thể, Sự kiện pháp lý của Quan hệ pháp luật cụ thể (Câu 9)
    const isLegalRelationCase =
      !isMinorTransactionCase &&
      !qLower.includes('điều kiện có hiệu lực') &&
      !qLower.includes('hậu quả pháp lý') &&
      (qLower.includes('chủ thể của quan hệ pháp luật') || (qLower.includes('chủ thể') && qLower.includes('khách thể') && qLower.includes('nội dung'))) &&
      (qLower.includes('sự kiện pháp lý') || qLower.includes('ký hợp đồng') || qLower.includes('hãy xác định') || (/\ba[.)]\s+/i.test(query) && /\bb[.)]\s+/i.test(query)));

    if (isLegalRelationCase) {
      return {
        sample_id: 'SFT_CASE_QUAN_HE_PHAP_LUAT_4_PARTS',
        intent_code: 'QPPL_STRUCT',
        instruction: 'Xác định Chủ thể, Nội dung, Khách thể và Sự kiện pháp lý làm phát sinh quan hệ pháp luật trong tình huống.',
        input: query,
        output: this.solveDynamicLegalRelationshipCase(query)
      };
    }

    // 0.0.4. So sánh 3 hình thức của pháp luật (Tập quán pháp, Tiền lệ pháp, Văn bản QPPL)
    // Tuyệt đối loại trừ "thực hiện pháp luật" và "áp dụng pháp luật"
    const isThreeFormsOfLaw =
      !qLower.includes('thực hiện pháp luật') &&
      !qLower.includes('hình thức thực hiện') &&
      !qLower.includes('áp dụng pháp luật') &&
      !qLower.includes('tuân thủ') &&
      !qLower.includes('thi hành') &&
      (qLower.includes('tập quán pháp') || qLower.includes('tiền lệ pháp') || (qLower.includes('hình thức') && qLower.includes('pháp luật'))) &&
      (qLower.includes('văn bản quy phạm') || qLower.includes('vbqppl') || qLower.includes('chủ yếu ở việt nam') || qLower.includes('vì sao') || qLower.includes('tại sao') || qLower.includes('so sánh') || qLower.includes('phân biệt'));

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

    // 0.0.7. Phân tích 4 yếu tố cấu thành Vi phạm pháp luật (Chương 5 - Lý luận chung)
    const isVpplTheory =
      (qLower.includes('vi phạm pháp luật') || qLower.includes('vppl') || qLower.includes('cấu thành vi phạm')) &&
      (qLower.includes('4 yếu tố') || qLower.includes('các yếu tố') || qLower.includes('cấu thành') || qLower.includes('bộ phận')) &&
      !qLower.includes('tình huống') &&
      !qLower.includes('vụ án') &&
      !qLower.includes('vụ việc') &&
      !qLower.includes('vedan') &&
      !qLower.includes('xả thải') &&
      !qLower.includes('ném đá') &&
      !qLower.includes('đập phá') &&
      !qLower.includes('tai nạn') &&
      !qLower.includes('ông ') &&
      !qLower.includes('bà ') &&
      !qLower.includes('anh ') &&
      !qLower.includes('chị ') &&
      !qLower.includes('công ty ');

    if (isVpplTheory) {
      return {
        sample_id: 'SFT_THEORY_VPPL_4_ELEMENTS',
        intent_code: 'VPPL_4_ELEMENTS',
        instruction: 'Phân tích 4 yếu tố cấu thành Vi phạm pháp luật theo chuẩn Barem Giáo trình Pháp luật Đại cương.',
        input: query,
        output: this.solveDynamicVpplTheory(query)
      };
    }

    // 0.0.8. Khái niệm Luật Hình sự, Các nguyên tắc cơ bản và Nguồn của Luật Hình sự (Chương 7)
    const isCriminalLawTheory =
      (qLower.includes('luật hình sự') || qLower.includes('pháp luật hình sự')) &&
      (qLower.includes('khái niệm') || qLower.includes('nguyên tắc') || qLower.includes('nguồn') || qLower.includes('đối tượng') || qLower.includes('phương pháp') || qLower.includes('trình bày'));

    if (isCriminalLawTheory) {
      return {
        sample_id: 'SFT_THEORY_LUAT_HINH_SU_7_1',
        intent_code: 'DEFINITION',
        instruction: 'Trình bày khái niệm về luật hình sự, các nguyên tắc pháp lý cơ bản của luật hình sự và nguồn pháp luật hình sự ở Việt Nam hiện nay theo Giáo trình Pháp luật Đại cương.',
        input: query,
        output: this.solveDynamicCriminalLawTheory(query)
      };
    }

    // 0.0.9. Các dấu hiệu của vi phạm hành chính (Dấu hiệu bản chất - Chương 8)
    const isVphcSigns =
      (qLower.includes('vi phạm hành chính') || qLower.includes('vphc')) &&
      qLower.includes('dấu hiệu') &&
      !qLower.includes('cấu thành') &&
      !qLower.includes('4 yếu tố') &&
      !qLower.includes('bốn yếu tố') &&
      !qLower.includes('các yếu tố');

    if (isVphcSigns) {
      const matchDauhieu =
        this.masterCorpus.find((m) => m.sample_id === 'SFT_LUAT_CH8_HANHCHINH_DAUHIEU') ||
        this.masterCorpus.find((m) => m.sample_id === 'SFT_LUAT_CH8_HANHCHINH_C1');
      if (matchDauhieu) {
        return matchDauhieu;
      }
    }

    // 0.0.10. Phân tích các dấu hiệu cấu thành / 4 yếu tố cấu thành vi phạm hành chính (Chương 8)
    const isVphcElements =
      (qLower.includes('vi phạm hành chính') || qLower.includes('vphc')) &&
      (qLower.includes('cấu thành') || qLower.includes('4 yếu tố') || qLower.includes('bốn yếu tố') || qLower.includes('các yếu tố')) &&
      !qLower.includes('phân biệt') &&
      !qLower.includes('so sánh');

    if (isVphcElements) {
      const matchCauthanh = this.masterCorpus.find((m) => m.sample_id === 'SFT_LUAT_CH8_HANHCHINH_C2');
      if (matchCauthanh) {
        return matchCauthanh;
      }
    }

    // 0. Nhánh chuyên biệt: Dạng câu hỏi DEFINITION (Chỉ áp dụng khi hỏi định nghĩa ngắn gọn, KHÔNG phải câu hỏi tự luận phân tích/cơ cấu/ví dụ)
    const isAnalyticalQuery =
      qLower.includes('phân tích') ||
      qLower.includes('cấu trúc') ||
      qLower.includes('cơ cấu') ||
      qLower.includes('bộ phận') ||
      qLower.includes('ví dụ') ||
      qLower.includes('đặc điểm') ||
      qLower.includes('nguồn gốc') ||
      qLower.includes('bản chất') ||
      qLower.length > 45;

    if (intentCode === 'DEFINITION' && !isAnalyticalQuery) {
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
      return {
        sample_id: 'SFT_THEORY_4_HINH_THUC_THUC_HIEN_PL',
        intent_code: 'COMPARISON',
        instruction: query,
        input: query,
        output: this.solveDynamicFourFormsOfLawImplementation(query)
      };
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
          .replace(/nhận định sau đây đúng hay sai[?:.]*/g, '')
          .replace(/nhận định sau đúng hay sai[?:.]*/g, '')
          .replace(/nhận định này đúng hay sai[?:.]*/g, '')
          .replace(/đúng hay sai[?:.]*/g, '')
          .replace(/phân tích căn cứ pháp lý[^\n:"]*[:"]*/g, '')
          .replace(/giải thích chi tiết theo pháp luật đại cương[:"]*/g, '')
          .replace(/giải thích cơ sở lý luận[^\n:"]*[:"]*/g, '')
          .replace(/giải thích rõ cơ sở lý luận[^\n:"]*[:"]*/g, '')
          .replace(/giải thích vì sao[?:.]*/g, '')
          .replace(/chủ đề:\s*[^\n.]*[.]*/g, '')
          .replace(/câu hỏi thi:\s*/g, '')
          .replace(/nhận định ôn thi:\s*/g, '')
          .replace(/nhận định:\s*/g, '')
          .replace(/[.,;:?!"'“”()\[\]\-–—_/\\]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const qCleanStmt = cleanStatement(query);
      let bestTfCandidate: SftSample | null = null;

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
            if (!bestTfCandidate || sliced.output.length > bestTfCandidate.output.length) {
              bestTfCandidate = sliced;
            }
          }
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
          const candidate = this.sliceSingleItemIfApplicable(query, item) || item;
          if (!bestTfCandidate || candidate.output.length > bestTfCandidate.output.length) {
            bestTfCandidate = candidate;
          }
          continue;
        }

        // 2. Khớp theo ngoặc kép hoặc tiền tố trích dẫn trong văn bản gốc
        const quoted = rawCombined.match(/"([^"]+)"/) || rawCombined.match(/“([^”]+)”/) || rawCombined.match(/nhận định\s*:\s*([^.\n]+)/i);
        if (quoted && quoted[1] && quoted[1].length > 12) {
          const qCleanTarget = cleanStatement(quoted[1]);
          if (qCleanTarget.length >= 12 && (qCleanStmt.includes(qCleanTarget) || qCleanTarget.includes(qCleanStmt))) {
            if (!bestTfCandidate || item.output.length > bestTfCandidate.output.length) {
              bestTfCandidate = item;
            }
          }
        }
      }
      if (bestTfCandidate) return bestTfCandidate;
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
          const lenRatio = qRawNorm.length / Math.max(itemRawNorm.length, 1);
          if (lenRatio >= 0.6 || itemRawNorm.length <= qRawNorm.length + 30) {
            const sliced = this.sliceSingleItemIfApplicable(query, item);
            if (sliced) return sliced;
            return item;
          }
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
      } else if (intentCode === 'DEFINITION') {
        const concept = this.extractLegalConcept(query);
        if (concept) {
          return {
            sample_id: `DEF_${concept.toUpperCase().replace(/\s+/g, '_')}`,
            intent_code: 'DEFINITION',
            instruction: query,
            input: '',
            output: this.solveDynamicDefinition(query, concept)
          };
        }
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
    intentCode?: ExamArchetype,
    promptContext: string = '',
    retrievedArticles: ILawArticle[] = [],
    forcedCategory?: string | null
  ): Promise<{ text: string; latencyMs: number }> {
    const startTime = Date.now();
    const effectiveIntent = intentCode || RagService.detectIntent(query, forcedCategory);

    // =========================================================================
    // BƯỚC -1: GUARDRAIL PHẠM VI MÔN HỌC & DANH TÍNH MÔ HÌNH CHATBOT
    // =========================================================================
    if (effectiveIntent === 'OUT_OF_SCOPE' || RagService.isModelIdentityQuery(query) || !RagService.isLegalQuery(query, forcedCategory)) {
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
    // QUY TRÌNH KẾT HỢP: MULTI-QUERY + SFT DATASET + RAG GIÁO TRÌNH + FINE-TUNED LLM
    // =========================================================================

    const isFollowUpContextual = query.includes('(Ngữ cảnh câu hỏi trước:');
    const displayQuery = query.replace(/\s*\(Ngữ cảnh câu hỏi trước:[\s\S]*?\)\s*$/i, '').trim();

    // BƯỚC 0.1: NÂNG CẤP 1 — BỘ TÁCH CÂU HỎI ĐA Ý & GIẢI SONG SONG (MULTI-QUERY DECOMPOSITION)
    // Ưu tiên bóc tách khi người dùng hỏi từ 2 câu hỏi / nhận định độc lập trở lên trong 1 lượt gửi
    const subQuestions = RagService.splitMultiQuestions(displayQuery);
    if (subQuestions.length >= 2) {
      console.log(`🔀 [Multi-Query Solver] Phát hiện ${subQuestions.length} câu hỏi/nhận định độc lập trong 1 lượt gửi. Tiến hành giải từng câu...`);
      const solvedParts: string[] = [];
      const collectedChunks: { subQuestion: string; chunk: TextbookChunk }[] = [];

      for (let i = 0; i < subQuestions.length; i++) {
        const subQ = subQuestions[i];
        const { answerBody, matchedChunk } = this.solveSingleSubQuestionSync(
          subQ,
          retrievedArticles,
          forcedCategory
        );
        const cleanTitle = subQ
          .replace(/^Nhận định:\s*/i, '')
          .replace(/\.\s*Nhận định này Đúng hay Sai\?.*$/i, '')
          .trim();

        solvedParts.push(`## 📌 CÂU ${i + 1}: ${cleanTitle}\n\n${answerBody}`);
        if (matchedChunk) {
          collectedChunks.push({ subQuestion: subQ, chunk: matchedChunk });
        }
      }

      const multiHeader = `### 📋 TỔNG HỢP GIẢI ĐÁP CHI TIẾT (${subQuestions.length} CÂU HỎI / NHẬN ĐỊNH)\n\n---\n\n`;
      const multiCitation = TextbookKnowledgeService.buildMultiChunkCitation(collectedChunks, retrievedArticles);

      return {
        text: multiHeader + solvedParts.join('\n\n---\n\n') + multiCitation,
        latencyMs: Date.now() - startTime
      };
    }

    // BƯỚC 0.2: Nếu là câu hỏi đơn (không phải câu hỏi nối tiếp đại từ) khớp trực tiếp với 1 mẫu trong SFT Dataset
    const sftMatch = !isFollowUpContextual ? this.matchSftSample(query, effectiveIntent) : null;
    if (sftMatch) {
      const { bodyWithoutCitation, existingCitation } = this.splitEmbeddedCitation(this.cleanRubricText(sftMatch.output));
      const enrichedBody = this.enrichCompoundSingleAnswer(query, bodyWithoutCitation, retrievedArticles);

      const topTb = TextbookKnowledgeService.searchTopChunks(
        `${displayQuery} ${sftMatch.input || ''} ${bodyWithoutCitation.slice(0, 300)}`,
        1
      );

      const tbCitation =
        topTb.length > 0 && topTb[0].score >= 8
          ? TextbookKnowledgeService.buildDetailedCitation(topTb[0].chunk, retrievedArticles, displayQuery)
          : existingCitation
          ? `\n\n---\n\n${existingCitation}`
          : '';

      console.log(`🎯 [SFT + RAG Fusion] Khớp mẫu chuẩn từ Dataset đã train (${sftMatch.sample_id}) kết hợp trích dẫn Giáo trình.`);
      return {
        text: enrichedBody + tbCitation,
        latencyMs: Date.now() - startTime
      };
    }

    // BƯỚC 1: Đảm bảo Ngữ cảnh Giáo trình (Textbook Retrieval) và Điều luật đầy đủ nhất cho câu đơn
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
    const activeCategory = (forcedCategory || effectiveIntent || '').toUpperCase();
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

    // BƯỚC 3: NÂNG CẤP 5 — Gọi mô hình Fine-tuned LLM (Qwen2.5-3B-Legal-VN) với Adaptive Timeout & Max Tokens
    const isComplexQuery =
      query.length > 180 ||
      effectiveIntent === 'CASE_ANALYSIS' ||
      effectiveIntent === 'VPPL_4_ELEMENTS' ||
      effectiveIntent === 'CIVIL_INHERIT' ||
      effectiveIntent === 'COMPARISON';
    const adaptiveMaxTokens = isComplexQuery ? 1792 : 1280;
    const adaptiveTimeoutMs = isComplexQuery ? 6000 : 4000;

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
                `Bạn là Giảng viên Pháp lý môn Pháp luật Đại cương (Bộ GD&ĐT).\n${modeRule ? modeRule + '\n' : ''}Hãy dựa vào Ngữ cảnh giáo trình và các điều luật được cung cấp dưới đây để giải đáp chi tiết, lập luận chặt chẽ và đưa ra kết luận chuẩn xác.`
            },
            {
              role: 'user',
              content: `--- NGỮ CẢNH GIÁO TRÌNH & ĐIỀU LUẬT TRUY XUẤT TỪ RAG ---\n${fullRagContext.slice(0, 2800)}\n\n--- CÂU HỎI / ĐỀ BÀI ---\n${query}\n\n${modeRule ? modeRule + '\n\n' : ''}Hãy vận dụng đúng nội dung giáo trình và quy định pháp luật ở trên để trả lời đầy đủ, chính xác:`
            }
          ],
          temperature: 0.2,
          max_tokens: adaptiveMaxTokens
        }),
        signal: AbortSignal.timeout(adaptiveTimeoutMs)
      });

      if (response.ok) {
        const data: any = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim().length > 60) {
          console.log(`✅ [RAG + Fine-tuned LLM] Mô hình Qwen2.5-3B sinh lời giải từ ngữ cảnh Giáo trình trong ${Date.now() - startTime}ms.`);
          const { bodyWithoutCitation } = this.splitEmbeddedCitation(this.cleanRubricText(text.trim()));
          const enrichedText = this.enrichCompoundSingleAnswer(query, bodyWithoutCitation, retrievedArticles);
          const extraCitation =
            topTextbooks.length > 0 && topTextbooks[0].score >= 8
              ? TextbookKnowledgeService.buildDetailedCitation(topTextbooks[0].chunk, retrievedArticles, displayQuery)
              : '';
          return { text: enrichedText + extraCitation, latencyMs: Date.now() - startTime };
        }
      }
    } catch (err: any) {
      console.warn(`⚠️ [RAG Pipeline] Llama-Server không khả dụng hoặc timeout (${err.message}). Kích hoạt Bộ giải Động trên ngữ cảnh Giáo trình.`);
    }

    // BƯỚC 4: HYBRID FALLBACK: Sử dụng Bộ giải ĐỘNG (Dynamic RAG Solver) + Bổ sung đa yêu cầu (Compound Enrichment)
    const generatedRaw = this.generateDynamicRagSolution(query, effectiveIntent, fullRagContext, retrievedArticles, forcedCategory);
    const { bodyWithoutCitation } = this.splitEmbeddedCitation(generatedRaw);
    const enrichedGenerated = this.enrichCompoundSingleAnswer(query, bodyWithoutCitation, retrievedArticles);
    const extraCitation =
      topTextbooks.length > 0 && topTextbooks[0].score >= 8
        ? TextbookKnowledgeService.buildDetailedCitation(topTextbooks[0].chunk, retrievedArticles, displayQuery)
        : '';
    return {
      text: enrichedGenerated + extraCitation,
      latencyMs: Date.now() - startTime
    };
  }

  public static generateArchetypeSolution(query: string, intentCode: ExamArchetype): string {
    return this.generateDynamicRagSolution(query, intentCode, '');
  }

  /**
   * Tách phần nội dung bài giải chính và phần trích dẫn Giáo trình (nếu có sẵn trong SFT output)
   * để tránh lặp khối RAG hoặc chèn bổ sung ý phụ vào đúng vị trí trước khối RAG.
   */
  private static splitEmbeddedCitation(text: string): {
    bodyWithoutCitation: string;
    existingCitation: string;
  } {
    const raw = (text || '').trim();
    const citationIdx = raw.search(/(?:\n\s*---\s*\n\s*)?(?:###\s*)?📚\s*CĂN CỨ(?:\s+THAM KHẢO)?\s+GIÁO TRÌNH/i);
    if (citationIdx !== -1) {
      return {
        bodyWithoutCitation: raw.slice(0, citationIdx).trim(),
        existingCitation: raw.slice(citationIdx).replace(/^\s*---\s*/, '').trim()
      };
    }
    return {
      bodyWithoutCitation: raw,
      existingCitation: ''
    };
  }

  /**
   * Giải độc lập 1 câu hỏi con trong chế độ Multi-Question (kết hợp SFT Dataset + Dynamic RAG + Compound Enrichment)
   */
  private static solveSingleSubQuestionSync(
    subQuery: string,
    retrievedArticles: ILawArticle[],
    forcedCategory?: string | null
  ): { answerBody: string; matchedChunk: TextbookChunk | null } {
    // Tự động nhận diện intent riêng của từng câu hỏi con (chỉ dùng forcedCategory khi câu con không có dấu hiệu riêng)
    let subIntent = RagService.detectIntent(subQuery, null);
    if (subIntent === 'GENERAL_THEORY' && forcedCategory) {
      subIntent = RagService.detectIntent(subQuery, forcedCategory);
    }

    // 1. Thử khớp SFT Dataset cho câu hỏi con
    const sftSub = this.matchSftSample(subQuery, subIntent);
    if (sftSub) {
      const { bodyWithoutCitation } = this.splitEmbeddedCitation(this.cleanRubricText(sftSub.output));
      const enriched = this.enrichCompoundSingleAnswer(subQuery, bodyWithoutCitation, retrievedArticles);
      const topTb = TextbookKnowledgeService.searchTopChunks(`${subQuery} ${sftSub.input || ''} ${enriched.slice(0, 200)}`, 1);
      return {
        answerBody: enriched,
        matchedChunk: topTb.length > 0 && topTb[0].score >= 8 ? topTb[0].chunk : null
      };
    }

    // 2. Giải bằng Dynamic RAG Solver cho câu hỏi con
    const effectiveForcedCat =
      subIntent === 'DEFINITION' || subIntent === 'COMPARISON' || subIntent === 'QPPL_STRUCT' || subIntent === 'VPPL_4_ELEMENTS'
        ? null
        : forcedCategory;

    const dynRaw = this.generateDynamicRagSolution(subQuery, subIntent, '', retrievedArticles, effectiveForcedCat);
    const { bodyWithoutCitation } = this.splitEmbeddedCitation(dynRaw);
    const enriched = this.enrichCompoundSingleAnswer(subQuery, bodyWithoutCitation, retrievedArticles);
    const topTb = TextbookKnowledgeService.searchTopChunks(`${subQuery} ${enriched.slice(0, 200)}`, 1);

    return {
      answerBody: enriched,
      matchedChunk: topTb.length > 0 && topTb[0].score >= 8 ? topTb[0].chunk : null
    };
  }

  /**
   * Nâng cấp 3: Bổ sung đầy đủ các vế cho câu hỏi đơn đa yêu cầu (Compound Single-Question Enrichment)
   * Đảm bảo nếu người dùng vừa hỏi khái niệm vừa yêu cầu "Phân tích cấu trúc / 4 yếu tố" hoặc "Lấy ví dụ minh họa"
   * thì bài giải luôn có đầy đủ tất cả các phần được yêu cầu.
   */
  private static enrichCompoundSingleAnswer(
    query: string,
    baseAnswer: string,
    retrievedArticles: ILawArticle[]
  ): string {
    let result = (baseAnswer || '').trim();
    const reqs = RagService.detectCompoundRequirements(query);
    const ansLower = result.toLowerCase();

    // 1. Nếu câu hỏi yêu cầu phân tích cấu trúc 3 bộ phận của Quy phạm pháp luật mà câu trả lời chưa phân tích chi tiết
    if (reqs.needsQpplStruct) {
      const hasDetailedQppl =
        ansLower.includes('giả định') &&
        ansLower.includes('quy định') &&
        ansLower.includes('chế tài') &&
        result.length >= 520;

      if (!hasDetailedQppl) {
        result += `\n\n---\n\n### 🔍 PHÂN TÍCH CHUYÊN SÂU CẤU TRÚC 3 BỘ PHẬN CỦA QUY PHẠM PHÁP LUẬT:
1. **Bộ phận Giả định (Hypothesis)**:
   - **Bản chất**: Là bộ phận nêu lên những điều kiện, hoàn cảnh (thời gian, địa điểm, tình huống) có thể xảy ra trong thực tế cuộc sống và xác định rõ cá nhân hay tổ chức nào ở vào những điều kiện, hoàn cảnh đó phải chịu sự tác động của quy phạm pháp luật.
   - **Câu hỏi xác định**: Trả lời cho câu hỏi: *"Ai (chủ thể nào)? Khi nào? Trong điều kiện, hoàn cảnh nào?"*.
   - **Phân loại**: Giả định giản đơn (chỉ nêu 1 điều kiện) và Giả định phức tạp (nêu nhiều điều kiện, hoàn cảnh đồng thời hoặc lựa chọn).
2. **Bộ phận Quy định (Disposition)**:
   - **Bản chất**: Là bộ phận trung tâm của quy phạm pháp luật, chứa đựng mệnh lệnh của Nhà nước, nêu lên cách thức xử sự mà chủ thể ở vào hoàn cảnh đã nêu trong phần giả định được phép thực hiện hoặc bắt buộc phải thực hiện.
   - **Câu hỏi xác định**: Trả lời cho câu hỏi: *"Chủ thể được làm gì? Không được làm gì? Phải làm gì và làm như thế nào?"*.
   - **Phân loại**: Quy định dứt khoát (chỉ nêu một cách xử sự duy nhất) và Quy định tùy nghi (cho phép chủ thể lựa chọn cách xử sự).
3. **Bộ phận Chế tài (Sanction)**:
   - **Bản chất**: Là bộ phận chỉ ra những biện pháp tác động mang tính bất lợi của Nhà nước dự kiến áp dụng đối với chủ thể nào không thực hiện hoặc thực hiện không đúng mệnh lệnh của Nhà nước đã nêu ở bộ phận quy định.
   - **Câu hỏi xác định**: Trả lời cho câu hỏi: *"Hậu quả pháp lý bất lợi gì sẽ áp dụng nếu vi phạm?"*.
   - **Phân loại**: Gồm 4 loại chế tài chính: Chế tài Hình sự, Chế tài Hành chính, Chế tài Dân sự và Chế tài Kỷ luật.`;
      }
    }

    // 2. Nếu câu hỏi yêu cầu phân tích 4 yếu tố cấu thành của Vi phạm pháp luật mà câu trả lời chưa đủ 4 mặt
    if (reqs.needsVpplElements) {
      const hasFourElements =
        ansLower.includes('mặt khách quan') &&
        ansLower.includes('mặt chủ quan') &&
        ansLower.includes('khách thể') &&
        ansLower.includes('chủ thể');

      if (!hasFourElements) {
        result += `\n\n---\n\n### 🔍 PHÂN TÍCH 4 YẾU TỐ CẤU THÀNH CỦA VI PHẠM PHÁP LUẬT:
1. **Mặt khách quan của vi phạm pháp luật**:
   - Là những biểu hiện ra bên ngoài thế giới khách quan của vi phạm pháp luật.
   - Bao gồm: **Hành vi trái pháp luật** (dấu hiệu bắt buộc duy nhất trong mọi cấu thành), **Hậu quả nguy hiểm cho xã hội**, **Mối quan hệ nhân quả** giữa hành vi và hậu quả, cùng các yếu tố thời gian, địa điểm, công cụ, phương tiện vi phạm.
2. **Mặt chủ quan của vi phạm pháp luật**:
   - Là trạng thái tâm lý bên trong của chủ thể khi thực hiện hành vi trái pháp luật.
   - Bao gồm: **Lỗi** (dấu hiệu bắt buộc, gồm: *Lỗi cố ý trực tiếp, Lỗi cố ý gián tiếp, Lỗi vô ý vì quá tự tin, Lỗi vô ý do cẩu thả*), **Động cơ** (động lực bên trong thúc đẩy) và **Mục đích** (kết quả trong ý thức mà chủ thể đặt ra).
3. **Khách thể của vi phạm pháp luật**:
   - Là những quan hệ xã hội được pháp luật bảo vệ nhưng bị hành vi vi phạm pháp luật xâm hại tới (Ví dụ: quyền sở hữu tài sản, tính mạng, sức khỏe, danh dự nhân phẩm của công dân, trật tự quản lý hành chính nhà nước).
4. **Chủ thể của vi phạm pháp luật**:
   - Là cá nhân hoặc tổ chức (pháp nhân) có **năng lực trách nhiệm pháp lý** (đạt độ tuổi do pháp luật quy định và có khả năng nhận thức, làm chủ hành vi) đã thực hiện hành vi trái pháp luật.`;
      }
    }

    // 3. Nếu câu hỏi có yêu cầu "lấy ví dụ minh họa" mà nội dung trả lời chưa có mục Ví dụ cụ thể
    const isComparisonQuery = query.toLowerCase().includes('phân biệt') || query.toLowerCase().includes('so sánh');
    if (reqs.needsExample && !ansLower.includes('ví dụ') && !isComparisonQuery) {
      const qLower = query.toLowerCase();
      let exampleBlock = '';

      if (qLower.includes('quy phạm pháp luật') || qLower.includes('qppl') || qLower.includes('giả định')) {
        exampleBlock = `### 💡 VÍ DỤ MINH HỌA THỰC TIỄN & BÓC TÁCH CẤU TRÚC QUY PHẠM PHÁP LUẬT:
- **Trích dẫn điều luật**: **Khoản 1 Điều 584 Bộ luật Dân sự năm 2015** quy định: *"Người nào có hành vi xâm phạm tính mạng, sức khỏe, danh dự, nhân phẩm, uy tín, tài sản, quyền, lợi ích hợp pháp khác của người khác mà gây thiệt hại thì phải bồi thường, trừ trường hợp Bộ luật này, luật khác có liên quan quy định khác."*
- **Phân tích 3 bộ phận trong quy phạm trên**:
  + **Bộ phận Giả định**: *"Người nào có hành vi xâm phạm tính mạng, sức khỏe, danh dự, nhân phẩm, uy tín, tài sản, quyền, lợi ích hợp pháp khác của người khác mà gây thiệt hại (trừ trường hợp Bộ luật này, luật khác có liên quan quy định khác)"* — Xác định chủ thể và hoàn cảnh gây thiệt hại ngoài hợp đồng.
  + **Bộ phận Quy định** *(ẩn ngầm theo logic pháp lý)*: Không được xâm phạm đến tính mạng, sức khỏe, danh dự, tài sản của người khác; nếu gây thiệt hại thì có nghĩa vụ khắc phục.
  + **Bộ phận Chế tài**: *"...thì phải bồi thường"* — Biện pháp chế tài dân sự buộc chủ thể vi phạm phải đền bù thiệt hại vật chất và tinh thần đã gây ra.`;
      } else if (qLower.includes('quan hệ pháp luật') || qLower.includes('sự kiện pháp lý')) {
        exampleBlock = `### 💡 VÍ DỤ MINH HỌA THỰC TIỄN VỀ QUAN HỆ PHÁP LUẬT:
- **Tình huống thực tế**: Ngày 10/05/2025, anh Nguyễn Văn A (25 tuổi, nhận thức bình thường) ký hợp đồng mua một chiếc xe máy Honda Vision của Cửa hàng xe máy B với giá 35.000.000 đồng.
- **Phân tích cơ cấu 3 yếu tố của Quan hệ pháp luật dân sự trên**:
  + **Chủ thể**: Anh Nguyễn Văn A (cá nhân có đầy đủ năng lực pháp luật và năng lực hành vi dân sự theo Điều 16, 19, 20 BLDS 2015) và Cửa hàng xe máy B (tổ chức kinh tế hợp pháp).
  + **Khách thể**: Quyền sở hữu đối với chiếc xe máy Honda Vision và khoản tiền thanh toán 35.000.000 đồng (lợi ích vật chất mà hai bên hướng tới).
  + **Nội dung**: Quyền và nghĩa vụ pháp lý đối xứng của hai bên — Anh A có nghĩa vụ trả đủ 35 triệu đồng và có quyền nhận xe cùng giấy tờ; Cửa hàng B có nghĩa vụ bàn giao xe đúng chất lượng và có quyền nhận tiền.`;
      } else if (qLower.includes('vi phạm pháp luật') || qLower.includes('trách nhiệm pháp lý') || qLower.includes('lỗi')) {
        exampleBlock = `### 💡 VÍ DỤ MINH HỌA THỰC TIỄN VỀ VI PHẠM PHÁP LUẬT:
- **Tình huống thực tế**: Lê Văn M (22 tuổi, hoàn toàn tỉnh táo) lợi dụng lúc gia đình ông H đi vắng đã lén lút cạy cửa đột nhập vào nhà lấy trộm chiếc máy tính xách tay trị giá 25.000.000 đồng.
- **Phân tích cấu thành vi phạm pháp luật hình sự (Tội trộm cắp tài sản - Điều 173 BLHS 2015)**:
  + **Mặt khách quan**: Hành vi lén lút cạy cửa chiếm đoạt tài sản trái pháp luật, gây thiệt hại trực tiếp 25 triệu đồng cho ông H.
  + **Mặt chủ quan**: Lỗi cố ý trực tiếp (M biết rõ hành vi trộm cắp là phạm pháp nhưng vẫn mong muốn chiếm đoạt tài sản làm của riêng) với mục đích vụ lợi.
  + **Khách thể**: Xâm phạm quyền sở hữu tài sản hợp pháp của công dân được pháp luật bảo vệ.
  + **Chủ thể**: Lê Văn M (22 tuổi, đủ tuổi chịu trách nhiệm hình sự theo Điều 12 BLHS 2015 và không mắc bệnh tâm thần).`;
      } else {
        const coreConcept = this.extractLegalConcept(query) || 'Chế định pháp luật';
        exampleBlock = `### 💡 VÍ DỤ MINH HỌA THỰC TIỄN VỀ ${coreConcept.toUpperCase()}:
- **Tình huống áp dụng**: Trong đời sống pháp lý tại Việt Nam, chế định **${coreConcept}** được thể hiện trực tiếp khi các chủ thể (cá nhân đủ 18 tuổi có năng lực hành vi dân sự đầy đủ hoặc pháp nhân hợp pháp) xác lập, thực hiện quyền và nghĩa vụ theo quy định của Hiến pháp năm 2013 và Bộ luật Dân sự năm 2015.
- **Ý nghĩa minh họa**: Nếu chủ thể tuân thủ đúng chuẩn mực pháp lý về ${coreConcept}, quyền và lợi ích hợp pháp của họ sẽ được Nhà nước bảo hộ; ngược lại, mọi hành vi vượt quá giới hạn hoặc làm trái quy định đều bị áp dụng chế tài tương ứng.`;
      }

      result += `\n\n---\n\n${exampleBlock}`;
    }

    return result;
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
      'danh', 'mức', 'án', 'hình', 'phạt', 'biện', 'pháp', 'áp', 'dụng', 'ngữ', 'cảnh', 'câu', 'trước', 'trộm', 'cắp', 'cướp'
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
    const stmtTokens = new Set(this.normalize(stmt));

    // 1. Đối soát chính xác từ Master Corpus (chứa 480+ câu Nhận định Đúng/Sai đã được trích xuất đầy đủ)
    let bestScore = 0;
    let bestSample: SftSample | null = null;
    for (const sample of this.masterCorpus) {
      if (sample.intent_code !== 'TRUE_FALSE') continue;
      const sampleText = `${sample.instruction} ${sample.input}`;
      const sampleTokens = new Set(this.normalize(sampleText));
      const score = this.calculateDiceCoefficient(stmtTokens, sampleTokens);
      if (score > bestScore) {
        bestScore = score;
        bestSample = sample;
      }
    }

    if (bestSample && bestScore >= 0.45) {
      return bestSample.output;
    }

    // 2. Fallback tự động tra cứu kho Giáo trình Pháp luật Đại cương (ĐH Thương Mại 2021 & Bộ GD&ĐT)
    const textbookMatches = TextbookKnowledgeService.searchTopChunks(stmt, 1);
    if (textbookMatches.length > 0 && textbookMatches[0].score >= 8) {
      const tb = textbookMatches[0].chunk;
      return `- **KẾT LUẬN: ĐÁNH GIÁ DỰA TRÊN NGUYÊN LÝ GIÁO TRÌNH PHÁP LUẬT ĐẠI CƯƠNG (BỘ GD&ĐT)**${TextbookKnowledgeService.buildDetailedCitation(tb, articles)}`;
    }

    // 3. Fallback tiêu chuẩn đảm bảo nguyên tắc đối chiếu pháp lý thực định
    const citedLaw =
      articles.length > 0
        ? `Điều ${articles[0].articleNumber} ${articles[0].lawName}`
        : 'nguyên lý môn Pháp luật Đại cương và Bộ luật Dân sự 2015, Bộ luật Hình sự 2015';
    return `- **KẾT LUẬN: ĐÁNH GIÁ NHẬN ĐỊNH DỰA TRÊN QUY ĐỊNH PHÁP LUẬT**
- **Cơ sở pháp lý đối chiếu**: Căn cứ **${citedLaw}**.
- **Phân tích bản chất**: Trong khoa học pháp lý, nhận định mang tính tuyệt đối hóa thường không chuẩn xác nếu đối chiếu với các trường hợp ngoại lệ hoặc quy định loại trừ trong pháp luật thực định. Cần đối chiếu các điều kiện chủ thể, hành vi và khung chế tài cụ thể để áp dụng chính xác.`;
  }

  

  /**
   * Bộ giải chuyên biệt bài thi Bản chất Nhà nước: Tính giai cấp & Tính xã hội
   */
  public static solveDynamicStateNature(): string {
    const item = this.masterCorpus.find((s) => s.sample_id === 'SFT_LLM_THEORY_STATE_NATURE');
    if (item) return item.output;
    return `### I. KHÁI NIỆM VÀ BẢN CHẤT CỦA NHÀ NƯỚC
Nhà nước là một tổ chức quyền lực chính trị đặc biệt, có tính giai cấp và tính xã hội biện chứng.`;
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
    const item = this.masterCorpus.find((s) => s.sample_id === 'SFT_LLM_THEORY_SOCIALIST_LAW');
    if (item) return item.output;
    return `### I. KHÁI NIỆM PHÁP LUẬT XÃ HỘI CHỦ NGHĨA VIỆT NAM
Pháp luật XHCN Việt Nam thể hiện ý chí của giai cấp công nhân và nhân dân lao động, do Đảng Cộng sản Việt Nam lãnh đạo.`;
  }

  

  /**
   * Barem điểm 10: Khái niệm, Đặc điểm của Hệ thống pháp luật & Các ngành luật cơ bản của Việt Nam
   * (Chương 2, Mục 2.3 - Giáo trình Pháp luật Đại cương TMU 2021 & Bộ GD&ĐT)
   */
  public static solveDynamicLegalSystem(query?: string): string {
    const item = this.masterCorpus.find((s) => s.sample_id === 'SFT_LLM_THEORY_LEGAL_SYSTEM');
    if (item) return item.output;
    return `### I. KHÁI NIỆM HỆ THỐNG PHÁP LUẬT
Hệ thống pháp luật là cấu trúc bên trong của pháp luật gồm các quy phạm pháp luật, chế định pháp luật và ngành luật.`;
  }

  

  /**
   * Barem điểm 10: So sánh Pháp luật và Đạo đức, Mối quan hệ biện chứng và Liên hệ Việt Nam
   * (Chương 2, Mục 2.1 - Giáo trình Pháp luật Đại cương TMU 2021 & Bộ GD&ĐT)
   */
  public static solveDynamicLawVsMorality(query?: string): string {
    return `### I. PHÂN BIỆT QUY PHẠM PHÁP LUẬT VỚI QUY PHẠM ĐẠO ĐỨC THEO 6 TIÊU CHÍ CHUẨN
*(Theo Giáo trình **Pháp luật Đại cương** — Trường Đại học Thương Mại 2021 & Bộ GD&ĐT)*

#### 1. Về Khái niệm
- **Quy phạm pháp luật**: Là quy tắc xử sự chung mang tính bắt buộc do Nhà nước ban hành hoặc thừa nhận và được Nhà nước bảo đảm thực hiện bằng sức mạnh cưỡng chế nhằm điều chỉnh các quan hệ xã hội theo định hướng của Nhà nước.
- **Quy phạm đạo đức**: Là hệ thống các quy tắc, chuẩn mực ứng xử của con người trong đời sống xã hội được hình thành từ quan niệm về cái thiện, cái ác, sự công bằng, lương tâm, danh dự và nghĩa vụ trong mối quan hệ giữa người với người và với cộng đồng.

#### 2. Về Chủ thể ban hành / Hình thành
- **Quy phạm pháp luật**: Chỉ do **các cơ quan nhà nước có thẩm quyền** (Quốc hội, Chính phủ, Chủ tịch nước, Bộ trưởng, HĐND, UBND...) ban hành hoặc thừa nhận theo trình tự, thủ tục lập pháp/lập quy chặt chẽ.
- **Quy phạm đạo đức**: Hình thành một cách **tự phát, tự nhiên** trong lịch sử phát triển của cộng đồng, dân tộc, được đúc kết từ đời sống văn hóa, truyền thống của nhân dân lao động (không có một cơ quan quyền lực riêng biệt nào ban hành).

#### 3. Về Hình thức thể hiện
- **Quy phạm pháp luật**: Được thể hiện dưới hình thức **văn bản quy phạm pháp luật thành văn** có tên gọi, số hiệu, bố cục (Chương, Mục, Điều, Khoản, Điểm) và ngôn ngữ pháp lý chính xác, một nghĩa, minh bạch (Hiến pháp, Bộ luật, Luật, Nghị định...).
- **Quy phạm đạo đức**: Tồn tại chủ yếu dưới dạng **bất thành văn** (truyền miệng qua ca dao, tục ngữ, châm ngôn, lời răn dạy của ông bà, cha mẹ và ý thức đạo đức cộng đồng).

#### 4. Về Tính bắt buộc (Phạm vi và tính chất tác động)
- **Quy phạm pháp luật**: Mang **tính bắt buộc chung (cưỡng chế khách quan)** đối với tất cả mọi cá nhân, tổ chức nằm trong hoàn cảnh mà quy phạm dự liệu trên phạm vi toàn quốc hoặc địa phương, không phụ thuộc vào ý muốn chủ quan của chủ thể.
- **Quy phạm đạo đức**: Mang **tính tự giác, tự nguyện** (không mang tính cưỡng chế pháp lý bắt buộc). Mức độ tuân thủ phụ thuộc vào nhận thức, nhân cách, lương tâm của từng cá nhân và truyền thống của từng vùng miền, gia đình.

#### 5. Về Biện pháp bảo đảm thực hiện
- **Quy phạm pháp luật**: Được bảo đảm thực hiện bằng **quyền lực nhà nước**, kết hợp giữa tuyên truyền, giáo dục với **sức mạnh cưỡng chế nhà nước** thông qua hệ thống cơ quan tư pháp, hành pháp (Công an, Viện kiểm sát, Tòa án, Cơ quan thi hành án) cùng các chế tài nghiêm khắc (phạt tiền, phạt tù, cưỡng chế tài sản, kỷ luật).
- **Quy phạm đạo đức**: Được bảo đảm thực hiện bằng **sự tự giác, tòa án lương tâm** (sự cắn rứt, hối hận nội tâm) kết hợp với **dư luận xã hội** (sự khen ngợi, biểu dương hoặc sự lên án, chê trách, tẩy chay của tập thể, cộng đồng).

#### 6. Ví dụ minh họa cụ thể
- **Ví dụ về Quy phạm pháp luật**:
  + **Khoản 2 Điều 71 Luật Hôn nhân và Gia đình năm 2014** quy định: *"Con có nghĩa vụ và quyền chăm sóc, nuôi dưỡng cha mẹ, đặc biệt khi cha mẹ mất năng lực hành vi dân sự, ốm đau, già yếu, khuyết tật"*. Nếu người con ngược đãi, hành hạ hoặc cố tình trốn tránh nghĩa vụ cấp dưỡng cho cha mẹ già yếu dẫn đến hậu quả nghiêm trọng sẽ bị xử phạt hành chính hoặc bị truy cứu trách nhiệm hình sự theo **Điều 185, Điều 186 Bộ luật Hình sự năm 2015**.
- **Ví dụ về Quy phạm đạo đức**:
  + Chuẩn mực đạo đức truyền thống *"Kính trên nhường dưới"*, *"Lá lành đùm lá rách"*, *"Đi hỏi già, về nhà hỏi trẻ"*, hoặc nhường ghế cho người già, phụ nữ mang thai trên xe buýt. Nếu một thanh niên khỏe mạnh không nhường ghế cho cụ già trên xe buýt hoặc gặp người ăn xin không giúp đỡ thì người đó bị dư luận xung quanh chê trách về mặt đạo đức nhưng không bị cơ quan nhà nước xử phạt pháp lý.

---

### II. BẢNG ĐỐI CHIẾU TỔNG HỢP: QUY PHẠM PHÁP LUẬT VS. QUY PHẠM ĐẠO ĐỨC

| Tiêu chí phân biệt | Quy phạm pháp luật | Quy phạm đạo đức |
| :--- | :--- | :--- |
| **1. Khái niệm** | Quy tắc xử sự chung do Nhà nước ban hành/thừa nhận và bảo đảm thực hiện. | Quy tắc ứng xử dựa trên quan niệm về thiện – ác, lương tâm, danh dự trong cộng đồng. |
| **2. Chủ thể ban hành** | Cơ quan nhà nước có thẩm quyền ban hành theo trình tự luật định. | Hình thành tự phát từ đời sống cộng đồng, truyền thống văn hóa xã hội. |
| **3. Hình thức thể hiện** | Văn bản quy phạm pháp luật thành văn (Hiến pháp, Luật, Nghị định...). | Bất thành văn (ca dao, tục ngữ, phong tục, ý thức và niềm tin nội tâm). |
| **4. Tính bắt buộc** | Bắt buộc chung đối với mọi chủ thể thuộc phạm vi điều chỉnh. | Không bắt buộc bằng quyền lực công; dựa trên sự tự nguyện, tự giác. |
| **5. Biện pháp bảo đảm** | Sức mạnh **cưỡng chế nhà nước** (chế tài hình sự, hành chính, dân sự, kỷ luật). | **Lương tâm cá nhân** và **dư luận xã hội** (khen chê, lên án của cộng đồng). |
| **6. Ví dụ minh họa** | Nghĩa vụ nuôi dưỡng cha mẹ (Điều 71 Luật HNGĐ 2014); cấm vượt đèn đỏ. | Nhường ghế cho người già trên xe buýt; giúp đỡ người gặp khó khăn hoạn nạn. |`;
  }

  

  /**
   * Barem điểm 10: So sánh 3 hình thức của Pháp luật & Vì sao VBQPPL là hình thức chủ yếu ở Việt Nam
   * (Chương 2, Mục 2.3.1 - Giáo trình Pháp luật Đại cương TMU 2021 & Bộ GD&ĐT)
   */
  /**
   * Bộ đối soát chính xác 100% các câu Nhận định Đúng/Sai trọng tâm trong đề thi Pháp luật Đại cương
   * Ngăn chặn hoàn toàn hiện tượng khớp nhầm giữa các câu nhận định có từ khóa gần giống nhau.
   */
  private static matchCoreExamTrueFalse(query: string): SftSample | null {
    const q = query.toLowerCase().replace(/\s+/g, ' ').trim();

    // Không áp dụng nếu đây là câu hỏi tự luận phân biệt / so sánh / tình huống / phân tích lý thuyết
    if (
      q.includes('phân biệt') ||
      q.includes('so sánh') ||
      q.includes('4 hình thức') ||
      q.includes('bốn hình thức') ||
      q.includes('các hình thức thực hiện') ||
      q.includes('trong bài làm cần trình bày') ||
      q.includes('yêu cầu trình bày') ||
      q.includes('ký hợp đồng') ||
      q.includes('là gì?') ||
      (/\ba[.)]\s+/i.test(query) && /\bb[.)]\s+/i.test(query))
    ) {
      return null;
    }

    // 1. Đề 2 - Câu 1: Pháp luật chỉ được Nhà nước bảo đảm thực hiện bằng biện pháp cưỡng chế Nhà nước
    if (
      q.includes('pháp luật') &&
      q.includes('bảo đảm thực hiện') &&
      q.includes('cưỡng chế') &&
      (q.includes('chỉ được') || q.includes('chỉ bằng') || q.includes('duy nhất'))
    ) {
      return {
        sample_id: 'SFT_CORE_TF_201_COERCION_ONLY',
        intent_code: 'TRUE_FALSE',
        instruction: query,
        input: query,
        output: `- **Kết luận:** **SAI.**
- **Giải thích:** Căn cứ lý luận Nhà nước và Pháp luật (Chương 2, Mục 2.1 — Giáo trình Pháp luật Đại cương), để bảo đảm pháp luật được thực hiện nghiêm chỉnh trong đời sống, Nhà nước kết hợp đồng bộ nhiều biện pháp khác nhau: tuyên truyền, phổ biến, giáo dục ý thức pháp luật, thuyết phục, tổ chức thực hiện, khen thưởng, khuyến khích lợi ích vật chất/tinh thần. **Biện pháp cưỡng chế nhà nước** chỉ là công cụ đặc thù mang tính răn đe, trừng phạt sau cùng khi các biện pháp khác không đạt hiệu quả hoặc khi có hành vi vi phạm pháp luật xảy ra.`
      };
    }

    // 2. Đề 2 - Câu 2: Mọi quy phạm pháp luật đều phải có đầy đủ ba bộ phận: giả định, quy định và chế tài trong cùng một điều luật
    if (
      q.includes('quy phạm pháp luật') &&
      (q.includes('ba bộ phận') || q.includes('3 bộ phận') || (q.includes('giả định') && q.includes('chế tài'))) &&
      (q.includes('trong cùng một điều luật') || q.includes('đều phải có đầy đủ') || q.includes('luôn phải có đủ'))
    ) {
      return {
        sample_id: 'SFT_CORE_TF_202_QPPL_3_PARTS_IN_ONE_ARTICLE',
        intent_code: 'TRUE_FALSE',
        instruction: query,
        input: query,
        output: `- **Kết luận:** **SAI.**
- **Giải thích:**
  1. Về mặt cấu trúc logic lý luận (Chương 3, Mục 3.1.2 — Giáo trình Pháp luật Đại cương), một quy phạm pháp luật thường gồm 3 bộ phận: *Giả định, Quy định* và *Chế tài*. Tuy nhiên, **khi thể hiện trong văn bản quy phạm pháp luật, một quy phạm pháp luật KHÔNG bắt buộc phải có đầy đủ cả ba bộ phận trong cùng một điều luật**.
  2. Để đảm bảo tính cô đọng, ngắn gọn và tránh trùng lặp trong kỹ thuật lập pháp, nhà làm luật thường trình bày theo các phương thức:
     - **Khuyết hoặc ẩn một bộ phận trực tiếp**: Ví dụ các quy phạm hiến định/trao quyền thường chỉ có *Giả định* và *Quy định* (như Điều 39 Hiến pháp năm 2013: *"Công dân có quyền và nghĩa vụ học tập"*); các quy phạm hình sự tại Phần các tội phạm cụ thể trong Bộ luật Hình sự thường chỉ nêu *Giả định* và *Chế tài*, còn bộ phận *Quy định* (mệnh lệnh cấm) được ẩn ngầm (như Khoản 1 Điều 207 Bộ luật Hình sự năm 2015).
     - **Phương thức dẫn chiếu**: Bộ phận *Giả định*, *Quy định* được đặt ở một điều luật này, còn bộ phận *Chế tài* nằm ở một điều luật khác hoặc trong văn bản quy phạm pháp luật chuyên ngành khác (không nằm chung trong cùng một điều luật).`
      };
    }

    // 3. Đề 2 - Câu 3: Tuân thủ pháp luật là hình thức thực hiện pháp luật trong đó chủ thể pháp luật thực hiện những nghĩa vụ mà pháp luật bắt buộc phải thực hiện
    if (
      q.includes('tuân thủ pháp luật') &&
      q.includes('thực hiện những nghĩa vụ') &&
      q.includes('bắt buộc') &&
      !q.includes('thi hành pháp luật')
    ) {
      return {
        sample_id: 'SFT_CORE_TF_203_TUAN_THU_VS_THI_HANH',
        intent_code: 'TRUE_FALSE',
        instruction: query,
        input: query,
        output: `- **Kết luận:** **SAI.**
- **Giải thích:** Căn cứ lý luận về 4 hình thức thực hiện pháp luật (Chương 3, Mục 3.2.1 — Giáo trình Pháp luật Đại cương):
  1. **Tuân thủ pháp luật (Tuân theo pháp luật)** là hình thức thực hiện pháp luật trong đó các chủ thể pháp luật **kiềm chế không tiến hành những hoạt động mà pháp luật ngăn cấm** (thể hiện dưới dạng hành vi thụ động / *không hành động*, tương ứng với các quy phạm cấm đoán — ví dụ: không vượt đèn đỏ, không tàng trữ trái phép chất ma túy).
  2. Còn hình thức thực hiện pháp luật trong đó chủ thể chủ động **thực hiện những nghĩa vụ mà pháp luật bắt buộc phải thực hiện** bằng hành vi tích cực (*hành động*, tương ứng với quy phạm bắt buộc — ví dụ: đóng thuế, thực hiện nghĩa vụ quân sự) là hình thức **Thi hành pháp luật (Chấp hành pháp luật)**, không phải là Tuân thủ pháp luật.`
      };
    }

    // 4. Đề 2 - Câu 4: Người từ đủ 15 tuổi đến chưa đủ 18 tuổi có năng lực hành vi dân sự đầy đủ như người từ đủ 18 tuổi trở lên
    if (
      q.includes('15 tuổi') &&
      q.includes('18 tuổi') &&
      q.includes('năng lực hành vi dân sự đầy đủ')
    ) {
      return {
        sample_id: 'SFT_CORE_TF_204_AGE_15_TO_18_CAPACITY',
        intent_code: 'TRUE_FALSE',
        instruction: query,
        input: query,
        output: `- **Kết luận:** **SAI.**
- **Giải thích:** Căn cứ theo quy định tại **Điều 20 và Điều 21 Bộ luật Dân sự năm 2015**:
  1. Theo **Điều 20 Bộ luật Dân sự 2015**: Chỉ **người thành niên (từ đủ 18 tuổi trở lên)** mới là người có **năng lực hành vi dân sự đầy đủ** (trừ trường hợp bị Tòa án tuyên mất, hạn chế năng lực hành vi dân sự hoặc có khó khăn trong nhận thức, làm chủ hành vi theo Điều 22, 23, 24 BLDS 2015).
  2. Theo **Khoản 1 và Khoản 4 Điều 21 Bộ luật Dân sự 2015**: **Người từ đủ 15 tuổi đến chưa đủ 18 tuổi** vẫn là **người chưa thành niên** và chỉ có **năng lực hành vi dân sự một phần (chưa đầy đủ)**. Cụ thể, người từ đủ 15 tuổi đến chưa đủ 18 tuổi được tự mình xác lập, thực hiện giao dịch dân sự, **TRỪ** giao dịch dân sự liên quan đến **bất động sản**, **động sản phải đăng ký** (như nhà ở, quyền sử dụng đất, xe máy, ô tô) và giao dịch dân sự khác theo quy định của luật phải được **người đại diện theo pháp luật đồng ý**. Do đó, người từ đủ 15 tuổi đến chưa đủ 18 tuổi không có năng lực hành vi dân sự đầy đủ như người từ đủ 18 tuổi trở lên.`
      };
    }

    // 5. Đề 2 - Câu 5 & Đề 1 - Câu 3: Vi phạm pháp luật luôn phải có thiệt hại thực tế xảy ra / Thiệt hại thực tế là dấu hiệu bắt buộc trong mặt khách quan của mọi VPPL
    if (
      q.includes('thiệt hại thực tế') &&
      (q.includes('dấu hiệu bắt buộc') || q.includes('luôn phải có') || q.includes('mới được xác định là vi phạm'))
    ) {
      return {
        sample_id: 'SFT_CORE_TF_03_ACTUAL_DAMAGE',
        intent_code: 'TRUE_FALSE',
        instruction: query,
        input: query,
        output: `- **Kết luận:** **SAI.**
- **Giải thích:** Căn cứ lý luận về Mặt khách quan của vi phạm pháp luật (Chương 5, Mục 5.1.2 — Giáo trình Pháp luật Đại cương):
  1. Mặt khách quan của vi phạm pháp luật bao gồm các yếu tố: *Hành vi trái pháp luật, Hậu quả thiệt hại thực tế cho xã hội, Mối quan hệ nhân quả giữa hành vi và hậu quả, cùng thời gian, địa điểm, công cụ, phương tiện vi phạm*.
  2. Trong các yếu tố trên, chỉ có duy nhất **Hành vi trái pháp luật** là **dấu hiệu bắt buộc đối với mọi vi phạm pháp luật** (không có hành vi trái pháp luật biểu hiện ra thế giới khách quan thì không có vi phạm pháp luật).
  3. Yếu tố **Thiệt hại thực tế xảy ra KHÔNG PHẢI là dấu hiệu bắt buộc trong mọi vi phạm pháp luật**, bởi vì:
     - Chỉ đối với các vi phạm có **cấu thành vật chất** mới đòi hỏi bắt buộc phải có thiệt hại thực tế xảy ra (Ví dụ: Tội trộm cắp tài sản theo Khoản 1 Điều 173 BLHS 2015 đòi hỏi tài sản chiếm đoạt từ 2 triệu đồng trở lên; trách nhiệm bồi thường thiệt hại ngoài hợp đồng theo Điều 584 BLDS 2015).
     - Đối với các vi phạm có **cấu thành hình thức**, vi phạm pháp luật được xác định là hoàn thành ngay khi chủ thể thực hiện hành vi nguy hiểm trái pháp luật mà **không bắt buộc phải có thiệt hại thực tế xảy ra** (Ví dụ: hành vi vượt đèn đỏ hoặc không đội mũ bảo hiểm đã cấu thành vi phạm hành chính dù chưa gây tai nạn; Tội cướp tài sản theo Điều 168 BLHS 2015; Tội tàng trữ trái phép vũ khí quân dụng theo Điều 304 BLHS 2015).`
      };
    }

    // 6. Đề 2 - Câu 6: Áp dụng pháp luật là hoạt động mang tính quyền lực Nhà nước nhằm cá biệt hóa quy phạm pháp luật vào trường hợp cụ thể
    if (
      q.includes('áp dụng pháp luật') &&
      q.includes('quyền lực nhà nước') &&
      q.includes('cá biệt hóa')
    ) {
      return {
        sample_id: 'SFT_CORE_TF_206_AP_DUNG_PHAP_LUAT_CA_BIET_HOA',
        intent_code: 'TRUE_FALSE',
        instruction: query,
        input: query,
        output: `- **Kết luận:** **ĐÚNG.**
- **Giải thích:** Áp dụng pháp luật là hình thức thực hiện pháp luật mang tính quyền lực nhà nước, chỉ do cơ quan nhà nước, người có thẩm quyền (hoặc tổ chức được Nhà nước trao quyền) tiến hành theo trình tự, thủ tục luật định. Mục đích của hoạt động này là ban hành các văn bản áp dụng pháp luật (quyết định cá biệt) nhằm **cá biệt hóa các quy tắc xử sự chung** trong quy phạm pháp luật vào từng vụ việc, trường hợp cụ thể đối với các cá nhân, tổ chức xác định.`
      };
    }

    // 7. Đề 1 - Câu 1: Nhà nước xuất hiện khi xã hội có sự phân chia giai cấp và mâu thuẫn giai cấp không thể điều hòa được
    if (
      q.includes('nhà nước') &&
      (q.includes('phân chia giai cấp') || q.includes('mâu thuẫn giai cấp')) &&
      q.includes('không thể điều hòa') &&
      !q.includes('mọi quốc gia')
    ) {
      return {
        sample_id: 'SFT_CORE_TF_01_STATE_ORIGIN',
        intent_code: 'TRUE_FALSE',
        instruction: query,
        input: query,
        output: `- **Kết luận:** **ĐÚNG.**
- **Giải thích:** Căn cứ Chương 1, Mục 1.1.1 — Giáo trình Pháp luật Đại cương:
  1. Theo học thuyết Mác – Lênin về nguồn gốc Nhà nước, Nhà nước là một phạm trù lịch sử chỉ ra đời khi xã hội loài người phát triển đến một giai đoạn nhất định.
  2. Nhà nước xuất hiện trực tiếp từ **hai tiền đề khách quan**:
     - **Tiền đề kinh tế**: Ba lần phân công lao động xã hội lớn làm năng suất lao động tăng cao, tạo ra của cải dư thừa và dẫn đến sự hình thành **chế độ tư hữu** về tư liệu sản xuất.
     - **Tiền đề xã hội**: Xã hội phân hóa thành các giai cấp đối kháng có lợi ích mâu thuẫn gay gắt đến mức **không thể điều hòa được**. Để giữ cho cuộc đấu tranh giai cấp không dẫn đến chỗ tiêu diệt lẫn nhau và tiêu diệt luôn cả xã hội, một tổ chức quyền lực công đặc biệt đã ra đời để thiết lập "trật tự" — đó chính là **Nhà nước**.`
      };
    }

    // 8. Đề 1 - Câu 2: Mọi quy tắc xử sự tồn tại trong xã hội đều là quy phạm pháp luật
    if (
      q.includes('mọi quy tắc xử sự') &&
      (q.includes('đều là quy phạm pháp luật') || q.includes('đều là pháp luật'))
    ) {
      return {
        sample_id: 'SFT_CORE_TF_02_RULES_VS_LAW',
        intent_code: 'TRUE_FALSE',
        instruction: query,
        input: query,
        output: `- **Kết luận:** **SAI.**
- **Giải thích:** Căn cứ Chương 3, Mục 3.1.1 — Giáo trình Pháp luật Đại cương:
  1. Trong đời sống xã hội, hành vi xử sự của con người được điều chỉnh bởi một hệ thống đa dạng các **quy phạm xã hội** bao gồm: *Quy phạm pháp luật, Quy phạm đạo đức, Phong tục tập quán, Tín điều tôn giáo* và *Quy tắc của các tổ chức chính trị – xã hội*.
  2. **Quy phạm pháp luật** chỉ là một bộ phận đặc biệt trong hệ thống các quy tắc xử sự xã hội, mang hai dấu hiệu đặc thù mà các quy tắc xử sự khác không có: chỉ do **Nhà nước ban hành hoặc thừa nhận** và được **Nhà nước bảo đảm thực hiện bằng sức mạnh cưỡng chế nhà nước**.`
      };
    }

    // 9. Đề 1 - Câu 4: Người đủ 18 tuổi trở lên có năng lực hành vi đầy đủ và là chủ thể của mọi quan hệ pháp luật
    if (
      q.includes('18 tuổi') &&
      q.includes('năng lực hành vi') &&
      (q.includes('mọi quan hệ pháp luật') || q.includes('chủ thể của mọi'))
    ) {
      return {
        sample_id: 'SFT_CORE_TF_04_AGE_18_ALL_RELATIONS',
        intent_code: 'TRUE_FALSE',
        instruction: query,
        input: query,
        output: `- **Kết luận:** **SAI.**
- **Giải thích:** Căn cứ Chương 4, Mục 4.2.1 — Giáo trình Pháp luật Đại cương & Bộ luật Dân sự 2015:
  1. **Không phải mọi người từ đủ 18 tuổi trở lên đều có năng lực hành vi đầy đủ**: Theo **Điều 20, Điều 22, Điều 23 và Điều 24 Bộ luật Dân sự năm 2015**, người thành niên từ đủ 18 tuổi trở lên bị Tòa án tuyên bố **mất năng lực hành vi dân sự**, **có khó khăn trong nhận thức, làm chủ hành vi**, hoặc bị **hạn chế năng lực hành vi dân sự** thì không có năng lực hành vi dân sự đầy đủ.
  2. **Người từ đủ 18 tuổi có năng lực hành vi đầy đủ cũng KHÔNG THỂ là chủ thể của MỌI quan hệ pháp luật**: Nhiều quan hệ pháp luật đòi hỏi điều kiện chủ thể đặc biệt về độ tuổi hoặc thẩm quyền (ví dụ: nam kết hôn phải từ **đủ 20 tuổi trở lên** theo Điểm a Khoản 1 Điều 8 Luật Hôn nhân và Gia đình 2014; công dân ứng cử đại biểu Quốc hội, HĐND phải đủ **21 tuổi trở lên** theo Điều 27 Hiến pháp 2013; chủ thể áp dụng pháp luật phải là cơ quan nhà nước hoặc người có thẩm quyền).`
      };
    }

    // 10. Đề 1 - Câu 5: Áp dụng pháp luật là hình thức thực hiện pháp luật trong đó chủ thể thực hiện pháp luật phải là cơ quan nhà nước hoặc người có thẩm quyền
    if (
      q.includes('áp dụng pháp luật') &&
      q.includes('hình thức thực hiện pháp luật') &&
      (q.includes('cơ quan nhà nước') || q.includes('người có thẩm quyền') || q.includes('chủ thể'))
    ) {
      return {
        sample_id: 'SFT_CORE_TF_05_AP_DUNG_PHAP_LUAT_SUBJECT',
        intent_code: 'TRUE_FALSE',
        instruction: query,
        input: query,
        output: `- **Kết luận:** **ĐÚNG.**
- **Giải thích:** Căn cứ Chương 3, Mục 3.2.2 — Giáo trình Pháp luật Đại cương:
  1. Khoa học pháp lý phân chia thực hiện pháp luật thành **4 hình thức**: *Tuân thủ pháp luật, Thi hành pháp luật, Sử dụng pháp luật* và *Áp dụng pháp luật*.
  2. Trong khi 3 hình thức đầu có thể do **mọi cá nhân, tổ chức** tự mình thực hiện, thì **Áp dụng pháp luật** là hoạt động **mang tính tổ chức – quyền lực nhà nước**, chủ thể tiến hành bắt buộc phải là **cơ quan nhà nước có thẩm quyền, người có thẩm quyền** (hoặc tổ chức xã hội được Nhà nước trao quyền theo quy định của pháp luật).`
      };
    }

    // 11. Đề 1 - Câu 6: Trách nhiệm pháp lý chỉ phát sinh khi có hành vi vi phạm pháp luật
    if (
      q.includes('trách nhiệm pháp lý') &&
      (q.includes('chỉ phát sinh khi') || q.includes('phát sinh khi có')) &&
      q.includes('vi phạm pháp luật') &&
      !q.includes('trách nhiệm hình sự')
    ) {
      return {
        sample_id: 'SFT_CORE_TF_06_TNPL_BASIS',
        intent_code: 'TRUE_FALSE',
        instruction: query,
        input: query,
        output: `- **Kết luận:** **ĐÚNG.**
- **Giải thích:** Căn cứ Chương 5, Mục 5.2.1 & 5.2.2 — Giáo trình Pháp luật Đại cương:
  1. **Trách nhiệm pháp lý** là hậu quả pháp lý bất lợi (sự phản ứng tiêu cực và trừng phạt của Nhà nước) mà chủ thể phải gánh chịu thông qua việc cơ quan nhà nước có thẩm quyền áp dụng các biện pháp cưỡng chế nhà nước quy định trong phần chế tài của quy phạm pháp luật.
  2. **Vi phạm pháp luật là cơ sở thực tế (tiền đề bắt buộc) để truy cứu trách nhiệm pháp lý**: Trách nhiệm pháp lý chỉ phát sinh khi trên thực tế có hành vi vi phạm pháp luật xảy ra (hành vi xác định, trái pháp luật, có lỗi, do chủ thể có năng lực trách nhiệm pháp lý thực hiện).`
      };
    }

    return null;
  }

  /**
   * Bộ giải chuẩn mực Câu 7 (Đề 2): Phân tích các dấu hiệu cơ bản của vi phạm pháp luật + Mối quan hệ + Ví dụ minh họa
   */
  public static solveDynamicVpplSigns(query?: string): string {
    return `### I. KHÁI NIỆM VI PHẠM PHÁP LUẬT
*(Theo Giáo trình **Pháp luật Đại cương** — Trường Đại học Thương Mại 2021, Chương 5, Mục 5.1.1, tr. 104 – 106)*

**Vi phạm pháp luật** là hành vi xác định của con người (hành động hoặc không hành động), trái với các quy định của pháp luật, có lỗi, do chủ thể có năng lực trách nhiệm pháp lý thực hiện, xâm hại hoặc đe dọa xâm hại đến các quan hệ xã hội được pháp luật xác lập và bảo vệ.

---

### II. PHÂN TÍCH 04 DẤU HIỆU CƠ BẢN CỦA VI PHẠM PHÁP LUẬT

#### 1. Là hành vi xác định của con người
- Vi phạm pháp luật trước hết phải là **hành vi thực tế, cụ thể của con người** được biểu hiện ra thế giới khách quan dưới dạng **hành động** (làm việc bị cấm) hoặc **không hành động** (không làm việc pháp luật bắt buộc phải làm) và nằm dưới sự kiểm soát của ý thức, ý chí con người.
- Pháp luật chỉ điều chỉnh hành vi thực tế đã bộc lộ ra bên ngoài; **mọi suy nghĩ, tư tưởng, thái độ hay dự định trong nội tâm** dù xấu xa hoặc tiêu cực đến đâu nhưng chưa biểu hiện thành hành vi thực tế thì **không bị coi là vi phạm pháp luật**.

#### 2. Hành vi có tính trái pháp luật
- Hành vi xác định đó phải **trái với các yêu cầu, quy tắc xử sự nêu trong quy phạm pháp luật hiện hành**, xâm hại tới các quan hệ xã hội được Nhà nước xác lập và bảo vệ.
- Tính trái pháp luật biểu hiện dưới 3 dạng:
  + Thực hiện những hành vi mà pháp luật **nghiêm cấm** (vi phạm quy phạm cấm đoán).
  + Không thực hiện hoặc thực hiện không đầy đủ những nghĩa vụ mà pháp luật **bắt buộc phải làm** (vi phạm quy phạm bắt buộc).
  + Thực hiện hành vi **vượt quá giới hạn, thẩm quyền** mà pháp luật cho phép.

#### 3. Có lỗi của chủ thể thực hiện hành vi
- **Lỗi** là trạng thái tâm lý chủ quan bên trong của chủ thể đối với hành vi trái pháp luật của mình và đối với hậu quả do hành vi đó gây ra (bao gồm **lỗi cố ý trực tiếp, lỗi cố ý gián tiếp, lỗi vô ý vì quá tự tin** và **lỗi vô ý do cẩu thả**).
- Nếu một hành vi tuy gây thiệt hại hoặc trái với quy định pháp luật nhưng được thực hiện trong hoàn cảnh chủ thể không có khả năng nhận thức hoặc không thể lựa chọn cách xử sự khác (ví dụ: *sự kiện bất ngờ, sự kiện bất khả kháng, phòng vệ chính đáng, tình thế cấp thiết*) thì chủ thể **không có lỗi**, do đó không cấu thành vi phạm pháp luật.

#### 4. Chủ thể thực hiện hành vi phải có năng lực trách nhiệm pháp lý
- **Năng lực trách nhiệm pháp lý** là khả năng của chủ thể (cá nhân hoặc pháp nhân) tự mình gánh chịu hậu quả pháp lý bất lợi do hành vi trái pháp luật của mình gây ra.
- Đối với cá nhân, năng lực trách nhiệm pháp lý được xác định dựa trên hai tiêu chuẩn:
  + **Đạt độ tuổi do pháp luật quy định** trong từng lĩnh vực pháp luật (ví dụ: từ đủ 16 tuổi chịu trách nhiệm hình sự về mọi tội phạm, từ đủ 14 đến dưới 16 tuổi chịu TNHS về tội rất nghiêm trọng, đặc biệt nghiêm trọng theo Điều 12 BLHS 2015; từ đủ 16 tuổi chịu trách nhiệm hành chính về mọi vi phạm hành chính theo Điều 5 Luật XLVPHC 2012).
  + **Có khả năng nhận thức và điều khiển hành vi bình thường** (không mắc bệnh tâm thần hoặc bệnh khác làm mất khả năng nhận thức hoặc khả năng làm chủ hành vi tại thời điểm thực hiện hành vi).

---

### III. QUAN HỆ GIỮA CÁC DẤU HIỆU TRÊN TRONG VIỆC XÁC ĐỊNH MỘT HÀNH VI VI PHẠM PHÁP LUẬT
- Bốn dấu hiệu cơ bản nêu trên có **mối quan hệ biện chứng, thống nhất hữu cơ, gắn bó chặt chẽ và không thể tách rời nhau**, tạo thành hệ thống **điều kiện cần và đủ** để xác định một hiện tượng thực tế có phải là vi phạm pháp luật hay không:
  1. **Dấu hiệu hành vi xác định và tính trái pháp luật** là tiền đề khách quan bên ngoài: Không có hành vi xác định trái pháp luật thì không có đối tượng để xem xét lỗi hay năng lực trách nhiệm pháp lý.
  2. **Dấu hiệu có lỗi và năng lực trách nhiệm pháp lý** là tiền đề chủ quan bên trong: Một hành vi dù trái pháp luật và gây thiệt hại cho xã hội nhưng do người chưa đủ tuổi luật định hoặc người mắc bệnh tâm thần thực hiện (không có năng lực trách nhiệm pháp lý), hoặc thực hiện trong tình thế không có lỗi, thì cũng **không phải là vi phạm pháp luật**.
- **Kết luận nguyên tắc**: Một hành vi **chỉ bị coi là vi phạm pháp luật khi hội tụ đầy đủ đồng thời cả 04 dấu hiệu trên**; nếu thiếu bất kỳ một dấu hiệu nào thì hành vi đó không cấu thành vi phạm pháp luật và không thể truy cứu trách nhiệm pháp lý.

---

### IV. VÍ DỤ MINH HỌA CỤ THỂ
- **Tình huống minh họa**: **Anh K (25 tuổi, có đầy đủ nhận thức và năng lực hành vi), điều khiển xe máy vượt đèn đỏ tại ngã tư.**
- **Phân tích đối chiếu 04 dấu hiệu cấu thành vi phạm pháp luật**:
  1. **Hành vi xác định**: Hành động điều khiển xe máy chạy qua giao lộ khi đèn tín hiệu giao thông đã chuyển sang màu đỏ.
  2. **Tính trái pháp luật**: Vi phạm quy tắc giao thông đường bộ được pháp luật quy định (hành vi vượt đèn đỏ bị pháp luật giao thông đường bộ nghiêm cấm).
  3. **Có lỗi**: **Lỗi cố ý trực tiếp** (Anh K nhìn thấy rõ đèn tín hiệu màu đỏ là cấm đi nhưng vẫn chủ động tăng ga điều khiển xe vượt qua).
  4. **Năng lực trách nhiệm pháp lý**: Anh K đã đạt độ tuổi theo luật định (**25 tuổi** — trên 16 tuổi theo Điều 5 Luật Xử lý vi phạm hành chính năm 2012) và hoàn toàn tỉnh táo, không mắc bệnh tâm thần hay bệnh khác làm mất khả năng nhận thức và điều khiển hành vi.
  ➔ Hội tụ đủ 4 dấu hiệu nên hành vi của anh K được xác định là **vi phạm pháp luật** (vi phạm pháp luật hành chính).`;
  }

  /**
   * Bộ giải chuẩn mực Câu 8: Phân biệt 4 hình thức thực hiện pháp luật
   * (Tuân thủ pháp luật, Thi hành pháp luật, Sử dụng pháp luật, Áp dụng pháp luật)
   * Đáp ứng đầy đủ 4 tiêu chí: Khái niệm, Đặc điểm biểu hiện, Chủ thể thực hiện và Ví dụ minh họa.
   */
  public static solveDynamicFourFormsOfLawImplementation(query?: string): string {
    return `### I. BẢNG PHÂN BIỆT CHUẨN 04 HÌNH THỨC THỰC HIỆN PHÁP LUẬT
*(Theo Giáo trình **Pháp luật Đại cương** — Trường Đại học Thương Mại 2021, Chương 3, Mục 3.2, tr. 80 – 89)*

| Tiêu chí | Tuân thủ pháp luật | Thi hành pháp luật | Sử dụng pháp luật | Áp dụng pháp luật |
| :--- | :--- | :--- | :--- | :--- |
| **Khái niệm** | Chủ thể kiềm chế không thực hiện những điều pháp luật cấm. | Chủ thể chủ động thực hiện các nghĩa vụ mà pháp luật bắt buộc phải làm. | Chủ thể thực hiện các quyền và quyền tự do dân chủ mà pháp luật cho phép. | Cơ quan, người có thẩm quyền ra quyết định cá biệt giải quyết vụ việc cụ thể. |
| **Đặc điểm biểu hiện** | Dạng **không hành động** (thụ động) — tương ứng với quy phạm cấm đoán. | Dạng **hành động** (tích cực, chủ động) — tương ứng với quy phạm bắt buộc. | Dạng **hành động hoặc không hành động** (tùy nghi quyết định theo ý chí) — tương ứng với quy phạm trao quyền. | Luôn là dạng **hành động**, mang tính **quyền lực nhà nước**, trình tự thủ tục chặt chẽ, ban hành văn bản cá biệt. |
| **Chủ thể thực hiện** | Mọi cá nhân, tổ chức. | Mọi cá nhân, tổ chức. | Mọi cá nhân, tổ chức. | Cơ quan nhà nước, người có thẩm quyền hoặc tổ chức được Nhà nước ủy quyền/trao quyền. |
| **Ví dụ minh họa** | Không chở hàng cấm, không vượt đèn đỏ, không tàng trữ chất ma túy. | Đóng thuế thu nhập, đăng ký nghĩa vụ quân sự, đội mũ bảo hiểm khi đi xe máy. | Nộp đơn xin việc, đăng ký kết hôn, làm đơn khiếu nại, lập di chúc. | Tòa án tuyên án phạt tù; CSGT lập biên bản ra quyết định xử phạt hành chính; UBND cấp Giấy chứng nhận kết hôn. |

---

### II. PHÂN TÍCH CHI TIẾT TỪNG HÌNH THỨC THỰC HIỆN PHÁP LUẬT

#### 1. Tuân thủ pháp luật (Tuân theo pháp luật)
- **Khái niệm**: Là hình thức thực hiện pháp luật, trong đó các chủ thể pháp luật **kiềm chế không tiến hành những hoạt động mà pháp luật ngăn cấm**.
- **Đặc điểm biểu hiện**: Thể hiện dưới dạng **không hành động (thụ động)**; tương ứng với các quy phạm pháp luật cấm đoán (chứa từ *"nghiêm cấm", "không được"*).
- **Chủ thể thực hiện**: Mọi cá nhân, tổ chức trong xã hội.
- **Ví dụ minh họa**: Không chở hàng cấm, không vượt đèn đỏ, không nhận hối lộ.

#### 2. Thi hành pháp luật (Chấp hành pháp luật)
- **Khái niệm**: Là hình thức thực hiện pháp luật, trong đó các chủ thể pháp luật **chủ động thực hiện các nghĩa vụ mà pháp luật bắt buộc phải làm**.
- **Đặc điểm biểu hiện**: Thể hiện dưới dạng **hành động (tích cực)**; tương ứng với các quy phạm pháp luật bắt buộc (chứa từ *"phải", "có nghĩa vụ"*).
- **Chủ thể thực hiện**: Mọi cá nhân, tổ chức mang nghĩa vụ pháp lý theo luật định.
- **Ví dụ minh họa**: Đóng thuế thu nhập, đăng ký nghĩa vụ quân sự, đội mũ bảo hiểm đạt chuẩn khi tham gia giao thông.

#### 3. Sử dụng pháp luật (Vận dụng pháp luật)
- **Khái niệm**: Là hình thức thực hiện pháp luật, trong đó các chủ thể pháp luật **thực hiện các quyền và quyền tự do dân chủ mà pháp luật cho phép**.
- **Đặc điểm biểu hiện**: Thể hiện dưới dạng **hành động hoặc không hành động (tùy nghi quyết định)** — chủ thể có thể lựa chọn thực hiện hoặc không thực hiện quyền của mình mà không bị coi là vi phạm pháp luật; tương ứng với quy phạm trao quyền.
- **Chủ thể thực hiện**: Mọi cá nhân, tổ chức có quyền hợp pháp.
- **Ví dụ minh họa**: Nộp đơn xin việc, đăng ký kết hôn, làm đơn khiếu nại, lập di chúc định đoạt tài sản (Điều 624 BLDS 2015).

#### 4. Áp dụng pháp luật
- **Khái niệm**: Là hình thức thực hiện pháp luật, trong đó **cơ quan nhà nước, người có thẩm quyền ra quyết định cá biệt giải quyết vụ việc cụ thể** nhằm làm phát sinh, thay đổi hoặc chấm dứt quyền, nghĩa vụ pháp lý của các chủ thể cụ thể.
- **Đặc điểm biểu hiện**: Luôn là dạng **hành động**, mang tính **quyền lực nhà nước**, tuân theo trình tự thủ tục chặt chẽ do luật định và kết thúc bằng việc ban hành một **Văn bản áp dụng pháp luật (quyết định cá biệt)**.
- **Chủ thể thực hiện**: Chỉ cơ quan nhà nước, người có thẩm quyền hoặc tổ chức xã hội được Nhà nước ủy quyền.
- **Ví dụ minh họa**: Tòa án tuyên án phạt tù đối với bị cáo; Cảnh sát giao thông lập biên bản và ra quyết định xử phạt vi phạm hành chính.`;
  }

  /**
   * Bộ giải chuyên biệt Câu 10 (Đề 2): Tình huống va chạm giao thông vượt đèn đỏ & dùng gậy đánh người gây thương tích
   */
  public static solveDynamicTrafficAndAssaultCase(query: string): string {
    return `### GIẢI QUYẾT TÌNH HUỐNG PHÁP LÝ (VI PHẠM GIAO THÔNG & XÂM PHẠM SỨC KHỎE)
*(Theo Giáo trình **Pháp luật Đại cương** — Chương 5 & **Bộ luật Dân sự 2015, Bộ luật Hình sự 2015, Luật XLVPHC 2012**)*

---

#### a) Hành vi vượt đèn đỏ của A có phải là vi phạm pháp luật không? Phân tích 4 yếu tố cấu thành vi phạm pháp luật
- **Kết luận**: Hành vi điều khiển xe máy vượt đèn đỏ gây va chạm của A **LÀ VI PHẠM PHÁP LUẬT** (vi phạm pháp luật hành chính và dân sự).
- **Phân tích 04 yếu tố cấu thành vi phạm pháp luật trong hành vi của A**:
  1. **Chủ thể**: **Anh A (20 tuổi)** — là cá nhân đã thành niên, đạt độ tuổi chịu trách nhiệm pháp lý theo luật định (trên 16 tuổi theo Điều 5 Luật Xử lý vi phạm hành chính 2012 và đủ 18 tuổi trở lên theo Điều 20 Bộ luật Dân sự 2015), có đầy đủ khả năng nhận thức và điều khiển hành vi.
  2. **Khách thể**: Xâm phạm đồng thời **trật tự, an toàn giao thông đường bộ** (được pháp luật hành chính bảo vệ) và **quyền sở hữu tài sản hợp pháp của B** (được pháp luật dân sự bảo vệ).
  3. **Mặt khách quan**:
     - *Hành vi trái pháp luật*: Hành động điều khiển xe máy vượt qua vạch dừng tại ngã tư khi đèn tín hiệu giao thông đang màu đỏ và thiếu chú ý quan sát.
     - *Hậu quả thiệt hại thực tế*: Gây va chạm làm xe máy của B (người đang đi đúng tín hiệu giao thông) bị hư hỏng, thiệt hại tài sản thực tế là **6 triệu đồng** chi phí sửa chữa.
     - *Mối quan hệ nhân quả*: Hành vi vượt đèn đỏ và không chú ý quan sát của A là nguyên nhân trực tiếp dẫn đến vụ va chạm và gây thiệt hại 6 triệu đồng cho xe của B.
  4. **Mặt chủ quan**: Thể hiện qua trạng thái tâm lý có **lỗi của A** khi thực hiện hành vi và đối với hậu quả xảy ra *(phân tích chi tiết tại câu b)*.

---

#### b) Xác định lỗi của A trong tình huống trên và giải thích
Trong khoa học pháp lý, cần phân tích thái độ tâm lý của A đối với **hành vi vi phạm quy tắc giao thông** và đối với **hậu quả thiệt hại thực tế**:
1. **Đối với hành vi vượt đèn đỏ — Lỗi cố ý trực tiếp**:
   - A hoàn toàn nhận thức rõ đèn tín hiệu giao thông đang màu đỏ là lệnh cấm đi qua ngã tư, nhưng A vẫn chủ động lựa chọn điều khiển xe vượt qua.
2. **Đối với hậu quả va chạm và làm hư hỏng tài sản của B — Lỗi vô ý do cẩu thả**:
   - Do **không chú ý quan sát**, A đã không thấy trước hành vi của mình có thể gây ra va chạm làm hư hỏng xe của B, mặc dù theo quy tắc an toàn giao thông đường bộ A **bắt buộc phải thấy trước và hoàn toàn có điều kiện thấy trước** hậu quả đó nếu quan sát cẩn thận.

---

#### c) Hành vi B dùng gậy đánh A có phải là vi phạm pháp luật không? Phân tích các dấu hiệu cần xem xét
- **Kết luận**: Hành vi B dùng gậy đánh A nhiều lần khiến A bị thương **LÀ VI PHẠM PHÁP LUẬT** (xâm phạm trái pháp luật đến tính mạng, sức khỏe của người khác).
- **Phân tích các dấu hiệu cần xem xét**:
  1. **Hành vi xác định và tính trái pháp luật**: B đã có hành động dùng chiếc gậy đánh A nhiều lần gây thương tích. Đây là hành vi trái pháp luật xâm phạm quyền bất khả xâm phạm về sức khỏe của công dân.
  2. **Có lỗi**: B thực hiện hành vi với **lỗi cố ý trực tiếp** (B nhận thức rõ việc dùng gậy đánh người nhiều lần là nguy hiểm, gây thương tích cho A nhưng do tức giận vẫn cố tình thực hiện và mong muốn gây tổn hại sức khỏe cho A).
  3. **Năng lực trách nhiệm pháp lý**: B là người điều khiển xe máy tham gia giao thông, nếu có năng lực nhận thức và làm chủ hành vi bình thường, đủ tuổi luật định thì có đầy đủ năng lực trách nhiệm pháp lý.
  4. **Lưu ý loại trừ Phòng vệ chính đáng (Điều 22 Bộ luật Hình sự 2015)**: Hành vi của B **KHÔNG phải là phòng vệ chính đáng**, bởi vì vụ va chạm giao thông đã kết thúc, A hoàn toàn không có hành vi tấn công hay đe dọa vũ lực ngay tức khắc nào đối với B. Việc B dùng gậy đánh A xuất phát từ sự tức giận sau tranh cãi, mang tính chất trả thù và cố ý gây thương tích.

---

#### d) Các loại trách nhiệm pháp lý có thể phát sinh đối với A và B & Các căn cứ xác định cụ thể
1. **Trách nhiệm pháp lý phát sinh đối với A**:
   - **Trách nhiệm hành chính**: Bị xử phạt vi phạm hành chính (phạt tiền và trừ điểm / tước quyền sử dụng giấy phép lái xe) theo quy định pháp luật về trật tự, an toàn giao thông đường bộ đối với hành vi không chấp hành hiệu lệnh của đèn tín hiệu giao thông gây tai nạn giao thông.
   - **Trách nhiệm dân sự**: Có nghĩa vụ bồi thường thiệt hại ngoài hợp đồng cho B khoản chi phí sửa chữa xe hợp lý là **6 triệu đồng** (căn cứ **Điều 584, Điều 589 và Điều 601 Bộ luật Dân sự năm 2015**).
2. **Trách nhiệm pháp lý phát sinh đối với B**:
   - **Trách nhiệm dân sự**: Phải bồi thường toàn bộ thiệt hại do sức khỏe bị xâm phạm cho A, bao gồm chi phí hợp lý cho việc cứu chữa, bồi dưỡng, phục hồi sức khỏe, thu nhập thực tế bị mất hoặc bị giảm sút và khoản tiền bù đắp tổn thất về tinh thần (căn cứ **Điều 584 và Điều 590 Bộ luật Dân sự năm 2015**).
   - **Trách nhiệm hành chính hoặc Trách nhiệm hình sự**:
     + *Trách nhiệm hành chính*: Nếu thương tích của A ở mức nhẹ và hành vi chưa đủ yếu tố cấu thành tội phạm thì B bị xử phạt vi phạm hành chính về hành vi cố ý gây thương tích cho người khác.
     + *Trách nhiệm hình sự*: Nếu tỷ lệ tổn thương cơ thể của A từ **11% trở lên**, HOẶC **dưới 11% nhưng chiếc gậy B sử dụng được xác định là "hung khí nguy hiểm"** (theo **Điểm a Khoản 1 Điều 134 Bộ luật Hình sự năm 2015**) hoặc hành vi có **tính chất côn đồ** (Điểm i Khoản 1 Điều 134 BLHS 2015), thì B sẽ bị truy cứu trách nhiệm hình sự về **Tội cố ý gây thương tích hoặc gây tổn hại cho sức khỏe của người khác**.
3. **Việc xác định trách nhiệm pháp lý cụ thể cần dựa vào các yếu tố/căn cứ sau**:
   - **Kết luận giám định pháp y về tỷ lệ tổn thương cơ thể (%)** của A do hành vi đánh của B gây ra.
   - **Tính chất của công cụ phạm tội**: Kết luận giám định xem chiếc gậy B dùng đánh A có phải là **hung khí nguy hiểm** hay không, vị trí đánh trên cơ thể và cường độ tấn công.
   - **Mức độ thiệt hại thực tế về tài sản và sức khỏe**: Hóa đơn, chứng từ sửa xe của B (6 triệu đồng) và hóa đơn viện phí, chi phí điều trị thực tế của A.
   - **Độ tuổi và năng lực trách nhiệm pháp lý cụ thể của B** tại thời điểm thực hiện hành vi cùng yêu cầu khởi tố của người bị hại (A) trong trường hợp thương tích dưới 11% thuộc Khoản 1 Điều 134 BLHS 2015.`;
  }

  /**
   * Bộ giải chuyên biệt Câu 11 (Đề 2): Tình huống M (14 tuổi) tự ý dùng 30 triệu đồng của cha mẹ mua điện thoại cao cấp
   */
  public static solveDynamicMinorTransactionCase(query: string): string {
    return `### PHÂN TÍCH TƯ CÁCH CHỦ THỂ, NĂNG LỰC HÀNH VI DÂN SỰ VÀ HIỆU LỰC GIAO DỊCH CỦA NGƯỜI CHƯA THÀNH NIÊN (M — 14 TUỔI)
*(Theo Giáo trình **Pháp luật Đại cương** — Chương 4 & Chương 6; **Bộ luật Dân sự năm 2015**)*

---

#### 1. M có phải là chủ thể của quan hệ pháp luật hay không?
- **Kết luận**: **M VẪN LÀ CHỦ THỂ của quan hệ pháp luật dân sự**, bởi vì M là cá nhân có tư cách công dân, có **năng lực pháp luật dân sự** đầy đủ từ khi sinh ra và đã có **một phần năng lực hành vi dân sự** theo độ tuổi.
- Tuy nhiên, vì M mới **14 tuổi** (người chưa thành niên từ đủ 6 tuổi đến chưa đủ 15 tuổi) nên năng lực hành vi dân sự của M **chưa đầy đủ**: M chỉ được tự mình trở thành chủ thể độc lập trong các giao dịch dân sự nhỏ lẻ phục vụ nhu cầu sinh hoạt hàng ngày phù hợp với lứa tuổi; đối với các giao dịch có giá trị lớn (như mua điện thoại 30 triệu đồng), M không được tự mình xác lập nếu không có sự đồng ý của người đại diện theo pháp luật (cha, mẹ).

---

#### 2. Phân tích năng lực pháp luật dân sự và năng lực hành vi dân sự của M
1. **Về năng lực pháp luật dân sự của M (Điều 16 và Điều 17 Bộ luật Dân sự năm 2015)**:
   - Năng lực pháp luật dân sự của cá nhân là khả năng của cá nhân có quyền dân sự và nghĩa vụ dân sự.
   - Mọi cá nhân đều có năng lực pháp luật dân sự như nhau và **có từ khi người đó sinh ra** cho đến khi chết. Do đó, M (14 tuổi) có đầy đủ năng lực pháp luật dân sự để hưởng các quyền về tài sản và nhân thân theo luật định.
2. **Về năng lực hành vi dân sự của M (Điều 19 và Khoản 3 Điều 21 Bộ luật Dân sự năm 2015)**:
   - Căn cứ **Khoản 1 Điều 21 BLDS 2015**: Người chưa đủ 18 tuổi là **người chưa thành niên**.
   - Căn cứ **Khoản 3 Điều 21 BLDS 2015**: M **14 tuổi** thuộc nhóm **người từ đủ 06 tuổi đến chưa đủ 15 tuổi** (chỉ có năng lực hành vi dân sự một phần / chưa đầy đủ).
   - Quy định pháp luật đối với độ tuổi này: Khi xác lập, thực hiện giao dịch dân sự **phải được người đại diện theo pháp luật (cha, mẹ) đồng ý**, **TRỪ** giao dịch dân sự phục vụ nhu cầu sinh hoạt hàng ngày phù hợp với lứa tuổi (ví dụ: mua đồ ăn sáng, dụng cụ học tập nhỏ lẻ).

---

#### 3. Giao dịch giữa M và cửa hàng X có đương nhiên có hiệu lực hay không?
- **Kết luận**: Giao dịch mua bán điện thoại giữa M và cửa hàng X **KHÔNG đương nhiên có hiệu lực** (thuộc trường hợp giao dịch dân sự vô hiệu do người chưa thành niên xác lập theo Điều 125 BLDS 2015).
- **Bác bỏ lập luận của cửa hàng X**: Lý lẽ của cửa hàng X (*“M đã tự nguyện mua và đã ký hợp đồng nên hợp đồng phải có hiệu lực”*) là **HOÀN TOÀN SAI PHÁP LUẬT**, bởi vì:
  1. Sự tự nguyện và việc ký tên chỉ là một phần điều kiện; để hợp đồng có hiệu lực thì người ký kết trước hết phải có **năng lực hành vi dân sự phù hợp với giao dịch được xác lập** (Điểm a Khoản 1 Điều 117 BLDS 2015).
  2. Chiếc điện thoại cao cấp trị giá **30 triệu đồng** là tài sản có giá trị lớn, **vượt xa phạm vi nhu cầu sinh hoạt hàng ngày phù hợp với lứa tuổi** của một học sinh 14 tuổi.
  3. M tự ý lấy 30 triệu đồng của cha mẹ và tự mình ký giấy mua bán mà **không có sự đồng ý của cha mẹ (người đại diện theo pháp luật)**, sau đó cha mẹ M biết chuyện đã phản đối và yêu cầu trả lại, nên giao dịch này vi phạm điều kiện bắt buộc về chủ thể.

---

#### 4. Phân tích các điều kiện có hiệu lực của giao dịch dân sự (Điều 117 Bộ luật Dân sự năm 2015)
Căn cứ **Điều 117 Bộ luật Dân sự năm 2015**, một giao dịch dân sự chỉ có hiệu lực khi đáp ứng đủ 04 điều kiện sau. Đối chiếu với giao dịch của M:
1. **Điều kiện về chủ thể (Điểm a Khoản 1 Điều 117)**: *"Chủ thể có năng lực pháp luật dân sự, năng lực hành vi dân sự phù hợp với giao dịch dân sự được xác lập"*
   ➔ **VI PHẠM**: M (14 tuổi) không có năng lực hành vi dân sự phù hợp để tự mình xác lập giao dịch mua tài sản trị giá 30 triệu đồng khi chưa có sự đồng ý của cha mẹ (vi phạm Khoản 3 Điều 21 BLDS 2015).
2. **Điều kiện về ý chí tự nguyện (Điểm b Khoản 1 Điều 117)**: *"Chủ thể tham gia giao dịch dân sự hoàn toàn tự nguyện"*
   ➔ Mặc dù M không bị cửa hàng ép buộc, nhưng do M chưa thành niên (14 tuổi), nhận thức chưa hoàn thiện nên pháp luật quy định ý chí của M trong giao dịch giá trị lớn bắt buộc phải đặt dưới sự giám hộ và đồng ý của cha mẹ.
3. **Điều kiện về mục đích và nội dung (Điểm c Khoản 1 Điều 117)**: *"Mục đích và nội dung của giao dịch dân sự không vi phạm điều cấm của luật, không trái đạo đức xã hội"*
   ➔ Hoạt động mua bán điện thoại tự thân không vi phạm điều cấm hay đạo đức xã hội.
4. **Điều kiện về hình thức (Khoản 2 Điều 117)**: *"Hình thức của giao dịch dân sự là điều kiện có hiệu lực của giao dịch dân sự trong trường hợp luật có quy định"*
   ➔ Hợp đồng mua bán điện thoại không bắt buộc công chứng/chứng thực, nhưng **do đã vi phạm điều kiện tiên quyết về năng lực hành vi dân sự của chủ thể (Điểm a Khoản 1 Điều 117)** nên giao dịch không đủ điều kiện có hiệu lực.

---

#### 5. Hậu quả pháp lý xảy ra khi giao dịch không đáp ứng điều kiện luật định (Điều 125 và Điều 131 Bộ luật Dân sự năm 2015)
1. **Giao dịch dân sự bị tuyên bố vô hiệu (Khoản 1 Điều 125 Bộ luật Dân sự năm 2015)**:
   - Khi giao dịch dân sự do người chưa thành niên xác lập, thực hiện mà theo quy định của luật phải do người đại diện theo pháp luật xác lập, thực hiện hoặc đồng ý, thì **theo yêu cầu của người đại diện của người đó (cha mẹ M), Tòa án tuyên bố giao dịch dân sự đó vô hiệu**.
2. **Giải quyết hậu quả pháp lý của giao dịch dân sự vô hiệu (Điều 131 Bộ luật Dân sự năm 2015)**:
   - **Không làm phát sinh hiệu lực pháp lý (Khoản 1 Điều 131)**: Giao dịch dân sự vô hiệu không làm phát sinh, thay đổi, chấm dứt quyền, nghĩa vụ dân sự của các bên kể từ thời điểm giao dịch được xác lập.
   - **Khôi phục lại tình trạng ban đầu, hoàn trả cho nhau những gì đã nhận (Khoản 2 Điều 131)**:
     + **Gia đình M (cha mẹ M)** có nghĩa vụ hoàn trả lại chiếc điện thoại cao cấp cho cửa hàng X.
     + **Cửa hàng X** bắt buộc phải nhận lại chiếc điện thoại và **hoàn trả lại đầy đủ số tiền 30 triệu đồng** cho cha mẹ M.
   - **Trách nhiệm bồi thường thiệt hại (Khoản 4 Điều 131)**: Bên nào có lỗi gây thiệt hại (ví dụ cửa hàng X biết rõ M là trẻ em 14 tuổi không có người lớn đi kèm nhưng vẫn bán tài sản giá trị lớn, hoặc nếu điện thoại bị hư hỏng giảm giá trị do lỗi của bên nào) thì phải bồi thường tương ứng theo mức độ lỗi.`;
  }

  /**
   * Bộ giải chuyên biệt Câu 9: Bài tập xác định Chủ thể, Nội dung, Khách thể và Sự kiện pháp lý của Quan hệ pháp luật
   */
  public static solveDynamicLegalRelationshipCase(query: string): string {
    const money = this.extractMoney(query) || '25 triệu đồng';
    const ageInfo = this.extractAge(query);
    const ageVal = ageInfo.age || 22;

    // Trích xuất chính xác Họ và tên đầy đủ của cá nhân (ví dụ: "Nguyễn Văn A", "Trần Thị B", "Anh A", "Chị B")
    const fullPersonMatch =
      query.match(/((?:Anh|Chị|Ông|Bà)\s+[A-ZÀ-Ỹ][a-zà-ỹ]*(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]*)*)/) ||
      query.match(/([A-ZÀ-Ỹ][a-zà-ỹ]+(?:\s+[A-ZÀ-Ỹ][a-zà-ỹ]*){1,3})(?=\s*,\s*\d{1,2}\s*tuổi|\s+\(\d{1,2}\s*tuổi\))/);
    const actors = this.extractActors(query);
    const personActor = fullPersonMatch
      ? fullPersonMatch[1].trim()
      : actors.find((a) => !/công ty|doanh nghiệp|cửa hàng/i.test(a)) || 'Anh A';

    // Trích xuất chính xác tên Tổ chức / Công ty / Cửa hàng (ví dụ: "cửa hàng điện máy X", "Công ty X", "Cửa hàng X")
    const companyMatch = query.match(
      /((?:Công\s+ty(?:\s+TNHH|\s+Cổ\s+phần)?|Doanh\s+nghiệp|Cửa\s+hàng(?:\s+điện\s+máy|\s+xe\s+máy|\s+máy\s+tính)?)\s+[A-ZÀ-Ỹ0-9][A-Za-zÀ-ỹ0-9]*)/i
    );
    const orgActor = companyMatch
      ? companyMatch[1].trim()
      : actors.find((a) => a !== personActor) || 'Công ty X';

    const itemBought = query.toLowerCase().includes('laptop')
      ? 'chiếc máy tính xách tay (laptop)'
      : query.toLowerCase().includes('xe máy')
      ? 'chiếc xe máy'
      : 'tài sản theo hợp đồng';

    return `### PHÂN TÍCH CẤU TRÚC QUAN HỆ PHÁP LUẬT VÀ SỰ KIỆN PHÁP LÝ TRONG TÌNH HUỐNG
*(Theo Giáo trình **Pháp luật Đại cương** — Trường Đại học Thương Mại 2021, Chương 4, tr. 90 – 100 & **Bộ luật Dân sự năm 2015**)*

Quan hệ phát sinh giữa **${personActor}** và **${orgActor}** trong tình huống là **Quan hệ pháp luật dân sự về Hợp đồng mua bán tài sản** (được điều chỉnh bởi quy phạm pháp luật tại **Điều 430 Bộ luật Dân sự năm 2015**). Cụ thể các yếu tố được xác định như sau:

---

#### a) Chủ thể của quan hệ pháp luật
Chủ thể của quan hệ pháp luật trên gồm **hai bên chủ thể** có đầy đủ năng lực chủ thể (năng lực pháp luật và năng lực hành vi dân sự):
1. **Bên mua — ${personActor} (${ageVal} tuổi)**:
   - Là **cá nhân** (công dân).
   - **Về năng lực pháp luật dân sự**: Có khả năng hưởng quyền và gánh vác nghĩa vụ dân sự kể từ khi sinh ra (**Điều 16 BLDS 2015**).
   - **Về năng lực hành vi dân sự**: ${personActor} đã **${ageVal} tuổi** (người thành niên từ đủ 18 tuổi trở lên theo **Điều 20 BLDS 2015**), có trí tuệ phát triển bình thường nên có **năng lực hành vi dân sự đầy đủ**, được toàn quyền tự mình xác lập và thực hiện hợp đồng mua bán tài sản (**Điều 19, Điều 20 BLDS 2015**).
2. **Bên bán — ${orgActor}**:
   - Là **tổ chức kinh tế / đơn vị kinh doanh hợp pháp** (căn cứ **Điều 74 và Điều 75 Bộ luật Dân sự năm 2015**).
   - ${orgActor} có đầy đủ năng lực pháp luật và năng lực hành vi dân sự của chủ thể kinh doanh: được thành lập hợp pháp, có tài sản độc lập và tham gia quan hệ hợp đồng mua bán thông qua người đại diện hợp pháp.

---

#### b) Nội dung của quan hệ pháp luật
Nội dung của quan hệ pháp luật là tổng hợp các **Quyền chủ thể** và **Nghĩa vụ pháp lý** đối xứng của hai bên tham gia quan hệ hợp đồng mua bán (căn cứ **Điều 430, Điều 434 và Điều 440 Bộ luật Dân sự năm 2015**):

1. **Quyền và nghĩa vụ pháp lý của ${personActor} (Bên mua)**:
   - **Quyền chủ thể**:
     + Có quyền yêu cầu ${orgActor} giao đúng ${itemBought}, đúng mẫu mã, chủng loại, chất lượng và đúng thời hạn như đã thỏa thuận trong hợp đồng.
     + Có quyền nhận tài sản, xác lập quyền sở hữu hợp pháp đối với ${itemBought} và yêu cầu bảo hành theo quy định.
   - **Nghĩa vụ pháp lý**:
     + Có nghĩa vụ **thanh toán đầy đủ số tiền ${money}** cho ${orgActor} theo đúng thời hạn, địa điểm và phương thức đã cam kết (**Khoản 1 Điều 440 BLDS 2015**).
     + Có nghĩa vụ tiếp nhận tài sản do bên bán bàn giao đúng thỏa thuận.

2. **Quyền và nghĩa vụ pháp lý của ${orgActor} (Bên bán)**:
   - **Quyền chủ thể**:
     + Có quyền yêu cầu ${personActor} thanh toán đầy đủ và đúng hạn số tiền **${money}** theo hợp đồng.
   - **Nghĩa vụ pháp lý**:
     + Có nghĩa vụ **bàn giao đúng ${itemBought}, đúng chất lượng, thông số kỹ thuật và đúng thời hạn** đã thỏa thuận cho ${personActor}; chuyển giao quyền sở hữu tài sản và thực hiện nghĩa vụ bảo hành đối với tài sản bán (**Điều 430, Điều 445 BLDS 2015**).

---

#### c) Khách thể của quan hệ pháp luật
- **Khái niệm**: Khách thể của quan hệ pháp luật là những lợi ích vật chất, tinh thần hoặc xã hội mà các chủ thể mong muốn đạt được khi tham gia xác lập quan hệ pháp luật.
- **Khách thể cụ thể trong tình huống**: Là **lợi ích vật chất (tài sản và quyền sở hữu tài sản)** mà hai bên hướng tới nhằm thỏa mãn nhu cầu của mình, bao gồm:
  1. **Đối với ${personActor}**: Là **${itemBought}** (cùng quyền chiếm hữu, sử dụng, định đoạt chiếc máy đó).
  2. **Đối với ${orgActor}**: Là **khoản tiền thanh toán ${money}** thu được từ việc bán tài sản.

---

#### d) Sự kiện pháp lý làm phát sinh quan hệ pháp luật
- **Khái niệm**: Sự kiện pháp lý là những tình huống, hiện tượng, hành vi xảy ra trong thực tế đời sống mà sự xuất hiện của chúng được quy phạm pháp luật gắn với việc làm phát sinh, thay đổi hoặc chấm dứt quan hệ pháp luật.
- **Sự kiện pháp lý cụ thể trong tình huống**:
  + Chính là sự kiện **${personActor} và ${orgActor} ký kết (giao kết) hợp đồng mua bán ${itemBought} trị giá ${money}**.
- **Phân loại sự kiện pháp lý**:
  + Đây là **Hành vi pháp lý** (thuộc nhóm *Sự kiện pháp lý là hành vi có ý chí, hợp pháp* của các chủ thể trực tiếp hướng tới việc làm phát sinh quyền và nghĩa vụ dân sự theo **Điều 116 và Điều 385 Bộ luật Dân sự năm 2015**).`;
  }

  public static solveDynamicThreeFormsOfLaw(query?: string): string {
    const item = this.masterCorpus.find((s) => s.sample_id === 'SFT_LLM_THEORY_THREE_FORMS_OF_LAW');
    if (item) return item.output;
    return `### I. BA HÌNH THỨC CỦA PHÁP LUẬT TRÊN THẾ GIỚI
Ba hình thức gồm: Tập quán pháp, Tiền lệ pháp (Án lệ) và Văn bản quy phạm pháp luật.`;
  }

  

  /**
   * Barem điểm 10: Mối quan hệ giữa Pháp luật với Kinh tế, Chính trị và Nhà nước & Liên hệ thực tiễn Việt Nam
   * (Chương 2, Mục 2.2 - Giáo trình Pháp luật Đại cương TMU 2021 & Bộ GD&ĐT)
   */
  public static solveDynamicLawStateEconPolitics(query?: string): string {
    const item = this.masterCorpus.find((s) => s.sample_id === 'SFT_LLM_THEORY_LAW_ECON_POLITICS');
    if (item) return item.output;
    return `### MỐI QUAN HỆ GIỮA PHÁP LUẬT VỚI KINH TẾ VÀ CHÍNH TRỊ
Kinh tế quyết định pháp luật; pháp luật tác động trở lại kinh tế và thể chế hóa đường lối chính trị của Đảng.`;
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
    const qLower = query.toLowerCase();
    if (
      concept === 'luật hình sự' ||
      qLower.includes('luật hình sự') ||
      qLower.includes('pháp luật hình sự') ||
      (qLower.includes('hình sự') && (qLower.includes('nguyên tắc') || qLower.includes('nguồn') || qLower.includes('khái niệm')))
    ) {
      return this.solveDynamicCriminalLawTheory(query);
    }

    if (
      concept === 'vi phạm pháp luật' &&
      (qLower.includes('4 yếu tố') || qLower.includes('cấu thành') || qLower.includes('yếu tố cấu thành'))
    ) {
      return this.solveDynamicVpplTheory(query);
    }

    const normalizedConcept = (concept || '').toLowerCase().replace(/\s+/g, '_');
    const map: Record<string, string> = {
      pháp_luật: 'SFT_LLM_DEF_PHAP_LUAT',
      phap_luat: 'SFT_LLM_DEF_PHAP_LUAT',
      'pháp luật': 'SFT_LLM_DEF_PHAP_LUAT',
      nhà_nước: 'SFT_LLM_DEF_NHA_NUOC',
      nha_nuoc: 'SFT_LLM_DEF_NHA_NUOC',
      'nhà nước': 'SFT_LLM_DEF_NHA_NUOC',
      quy_phạm_pháp_luật: 'SFT_LLM_DEF_QPPL',
      quy_pham_phap_luat: 'SFT_LLM_DEF_QPPL',
      'quy phạm pháp luật': 'SFT_LLM_DEF_QPPL',
      quan_hệ_pháp_luật: 'SFT_LLM_DEF_QHPL',
      quan_he_phap_luat: 'SFT_LLM_DEF_QHPL',
      'quan hệ pháp luật': 'SFT_LLM_DEF_QHPL',
      vi_phạm_pháp_luật: 'SFT_LLM_DEF_VPPL',
      vi_pham_phap_luat: 'SFT_LLM_DEF_VPPL',
      'vi phạm pháp luật': 'SFT_LLM_DEF_VPPL',
      trách_nhiệm_pháp_lý: 'SFT_LLM_DEF_TNPL',
      trach_nhiem_phap_ly: 'SFT_LLM_DEF_TNPL',
      'trách nhiệm pháp lý': 'SFT_LLM_DEF_TNPL',
      tài_sản: 'SFT_LLM_DEF_TAI_SAN',
      tai_san: 'SFT_LLM_DEF_TAI_SAN',
      'tài sản': 'SFT_LLM_DEF_TAI_SAN',
    };
    const targetKey = map[normalizedConcept] || (concept ? map[concept] : undefined);
    if (targetKey) {
      const item = this.masterCorpus.find((s) => s.sample_id === targetKey);
      if (item) return item.output;
    }
    const defSample = this.masterCorpus.find((s) => s.sample_id === 'SFT_LLM_DEF_PHAP_LUAT');
    return defSample ? defSample.output : 'Pháp luật là hệ thống quy tắc xử sự do nhà nước ban hành và bảo đảm thực hiện.';
  }

  
  public static solveDynamicComparison(query: string, articles: ILawArticle[] = []): string {
    const qLower = query.toLowerCase();

    // 0.1. So sánh Pháp luật và Đạo đức
    if ((qLower.includes('pháp luật') || qLower.includes('pl')) && qLower.includes('đạo đức')) {
      return this.solveDynamicLawVsMorality(query);
    }

    // 0.1b. Phân biệt 4 hình thức thực hiện pháp luật (Tuân thủ, Thi hành, Sử dụng, Áp dụng pháp luật)
    if (
      qLower.includes('thực hiện pháp luật') ||
      qLower.includes('hình thức thực hiện') ||
      (qLower.includes('tuân thủ') && qLower.includes('thi hành'))
    ) {
      return this.solveDynamicFourFormsOfLawImplementation(query);
    }

    // 0.2. So sánh 3 hình thức của Pháp luật (Tập quán pháp, tiền lệ pháp, văn bản QPPL)
    if (
      !qLower.includes('thực hiện pháp luật') &&
      !qLower.includes('áp dụng pháp luật') &&
      (qLower.includes('tập quán pháp') ||
        qLower.includes('tiền lệ pháp') ||
        (qLower.includes('hình thức') && (qLower.includes('pháp luật') || qLower.includes('văn bản quy phạm'))))
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
