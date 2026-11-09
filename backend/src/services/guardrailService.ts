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
    21: 'Các hình thức xử phạt vi phạm hành chính',
    62: 'Chuyển hồ sơ vụ vi phạm có dấu hiệu tội phạm để truy cứu trách nhiệm hình sự',
    63: 'Chuyển hồ sơ vụ vi phạm để xử phạt vi phạm hành chính',
    119: 'Các biện pháp ngăn chặn và bảo đảm xử lý vi phạm hành chính'
  },
  VBQPPL2015: {
    2: 'Quy phạm pháp luật',
    3: 'Giải thích từ ngữ trong Luật Ban hành VBQPPL',
    4: 'Hệ thống văn bản quy phạm pháp luật',
    156: 'Áp dụng văn bản quy phạm pháp luật'
  },
  HP2013: {
    2: 'Bản chất Nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam',
    8: 'Nguyên tắc tổ chức và hoạt động của bộ máy Nhà nước',
    14: 'Quyền con người, quyền công dân',
    19: 'Quyền sống của con người',
    27: 'Quyền bầu cử và ứng cử của công dân',
    31: 'Nguyên tắc suy đoán vô tội',
    35: 'Quyền làm việc của công dân',
    39: 'Quyền và nghĩa vụ học tập của công dân',
    65: 'Lực lượng vũ trang nhân dân',
    119: 'Hiệu lực tối cao của Hiến pháp'
  },
  BLHS2015: {
    1: 'Nhiệm vụ của Bộ luật Hình sự',
    2: 'Cơ sở của trách nhiệm hình sự',
    3: 'Nguyên tắc xử lý hình sự',
    7: 'Hiệu lực của Bộ luật hình sự về thời gian',
    8: 'Khái niệm tội phạm',
    9: 'Phân loại tội phạm',
    10: 'Cố ý phạm tội',
    11: 'Vô ý phạm tội',
    12: 'Tuổi chịu trách nhiệm hình sự',
    20: 'Sự kiện bất ngờ',
    21: 'Tình trạng không có năng lực trách nhiệm hình sự',
    22: 'Phòng vệ chính đáng',
    23: 'Tình thế cấp thiết',
    30: 'Khái niệm hình phạt',
    32: 'Hệ thống hình phạt',
    40: 'Hình phạt tử hình',
    65: 'Án treo',
    123: 'Tội giết người',
    134: 'Tội cố ý gây thương tích hoặc gây tổn hại cho sức khỏe của người khác',
    168: 'Tội cướp tài sản',
    171: 'Tội cướp giật tài sản',
    173: 'Tội trộm cắp tài sản',
    175: 'Tội lạm dụng tín nhiệm chiếm đoạt tài sản',
    178: 'Tội hủy hoại hoặc cố ý làm hư hỏng tài sản',
    185: 'Tội ngược đãi hoặc hành hạ ông bà, cha mẹ, vợ chồng, con, cháu',
    186: 'Tội từ chối hoặc trốn tránh nghĩa vụ cấp dưỡng',
    207: 'Tội làm, tàng trữ, vận chuyển, lưu hành tiền giả',
    249: 'Tội tàng trữ trái phép chất ma túy',
    251: 'Tội mua bán trái phép chất ma túy',
    260: 'Tội vi phạm quy định về tham gia giao thông đường bộ',
    266: 'Tội đua xe trái phép',
    304: 'Tội chế tạo, tàng trữ, vận chuyển, sử dụng, mua bán trái phép vũ khí quân dụng',
    330: 'Tội chống người thi hành công vụ',
    352: 'Khái niệm tội phạm về chức vụ'
  },
  BLDS2015: {
    1: 'Phạm vi điều chỉnh của Bộ luật Dân sự',
    3: 'Các nguyên tắc cơ bản của pháp luật dân sự',
    5: 'Áp dụng tập quán',
    6: 'Áp dụng tương tự pháp luật',
    16: 'Năng lực pháp luật dân sự của cá nhân',
    17: 'Nội dung năng lực pháp luật dân sự của cá nhân',
    19: 'Năng lực hành vi dân sự của cá nhân',
    20: 'Người thành niên',
    21: 'Người chưa thành niên',
    22: 'Mất năng lực hành vi dân sự',
    23: 'Người có khó khăn trong nhận thức, làm chủ hành vi',
    24: 'Hạn chế năng lực hành vi dân sự',
    27: 'Quyền thay đổi họ',
    74: 'Pháp nhân',
    75: 'Pháp nhân thương mại',
    101: 'Chủ thể trong quan hệ dân sự có sự tham gia của hộ gia đình, tổ hợp tác',
    105: 'Tài sản',
    107: 'Bất động sản và động sản',
    116: 'Giao dịch dân sự',
    117: 'Điều kiện có hiệu lực của giao dịch dân sự',
    119: 'Hình thức giao dịch dân sự',
    122: 'Giao dịch dân sự vô hiệu',
    123: 'Giao dịch dân sự vô hiệu do vi phạm điều cấm của luật, trái đạo đức xã hội',
    124: 'Giao dịch dân sự vô hiệu do giả tạo',
    125: 'Giao dịch dân sự vô hiệu do người chưa thành niên, người mất NLHVDS xác lập',
    126: 'Giao dịch dân sự vô hiệu do bị nhầm lẫn',
    127: 'Giao dịch dân sự vô hiệu do bị lừa dối, đe dọa, cưỡng ép',
    128: 'Giao dịch dân sự vô hiệu do người xác lập không nhận thức và làm chủ được hành vi',
    129: 'Giao dịch dân sự vô hiệu do không tuân thủ quy định về hình thức',
    131: 'Hậu quả pháp lý của giao dịch dân sự vô hiệu',
    132: 'Thời hiệu yêu cầu Tòa án tuyên bố giao dịch dân sự vô hiệu',
    156: 'Thời gian không tính vào thời hiệu khởi kiện (Sự kiện bất khả kháng)',
    158: 'Quyền sở hữu',
    165: 'Chiếm hữu có căn cứ pháp luật',
    179: 'Khái niệm chiếm hữu',
    189: 'Quyền sử dụng',
    192: 'Quyền định đoạt',
    357: 'Trách nhiệm do chậm thực hiện nghĩa vụ trả tiền',
    360: 'Trách nhiệm bồi thường thiệt hại do vi phạm nghĩa vụ',
    385: 'Khái niệm hợp đồng',
    430: 'Hợp đồng mua bán tài sản',
    434: 'Thời hạn thực hiện hợp đồng mua bán',
    440: 'Nghĩa vụ trả tiền trong hợp đồng mua bán',
    445: 'Bảo đảm chất lượng vật mua bán',
    463: 'Hợp đồng vay tài sản',
    466: 'Nghĩa vụ trả nợ của bên vay',
    468: 'Lãi suất trong hợp đồng vay tài sản',
    494: 'Hợp đồng mượn tài sản',
    496: 'Nghĩa vụ của bên mượn tài sản',
    584: 'Căn cứ phát sinh trách nhiệm bồi thường thiệt hại',
    585: 'Nguyên tắc bồi thường thiệt hại',
    587: 'Bồi thường thiệt hại do nhiều người cùng gây ra',
    589: 'Thiệt hại do tài sản bị xâm phạm',
    590: 'Thiệt hại do sức khỏe bị xâm phạm',
    591: 'Thiệt hại do tính mạng bị xâm phạm',
    594: 'Bồi thường thiệt hại trong trường hợp vượt quá giới hạn phòng vệ chính đáng',
    595: 'Bồi thường thiệt hại trong trường hợp vượt quá yêu cầu của tình thế cấp thiết',
    601: 'Bồi thường thiệt hại do nguồn nguy hiểm cao độ gây ra',
    612: 'Di sản thừa kế',
    624: 'Di chúc',
    644: 'Người thừa kế không phụ thuộc vào nội dung của di chúc',
    650: 'Những trường hợp thừa kế theo pháp luật',
    651: 'Người thừa kế theo pháp luật',
    652: 'Thừa kế thế vị'
  },
  HNGD2014: {
    8: 'Điều kiện kết hôn',
    9: 'Đăng ký kết hôn',
    10: 'Người có quyền yêu cầu hủy việc kết hôn trái pháp luật',
    11: 'Xử lý việc kết hôn trái pháp luật',
    14: 'Giải quyết hậu quả việc nam, nữ chung sống với nhau như vợ chồng mà không đăng ký kết hôn',
    15: 'Quyền, nghĩa vụ của cha mẹ và con trong trường hợp nam, nữ chung sống với nhau như vợ chồng mà không đăng ký kết hôn',
    33: 'Tài sản chung của vợ chồng',
    51: 'Quyền yêu cầu giải quyết ly hôn',
    56: 'Ly hôn theo yêu cầu của một bên',
    69: 'Nghĩa vụ và quyền của cha mẹ',
    70: 'Quyền và nghĩa vụ của con',
    71: 'Nghĩa vụ và quyền chăm sóc, nuôi dưỡng',
    72: 'Nghĩa vụ và quyền giáo dục con',
    88: 'Xác định cha, mẹ',
    90: 'Quyền nhận cha, mẹ',
    91: 'Quyền nhận con',
    101: 'Thẩm quyền giải quyết việc xác định cha, mẹ, con'
  },
  PCTN2018: {
    2: 'Các hành vi tham nhũng',
    3: 'Giải thích từ ngữ (Khái niệm tham nhũng, vụ lợi)'
  }
};

export class GuardrailService {
  // Regex nhận diện trích dẫn điều luật Việt Nam (dừng chính xác trước dấu *, :, ", (, quy định)
  private static citationRegex = /(?:Khoản\s+(\d+)\s+)?Điều\s+(\d+)\s+(Bộ\s+luật\s+(?:Dân\s+sự|Hình\s+sự|Lao\s+động|Tố\s+tụng\s+[^\n,.;()*:"“”]+)(?:\s+năm)?(?:\s+\d{4})?|Luật\s+[^\n,.;()*:"“”]+?(?:\s+năm\s+\d{4}|\s+\d{4})|Hiến\s+pháp(?:\s+nước\s+CHXHCN\s+Việt\s+Nam)?(?:\s+năm)?(?:\s+\d{4})?|(?:BLHS|BLDS|BLLD|HNGD|VBQPPL|XLVPHC|HP)(?:\s*\d{4})?)/gi;

  public static async scanAndVerify(text: string): Promise<{
    citations: ExtractedCitation[];
    verifiedCount: number;
    totalFound: number;
    precisionRate: number;
  }> {
    const citations: ExtractedCitation[] = [];
    const seenKeys = new Set<string>();
    const matches = Array.from(text.matchAll(this.citationRegex));

    for (const match of matches) {
      const clause = match[1] ? parseInt(match[1], 10) : undefined;
      const article = parseInt(match[2], 10);
      const lawRaw = match[3]
        .replace(/[*_)\]:;.,"“”]+$/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase();

      // Chuẩn hóa mã luật
      let lawCode = 'BLHS2015';
      if (lawRaw.includes('HÀNH CHÍNH') || lawRaw.includes('XLVPHC') || lawRaw.includes('VPHC')) {
        lawCode = 'XLVPHC2012';
      } else if (lawRaw.includes('THAM NHŨNG') || lawRaw.includes('PCTN')) {
        lawCode = 'PCTN2018';
      } else if (lawRaw.includes('HÌNH SỰ') || lawRaw.includes('BLHS')) {
        lawCode = 'BLHS2015';
      } else if (lawRaw.includes('DÂN SỰ') || lawRaw.includes('BLDS')) {
        lawCode = 'BLDS2015';
      } else if (lawRaw.includes('HÔN NHÂN') || lawRaw.includes('HNGD') || lawRaw.includes('HNGĐ')) {
        lawCode = 'HNGD2014';
      } else if (lawRaw.includes('LAO ĐỘNG') || lawRaw.includes('BLLD')) {
        lawCode = 'BLLD2019';
      } else if (lawRaw.includes('HIẾN PHÁP') || lawRaw === 'HP' || lawRaw.startsWith('HP')) {
        lawCode = 'HP2013';
      } else if (lawRaw.includes('VĂN BẢN') || lawRaw.includes('VBQPPL')) {
        lawCode = 'VBQPPL2015';
      }

      const dedupKey = `${lawCode}_${article}_${clause || 0}`;
      if (seenKeys.has(dedupKey)) continue;
      seenKeys.add(dedupKey);

      // Làm sạch chuỗi rawText hiển thị lên giao diện (loại bỏ dấu *, ngoặc đóng, hai chấm dính vào đuôi)
      const cleanRawText = match[0]
        .replace(/[*_`"“”]+/g, '')
        .replace(/[)\]:;.,]+$/, '')
        .replace(/\s+/g, ' ')
        .trim();

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
      } catch {
        // Fallback sang STATUTORY_KNOWLEDGE nếu DB chưa kết nối
      }

      // 2. Đối chiếu với Từ điển Điều luật Thực định (STATUTORY_KNOWLEDGE)
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
        lawTitle: lawTitle || undefined
      });
    }

    const verifiedCount = citations.filter((c) => c.verified).length;
    const totalFound = citations.length;
    const precisionRate = totalFound > 0 ? Math.round((verifiedCount / totalFound) * 100) : 100;

    return {
      citations,
      verifiedCount,
      totalFound,
      precisionRate
    };
  }
}
