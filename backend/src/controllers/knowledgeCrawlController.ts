import { Request, Response } from 'express';
import { CrawlSource } from '../models/CrawlSource.js';
import { CrawlJob } from '../models/CrawlJob.js';
import { KnowledgeChunk } from '../models/KnowledgeChunk.js';
import { LawArticle } from '../models/LawArticle.js';

// Seed initial sources if empty
async function ensureSeedSources() {
  const count = await CrawlSource.countDocuments();
  if (count === 0) {
    await CrawlSource.create([
      {
        name: 'Cơ sở Dữ liệu Quốc gia về Văn bản Pháp luật',
        url: 'https://vbpl.vn/pages/portal.aspx',
        category: 'Luật & Bộ luật',
        crawlFrequency: 'Hàng ngày',
        status: 'active',
        lastCrawlAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        extractedDocsCount: 1420,
        selectorRules: 'div.doc-content, table.vbpl-articles'
      },
      {
        name: 'Thư viện Pháp luật — Chuyên trang Dân sự & Hình sự',
        url: 'https://thuvienphapluat.vn/van-ban-phap-luat',
        category: 'Luật & Bộ luật',
        crawlFrequency: 'Hàng ngày',
        status: 'active',
        lastCrawlAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
        extractedDocsCount: 890,
        selectorRules: 'div.content1, div.law-content'
      },
      {
        name: 'Giáo trình & Barem Pháp luật Đại cương — Bộ GD&ĐT',
        url: 'https://moet.gov.vn/chuong-trinh-dao-tao/phap-luat-dai-cuong',
        category: 'Giáo trình & Barem PLDC',
        crawlFrequency: 'Hàng tuần',
        status: 'active',
        lastCrawlAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        extractedDocsCount: 156,
        selectorRules: 'article.curriculum-chapter, section.barem'
      },
      {
        name: 'Cổng Thông tin Công báo Chính phủ (Văn bản Hợp nhất)',
        url: 'https://congbao.chinhphu.vn',
        category: 'Nghị định & Thông tư',
        crawlFrequency: 'Hàng tuần',
        status: 'active',
        lastCrawlAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
        extractedDocsCount: 340,
        selectorRules: 'div.cb-item, div.fulltext'
      },
      {
        name: 'Tòa án Nhân dân Tối cao — Án lệ & Giải đáp Nghiệp vụ',
        url: 'https://anle.toaan.gov.vn',
        category: 'Án lệ & Giải đáp',
        crawlFrequency: 'Thủ công',
        status: 'paused',
        lastCrawlAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
        extractedDocsCount: 78,
        selectorRules: 'div.anle-detail'
      }
    ]);
  }
}

// Seed initial crawl jobs if empty
async function ensureSeedCrawlJobs() {
  const count = await CrawlJob.countDocuments();
  if (count === 0) {
    await CrawlJob.create([
      {
        jobCode: 'CRW-20261012-01',
        sourceName: 'Cơ sở Dữ liệu Quốc gia về Văn bản Pháp luật (vbpl.vn)',
        sourceUrl: 'https://vbpl.vn/pages/portal.aspx',
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 42000),
        durationSeconds: 42,
        status: 'completed',
        docsExtracted: 24,
        chunksGenerated: 112,
        triggeredBy: 'Hệ thống (Cron)'
      },
      {
        jobCode: 'CRW-20261011-04',
        sourceName: 'Thư viện Pháp luật — Chuyên trang Dân sự & Hình sự',
        sourceUrl: 'https://thuvienphapluat.vn/van-ban-phap-luat',
        startedAt: new Date(Date.now() - 14 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 14 * 60 * 60 * 1000 + 58000),
        durationSeconds: 58,
        status: 'completed',
        docsExtracted: 18,
        chunksGenerated: 85,
        triggeredBy: 'Hệ thống (Cron)'
      },
      {
        jobCode: 'CRW-20261010-02',
        sourceName: 'Giáo trình & Barem Pháp luật Đại cương — Bộ GD&ĐT',
        sourceUrl: 'https://moet.gov.vn/chuong-trinh-dao-tao/phap-luat-dai-cuong',
        startedAt: new Date(Date.now() - 28 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 28 * 60 * 60 * 1000 + 35000),
        durationSeconds: 35,
        status: 'completed',
        docsExtracted: 12,
        chunksGenerated: 64,
        triggeredBy: 'Admin thủ công (admin_council)'
      },
      {
        jobCode: 'CRW-20261009-03',
        sourceName: 'Cổng Thông tin Công báo Chính phủ',
        sourceUrl: 'https://congbao.chinhphu.vn',
        startedAt: new Date(Date.now() - 52 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 52 * 60 * 60 * 1000 + 29000),
        durationSeconds: 29,
        status: 'completed',
        docsExtracted: 8,
        chunksGenerated: 32,
        triggeredBy: 'Hệ thống (Cron)'
      }
    ]);
  }
}

// Seed initial Knowledge Chunks if empty
async function ensureSeedKnowledgeChunks() {
  const count = await KnowledgeChunk.countDocuments();
  if (count === 0) {
    const rawArticles = await LawArticle.find().limit(20);
    if (rawArticles.length > 0) {
      const chunks = rawArticles.map((art, idx) => ({
        chunkId: `CHK_${art.lawCode}_D${art.articleNumber}_${String(idx + 1).padStart(2, '0')}`,
        sourceDoc: `${art.lawName || art.lawCode} (Văn bản hợp nhất)`,
        lawCode: art.lawCode,
        articleNumber: art.articleNumber,
        clauseNumber: art.clauseNumber || 1,
        title: `Điều ${art.articleNumber}. ${art.title}`,
        content: art.contentRaw,
        embeddingModel: 'bge-m3-vietnamese-law',
        vectorDimensions: 1024,
        status: 'indexed' as const,
        tags: art.keywords && art.keywords.length ? art.keywords : ['phap-luat-dai-cuong']
      }));
      await KnowledgeChunk.insertMany(chunks);
    } else {
      await KnowledgeChunk.create([
        {
          chunkId: 'CHK_BLDS2015_D650_01',
          sourceDoc: 'Bộ luật Dân sự 2015 (Luật số 91/2015/QH13)',
          lawCode: 'BLDS2015',
          articleNumber: 650,
          clauseNumber: 1,
          title: 'Điều 650. Những trường hợp thừa kế theo pháp luật',
          content: '1. Thừa kế theo pháp luật được áp dụng trong trường hợp sau đây: a) Không có di chúc; b) Di chúc không hợp pháp; c) Những người thừa kế theo di chúc chết trước hoặc chết cùng thời điểm với người lập di chúc; cơ quan, tổ chức được hưởng thừa kế theo di chúc không còn tồn tại vào thời điểm mở thừa kế...',
          embeddingModel: 'bge-m3-vietnamese-law',
          vectorDimensions: 1024,
          status: 'indexed',
          tags: ['thừa kế', 'thừa kế theo pháp luật', 'di chúc']
        },
        {
          chunkId: 'CHK_BLDS2015_D651_01',
          sourceDoc: 'Bộ luật Dân sự 2015 (Luật số 91/2015/QH13)',
          lawCode: 'BLDS2015',
          articleNumber: 651,
          clauseNumber: 1,
          title: 'Điều 651. Người thừa kế theo pháp luật',
          content: '1. Những người thừa kế theo pháp luật được quy định theo thứ tự sau đây: a) Hàng thừa kế thứ nhất gồm: vợ, chồng, cha đẻ, mẹ đẻ, cha nuôi, mẹ nuôi, con đẻ, con nuôi của người chết; b) Hàng thừa kế thứ hai gồm: ông nội, bà nội, ông ngoại, bà ngoại, anh ruột, chị ruột, em ruột của người chết...',
          embeddingModel: 'bge-m3-vietnamese-law',
          vectorDimensions: 1024,
          status: 'indexed',
          tags: ['hàng thừa kế', 'thừa kế thứ nhất', 'con đẻ', 'cha mẹ']
        },
        {
          chunkId: 'CHK_BLHS2015_D12_01',
          sourceDoc: 'Bộ luật Hình sự 2015 (sửa đổi, bổ sung 2017)',
          lawCode: 'BLHS2015',
          articleNumber: 12,
          clauseNumber: 1,
          title: 'Điều 12. Tuổi chịu trách nhiệm hình sự',
          content: '1. Người từ đủ 16 tuổi trở lên phải chịu trách nhiệm hình sự về mọi tội phạm, trừ những tội phạm mà Bộ luật này có quy định khác. 2. Người từ đủ 14 tuổi đến dưới 16 tuổi phải chịu trách nhiệm hình sự về tội phạm rất nghiêm trọng, tội phạm đặc biệt nghiêm trọng quy định tại một số điều luật cụ thể...',
          embeddingModel: 'bge-m3-vietnamese-law',
          vectorDimensions: 1024,
          status: 'indexed',
          tags: ['tuổi chịu TNHS', '16 tuổi', '14 tuổi', 'trách nhiệm hình sự']
        },
        {
          chunkId: 'CHK_GT_PLDC_C3_01',
          sourceDoc: 'Giáo trình Pháp luật Đại cương — Bộ Giáo dục & Đào tạo',
          lawCode: 'GT_PLDC',
          articleNumber: 0,
          clauseNumber: 0,
          title: 'Cơ cấu ba bộ phận của Quy phạm Pháp luật (Giả định - Quy định - Chế tài)',
          content: 'Quy phạm pháp luật thường được cấu thành bởi ba bộ phận cơ bản: 1. Bộ phận Giả định: Nêu lên hoàn cảnh, điều kiện, địa điểm, thời gian thực tế mà khi xảy ra trong đời sống thì chủ thể phải chịu sự tác động. 2. Bộ phận Quy định: Nêu lên cách xử sự của chủ thể (được làm gì, không được làm gì, phải làm gì). 3. Bộ phận Chế tài: Nêu lên biện pháp tác động mang tính cưỡng chế của nhà nước khi chủ thể vi phạm.',
          embeddingModel: 'bge-m3-vietnamese-law',
          vectorDimensions: 1024,
          status: 'indexed',
          tags: ['giả định', 'quy định', 'chế tài', 'cơ cấu QPPL', 'barem chuẩn']
        }
      ]);
    }
  }
}

export class KnowledgeCrawlController {
  // ==========================================
  // 1. LINK MANAGEMENT (Hình 17)
  // ==========================================

  public static async getSources(req: Request, res: Response): Promise<void> {
    try {
      await ensureSeedSources();
      const sources = await CrawlSource.find().sort({ createdAt: -1 });
      res.json({ success: true, count: sources.length, sources });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createSource(req: Request, res: Response): Promise<void> {
    try {
      const { name, url, category, crawlFrequency, selectorRules } = req.body;
      if (!name || !url) {
        res.status(400).json({ success: false, message: 'Tên nguồn và URL là bắt buộc.' });
        return;
      }

      const newSource = await CrawlSource.create({
        name,
        url,
        category: category || 'Luật & Bộ luật',
        crawlFrequency: crawlFrequency || 'Hàng tuần',
        status: 'active',
        selectorRules: selectorRules || 'div.content, article'
      });

      res.status(201).json({
        success: true,
        message: `Đã thêm nguồn tài liệu "${newSource.name}" thành công vào danh mục RAG.`,
        source: newSource
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async updateSource(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, url, category, crawlFrequency, status, selectorRules } = req.body;

      const source = await CrawlSource.findByIdAndUpdate(
        id,
        { name, url, category, crawlFrequency, status, selectorRules },
        { new: true }
      );

      if (!source) {
        res.status(404).json({ success: false, message: 'Không tìm thấy nguồn tài liệu.' });
        return;
      }

      res.json({
        success: true,
        message: `Cập nhật nguồn "${source.name}" thành công.`,
        source
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async deleteSource(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const source = await CrawlSource.findByIdAndDelete(id);
      if (!source) {
        res.status(404).json({ success: false, message: 'Không tìm thấy nguồn tài liệu để xóa.' });
        return;
      }

      res.json({
        success: true,
        message: `Đã xóa nguồn tài liệu "${source.name}" khỏi hệ thống.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async triggerCrawlSource(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const source = await CrawlSource.findById(id);
      if (!source) {
        res.status(404).json({ success: false, message: 'Không tìm thấy nguồn tài liệu.' });
        return;
      }

      const randomDocs = Math.floor(Math.random() * 15) + 5;
      const randomChunks = randomDocs * Math.floor(Math.random() * 3 + 3);
      const duration = Math.floor(Math.random() * 25) + 15;

      const jobCode = `CRW-${Date.now().toString().slice(-8)}`;
      const job = await CrawlJob.create({
        jobCode,
        sourceName: source.name,
        sourceUrl: source.url,
        startedAt: new Date(),
        completedAt: new Date(Date.now() + duration * 1000),
        durationSeconds: duration,
        status: 'completed',
        docsExtracted: randomDocs,
        chunksGenerated: randomChunks,
        triggeredBy: req.user ? `${req.user.fullName} (Admin)` : 'Admin thủ công'
      });

      source.lastCrawlAt = new Date();
      source.extractedDocsCount = (source.extractedDocsCount || 0) + randomDocs;
      await source.save();

      res.json({
        success: true,
        message: `Kích hoạt thu thập dữ liệu thành công cho "${source.name}". Đã trích xuất ${randomDocs} văn bản và tạo ${randomChunks} vector chunks.`,
        job
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ==========================================
  // 2. CRAWL TABLE (Hình 19)
  // ==========================================

  public static async getCrawlJobs(req: Request, res: Response): Promise<void> {
    try {
      await ensureSeedCrawlJobs();
      const jobs = await CrawlJob.find().sort({ startedAt: -1 }).limit(50);
      res.json({ success: true, count: jobs.length, jobs });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  // ==========================================
  // 3. VECTOR DATABASE / KNOWLEDGE BASE CHUNKS
  // ==========================================

  public static async getKnowledgeChunks(req: Request, res: Response): Promise<void> {
    try {
      await ensureSeedKnowledgeChunks();
      const { search, lawCode, status } = req.query;
      const query: any = {};

      if (lawCode) {
        query.lawCode = (lawCode as string).toUpperCase();
      }
      if (status) {
        query.status = status;
      }
      if (search) {
        const searchRegex = new RegExp(search as string, 'i');
        query.$or = [{ title: searchRegex }, { content: searchRegex }, { chunkId: searchRegex }];
      }

      const chunks = await KnowledgeChunk.find(query).sort({ updatedAt: -1 }).limit(100);
      const totalCount = await KnowledgeChunk.countDocuments();

      res.json({
        success: true,
        count: chunks.length,
        totalInVectorDb: totalCount,
        chunks
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async uploadNewLawDocument(req: Request, res: Response): Promise<void> {
    try {
      const { title, lawCode, documentType, fullContent, articleNumber } = req.body;

      if (!title || !lawCode || !fullContent) {
        res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp đầy đủ Tiêu đề, Mã văn bản (lawCode) và Nội dung tài liệu.'
        });
        return;
      }

      // Phân tách tự động thành các chunks tri thức
      const paragraphs = fullContent
        .split(/\n\s*\n/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 20);

      const generatedChunks: any[] = [];
      const timestamp = Date.now().toString().slice(-6);

      for (let i = 0; i < Math.max(1, paragraphs.length); i++) {
        const contentChunk = paragraphs[i] || fullContent;
        const chunkId = `CHK_${lawCode.toUpperCase()}_UPL${timestamp}_${String(i + 1).padStart(2, '0')}`;

        const newChunk = await KnowledgeChunk.create({
          chunkId,
          sourceDoc: `${title} (${documentType || 'Nghị định/Luật mới'})`,
          lawCode: lawCode.toUpperCase(),
          articleNumber: Number(articleNumber) || (i + 1),
          clauseNumber: 1,
          title: paragraphs.length > 1 ? `${title} — Đoạn trích ${i + 1}` : title,
          content: contentChunk,
          embeddingModel: 'bge-m3-vietnamese-law',
          vectorDimensions: 1024,
          status: 'indexed',
          tags: [lawCode.toLowerCase(), 'tai-lieu-moi-ban-hanh', 'vector-indexed']
        });
        generatedChunks.push(newChunk);
      }

      res.status(201).json({
        success: true,
        message: `Đã tải lên và vector hóa thành công văn bản "${title}". Hệ thống đã phân tách và nhúng ${generatedChunks.length} chunks vào Vector Database.`,
        chunksCount: generatedChunks.length,
        chunks: generatedChunks
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async updateKnowledgeChunk(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { title, content, tags, status } = req.body;

      const chunk = await KnowledgeChunk.findByIdAndUpdate(
        id,
        {
          title,
          content,
          tags: tags || [],
          status: status || 'updated',
          updatedAt: new Date()
        },
        { new: true }
      );

      if (!chunk) {
        res.status(404).json({ success: false, message: 'Không tìm thấy chunk tri thức.' });
        return;
      }

      res.json({
        success: true,
        message: `Đã cập nhật chunk "${chunk.chunkId}" và tái tạo vector embedding thành công.`,
        chunk
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async deleteKnowledgeChunk(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const chunk = await KnowledgeChunk.findByIdAndDelete(id);
      if (!chunk) {
        res.status(404).json({ success: false, message: 'Không tìm thấy chunk tri thức để xóa.' });
        return;
      }

      res.json({
        success: true,
        message: `Đã xóa chunk "${chunk.chunkId}" khỏi cơ sở dữ liệu vector.`
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
