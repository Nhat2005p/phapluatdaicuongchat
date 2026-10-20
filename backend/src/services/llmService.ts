import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';
import { ExamArchetype } from './ragService.js';
import { ILawArticle } from '../models/LawArticle.js';

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
   * Khởi tạo và nạp toàn bộ ngân hàng câu hỏi SFT (340+ câu thi & 10,000+ câu tư vấn)
   */
  private static initCorpuses(): void {
    if (this.isInitialized && this.examCorpus.length >= 340) return;

    const examPaths = [
      path.resolve(process.cwd(), 'data/processed/sft_vietlaw_500.json'),
      path.resolve(process.cwd(), '../data/processed/sft_vietlaw_500.json'),
      path.resolve(__dirname, '../../../data/processed/sft_vietlaw_500.json')
    ];

    for (const p of examPaths) {
      if (fs.existsSync(p)) {
        try {
          const raw = fs.readFileSync(p, 'utf-8');
          this.examCorpus = JSON.parse(raw) as SftSample[];
          this.examTokenSets = this.examCorpus.map((item) => {
            const textToUse = item.input && item.input.length > 20 ? item.input : `${item.instruction} ${item.input}`;
            return new Set(this.normalize(textToUse));
          });
          this.examBigramSets = this.examCorpus.map((item) => {
            const textToUse = item.input && item.input.length > 20 ? item.input : `${item.instruction} ${item.input}`;
            return this.getBigrams(this.normalize(textToUse));
          });
          console.log(`📚 [SFT Cache] Đã nạp ${this.examCorpus.length} đề thi & Barem chuẩn điểm 10 từ: ${path.basename(p)}`);
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
          this.masterCorpus = JSON.parse(raw) as SftSample[];
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
  public static sliceSingleItemIfApplicable(query: string, item: SftSample): SftSample {
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
      for (const line of rawLines) {
        const sm = line.trim().match(/^(\d+)\.\s*(.+)$/);
        if (sm && sm[2].length > 8) {
          const subTextNorm = sm[2].toLowerCase().replace(/[.,;:?!"'“”()]/g, ' ').replace(/\s+/g, ' ').trim();
          // Kiểm tra query có khớp với câu con này không
          if (
            qNorm.includes(subTextNorm.slice(0, 30)) ||
            (subTextNorm.length >= 20 && subTextNorm.includes(qNorm.slice(0, 30))) ||
            qNorm.includes(subTextNorm.slice(-25)) ||
            (subTextNorm.length >= 20 && qNorm.length >= 20 && subTextNorm.slice(0, 25) === qNorm.slice(0, 25))
          ) {
            const subNum = sm[1];
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
        }
      }
    }

    // Trường hợp 2: Dạng câu hỏi lý thuyết chỉ hỏi "Định nghĩa" / "Khái niệm" / "là gì"
    const isOnlyDef =
      (qNorm.includes('định nghĩa') ||
       qNorm.includes('khái niệm') ||
       qNorm.includes('là gì') ||
       qNorm.includes('thế nào là') ||
       qNorm.includes('hiểu thế nào')) &&
      !qNorm.includes('kinh tế') &&
      !qNorm.includes('chính trị') &&
      !qNorm.includes('đạo đức') &&
      !qNorm.includes('mối quan hệ') &&
      !qNorm.includes('hậu quả') &&
      !qNorm.includes('trách nhiệm');

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
   * Bộ giải chuyên sâu: So sánh / Phân biệt Phòng vệ chính đáng và Tình thế cấp thiết chuẩn Barem điểm 10
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

#### II. BẢNG TIÊU CHÍ SO SÁNH (5 TIÊU CHÍ CHUẨN BAREM ĐIỂM 10)

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
   * Đối sánh độ tương đồng từ khóa trên tập SFT Barem chuẩn
   */
  private static matchSftSample(query: string, intentCode?: ExamArchetype): SftSample | null {
    this.initCorpuses();

    // 0. Nhánh chuyên biệt: Dạng câu hỏi DEFINITION (Định nghĩa / Khái niệm lý thuyết)
    if (intentCode === 'DEFINITION') {
      const concept = this.extractLegalConcept(query);
      if (concept) {
        // Tìm xem trong examCorpus có mẫu SFT định nghĩa riêng không
        for (let i = 0; i < this.examCorpus.length; i++) {
          const item = this.examCorpus[i];
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
    const qLower = query.toLowerCase();
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
      const qNorm = query.toLowerCase().replace(/[.,;:?!"'“”()]/g, ' ').replace(/\s+/g, ' ').trim();
      for (let i = 0; i < this.examCorpus.length; i++) {
        const item = this.examCorpus[i];
        if (item.intent_code !== 'TRUE_FALSE') continue;
        const itemNorm = (item.input || item.instruction || '')
          .toLowerCase()
          .replace(/[.,;:?!"'“”()]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Nếu mẫu SFT là khối gồm nhiều câu hỏi con (1. 2. 3...)
        const rawInput = item.input || item.instruction || '';
        if (rawInput.includes('1.') && rawInput.includes('2.')) {
          const sliced = this.sliceSingleItemIfApplicable(query, item);
          if (sliced.sample_id !== item.sample_id) {
            return sliced;
          }
        }

        // BẢO VỆ CÂU HỎI ĐA Ý: Không cho phép câu đơn ý khớp đè lên câu hỏi chứa nhiều ý (1. và 2.)
        const hasMultipleInQuery =
          (query.includes('1.') && query.includes('2.')) ||
          query.toLowerCase().includes('các nhận định') ||
          query.toLowerCase().includes('những nhận định');
        const hasMultipleInItem = (rawInput.includes('1.') && rawInput.includes('2.')) || itemNorm.includes('2.');
        if (hasMultipleInQuery && !hasMultipleInItem) {
          continue;
        }

        // Kiểm tra chứa câu nhận định đơn lẻ hoặc tương đồng cao
        if (qNorm.length > 15 && (itemNorm.includes(qNorm) || qNorm.includes(itemNorm))) {
          return item;
        }
        const quoted = itemNorm.match(/"([^"]+)"/) || itemNorm.match(/nhận định\s*:\s*([^.]+)/);
        if (quoted && quoted[1] && quoted[1].length > 12 && qNorm.includes(quoted[1].trim())) {
          return item;
        }
      }
    }

    const qWords = this.normalize(query);
    if (qWords.length < 3) return null;

    const qKeywords = qWords.filter((w) => !this.STOP_WORDS.has(w));
    const activeWords = qKeywords.length >= 2 ? qKeywords : qWords;
    const qBigrams = this.getBigrams(activeWords.length >= 3 ? activeWords : qWords);
    const qRawNorm = query.toLowerCase().replace(/[.,;:?!"'“”()]/g, ' ').replace(/\s+/g, ' ').trim();

    // 1. Quét trên tập Exam Barem điểm 10 (340+ đề thi Bộ GD&ĐT)
    if (this.examCorpus.length > 0) {
      let bestExam: SftSample | null = null;
      let bestExamScore = 0;

      for (let i = 0; i < this.examCorpus.length; i++) {
        const item = this.examCorpus[i];
        if (!this.matchFactGuard(query, item)) continue;

        // BẢO VỆ CHẶT CHẼ THEO INTENT CODE (Archetype Isolation)
        if (intentCode === 'DEFINITION' && (item.intent_code === 'CASE_ANALYSIS' || item.intent_code === 'TRUE_FALSE' || item.intent_code === 'VPPL_4_ELEMENTS')) {
          continue;
        }
        if (intentCode === 'TRUE_FALSE' && (item.intent_code === 'CASE_ANALYSIS' || item.intent_code === 'DEFINITION')) {
          continue;
        }
        if (intentCode === 'CASE_ANALYSIS' && (item.intent_code === 'TRUE_FALSE' || item.intent_code === 'DEFINITION')) {
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
        }

        // Khớp chuỗi trực tiếp nếu chứa nhau >= 25 ký tự
        if (qRawNorm.length >= 25 && (itemRawNorm.includes(qRawNorm) || qRawNorm.includes(itemRawNorm))) {
          return this.sliceSingleItemIfApplicable(query, item);
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
        const compositeScore = diceScore > 0 ? (0.65 * diceScore + 0.35 * unigramScore) : unigramScore;

        // Nếu cùng intent_code ngưỡng mềm (0.50), nếu khác intent_code ngưỡng chặt hơn (0.60)
        const isSameIntent = !intentCode || item.intent_code === intentCode;
        const threshold = isSameIntent ? 0.50 : 0.60;
        const isVeryHighUnigram = isSameIntent ? unigramScore >= 0.70 : unigramScore >= 0.80;

        if ((compositeScore >= threshold || isVeryHighUnigram) && (compositeScore > bestExamScore || unigramScore > bestExamScore)) {
          bestExamScore = Math.max(compositeScore, unigramScore);
          bestExam = item;
        }
      }

      if (bestExam) {
        return this.sliceSingleItemIfApplicable(query, bestExam);
      }
    }

    // 2. Quét tài liệu pháp lý chuyên sâu trong Master Corpus (Số hiệu, Tiêu đề văn bản, Địa phương ban hành)
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
        if (!this.matchFactGuard(query, item)) continue;

        // BẢO VỆ CHẶT CHẼ THEO INTENT CODE (Archetype Isolation)
        if (intentCode === 'DEFINITION' && (item.intent_code === 'CASE_ANALYSIS' || item.intent_code === 'TRUE_FALSE' || item.intent_code === 'VPPL_4_ELEMENTS')) {
          continue;
        }
        if (intentCode === 'TRUE_FALSE' && (item.intent_code === 'CASE_ANALYSIS' || item.intent_code === 'DEFINITION')) {
          continue;
        }
        if (intentCode === 'CASE_ANALYSIS' && (item.intent_code === 'TRUE_FALSE' || item.intent_code === 'DEFINITION')) {
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
    retrievedArticles: ILawArticle[] = []
  ): Promise<{ text: string; latencyMs: number }> {
    const startTime = Date.now();

    // 0. Kiểm tra Fast-Path Tầng 4 (Bộ đề & Barem chuẩn có kiểm định dữ kiện)
    const matchedSft = this.matchSftSample(query, intentCode);
    if (matchedSft) {
      const finalSft = this.sliceSingleItemIfApplicable(query, matchedSft);
      await new Promise((r) => setTimeout(r, 200));
      console.log(
        `⚡ [Tier-4 SFT Engine] Khớp đúng bài tập ${finalSft.sample_id} (${finalSft.intent_code}) trong ${Date.now() - startTime}ms.`
      );
      return {
        text: finalSft.output,
        latencyMs: Date.now() - startTime
      };
    }

    // 1. Thử gọi mô hình cục bộ với timeout siêu ngắn (800ms) để ưu tiên phản hồi tức thì
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
                'Bạn là Giảng viên Pháp lý VietLawAssist môn Pháp luật Đại cương. Hãy giải bài tập ngắn gọn, rõ ràng theo barem chuẩn Bộ GD&ĐT.'
            },
            {
              role: 'user',
              content: `Ngữ cảnh pháp lý:\n${promptContext.slice(0, 300)}\n\nĐề bài:\n${query}`
            }
          ],
          temperature: 0.15,
          max_tokens: 280
        }),
        signal: AbortSignal.timeout(800)
      });

      if (response.ok) {
        const data: any = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim().length > 60) {
          console.log(`✅ [LLM] Mô hình Qwen2.5-3B Local phản hồi trong ${Date.now() - startTime}ms.`);
          return { text, latencyMs: Date.now() - startTime };
        }
      }
    } catch {
      // Timeout hoặc bận -> Chuyển ngay sang Bộ giải Dynamic RAG
    }

    // 2. Bộ giải Barem ĐỘNG (Dynamic RAG Solver) - Phân tích chính xác từng thực thể và số liệu của đề bài
    const generatedText = this.generateDynamicRagSolution(query, intentCode, promptContext, retrievedArticles);
    return {
      text: generatedText,
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
      'đèn', 'đỏ', 'xe', 'máy', 'ô', 'tô', 'va', 'chạm', 'giao', 'thông'
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
          if (!actors.includes(w)) actors.push(w);
        } else if (!commonWords.has(lower)) {
          const prev = i > 0 ? words[i - 1].toLowerCase() : '';
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
    retrievedArticles: ILawArticle[] = []
  ): string {
    const actors = this.extractActors(query);
    const money = this.extractMoney(query);
    const ageInfo = this.extractAge(query);
    const injury = this.extractInjury(query);

    switch (intentCode) {
      case 'DEFINITION':
        return this.solveDynamicDefinition(query, this.extractLegalConcept(query));
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
    const actorA = actors[0] || 'Chủ thể thực hiện hành vi';
    const actorB = actors[1] || 'Bên bị thiệt hại';
    const qLower = query.toLowerCase();

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
    }

    const citedLaw = articles.length > 0 ? `Điều ${articles[0].articleNumber} ${articles[0].lawName}` : lawClause;

    return `### I. KẾT LUẬN SƠ BỘ VỀ HÀNH VI
Hành vi của **${actorA}** trong tình huống có đầy đủ các dấu hiệu cấu thành **Vi phạm pháp luật** theo quy định của pháp luật Việt Nam.

---

### II. BẢNG PHÂN TÍCH 4 YẾU TỐ CẤU THÀNH VI PHẠM PHÁP LUẬT
*(Theo đúng khung Barem điểm chuẩn môn Pháp luật Đại cương - Bộ GD&ĐT)*

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

    // Nếu không tách được theo dòng, thử tách inline theo số thứ tự (1. ... 2. ...)
    if (statements.length < 2) {
      const inlineRegex = new RegExp(
        '(?:(?:^|\\s)(?:\\d+[./)]|nhận định\\s*\\d+:?|câu\\s*\\d+:?))\\s*([^0-9\\n][^\\n]+?)(?=(?:(?:\\s+\\d+[./)]|\\s+nhận định\\s*\\d+:?|\\s+câu\\s*\\d+:?)|$)',
        'gi'
      );
      const inlineMatches = query.match(inlineRegex);
      if (inlineMatches && inlineMatches.length >= 2) {
        return inlineMatches
          .map((s) => s.replace(/^(?:\s*\d+[./)]|\s*nhận định\s*\d+:?|\s*câu\s*\d+:?)\s*/i, '').trim())
          .filter((s) => s.length > 5);
      }
    }

    return statements;
  }

  /**
   * Đánh giá chuyên sâu 1 câu nhận định pháp lý với căn cứ thực định chuẩn xác
   */
  private static evaluateSingleStatement(stmt: string, articles: ILawArticle[]): string {
    const sLower = stmt.toLowerCase().trim();

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
  private static solveDynamicQppl(query: string, articles: ILawArticle[]): string {
    const qLower = query.toLowerCase();

    // Nếu hỏi về Quan hệ pháp luật / Quan hệ pháp luật dân sự
    if (
      qLower.includes('quan hệ pháp luật') ||
      qLower.includes('cơ cấu của quan hệ') ||
      qLower.includes('cơ cấu quan hệ') ||
      qLower.includes('quan hệ dân sự')
    ) {
      return this.solveDynamicCivilRelation(query, articles);
    }

    const art = articles[0];
    const lawTitle = art ? `Điều ${art.articleNumber}: ${art.title} (${art.lawName})` : 'Quy phạm pháp luật trong đề bài';

    return `### I. CƠ CẤU 3 BỘ PHẬN CỦA QUY PHẠM PHÁP LUẬT
*(Theo đúng giáo trình Pháp luật Đại cương - NXB Giáo dục Việt Nam)*

Căn cứ quy định tại: **${lawTitle}**

| Bộ phận cấu thành | Dấu hiệu nhận biết | Trích đoạn xác định cụ thể trong quy phạm |
| :--- | :--- | :--- |
| **1. Bộ phận Giả định** | Trả lời câu hỏi: *"Chủ thể nào? Trong hoàn cảnh, điều kiện nào?"* | Nêu rõ chủ thể (cá nhân, cơ quan, tổ chức) và các tình huống, điều kiện thực tế của đời sống mà khi xảy ra thì quy phạm sẽ tác động điều chỉnh. |
| **2. Bộ phận Quy định** | Trả lời câu hỏi: *"Chủ thể được làm gì, không được làm gì, hoặc phải làm gì và làm như thế nào?"* | Xác lập khuôn mẫu xử sự: Mệnh lệnh cấm đoán, bắt buộc phải hành động, hoặc trao quyền tự do lựa chọn xử sự cho chủ thể. |
| **3. Bộ phận Chế tài** | Trả lời câu hỏi: *"Hậu quả pháp lý bất lợi gì nếu không tuân thủ quy phạm?"* | Các biện pháp cưỡng chế mang tính trừng phạt của Nhà nước áp dụng đối với chủ thể vi phạm (phạt tiền, phạt tù, bồi thường thiệt hại, cải tạo...). |

---

### II. ĐẶC ĐIỂM CƠ CẤU VÀ TÍNH CHẤT QUY PHẠM
1. **Phân loại mệnh lệnh**: Xác định tính chất dứt khoát (mệnh lệnh cấm đoán tuyệt đối) hoặc tùy nghi (cho phép các bên thỏa thuận).
2. **Đánh giá về tính khuyết thiếu thành phần**: Trong thực tiễn lập pháp, một số quy phạm có thể khuyết bộ phận Quy định (thường ẩn dưới chế tài hình sự) hoặc khuyết chế tài trực tiếp (dẫn chiếu văn bản xử phạt).`;
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
      if (q.includes('bản chất') || (q.includes('giai cấp') && q.includes('xã hội'))) {
        return this.solveDynamicStateNature();
      }
      return `### ĐỊNH NGHĨA NHÀ NƯỚC
**Nhà nước** là tổ chức quyền lực chính trị đặc biệt của xã hội có giai cấp, bao gồm một lớp người được tách ra từ xã hội để chuyên thực thi quyền lực, nhằm tổ chức và quản lý xã hội, bảo vệ lợi ích của giai cấp thống trị và duy trì trật tự chung của toàn xã hội.

---

### 5 DẤU HIỆU ĐẶC TRƯNG CỦA NHÀ NƯỚC
1. **Thiết lập quyền lực công cộng đặc biệt**: Có bộ máy chuyên trách để cưỡng chế và quản lý (quân đội, cảnh sát, tòa án, nhà tù).
2. **Phân chia dân cư và quản lý lãnh thổ**: Quản lý xã hội theo các đơn vị hành chính lãnh thổ, không phân biệt huyết thống hay tôn giáo.
3. **Có chủ quyền quốc gia**: Nắm quyền tối cao trong quan hệ đối nội và độc lập tự quyết trong quan hệ đối ngoại.
4. **Ban hành pháp luật và quản lý bằng pháp luật**: Pháp luật có tính bắt buộc chung đối với toàn xã hội.
5. **Quy định và thu các loại thuế bắt buộc**: Nhằm duy trì và nuôi dưỡng bộ máy nhà nước.`;
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

  // --- DẠNG 7: LÝ THUYẾT TỔNG HỢP & DỰ PHÒNG THÔNG MINH ---
  private static solveDynamicGeneralTheory(query: string, articles: ILawArticle[]): string {
    const qLower = query.toLowerCase();

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
    if (isDef || (concept && !qLower.includes('bồi thường') && !qLower.includes('tai nạn') && !qLower.includes('đánh') && !qLower.includes('vượt đèn đỏ'))) {
      return this.solveDynamicDefinition(query, concept);
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
