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
    119: 'Các biện pháp ngăn chặn và bảo đảm xử lý vi phạm hành chính',
    125: 'Tạm giữ tang vật, phương tiện, giấy phép, chứng chỉ hành nghề theo thủ tục hành chính'
  },
  VBQPPL2015: {
    1: 'Phạm vi điều chỉnh của Luật Ban hành văn bản quy phạm pháp luật',
    2: 'Quy phạm pháp luật',
    3: 'Giải thích từ ngữ trong Luật Ban hành VBQPPL',
    4: 'Hệ thống văn bản quy phạm pháp luật',
    14: 'Những hành vi bị nghiêm cấm trong xây dựng, ban hành VBQPPL',
    54: 'Trách nhiệm của các cơ quan, tổ chức, cá nhân trong việc xây dựng VBQPPL',
    55: 'Lấy ý kiến đối với đề nghị xây dựng luật, pháp lệnh',
    58: 'Thẩm định đề nghị xây dựng luật, pháp lệnh',
    79: 'Thời điểm có hiệu lực của văn bản quy phạm pháp luật',
    152: 'Hiệu lực trở về trước của văn bản quy phạm pháp luật',
    154: 'Trường hợp văn bản quy phạm pháp luật hết hiệu lực',
    156: 'Áp dụng văn bản quy phạm pháp luật'
  },
  HP2013: {
    1: 'Nước Cộng hòa xã hội chủ nghĩa Việt Nam',
    2: 'Bản chất Nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam',
    4: 'Vai trò lãnh đạo của Đảng Cộng sản Việt Nam',
    7: 'Nguyên tắc bầu cử đại biểu Quốc hội và đại biểu Hội đồng nhân dân',
    8: 'Nguyên tắc tổ chức và hoạt động của bộ máy Nhà nước',
    14: 'Quyền con người, quyền công dân',
    19: 'Quyền sống của con người',
    20: 'Quyền bất khả xâm phạm về thân thể, được pháp luật bảo hộ về sức khỏe, danh dự và nhân phẩm',
    27: 'Quyền bầu cử và ứng cử của công dân',
    31: 'Nguyên tắc suy đoán vô tội',
    32: 'Quyền sở hữu tư nhân và quyền thừa kế',
    33: 'Quyền tự do kinh doanh trong những ngành nghề mà pháp luật không cấm',
    35: 'Quyền làm việc của công dân',
    39: 'Quyền và nghĩa vụ học tập của công dân',
    65: 'Lực lượng vũ trang nhân dân',
    69: 'Vị trí, chức năng của Quốc hội',
    70: 'Nhiệm vụ và quyền hạn của Quốc hội',
    71: 'Nhiệm kỳ của mỗi khóa Quốc hội',
    73: 'Ủy ban thường vụ Quốc hội',
    74: 'Nhiệm vụ và quyền hạn của Ủy ban thường vụ Quốc hội',
    86: 'Chủ tịch nước',
    87: 'Bầu Chủ tịch nước và trách nhiệm trước Quốc hội',
    88: 'Nhiệm vụ và quyền hạn của Chủ tịch nước',
    91: 'Ban hành Lệnh, Quyết định của Chủ tịch nước',
    94: 'Vị trí, chức năng của Chính phủ',
    95: 'Cơ cấu và hoạt động của Chính phủ',
    98: 'Thủ tướng Chính phủ',
    102: 'Tòa án nhân dân',
    103: 'Nguyên tắc xét xử của Tòa án nhân dân',
    107: 'Viện kiểm sát nhân dân',
    113: 'Hội đồng nhân dân',
    114: 'Ủy ban nhân dân',
    117: 'Hội đồng bầu cử quốc gia',
    118: 'Kiểm toán nhà nước',
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
    13: 'Phạm tội do dùng rượu, bia hoặc chất kích thích mạnh khác',
    14: 'Chuẩn bị phạm tội',
    15: 'Phạm tội chưa đạt',
    16: 'Tự ý nửa chừng chấm dứt việc phạm tội',
    17: 'Đồng phạm',
    20: 'Sự kiện bất ngờ',
    21: 'Tình trạng không có năng lực trách nhiệm hình sự',
    22: 'Phòng vệ chính đáng',
    23: 'Tình thế cấp thiết',
    24: 'Gây thiệt hại trong khi bắt giữ người phạm tội',
    27: 'Thời hiệu truy cứu trách nhiệm hình sự',
    28: 'Không áp dụng thời hiệu truy cứu trách nhiệm hình sự',
    30: 'Khái niệm hình phạt',
    32: 'Hệ thống hình phạt',
    34: 'Hình phạt cảnh cáo',
    35: 'Hình phạt tiền',
    40: 'Hình phạt tử hình',
    45: 'Cơ sở quyết định hình phạt',
    51: 'Các tình tiết giảm nhẹ trách nhiệm hình sự',
    52: 'Các tình tiết tăng nặng trách nhiệm hình sự',
    65: 'Án treo',
    69: 'Xóa án tích',
    70: 'Đương nhiên được xóa án tích',
    71: 'Xóa án tích theo quyết định của Tòa án',
    73: 'Cách tính thời hạn để xóa án tích',
    76: 'Phạm vi chịu trách nhiệm hình sự của pháp nhân thương mại',
    99: 'Nguyên tắc xử lý đối với người dưới 18 tuổi phạm tội',
    101: 'Hình phạt tù có thời hạn đối với người dưới 18 tuổi phạm tội',
    109: 'Tội hoạt động nhằm lật đổ chính quyền nhân dân',
    123: 'Tội giết người',
    126: 'Tội giết người do vượt quá giới hạn phòng vệ chính đáng',
    129: 'Tội vô ý làm chết người do vi phạm quy tắc nghề nghiệp hoặc quy tắc hành chính',
    132: 'Tội không cứu giúp người đang ở trong tình trạng nguy hiểm đến tính mạng',
    133: 'Tội đe dọa giết người',
    134: 'Tội cố ý gây thương tích hoặc gây tổn hại cho sức khỏe của người khác',
    145: 'Tội giao cấu hoặc thực hiện hành vi quan hệ tình dục khác với người từ đủ 13 tuổi đến dưới 16 tuổi',
    155: 'Tội làm nhục người khác',
    156: 'Tội vu khống',
    168: 'Tội cướp tài sản',
    170: 'Tội cưỡng đoạt tài sản',
    171: 'Tội cướp giật tài sản',
    173: 'Tội trộm cắp tài sản',
    175: 'Tội lạm dụng tín nhiệm chiếm đoạt tài sản',
    178: 'Tội hủy hoại hoặc cố ý làm hư hỏng tài sản',
    185: 'Tội ngược đãi hoặc hành hạ ông bà, cha mẹ, vợ chồng, con, cháu',
    186: 'Tội từ chối hoặc trốn tránh nghĩa vụ cấp dưỡng',
    200: 'Tội trốn thuế',
    201: 'Tội cho vay lãi nặng trong giao dịch dân sự',
    202: 'Tội làm, buôn bán tem giả, vé giả',
    207: 'Tội làm, tàng trữ, vận chuyển, lưu hành tiền giả',
    249: 'Tội tàng trữ trái phép chất ma túy',
    251: 'Tội mua bán trái phép chất ma túy',
    260: 'Tội vi phạm quy định về tham gia giao thông đường bộ',
    266: 'Tội đua xe trái phép',
    304: 'Tội chế tạo, tàng trữ, vận chuyển, sử dụng, mua bán trái phép vũ khí quân dụng',
    320: 'Tội hành nghề mê tín, dị đoan',
    325: 'Tội dụ dỗ, ép buộc hoặc chứa chấp người dưới 18 tuổi phạm pháp',
    328: 'Tội môi giới mại dâm',
    330: 'Tội chống người thi hành công vụ',
    334: 'Tội vi phạm quy định về giam giữ',
    336: 'Tội đăng ký hộ tịch trái pháp luật',
    339: 'Tội giả mạo chức vụ, cấp bậc, vị trí công tác',
    352: 'Khái niệm tội phạm về chức vụ',
    353: 'Tội tham ô tài sản',
    354: 'Tội nhận hối lộ',
    355: 'Tội lạm dụng chức vụ, quyền hạn chiếm đoạt tài sản',
    364: 'Tội đưa hối lộ'
  },
  BLDS2015: {
    1: 'Phạm vi điều chỉnh của Bộ luật Dân sự',
    3: 'Các nguyên tắc cơ bản của pháp luật dân sự',
    5: 'Áp dụng tập quán',
    6: 'Áp dụng tương tự pháp luật',
    14: 'Bảo vệ quyền dân sự',
    16: 'Năng lực pháp luật dân sự của cá nhân',
    17: 'Nội dung năng lực pháp luật dân sự của cá nhân',
    19: 'Năng lực hành vi dân sự của cá nhân',
    20: 'Người thành niên',
    21: 'Người chưa thành niên',
    22: 'Mất năng lực hành vi dân sự',
    23: 'Người có khó khăn trong nhận thức, làm chủ hành vi',
    24: 'Hạn chế năng lực hành vi dân sự',
    27: 'Quyền thay đổi họ',
    34: 'Quyền được bảo vệ danh dự, nhân phẩm, uy tín',
    74: 'Pháp nhân',
    75: 'Pháp nhân thương mại',
    86: 'Năng lực pháp luật dân sự của pháp nhân',
    87: 'Trách nhiệm dân sự của pháp nhân',
    97: 'Hợp nhất, sáp nhập, chia, tách pháp nhân',
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
    130: 'Giao dịch dân sự vô hiệu từng phần',
    131: 'Hậu quả pháp lý của giao dịch dân sự vô hiệu',
    132: 'Thời hiệu yêu cầu Tòa án tuyên bố giao dịch dân sự vô hiệu',
    149: 'Thời hiệu',
    150: 'Thời hiệu khởi kiện, thời hiệu yêu cầu giải quyết việc dân sự',
    154: 'Bắt đầu lại thời hiệu khởi kiện vụ án dân sự',
    155: 'Không áp dụng thời hiệu khởi kiện',
    156: 'Thời gian không tính vào thời hiệu khởi kiện (Sự kiện bất khả kháng)',
    157: 'Gián đoạn thời hiệu khởi kiện vụ án dân sự',
    158: 'Quyền sở hữu',
    165: 'Chiếm hữu có căn cứ pháp luật',
    166: 'Quyền đòi lại tài sản',
    168: 'Quyền đòi lại động sản phải đăng ký quyền sở hữu hoặc bất động sản từ người chiếm hữu ngay tình',
    179: 'Khái niệm chiếm hữu',
    189: 'Quyền sử dụng',
    192: 'Quyền định đoạt',
    256: 'Quyền đòi lại tài sản',
    288: 'Thực hiện nghĩa vụ liên đới',
    357: 'Trách nhiệm do chậm thực hiện nghĩa vụ trả tiền',
    360: 'Trách nhiệm bồi thường thiệt hại do vi phạm nghĩa vụ',
    385: 'Khái niệm hợp đồng',
    418: 'Thỏa thuận phạt vi phạm',
    429: 'Thời hiệu khởi kiện về hợp đồng',
    430: 'Hợp đồng mua bán tài sản',
    434: 'Thời hạn thực hiện hợp đồng mua bán',
    440: 'Nghĩa vụ trả tiền trong hợp đồng mua bán',
    441: 'Thời điểm chịu rủi ro trong hợp đồng mua bán',
    445: 'Bảo đảm chất lượng vật mua bán',
    457: 'Hợp đồng tặng cho tài sản',
    463: 'Hợp đồng vay tài sản',
    466: 'Nghĩa vụ trả nợ của bên vay',
    468: 'Lãi suất trong hợp đồng vay tài sản',
    481: 'Trả tiền thuê trong hợp đồng thuê tài sản',
    494: 'Hợp đồng mượn tài sản',
    496: 'Nghĩa vụ của bên mượn tài sản',
    584: 'Căn cứ phát sinh trách nhiệm bồi thường thiệt hại',
    585: 'Nguyên tắc bồi thường thiệt hại',
    586: 'Năng lực chịu trách nhiệm bồi thường thiệt hại của cá nhân',
    587: 'Bồi thường thiệt hại do nhiều người cùng gây ra',
    588: 'Thời hiệu khởi kiện yêu cầu bồi thường thiệt hại',
    589: 'Thiệt hại do tài sản bị xâm phạm',
    590: 'Thiệt hại do sức khỏe bị xâm phạm',
    591: 'Thiệt hại do tính mạng bị xâm phạm',
    592: 'Thiệt hại do danh dự, nhân phẩm, uy tín bị xâm phạm',
    593: 'Thời hạn hưởng bồi thường thiệt hại do tính mạng, sức khỏe bị xâm phạm',
    594: 'Bồi thường thiệt hại trong trường hợp vượt quá giới hạn phòng vệ chính đáng',
    595: 'Bồi thường thiệt hại trong trường hợp vượt quá yêu cầu của tình thế cấp thiết',
    596: 'Bồi thường thiệt hại do người dùng chất kích thích gây ra',
    597: 'Bồi thường thiệt hại do người của pháp nhân gây ra',
    598: 'Bồi thường thiệt hại do người thi hành công vụ gây ra',
    599: 'Bồi thường thiệt hại do người dưới 15 tuổi, người mất năng lực hành vi dân sự gây ra trong thời gian trường học, bệnh viện, pháp nhân khác trực tiếp quản lý',
    600: 'Bồi thường thiệt hại do người làm công, người học nghề gây ra',
    601: 'Bồi thường thiệt hại do nguồn nguy hiểm cao độ gây ra',
    603: 'Bồi thường thiệt hại do súc vật gây ra',
    604: 'Bồi thường thiệt hại do cây cối gây ra',
    605: 'Bồi thường thiệt hại do nhà cửa, công trình xây dựng khác gây ra',
    606: 'Bồi thường thiệt hại do xâm phạm thi thể',
    608: 'Bồi thường thiệt hại do vi phạm quyền lợi của người tiêu dùng',
    609: 'Thiệt hại do sức khỏe bị xâm phạm (Tham chiếu)',
    610: 'Thiệt hại do tính mạng bị xâm phạm (Tham chiếu)',
    611: 'Thời điểm, địa điểm mở thừa kế',
    612: 'Di sản thừa kế',
    613: 'Người thừa kế',
    614: 'Thời điểm phát sinh quyền và nghĩa vụ của người thừa kế',
    615: 'Thực hiện nghĩa vụ tài sản do người chết để lại',
    616: 'Người quản lý di sản',
    617: 'Nghĩa vụ của người quản lý di sản',
    618: 'Quyền của người quản lý di sản',
    619: 'Việc thừa kế của những người có quyền thừa kế di sản của nhau mà chết cùng thời điểm',
    620: 'Từ chối nhận di sản',
    621: 'Người không được quyền hưởng di sản',
    622: 'Tài sản không có người nhận thừa kế',
    623: 'Thời hiệu thừa kế',
    624: 'Di chúc',
    625: 'Người lập di chúc',
    626: 'Quyền của người lập di chúc',
    627: 'Hình thức của di chúc',
    630: 'Di chúc hợp pháp',
    643: 'Hiệu lực của di chúc',
    644: 'Người thừa kế không phụ thuộc vào nội dung của di chúc',
    645: 'Di sản dùng vào việc thờ cúng',
    646: 'Di tặng',
    649: 'Thừa kế theo pháp luật',
    650: 'Những trường hợp thừa kế theo pháp luật',
    651: 'Người thừa kế theo pháp luật',
    652: 'Thừa kế thế vị',
    658: 'Thứ tự ưu tiên thanh toán di sản',
    669: 'Người thừa kế không phụ thuộc vào nội dung của di chúc (Tham chiếu)'
  },
  HNGD2014: {
    5: 'Bảo vệ chế độ hôn nhân và gia đình',
    8: 'Điều kiện kết hôn',
    9: 'Đăng ký kết hôn',
    10: 'Người có quyền yêu cầu hủy việc kết hôn trái pháp luật',
    11: 'Xử lý việc kết hôn trái pháp luật',
    14: 'Giải quyết hậu quả việc nam, nữ chung sống với nhau như vợ chồng mà không đăng ký kết hôn',
    15: 'Quyền, nghĩa vụ của cha mẹ và con trong trường hợp nam, nữ chung sống với nhau như vợ chồng mà không đăng ký kết hôn',
    33: 'Tài sản chung của vợ chồng',
    43: 'Tài sản riêng của vợ, chồng',
    46: 'Nhập tài sản riêng của vợ, chồng vào tài sản chung',
    51: 'Quyền yêu cầu giải quyết ly hôn',
    56: 'Ly hôn theo yêu cầu của một bên',
    59: 'Nguyên tắc giải quyết tài sản của vợ chồng khi ly hôn',
    65: 'Thời điểm chấm dứt hôn nhân',
    66: 'Giải quyết tài sản của vợ chồng trong trường hợp một bên chết hoặc bị Tòa án tuyên bố là đã chết',
    69: 'Nghĩa vụ và quyền của cha mẹ',
    70: 'Quyền và nghĩa vụ của con',
    71: 'Nghĩa vụ và quyền chăm sóc, nuôi dưỡng',
    72: 'Nghĩa vụ và quyền giáo dục con',
    81: 'Việc trông nom, chăm sóc, nuôi dưỡng, giáo dục con sau khi ly hôn',
    88: 'Xác định cha, mẹ',
    90: 'Quyền nhận cha, mẹ',
    91: 'Quyền nhận con',
    101: 'Thẩm quyền giải quyết việc xác định cha, mẹ, con',
    118: 'Chấm dứt nghĩa vụ cấp dưỡng'
  },
  BLLD2019: {
    13: 'Hợp đồng lao động',
    17: 'Hành vi người sử dụng lao động không được làm khi giao kết, thực hiện hợp đồng lao động',
    25: 'Thời gian thử việc',
    35: 'Quyền đơn phương chấm dứt hợp đồng lao động của người lao động',
    36: 'Quyền đơn phương chấm dứt hợp đồng lao động của người sử dụng lao động',
    39: 'Đơn phương chấm dứt hợp đồng lao động trái pháp luật',
    41: 'Nghĩa vụ của người sử dụng lao động khi đơn phương chấm dứt hợp đồng lao động trái pháp luật',
    46: 'Trợ cấp thôi việc',
    51: 'Xử lý hợp đồng lao động vô hiệu',
    122: 'Nguyên tắc, trình tự, thủ tục xử lý kỷ luật lao động',
    124: 'Hình thức xử lý kỷ luật lao động',
    125: 'Áp dụng hình thức xử lý kỷ luật sa thải',
    129: 'Bồi thường thiệt hại'
  },
  PCTN2018: {
    2: 'Các hành vi tham nhũng',
    3: 'Giải thích từ ngữ (Khái niệm tham nhũng, vụ lợi)',
    20: 'Quy tắc ứng xử của người có chức vụ, quyền hạn'
  },
  BLTTHS2015: {
    27: 'Chế độ xét xử sơ thẩm, phúc thẩm được bảo đảm',
    76: 'Xác định tư cách tham gia tố tụng',
    93: 'Các biện pháp bảo vệ người tố giác, làm chứng, bị hại',
    110: 'Giữ người trong trường hợp khẩn cấp',
    117: 'Tạm giữ',
    118: 'Thời hạn tạm giữ',
    119: 'Tạm giam',
    173: 'Thời hạn tạm giam để điều tra',
    333: 'Thời hạn kháng cáo'
  },
  BLTTDS2015: {
    45: 'Nguyên tắc giải quyết vụ việc dân sự trong trường hợp chưa có điều luật để áp dụng',
    70: 'Quyền, nghĩa vụ của đương sự',
    85: 'Người đại diện',
    284: 'Quyền rút đơn khởi kiện hoặc rút kháng cáo',
    285: 'Phạm vi xét xử phúc thẩm'
  },
  LUAT_CHUYEN_NGANH: {
    6: 'Ngành, nghề cấm đầu tư kinh doanh (Luật Đầu tư 2020)',
    17: 'Khai sinh và đăng ký hộ tịch (Luật Hộ tịch 2014)',
    19: 'Thẩm quyền đăng ký kết hôn (Luật Hộ tịch 2014)',
    24: 'Điều kiện đăng ký nhận cha, mẹ, con (Luật Hộ tịch 2014)',
    25: 'Thủ tục đăng ký nhận cha, mẹ, con (Luật Hộ tịch 2014)',
    26: 'Phạm vi thay đổi hộ tịch (Luật Hộ tịch 2014)',
    32: 'Thẩm quyền chấp thuận chủ trương đầu tư của Ủy ban nhân dân cấp tỉnh (Luật Đầu tư)',
    86: 'Bảo vệ môi trường trong hoạt động sản xuất, kinh doanh (Luật Bảo vệ môi trường 2020)',
    132: 'Đơn phương chấm dứt thực hiện hợp đồng thuê nhà ở (Luật Nhà ở 2014)',
    301: 'Mức phạt đối với vi phạm nghĩa vụ hợp đồng (Luật Thương mại 2005)'
  }
};

export class GuardrailService {
  // Regex nhận diện trích dẫn điều luật Việt Nam (dừng chính xác trước dấu *, :, ", (, quy định)
  private static citationRegex = /(?:Khoản\s+(\d+)\s+)?Điều\s+(\d+)\s+(Bộ\s+luật\s+(?:Dân\s+sự|Hình\s+sự|Lao\s+động|Tố\s+tụng\s+[^\n,.;()*:"“”]+)(?:\s+năm)?(?:\s+\d{4})?|Luật\s+[^\n,.;()*:"“”]+?(?:\s+năm\s+\d{4}|\s+\d{4})|Hiến\s+pháp(?:\s+nước\s+CHXHCN\s+Việt\s+Nam)?(?:\s+năm)?(?:\s+\d{4})?|(?:BLTTHS|BLTTDS|BLHS|BLDS|BLLD|HNGD|VBQPPL|XLVPHC|HP)(?:\s*\d{4})?)/gi;

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
      if (lawRaw.includes('TỐ TỤNG HÌNH SỰ') || lawRaw.includes('BLTTHS')) {
        lawCode = 'BLTTHS2015';
      } else if (lawRaw.includes('TỐ TỤNG DÂN SỰ') || lawRaw.includes('BLTTDS')) {
        lawCode = 'BLTTDS2015';
      } else if (lawRaw.includes('HÀNH CHÍNH') || lawRaw.includes('XLVPHC') || lawRaw.includes('VPHC')) {
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
      } else if (
        lawRaw.includes('ĐẦU TƯ') ||
        lawRaw.includes('HỘ TỊCH') ||
        lawRaw.includes('MÔI TRƯỜNG') ||
        lawRaw.includes('NHÀ Ở') ||
        lawRaw.includes('THƯƠNG MẠI')
      ) {
        lawCode = 'LUAT_CHUYEN_NGANH';
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
