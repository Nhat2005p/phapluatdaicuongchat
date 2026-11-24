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

export interface MultipleChoiceOption {
  label: string;
  text: string;
}

export interface StructuredQueryContext {
  questionForm:
  | 'MULTIPLE_CHOICE'
  | 'SUMMARIZATION'
  | 'QPPL_DISSECTION'
  | 'STATUTE_LOOKUP'
  | 'COMPARISON'
  | 'TRUE_FALSE'
  | 'AMBIGUOUS_CONSULT'
  | 'CASE_STUDY'
  | 'CONCEPT_EXPLANATION';
  multipleChoiceOptions: MultipleChoiceOption[];
  quotedClause: string | null;
  comparisonPair: [string, string] | null;
  mentionedArticles: Array<{ articleNumber: number; lawHint?: string }>;
  isOutOfDatabaseDomain: boolean;
  isAmbiguousMissingFacts: boolean;
  conciseConstraint: boolean;
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
  queryContext?: StructuredQueryContext;
}

export class RagService {
  /**
   * BỘ LỌC LÀM SẠCH MÃ ĐỘC XSS / SQL INJECTION / NOSQL INJECTION & GIỚI HẠN ĐỘ DÀI AN TOÀN
   * Bảo vệ cả Backend lẫn Frontend khỏi thẻ <script>, event handler, và chuỗi SQLi/NoSQLi nhưng vẫn giữ nguyên câu hỏi pháp lý phía sau.
   */
  public static sanitizeSecurityPayload(raw: string): string {
    if (!raw || typeof raw !== 'string') return '';
    return raw
      .slice(0, 8000)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<\/?(?:script|iframe|object|embed|svg|img|style|link|meta)[^>]*>/gi, ' ')
      .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, ' ')
      .replace(/javascript\s*:/gi, ' ')
      .replace(/(?:['"`]\s*)?\bOR\b\s+\d+\s*=\s*\d+\s*;?/gi, ' ')
      .replace(/\b(?:DROP|TRUNCATE|ALTER)\s+TABLE\s+[\w.`"'\[\]]+\s*;?/gi, ' ')
      .replace(/\bUNION\s+(?:ALL\s+)?SELECT\b[^;?.!\n]*/gi, ' ')
      .replace(/--\s+/g, ' ')
      .replace(/\$(?:where|gt|gte|lt|lte|ne|regex)\b/gi, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * =========================================================================
   * STAGE 01: QUERY REWRITING — CHUẨN HÓA VIẾT TẮT, SỬA LỖI OCR & KHỬ NHIỄU
   * Biến câu hỏi viết tắt/đời thường thành truy vấn pháp lý chuẩn xác hơn.
   * =========================================================================
   */
  public static rewriteLegalQuery(query: string): string {
    if (!query) return '';
    let res = this.sanitizeSecurityPayload(query);
    res = res.replace(/^(?:khoan\s+đã[,.\s]*)?(?:bỏ\s+qua\s+câu\s+(?:trên|trước|vừa\s+rồi)(?:\s+đi)?|đổi\s+chủ\s+đề|sang\s+câu\s+hỏi\s+khác)[,.:!\s]*/i, '').trim();

    // 1. Sửa các lỗi OCR dính chữ 'đ' phổ biến trong đề thi (ví dụ: "quânđ ội" -> "quân đội", "quanđ ến" -> "quan đến", "quyếtđ ịnh" -> "quyết định")
    const vnLower = 'a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ';
    const vnUpper = 'A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ';
    const shiftedDRe = new RegExp(`([${vnLower}${vnUpper}])([đĐ])\\s+(ội|ến|ịnh|ồng|ầu|ược|ây|ó|iều|úng|ối|ơn|ộ|ộc|ạo|ất|ảm|áng)(?=$|[\\s.,;:?!"'“”()\\[\\]\\-–—_/\\\\])`, 'gi');
    res = res.replace(shiftedDRe, '$1 $2$3');

    // 1.1 Khử dấu gạch chéo ngược trailing do gõ nhầm (ví dụ: "không\", "gì\\")
    res = res.replace(/\\+$/g, '').trim();

    // 1.2 Chuẩn hóa một số cụm từ không dấu / gõ thiếu dấu / gõ nhầm phổ biến
    res = res.replace(/(?:^|\s)hân\s+biệt(?=$|[\s.,;:?!])/gi, ' Phân biệt')
      .replace(/(?:^|\s)iải\s+thích(?=$|[\s.,;:?!])/gi, ' Giải thích')
      .replace(/(?:^|\s)ỏ\s+qua(?=$|[\s.,;:?!])/gi, ' Bỏ qua')
      .replace(/\bkhonog\b/gi, 'không')
      .replace(/\bkhong\b/gi, 'không')
      .replace(/\bphap\s+luat\b/gi, 'pháp luật')
      .replace(/\bphap\s+ly\b/gi, 'pháp lý')
      .replace(/\bvi\s+pham\b/gi, 'vi phạm')
      .replace(/\bnghi\s+dinh\b/gi, 'nghị định')
      .replace(/\bgiet\s+nguoi\b/gi, 'giết người')
      .replace(/\btrom\s+cap\b/gi, 'trộm cắp');

    // 1.3 Chuẩn hóa ngôn ngữ đời thường sang thuật ngữ pháp lý chuẩn (Query Rewriting - dùng ranh giới tương thích tiếng Việt có dấu)
    res = res.replace(/(?:^|[\s.,;:?!"'“”()])giấy\s+tờ\s+chia\s+của(?=$|[\s.,;:?!"'“”()])/gi, (m) => `${/^\s/.test(m) ? ' ' : ''}di chúc`)
      .replace(/(?:^|[\s.,;:?!"'“”()])chia\s+của(?=$|[\s.,;:?!"'“”()])/gi, (m) => `${/^\s/.test(m) ? ' ' : ''}phân chia di sản thừa kế`)
      .replace(/(?:^|[\s.,;:?!"'“”()])tranh\s+nhau\s+mảnh\s+đất(?=$|[\s.,;:?!"'“”()])/gi, (m) => `${/^\s/.test(m) ? ' ' : ''}tranh chấp quyền sử dụng đất thừa kế`)
      .replace(/(?:^|[\s.,;:?!"'“”()])chia\s+kiểu\s+gì(?=$|[\s.,;:?!"'“”()])/gi, (m) => `${/^\s/.test(m) ? ' ' : ''}chia di sản thừa kế theo pháp luật như thế nào`);

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
    res = res.replace(/\(\s*\d+(?:[.,]\d+)?\s*điểm\s*\)/gi, ' ');
    // Chuẩn hóa khoảng trắng ngang (spaces, tabs) mà KHÔNG xóa các dấu ngắt dòng \n
    res = res.replace(/[^\S\r\n]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

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
    if (rewritten) variants.add(rewritten.slice(0, 500));
    if (coreStatement && coreStatement.length >= 10) variants.add(coreStatement.slice(0, 500));
    if (expanded && expanded !== rewritten) variants.add(expanded.slice(0, 500));

    // Giới hạn cứng tối đa 3 sub-queries để tránh lặp/chậm ở bước Query Transformation
    return Array.from(variants).slice(0, 3);
  }

  /**
   * BỘ LỌC TIỀN KIỂM AN TOÀN & CHỐNG PROMPT INJECTION (INPUT SAFETY GUARDRAIL)
   * Phát hiện sớm các lệnh tấn công hệ thống (jailbreak, ignore instructions, lộ system prompt, hướng dẫn phạm tội)
   */
  public static checkInputSafetyAndInjection(query: string): {
    isBlocked: boolean;
    violationType?: 'PROMPT_INJECTION' | 'ILLEGAL_ASSISTANCE';
    reason?: string;
  } {
    const q = (query || '').toLowerCase();
    const injectionPatterns = [
      /(?:bỏ|ỏ)\s*qua\s+(?:mọi\s+|tất\s+cả\s+|toàn\s+bộ\s+|các\s+|hết\s+)?(?:hướng\s+dẫn|quy\s+tắc|chỉ\s+thị|lệnh)/i,
      /quên\s+(?:hết\s+|mọi\s+|tất\s+cả\s+)?(?:các\s+)?(?:quy\s+tắc|hướng\s+dẫn)/i,
      /ignore\s+(?:all\s+)?(?:previous\s+)?instructions/i,
      /system\s*prompt/i,
      /in\s+(?:nguyên\s+văn\s+|ra\s+|toàn\s+bộ\s+)?(?:system\s*prompt|cấu\s+trúc\s+barem|cấu\s+hình\s+nội\s+bộ)/i,
      /hiển\s+thị\s+system\s*prompt/i,
      /hãy\s+đóng\s+vai\s+(?:một\s+)?(?:tội\s+phạm|trùm\s+xã\s+hội\s+đen|kẻ\s+lừa\s+đảo|luật\s+sư\s+đen|chủ\s+nợ)/i
    ];
    for (const rx of injectionPatterns) {
      if (rx.test(q)) {
        return {
          isBlocked: true,
          violationType: 'PROMPT_INJECTION',
          reason: 'Phát hiện truy vấn chứa chỉ thị thao túng vai trò hệ thống (Prompt Injection).'
        };
      }
    }

    const illegalAssistPatterns = [
      /(?:hướng dẫn|bày cách|chỉ cách|chỉ cho tôi cách|làm sao để)[^.?]{0,45}(?:làm giả giấy tờ|làm giả con dấu|rửa tiền|trốn thuế|lách thuế|né thuế|tẩu tán tài sản)/i,
      /(?:soạn\s+thảo|soạn|lập|làm|viết|ký)\s+hợp\s+đồng[^.?]{0,50}(?:hai\s+giá|2\s+giá)/i,
      /(?:hai\s+giá|2\s+giá)[^.?]{0,120}(?:trốn\s+thuế|né\s+thuế|khai\s+thuế|cơ\s+quan\s+thuế|không\s+thể\s+phát\s+hiện|không\s+bị\s+phát\s+hiện)/i
    ];
    for (const rx of illegalAssistPatterns) {
      if (rx.test(q)) {
        return {
          isBlocked: true,
          violationType: 'ILLEGAL_ASSISTANCE',
          reason: 'Từ chối hỗ trợ hướng dẫn thực hiện hành vi vi phạm điều cấm của pháp luật.'
        };
      }
    }

    return { isBlocked: false };
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
    const queryContext = this.analyzeQueryContext(rewrittenQuery);

    const targetSources: Array<'SFT_EXAM_CORPUS' | 'TEXTBOOK_KNOWLEDGE' | 'STATUTORY_LAWS' | 'DYNAMIC_CASE_SOLVER'> = [];
    if (intentCode !== 'OUT_OF_SCOPE' && !queryContext.isOutOfDatabaseDomain) {
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
      quantifierFlags,
      queryContext
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

    if (q.length > 110) return false;
    if (/(?:luật|nghị quyết|quyết định|thông tư|nghị định|công ty|doanh nghiệp|thủ tục|tình huống|giả định|một cửa)/i.test(q)) {
      return false;
    }

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
      q.includes('mô hình của bạn') ||
      (q.includes('giới thiệu') && (q.includes('bản thân') || q.includes('về bạn'))) ||
      (q.includes('bạn') && q.includes('mô hình') && (q.includes('gì') || q.includes('nào') || q.includes('ai')))
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
    if (/(?:^|[\s.,;:?!"'“”()])(?:điều|khoản|điểm)\s+\d+/i.test(query)) return true;
    if (/(?:^|[\s.,;:?!"'“”()])(?:blhs|blds|blld|hngd|vbqppl|luật|nghị định|thông tư|hiến pháp|pháp lệnh|nghị quyết|quyết định|án lệ)(?=$|[\s.,;:?!"'“”()\d])/i.test(query)) return true;

    // Check chapter patterns: "chương 1", "chương 2", "chương 7", "chương vii", etc.
    if (/(?:^|[\s.,;:?!"'“”()])chương\s+(?:\d+|i{1,3}|iv|v|vi|vii|viii|ix|x)(?=$|[\s.,;:?!"'“”()])/i.test(query)) return true;

    // Check legal vocabulary of General Law (Pháp luật Đại cương - Đầy đủ 9 Chương)
    const legalKeywords = [
      // 1. Lý luận chung về Nhà nước & Pháp luật (Chương 1 - 5)
      'nhà nước', 'pháp luật', 'quy phạm', 'quan hệ pháp luật', 'vi phạm', 'trách nhiệm pháp lý',
      'chế tài', 'giả định', 'quy định', 'tính giai cấp', 'tính xã hội', 'quyền lực', 'chủ quyền',
      'bộ máy nhà nước', 'hình thức nhà nước', 'kiểu nhà nước', 'chính thể', 'cấu trúc', 'chế độ chính trị',
      'cộng sản nguyên thủy', 'thị tộc', 'bộ lạc', 'mác lênin', 'đảng cộng sản',
      'nguồn của pháp luật', 'hệ thống pháp luật', 'văn bản quy phạm', 'thực hiện pháp luật',
      'tập quán', 'tập quán pháp', 'tiền lệ pháp', 'quy tắc xử sự',
      'tuân thủ', 'chấp hành', 'thi hành', 'sử dụng pháp luật', 'áp dụng pháp luật', 'sự kiện pháp lý',
      'năng lực pháp luật', 'năng lực hành vi', 'lỗi cố ý', 'lỗi vô ý', 'có lỗi', 'hình thức lỗi', 'xác định lỗi', 'loại lỗi', 'lỗi của', 'vô ý', 'cố ý',
      'phòng vệ chính đáng', 'tình thế cấp thiết', 'đúng hay sai', 'đúng sai', 'nhận định', 'so sánh', 'phân biệt', 'đối chiếu', 'bản chất', 'pháp chế', 'cơ cấu',
      'pháp quyền', 'cưỡng chế', 'chế tài hình sự', 'chế tài hành chính', 'chế tài dân sự', 'chế tài kỷ luật',
      'pháp lý', 'hậu quả pháp lý', 'căn cứ pháp lý', 'tình huống', 'hợp pháp', 'bất hợp pháp', 'trái luật', 'thẩm quyền', 'công quyền', 'bãi nhiệm', 'miễn nhiệm', 'tín nhiệm',
      'dữ liệu cá nhân', 'sinh trắc học', 'tiếp cận thông tin', 'trách nhiệm giải trình', 'chính quyền địa phương', 'cấp huyện', 'cấp xã', 'cấp tỉnh',

      // 2. Chương 6: Nội dung cơ bản Luật Dân sự
      'dân sự', 'giao dịch', 'giao dịch dân sự', 'vô hiệu', 'hợp đồng', 'pháp nhân', 'tư cách pháp nhân',
      'nhân thân', 'quan hệ nhân thân', 'quyền nhân thân', 'tài sản', 'quyền tài sản', 'quyền sở hữu',
      'chiếm hữu', 'sử dụng', 'định đoạt', 'thừa kế', 'di sản', 'di chúc', 'chia của', 'giấy tờ chia của', 'chia đất', 'tranh nhau mảnh đất', 'hàng thừa kế', 'thế vị',
      'bồi thường', 'thiệt hại', 'bồi thường thiệt hại', 'nghĩa vụ', 'đại diện', 'thời hiệu', 'hợp đồng vay',
      'đặt cọc', 'cầm cố', 'thế chấp', 'hạn chế quyền dân sự', 'vô hiệu từng phần', 'xe đạp', 'mua bán xe',

      // 3. Chương 7: Nội dung cơ bản Luật Hình sự & Tố tụng
      'hình sự', 'tố tụng', 'tội phạm', 'tội danh', 'tội', 'phạm tội', 'đồng phạm', 'người thực hành', 'người tổ chức',
      'người xúi giục', 'người giúp sức', 'chủ mưu', 'cấu thành tội phạm', 'khách thể của tội phạm',
      'chủ thể của tội phạm', 'mặt khách quan của tội phạm', 'mặt chủ quan của tội phạm',
      'hình phạt', 'tử hình', 'tù chung thân', 'tù có thời hạn', 'cải tạo không giam giữ', 'cảnh cáo',
      'trục xuất', 'hình phạt chính', 'hình phạt bổ sung', 'miễn trách nhiệm hình sự', 'xóa án tích',
      'phòng vệ', 'cấp thiết', 'sự kiện bất ngờ', 'độ tuổi', 'tuổi chịu', 'chưa thành niên',
      'chuẩn bị phạm tội', 'phạm tội chưa đạt', 'tự ý nửa chừng', 'tái phạm',
      'giết', 'tước đoạt tính mạng', 'tử vong', 'qua đời', 'thiệt mạng', 'cấp cứu', 'sốc phản vệ', 'đâm', 'chém', 'bắn', 'trộm', 'cướp', 'lừa đảo', 'chiếm đoạt',
      'đánh người', 'hành hung', 'thương tích', 'đi tù', 'phạt tù', 'bị bắt',
      'tạm giam', 'bắt người', 'bắt người bị giữ', 'án lệ', 'kháng cáo', 'vu khống', 'bịa đặt',
      'giấy viết tay', 'công chứng', 'chứng thực', 'mua đất', 'mua nhà', 'chuyển nhượng đất', 'sổ đỏ',

      // 4. Chương 8 & 9: Luật Hành chính & Phòng, chống tham nhũng
      'hành chính', 'quản lý nhà nước', 'xử phạt', 'vi phạm hành chính', 'xử phạt vi phạm hành chính',
      'biện pháp ngăn chặn', 'tạm giữ', 'khám xét', 'giam xe', 'giữ xe', 'tạm giữ xe', 'công an', 'cảnh sát', 'csgt', 'thổi còi',
      'nồng độ cồn', 'ngà ngà say', 'say rượu', 'say bia', 'nhậu', 'uống rượu', 'uống bia',
      'vượt đèn', 'vượt đèn đỏ', 'đèn đỏ', 'chuyển đỏ', 'giao thông', 'xử lý', 'xử lí', 'bị phạt', 'phạt tiền', 'tước bằng', 'tước giấy phép', 'tai nạn', 'va chạm',
      'tham nhũng', 'vụ lợi', 'chức vụ', 'quyền hạn', 'kê khai tài sản', 'hối lộ', 'nhận hối lộ', 'tham ô', 'vũ trụ', 'hàng không vũ trụ',

      // 5. Luật Hiến pháp, Hôn nhân gia đình, Lao động
      'hiến pháp', 'luật hiến pháp', 'quốc hội', 'chính phủ', 'chủ tịch nước', 'tòa án', 'viện kiểm sát',
      'hội đồng nhân dân', 'ủy ban nhân dân', 'quyền con người', 'quyền công dân', 'nghĩa vụ công dân',
      'kết hôn', 'ly hôn', 'hôn nhân', 'gia đình', 'lao động', 'tiền lương', 'mức lương', 'thử việc', 'tuyển dụng',
      'lương thử việc', 'trợ cấp thôi việc', 'trợ cấp thất nghiệp', 'thời giờ làm việc', 'biệt tích', 'mất tích',
      'sa thải', 'kỷ luật lao động', 'nuôi con nhỏ', 'mang thai', 'thai sản', 'hợp đồng lao động',
      'đuổi việc', 'nghỉ việc', 'trốn thuế', 'né thuế', 'đòi nợ', 'laptop', 'xe ô tô', 'ô tô', 'ủy quyền ly hôn', 'ủy quyền ra tòa'
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
    // Tránh bắt nhầm câu hỏi tình huống kể chuyện có từ "chỉ có", "khẳng định", "đều là", hoặc bài tập tình huống hỏi "Lập luận của anh A đúng hay sai? Giải quyết theo pháp luật?"
    const qMarkCount = (q.match(/\?/g) || []).length;
    const isCaseDisputeQuestion =
      !q.includes('nhận định') &&
      !q.includes('nhận địn') &&
      (
        /(?:lập luận|ý kiến|quan điểm|yêu cầu|lý lẽ|quyết định(?:\s+[a-zà-ỹ]+){0,3}|hành vi|việc làm|xử lý)\s+của\s+(?:anh|chị|ông|bà|bạn|em|bên|công ty|giám đốc|người)\b/i.test(q) ||
        q.includes('giải quyết theo pháp luật') ||
        q.includes('giải quyết tranh chấp') ||
        q.includes('giải quyết tình huống') ||
        (q.length >= 160 && /\n\s*(?:câu\s*hỏi|hỏi|yêu\s*cầu)\s*[:.]?\s*\n/i.test(query))
      );
    const isNarrativeScenario =
      isCaseDisputeQuestion ||
      (
        !q.includes('đúng hay sai') &&
        !q.includes('đúng/sai') &&
        !q.includes('nhận định') &&
        (
          qMarkCount >= 2 ||
          (q.length > 90 && (
            /(?:^|[\s.,;:?!()])(?:anh|chị|ông|bà|em|sinh viên|chủ nhà|chủ trọ|chủ quán|shipper|người bán|một người|một cơ quan|một quy định|một thông tư|giám đốc|nhân viên|hàng xóm)\b/i.test(q) ||
            /(?:^|[\s.,;:?!()])(?:a\s+bán|a\s+và\s+b|a\s+bị\s+b|a\s+có\s+ý\s+định|a,\s*b\s+và\s+c)/i.test(q)
          ))
        )
      );

    if (
      !isCaseDisputeQuestion &&
      (
        q.includes('đúng hay sai') ||
        q.includes('đúng/sai') ||
        q.includes('nhận định') ||
        q.includes('nhận địn') ||
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
        (!isNarrativeScenario && (
          q.includes('khẳng định') ||
          q.includes('đều là') ||
          q.includes('đều được') ||
          q.includes('đều phải') ||
          q.includes('luôn luôn') ||
          q.includes('luôn là') ||
          q.includes('không bao giờ') ||
          q.includes('chỉ có')
        )) ||
        (q.includes('tuân thủ') && q.includes('thi hành')) ||
        (q.includes('thực hiện pháp luật') && (q.includes('hành động') || q.includes('không hành động'))) ||
        q.includes('chỉ thuộc về một giai cấp') ||
        q.includes('là một bộ máy cưỡng chế đặc biệt') ||
        q.includes('gắn liền với xã hội có giai cấp')
      )
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
      (q.includes('quy phạm pháp luật') && !q.includes('văn bản quy phạm pháp luật')) ||
      q.includes('cơ cấu của quy phạm') ||
      q.includes('3 bộ phận') ||
      q.includes('quan hệ pháp luật') ||
      q.includes('cơ cấu của quan hệ pháp luật') ||
      q.includes('cơ cấu quan hệ pháp luật') ||
      q.includes('quan hệ pháp luật dân sự')
    ) {
      return 'QPPL_STRUCT';
    }

    // 5. Dạng Bài tập Hợp đồng Vay tài sản & Giao dịch vay nợ (CIVIL_CONTRACT - CHỈ nhận diện khi trọng tâm thực sự hỏi về vay tiền / giấy vay nợ, TUYỆT ĐỐI không bắt nhầm đặt cọc mua xe/mua bán tài sản!)
    if (
      (q.includes('giấy vay') ||
        q.includes('vay tài sản') ||
        q.includes('hợp đồng vay') ||
        q.includes('vay tiền') ||
        q.includes('vi phạm nghĩa vụ trả nợ') ||
        q.includes('giao dịch vay') ||
        (q.includes('vay') && (q.includes('trả nợ') || q.includes('đến hạn')))) &&
      !q.includes('đặt cọc') &&
      !q.includes('phạt cọc') &&
      !q.includes('tiền trả trước') &&
      !q.includes('mua bán') &&
      !q.includes('mua chiếc') &&
      !q.includes('laptop') &&
      !q.includes('làm rơi') &&
      !q.includes('rơi vỡ')
    ) {
      return 'CIVIL_CONTRACT';
    }

    // 6. Dạng Bài tập Tình huống Đa yêu cầu / Bồi thường thiệt hại / Đặt cọc / Súc vật / Hồi tố / Che giấu / Phân loại tội phạm (CASE_ANALYSIS)
    if (
      q.includes('đặt cọc') ||
      q.includes('phạt cọc') ||
      q.includes('tiền trả trước') ||
      q.includes('con chó') ||
      q.includes('chó dữ') ||
      q.includes('chó săn') ||
      q.includes('súc vật') ||
      q.includes('che giấu tội phạm') ||
      q.includes('không tố giác') ||
      q.includes('thuộc loại tội phạm') ||
      (q.includes('hiệu lực hồi tố') && (q.includes('anh ') || q.includes('ông ') || q.includes('bà ') || q.includes('chị '))) ||
      q.includes('phòng vệ chính đáng') ||
      q.includes('tình thế cấp thiết') ||
      q.includes('truy sát') ||
      q.includes('thoát thân') ||
      q.includes('gây tai nạn') ||
      (q.includes('tai nạn') && (q.includes('chết') || q.includes('bỏ trốn') || q.includes('thương tích'))) ||
      q.includes('làm rơi') ||
      q.includes('rơi vỡ') ||
      (q.includes('laptop') && (q.includes('rơi') || q.includes('vỡ') || q.includes('hỏng') || q.includes('mượn'))) ||
      (q.includes('mượn') && (q.includes('hỏng') || q.includes('vỡ') || q.includes('bồi thường') || q.includes('tai nạn'))) ||
      q.includes('vượt đèn đỏ') ||
      q.includes('vượt đèn') ||
      q.includes('giam xe') ||
      q.includes('nồng độ cồn') ||
      q.includes('say rượu') ||
      q.includes('uống rượu') ||
      q.includes('nhậu') ||
      q.includes('ai phải bồi thường') ||
      q.includes('phải bồi thường') ||
      q.includes('chịu trách nhiệm bồi thường') ||
      q.includes('làm đổ') ||
      q.includes('bị bỏng') ||
      (q.includes('đuổi theo') && q.includes('đánh')) ||
      q.includes('dùng gậy') ||
      q.includes('dùng ghế') ||
      q.includes('dùng dùi cui') ||
      q.includes('đập phá') ||
      (q.includes('sa thải') && (q.includes('công ty') || q.includes('giám đốc') || q.includes('nuôi con') || q.includes('mang thai'))) ||
      q.includes('sốc phản vệ') ||
      q.includes('tử vong') ||
      q.includes('qua đời') ||
      q.includes('hình thức lỗi') ||
      q.includes('xác định lỗi') ||
      q.includes('giết') ||
      q.includes('tước đoạt tính mạng') ||
      q.includes('chém') ||
      q.includes('đâm') ||
      q.includes('bắn') ||
      q.includes('cướp') ||
      q.includes('trộm') ||
      q.includes('lừa đảo') ||
      q.includes('chiếm đoạt')
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
    const isNonCriminalAgeTopic =
      q.includes('thử việc') ||
      q.includes('lao động') ||
      q.includes('kết hôn') ||
      q.includes('hôn nhân') ||
      q.includes('giao dịch') ||
      q.includes('mua bán') ||
      q.includes('mua xe') ||
      q.includes('hợp đồng') ||
      q.includes('năng lực hành vi dân sự');

    if (
      !isNonCriminalAgeTopic &&
      (
        q.includes('độ tuổi') ||
        q.includes('chưa thành niên') ||
        q.includes('13 tuổi') ||
        q.includes('14 tuổi') ||
        q.includes('15 tuổi') ||
        q.includes('16 tuổi') ||
        q.includes('17 tuổi') ||
        (q.includes('tuổi') && (q.includes('chịu trách nhiệm') || q.includes('phạm tội') || q.includes('tội này')))
      )
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
  /**
   * =========================================================================
   * STAGE 01.5: PHÂN TÍCH NGỮ CẢNH CÂU HỎI CÓ CẤU TRÚC (STRUCTURED QUERY CONTEXT)
   * Tách dạng câu hỏi, lựa chọn trắc nghiệm, mệnh đề trích dẫn, cặp thực thể so sánh
   * và phát hiện sớm câu hỏi thiếu dữ kiện hoặc ngoài kho dữ liệu.
   * =========================================================================
   */
  public static analyzeQueryContext(rawQuery: string): StructuredQueryContext {
    const query = this.rewriteLegalQuery(rawQuery || '');
    const qLower = query.toLowerCase();

    const isOutOfDatabaseDomain =
      /(?:mặt trăng|sao hỏa|ngoài hành tinh|thiên hà|xuyên không|ma thuật|phép thuật|năm 3000|hàng không vũ trụ)/i.test(
        qLower
      );

    // 1. Bóc tách các phương án trắc nghiệm A/B/C/D (ví dụ: "A. ... | B. ... | C. ... | D. ...")
    const multipleChoiceOptions: MultipleChoiceOption[] = [];
    const mcRegex = /(?:^|[\s|;,\n])([A-D])[.)]\s*([^|;\n]+?)(?=(?:[\s|;,\n]+[A-D][.)]\s)|$)/g;
    let mcMatch: RegExpExecArray | null;
    while ((mcMatch = mcRegex.exec(query)) !== null) {
      const label = mcMatch[1].toUpperCase();
      const text = mcMatch[2].replace(/[.|;\s]+$/g, '').trim();
      if (text && !multipleChoiceOptions.some((o) => o.label === label)) {
        multipleChoiceOptions.push({ label, text });
      }
    }

    // 2. Bóc tách câu trích dẫn trong ngoặc kép (phục vụ bóc tách QPPL hoặc nhận định Đúng/Sai)
    const quoteMatch = query.match(/"([^"]{12,350})"/) || query.match(/“([^”]{12,350})”/);
    const quotedClause = quoteMatch ? quoteMatch[1].trim() : null;

    // 3. Bóc tách cặp thực thể so sánh (ví dụ: "Phân biệt X và Y dựa trên...")
    let comparisonPair: [string, string] | null = null;
    const cmpMatch = query.match(
      /(?:so\s+sánh|phân\s+biệt)(?:\s+sự\s+khác\s+nhau\s+giữa|\s+vị\s+trí,?\s+tính\s+chất\s+pháp\s+lý\s+của|\s+giữa)?\s+([^,.;?]+?)\s+(?:và|với|vs\.?)\s+([^,.;?]+?)(?=\s+(?:theo|dựa\s+trên|về|trong|đồng\s+thời)|[?.!]|$)/i
    );
    if (cmpMatch && cmpMatch[1] && cmpMatch[2]) {
      comparisonPair = [cmpMatch[1].trim(), cmpMatch[2].trim()];
    }

    // 4. Bóc tách số Điều và Tên Luật được nhắc tới
    const mentionedArticles: Array<{ articleNumber: number; lawHint?: string }> = [];
    const artRegex = /điều\s+(\d+)(?:\s+([^\n,.;?]{3,45}))?/gi;
    let aMatch: RegExpExecArray | null;
    while ((aMatch = artRegex.exec(query)) !== null) {
      mentionedArticles.push({
        articleNumber: parseInt(aMatch[1], 10),
        lawHint: aMatch[2] ? aMatch[2].trim() : undefined
      });
    }

    // 5. Nhận diện câu hỏi tư vấn thực tế ngắn bị mơ hồ / thiếu dữ kiện định lượng (KHÔNG dùng \b của ASCII cho tiếng Việt có dấu như đ, ă, ơ, ư)
    const hasQuantitativeFacts = /\d+\s*(?:%|triệu|tỷ|nghìn|tuổi|mg|lít|cm)(?=$|[\s.,;:?!"'“”()/])/i.test(query);
    const isAmbiguousMissingFacts =
      !hasQuantitativeFacts &&
      query.length < 160 &&
      ((/(?:đánh người|hành hung|gây thương tích|chém người)/i.test(qLower) && /(?:mấy năm|bao nhiêu năm|đi tù|phạt|xử lý)/i.test(qLower)) ||
        (/(?:ăn trộm|trộm cắp|lấy trộm)/i.test(qLower) && /(?:mấy năm|bao nhiêu năm|đi tù|bị phạt|phạt thế nào)/i.test(qLower)) ||
        (/(?:giấy viết tay|giấy tay|không công chứng)/i.test(qLower) && /(?:mua đất|mua nhà|bán đất|chuyển nhượng|hợp lệ)/i.test(qLower)));

    const conciseConstraint =
      qLower.includes('chỉ chọn 1 đáp án') ||
      qLower.includes('giải thích đúng 1 câu') ||
      qLower.includes('ngắn gọn trong 1 câu') ||
      qLower.includes('tóm tắt');

    let questionForm: StructuredQueryContext['questionForm'] = 'CONCEPT_EXPLANATION';
    if (multipleChoiceOptions.length >= 3) {
      questionForm = 'MULTIPLE_CHOICE';
    } else if (
      (qLower.includes('tóm tắt') || qLower.includes('rút gọn') || qLower.includes('gạch đầu dòng ngắn gọn')) &&
      query.length > 140
    ) {
      questionForm = 'SUMMARIZATION';
    } else if (
      (qLower.includes('giả định') || qLower.includes('chế tài') || qLower.includes('3 bộ phận') || qLower.includes('bộ phận nào bị ẩn')) &&
      (quotedClause !== null || qLower.includes('quy phạm'))
    ) {
      questionForm = 'QPPL_DISSECTION';
    } else if (isAmbiguousMissingFacts) {
      questionForm = 'AMBIGUOUS_CONSULT';
    } else if (qLower.includes('so sánh') || qLower.includes('phân biệt')) {
      questionForm = 'COMPARISON';
    } else if (qLower.includes('đúng hay sai') || qLower.includes('nhận định') || qLower.includes('đúng không')) {
      questionForm = 'TRUE_FALSE';
    } else if (mentionedArticles.length > 0 && (qLower.includes('nội dung') || qLower.includes('quy định gì') || qLower.includes('giải thích điều'))) {
      questionForm = 'STATUTE_LOOKUP';
    } else if (/(?:^|[\s.,;:?!"'“”()])(ông|bà|anh|chị|sinh viên|công ty|doanh nghiệp)(?=$|[\s.,;:?!"'“”()])/i.test(qLower)) {
      questionForm = 'CASE_STUDY';
    }

    return {
      questionForm,
      multipleChoiceOptions,
      quotedClause,
      comparisonPair,
      mentionedArticles,
      isOutOfDatabaseDomain,
      isAmbiguousMissingFacts,
      conciseConstraint
    };
  }

  public static contextualizeQueryWithHistory(
    query: string,
    previousQuery?: string | null,
    previousResponse?: string | null
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

    // Nếu người dùng chủ động đổi chủ đề ("Khoan đã, bỏ qua câu trên đi...", "Sang câu khác...", "Đổi chủ đề...") -> XÓA BỎ NGỮ CẢNH CŨ!
    const topicResetRegex = /^(?:khoan\s+đã[,.\s]*)?(?:bỏ\s+qua\s+câu\s+(?:trên|trước|vừa\s+rồi)(?:\s+đi)?|đổi\s+chủ\s+đề|sang\s+câu\s+hỏi\s+khác|hỏi\s+câu\s+khác\s+nhé)[,.:!\s]*/i;
    if (topicResetRegex.test(cleanCurrent)) {
      const strippedReset = cleanCurrent.replace(topicResetRegex, '').trim();
      return {
        effectiveQuery: strippedReset || cleanCurrent,
        isContextualized: false
      };
    }

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
      'các yếu tố đó', 'yếu tố đó', 'yếu tố nào', 'yếu tố trên', 'bộ phận đó', 'bộ phận này',
      'chủ thể này', 'khái niệm này', 'vấn đề này', 'điều luật này', 'điều này',
      'vừa nêu', 'ở trên', 'điều kiện thứ', 'điều kiện số', 'giao dịch đó', 'giao dịch này', 'ý thứ', 'mục thứ', 'hình thức thứ'
    ];

    const hasAnaphora = anaphoraPatterns.some((p) => qLower.includes(p));

    // Các câu hỏi nối tiếp ngắn gọn tỉnh lược chủ đề
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

    const cleanPrev = previousQuery
      .replace(/\s*\(Ngữ cảnh câu hỏi trước:[\s\S]*?\)\s*$/i, '')
      .replace(/\s*(?:là gì|như thế nào|đúng hay sai|hãy phân tích|trình bày khái niệm)\s*\??\s*$/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 220);

    if (!cleanPrev || cleanPrev.toLowerCase() === qLower) {
      return { effectiveQuery: cleanCurrent, isContextualized: false };
    }

    // Trích xuất thêm mục số N từ câu trả lời trước nếu người dùng hỏi "điều kiện thứ N", "ý thứ N", "hình thức thứ N"
    let extractedPrevItem = '';
    const nthMatch = qLower.match(/(?:điều kiện|ý|mục|hình thức|trường hợp)\s*(?:thứ|số)\s*(\d+|nhất|hai|ba|tư|bốn)/i);
    if (nthMatch && previousResponse) {
      const wordToNum: Record<string, string> = { nhất: '1', hai: '2', ba: '3', tư: '4', bốn: '4' };
      const targetNum = wordToNum[nthMatch[1].toLowerCase()] || nthMatch[1];
      const itemRegex = new RegExp(`(?:^|\\n)\\s*(?:Điều kiện\\s*${targetNum}|${targetNum}[.)])\\s*[:\\-]?\\s*([^\\n]{8,160})`, 'i');
      const foundLine = previousResponse.match(itemRegex);
      if (foundLine && foundLine[1]) {
        extractedPrevItem = ` | Nội dung mục ${targetNum} lượt trước: ${foundLine[1].replace(/[*_`]/g, '').trim()}`;
      }
    }

    return {
      effectiveQuery: `${cleanCurrent} (Ngữ cảnh câu hỏi trước: ${cleanPrev}${extractedPrevItem})`,
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

    // 1. Không tách bài tập 4 câu trích dẫn QPPL kinh điển, đoạn điều luật/văn bản dán vào để tóm tắt/giải thích, hoặc đề bài tình huống đơn
    if (
      (rawLower.includes('điều 39') &&
        (rawLower.includes('điểm a khoản 1 điều 8') || rawLower.includes('điều 102') || rawLower.includes('điều 52'))) ||
      rawLower.includes('tóm tắt đoạn') ||
      rawLower.includes('tóm tắt quy định') ||
      rawLower.includes('đọc đoạn quy định') ||
      rawLower.includes('trình bày lại các ý cốt lõi') ||
      rawLower.includes('giải thích đơn giản') ||
      rawLower.includes('xác định cấu trúc quy phạm') ||
      rawLower.includes('xác định 3 bộ phận') ||
      rawLower.includes('xác định ba bộ phận') ||
      rawLower.includes('gạch đầu dòng ngắn gọn') ||
      rawLower.includes('chỉ chọn 1 đáp án') ||
      /^(?:đề\s*bài\s*)?tình\s*huống\s*:/i.test(raw)
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
          !/(?:^|[\s.,;:?!"'“”()])(ông|bà|anh|chị|cháu|công ty|doanh nghiệp)\s+[a-zA-ZÀ-ỹ]/i.test(t)
        ) {
          return false;
        }
        return true;
      }
      const narrativeIndicators = [
        /(?:^|[\s.,;:?!"'“”()])(ông|bà|anh|chị|cháu)\s+[A-ZÀ-Ỹ]/,
        /(?:^|[\s.,;:?!"'“”()])(công ty|doanh nghiệp|nhà máy|cửa hàng)\s+[A-ZÀ-Ỹ]/i,
        /(?:kết hôn|chung sống|di sản|thừa kế|di chúc|vay tiền|cho vay|mượn xe|mượn tài sản|trộm cắp|cướp tài sản|đâm|chém|vượt đèn đỏ|tai nạn|xích mích|thương tích|tình huống)/i,
        /\b\d+\s*(triệu|tỷ|nghìn)\s*đồng\b/i
      ];
      return narrativeIndicators.some((rx) => rx.test(t));
    };

    // Hàm nhận diện dòng tiêu đề Phần/Mục, nhãn "Câu hỏi:" / "Yêu cầu:" hoặc câu dẫn chung ("Các nhận định dưới đây...", "Trả lời ngắn gọn những ý sau đây?")
    const isSectionHeaderLine = (line: string): boolean => {
      const lt = line.trim();
      return (
        /^(?:phần|mục|i{1,3}|iv|v)\s*(?:[ivx\d]+)?\s*[.:–—\-]\s*(?:nhận\s*định|câu\s*hỏi|lý\s*thuyết|bài\s*tập|tự\s*luận|quan\s*hệ\s*pháp\s*luật|trắc\s*nghiệm)/i.test(lt) ||
        /^phần\s+(?:[ivx]+|\d+)\b/i.test(lt) ||
        /^(?:câu\s*hỏi|hỏi|yêu\s*cầu(?:\s*giải\s*quyết)?)\s*[:.]?\s*$/i.test(lt) ||
        (lt.length <= 130 && /(?:dưới\s+đây|sau\s+đây|các\s+nhận\s+định\s+sau|những\s+nhận\s+định\s+sau|những\s+ý\s+sau|các\s+câu\s+sau)/i.test(lt))
      );
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

    // Kiểm tra xem đề bài có sử dụng nhãn "Câu 1", "Câu 2" / "TC 1.1", "TC 1.2" / "1.", "2." / "1/", "2/" / "Bài 1", "Bài 2" hay không
    const explicitCauRegex = /^(?:(?:câu\s*hỏi|câu|nhận\s*định|bài|tc|test\s*case)\s*(\d+(?:\.\d+)*)|\(?(\d+(?:\.\d+)*)[./)])\s*(?:\([^)]*\))?\s*[:./)\-–—]?\s*(.*)$/i;
    const explicitCauCount = rawLines.filter((l) => explicitCauRegex.test(l)).length;

    // Nếu đề bài có từ 2 mục trở lên -> Chỉ tách theo cấp mục đó (bảo toàn mọi ý con a, b, c, d bên trong Câu 9!)
    const generalItemRegex = /^(?:(?:câu\s*hỏi|câu|nhận\s*định|ý|bài|tc|test\s*case)\s*\d+(?:\.\d+)*\s*(?:\([^)]*\))?|\(?\d{1,2}(?:\.\d+)*[./)]|\([a-zA-Z]\)|[a-zA-Z][./)]|[-•*])\s*[:./)\-–—]?\s*(.+)$/i;
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

      // Nếu phần mở đầu trước mục số 1 là chỉ thị tác vụ chung cho nhiều trường hợp (ví dụ: "Xác định loại lỗi và giải thích trong 4 trường hợp sau:")
      const sharedTaskMatch = nonHeaderPreamble.match(/^([^:\n]{8,95}?)(?:\s+trong\s+\d+\s+trường\s+hợp|\s*:\s*$)/i);
      const sharedTaskPrefix =
        sharedTaskMatch && !/nhận\s*định|đúng\s*hay\s*sai|đúng\s*\/\s*sai/i.test(sharedTaskMatch[1])
          ? sharedTaskMatch[1].trim()
          : '';

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
          const bodyAfterMarker = stripLeadingScore(explicitCauCount >= 2 ? (m[3] || m[1] || m[2] || '') : (m[1] || m[2] || ''));
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
          /(?:^|[\s.,;:?!"'“”()])(trên|đó|này|anh\s+[a-z]|ông\s+[a-z]|bà\s+[a-z]|chị\s+[a-z]|tình huống)/i.test(validItems[1].text) &&
          !/(?:là gì|đúng hay sai|nhận định)/i.test(validItems[1].text);

        if (!(firstHasActor && secondRefersBack)) {
          return validItems.slice(0, 15).map((it) => {
            const txt = it.text;
            const isSelfEssayOrCase =
              /(?:hãy\s+phân\s+biệt|phân\s+biệt|so\s+sánh|hãy\s+xác\s+định|xác\s+định\s*:|phân\s+tích\s*:|trình\s+bày|là\s+gì)/i.test(txt) ||
              (/\ba[.)]\s+/i.test(txt) && /\bb[.)]\s+/i.test(txt));

            if (
              it.isTrueFalseSection &&
              !isSelfEssayOrCase &&
              !/đúng\s*hay\s*sai|đúng\s*\/\s*sai|nhận\s*định|là\s*gì|\?/i.test(txt)
            ) {
              const singleLineStmt = txt.replace(/\s*\n+\s*/g, ' ').replace(/^["“”']+|["“”']+$/g, '').trim();
              return `Nhận định: "${singleLineStmt}". Nhận định này Đúng hay Sai? Giải thích vì sao.`;
            }
            if (sharedTaskPrefix && !txt.includes('?') && !isSelfEssayOrCase) {
              return `${sharedTaskPrefix}: ${txt}`;
            }
            return txt;
          });
        }
      }
    }

    // 3. Kiểm tra đánh số inline trên cùng 1 dòng (TUYỆT ĐỐI không tách nhầm "(Điều 68) ... (Điều 71)" hay "(Khoản 1) ... (Khoản 2)"!)
    const VN_UP_CHARS = 'A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ';
    const inlineSplitLookahead = new RegExp(
      `([.;?!])\\s*(?=(?:[cC]âu\\s*\\d+\\s*[:.)]|[nN]hận\\s*định\\s*\\d+\\s*[:.)]|[tT][cC]\\s*\\d+(?:\\.\\d+)*\\s*[:.)]|\\d{1,2}\\.\\s*[${VN_UP_CHARS}"“]))`,
      'g'
    );
    const normalizedInline = raw.replace(inlineSplitLookahead, '$1 ');
    const inlineSplitDelimiter = new RegExp(
      `(?:^|\\s+)(?=(?:[cC]âu\\s*\\d+\\s*[:.)]|[nN]hận\\s*định\\s*\\d+\\s*[:.)]|[tT][cC]\\s*\\d+(?:\\.\\d+)*\\s*[:.)]|\\d{1,2}\\.\\s*[${VN_UP_CHARS}"“]))`
    );
    const inlineParts = normalizedInline
      .split(inlineSplitDelimiter)
      .map((s) => s.trim())
      .filter(Boolean);

    if (inlineParts.length >= 2) {
      const markerStart = /^(?:câu\s*\d+|nhận\s*định\s*\d+|tc\s*\d+(?:\.\d+)*|\d{1,2})[.:)]\s*/i;
      const markedParts = inlineParts.filter((p) => markerStart.test(p));
      const startsAtOneOrNamed =
        markedParts.length >= 2 &&
        /^(?:câu\s*1\b|nhận\s*định\s*1\b|tc\s*1\b|1\.)/i.test(markedParts[0]);
      if (startsAtOneOrNamed && !isCaseStudyNarrative(inlineParts[0].replace(markerStart, ''))) {
        const cleaned = inlineParts
          .map((p) => stripLeadingScore(p.replace(markerStart, '').trim()))
          .filter((p) => p.length >= 10);
        if (cleaned.length >= 2) {
          return cleaned.slice(0, 12);
        }
      }
    }

    // 4. Nhiều dòng độc lập không đánh số (CHỈ tách khi MỌI dòng đều thực sự là một câu hỏi độc lập, KHÔNG có đoạn văn kể chuyện tình huống và KHÔNG có dòng phụ thuộc ngữ cảnh "trên/đó/nếu có")
    const isQuestionOrCasePrompt = (lineText: string): boolean => {
      const lt = lineText.trim();
      return (
        lt.endsWith('?') ||
        /(?:là gì|như thế nào|thế nào|chia kiểu gì|phải làm sao|có được không|có bị giam xe không|đúng hay sai|so sánh|phân biệt|trình bày|hãy phân tích|hãy xác định)/i.test(lt)
      );
    };

    const hasBackReference = (lineText: string): boolean =>
      /(?:^|[\s,.;:?!()])(nếu có|ở trên|nêu trên|vi phạm pháp luật trên|tình huống trên|hành vi trên|giao dịch trên|vụ việc trên|của họ|anh ấy|chị ấy|ông ấy|bà ấy)(?=$|[\s,.;:?!()])/i.test(
        lineText.trim()
      );

    const contentLines = rawLines.filter((l) => !isSectionHeaderLine(l) && !isPureScoreLine(l));
    if (contentLines.length >= 2 && contentLines.length <= 8) {
      const allLinesAreQuestions = contentLines.every((l) => l.length >= 20 && isQuestionOrCasePrompt(l));
      const anyNarrativeParagraph = contentLines.some((l) => !l.endsWith('?') && isCaseStudyNarrative(l));
      const anyDependentLine = contentLines.some((l, idx) => idx > 0 && hasBackReference(l));
      if (allLinesAreQuestions && !anyNarrativeParagraph && !anyDependentLine) {
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
            /(?:là gì|như thế nào|đúng hay sai|phân biệt|so sánh|bao nhiêu tuổi|gồm những gì|cơ quan nào|ngành luật nào)/i.test(seg)
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

    // 6. Nhiều câu nhận định Đúng/Sai không đánh số được dán liền nhau (ngăn cách bởi dấu chấm ".")
    const flatText = raw.replace(/\s*\n+\s*/g, ' ').trim();
    const isSingleFramedItem =
      /^(?:nhận\s*định|tình\s*huống|đề\s*bài|chủ\s*đề|giả\s*sử|giả\s*định|câu\s*hỏi|trường\s*hợp)\b/i.test(flatText) ||
      /\[(?:so\s*sánh|chương\s*\d+)/i.test(flatText);
    const hasExplicitActorsOrMoney =
      isSingleFramedItem ||
      /(?:^|[\s.,;:?!"'“”()])(ông|bà|anh|chị|cháu|công ty|doanh nghiệp|nhà máy|cửa hàng)\s+[A-ZÀ-Ỹa-zà-ỹ]/i.test(flatText) ||
      /\b\d+\s*(triệu|tỷ|nghìn)\s*đồng\b/i.test(flatText) ||
      /(?:hôm qua|vừa qua|trên đường|tại ngã tư|đang đi)/i.test(flatText);

    if (!flatText.includes('?') && !hasExplicitActorsOrMoney) {
      const sentenceParts = flatText
        .split(/\.\s*(?=[A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ])/g)
        .map((s) => s.replace(/\.+$/, '').trim())
        .filter((s) => s.length >= 30);

      if (sentenceParts.length >= 2 && sentenceParts.length <= 5) {
        const connectorStart = /^(?:ví\s*dụ|chẳng\s*hạn|do\s*đó|vì\s*vậy|tuy\s*nhiên|mặt\s*khác|ngoài\s*ra|theo\s*đó|trường\s*hợp|trong\s*đó|cụ\s*thể|giải\s*thích|nhận\s*định|kết\s*luận|lưu\s*ý|từ\s*dữ\s*kiện|từ\s*tình\s*huống|dựa\s*vào|dựa\s*trên|căn\s*cứ|câu\s*hỏi|yêu\s*cầu|đúng\s*hay\s*sai|tại\s*sao|vì\s*sao|hãy\s*|phân\s*tích|trình\s*bày|so\s*sánh|phân\s*biệt)/i;
        const hasNoConnector = sentenceParts.every((s, idx) => idx === 0 || !connectorStart.test(s));
        const isSelfEssay = sentenceParts.some((s) => /^(?:phân\s*tích|trình\s*bày|so\s*sánh|phân\s*biệt|nêu\s+|hãy\s+|xác\s*định)/i.test(s));
        const tfStatementCue = /(?:bắt buộc|chỉ có|đều là|đều phải|đều được|mọi\s+|tất cả\s+|luôn\s+|không thể|không bao giờ|có quyền|không phải|là một loại|chế độ hai cấp|chỉ thuộc về)/i;
        const tfCount = sentenceParts.filter((s) => tfStatementCue.test(s)).length;

        if (hasNoConnector && !isSelfEssay && tfCount >= 2) {
          const topic0 = RagService.extractCoreTopicKeyword(sentenceParts[0]);
          const topic1 = RagService.extractCoreTopicKeyword(sentenceParts[1]);
          if (!topic0 || !topic1 || topic0 !== topic1) {
            return sentenceParts.map((s) => `${s}.`);
          }
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
   * BỘ TÁCH CÂU HỎI ĐÍCH KHỎI DỮ KIỆN TIỀN ĐỀ (QUERY DECOMPOSITION: PREMISE VS. TARGET QUESTION)
   * Lấy câu hỏi pháp lý thực sự ở cuối đề bài (thường bắt đầu bằng "Hỏi...", "Yêu cầu... có được chấp nhận không?",
   * "Cơ quan... được phép...", "Khi nào...", hoặc các câu có dấu "?") làm trọng tâm truy xuất Vector/Hybrid Search,
   * tránh bị nhiễu bởi câu dẫn chuyện bối cảnh ở đầu bài (như tiền đề T phạm tội cướp Điều 168, trộm Q cạy chuồng chó, X bị xét xử Điều 173).
   */
  public static decomposeCaseQuery(rawQuery: string): {
    fullQuery: string;
    premise: string;
    targetQuestion: string;
    hasPremiseAndTarget: boolean;
    isAppliedCase: boolean;
  } {
    const clean = (rawQuery || '').trim();
    if (!clean) {
      return { fullQuery: '', premise: '', targetQuestion: '', hasPremiseAndTarget: false, isAppliedCase: false };
    }

    // Tách câu thông minh, tránh cắt nhầm ở số thập phân (1,5) hoặc viết tắt (tr., TP.)
    const sentences = clean
      .split(/(?<=[.?!])\s+(?=[A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ"“])|\n+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const targetStarterRx =
      /(?:^|[\s,:;—–-])(?:hỏi\s|vậy\s|cho\s+hỏi|yêu\s+cầu\s+.*có\s+được|cơ\s+quan\s+.*được\s+phép|khi\s+nào\s+thì|hãy\s+(?:phân\s+tích|xác\s+định|cho\s+biết|giải\s+quyết|chia)|xác\s+định\s+trường\s+hợp|ai\s+phải\s+|thuộc\s+loại\s+tội\s+phạm|có\s+phải\s+chịu|có\s+cấu\s+thành|áp\s+dụng\s+văn\s+bản\s+nào)/i;

    let splitIdx = -1;
    if (sentences.length >= 2) {
      // Quét từ cuối ngược lên để gom trọn cụm câu hỏi đích ở cuối đề bài
      for (let i = sentences.length - 1; i >= 1; i--) {
        const s = sentences[i];
        if (s.includes('?') || targetStarterRx.test(s)) {
          splitIdx = i;
        } else if (splitIdx !== -1) {
          break;
        }
      }
      if (splitIdx === -1 && sentences[sentences.length - 1].length >= 15) {
        splitIdx = sentences.length - 1;
      }
    }

    const premise = splitIdx > 0 && !sentences[0].endsWith('?') ? sentences.slice(0, splitIdx).join(' ').trim() : '';
    const targetQuestion = premise ? sentences.slice(splitIdx).join(' ').trim() : clean;
    const hasPremiseAndTarget = Boolean(premise.length >= 25 && targetQuestion.length >= 12);

    const qLower = clean.toLowerCase();
    const hasConcreteCaseFacts =
      /(?:^|[\s,.;:?!()""''])(ông|bà|anh|chị|cháu|bị\s+cáo|nguyên\s+đơn|bị\s+đơn|tên\s+trộm|công\s+ty)\s+[a-zA-ZÀ-ỹ]/i.test(clean) ||
      /\d+\s*(?:triệu|tỷ|tháng\s+tù|năm\s+tù|%)/i.test(qLower) ||
      /(?:tháng\s+\d{1,2}\/\d{4}|trường\s+hợp\s+sau\s+thuộc\s+loại\s+nào|tình\s+huống\s+sau)/i.test(qLower);

    const isAppliedCase = hasConcreteCaseFacts;

    return {
      fullQuery: clean,
      premise,
      targetQuestion,
      hasPremiseAndTarget,
      isAppliedCase
    };
  }

  /**
   * Động cơ Hybrid Search trên kho Điều luật Thực định (Query Decomposition + Target-Weighted Scoring)
   * Ưu tiên gấp 3 lần cho Câu hỏi đích (targetQuestion) để không bị câu dẫn chuyện ở đầu bài làm nhiễu!
   */
  public static async hybridSearchLawArticles(query: string, topN: number = 5): Promise<ILawArticle[]> {
    try {
      const allArticles = await LawArticle.find({});
      if (!allArticles || allArticles.length === 0) return [];

      const qCtx = this.analyzeQueryContext(query);
      if (qCtx.isOutOfDatabaseDomain) return [];

      const decomp = this.decomposeCaseQuery(query);
      const targetCtx = this.analyzeQueryContext(decomp.targetQuestion || query);
      const targetMentionedNums = new Set(targetCtx.mentionedArticles.map((m) => m.articleNumber));

      const normalizeText = (s: string) =>
        (s || '')
          .toLowerCase()
          .replace(/[.,;:?!"'“”()\[\]\-–—_/\\]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

      const qNorm = normalizeText(query);
      const targetNorm = normalizeText(decomp.targetQuestion || query);
      const premiseNorm = normalizeText(decomp.premise || '');

      // Phát hiện các chế định pháp lý bậc 2 trong câu hỏi đích (để khử nhiễu tội danh nền ở phần tiền đề)
      const targetAsksCrimeClass =
        /(?:thuộc loại tội phạm|phân loại tội phạm|ít nghiêm trọng.*nghiêm trọng|loại tội phạm nào)/i.test(targetNorm);
      const targetAsksHarboringOrNonReport =
        /(?:che giấu|không tố giác|tố giác tội phạm)/i.test(qNorm) && /(?:chịu trách nhiệm hình sự|tnhs|bố|cha|mẹ|em|anh chị|người thân)/i.test(qNorm);
      const targetAsksAnimalLiability =
        /(?:con chó|chó săn|chó dữ|súc vật|xổng chuồng|xổng ra)/i.test(qNorm) && /(?:bồi thường|viện phí|cắn)/i.test(qNorm);
      const targetAsksDepositVsPrepay =
        /(?:đặt cọc|phạt cọc|tiền trả trước|chuyển trước tiền mua)/i.test(qNorm);
      const targetAsksRetroactivity =
        /(?:hiệu lực hồi tố|hiệu lực trở về trước|nâng mức phạt|giảm mức phạt|trách nhiệm pháp lý nhẹ hơn)/i.test(qNorm);
      const hasSecondaryTargetDoctrine =
        targetAsksCrimeClass ||
        targetAsksHarboringOrNonReport ||
        targetAsksAnimalLiability ||
        targetAsksDepositVsPrepay ||
        targetAsksRetroactivity;

      const stopWords = new Set([
        'của', 'những', 'trong', 'theo', 'nào', 'hãy', 'cho', 'biết', 'trình', 'bày', 'phân', 'tích',
        'giải', 'thích', 'đúng', 'sai', 'nhận', 'định', 'sau', 'đây', 'như', 'thế', 'nào', 'khi',
        'được', 'phải', 'không', 'một', 'các', 'với', 'hoặc', 'người', 'pháp', 'luật', 'quy', 'định'
      ]);
      const targetTokens = targetNorm.split(' ').filter((w) => w.length > 2 && !stopWords.has(w));
      const premiseTokens = premiseNorm.split(' ').filter((w) => w.length > 2 && !stopWords.has(w));

      const buildBigrams = (normStr: string) => {
        const set = new Set<string>();
        const words = normStr.split(' ').filter((w) => w.length > 1);
        for (let i = 0; i < words.length - 1; i++) {
          set.add(`${words[i]} ${words[i + 1]}`);
        }
        return set;
      };
      const targetBigrams = buildBigrams(targetNorm);
      const premiseBigrams = buildBigrams(premiseNorm);

      const genericSingleKeywords = new Set([
        'luật', 'hiến pháp', 'nghị định', 'thông tư', 'nhà nước', 'tuổi', 'xe máy', 'ô tô', 'giao thông', 'tài sản', 'bồi thường', 'vi phạm'
      ]);

      const scored = allArticles.map((art) => {
        let score = 0;
        const titleLower = (art.title || '').toLowerCase();
        const contentLower = (art.contentRaw || '').toLowerCase();

        // 0. Thưởng điểm định hướng chính xác theo Câu hỏi đích (Target Question Boosting)
        if (targetAsksRetroactivity) {
          if (art.articleId === 'VBQPPL2015_D152' || art.articleId === 'VBQPPL2015_D156') score += 95;
          else if (art.articleId === 'BLHS2015_D7') score += 55;
        }
        if (targetAsksDepositVsPrepay) {
          if (art.articleId === 'BLDS2015_D328') score += 110;
          else if (art.articleId === 'BLDS2015_D430' || art.articleId === 'BLDS2015_D119') score += 65;
          else if (art.articleId === 'BLDS2015_D463' || art.articleId === 'BLDS2015_D466' || art.articleId === 'BLHS2015_D175') score -= 60;
        }
        if (targetAsksAnimalLiability) {
          if (art.articleId === 'BLDS2015_D603') score += 115;
          else if (art.articleId === 'BLDS2015_D590' || art.articleId === 'BLDS2015_D584') score += 75;
          else if (art.articleId === 'BLDS2015_D589' || art.articleId === 'BLHS2015_D173' || art.articleId === 'BLHS2015_D168') score -= 55;
        }
        if (targetAsksHarboringOrNonReport) {
          if (
            art.articleId === 'BLHS2015_D18' ||
            art.articleId === 'BLHS2015_D19' ||
            art.articleId === 'BLHS2015_D389' ||
            art.articleId === 'BLHS2015_D390'
          ) {
            score += 110;
          } else if (art.articleId === 'BLHS2015_D9') {
            score += 55;
          }
        }
        if (targetAsksCrimeClass) {
          if (art.articleId === 'BLHS2015_D9') score += 115;
          else if (art.articleId === 'BLHS2015_D54') score += 85;
        }

        // 1. Khớp số Điều + Tên Luật (Phân biệt Điều nằm ở Câu hỏi đích vs Điều chỉ nằm ở Tiền đề!)
        for (const m of qCtx.mentionedArticles) {
          if (Number(art.articleNumber) === m.articleNumber) {
            const isInTarget = targetMentionedNums.has(m.articleNumber);
            const baseArtBoost = isInTarget ? 48 : hasSecondaryTargetDoctrine ? 14 : 36;
            score += baseArtBoost;
            if (m.lawHint) {
              const hint = m.lawHint.toLowerCase();
              if (
                (hint.includes('hiến pháp') && art.lawCode.includes('HP')) ||
                ((hint.includes('hình sự') || hint.includes('blhs')) && art.lawCode.includes('BLHS')) ||
                ((hint.includes('dân sự') || hint.includes('blds')) && art.lawCode.includes('BLDS')) ||
                ((hint.includes('lao động') || hint.includes('bllđ')) && art.lawCode.includes('BLLD')) ||
                ((hint.includes('hôn nhân') || hint.includes('hngđ')) && art.lawCode.includes('HNGD')) ||
                ((hint.includes('hành chính') || hint.includes('xlvphc')) && art.lawCode.includes('XLVPHC')) ||
                ((hint.includes('ban hành') || hint.includes('vbqppl')) && art.lawCode.includes('VBQPPL'))
              ) {
                score += isInTarget ? 90 : hasSecondaryTargetDoctrine ? 16 : 65;
              } else {
                score -= 30;
              }
            }
          }
        }

        // 2. Khớp từ khóa chuyên ngành (Trọng số gấp 2.5 lần nếu nằm ở Câu hỏi đích)
        if (Array.isArray(art.keywords)) {
          for (const kw of art.keywords) {
            const kwLower = kw.toLowerCase().trim();
            if (genericSingleKeywords.has(kwLower)) continue;
            if (kwLower.includes(' ') && kwLower.length >= 6) {
              if (targetNorm.includes(kwLower)) {
                score += 36;
              } else if (premiseNorm.includes(kwLower)) {
                score += hasSecondaryTargetDoctrine ? 8 : 20;
              }
            } else if (!kwLower.includes(' ') && kwLower.length >= 6) {
              if (targetTokens.includes(kwLower)) score += 16;
              else if (premiseTokens.includes(kwLower) && !hasSecondaryTargetDoctrine) score += 8;
            }
          }
        }

        // 3. Khớp tiêu đề điều luật (title)
        if (titleLower.length >= 5) {
          if (targetNorm.includes(titleLower)) score += 45;
          else if (premiseNorm.includes(titleLower)) score += hasSecondaryTargetDoctrine ? 10 : 25;
        }

        // 4. Khớp Bigram (Target Question x2.5 so với Premise)
        let targetBgHits = 0;
        targetBigrams.forEach((bg) => {
          if (titleLower.includes(bg)) targetBgHits += 2.5;
          else if (contentLower.includes(bg)) targetBgHits += 1.2;
        });
        let premiseBgHits = 0;
        premiseBigrams.forEach((bg) => {
          if (titleLower.includes(bg)) premiseBgHits += 0.9;
          else if (contentLower.includes(bg)) premiseBgHits += 0.4;
        });
        score += Math.min(44, targetBgHits * 4.5 + (hasSecondaryTargetDoctrine ? premiseBgHits * 1.2 : premiseBgHits * 3.0));

        // 5. Khớp Unigram có chọn lọc trên Câu hỏi đích
        let tokenHits = 0;
        for (const t of targetTokens) {
          if (titleLower.includes(t)) tokenHits += 2.2;
          else if (contentLower.includes(t)) tokenHits += 0.8;
        }
        score += Math.min(22, tokenHits * 2);

        if (qNorm.includes('bộ luật hình sự') && !qNorm.includes('dân sự') && !targetAsksAnimalLiability && art.lawCode.includes('BLDS')) {
          score -= 25;
        }
        if (qNorm.includes('bộ luật dân sự') && !qNorm.includes('hình sự') && !qNorm.includes('kết hôn') && art.lawCode.includes('BLHS')) {
          score -= 25;
        }

        return { art, score };
      });

      return scored
        .filter((s) => s.score >= 24)
        .sort((a, b) => b.score - a.score)
        .slice(0, topN)
        .map((s) => s.art);
    } catch {
      return [];
    }
  }

  /**
   * Giai đoạn 2: Truy xuất Ngữ cảnh Kép (Hybrid Retrieval)
   */
  public static async retrieveContext(query: string, intentCode: ExamArchetype): Promise<{
    articles: ILawArticle[];
    principle?: ITextbookPrinciple | null;
    promptContext: string;
  }> {
    const qCtx = this.analyzeQueryContext(query);
    if (intentCode === 'OUT_OF_SCOPE' || qCtx.isOutOfDatabaseDomain) {
      return {
        articles: [],
        principle: null,
        promptContext: ''
      };
    }

    // 1. Quét bảng nguyên lý giáo trình chuẩn theo từ khóa chuyên biệt
    let principle = null;
    const qLowerPrinciple = query.toLowerCase();
    if (intentCode === 'GENERAL_THEORY' || intentCode === 'DEFINITION') {
      if (qLowerPrinciple.includes('nhà nước')) {
        principle = await TextbookPrinciple.findOne({ principleId: 'TMU_PLDC_CH1_NHA_NUOC' });
      } else if (qLowerPrinciple.includes('pháp luật') || qLowerPrinciple.includes('hệ thống văn bản')) {
        principle = await TextbookPrinciple.findOne({ principleId: 'TMU_PLDC_CH2_PHAP_LUAT' });
      }
    }
    if (!principle) {
      principle = await TextbookPrinciple.findOne({ topicCode: intentCode });
    }

    // 2. Quét văn bản luật thực định theo đặc thù dạng đề (KHÔNG BAO GIỜ gán điều luật rác mặc định ở nhánh else!)
    let matchedArticles: ILawArticle[] = [];

    switch (intentCode) {
      case 'GENERAL_THEORY': {
        const qL = query.toLowerCase();
        if (
          qL.includes('hiệu lực hồi tố') ||
          qL.includes('hiệu lực trở về trước') ||
          qL.includes('điều 152') ||
          (qL.includes('văn bản') && (qL.includes('nâng mức phạt') || qL.includes('giảm mức phạt') || qL.includes('nhẹ hơn') || qL.includes('nặng hơn')))
        ) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'VBQPPL2015_D152' }, { articleId: 'VBQPPL2015_D156' }, { articleId: 'BLHS2015_D7' }]
          }).limit(3);
        } else if (qL.includes('thứ tự hiệu lực') || qL.includes('hiệu lực pháp lý') || (qL.includes('sắp xếp') && qL.includes('thứ tự')) || (qL.includes('hiến pháp') && qL.includes('nghị định'))) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'HP2013_D119' }, { articleId: 'VBQPPL2015_D4' }, { articleId: 'VBQPPL2015_D156' }]
          }).limit(3);
        } else if (qL.includes('sự kiện pháp lý') || qL.includes('sự biến')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'BLDS2015_D156' }, { articleId: 'BLDS2015_D611' }, { articleId: 'HNGD2014_D65' }]
          }).limit(3);
        } else if (qL.includes('lao động 2012') || qL.includes('blld 2012')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'BLLD2019_D36' }, { articleId: 'VBQPPL2015_D156' }]
          }).limit(2);
        } else if (qL.includes('văn bản quy phạm') || qL.includes('vbqppl') || qL.includes('văn bản áp dụng')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'VBQPPL2015_D4' }, { articleId: 'VBQPPL2015_D152' }, { articleId: 'VBQPPL2015_D156' }, { articleId: 'HP2013_D8' }]
          }).limit(4);
        } else if (
          qL.includes('nhà nước') ||
          qL.includes('chủ quyền') ||
          qL.includes('chính thể') ||
          qL.includes('bộ máy') ||
          ((qL.includes('bản chất') || qL.includes('giai cấp') || qL.includes('tính xã hội')) && qL.includes('pháp luật'))
        ) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'HP2013_D2' }, { articleId: 'HP2013_D8' }]
          }).limit(2);
        } else if (qL.includes('pháp nhân')) {
          matchedArticles = await LawArticle.find({ $or: [{ articleId: 'BLDS2015_D74' }] }).limit(1);
        }
        break;
      }

      case 'COMPARISON': {
        const qL = query.toLowerCase();
        if (qL.includes('thời hiệu') || (qL.includes('khởi kiện') && qL.includes('truy cứu'))) {
          matchedArticles = await LawArticle.find({
            $or: [
              { articleId: 'BLDS2015_D149' },
              { articleId: 'BLDS2015_D150' },
              { articleId: 'BLDS2015_D157' },
              { articleId: 'BLHS2015_D27' },
              { articleId: 'BLHS2015_D28' }
            ]
          }).limit(5);
        } else if (qL.includes('quy phạm') || qL.includes('văn bản') || qL.includes('vbqppl') || qL.includes('áp dụng pháp luật')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'VBQPPL2015_D4' }, { articleId: 'VBQPPL2015_D156' }]
          }).limit(2);
        } else if (qL.includes('phòng vệ') || qL.includes('cấp thiết')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'BLHS2015_D22' }, { articleId: 'BLHS2015_D23' }]
          }).limit(2);
        } else if (qL.includes('cố ý')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'BLHS2015_D10' }, { articleId: 'BLHS2015_D11' }]
          }).limit(2);
        }
        break;
      }

      case 'DEFINITION':
        matchedArticles = [];
        break;

      case 'TRUE_FALSE': {
        const qL = query.toLowerCase();
        if (qL.includes('văn bản quy phạm') || qL.includes('áp dụng pháp luật')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'VBQPPL2015_D4' }, { articleId: 'VBQPPL2015_D156' }]
          }).limit(2);
        } else if (qL.includes('năng lực hành vi') || qL.includes('năng lực pháp luật')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'BLDS2015_D16' }, { articleId: 'BLDS2015_D19' }, { articleId: 'BLDS2015_D20' }]
          }).limit(3);
        } else if (qL.includes('thừa kế') || qL.includes('di chúc') || qL.includes('di sản')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'BLDS2015_D651' }, { articleId: 'BLDS2015_D644' }]
          }).limit(2);
        } else if (qL.includes('kết hôn') || qL.includes('ly hôn') || qL.includes('vợ chồng') || qL.includes('hôn nhân')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'HNGD2014_D8' }, { articleId: 'HNGD2014_D33' }, { articleId: 'HNGD2014_D59' }]
          }).limit(3);
        } else if (qL.includes('lao động') || qL.includes('thử việc') || qL.includes('sa thải')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'BLLD2019_D36' }, { articleId: 'BLLD2019_D125' }]
          }).limit(2);
        }
        break;
      }

      case 'FAMILY_LAW': {
        const qL = query.toLowerCase();
        if (qL.includes('kết hôn') || qL.includes('tuổi kết hôn') || qL.includes('độ tuổi') || qL.includes('điều kiện kết hôn')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'HNGD2014_D8' }, { articleId: 'BLDS2015_D20' }]
          }).limit(2);
        } else if (qL.includes('tài sản') || qL.includes('chia') || qL.includes('ly hôn') || qL.includes('riêng')) {
          matchedArticles = await LawArticle.find({
            $or: [
              { articleId: 'HNGD2014_D43' },
              { articleId: 'HNGD2014_D59' },
              { articleId: 'HNGD2014_D33' },
              { articleId: 'HNGD2014_D46' },
              { articleId: 'BLDS2015_D457' }
            ]
          }).limit(5);
        } else {
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
        }
        break;
      }

      case 'QPPL_STRUCT': {
        const qL = query.toLowerCase();
        if (qL.includes('xúc phạm') || qL.includes('nhân phẩm') || qL.includes('danh dự') || qL.includes('làm nhục')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'BLHS2015_D155' }, { articleId: 'BLHS2015_D12' }]
          }).limit(2);
        } else if (qL.includes('lừa dối') || qL.includes('đe dọa') || qL.includes('giao dịch dân sự') || qL.includes('vô hiệu')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'BLDS2015_D117' }, { articleId: 'BLDS2015_D119' }]
          }).limit(2);
        }
        break;
      }

      case 'VPPL_4_ELEMENTS': {
        const qL = query.toLowerCase();
        if (qL.includes('ném đá') || qL.includes('cảnh sát') || qL.includes('thương tích')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'BLHS2015_D134' }, { articleId: 'BLDS2015_D584' }, { articleId: 'BLHS2015_D12' }]
          }).limit(3);
        } else if (qL.includes('xả thải') || qL.includes('nhà máy đường') || qL.includes('môi trường')) {
          matchedArticles = await LawArticle.find({
            $or: [{ articleId: 'BLDS2015_D584' }, { articleId: 'BLDS2015_D601' }, { articleId: 'BLDS2015_D74' }]
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
        const decompCase = this.decomposeCaseQuery(query);
        const qL = query.toLowerCase();
        const targetL = (decompCase.targetQuestion || query).toLowerCase();
        const articleOrList: Array<{ articleId: string }> = [];

        if (
          qL.includes('hiệu lực hồi tố') ||
          qL.includes('hiệu lực trở về trước') ||
          targetL.includes('hồi tố') ||
          targetL.includes('trở về trước')
        ) {
          articleOrList.push({ articleId: 'VBQPPL2015_D152' }, { articleId: 'VBQPPL2015_D156' }, { articleId: 'BLHS2015_D7' });
        } else if (
          qL.includes('đặt cọc') ||
          qL.includes('phạt cọc') ||
          qL.includes('tiền trả trước') ||
          qL.includes('chuyển trước tiền mua')
        ) {
          articleOrList.push({ articleId: 'BLDS2015_D328' }, { articleId: 'BLDS2015_D430' }, { articleId: 'BLDS2015_D119' });
        } else if (
          qL.includes('con chó') ||
          qL.includes('chó săn') ||
          qL.includes('chó dữ') ||
          qL.includes('súc vật') ||
          (qL.includes('xổng') && qL.includes('cắn'))
        ) {
          articleOrList.push({ articleId: 'BLDS2015_D603' }, { articleId: 'BLDS2015_D590' }, { articleId: 'BLDS2015_D584' });
        } else if (qL.includes('che giấu tội phạm') || qL.includes('không tố giác')) {
          articleOrList.push(
            { articleId: 'BLHS2015_D18' },
            { articleId: 'BLHS2015_D19' },
            { articleId: 'BLHS2015_D389' },
            { articleId: 'BLHS2015_D390' },
            { articleId: 'BLHS2015_D9' }
          );
        } else if (
          targetL.includes('thuộc loại tội phạm') ||
          targetL.includes('loại tội phạm nào') ||
          (targetL.includes('ít nghiêm trọng') && targetL.includes('nghiêm trọng'))
        ) {
          articleOrList.push({ articleId: 'BLHS2015_D9' }, { articleId: 'BLHS2015_D54' });
        } else if (qL.includes('cháu bé') || (qL.includes('8 tuổi') && (qL.includes('ngõ') || qL.includes('phanh') || qL.includes('ô tô') || qL.includes('chạy vọt')))) {
          articleOrList.push({ articleId: 'BLHS2015_D20' }, { articleId: 'BLDS2015_D601' }, { articleId: 'BLDS2015_D584' });
        } else if (qL.includes('cướp giật') || (qL.includes('15 tuổi') && qL.includes('17 tuổi'))) {
          articleOrList.push({ articleId: 'BLHS2015_D12' }, { articleId: 'BLHS2015_D171' }, { articleId: 'BLHS2015_D9' });
        } else if (qL.includes('laptop') || (qL.includes('đi làm muộn') && qL.includes('trộm'))) {
          articleOrList.push({ articleId: 'BLLD2019_D125' }, { articleId: 'BLHS2015_D173' }, { articleId: 'BLDS2015_D584' });
        } else if (qL.includes('đuổi việc') || qL.includes('sa thải') || qL.includes('ngang xương')) {
          articleOrList.push({ articleId: 'BLLD2019_D36' }, { articleId: 'BLLD2019_D41' });
        } else if (qL.includes('trốn thuế') || qL.includes('hai giá') || qL.includes('2 giá')) {
          articleOrList.push({ articleId: 'BLHS2015_D200' }, { articleId: 'BLDS2015_D124' });
        } else if (qL.includes('đòi nợ') || qL.includes('xã hội đen')) {
          articleOrList.push({ articleId: 'BLHS2015_D170' }, { articleId: 'BLHS2015_D133' });
        } else if (qL.includes('tự ý bán') || (qL.includes('bán') && (qL.includes('mượn') || qL.includes('của b') || qL.includes('xe của') || qL.includes('người khác')))) {
          articleOrList.push(
            { articleId: 'BLDS2015_D166' },
            { articleId: 'BLDS2015_D168' },
            { articleId: 'BLHS2015_D175' },
            { articleId: 'BLDS2015_D131' }
          );
        } else if (qL.includes('ném đá') || qL.includes('thương tích')) {
          articleOrList.push({ articleId: 'BLHS2015_D134' }, { articleId: 'BLDS2015_D590' }, { articleId: 'BLDS2015_D584' });
        } else if (qL.includes('xả thải') || qL.includes('nhà máy đường') || qL.includes('môi trường') || qL.includes('ô nhiễm')) {
          articleOrList.push({ articleId: 'BLDS2015_D584' }, { articleId: 'BLDS2015_D601' }, { articleId: 'BLDS2015_D74' });
        } else if (qL.includes('phòng vệ') || qL.includes('cấp thiết') || qL.includes('tự vệ')) {
          articleOrList.push({ articleId: 'BLHS2015_D22' }, { articleId: 'BLHS2015_D23' }, { articleId: 'BLDS2015_D595' }, { articleId: 'BLDS2015_D584' });
        } else if (qL.includes('thời hiệu') || (qL.includes('khởi kiện') && qL.includes('truy cứu'))) {
          articleOrList.push({ articleId: 'BLDS2015_D149' }, { articleId: 'BLDS2015_D150' }, { articleId: 'BLDS2015_D157' }, { articleId: 'BLHS2015_D27' });
        } else if (qL.includes('giam xe') || qL.includes('nồng độ cồn') || qL.includes('say') || qL.includes('nhậu')) {
          articleOrList.push({ articleId: 'XLVPHC2012_D125' }, { articleId: 'XLVPHC2012_D5' }, { articleId: 'XLVPHC2012_D21' });
        }

        if (articleOrList.length > 0) {
          matchedArticles = await LawArticle.find({ $or: articleOrList }).limit(5);
        }
        break;
      }

      default:
        matchedArticles = [];
        break;
    }

    // 2.05. Kết hợp Hybrid Statutory Search trên toàn bộ kho LawArticle (lọc cứng score >= 18)
    if (intentCode !== 'DEFINITION') {
      const hybridArticles = await this.hybridSearchLawArticles(query, 5);
      const seenIds = new Set(matchedArticles.map((a) => a.articleId));
      for (const hArt of hybridArticles) {
        if (!seenIds.has(hArt.articleId) && matchedArticles.length < 5) {
          matchedArticles.push(hArt);
          seenIds.add(hArt.articleId);
        }
      }
    }

    // 2.1. Tìm kiếm bổ sung động theo Câu hỏi đích (Target-Driven Dynamic Lexical RAG - khử nhiễu tiền đề!)
    try {
      const decompDyn = this.decomposeCaseQuery(query);
      const qLower = query.toLowerCase();
      const targetLower = (decompDyn.targetQuestion || query).toLowerCase();
      const hasSecondaryFocus =
        /(?:con chó|chó săn|chó dữ|súc vật|che giấu|không tố giác|thuộc loại tội phạm|loại tội phạm nào|đặt cọc|phạt cọc|tiền trả trước|hồi tố|trở về trước)/i.test(qLower);
      const dynamicConditions: any[] = [];

      if (intentCode !== 'DEFINITION') {
        if (!hasSecondaryFocus && (targetLower.includes('trộm cắp') || targetLower.includes('ăn trộm') || targetLower.includes('lấy trộm'))) {
          dynamicConditions.push({ articleId: 'BLHS2015_D173' });
        }
        if (!hasSecondaryFocus && (targetLower.includes('tội cướp') || targetLower.includes('cướp tài sản'))) {
          dynamicConditions.push({ articleId: 'BLHS2015_D168' });
        }
        if (/(?:thương tích|đánh người|đánh đập|hành hung|dùng gậy|hung khí)/.test(qLower) && !hasSecondaryFocus) {
          dynamicConditions.push({ articleId: 'BLHS2015_D134' }, { articleId: 'BLDS2015_D590' });
        }
        if (qLower.includes('con chó') || qLower.includes('chó dữ') || qLower.includes('chó săn') || qLower.includes('súc vật')) {
          dynamicConditions.push({ articleId: 'BLDS2015_D603' }, { articleId: 'BLDS2015_D590' }, { articleId: 'BLDS2015_D584' });
        }
        if (qLower.includes('đặt cọc') || qLower.includes('phạt cọc') || qLower.includes('tiền trả trước') || qLower.includes('chuyển trước tiền mua')) {
          dynamicConditions.push({ articleId: 'BLDS2015_D328' }, { articleId: 'BLDS2015_D430' });
        }
        if (qLower.includes('che giấu tội phạm') || qLower.includes('không tố giác')) {
          dynamicConditions.push(
            { articleId: 'BLHS2015_D18' },
            { articleId: 'BLHS2015_D19' },
            { articleId: 'BLHS2015_D389' },
            { articleId: 'BLHS2015_D390' },
            { articleId: 'BLHS2015_D9' }
          );
        }
        if (targetLower.includes('thuộc loại tội phạm') || targetLower.includes('loại tội phạm nào') || (targetLower.includes('ít nghiêm trọng') && targetLower.includes('nghiêm trọng'))) {
          dynamicConditions.push({ articleId: 'BLHS2015_D9' }, { articleId: 'BLHS2015_D54' });
        }
        if (qLower.includes('hiệu lực hồi tố') || qLower.includes('hiệu lực trở về trước') || qLower.includes('điều 152')) {
          dynamicConditions.push({ articleId: 'VBQPPL2015_D152' }, { articleId: 'VBQPPL2015_D156' });
        }
        if (qLower.includes('vu khống') || qLower.includes('bịa đặt')) {
          dynamicConditions.push({ articleId: 'BLHS2015_D156' }, { articleId: 'BLDS2015_D584' });
        }
        if (qLower.includes('phòng vệ') || qLower.includes('chống trả')) dynamicConditions.push({ articleId: 'BLHS2015_D22' });
        if (qLower.includes('cấp thiết') || qLower.includes('truy sát') || qLower.includes('thoát thân') || (qLower.includes('chạy trốn') && qLower.includes('côn đồ'))) {
          dynamicConditions.push({ articleId: 'BLHS2015_D23' }, { articleId: 'BLDS2015_D595' }, { articleId: 'BLDS2015_D584' });
        }
        if (qLower.includes('nguồn nguy hiểm') || qLower.includes('tai nạn')) {
          if (qLower.includes('chết') || qLower.includes('thiệt mạng') || qLower.includes('tử vong') || qLower.includes('bỏ trốn') || qLower.includes('bỏ chạy')) {
            dynamicConditions.push({ articleId: 'BLHS2015_D260' }, { articleId: 'BLDS2015_D591' }, { articleId: 'BLDS2015_D601' });
          } else if (qLower.includes('xe máy') || qLower.includes('ô tô')) {
            dynamicConditions.push({ articleId: 'BLDS2015_D601' }, { articleId: 'BLDS2015_D584' });
          }
        }
        if (qLower.includes('hạng a1') || qLower.includes('bằng lái a1') || qLower.includes('125 cm3') || qLower.includes('phân khối')) {
          dynamicConditions.push({ articleId: 'TTATGT2024_D57' });
        }
        if (qLower.includes('mũ bảo hiểm') || qLower.includes('nghị định 168')) {
          dynamicConditions.push({ articleId: 'ND168_2024_D7' });
        }
        if (qLower.includes('vượt đèn đỏ') || qLower.includes('đèn đỏ')) {
          dynamicConditions.push({ articleId: 'ND168_2024_D7' }, { articleId: 'GT2019_ND100' });
        }
        if (
          qLower.includes('giết') ||
          qLower.includes('tước đoạt mạng sống') ||
          ((qLower.includes('đâm') || qLower.includes('chém') || qLower.includes('bắn')) &&
            (qLower.includes('chết') || qLower.includes('thiệt mạng') || qLower.includes('tử vong')))
        ) {
          dynamicConditions.push({ articleId: 'BLHS2015_D123' }, { articleId: 'BLDS2015_D591' });
        }
        if (qLower.includes('thừa kế') || qLower.includes('di sản') || qLower.includes('di chúc')) {
          dynamicConditions.push({ articleId: 'BLDS2015_D612' }, { articleId: 'BLDS2015_D651' }, { articleId: 'BLDS2015_D644' });
        }
        if (qLower.includes('tự ý bán') || (qLower.includes('bán') && (qLower.includes('mượn') || qLower.includes('của b') || qLower.includes('xe của') || qLower.includes('người khác')))) {
          dynamicConditions.push(
            { articleId: 'BLDS2015_D166' },
            { articleId: 'BLDS2015_D168' },
            { articleId: 'BLHS2015_D175' },
            { articleId: 'BLDS2015_D131' }
          );
        }
        if (
          (qLower.includes('tài sản') || qLower.includes('chia') || qLower.includes('ly hôn') || qLower.includes('ly dị') || qLower.includes('nhà chồng') || qLower.includes('nhà chông') || qLower.includes('nhà vợ') || qLower.includes('cho tặng') || qLower.includes('tặng cho') || qLower.includes('thừa kế riêng')) &&
          (qLower.includes('vợ chồng') || qLower.includes('ly hôn') || qLower.includes('hôn nhân') || qLower.includes('chồng') || qLower.includes('vợ'))
        ) {
          dynamicConditions.push(
            { articleId: 'HNGD2014_D43' },
            { articleId: 'HNGD2014_D59' },
            { articleId: 'HNGD2014_D33' },
            { articleId: 'HNGD2014_D46' },
            { articleId: 'BLDS2015_D457' }
          );
        } else if (
          qLower.includes('chung sống') ||
          qLower.includes('nhận con') ||
          qLower.includes('khai sinh') ||
          qLower.includes('hộ tịch') ||
          qLower.includes('cha mẹ con')
        ) {
          dynamicConditions.push(
            { articleId: 'HNGD2014_D14' },
            { articleId: 'HNGD2014_D15' },
            { articleId: 'HNGD2014_D88' },
            { articleId: 'HNGD2014_D91' },
            { articleId: 'HNGD2014_D101' }
          );
        }
        if (qLower.includes('quan hệ dân sự') || qLower.includes('pháp nhân')) {
          dynamicConditions.push({ articleId: 'BLDS2015_D1' }, { articleId: 'BLDS2015_D74' });
        }
        if (qLower.includes('tâm thần') || qLower.includes('mất nhận thức')) dynamicConditions.push({ articleId: 'BLHS2015_D21' });
        if (
          (qLower.includes('tuổi') || qLower.includes('thành niên')) &&
          /(?:tội|hình sự|tnhs|trộm|cướp|giết|thương tích|phạt tù)/.test(qLower)
        ) {
          dynamicConditions.push({ articleId: 'BLHS2015_D12' }, { articleId: 'BLHS2015_D9' });
        }
        if (qLower.includes('mượn') && (qLower.includes('làm rơi') || qLower.includes('rơi vỡ') || qLower.includes('hư hỏng'))) {
          dynamicConditions.push(
            { articleId: 'BLDS2015_D494' },
            { articleId: 'BLDS2015_D496' },
            { articleId: 'BLDS2015_D584' },
            { articleId: 'BLDS2015_D585' },
            { articleId: 'BLDS2015_D156' }
          );
        }
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
      const decompTb = this.decomposeCaseQuery(query);
      const tbQuery = decompTb.hasPremiseAndTarget ? `${decompTb.targetQuestion} ${decompTb.targetQuestion} ${decompTb.premise}` : query;
      const topTextbook = TextbookKnowledgeService.searchTopChunks(tbQuery, 1);
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
