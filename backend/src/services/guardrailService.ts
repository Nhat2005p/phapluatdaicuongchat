import { LawArticle } from '../models/LawArticle.js';

export interface ExtractedCitation {
  rawText: string;
  lawCode: string;
  articleNumber: number;
  clauseNumber?: number;
  verified: boolean;
  lawTitle?: string;
}

export class GuardrailService {
  // Regex pattern matching Vietnamese law citations:
  // e.g., "Điều 134 BLHS 2015", "Khoản 2 Điều 134 Bộ luật Hình sự", "Điều 651 BLDS 2015"
  private static citationRegex = /(?:Khoản\s+(\d+)\s+)?Điều\s+(\d+)\s+([A-Z0-9_]{3,10}|Bộ\s+luật\s+[^\n,.;]+|Luật\s+[^\n,.;]+)/gi;

  public static async scanAndVerify(text: string): Promise<{
    citations: ExtractedCitation[];
    verifiedCount: number;
    totalFound: number;
    precisionRate: number;
  }> {
    const citations: ExtractedCitation[] = [];
    const matches = Array.from(text.matchAll(this.citationRegex));

    for (const match of matches) {
      const clause = match[1] ? parseInt(match[1], 10) : undefined;
      const article = parseInt(match[2], 10);
      let lawRaw = match[3].trim().toUpperCase();

      // Normalize common law aliases
      let lawCode = 'BLHS2015';
      if (lawRaw.includes('HÌNH SỰ') || lawRaw.includes('BLHS')) lawCode = 'BLHS2015';
      else if (lawRaw.includes('DÂN SỰ') || lawRaw.includes('BLDS')) lawCode = 'BLDS2015';
      else if (lawRaw.includes('HÔN NHÂN') || lawRaw.includes('HNGD')) lawCode = 'HNGD2014';
      else if (lawRaw.includes('LAO ĐỘNG') || lawRaw.includes('BLLD')) lawCode = 'BLLD2019';
      else if (lawRaw.includes('HIẾN PHÁP') || lawRaw.includes('HP')) lawCode = 'HP2013';

      // Check DB existence
      const dbArticle = await LawArticle.findOne({
        lawCode,
        articleNumber: article
      });

      citations.push({
        rawText: match[0],
        lawCode,
        articleNumber: article,
        clauseNumber: clause,
        verified: !!dbArticle,
        lawTitle: dbArticle ? dbArticle.title : 'Chưa tìm thấy trong CSDL thực định'
      });
    }

    // Deduplicate
    const uniqueCitations = citations.filter(
      (c, idx, arr) => arr.findIndex((x) => x.lawCode === c.lawCode && x.articleNumber === c.articleNumber) === idx
    );

    const verifiedCount = uniqueCitations.filter((c) => c.verified).length;
    const precisionRate = uniqueCitations.length > 0 ? Math.round((verifiedCount / uniqueCitations.length) * 100) : 100;

    return {
      citations: uniqueCitations,
      verifiedCount,
      totalFound: uniqueCitations.length,
      precisionRate
    };
  }
}
