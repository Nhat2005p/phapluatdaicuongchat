import { LawArticle, ILawArticle } from '../models/LawArticle.js';
import { TextbookPrinciple, ITextbookPrinciple } from '../models/TextbookPrinciple.js';
import { TextbookKnowledgeService } from './textbookKnowledgeService.js';

export type ExamArchetype =
  | 'DEFINITION'
  | 'QPPL_STRUCT'
  | 'VPPL_4_ELEMENTS'
  | 'TRUE_FALSE'
  | 'CIVIL_INHERIT'
  | 'CRIMINAL_AGE'
  | 'CIVIL_CONTRACT'
  | 'GENERAL_THEORY'
  | 'FAMILY_LAW'
  | 'CASE_ANALYSIS'
  | 'COMPARISON'
  | 'OUT_OF_SCOPE';

export interface QuantifierPolarityFlags {
  hasUniversalQuantifier: boolean; // mọi, tất cả, luôn, luôn luôn, đều, bất kỳ
  hasRestrictiveQuantifier: boolean; // chỉ, duy nhất, bắt buộc phải
  hasNegation: boolean; // không, chưa, chẳng, không bao giờ, không cần
  hasPossibility: boolean; // có thể, đôi khi
  matchedQuantifiers: string[];
}

export interface QueryRoutingPlan {
  originalQuery: string;
  rewrittenQuery: string;
  expandedQuery: string;
  multiQueryVariants: string[];
  subQuestions: string[];
  intentCode: ExamArchetype;
  targetSources: Array<'SFT_EXAM_CORPUS' | 'TEXTBOOK_KNOWLEDGE' | 'STATUTORY_LAWS' | 'DYNAMIC_CASE_SOLVER'>;
  quantifierFlags: QuantifierPolarityFlags;
}

export class RagService {
  /**
   * =========================================================================
   * STAGE 01: QUERY REWRITING — CHUẨN HÓA VIẾT TẮT, SỬA LỖI OCR & KHỬ NHIỄU
   * Biến câu hỏi viết tắt/đời thường thành truy vấn pháp lý chuẩn xác hơn.
   * =========================================================================
   */
  public static rewriteLegalQuery(query: string): string {
    if (!query) return '';
    let res = query;

    // 1. Sửa các lỗi OCR dính chữ 'đ' phổ biến trong đề thi (ví dụ: "quânđ ội" -> "quân đội", "quanđ ến" -> "quan đến", "quyếtđ ịnh" -> "quyết định")
    const vnLower = 'a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ';
    const vnUpper = 'A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ';
    const shiftedDRe = new RegExp(`([${vnLower}${vnUpper}])([đĐ])\\s+(ội|ến|ịnh|ồng|ầu|ược|ây|ó|iều|úng|ối|ơn|ộ|ộc|ạo|ất|ảm|áng)\\b`, 'gi');
    res = res.replace(shiftedDRe, '$1 $2$3');

    // 2. Mở rộng các từ viết tắt chuyên ngành Pháp luật Đại cương (dùng ranh giới từ hỗ trợ tiếng Việt có dấu)
    const wbLeft = '(?:^|[\\s.,;:?!"\'“”()\\[\\]\\-–—_/\\\\])';
    const wbRight = '(?=$|[\\s.,;:?!"\'“”()\\[\\]\\-–—_/\\\\])';
    const abbrevPairs: Array<[string, string]> = [
      ['qppl', 'quy phạm pháp luật'],
      ['qhpl', 'quan hệ pháp luật'],
      ['qhxh', 'quan hệ xã hội'],
      ['vppl', 'vi phạm pháp luật'],
      ['tnpl', 'trách nhiệm pháp lý'],
      ['vbqppl', 'văn bản quy phạm pháp luật'],
      ['adpl', 'áp dụng pháp luật'],
      ['thpl', 'thực hiện pháp luật'],
      ['skpl', 'sự kiện pháp lý'],
      ['nlplds', 'năng lực pháp luật dân sự'],
      ['nlhvds', 'năng lực hành vi dân sự'],
      ['nlpl', 'năng lực pháp luật'],
      ['nlhv', 'năng lực hành vi'],
      ['gdds', 'giao dịch dân sự'],
      ['btth', 'bồi thường thiệt hại'],
      ['vphc', 'vi phạm hành chính'],
      ['tnhs', 'trách nhiệm hình sự'],
      ['tnds', 'trách nhiệm dân sự'],
      ['tnhc', 'trách nhiệm hành chính'],
      ['tnkl', 'trách nhiệm kỷ luật'],
      ['pvcđ', 'phòng vệ chính đáng'],
      ['pvcd', 'phòng vệ chính đáng'],
      ['ttct', 'tình thế cấp thiết'],
      ['htpl', 'hệ thống pháp luật'],
      ['bmnn', 'bộ máy nhà nước'],
      ['qlnn', 'quản lý nhà nước'],
      ['pctnh', 'phòng chống tham nhũng'],
      ['xhcn', 'xã hội chủ nghĩa'],
      ['plđc', 'pháp luật đại cương'],
      ['pldc', 'pháp luật đại cương']
    ];

    for (const [abbr, expansion] of abbrevPairs) {
      const rx = new RegExp(`(${wbLeft})${abbr}${wbRight}`, 'gi');
      res = res.replace(rx, `$1${expansion}`);
    }

    // 3. Khử nhiễu điểm số trong câu đơn (ví dụ "(1,0 điểm)", "(2,0 điểm)")
    res = res.replace(/\(\s*\d+(?:[.,]\d+)?\s*điểm\s*\)/gi, ' ').replace(/\s{2,}/g, ' ').trim();

    return res;
  }

  /**
   * =========================================================================
   * STAGE 01: QUANTIFIER & POLARITY EXTRACTION (BẮT CHI TIẾT LƯỢNG TỪ HẠN ĐỊNH)
   * Phục vụ ColBERT Fine-grained Matching & Cross-Encoder Reranking ở câu Đúng/Sai
   * =========================================================================
   */
  public static extractQuantifierAndPolarityFlags(query: string): QuantifierPolarityFlags {
    const q = ` ${query.toLowerCase().replace(/[.,;:?!"'“”()\[\]\-–—_/\\]/g, ' ').replace(/\s+/g, ' ')} `;
    const matchedQuantifiers: string[] = [];

    const universalTerms = [' mọi ', ' tất cả ', ' bất kỳ ', ' bất cứ ', ' luôn ', ' luôn luôn ', ' đều ', ' bao giờ cũng '];
    const restrictiveTerms = [' chỉ ', ' duy nhất ', ' bắt buộc phải ', ' hoàn toàn không '];
    const negationTerms = [' không ', ' chưa ', ' chẳng ', ' không phải ', ' không bao giờ ', ' không cần ', ' không thể '];
    const possibilityTerms = [' có thể ', ' đôi khi ', ' thông thường ', ' nhìn chung '];

    let hasUniversalQuantifier = false;
    for (const t of universalTerms) {
      if (q.includes(t)) {
        hasUniversalQuantifier = true;
        matchedQuantifiers.push(t.trim());
      }
    }

    let hasRestrictiveQuantifier = false;
    for (const t of restrictiveTerms) {
      if (q.includes(t)) {
        hasRestrictiveQuantifier = true;
        matchedQuantifiers.push(t.trim());
      }
    }

    let hasNegation = false;
    for (const t of negationTerms) {
      if (q.includes(t)) {
        hasNegation = true;
        matchedQuantifiers.push(t.trim());
      }
    }

    let hasPossibility = false;
    for (const t of possibilityTerms) {
      if (q.includes(t)) {
        hasPossibility = true;
        matchedQuantifiers.push(t.trim());
      }
    }

    return {
      hasUniversalQuantifier,
      hasRestrictiveQuantifier,
      hasNegation,
      hasPossibility,
      matchedQuantifiers
    };
  }

  /**
   * =========================================================================
   * STAGE 01: MULTI-QUERY GENERATION — TẠO NHIỀU BIẾN THỂ TRUY VẤN
   * Tăng khả năng tìm đúng (Recall) cho cả SFT Corpus và Giáo trình RAG
   * =========================================================================
   */
  public static generateMultiQueryVariants(query: string): string[] {
    const rewritten = this.rewriteLegalQuery(query);
    const expanded = TextbookKnowledgeService.rewriteAndExpandQuery(rewritten);
    const coreStatement = rewritten
      .replace(/^(?:câu\s*\d+\s*[:.)]?\s*|nhận\s*định\s*\d*\s*[:.)]?\s*)/i, '')
      .replace(/(?:nhận định này|nhận định trên|nhận định sau)?\s*đúng hay sai\??.*$/i, '')
      .replace(/giải thích vì sao\.?$/i, '')
      .replace(/^["“”'\[]+|["“”'\]]+$/g, '')
      .trim();

    const variants = new Set<string>();
    if (rewritten) variants.add(rewritten);
    if (coreStatement && coreStatement.length >= 10) variants.add(coreStatement);
    if (expanded && expanded !== rewritten) variants.add(expanded);

    return Array.from(variants);
  }

  /**
   * =========================================================================
   * STAGE 01: BUILD ROUTING PLAN (REWRITE + EXPAND + INTENT + ROUTING + MULTI-QUERY)
   * =========================================================================
   */
  public static buildRoutingPlan(query: string, forcedCategory?: string | null): QueryRoutingPlan {
    const rewrittenQuery = this.rewriteLegalQuery(query);
    const expandedQuery = TextbookKnowledgeService.rewriteAndExpandQuery(rewrittenQuery);
    const multiQueryVariants = this.generateMultiQueryVariants(query);
    const subQuestions = this.splitMultiQuestions(rewrittenQuery);
    const intentCode = this.detectIntent(rewrittenQuery, forcedCategory);
    const quantifierFlags = this.extractQuantifierAndPolarityFlags(rewrittenQuery);

    const targetSources: Array<'SFT_EXAM_CORPUS' | 'TEXTBOOK_KNOWLEDGE' | 'STATUTORY_LAWS' | 'DYNAMIC_CASE_SOLVER'> = [];
    if (intentCode !== 'OUT_OF_SCOPE') {
      targetSources.push('SFT_EXAM_CORPUS', 'TEXTBOOK_KNOWLEDGE', 'STATUTORY_LAWS');
      if (
        intentCode === 'CASE_ANALYSIS' ||
        intentCode === 'CIVIL_CONTRACT' ||
        intentCode === 'CIVIL_INHERIT' ||
        intentCode === 'CRIMINAL_AGE' ||
        intentCode === 'FAMILY_LAW' ||
        intentCode === 'QPPL_STRUCT'
      ) {
        targetSources.push('DYNAMIC_CASE_SOLVER');
      }
    }

    return {
      originalQuery: query,
      rewrittenQuery,
      expandedQuery,
      multiQueryVariants,
      subQuestions,
      intentCode,
      targetSources,
      quantifierFlags
    };
  }
  /**
   * Nhận diện câu hỏi danh tính / mô hình của Chatbot
   */
  public static isModelIdentityQuery(query: string): boolean {
    const q = (query || '')
      .toLowerCase()
      .replace(/[.,;:?!"'“”()\-–—_/\\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return (
      q === 'bạn là mô hình gì' ||
      q === 'mô hình gì' ||
      q === 'bạn dùng mô hình gì' ||
      q === 'bạn là ai' ||
      q === 'bạn là gì' ||
      q === 'bạn tên gì' ||
      q === 'bạn tên là gì' ||
      q === 'ai tạo ra bạn' ||
      q === 'bạn hoạt động như thế nào' ||
      q === 'mô hình nào' ||
      q === 'mô hình' ||
      (q.includes('bạn là') && (q.includes('mô hình') || q.includes('ai') || q.includes('gì'))) ||
      (q.includes('mô hình') && (q.includes('gì') || q.includes('nào') || q.includes('hoạt động') || q.includes('kiến trúc')))
    );
  }

  /**
   * Kiểm tra câu hỏi có thuộc phạm vi môn học Pháp luật Đại cương hay không
   */
  public static isLegalQuery(query: string, forcedCategory?: string | null): boolean {
    if (forcedCategory && forcedCategory.trim()) return true;

    const rewritten = this.rewriteLegalQuery(query || '');
    const q = rewritten
      .toLowerCase()
      .replace(/[.,;:?!"'“”()\-–—_/\\]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!q || q.length < 2) return false;

    // Check article patterns: e.g. "điều 12", "khoản 1", "blhs", "blds"
    if (/\b(?:điều|khoản|điểm)\s+\d+/i.test(query)) return true;
    if (/\b(?:blhs|blds|blld|hngd|vbqppl|luật|nghị định|thông tư|hiến pháp|pháp lệnh|nghị quyết|án lệ)\b/i.test(query)) return true;

    // Check chapter patterns: "chương 1", "chương 2", "chương 7", "chương vii", etc.
    if (/\bchương\s+(?:\d+|i{1,3}|iv|v|vi|vii|viii|ix|x)\b/i.test(query)) return true;

    // Check legal vocabulary of General Law (Pháp luật Đại cương - Đầy đủ 9 Chương)
    const legalKeywords = [
      // 1. Lý luận chung về Nhà nước & Pháp luật (Chương 1 - 5)
      'nhà nước', 'pháp luật', 'quy phạm', 'quan hệ pháp luật', 'vi phạm', 'trách nhiệm pháp lý',
      'chế tài', 'giả định', 'quy định', 'tính giai cấp', 'tính xã hội', 'quyền lực', 'chủ quyền',
      'bộ máy nhà nước', 'hình thức nhà nước', 'chính thể', 'cấu trúc', 'chế độ chính trị',
      'nguồn của pháp luật', 'hệ thống pháp luật', 'văn bản quy phạm', 'thực hiện pháp luật',
      'tuân thủ', 'chấp hành', 'thi hành', 'sử dụng pháp luật', 'áp dụng pháp luật', 'sự kiện pháp lý',
      'năng lực pháp luật', 'năng lực hành vi', 'lỗi cố ý', 'lỗi vô ý', 'phòng vệ chính đáng',
      'tình thế cấp thiết', 'đúng hay sai', 'nhận định', 'so sánh', 'phân biệt', 'bản chất', 'pháp chế', 'cơ cấu',
      'pháp quyền', 'cưỡng chế', 'chế tài hình sự', 'chế tài hành chính', 'chế tài dân sự', 'chế tài kỷ luật',
      'pháp lý', 'hậu quả pháp lý', 'căn cứ pháp lý',

      // 2. Chương 6: Nội dung cơ bản Luật Dân sự
      'dân sự', 'giao dịch', 'giao dịch dân sự', 'vô hiệu', 'hợp đồng', 'pháp nhân', 'tư cách pháp nhân',
      'nhân thân', 'quan hệ nhân thân', 'quyền nhân thân', 'tài sản', 'quyền tài sản', 'quyền sở hữu',
      'chiếm hữu', 'sử dụng', 'định đoạt', 'thừa kế', 'di sản', 'di chúc', 'hàng thừa kế', 'thế vị',
      'bồi thường', 'thiệt hại', 'bồi thường thiệt hại', 'nghĩa vụ', 'đại diện', 'thời hiệu', 'hợp đồng vay',
      'đặt cọc', 'cầm cố', 'thế chấp',

      // 3. Chương 7: Nội dung cơ bản Luật Hình sự
      'hình sự', 'tội phạm', 'tội danh', 'tội', 'phạm tội', 'đồng phạm', 'người thực hành', 'người tổ chức',
      'người xúi giục', 'người giúp sức', 'chủ mưu', 'cấu thành tội phạm', 'khách thể của tội phạm',
      'chủ thể của tội phạm', 'mặt khách quan của tội phạm', 'mặt chủ quan của tội phạm',
      'hình phạt', 'tử hình', 'tù chung thân', 'tù có thời hạn', 'cải tạo không giam giữ', 'cảnh cáo',
      'trục xuất', 'hình phạt chính', 'hình phạt bổ sung', 'miễn trách nhiệm hình sự', 'xóa án tích',
      'phòng vệ', 'cấp thiết', 'sự kiện bất ngờ', 'độ tuổi', 'tuổi chịu', 'chưa thành niên',
      'chuẩn bị phạm tội', 'phạm tội chưa đạt', 'tự ý nửa chừng', 'tái phạm',

      // 4. Chương 8 & 9: Luật Hành chính & Phòng, chống tham nhũng
      'hành chính', 'quản lý nhà nước', 'xử phạt', 'vi phạm hành chính', 'xử phạt vi phạm hành chính',
      'biện pháp ngăn chặn', 'tạm giữ', 'khám xét',
      'tham nhũng', 'vụ lợi', 'chức vụ', 'quyền hạn', 'kê khai tài sản', 'hối lộ', 'nhận hối lộ', 'tham ô',

      // 5. Luật Hiến pháp, Hôn nhân gia đình, Lao động
      'hiến pháp', 'luật hiến pháp', 'quốc hội', 'chính phủ', 'chủ tịch nước', 'tòa án', 'viện kiểm sát',
      'hội đồng nhân dân', 'ủy ban nhân dân', 'quyền con người', 'quyền công dân', 'nghĩa vụ công dân',
      'kết hôn', 'ly hôn', 'hôn nhân', 'gia đình', 'lao động', 'tiền lương', 'sa thải', 'hợp đồng lao động'
    ];

    for (const kw of legalKeywords) {
      if (q.includes(kw)) return true;
    }

    return false;
  }

  /**
   * Giai đoạn 1: Phân loại và Điều hướng (Intent Routing / Archetype Detection)
   * Nhận diện chuẩn xác các dạng đề thi trọng tâm + tranh chấp hợp đồng/giao dịch dân sự
   * @param forcedCategory Dạng bài người dùng chủ động chọn từ giao diện (nếu có)
   */
  public static detectIntent(query: string, forcedCategory?: string | null): ExamArchetype {
    // 0. BẢO VỆ PHẠM VI MÔN HỌC (GUARDRAIL OUT-OF-SCOPE & IDENTITY)
    if (this.isModelIdentityQuery(query)) {
      return 'OUT_OF_SCOPE';
    }

    if (!this.isLegalQuery(query, forcedCategory)) {
      return 'OUT_OF_SCOPE';
    }

    const q = this.rewriteLegalQuery(query).toLowerCase().trim();

    // 0. BẮT BUỘC ĐIỀU HƯỚNG NẾU NGƯỜI DÙNG CHỌN DANH MỤC CỤ THỂ
    if (forcedCategory) {
      const cat = forcedCategory.toUpperCase().trim();
      if (cat === 'NHAN_DINH' || cat === 'TRUE_FALSE') {
        return 'TRUE_FALSE';
      }
      if (cat === 'SO_SANH' || cat === 'COMPARISON') {
        return 'COMPARISON';
      }
      if (cat === 'TINH_HUONG' || cat === 'CASE_ANALYSIS') {
        if (q.includes('thừa kế') || q.includes('di sản') || q.includes('di chúc')) return 'CIVIL_INHERIT';
        if (q.includes('vay') && (q.includes('tiền') || q.includes('triệu') || q.includes('hợp đồng'))) return 'CIVIL_CONTRACT';
        return 'CASE_ANALYSIS';
      }
      if (cat === 'DINH_NGHIA' || cat === 'DEFINITION') {
        return 'DEFINITION';
      }
      if (cat === 'PHAN_TICH' || cat === 'VPPL_4_ELEMENTS') {
        if (q.includes('quy phạm pháp luật') || q.includes('giả định') || q.includes('chế tài') || q.includes('cơ cấu')) return 'QPPL_STRUCT';
        return 'VPPL_4_ELEMENTS';
      }
    }

    // NẾU Ở PHẦN CHUNG: TỰ ĐỘNG NHẬN DIỆN MỌI DẠNG ĐỀ TỪ CÂU HỎI
    // 0. Dạng So sánh & Phân biệt (COMPARISON)
    if (
      q.includes('so sánh') ||
      q.includes('phân biệt') ||
      q.includes('đối chiếu') ||
      q.includes('giống và khác nhau') ||
      q.includes('điểm giống') ||
      q.includes('điểm khác')
    ) {
      return 'COMPARISON';
    }

    // 1. Dạng Câu hỏi Khái niệm / Định nghĩa Lý thuyết (DEFINITION)
    // Chỉ nhận diện là Định nghĩa khi câu hỏi thực sự hỏi định nghĩa/khái niệm
    const isDefQuery =
      q.includes('là gì') ||
      q.includes('là cái gì') ||
      q.includes('thế nào là') ||
      q.includes('định nghĩa') ||
      q.includes('khái niệm') ||
      q.includes('hiểu thế nào về') ||
      q.includes('hiểu như thế nào về') ||
      q.includes('bản chất của nhà nước') ||
      q.includes('bản chất nhà nước') ||
      q.includes('nêu rõ bản chất');

    const hasCaseSpecifics =
      q.includes('khi vượt đèn đỏ') ||
      q.includes('làm rơi') ||
      q.includes('rơi vỡ') ||
      (q.includes('laptop') && (q.includes('rơi') || q.includes('vỡ') || q.includes('hỏng') || q.includes('mượn'))) ||
      q.includes('ông a') ||
      q.includes('anh b') ||
      q.includes('bà b') ||
      q.includes('chị a') ||
      q.includes('chia thừa kế') ||
      q.includes('vay tiền') ||
      q.includes('đúng hay sai') ||
      q.includes('nhận định');

    if (isDefQuery && !hasCaseSpecifics) {
      return 'DEFINITION';
    }

    // 2. Dạng Câu hỏi Nhận định Đúng / Sai (TRUE_FALSE)
    if (
      q.includes('đúng hay sai') ||
      q.includes('đúng/sai') ||
      q.includes('nhận định') ||
      q.includes('nhận địn') ||
      q.includes('khẳng định') ||
      q.includes('cho biết đúng hay sai') ||
      q.includes('là dấu hiệu bắt buộc') ||
      q.includes('dấu hiệu bắt buộc') ||
      q.includes('là giống nhau') ||
      q.includes('giống nhau hay khác nhau') ||
      q.includes('chỉ ra đời trong') ||
      q.includes('chỉ ra đời khi') ||
      q.includes('chỉ xuất hiện') ||
      q.startsWith('mọi ') ||
      q.startsWith('tất cả ') ||
      q.startsWith('không chỉ ') ||
      q.includes('đều là') ||
      q.includes('đều được') ||
      q.includes('đều phải') ||
      q.includes('luôn luôn') ||
      q.includes('luôn là') ||
      q.includes('không bao giờ') ||
      q.includes('chỉ có') ||
      (q.includes('tuân thủ') && q.includes('thi hành')) ||
      (q.includes('thực hiện pháp luật') && (q.includes('hành động') || q.includes('không hành động'))) ||
      q.includes('chỉ thuộc về một giai cấp') ||
      q.includes('là một bộ máy cưỡng chế đặc biệt') ||
      q.includes('gắn liền với xã hội có giai cấp')
    ) {
      return 'TRUE_FALSE';
    }

    // 3. Dạng Bài tập Chia Di sản Thừa kế (CIVIL_INHERIT - ưu tiên trước vì thường có thông tin kết hôn, con cái)
    if (
      q.includes('thừa kế') ||
      q.includes('di sản') ||
      q.includes('hàng thừa kế') ||
      q.includes('di chúc') ||
      q.includes('thế vị') ||
      q.includes('2/3 suất')
    ) {
      return 'CIVIL_INHERIT';
    }

    // 3. Dạng Hôn nhân & Gia đình / Xác định cha mẹ con / Chung sống như vợ chồng (FAMILY_LAW)
    if (
      (q.includes('chung sống') ||
        q.includes('không đăng ký kết hôn') ||
        q.includes('nhận con') ||
        q.includes('nhận cha') ||
        q.includes('mang họ mẹ') ||
        q.includes('giấy khai sinh') ||
        q.includes('ly hôn') ||
        q.includes('kết hôn') ||
        (q.includes('hôn nhân') && !q.includes('đúng hay sai'))) &&
      !q.includes('thừa kế') &&
      !q.includes('di sản') &&
      !q.includes('di chúc')
    ) {
      return 'FAMILY_LAW';
    }

    // 4. Dạng Cấu trúc Quy phạm pháp luật & Quan hệ pháp luật (QPPL_STRUCT)
    if (
      q.includes('giả định') ||
      q.includes('chế tài') ||
      q.includes('bộ phận quy định') ||
      (q.includes('quy định') && (q.includes('cơ cấu') || q.includes('3 bộ phận') || q.includes('xác định quy định'))) ||
      q.includes('quy phạm pháp luật') ||
      q.includes('cơ cấu của quy phạm') ||
      q.includes('3 bộ phận') ||
      q.includes('quan hệ pháp luật') ||
      q.includes('cơ cấu của quan hệ pháp luật') ||
      q.includes('cơ cấu quan hệ pháp luật') ||
      q.includes('quan hệ pháp luật dân sự')
    ) {
      return 'QPPL_STRUCT';
    }

    // 5. Dạng Bài tập Hợp đồng Vay tài sản & Giao dịch vay nợ (CIVIL_CONTRACT)
    if (
      (q.includes('giấy vay') ||
        q.includes('vay tài sản') ||
        q.includes('hợp đồng vay') ||
        q.includes('công chứng') ||
        q.includes('vay tiền') ||
        q.includes('vi phạm nghĩa vụ trả nợ') ||
        q.includes('giao dịch vay') ||
        q.includes('đặt cọc') ||
        (q.includes('vay') && (q.includes('trả') || q.includes('hạn') || q.includes('triệu')))) &&
      !q.includes('laptop') &&
      !q.includes('làm rơi') &&
      !q.includes('rơi vỡ')
    ) {
      return 'CIVIL_CONTRACT';
    }

    // 6. Dạng Bài tập Tình huống Đa yêu cầu / Bồi thường thiệt hại / Phòng vệ / Rơi vỡ (CASE_ANALYSIS)
    if (
      q.includes('phòng vệ chính đáng') ||
      q.includes('tình thế cấp thiết') ||
      q.includes('làm rơi') ||
      q.includes('rơi vỡ') ||
      (q.includes('laptop') && (q.includes('rơi') || q.includes('vỡ') || q.includes('hỏng') || q.includes('mượn'))) ||
      (q.includes('mượn') && (q.includes('hỏng') || q.includes('vỡ') || q.includes('bồi thường') || q.includes('tai nạn'))) ||
      (q.includes('vượt đèn đỏ') && q.includes('va chạm')) ||
      (q.includes('đuổi theo') && q.includes('đánh')) ||
      q.includes('dùng gậy') ||
      q.includes('dùng ghế') ||
      q.includes('đập phá')
    ) {
      return 'CASE_ANALYSIS';
    }

    // 6. Dạng Phân tích Cấu thành Vi phạm pháp luật (VPPL_4_ELEMENTS)
    const isVpplStatement =
      q.includes('dấu hiệu bắt buộc') ||
      q.includes('bắt buộc') ||
      q.includes('đúng hay sai') ||
      q.includes('đúng/sai') ||
      q.includes('nhận định') ||
      q.includes('nhận địn') ||
      q.includes('so sánh') ||
      q.includes('phân biệt');

    if (
      !isVpplStatement &&
      (q.includes('4 yếu tố') ||
        q.includes('cấu thành vi phạm') ||
        q.includes('yếu tố cấu thành') ||
        q.includes('mặt khách quan') ||
        q.includes('mặt chủ quan') ||
        q.includes('khách thể') ||
        q.includes('chủ thể') ||
        q.includes('vi phạm pháp luật'))
    ) {
      return 'VPPL_4_ELEMENTS';
    }

    // 7. Dạng Xác định Năng lực TNHS theo Độ tuổi (CRIMINAL_AGE)
    if (
      q.includes('độ tuổi') ||
      q.includes('chưa thành niên') ||
      q.includes('13 tuổi') ||
      q.includes('14 tuổi') ||
      q.includes('15 tuổi') ||
      q.includes('16 tuổi') ||
      q.includes('17 tuổi') ||
      (q.includes('tuổi') && (q.includes('chịu trách nhiệm') || q.includes('phạm tội') || q.includes('tội này')))
    ) {
      return 'CRIMINAL_AGE';
    }

    // 8. Nhánh lý thuyết mở rộng (GENERAL_THEORY)
    return 'GENERAL_THEORY';
  }

  /**
   * Alias cho detectIntent (Phát hiện Archetype dạng đề)
   */
  public static detectArchetype(query: string): ExamArchetype {
    return RagService.detectIntent(query);
  }

  /**
   * Nâng cấp 4: Nhớ ngữ cảnh hội thoại đa lượt (Multi-turn Conversational Context)
   * Tự động phát hiện câu hỏi nối tiếp (dùng đại từ chỉ định hoặc câu hỏi tỉnh lược chủ ngữ)
   * và ghép ngữ cảnh chủ đề pháp lý từ câu hỏi liền trước.
   */
  public static contextualizeQueryWithHistory(
    query: string,
    previousQuery?: string | null
  ): { effectiveQuery: string; isContextualized: boolean; contextTopic?: string } {
    const cleanCurrent = (query || '').trim();
    if (!previousQuery || !previousQuery.trim() || !cleanCurrent) {
      return { effectiveQuery: cleanCurrent, isContextualized: false };
    }

    // Nếu câu hiện tại là danh sách nhiều câu hỏi độc lập hoặc quá dài (> 180 ký tự) thì không ghép ngữ cảnh cũ
    if (cleanCurrent.length > 180 || RagService.splitMultiQuestions(cleanCurrent).length > 1) {
      return { effectiveQuery: cleanCurrent, isContextualized: false };
    }

    const qLower = cleanCurrent.toLowerCase();

    // Các cụm đại từ chỉ định tham chiếu trực tiếp tới câu trước
    const anaphoraPatterns = [
      'tội này', 'tội đó', 'tội danh này', 'tội danh đó',
      'hành vi này', 'hành vi đó', 'hành vi trên',
      'trường hợp này', 'trường hợp đó', 'trường hợp trên',
      'tình huống này', 'tình huống đó', 'tình huống trên',
      'nhận định này', 'nhận định đó', 'nhận định trên',
      'quy phạm này', 'quy phạm đó', 'quan hệ này', 'quan hệ đó',
      'chế định này', 'loại này', 'loại đó', 'ngành luật này',
      'người này', 'người đó', 'anh ta', 'chị ta', 'ông ta', 'bà ta', 'họ phải',
      'chủ thể này', 'khái niệm này', 'vấn đề này', 'điều luật này', 'điều này'
    ];

    const hasAnaphora = anaphoraPatterns.some((p) => qLower.includes(p));

    // Các câu hỏi nối tiếp ngắn gọn tỉnh lược chủ đề (ví dụ: "cho ví dụ minh họa", "phân tích kỹ hơn", "còn mặt chủ quan thì sao?")
    const followUpPrefixes = [
      'cho ví dụ', 'lấy ví dụ', 'nêu ví dụ', 'ví dụ minh họa', 'cho tôi ví dụ', 'cho 1 ví dụ', 'cho một ví dụ',
      'phân tích kỹ hơn', 'giải thích rõ hơn', 'giải thích kỹ hơn', 'giải thích chi tiết', 'nói rõ hơn',
      'tại sao vậy', 'vì sao vậy', 'tại sao lại thế',
      'còn nếu', 'thế còn', 'vậy nếu', 'vậy còn', 'nếu người đó', 'nếu chủ thể',
      'còn mặt khách quan', 'còn mặt chủ quan', 'còn khách thể', 'còn chủ thể',
      'còn bộ phận', 'còn chế tài', 'còn giả định', 'còn quy định',
      'hình phạt thế nào', 'mức phạt bao nhiêu', 'xử lý sao', 'xử lý thế nào', 'chia thế nào', 'chia ra sao'
    ];

    const hasFollowUpCue =
      cleanCurrent.length < 110 &&
      followUpPrefixes.some((p) => qLower.includes(p));

    if (!hasAnaphora && !hasFollowUpCue) {
      return { effectiveQuery: cleanCurrent, isContextualized: false };
    }

    // Làm sạch previousQuery (bỏ phần hậu tố ngữ cảnh cũ và các từ nghi vấn "là gì?", "đúng hay sai?" để giữ chủ đề cốt lõi)
    const cleanPrev = previousQuery
      .replace(/\s*\(Ngữ cảnh câu hỏi trước:[\s\S]*?\)\s*$/i, '')
      .replace(/\s*(?:là gì|như thế nào|đúng hay sai|hãy phân tích|trình bày khái niệm)\s*\??\s*$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 220);

    if (!cleanPrev || cleanPrev.toLowerCase() === qLower) {
      return { effectiveQuery: cleanCurrent, isContextualized: false };
    }

    return {
      effectiveQuery: `${cleanCurrent} (Ngữ cảnh câu hỏi trước: ${cleanPrev})`,
      isContextualized: true,
      contextTopic: cleanPrev
    };
  }

  /**
   * Nâng cấp 1: Bộ tách câu hỏi đa ý & Giải song song (Multi-Query Decomposition)
   * Tự động nhận diện khi người dùng gửi 1 lần nhiều câu hỏi / nhiều nhận định độc lập
   * (1. ... 2. ..., Câu 1: ... Câu 2: ..., a) ... b) ..., gạch đầu dòng, hoặc nhiều câu hỏi ? độc lập),
   * đồng thời bảo toàn nguyên vẹn nếu đó là 1 bài tập tình huống duy nhất có nhiều ý hỏi phụ.
   */
  public static splitMultiQuestions(query: string): string[] {
    const raw = (query || '').trim();
    if (!raw || raw.length < 15) return [raw];

    const rawLower = raw.toLowerCase();

    // 1. Không tách bài tập 4 câu trích dẫn QPPL kinh điển (đã có bộ giải chuyên biệt solveDynamicQpplDetailed)
    if (
      rawLower.includes('điều 39') &&
      (rawLower.includes('điểm a khoản 1 điều 8') || rawLower.includes('điều 102') || rawLower.includes('điều 52'))
    ) {
      return [raw];
    }

    // Hàm kiểm tra xem một đoạn văn có phải là phần dẫn chuyện của Bài tập tình huống (Case Study) hay không
    const isCaseStudyNarrative = (text: string): boolean => {
      const t = text.trim();
      const tl = t.toLowerCase();
      if (t.length >= 95) {
        if (
          (tl.includes('nhận định sau') || tl.includes('câu hỏi sau') || tl.includes('mệnh đề sau') || tl.includes('phần i')) &&
          !/\b(ông|bà|anh|chị|cháu|công ty|doanh nghiệp)\s+[a-zA-ZÀ-ỹ]/i.test(t)
        ) {
          return false;
        }
        return true;
      }
      const narrativeIndicators = [
        /\b(ông|bà|anh|chị|cháu)\s+[A-ZÀ-Ỹ]/,
        /\b(công ty|doanh nghiệp|nhà máy|cửa hàng)\s+[A-ZÀ-Ỹ]/i,
        /\b(kết hôn|chung sống|di sản|thừa kế|di chúc|vay|mượn|trộm|cướp|đâm|chém|đánh|vượt đèn đỏ|tai nạn|xích mích|thương tích|tình huống)\b/i,
        /\b\d+\s*(triệu|tỷ|nghìn)\s*đồng\b/i
      ];
      return narrativeIndicators.some((rx) => rx.test(t));
    };

    // Hàm nhận diện dòng tiêu đề Phần/Mục của đề thi (ví dụ: "PHẦN I. NHẬN ĐỊNH ĐÚNG/SAI", "PHẦN II. CÂU HỎI LÝ THUYẾT")
    const isSectionHeaderLine = (line: string): boolean => {
      return /^(?:phần|mục|i{1,3}|iv|v)\s*(?:[ivx\d]+)?\s*[.:–—\-]\s*(?:nhận\s*định|câu\s*hỏi|lý\s*thuyết|bài\s*tập|tự\s*luận|quan\s*hệ\s*pháp\s*luật|trắc\s*nghiệm)/i.test(
        line.trim()
      ) || /^phần\s+(?:[ivx]+|\d+)\b/i.test(line.trim());
    };

    // Hàm nhận diện dòng chỉ chứa điểm số hoặc ghi chú phụ đề của phần thi (ví dụ: "3,0 điểm – 6 câu × 0,5 điểm", "2,0 điểm", "1,0 điểm", "Có thể dùng để luyện đề khó")
    const isPureScoreLine = (line: string): boolean => {
      const t = line.trim();
      return (
        /^\(?\d+(?:[.,]\d+)?\s*điểm(?:\s*[-–—×x].*)?\)?$/i.test(t) ||
        /^có\s+thể\s+dùng\s+để\s+luyện\s+đề/i.test(t)
      );
    };

    // Hàm xóa tiền tố điểm số ở đầu câu hỏi (ví dụ: "1,0 điểm Hãy phân biệt..." -> "Hãy phân biệt...")
    const stripLeadingScore = (text: string): string => {
      return text
        .replace(/^\(?\d+(?:[.,]\d+)?\s*điểm\)?\s*[:.\-–—]?\s*/i, '')
        .trim();
    };

    const rawLines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    // Kiểm tra xem đề bài có sử dụng nhãn "Câu 1", "Câu 2" / "Nhận định 1", "Nhận định 2" / "Bài 1", "Bài 2" hay không
    const explicitCauRegex = /^(?:câu\s*hỏi|câu|nhận\s*định|bài)\s*(\d+)\s*[:.)\-]?\s*(.*)$/i;
    const explicitCauCount = rawLines.filter((l) => explicitCauRegex.test(l)).length;

    // Nếu đề bài có từ 2 "Câu X" trở lên -> Chỉ tách theo cấp "Câu X" (bảo toàn mọi ý con a, b, c, d bên trong Câu 9!)
    const generalItemRegex = /^(?:(?:câu\s*hỏi|câu|nhận\s*định|ý|bài)\s*\d+\s*[:.)\-]?|\(?\d{1,2}[.)]|\([a-zA-Z]\)|[a-zA-Z][.)]|[-•*])\s+(.+)$/i;
    const activeItemRegex = explicitCauCount >= 2 ? explicitCauRegex : generalItemRegex;

    const firstMarkerLineIdx = rawLines.findIndex((l) => activeItemRegex.test(l));
    if (firstMarkerLineIdx !== -1) {
      const preambleLines = rawLines.slice(0, firstMarkerLineIdx);
      const nonHeaderPreamble = preambleLines
        .filter((l) => !isSectionHeaderLine(l) && !isPureScoreLine(l))
        .join(' ')
        .trim();

      // Nếu phần mở đầu trước mục số 1 là đoạn dẫn chuyện tình huống -> Giữ nguyên cả bài tập tình huống!
      if (nonHeaderPreamble && isCaseStudyNarrative(nonHeaderPreamble)) {
        return [raw];
      }

      let currentSectionIsTrueFalse =
        /đúng\s*hay\s*sai|đúng\s*\/\s*sai|nhận\s*định/i.test(preambleLines.join(' '));

      const items: { text: string; isTrueFalseSection: boolean }[] = [];
      let currentItemLines: string[] = [];
      let currentItemTfFlag = currentSectionIsTrueFalse;

      for (let i = firstMarkerLineIdx; i < rawLines.length; i++) {
        const line = rawLines[i];

        // Nếu gặp dòng tiêu đề PHẦN I, PHẦN II, PHẦN III... -> Cập nhật cờ True/False cho phần tiếp theo và bỏ qua dòng tiêu đề
        if (isSectionHeaderLine(line)) {
          currentSectionIsTrueFalse = /nhận\s*định|đúng\s*\/?\s*sai|đúng\s+hay\s+sai/i.test(line);
          continue;
        }

        // Bỏ qua dòng chỉ ghi điểm số ("2,0 điểm", "1,0 điểm")
        if (isPureScoreLine(line)) {
          continue;
        }

        const m = line.match(activeItemRegex);
        if (m) {
          if (currentItemLines.length > 0) {
            items.push({
              text: stripLeadingScore(currentItemLines.join('\n').trim()),
              isTrueFalseSection: currentItemTfFlag
            });
          }
          const bodyAfterMarker = stripLeadingScore(explicitCauCount >= 2 ? (m[2] || '') : (m[1] || ''));
          currentItemLines = bodyAfterMarker ? [bodyAfterMarker] : [];
          currentItemTfFlag = currentSectionIsTrueFalse;
        } else {
          const cleanedLine = stripLeadingScore(line);
          if (cleanedLine) {
            currentItemLines.push(cleanedLine);
          }
        }
      }

      if (currentItemLines.length > 0) {
        items.push({
          text: stripLeadingScore(currentItemLines.join('\n').trim()),
          isTrueFalseSection: currentItemTfFlag
        });
      }

      const validItems = items.filter((it) => it.text.length >= 8);
      if (validItems.length >= 2) {
        const firstHasActor = isCaseStudyNarrative(validItems[0].text);
        const secondRefersBack =
          validItems.length >= 2 &&
          /\b(trên|đó|này|anh\s+[a-z]|ông\s+[a-z]|bà\s+[a-z]|chị\s+[a-z]|tình huống)/i.test(validItems[1].text) &&
          !/\b(là gì|đúng hay sai|nhận định)\b/i.test(validItems[1].text);

        if (!(firstHasActor && secondRefersBack)) {
          return validItems.slice(0, 15).map((it) => {
            const txt = it.text;
            const isSelfEssayOrCase =
              /\b(hãy\s+phân\s+biệt|phân\s+biệt|so\s+sánh|hãy\s+xác\s+định|xác\s+định\s*:|phân\s+tích\s*:|trình\s+bày|là\s+gì)\b/i.test(txt) ||
              (/\ba[.)]\s+/i.test(txt) && /\bb[.)]\s+/i.test(txt));

            if (
              it.isTrueFalseSection &&
              !isSelfEssayOrCase &&
              !/đúng\s*hay\s*sai|đúng\s*\/\s*sai|nhận\s*định|là\s*gì|\?/i.test(txt)
            ) {
              const singleLineStmt = txt.replace(/\s*\n+\s*/g, ' ').replace(/^["“”']+|["“”']+$/g, '').trim();
              return `Nhận định: "${singleLineStmt}". Nhận định này Đúng hay Sai? Giải thích vì sao.`;
            }
            return txt;
          });
        }
      }
    }

    // 3. Kiểm tra đánh số inline trên cùng 1 dòng: "Câu 1: ... Câu 2: ..." hoặc "1. ... 2. ..."
    const inlineParts = raw
      .split(/(?:^|\s+)(?=(?:câu\s*\d+\s*[:.)]|nhận\s*định\s*\d+\s*[:.)]|\d{1,2}[.)]\s+[A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ"“]))/i)
      .map((s) => s.trim())
      .filter(Boolean);

    if (inlineParts.length >= 2) {
      const markerStart = /^(?:câu\s*\d+|nhận\s*định\s*\d+|\d{1,2})[.:)]\s*/i;
      const markedCount = inlineParts.filter((p) => markerStart.test(p)).length;
      if (markedCount >= 2 && !isCaseStudyNarrative(inlineParts[0].replace(markerStart, ''))) {
        const cleaned = inlineParts
          .map((p) => stripLeadingScore(p.replace(markerStart, '').trim()))
          .filter((p) => p.length >= 10);
        if (cleaned.length >= 2) {
          return cleaned.slice(0, 12);
        }
      }
    }

    // 4. Nhiều dòng độc lập không đánh số (mỗi dòng là 1 câu hỏi có dấu ? hoặc 1 câu nhận định độc lập)
    const contentLines = rawLines.filter((l) => !isSectionHeaderLine(l) && !isPureScoreLine(l));
    if (contentLines.length >= 2 && contentLines.length <= 8) {
      const allLinesSubstantial = contentLines.every((l) => l.length >= 15 && !isCaseStudyNarrative(l));
      const questionLinesCount = contentLines.filter((l) => l.endsWith('?') || /\b(là gì|như thế nào|đúng hay sai|phân biệt|so sánh|trình bày|phân tích)\b/i.test(l)).length;
      if (allLinesSubstantial && questionLinesCount >= 2) {
        return contentLines;
      }
    }

    // 5. Trên 1 dòng nhưng có nhiều câu hỏi kết thúc bằng dấu '?' hỏi về các chủ đề KHÁC NHAU
    if (raw.includes('?')) {
      const qSegments = raw
        .split(/\?+/)
        .map((s) => s.trim())
        .filter((s) => s.length >= 12);

      if (qSegments.length >= 2 && !isCaseStudyNarrative(raw)) {
        const compoundFollowUpStarter = /^(?:hãy\s+|và\s+)?(?:phân\s*tích|cho\s*ví\s*dụ|lấy\s*ví\s*dụ|nêu\s*ví\s*dụ|ví\s*dụ|giải\s*thích|tại\s*sao|vì\s*sao|nêu\s*rõ|trình\s*bày\s*cấu\s*trúc|trình\s*bày\s*đặc\s*điểm|cấu\s*trúc|cơ\s*cấu|đặc\s*điểm|ý\s*nghĩa|vai\s*trò)/i;
        const independentQuestions: string[] = [`${qSegments[0]}?`];

        for (let i = 1; i < qSegments.length; i++) {
          const seg = qSegments[i].replace(/^[.,;:\-–—\s]+/, '').trim();
          if (!seg) continue;
          const prevConcept = RagService.extractCoreTopicKeyword(independentQuestions[independentQuestions.length - 1]);
          const segLower = seg.toLowerCase();
          const sharesSameConcept = prevConcept && segLower.includes(prevConcept);

          if (compoundFollowUpStarter.test(seg) || sharesSameConcept) {
            independentQuestions[independentQuestions.length - 1] += ` ${seg}?`;
          } else if (
            /\b(là gì|như thế nào|đúng hay sai|phân biệt|so sánh|bao nhiêu tuổi|gồm những gì|cơ quan nào|ngành luật nào)\b/i.test(seg)
          ) {
            independentQuestions.push(`${seg}?`);
          } else {
            independentQuestions[independentQuestions.length - 1] += ` ${seg}`;
          }
        }

        if (independentQuestions.length >= 2) {
          return independentQuestions.slice(0, 8);
        }
      }
    }

    return [raw];
  }

  /**
   * Trích xuất cụm danh từ pháp lý cốt lõi trong câu hỏi để kiểm tra xem 2 vế câu hỏi có cùng chủ đề hay không
   */
  public static extractCoreTopicKeyword(query: string): string | null {
    const q = query.toLowerCase();
    const coreTopics = [
      'quy phạm pháp luật',
      'quan hệ pháp luật',
      'vi phạm pháp luật',
      'trách nhiệm pháp lý',
      'năng lực pháp luật',
      'năng lực hành vi',
      'văn bản quy phạm pháp luật',
      'thực hiện pháp luật',
      'áp dụng pháp luật',
      'sự kiện pháp lý',
      'pháp chế xã hội chủ nghĩa',
      'bộ máy nhà nước',
      'hình thức nhà nước',
      'bản chất nhà nước',
      'giao dịch dân sự',
      'hợp đồng dân sự',
      'quyền sở hữu',
      'thừa kế',
      'tội phạm',
      'hình phạt',
      'phòng vệ chính đáng',
      'tình thế cấp thiết',
      'vi phạm hành chính',
      'tham nhũng'
    ];
    for (const topic of coreTopics) {
      if (q.includes(topic)) return topic;
    }
    return null;
  }

  /**
   * Nâng cấp 3: Phát hiện câu hỏi đơn nhưng đa yêu cầu (Compound Single-Question Requirements)
   * Ví dụ: "Quy phạm pháp luật là gì? Phân tích cấu trúc của quy phạm pháp luật và lấy ví dụ minh họa."
   */
  public static detectCompoundRequirements(query: string): {
    needsQpplStruct: boolean;
    needsVpplElements: boolean;
    needsExample: boolean;
  } {
    const q = (query || '').toLowerCase();
    const needsQpplStruct =
      (q.includes('quy phạm pháp luật') || q.includes('qppl')) &&
      (q.includes('cấu trúc') || q.includes('cơ cấu') || q.includes('3 bộ phận') || q.includes('ba bộ phận') || (q.includes('giả định') && q.includes('chế tài')));

    const needsVpplElements =
      (q.includes('vi phạm pháp luật') || q.includes('vppl') || q.includes('cấu thành tội phạm')) &&
      (q.includes('cấu thành') || q.includes('4 yếu tố') || q.includes('bốn yếu tố') || (q.includes('mặt khách quan') && q.includes('mặt chủ quan')));

    const needsExample =
      q.includes('ví dụ') || q.includes('minh họa') || q.includes('cho vd');

    return {
      needsQpplStruct,
      needsVpplElements,
      needsExample
    };
  }

  /**
   * Giai đoạn 2: Truy xuất Ngữ cảnh Kép (Hybrid Retrieval)
   */
  public static async retrieveContext(query: string, intentCode: ExamArchetype): Promise<{
    articles: ILawArticle[];
    principle?: ITextbookPrinciple | null;
    promptContext: string;
  }> {
    if (intentCode === 'OUT_OF_SCOPE') {
      return {
        articles: [],
        principle: null,
        promptContext: ''
      };
    }

    // 1. Quét bảng nguyên lý giáo trình chuẩn
    const principle = await TextbookPrinciple.findOne({ topicCode: intentCode });

    // 2. Quét văn bản luật thực định theo đặc thù dạng đề
    let matchedArticles: ILawArticle[] = [];

    switch (intentCode) {
      case 'DEFINITION':
        matchedArticles = await LawArticle.find({
          $or: [
            { articleId: 'BLDS2015_D1' },
            { articleId: 'BLDS2015_D3' }
          ]
        }).limit(2);
        break;

      case 'TRUE_FALSE': {
        const qL = query.toLowerCase();
        if (qL.includes('văn bản') || qL.includes('quy phạm pháp luật') || qL.includes('áp dụng pháp luật')) {
          matchedArticles = await LawArticle.find({
            $or: [
              { articleId: 'BLDS2015_D1' },
              { articleId: 'BLDS2015_D74' }
            ]
          }).limit(2);
        } else if (qL.includes('thực hiện pháp luật') || qL.includes('tuân thủ') || qL.includes('thi hành')) {
          matchedArticles = await LawArticle.find({
            $or: [
              { articleId: 'BLDS2015_D1' },
              { articleId: 'BLHS2015_D8' }
            ]
          }).limit(2);
        } else if (qL.includes('năng lực hành vi') || qL.includes('18 tuổi') || qL.includes('dân sự')) {
          matchedArticles = await LawArticle.find({
            $or: [
              { articleId: 'BLDS2015_D16' },
              { articleId: 'BLDS2015_D19' },
              { articleId: 'BLDS2015_D20' }
            ]
          }).limit(3);
        } else if (qL.includes('hình sự') || qL.includes('tội phạm') || qL.includes('vppl')) {
          matchedArticles = await LawArticle.find({
            $or: [
              { articleId: 'BLHS2015_D8' },
              { articleId: 'BLHS2015_D12' },
              { articleId: 'BLHS2015_D21' }
            ]
          }).limit(3);
        } else {
          matchedArticles = await LawArticle.find({
            $or: [
              { articleId: 'BLHS2015_D21' },
              { articleId: 'BLHS2015_D22' },
              { articleId: 'BLHS2015_D12' }
            ]
          }).limit(3);
        }
        break;
      }

      case 'FAMILY_LAW':
        matchedArticles = await LawArticle.find({
          $or: [
            { articleId: 'HNGD2014_D14' },
            { articleId: 'HNGD2014_D15' },
            { articleId: 'HNGD2014_D88' },
            { articleId: 'HNGD2014_D90' },
            { articleId: 'HNGD2014_D91' },
            { articleId: 'HNGD2014_D101' }
          ]
        }).limit(6);
        break;

      case 'QPPL_STRUCT': {
        const qL = query.toLowerCase();
        if (qL.includes('hiến pháp') || qL.includes('lực lượng vũ trang')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'BLDS2015_D1' }, { articleId: 'BLDS2015_D74' }]
          }).limit(2);
        } else if (qL.includes('lừa dối') || qL.includes('đe dọa') || qL.includes('giao dịch dân sự') || qL.includes('vô hiệu')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'BLDS2015_D117' }, { articleId: 'BLDS2015_D119' }, { articleId: 'BLDS2015_D1' }]
          }).limit(3);
        } else {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'BLDS2015_D1' }, { articleId: 'BLDS2015_D74' }, { articleId: 'BLDS2015_D117' }]
          }).limit(3);
        }
        break;
      }

      case 'VPPL_4_ELEMENTS': {
        const qL = query.toLowerCase();
        if (qL.includes('ném đá') || qL.includes('cảnh sát') || qL.includes('giao thông')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'BLHS2015_D134' }, { articleId: 'BLDS2015_D584' }, { articleId: 'BLHS2015_D12' }]
          }).limit(3);
        } else if (qL.includes('xả thải') || qL.includes('nhà máy đường') || qL.includes('môi trường')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'BLDS2015_D584' }, { articleId: 'BLDS2015_D601' }, { articleId: 'BLDS2015_D74' }]
          }).limit(3);
        } else {
          matchedArticles = await LawArticle.find({
            $or: [
              { articleId: 'BLHS2015_D134' },
              { articleId: 'BLHS2015_D12' },
              { articleId: 'BLHS2015_D21' }
            ]
          }).limit(3);
        }
        break;
      }

      case 'CIVIL_INHERIT':
        matchedArticles = await LawArticle.find({
          $or: [
            { articleId: 'BLDS2015_D612' },
            { articleId: 'BLDS2015_D644' },
            { articleId: 'BLDS2015_D651' },
            { articleId: 'BLDS2015_D652' },
            { articleId: 'HNGD2014_D33' }
          ]
        }).limit(5);
        break;

      case 'CIVIL_CONTRACT':
        matchedArticles = await LawArticle.find({
          $or: [
            { articleId: 'BLDS2015_D117' },
            { articleId: 'BLDS2015_D119' },
            { articleId: 'BLDS2015_D463' },
            { articleId: 'BLDS2015_D466' },
            { articleId: 'BLDS2015_D357' },
            { articleId: 'BLHS2015_D175' }
          ]
        }).limit(6);
        break;

      case 'CRIMINAL_AGE':
        matchedArticles = await LawArticle.find({
          $or: [
            { articleId: 'BLHS2015_D12' },
            { articleId: 'BLHS2015_D9' },
            { articleId: 'BLHS2015_D173' },
            { articleId: 'BLHS2015_D168' }
          ]
        }).limit(4);
        break;

      case 'CASE_ANALYSIS': {
        const qL = query.toLowerCase();
        const articleOrList: Array<{ articleId: string }> = [];

        if (qL.includes('ném đá') || qL.includes('cảnh sát') || qL.includes('giao thông') || qL.includes('thương tích')) {
          articleOrList.push({ articleId: 'BLHS2015_D134' }, { articleId: 'BLDS2015_D584' }, { articleId: 'BLHS2015_D12' });
        } else if (qL.includes('xả thải') || qL.includes('nhà máy đường') || qL.includes('môi trường') || qL.includes('ô nhiễm')) {
          articleOrList.push({ articleId: 'BLDS2015_D584' }, { articleId: 'BLDS2015_D601' }, { articleId: 'BLDS2015_D74' });
        } else if (qL.includes('phòng vệ') || qL.includes('cấp thiết') || qL.includes('tự vệ')) {
          articleOrList.push({ articleId: 'BLHS2015_D22' }, { articleId: 'BLHS2015_D23' }, { articleId: 'BLHS2015_D134' }, { articleId: 'BLDS2015_D584' });
        } else if (qL.includes('trộm') || qL.includes('cướp')) {
          articleOrList.push({ articleId: 'BLHS2015_D168' }, { articleId: 'BLHS2015_D173' }, { articleId: 'BLHS2015_D12' });
        } else {
          articleOrList.push({ articleId: 'BLHS2015_D134' }, { articleId: 'BLDS2015_D584' }, { articleId: 'BLDS2015_D601' });
        }

        matchedArticles = await LawArticle.find({ $or: articleOrList }).limit(4);
        break;
      }

      default:
        matchedArticles = await LawArticle.find({
          $or: [
            { articleId: 'BLDS2015_D1' },
            { articleId: 'BLDS2015_D74' },
            { articleId: 'BLDS2015_D117' }
          ]
        }).limit(3);
        break;
    }

    // 2.1. Tìm kiếm bổ sung động theo từ khóa cốt lõi trong đề bài (Dynamic Lexical RAG)
    try {
      const qLower = query.toLowerCase();
      const dynamicConditions: any[] = [];

      if (intentCode !== 'DEFINITION') {
        if (qLower.includes('trộm cắp') || qLower.includes('trộm')) dynamicConditions.push({ articleId: 'BLHS2015_D173' });
        if (qLower.includes('cướp') || qLower.includes('vũ lực')) dynamicConditions.push({ articleId: 'BLHS2015_D168' });
        if (qLower.includes('thương tích') || qLower.includes('đánh') || qLower.includes('gậy') || qLower.includes('hung khí')) dynamicConditions.push({ articleId: 'BLHS2015_D134' });
        if (qLower.includes('phòng vệ') || qLower.includes('chống trả')) dynamicConditions.push({ articleId: 'BLHS2015_D22' });
        if (qLower.includes('cấp thiết')) dynamicConditions.push({ articleId: 'BLHS2015_D23' });
        if (qLower.includes('nguồn nguy hiểm') || qLower.includes('xe máy') || qLower.includes('ô tô') || qLower.includes('tai nạn') || qLower.includes('vượt đèn đỏ')) {
          dynamicConditions.push({ articleId: 'BLDS2015_D601' });
          dynamicConditions.push({ articleId: 'BLDS2015_D584' });
        }
        if (qLower.includes('thừa kế') || qLower.includes('di sản') || qLower.includes('di chúc')) {
          dynamicConditions.push({ articleId: 'BLDS2015_D612' }, { articleId: 'BLDS2015_D651' }, { articleId: 'BLDS2015_D644' });
        }
      }
      if (
        qLower.includes('vợ chồng') ||
        qLower.includes('kết hôn') ||
        qLower.includes('tài sản chung') ||
        qLower.includes('chung sống') ||
        qLower.includes('nhận con') ||
        qLower.includes('khai sinh') ||
        qLower.includes('hôn nhân')
      ) {
        dynamicConditions.push(
          { articleId: 'HNGD2014_D14' },
          { articleId: 'HNGD2014_D15' },
          { articleId: 'HNGD2014_D88' },
          { articleId: 'HNGD2014_D91' },
          { articleId: 'HNGD2014_D101' },
          { articleId: 'HNGD2014_D33' }
        );
      }
      if (qLower.includes('quan hệ pháp luật') || qLower.includes('quan hệ dân sự') || qLower.includes('pháp nhân')) {
        dynamicConditions.push({ articleId: 'BLDS2015_D1' }, { articleId: 'BLDS2015_D74' });
      }
      if (qLower.includes('tâm thần') || qLower.includes('mất nhận thức')) dynamicConditions.push({ articleId: 'BLHS2015_D21' });
      if (qLower.includes('tuổi') || qLower.includes('thành niên')) dynamicConditions.push({ articleId: 'BLHS2015_D12' }, { articleId: 'BLHS2015_D9' });
      if (qLower.includes('mượn') || qLower.includes('làm rơi') || qLower.includes('rơi vỡ')) {
        dynamicConditions.push(
          { articleId: 'BLDS2015_D494' },
          { articleId: 'BLDS2015_D496' },
          { articleId: 'BLDS2015_D584' },
          { articleId: 'BLDS2015_D585' },
          { articleId: 'BLDS2015_D156' }
        );
      }

      if (dynamicConditions.length > 0) {
        const extraArticles = await LawArticle.find({ $or: dynamicConditions }).limit(5);
        const existingIds = new Set(matchedArticles.map((a) => a.articleId));
        for (const art of extraArticles) {
          if (!existingIds.has(art.articleId)) {
            matchedArticles.push(art);
            existingIds.add(art.articleId);
          }
        }
      }
    } catch (err) {
      console.warn('⚠️ [RAG] Lỗi tìm kiếm bổ sung điều luật:', err);
    }

    // Xây dựng chuỗi ngữ cảnh kết hợp (Context Fusion)
    let contextStr = '--- BAREM GIÁO TRÌNH & CĂN CỨ LUẬT THỰC ĐỊNH ---\n';
    if (principle) {
      contextStr += `[KHUNG LÝ LUẬN BỘ GD&ĐT - ${principle.frameworkTitle}]:\n${principle.theoryContent}\n\n`;
    }

    // Tích hợp Textbook RAG từ Giáo trình Pháp luật Đại cương TMU 2021 (Hỗ trợ cả câu đơn và câu đa ý)
    const subQuestions = RagService.splitMultiQuestions(query);
    if (subQuestions.length > 1) {
      const seenSections = new Set<string>();
      for (let i = 0; i < subQuestions.length; i++) {
        const subTop = TextbookKnowledgeService.searchTopChunks(subQuestions[i], 1);
        if (subTop.length > 0 && !seenSections.has(subTop[0].chunk.sectionCode)) {
          seenSections.add(subTop[0].chunk.sectionCode);
          const tb = subTop[0].chunk;
          contextStr += `[GIÁO TRÌNH ĐH THƯƠNG MẠI 2021 (CÂU ${i + 1}) - ${tb.chapterTitle} (${tb.sectionTitle})]:\n${tb.baremContent}\n\n`;
        }
      }
    } else {
      const topTextbook = TextbookKnowledgeService.searchTopChunks(query, 1);
      if (topTextbook.length > 0) {
        const tb = topTextbook[0].chunk;
        contextStr += `[GIÁO TRÌNH ĐH THƯƠNG MẠI 2021 - ${tb.chapterTitle} (${tb.sectionTitle})]:\n${tb.baremContent}\n\n`;
      }
    }

    matchedArticles.forEach((art) => {
      contextStr += `[VĂN BẢN: ${art.lawName} - Điều ${art.articleNumber}: ${art.title}]:\n${art.contentRaw}\n\n`;
    });

    return {
      articles: matchedArticles,
      principle,
      promptContext: contextStr
    };
  }
}
