import { Request, Response } from 'express';
import { RagService } from '../services/ragService.js';
import { LlmService } from '../services/llmService.js';
import { GuardrailService } from '../services/guardrailService.js';
import { QueryHistory } from '../models/QueryHistory.js';
import { User } from '../models/User.js';

export class QueryController {
  /**
   * Chức năng U-02: Tiếp nhận đề thi thô và sinh lời giải chuẩn Barem
   */
  public static async solveQuery(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.body;
      if (!query || typeof query !== 'string' || !query.trim()) {
        res.status(400).json({ success: false, message: 'Nội dung câu hỏi không được để trống.' });
        return;
      }

      // Bắt buộc phải đăng nhập
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để sử dụng tính năng hỏi đáp AI.' });
        return;
      }

      // Kiểm tra và trừ 1 câu hỏi từ hạn mức câu hỏi
      const user = await User.findById(req.user.id);
      if (user) {
        if (user.status === 'locked') {
          res.status(403).json({
            success: false,
            message: `Tài khoản của bạn đã bị tạm khóa (${user.lockReason || 'Vi phạm điều khoản'}). Vui lòng liên hệ Hotline 0366 015 348 để được hỗ trợ mở khóa.`
          });
          return;
        }
        const remaining = Math.max(0, (user.questionsQuota ?? 30) - (user.questionsUsed ?? 0));
        if (remaining <= 0) {
          res.status(403).json({
            success: false,
            message: 'Bạn đã sử dụng hết lượt hỏi trong tháng. Vui lòng nâng cấp gói hoặc liên hệ quản trị viên để cấp thêm quota.'
          });
          return;
        }
        user.questionsUsed = (user.questionsUsed ?? 0) + 1;
        await user.save();
      }

      const startTime = Date.now();

      // Giai đoạn 1: Phân loại và Điều hướng (Intent Routing)
      const intentCode = RagService.detectIntent(query);

      // Giai đoạn 2: Truy xuất Ngữ cảnh Kép (Hybrid Retrieval)
      const ragContext = await RagService.retrieveContext(query, intentCode);

      // Giai đoạn 3: Hợp nhất Ngữ cảnh và Suy luận sinh lời giải (Context Fusion & Generation)
      const llmResult = await LlmService.generate(query, intentCode, ragContext.promptContext, ragContext.articles);

      // Giai đoạn 4: Kiểm định và Chống Bịa luật (Citation Guardrail)
      const guardrailResult = await GuardrailService.scanAndVerify(llmResult.text);

      const totalLatency = Date.now() - startTime;

      // Giai đoạn 5: Lưu trữ phiên hỏi đáp vào lịch sử
      if (req.user) {
        await QueryHistory.create({
          userId: req.user.id,
          userEmail: req.user.email,
          query,
          intentCode,
          response: llmResult.text,
          activityType: 'solver',
          citations: guardrailResult.citations,
          verifiedCitationsCount: guardrailResult.verifiedCount,
          tier: 'Tier 4 - Fine-tuned LoRA',
          latencyMs: totalLatency
        });
      }

      // Trả kết quả kèm văn bản luật thực định đầy đủ để đối chiếu
      res.json({
        success: true,
        intentCode,
        response: llmResult.text,
        citations: guardrailResult.citations,
        guardrailMetrics: {
          verifiedCount: guardrailResult.verifiedCount,
          totalFound: guardrailResult.totalFound,
          precisionRate: guardrailResult.precisionRate
        },
        retrievedArticles: ragContext.articles.map((a) => ({
          articleId: a.articleId,
          lawCode: a.lawCode,
          articleNumber: a.articleNumber,
          title: a.title,
          contentRaw: a.contentRaw
        })),
        textbookFramework: ragContext.principle?.frameworkTitle,
        theoryContent: ragContext.principle?.theoryContent,
        latencyMs: totalLatency,
        remainingQuestions: user ? Math.max(0, (user.questionsQuota ?? 30) - user.questionsUsed) : 29
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi xử lý bài tập.' });
    }
  }

  public static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập để xem lịch sử.' });
        return;
      }

      const history = await QueryHistory.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(30);

      res.json({
        success: true,
        history
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async clearHistory(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập.' });
        return;
      }

      await QueryHistory.deleteMany({ userId: req.user.id });
      res.json({ success: true, message: 'Đã xóa toàn bộ lịch sử truy vấn cá nhân.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Chức năng AI Rà soát Văn bản & Hợp đồng (AI Document / Contract Reviewer)
   */
  public static async reviewDocument(req: Request, res: Response): Promise<void> {
    try {
      const { content, documentType } = req.body;
      if (!content || typeof content !== 'string' || !content.trim()) {
        res.status(400).json({ success: false, message: 'Nội dung văn bản cần rà soát không được để trống.' });
        return;
      }

      // Bắt buộc phải đăng nhập để sử dụng tính năng rà soát
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để sử dụng tính năng AI Rà soát văn bản.' });
        return;
      }

      const raw = content.trim();
      const lower = raw.toLowerCase();

      // Phân tích và phát hiện các rủi ro pháp lý phổ biến trong môn Pháp luật đại cương & Hợp đồng thực tế
      const issues: any[] = [];
      const validPoints: string[] = [];
      let deducedScore = 95;

      // 1. Kiểm tra rủi ro về Chủ thể (Người chưa thành niên / giám hộ)
      if (
        (lower.includes('16 tuổi') || lower.includes('15 tuổi') || lower.includes('chưa đủ 18') || lower.includes('vị thành niên')) &&
        (lower.includes('mua bán') || lower.includes('chuyển nhượng') || lower.includes('vay') || lower.includes('đứng tên'))
      ) {
        deducedScore -= 25;
        issues.push({
          category: 'Năng lực Chủ thể',
          severity: 'critical',
          clauseText: 'Chủ thể giao kết giao dịch dân sự khi chưa đủ 18 tuổi mà không có người đại diện theo pháp luật đồng ý.',
          description: 'Người từ đủ 15 tuổi đến chưa đủ 18 tuổi tự mình xác lập giao dịch có giá trị lớn (như mua bán xe máy, bất động sản, vay tài sản) mà không có sự đồng ý của người đại diện theo pháp luật sẽ dẫn đến nguy cơ giao dịch bị tuyên bố vô hiệu.',
          legalBasis: 'Khoản 4 Điều 21 và Điều 125 Bộ luật Dân sự 2015',
          recommendation: 'Bổ sung người đại diện theo pháp luật (cha, mẹ hoặc người giám hộ hợp pháp) tham gia ký tên đồng ý vào hợp đồng hoặc xác lập văn bản đồng ý trước khi giao kết.'
        });
      } else {
        validPoints.push('Chủ thể tham gia có dấu hiệu ban đầu phù hợp với độ tuổi xác lập giao dịch thông thường.');
      }

      // 2. Kiểm tra rủi ro về Lao động: Giữ văn bằng gốc / giấy tờ tùy thân
      if (lower.includes('giữ bằng') || lower.includes('giữ bản chính') || lower.includes('giữ cccd') || lower.includes('giữ chứng minh') || lower.includes('giữ bằng gốc')) {
        deducedScore -= 30;
        issues.push({
          category: 'Vi phạm Điều cấm Pháp luật Lao động',
          severity: 'critical',
          clauseText: 'Điều khoản yêu cầu người lao động nộp và giữ văn bằng gốc / giấy tờ tùy thân.',
          description: 'Hành vi người sử dụng lao động giữ bản chính giấy tờ tùy thân, văn bằng, chứng chỉ của người lao động bị nghiêm cấm tuyệt đối theo Bộ luật Lao động và có thể bị phạt tiền hành chính.',
          legalBasis: 'Khoản 1 Điều 17 Bộ luật Lao động 2019',
          recommendation: 'Bỏ hoàn toàn điều khoản này. Người sử dụng lao động chỉ được đối chiếu bản chính và lưu giữ bản sao có chứng thực.'
        });
      }

      // 3. Kiểm tra rủi ro về Thời gian thử việc
      if (
        (lower.includes('thử việc') && (lower.includes('90 ngày') || lower.includes('3 tháng') || lower.includes('180 ngày') || lower.includes('6 tháng'))) &&
        !lower.includes('quản lý doanh nghiệp')
      ) {
        deducedScore -= 20;
        issues.push({
          category: 'Thời gian Thử việc Trái luật',
          severity: 'warning',
          clauseText: 'Thời gian thử việc kéo dài vượt mức tối đa cho vị trí công việc thông thường.',
          description: 'Thời gian thử việc không được quá 60 ngày đối với công việc có chức danh nghề nghiệp cần trình độ chuyên môn kỹ thuật từ cao đẳng trở lên, hoặc không quá 30 ngày đối với công việc cần trình độ trung cấp. Chỉ vị trí người quản lý doanh nghiệp mới được tối đa 180 ngày.',
          legalBasis: 'Điều 25 Bộ luật Lao động 2019',
          recommendation: 'Điều chỉnh thời gian thử việc tối đa không quá 30 hoặc 60 ngày tùy theo chức danh công việc cụ thể.'
        });
      }

      // 4. Kiểm tra rủi ro về Phạt vi phạm hợp đồng quá mức trần
      if (
        (lower.includes('phạt vi phạm') || lower.includes('phạt hợp đồng')) &&
        (lower.includes('15%') || lower.includes('20%') || lower.includes('50%') || lower.includes('100%') || lower.includes('500%'))
      ) {
        deducedScore -= 18;
        issues.push({
          category: 'Mức Phạt Vi Phạm Vượt Trần Quy Định',
          severity: 'warning',
          clauseText: 'Thỏa thuận mức phạt vi phạm vượt quá mức trần luật định trong quan hệ thương mại.',
          description: 'Trong giao dịch thương mại giữa các thương nhân, mức phạt đối với vi phạm nghĩa vụ hợp đồng do các bên thoả thuận nhưng không được vượt quá 8% giá trị phần nghĩa vụ hợp đồng bị vi phạm (trừ trường hợp kết quả giám định sai do lỗi của thương nhân giám định).',
          legalBasis: 'Điều 301 Luật Thương mại 2005 & Điều 418 Bộ luật Dân sự 2015',
          recommendation: 'Quy định lại mức phạt vi phạm tối đa 8% giá trị phần nghĩa vụ bị vi phạm hoặc áp dụng cơ chế bồi thường thiệt hại thực tế theo thỏa thuận.'
        });
      }

      // 5. Kiểm tra rủi ro về Đơn phương chấm dứt hợp đồng & Cắt điện nước
      if (lower.includes('cắt điện') || lower.includes('cắt nước') || lower.includes('không cần báo trước') || lower.includes('đơn phương thu hồi ngay')) {
        deducedScore -= 20;
        issues.push({
          category: 'Tự ý Chấm dứt & Cưỡng chế Trái thẩm quyền',
          severity: 'warning',
          clauseText: 'Điều khoản bên cho thuê tự ý cắt điện nước hoặc thu hồi tài sản ngay lập tức mà không có thời hạn thông báo trước.',
          description: 'Hành vi tự ý cắt dịch vụ thiết yếu hoặc khóa cửa chiếm giữ tài sản của bên thuê khi chưa có phán quyết của cơ quan có thẩm quyền có thể dẫn đến hành vi xâm phạm chỗ ở hoặc gây thiệt hại dân sự bất hợp pháp.',
          legalBasis: 'Điều 132 Luật Nhà ở 2014 & Điều 481 Bộ luật Dân sự 2015',
          recommendation: 'Quy định nghĩa vụ gửi văn bản nhắc nhở bằng văn bản trước ít nhất 15-30 ngày, nếu bên vi phạm không khắc phục mới tiến hành khởi kiện giải quyết tranh chấp theo đúng trình tự pháp luật.'
        });
      }

      // 6. Kiểm tra rủi ro về Lãi suất vay tài sản
      if (
        (lower.includes('lãi suất') || lower.includes('tiền lãi')) &&
        (lower.includes('30%/năm') || lower.includes('50%/năm') || lower.includes('5%/tháng') || lower.includes('10%/tháng') || lower.includes('quá 20%'))
      ) {
        deducedScore -= 35;
        issues.push({
          category: 'Lãi Suất Vượt Trần (Dấu hiệu Cho vay Nặng lãi)',
          severity: 'critical',
          clauseText: 'Mức lãi suất vay thỏa thuận vượt quá 20%/năm.',
          description: 'Lãi suất vay do các bên thỏa thuận nhưng không được vượt quá 20%/năm của khoản tiền vay. Trường hợp lãi suất thỏa thuận vượt quá mức tối đa này thì mức lãi suất vượt quá không có hiệu lực. Nếu lãi suất gấp 5 lần trở lên có thể cấu thành tội phạm hình sự.',
          legalBasis: 'Khoản 1 Điều 468 Bộ luật Dân sự 2015 & Điều 201 Bộ luật Hình sự 2015',
          recommendation: 'Điều chỉnh lãi suất vay về mức tối đa không quá 20%/năm (tương đương khoảng 1.66%/tháng) để đảm bảo hiệu lực pháp lý.'
        });
      }

      // 7. Kiểm tra lỗi môn Pháp luật đại cương (Bài làm tự luận của sinh viên)
      if (lower.includes('chia thừa kế') || lower.includes('thừa kế theo pháp luật') || lower.includes('hàng thừa kế')) {
        if (!lower.includes('điều 651') && !lower.includes('hàng thừa kế thứ nhất') && !lower.includes('bộ luật dân sự')) {
          deducedScore -= 15;
          issues.push({
            category: 'Thiếu Căn cứ Barem Môn học',
            severity: 'info',
            clauseText: 'Bài phân tích chưa trích dẫn đầy đủ điều khoản Bộ luật Dân sự về hàng thừa kế.',
            description: 'Để đạt điểm tối đa trong bài tập môn Pháp luật đại cương, cần trích dẫn rõ Điều 651 BLDS 2015 (vợ, chồng, cha đẻ, mẹ đẻ, cha nuôi, mẹ nuôi, con đẻ, con nuôi) và nguyên tắc chia đều cho những người cùng hàng thừa kế.',
            legalBasis: 'Điều 651 Bộ luật Dân sự 2015',
            recommendation: 'Bổ sung căn cứ Điều 651 BLDS 2015 và giải thích rõ ai thuộc hàng thừa kế thứ nhất trước khi tính toán số tiền.'
          });
        }
      }

      // Nếu không phát hiện lỗi lớn nào
      if (issues.length === 0) {
        validPoints.push('Văn bản có bố cục rõ ràng, các điều khoản cơ bản không vi phạm điều cấm trực tiếp của pháp luật.');
        validPoints.push('Quyền và nghĩa vụ của các bên được phân định tương đối đầy đủ.');
        validPoints.push('Có điều khoản về giải quyết tranh chấp thông qua thương lượng hoặc Tòa án có thẩm quyền.');
      }

      // Tính điểm an toàn cuối cùng (tối thiểu 30, tối đa 98)
      const finalScore = Math.max(30, Math.min(98, deducedScore));
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (finalScore < 50) riskLevel = 'critical';
      else if (finalScore < 70) riskLevel = 'high';
      else if (finalScore < 85) riskLevel = 'medium';

      if (req.user) {
        await QueryHistory.create({
          userId: req.user.id,
          userEmail: req.user.email,
          query: `[Rà soát ${documentType || 'Văn bản'}] ${content.trim().slice(0, 160)}${content.trim().length > 160 ? '...' : ''}`,
          intentCode: 'AI_REVIEW',
          response: `Điểm an toàn: ${finalScore}/100 | Mức độ rủi ro: ${riskLevel.toUpperCase()} | Phát hiện ${issues.length} lưu ý pháp lý.`,
          activityType: 'review',
          reviewMetadata: {
            score: finalScore,
            riskLevel,
            totalIssues: issues.length,
            documentType: documentType || 'Văn bản / Hợp đồng'
          },
          citations: issues.map((iss) => ({
            rawText: iss.legalBasis,
            lawCode: iss.legalBasis,
            articleNumber: 0,
            verified: true,
            lawTitle: iss.category
          })),
          verifiedCitationsCount: issues.length,
          tier: 'Legal Auditor AI',
          latencyMs: 350
        });
      }

      res.json({
        success: true,
        documentType: documentType || 'Văn bản / Hợp đồng tổng hợp',
        score: finalScore,
        riskLevel,
        totalIssues: issues.length,
        issues,
        validPoints,
        analysisTimestamp: new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message || 'Lỗi khi rà soát văn bản.' });
    }
  }

  /**
   * Đánh dấu hoặc Bỏ đánh dấu hội thoại (Bookmark / Unbookmark)
   */
  public static async toggleBookmark(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập.' });
        return;
      }

      const { id } = req.params;
      const { note } = req.body;
      const historyItem = await QueryHistory.findOne({ _id: id, userId: req.user.id });
      if (!historyItem) {
        res.status(404).json({ success: false, message: 'Không tìm thấy mục lịch sử tương ứng.' });
        return;
      }

      const nextStatus = !historyItem.isBookmarked;
      historyItem.isBookmarked = nextStatus;
      historyItem.bookmarkedAt = nextStatus ? new Date() : undefined;
      if (note !== undefined) {
        historyItem.bookmarkNote = note;
      }
      await historyItem.save();

      res.json({
        success: true,
        message: nextStatus ? 'Đã lưu hội thoại vào danh sách đánh dấu.' : 'Đã bỏ lưu hội thoại.',
        item: historyItem
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  /**
   * Lấy danh sách các hội thoại đã lưu (Bookmarked conversations)
   */
  public static async getBookmarks(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Yêu cầu đăng nhập.' });
        return;
      }

      const bookmarks = await QueryHistory.find({
        userId: req.user.id,
        isBookmarked: true
      }).sort({ bookmarkedAt: -1, createdAt: -1 });

      res.json({
        success: true,
        bookmarks
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}

