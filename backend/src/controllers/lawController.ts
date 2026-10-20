import { Request, Response } from 'express';
import { LawArticle } from '../models/LawArticle.js';
import { TextbookPrinciple } from '../models/TextbookPrinciple.js';

export class LawController {
  public static async getLawArticles(req: Request, res: Response): Promise<void> {
    try {
      const { lawCode, search } = req.query;
      const query: any = {};

      if (lawCode) {
        query.lawCode = (lawCode as string).toUpperCase();
      }

      if (search) {
        const searchRegex = new RegExp(search as string, 'i');
        query.$or = [{ title: searchRegex }, { contentRaw: searchRegex }, { keywords: searchRegex }];
      }

      const articles = await LawArticle.find(query).sort({ lawCode: 1, articleNumber: 1 }).limit(100);

      res.json({
        success: true,
        count: articles.length,
        articles
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async getTextbookPrinciples(req: Request, res: Response): Promise<void> {
    try {
      const principles = await TextbookPrinciple.find().sort({ topicCode: 1 });
      res.json({
        success: true,
        count: principles.length,
        principles
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  public static async createLawArticle(req: Request, res: Response): Promise<void> {
    try {
      const { articleId, lawCode, lawName, articleNumber, clauseNumber, title, contentRaw, keywords } = req.body;

      const existing = await LawArticle.findOne({ articleId });
      if (existing) {
        res.status(400).json({ success: false, message: 'Mã điều luật này đã tồn tại.' });
        return;
      }

      const article = await LawArticle.create({
        articleId,
        lawCode,
        lawName,
        articleNumber,
        clauseNumber,
        title,
        contentRaw,
        keywords: keywords || []
      });

      res.status(201).json({ success: true, message: 'Thêm điều luật mới thành công.', article });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
