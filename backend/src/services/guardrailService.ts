import { LawArticle } from '../models/LawArticle.js';

export interface ExtractedCitation {
  rawText: string;
  lawCode: string;
  articleNumber: number;
  clauseNumber?: number;
  verified: boolean;
  lawTitle?: string;
}

// Danh mục điều luật chuẩn thực định thường dùng trong chương trình Pháp luật Đại cương
const STATUTORY_KNOWLEDGE: Record<string, Record<number, string>> = {
  XLVPHC2012: {
    2: 'Giải thích từ ngữ (Khái niệm vi phạm hành chính)',
    5: 'Đối tượng bị xử lý vi phạm hành chính',
    9: 'Tình tiết giảm nhẹ trong xử lý vi phạm hành chính',
    10: 'Tình tiết tăng nặng trong xử lý vi phạm hành chính',
    11: 'Những trường hợp không xử phạt vi phạm hành chính',
    62: 'Chuyển hồ sơ vụ vi phạm có dấu hiệu tội phạm để truy cứu trách nhiệm hình sự',
    63: 'Chuyển hồ sơ vụ vi phạm để xử phạt vi phạm hành chính'
  },
  VBQPPL2015: {
    2: 'Quy phạm pháp luật',
    3: 'Giải thích từ ngữ trong Luật Ban hành VBQPPL',
    4: 'Hệ thống văn bản quy phạm pháp luật',
    156: 'Áp dụng văn bản quy phạm pháp luật'
  },
  HP2013: {
    8: 'Nguyên tắc tổ chức và hoạt động của bộ máy Nhà nước',
    14: 'Quyền con người, quyền công dân',
    65: 'Lực lượng vũ trang nhân dân',
    119: 'Hiệu lực tối cao của Hiến pháp'
  },
  BLHS2015: {
    2: 'Cơ sở của trách nhiệm hình sự',
    7: 'Hiệu lực của Bộ luật hình sự về thời gian',
    8: 'Khái niệm tội phạm',
    12: 'Tuổi chịu trách nhiệm hình sự',
    30: 'Khái niệm hình phạt',
    32: 'Hệ thống hình phạt',
    123: 'Tội giết người',
    134: 'Tội cố ý gây thương tích hoặc gây tổn hại cho sức khỏe của người khác',
    168: 'Tội cướp tài sản',
    171: 'Tội cướp giật tài sản',
    173: 'Tội trộm cắp tài sản',
    260: 'Tội vi phạm quy định về tham gia giao thông đường bộ'
  },
  BLDS2015: {
    3: 'Các nguyên tắc cơ bản của pháp luật dân sự',
    116: 'Giao dịch dân sự',
    117: 'Điều kiện có hiệu lực của giao dịch dân sự',
    122: 'Giao dịch dân sự vô hiệu',
    132: 'Giao dịch dân sự vô hiệu do bị lừa dối, đe dọa, cưỡng ép',
    468: 'Lãi suất trong hợp đồng vay tài sản',
    584: 'Căn cứ phát sinh trách nhiệm bồi thường thiệt hại',
    591: 'Thiệt hại do tính mạng bị xâm phạm',
    651: 'Người thừa kế theo pháp luật'
  },
  HNGD2014: {
    8: 'Điều kiện kết hôn',
    9: 'Đăng ký kết hôn',
    10: 'Người có quyền yêu cầu hủy việc kết hôn trái pháp luật',
    51: 'Quyền yêu cầu giải quyết ly hôn',
    56: 'Ly hôn theo yêu cầu của một bên'
  }
};

export class GuardrailService {
  // Regex nhận diện trích dẫn điều luật Việt Nam (ưu tiên các cụm từ ghép trước mã viết tắt)
  private static citationRegex = /(?:Khoản\s+(\d+)\s+)?Điều\s+(\d+)\s+(Bộ\s+luật\s+[^\n,.;()]+|Luật\s+[^\n,.;()]+|Hiến\s+pháp\s+[^\n,.;()]+|[A-Z0-9_\-]{2,16})/gi;

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
      let lawRaw = match[3]
        .replace(/[)\]:;.,]+$/, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

      // Chuẩn hóa mã luật
      let lawCode = 'BLHS2015';
      if (lawRaw.includes('HÀNH CHÍNH') || lawRaw.includes('XLVPHC') || lawRaw.includes('VPHC')) {
        lawCode = 'XLVPHC2012';
      } else if (lawRaw.includes('HÌNH SỰ') || lawRaw.includes('BLHS')) {
        lawCode = 'BLHS2015';
      } else if (lawRaw.includes('DÂN SỰ') || lawRaw.includes('BLDS')) {
        lawCode = 'BLDS2015';
      } else if (lawRaw.includes('HÔN NHÂN') || lawRaw.includes('HNGD')) {
        lawCode = 'HNGD2014';
      } else if (lawRaw.includes('LAO ĐỘNG') || lawRaw.includes('BLLD')) {
        lawCode = 'BLLD2019';
      } else if (lawRaw.includes('HIẾN PHÁP') || lawRaw.includes('HP')) {
        lawCode = 'HP2013';
      } else if (lawRaw.includes('VĂN BẢN') || lawRaw.includes('VBQPPL')) {
        lawCode = 'VBQPPL2015';
      }

      // Làm sạch chuỗi rawText hiển thị lên giao diện (loại bỏ dấu ngoặc đóng/hai chấm dính vào đuôi)
      let cleanRawText = match[0].replace(/[)\]:;.,]+$/, '').trim();

      // 1. Kiểm tra trong cơ sở dữ liệu MongoDB (nếu có)
      let isVerified = false;
      let lawTitle = '';

      try {
        if (LawArticle.db && LawArticle.db.readyState === 1) {
          const dbArticle = await LawArticle.findOne({
            lawCode,
            articleNumber: article
          });
          if (dbArticle) {
            isVerified = true;
            lawTitle = dbArticle.title;
          }
        }
      } catch (err) {
        // Fallback sang từ điển thực định tĩnh nếu DB chưa sẵn sàng
      }

      // 2. Đối soát qua tri thức luật thực định môn Pháp luật Đại cương
      if (!isVerified && STATUTORY_KNOWLEDGE[lawCode] && STATUTORY_KNOWLEDGE[lawCode][article]) {
        isVerified = true;
        lawTitle = STATUTORY_KNOWLEDGE[lawCode][article];
      }

      citations.push({
        rawText: cleanRawText,
        lawCode,
        articleNumber: article,
        clauseNumber: clause,
        verified: isVerified,
        lawTitle: isVerified ? lawTitle : 'Chưa tìm thấy trong CSDL thực định'
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
