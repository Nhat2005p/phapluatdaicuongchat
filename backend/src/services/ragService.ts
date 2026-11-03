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
  | 'COMPARISON';

export class RagService {
  /**
   * Giai đoạn 1: Phân loại và Điều hướng (Intent Routing / Archetype Detection)
   * Nhận diện chuẩn xác các dạng đề thi trọng tâm + tranh chấp hợp đồng/giao dịch dân sự
   * @param forcedCategory Dạng bài người dùng chủ động chọn từ giao diện (nếu có)
   */
  public static detectIntent(query: string, forcedCategory?: string | null): ExamArchetype {
    const q = query.toLowerCase().trim();

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
      q.includes('laptop') ||
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
      q.includes('laptop') ||
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
      q.includes('14 tuổi') ||
      q.includes('15 tuổi') ||
      q.includes('16 tuổi') ||
      (q.includes('tuổi') && q.includes('chịu trách nhiệm hình sự'))
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
   * Giai đoạn 2: Truy xuất Ngữ cảnh Kép (Hybrid Retrieval)
   */
  public static async retrieveContext(query: string, intentCode: ExamArchetype): Promise<{
    articles: ILawArticle[];
    principle?: ITextbookPrinciple | null;
    promptContext: string;
  }> {
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
      if (qLower.includes('laptop') || qLower.includes('mượn') || qLower.includes('rơi') || qLower.includes('vỡ') || qLower.includes('tai nạn')) {
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

    // Tích hợp Textbook RAG từ Giáo trình Pháp luật Đại cương TMU 2021
    const topTextbook = TextbookKnowledgeService.searchTopChunks(query, 1);
    if (topTextbook.length > 0) {
      const tb = topTextbook[0].chunk;
      contextStr += `[GIÁO TRÌNH ĐH THƯƠNG MẠI 2021 - ${tb.chapterTitle} (${tb.sectionTitle})]:\n${tb.baremContent}\n\n`;
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
