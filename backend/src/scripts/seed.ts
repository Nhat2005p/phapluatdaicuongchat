import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { LawArticle } from '../models/LawArticle.js';
import { TextbookPrinciple } from '../models/TextbookPrinciple.js';
import { connectDB } from '../config/db.js';
import { PersistenceService } from '../services/persistenceService.js';

export async function runSeed(): Promise<void> {
  console.log('[Seed] Khởi tạo dữ liệu mẫu chuẩn cho 5 Dạng Đề thi Trọng tâm (U-02)...');

  // 1. Seed Users (2 Roles: student & admin)
  const salt = await bcrypt.genSalt(10);
  const studentPw = await bcrypt.hash('student123', salt);
  const adminPw = await bcrypt.hash('admin123', salt);

  await User.findOneAndUpdate(
    { email: 'student@dut.udn.vn' },
    {
      username: 'student_dut',
      email: 'student@dut.udn.vn',
      passwordHash: studentPw,
      role: 'student',
      fullName: 'Nguyễn Văn An (Sinh viên DUT)',
      studentId: '102210001'
    },
    { upsert: true, new: true }
  );

  await User.findOneAndUpdate(
    { email: 'admin@dut.udn.vn' },
    {
      username: 'admin_council',
      email: 'admin@dut.udn.vn',
      passwordHash: adminPw,
      role: 'admin',
      fullName: 'Hội đồng Chấm thi & Quản trị Hệ thống',
      studentId: 'ADMIN-PBL6'
    },
    { upsert: true, new: true }
  );

  console.log(' -> Đã cập nhật 2 tài khoản mẫu: student@dut.udn.vn và admin@dut.udn.vn');

  // Khôi phục tài khoản đã đăng ký vĩnh viễn từ file persisted_users.json
  await PersistenceService.restoreAllUsers();

  // 2. Seed Law Articles (Bộ luật Hình sự, Dân sự, Hôn nhân gia đình, Hiến pháp)
  const laws = [
    // BLHS 2015
    {
      articleId: 'BLHS2015_D9',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự 2015 (sửa đổi, bổ sung 2017)',
      articleNumber: 9,
      title: 'Phân loại tội phạm',
      contentRaw: '1. Tội phạm ít nghiêm trọng: mức cao nhất của khung hình phạt là phạt tiền, phạt cải tạo không giam giữ hoặc phạt tù đến 03 năm;\n2. Tội phạm nghiêm trọng: mức cao nhất của khung hình phạt từ trên 03 năm tù đến 07 năm tù;\n3. Tội phạm rất nghiêm trọng: mức cao nhất của khung hình phạt từ trên 07 năm tù đến 15 năm tù;\n4. Tội phạm đặc biệt nghiêm trọng: mức cao nhất của khung hình phạt từ trên 15 năm tù đến 20 năm tù, tù chung thân hoặc tử hình.',
      keywords: ['phân loại tội phạm', 'ít nghiêm trọng', 'nghiêm trọng', 'rất nghiêm trọng', 'đặc biệt nghiêm trọng', 'khung hình phạt']
    },
    {
      articleId: 'BLHS2015_D12',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự 2015 (sửa đổi, bổ sung 2017)',
      articleNumber: 12,
      title: 'Tuổi chịu trách nhiệm hình sự',
      contentRaw: '1. Người từ đủ 16 tuổi trở lên phải chịu trách nhiệm hình sự về mọi tội phạm, trừ những tội phạm mà Bộ luật này có quy định khác.\n2. Người từ đủ 14 tuổi đến dưới 16 tuổi phải chịu trách nhiệm hình sự về tội phạm rất nghiêm trọng, tội phạm đặc biệt nghiêm trọng quy định tại một số điều của Bộ luật này (gồm các tội quy định tại Điều 123, 134, 141, 142, 143, 144, 150, 151, 168, 169, 170, 171, 173, 178, 248, 249, 250, 251, 252, 299, 303 và 304).',
      keywords: ['tuổi', 'trách nhiệm hình sự', 'đủ 14 tuổi', 'đủ 16 tuổi', 'chưa thành niên']
    },
    {
      articleId: 'BLHS2015_D21',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự 2015',
      articleNumber: 21,
      title: 'Tình trạng không có năng lực trách nhiệm hình sự',
      contentRaw: 'Người thực hiện hành vi nguy hiểm cho xã hội trong khi đang mắc bệnh tâm thần, một bệnh khác làm mất khả năng nhận thức hoặc khả năng điều khiển hành vi của mình, thì không phải chịu trách nhiệm hình sự.',
      keywords: ['tâm thần', 'mất nhận thức', 'năng lực trách nhiệm hình sự', 'điều khiển hành vi']
    },
    {
      articleId: 'BLHS2015_D22',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự 2015',
      articleNumber: 22,
      title: 'Phòng vệ chính đáng',
      contentRaw: '1. Phòng vệ chính đáng là hành vi của người vì bảo vệ quyền hoặc lợi ích chính đáng của mình, của người khác hoặc lợi ích của Nhà nước, của cơ quan, tổ chức mà chống trả lại một cách cần thiết người đang có hành vi xâm phạm các lợi ích nói trên. Phòng vệ chính đáng không phải là tội phạm.',
      keywords: ['phòng vệ chính đáng', 'chống trả cần thiết', 'không phải là tội phạm', 'đúng sai']
    },
    {
      articleId: 'BLHS2015_D23',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự 2015',
      articleNumber: 23,
      title: 'Tình thế cấp thiết',
      contentRaw: '1. Tình thế cấp thiết là tình thế của người vì muốn tránh gây thiệt hại cho quyền, lợi ích chính đáng của mình, của người khác hoặc lợi ích của Nhà nước, của cơ quan, tổ chức mà không còn cách nào khác là phải gây một thiệt hại nhỏ hơn thiệt hại cần ngăn ngừa. Hành vi gây thiệt hại trong tình thế cấp thiết không phải là tội phạm.',
      keywords: ['tình thế cấp thiết', 'thiệt hại nhỏ hơn', 'không còn cách nào khác', 'không phải là tội phạm']
    },
    {
      articleId: 'BLHS2015_D134',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự 2015 (sửa đổi, bổ sung 2017)',
      articleNumber: 134,
      clauseNumber: 2,
      title: 'Tội cố ý gây thương tích hoặc gây tổn hại cho sức khỏe của người khác',
      contentRaw: '1. Người nào cố ý gây thương tích hoặc gây tổn hại cho sức khỏe của người khác mà tỷ lệ tổn thương cơ thể từ 11% đến 30% hoặc dưới 11% nhưng thuộc một trong các trường hợp luật định thì bị phạt cải tạo không giam giữ đến 03 năm hoặc phạt tù từ 06 tháng đến 03 năm.\n2. Phạm tội thuộc một trong các trường hợp sau đây, thì bị phạt tù từ 02 năm đến 06 năm: đ) Gây thương tích hoặc gây tổn hại cho sức khỏe của người khác mà tỷ lệ tổn thương cơ thể từ 11% đến 30% nhưng thuộc một trong các trường hợp quy định tại các điểm từ điểm a đến điểm k khoản 1 Điều này (dùng hung khí nguy hiểm...).',
      keywords: ['cố ý gây thương tích', 'hung khí nguy hiểm', 'thương tật 22%', 'tổn hại sức khỏe']
    },
    {
      articleId: 'BLHS2015_D168',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự 2015',
      articleNumber: 168,
      title: 'Tội cướp tài sản',
      contentRaw: '1. Người nào dùng vũ lực, đe dọa dùng vũ lực ngay tức khắc hoặc có hành vi khác làm cho người bị tấn công lâm vào tình trạng không thể chống cự được nhằm chiếm đoạt tài sản, thì bị phạt tù từ 03 năm đến 10 năm.',
      keywords: ['cướp tài sản', 'dùng vũ lực', 'chiếm đoạt tài sản', 'rất nghiêm trọng']
    },
    {
      articleId: 'BLHS2015_D173',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự 2015 (sửa đổi 2017)',
      articleNumber: 173,
      title: 'Tội trộm cắp tài sản',
      contentRaw: '1. Người nào trộm cắp tài sản của người khác trị giá từ 2.000.000 đồng đến dưới 50.000.000 đồng hoặc dưới 2.000.000 đồng nhưng thuộc một trong các trường hợp luật định thì bị phạt cải tạo không giam giữ đến 03 năm hoặc phạt tù từ 06 tháng đến 03 năm.\n2. Phạm tội thuộc một trong các trường hợp sau đây thì bị phạt tù từ 02 năm đến 07 năm: a) Chiếm đoạt tài sản trị giá từ 50.000.000 đồng đến dưới 200.000.000 đồng.',
      keywords: ['trộm cắp tài sản', 'lén lút', '50 triệu đồng', 'chiếm đoạt']
    },

    // BLDS 2015
    {
      articleId: 'BLDS2015_D612',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 612,
      title: 'Di sản',
      contentRaw: 'Di sản bao gồm tài sản riêng của người chết, phần tài sản của người chết trong tài sản chung với người khác.',
      keywords: ['di sản', 'tài sản riêng', 'tài sản chung', 'thừa kế']
    },
    {
      articleId: 'BLDS2015_D644',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 644,
      title: 'Người thừa kế không phụ thuộc vào nội dung của di chúc',
      contentRaw: '1. Những người sau đây vẫn được hưởng phần di sản bằng hai phần ba suất của một người thừa kế theo pháp luật nếu di sản được chia theo pháp luật, trong trường hợp họ không được người lập di chúc cho hưởng di sản hoặc chỉ cho hưởng phần di sản ít hơn hai phần ba suất đó:\na) Con chưa thành niên, cha, mẹ, vợ, chồng;\nb) Con thành niên mà không có khả năng lao động.\n2. Quy định tại khoản 1 Điều này không áp dụng đối với người từ chối nhận di sản theo quy định tại Điều 620 hoặc người không có quyền hưởng di sản theo quy định tại khoản 1 Điều 621 của Bộ luật này.',
      keywords: ['2/3 suất', 'không phụ thuộc di chúc', 'con chưa thành niên', 'cha mẹ vợ chồng']
    },
    {
      articleId: 'BLDS2015_D651',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 651,
      title: 'Người thừa kế theo pháp luật',
      contentRaw: '1. Những người thừa kế theo pháp luật được quy định theo thứ tự sau đây:\na) Hàng thừa kế thứ nhất gồm: vợ, chồng, cha đẻ, mẹ đẻ, cha nuôi, mẹ nuôi, con đẻ, con nuôi của người chết;\nb) Hàng thừa kế thứ hai gồm: ông nội, bà nội, ông ngoại, bà ngoại, anh ruột, chị ruột, em ruột của người chết; cháu ruột của người chết mà người chết là ông nội, bà nội, ông ngoại, bà ngoại;\nc) Hàng thừa kế thứ ba gồm: cụ nội, cụ ngoại của người chết; bác ruột, chú ruột, cậu ruột, cô ruột, dì ruột của người chết; cháu ruột của người chết mà người chết là bác ruột, chú ruột, cậu ruột, cô ruột, dì ruột; chắt ruột của người chết mà người chết là cụ nội, cụ ngoại.\n2. Những người thừa kế cùng hàng được hưởng phần di sản bằng nhau.',
      keywords: ['thừa kế', 'hàng thừa kế', 'chia di sản', 'con đẻ', 'vợ chồng', 'hàng thứ nhất']
    },
    {
      articleId: 'BLDS2015_D652',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 652,
      title: 'Thừa kế thế vị',
      contentRaw: 'Trường hợp con của người để lại di sản chết trước hoặc cùng một thời điểm với người để lại di sản thì cháu được hưởng phần di sản mà cha hoặc mẹ của cháu được hưởng nếu còn sống; nếu cháu cũng chết trước hoặc cùng một thời điểm với người để lại di sản thì chắt được hưởng phần di sản mà cha hoặc mẹ của chắt được hưởng nếu còn sống.',
      keywords: ['thừa kế thế vị', 'chết trước', 'chết cùng thời điểm', 'cháu thế vị']
    },

    {
      articleId: 'BLDS2015_D584',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 584,
      title: 'Căn cứ phát sinh trách nhiệm bồi thường thiệt hại',
      contentRaw: '1. Người nào có hành vi xâm phạm tính mạng, sức khỏe, danh dự, nhân phẩm, uy tín, tài sản, quyền, lợi ích hợp pháp khác của người khác mà gây thiệt hại thì phải bồi thường, trừ trường hợp Bộ luật này, luật khác có liên quan quy định khác.\n2. Người gây thiệt hại không phải chịu trách nhiệm bồi thường thiệt hại trong trường hợp thiệt hại phát sinh là do sự kiện bất khả kháng hoặc hoàn toàn do lỗi của bên bị thiệt hại...',
      keywords: ['bồi thường thiệt hại', 'xâm phạm tài sản', 'thiệt hại ngoài hợp đồng', 'bồi thường 4 triệu']
    },
    {
      articleId: 'BLDS2015_D601',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 601,
      title: 'Bồi thường thiệt hại do nguồn nguy hiểm cao độ gây ra',
      contentRaw: '1. Nguồn nguy hiểm cao độ bao gồm phương tiện giao thông vận tải cơ giới, hệ thống tải điện, nhà máy công nghiệp đang hoạt động, vũ khí, chất nổ, chất cháy, chất độc, chất phóng xạ, thú dữ và các nguồn nguy hiểm cao độ khác do pháp luật quy định.\n2. Chủ sở hữu, người chiếm hữu nguồn nguy hiểm cao độ phải bồi thường thiệt hại do nguồn nguy hiểm cao độ gây ra...',
      keywords: ['nguồn nguy hiểm cao độ', 'xe máy', 'ô tô', 'tai nạn giao thông', 'bồi thường thiệt hại']
    },

    // Luật Hôn nhân & Gia đình 2014
    {
      articleId: 'HNGD2014_D33',
      lawCode: 'HNGD2014',
      lawName: 'Luật Hôn nhân và Gia đình 2014',
      articleNumber: 33,
      title: 'Tài sản chung của vợ chồng',
      contentRaw: '1. Tài sản chung của vợ chồng gồm tài sản do vợ, chồng tạo ra, thu nhập do lao động, hoạt động sản xuất, kinh doanh, hoa lợi, lợi tức phát sinh từ tài sản riêng và thu nhập hợp pháp khác trong thời kỳ hôn nhân; tài sản mà vợ chồng được thừa kế chung hoặc được tặng cho chung và tài sản khác mà vợ chồng thỏa thuận là tài sản chung.\nQuyền sử dụng đất mà vợ, chồng có được sau khi kết hôn là tài sản chung của vợ chồng, trừ trường hợp vợ hoặc chồng được thừa kế riêng, được tặng cho riêng hoặc có được thông qua giao dịch bằng tài sản riêng.',
      keywords: ['tài sản chung', 'thời kỳ hôn nhân', 'vợ chồng', 'chia đôi tài sản']
    },

    // Hợp đồng & Giao dịch dân sự, Vay mượn (BLDS 2015)
    {
      articleId: 'BLDS2015_D117',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 117,
      title: 'Điều kiện có hiệu lực của giao dịch dân sự',
      contentRaw: '1. Giao dịch dân sự có hiệu lực khi có đủ các điều kiện sau đây:\na) Chủ thể có năng lực pháp luật dân sự, năng lực hành vi dân sự phù hợp với giao dịch dân sự được xác lập;\nb) Chủ thể tham gia giao dịch dân sự hoàn toàn tự nguyện;\nc) Mục đích và nội dung của giao dịch dân sự không vi phạm điều cấm của luật, không trái đạo đức xã hội.\n2. Hình thức của giao dịch dân sự là điều kiện có hiệu lực của giao dịch dân sự trong trường hợp luật có quy định.',
      keywords: ['điều kiện có hiệu lực', 'giao dịch dân sự', 'tự nguyện', 'năng lực hành vi']
    },
    {
      articleId: 'BLDS2015_D119',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 119,
      title: 'Hình thức giao dịch dân sự',
      contentRaw: '1. Giao dịch dân sự được thể hiện bằng lời nói, bằng văn bản hoặc bằng hành vi cụ thể.\nGiao dịch dân sự thông qua phương tiện điện tử dưới hình thức thông điệp dữ liệu theo quy định của pháp luật về giao dịch điện tử được coi là giao dịch bằng văn bản.\n2. Trường hợp luật quy định giao dịch dân sự phải được thể hiện bằng văn bản có công chứng, chứng thực, đăng ký thì phải tuân theo quy định đó.',
      keywords: ['hình thức giao dịch', 'văn bản', 'công chứng', 'chứng thực', 'giấy viết tay']
    },
    {
      articleId: 'BLDS2015_D357',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 357,
      title: 'Trách nhiệm do chậm thực hiện nghĩa vụ trả tiền',
      contentRaw: '1. Trường hợp bên có nghĩa vụ chậm trả tiền thì bên đó phải trả lãi đối với số tiền chậm trả tương ứng với thời gian chậm trả.\n2. Lãi suất phát sinh do chậm trả tiền được xác định theo thỏa thuận của các bên nhưng không được vượt quá mức lãi suất quy định tại khoản 1 Điều 468 của Bộ luật này; nếu không có thỏa thuận thì thực hiện theo quy định tại khoản 2 Điều 468 của Bộ luật này.',
      keywords: ['chậm trả tiền', 'lãi chậm trả', 'nghĩa vụ trả tiền', 'lãi suất']
    },
    {
      articleId: 'BLDS2015_D463',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 463,
      title: 'Hợp đồng vay tài sản',
      contentRaw: 'Hợp đồng vay tài sản là sự thỏa thuận giữa các bên, theo đó bên cho vay giao tài sản cho bên vay; khi đến hạn trả, bên vay phải hoàn trả cho bên cho vay tài sản cùng loại theo đúng số lượng, chất lượng và chỉ phải trả lãi nếu có thỏa thuận hoặc pháp luật có quy định.',
      keywords: ['hợp đồng vay tài sản', 'vay tiền', 'giấy vay', 'thời hạn trả']
    },
    {
      articleId: 'BLDS2015_D466',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 466,
      title: 'Nghĩa vụ trả nợ của bên vay',
      contentRaw: '1. Bên vay tài sản là tiền thì phải trả đủ tiền khi đến hạn; nếu tài sản là vật thì phải trả vật cùng loại đúng số lượng, chất lượng, trừ trường hợp có thỏa thuận khác.\n4. Trường hợp vay không có lãi mà khi đến hạn bên vay không trả nợ hoặc trả không đầy đủ thì bên cho vay có quyền yêu cầu trả tiền lãi với mức lãi suất theo quy định tại khoản 2 Điều 468 của Bộ luật này trên số tiền chậm trả tương ứng với thời gian chậm trả, trừ trường hợp có thỏa thuận khác hoặc luật có quy định khác.',
      keywords: ['nghĩa vụ trả nợ', 'đến hạn', 'không trả nợ', 'trả đủ tiền']
    },
    {
      articleId: 'BLHS2015_D175',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự 2015 (sửa đổi, bổ sung 2017)',
      articleNumber: 175,
      title: 'Tội lạm dụng tín nhiệm chiếm đoạt tài sản',
      contentRaw: '1. Người nào thực hiện một trong các hành vi sau đây chiếm đoạt tài sản của người khác trị giá từ 4.000.000 đồng đến dưới 50.000.000 đồng hoặc dưới 4.000.000 đồng nhưng đã bị xử phạt VPHC hoặc kết án...: a) Vay, mượn, thuê tài sản của người khác hoặc nhận được tài sản của người khác bằng hình thức hợp đồng rồi dùng thủ đoạn gian dối hoặc bỏ trốn để chiếm đoạt tài sản đó hoặc đến thời hạn trả lại tài sản mặc dù có điều kiện, khả năng nhưng cố tình không trả.\n2. Phạm tội chiếm đoạt tài sản trị giá từ 50.000.000 đồng đến dưới 200.000.000 đồng thì bị phạt tù từ 02 năm đến 07 năm.',
      keywords: ['lạm dụng tín nhiệm', 'vay mượn', 'bỏ trốn', 'cố tình không trả', '100 triệu']
    },
    // Mượn tài sản & Sự kiện bất khả kháng (BLDS 2015)
    {
      articleId: 'BLDS2015_D156',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 156,
      title: 'Thời gian không tính vào thời hiệu khởi kiện (Sự kiện bất khả kháng)',
      contentRaw: '1. Sự kiện bất khả kháng là sự kiện xảy ra một cách khách quan không thể lường trước được và không thể khắc phục được mặc dù đã áp dụng mọi biện pháp cần thiết và khả năng cho phép.\n2. Trở ngại khách quan là những trở ngại do hoàn cảnh khách quan tác động làm cho người có quyền, nghĩa vụ dân sự không thể biết về việc quyền, lợi ích hợp pháp của mình bị xâm phạm hoặc không thể thực hiện được quyền, nghĩa vụ dân sự của mình.',
      keywords: ['sự kiện bất khả kháng', 'tai nạn', 'khách quan', 'không thể lường trước']
    },
    {
      articleId: 'BLDS2015_D494',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 494,
      title: 'Hợp đồng mượn tài sản',
      contentRaw: 'Hợp đồng mượn tài sản là sự thỏa thuận giữa các bên, theo đó bên cho mượn giao tài sản cho bên mượn để sử dụng trong một thời hạn mà không phải trả tiền, bên mượn phải trả lại tài sản đó khi hết thời hạn mượn hoặc mục đích mượn đã đạt được.',
      keywords: ['hợp đồng mượn tài sản', 'mượn laptop', 'mượn đồ', 'không phải trả tiền']
    },
    {
      articleId: 'BLDS2015_D496',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 496,
      title: 'Nghĩa vụ của bên mượn tài sản',
      contentRaw: '1. Giữ gìn, bảo quản tài sản mượn, không được tự ý thay đổi tình trạng của tài sản; nếu tài sản bị hư hỏng thông thường thì phải sửa chữa.\n2. Không được cho người khác mượn lại, nếu không có sự đồng ý của bên cho mượn.\n3. Trả lại tài sản mượn đúng thời hạn; nếu không có thỏa thuận về thời hạn trả thì bên mượn phải trả lại tài sản ngay sau khi mục đích mượn đã đạt được.\n4. Bồi thường thiệt hại, nếu làm mất, hư hỏng tài sản mượn.',
      keywords: ['nghĩa vụ bên mượn', 'bảo quản tài sản', 'làm rơi vỡ', 'bồi thường hư hỏng', 'laptop']
    },
    {
      articleId: 'BLDS2015_D585',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 585,
      title: 'Nguyên tắc bồi thường thiệt hại',
      contentRaw: '1. Thiệt hại thực tế phải được bồi thường toàn bộ và kịp thời. Các bên có thể thỏa thuận về mức bồi thường, hình thức bồi thường bằng tiền, bằng hiện vật hoặc thực hiện một công việc, phương thức bồi thường một lần hoặc nhiều lần, trừ trường hợp pháp luật có quy định khác.\n2. Người chịu trách nhiệm bồi thường thiệt hại có thể được giảm mức bồi thường nếu không có lỗi hoặc có lỗi vô ý và thiệt hại quá lớn so với khả năng kinh tế của mình.',
      keywords: ['nguyên tắc bồi thường', 'toàn bộ và kịp thời', 'giảm mức bồi thường', 'lỗi vô ý']
    },
    // Luật Hôn nhân & Gia đình 2014 & Quan hệ dân sự
    {
      articleId: 'HNGD2014_D14',
      lawCode: 'HNGD2014',
      lawName: 'Luật Hôn nhân và Gia đình 2014',
      articleNumber: 14,
      title: 'Giải quyết hậu quả của việc nam, nữ chung sống với nhau như vợ chồng mà không đăng ký kết hôn',
      contentRaw: '1. Nam, nữ có đủ điều kiện kết hôn theo quy định của Luật này chung sống với nhau như vợ chồng mà không đăng ký kết hôn thì không làm phát sinh quyền, nghĩa vụ giữa vợ và chồng. Quyền, nghĩa vụ đối với con, tài sản, nghĩa vụ và hợp đồng giữa các bên được giải quyết theo quy định tại Điều 15 và Điều 16 của Luật này.\n2. Trong trường hợp nam, nữ chung sống với nhau như vợ chồng theo quy định tại khoản 1 Điều này sau đó thực hiện việc đăng ký kết hôn theo quy định của pháp luật thì quan hệ hôn nhân được xác lập từ thời điểm đăng ký kết hôn.',
      keywords: ['chung sống không đăng ký kết hôn', 'không phát sinh quan hệ vợ chồng', 'con chung', 'hôn nhân thực tế']
    },
    {
      articleId: 'HNGD2014_D15',
      lawCode: 'HNGD2014',
      lawName: 'Luật Hôn nhân và Gia đình 2014',
      articleNumber: 15,
      title: 'Quyền, nghĩa vụ của cha mẹ và con trong trường hợp nam, nữ chung sống với nhau như vợ chồng mà không đăng ký kết hôn',
      contentRaw: 'Quyền, nghĩa vụ giữa nam, nữ chung sống với nhau như vợ chồng mà không đăng ký kết hôn và con được giải quyết theo quy định của Luật này về quyền, nghĩa vụ của cha mẹ và con.',
      keywords: ['quyền nghĩa vụ cha mẹ con', 'con ngoài giá thú', 'chung sống như vợ chồng']
    },
    {
      articleId: 'HNGD2014_D88',
      lawCode: 'HNGD2014',
      lawName: 'Luật Hôn nhân và Gia đình 2014',
      articleNumber: 88,
      title: 'Xác định cha, mẹ',
      contentRaw: '1. Con sinh ra trong thời kỳ hôn nhân hoặc do người vợ có thai trong thời kỳ đó là con chung của vợ chồng.\nCon sinh ra trong thời hạn 300 ngày kể từ thời điểm chấm dứt hôn nhân được coi là con do người vợ có thai trong thời kỳ hôn nhân.\nCon sinh ra trước ngày đăng ký kết hôn và được cha mẹ thừa nhận là con chung của vợ chồng.\n2. Trong trường hợp cha, mẹ không thừa nhận con thì phải có chứng cứ và phải được Tòa án xác định.',
      keywords: ['xác định cha mẹ', 'con chung', 'thời kỳ hôn nhân']
    },
    {
      articleId: 'HNGD2014_D90',
      lawCode: 'HNGD2014',
      lawName: 'Luật Hôn nhân và Gia đình 2014',
      articleNumber: 90,
      title: 'Quyền nhận cha, mẹ',
      contentRaw: '1. Con có quyền xin nhận cha, mẹ của mình, kể cả trong trường hợp cha, mẹ đã chết.\n2. Con đã thành niên nhận cha, không cần phải có sự đồng ý của mẹ; nhận mẹ, không cần phải có sự đồng ý của cha.',
      keywords: ['quyền nhận cha mẹ', 'xin nhận cha']
    },
    {
      articleId: 'HNGD2014_D91',
      lawCode: 'HNGD2014',
      lawName: 'Luật Hôn nhân và Gia đình 2014',
      articleNumber: 91,
      title: 'Quyền nhận con',
      contentRaw: '1. Cha, mẹ có quyền nhận con, kể cả trong trường hợp con đã chết.\n2. Trong trường hợp người được nhận là con chưa thành niên thì phải có sự đồng ý của mẹ hoặc cha, trừ trường hợp mẹ hoặc cha đã chết, mất tích, mất năng lực hành vi dân sự.',
      keywords: ['quyền nhận con', 'xin nhận con', 'sự đồng ý của mẹ', 'chị A đồng ý']
    },
    {
      articleId: 'HNGD2014_D101',
      lawCode: 'HNGD2014',
      lawName: 'Luật Hôn nhân và Gia đình 2014',
      articleNumber: 101,
      title: 'Thẩm quyền giải quyết việc xác định cha, mẹ, con',
      contentRaw: '1. Cơ quan đăng ký hộ tịch có thẩm quyền xác định cha, mẹ, con theo quy định của pháp luật về hộ tịch trong trường hợp không có tranh chấp.\n2. Tòa án có thẩm quyền giải quyết việc xác định cha, mẹ, con trong trường hợp có tranh chấp hoặc người được yêu cầu xác định là cha, mẹ, con đã chết.',
      keywords: ['thẩm quyền nhận cha mẹ con', 'UBND cấp xã', 'Tòa án', 'không có tranh chấp']
    },
    {
      articleId: 'BLDS2015_D1',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 1,
      title: 'Phạm vi điều chỉnh của Bộ luật Dân sự (Quan hệ pháp luật dân sự)',
      contentRaw: 'Bộ luật này quy định địa vị pháp lý, chuẩn mực pháp lý về cách ứng xử của cá nhân, pháp nhân; quyền, nghĩa vụ về nhân thân và tài sản của cá nhân, pháp nhân trong các quan hệ được hình thành trên cơ sở bình đẳng, tự do ý chí, độc lập về tài sản và tự chịu trách nhiệm (sau đây gọi chung là quan hệ dân sự).',
      keywords: ['quan hệ pháp luật dân sự', 'bình đẳng', 'độc lập tài sản', 'quyền nhân thân', 'cơ cấu']
    },
    {
      articleId: 'BLDS2015_D74',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 74,
      title: 'Pháp nhân',
      contentRaw: '1. Một tổ chức được công nhận là pháp nhân khi có đủ các điều kiện sau đây: a) Được thành lập theo quy định của Bộ luật này, luật khác có liên quan; b) Có cơ cấu tổ chức theo quy định tại Điều 83 của Bộ luật này; c) Có tài sản độc lập với cá nhân, pháp nhân khác và tự chịu trách nhiệm bằng tài sản của mình; d) Nhân danh mình tham gia các quan hệ pháp luật một cách độc lập.',
      keywords: ['pháp nhân', 'chủ thể quan hệ dân sự', 'điều kiện pháp nhân', 'tài sản độc lập']
    }
  ];

  for (const law of laws) {
    await LawArticle.findOneAndUpdate({ articleId: law.articleId }, law, { upsert: true });
  }
  console.log(` -> Đã nạp ${laws.length} điều luật trọng tâm vào CSDL.`);

  // 3. Seed Textbook Principles (Chuẩn 5 Dạng Đề thi + General Theory)
  const principles = [
    {
      principleId: 'GT_PLDC_CH1_QPPL',
      chapter: 'Chương 1: Nguồn và Quy phạm pháp luật',
      topicCode: 'QPPL_STRUCT',
      frameworkTitle: 'Cơ cấu 3 bộ phận của Quy phạm pháp luật',
      rulesJson: {
        components: ['Giả định', 'Quy định', 'Chế tài'],
        evaluations: ['Tính chất dứt khoát hay tùy nghi', 'Khuyết thành phần hay hoàn chỉnh']
      },
      theoryContent: 'Quy phạm pháp luật là quy tắc xử sự chung do Nhà nước ban hành và bảo đảm thực hiện. Cấu trúc gồm 3 bộ phận: 1. Giả định (Ai? Điều kiện, hoàn cảnh nào?); 2. Quy định (Được làm gì, không được làm gì, phải làm gì và như thế nào?); 3. Chế tài (Hậu quả bất lợi gì nếu không tuân thủ?). Quy phạm có thể khuyết bộ phận Quy định (thường dẫn chiếu) hoặc khuyết bộ phận Chế tài.'
    },
    {
      principleId: 'GT_PLDC_CH2_VPPL',
      chapter: 'Chương 2: Vi phạm pháp luật và Trách nhiệm pháp lý',
      topicCode: 'VPPL_4_ELEMENTS',
      frameworkTitle: 'Bốn yếu tố cấu thành Vi phạm pháp luật',
      rulesJson: {
        elements: ['Mặt khách quan', 'Mặt chủ quan', 'Khách thể', 'Chủ thể'],
        subsections: {
          objective: ['Hành vi trái pháp luật', 'Hậu quả', 'Mối quan hệ nhân quả', 'Công cụ/Thời gian/Địa điểm'],
          subjective: ['Lỗi (Cố ý trực tiếp, Cố ý gián tiếp, Vô ý quá tự tin, Vô ý cẩu thả)', 'Động cơ', 'Mục đích'],
          object: ['Quan hệ xã hội được luật bảo vệ'],
          subject: ['Độ tuổi', 'Năng lực nhận thức và điều khiển hành vi']
        }
      },
      theoryContent: 'Cấu thành vi phạm pháp luật gồm 4 mặt không thể tách rời: Mặt khách quan (biểu hiện bên ngoài gồm hành vi, hậu quả, mối liên hệ nhân quả); Mặt chủ quan (trạng thái tâm lý bên trong, đặc biệt là lỗi); Khách thể (quan hệ xã hội bị xâm hại); Chủ thể (cá nhân hoặc tổ chức có năng lực trách nhiệm pháp lý).'
    },
    {
      principleId: 'GT_PLDC_CH2_TRUE_FALSE',
      chapter: 'Chương 2: Vi phạm pháp luật và Trách nhiệm pháp lý',
      topicCode: 'TRUE_FALSE',
      frameworkTitle: 'Phương pháp giải câu hỏi Nhận định Đúng / Sai',
      rulesJson: {
        steps: ['Khẳng định dứt khoát ĐÚNG hoặc SAI', 'Cơ sở lý luận giáo trình', 'Căn cứ điều luật hoặc phản ví dụ']
      },
      theoryContent: 'Dạng bài Đúng/Sai đòi hỏi kết luận rõ ràng. Mọi hành vi vi phạm pháp luật đều trái pháp luật, nhưng không phải mọi hành vi trái pháp luật đều là vi phạm pháp luật (ví dụ: người mắc bệnh tâm thần, trẻ em dưới tuổi luật định, phòng vệ chính đáng Điều 22 BLHS, tình thế cấp thiết Điều 23 BLHS).'
    },
    {
      principleId: 'GT_PLDC_CH3_INHERIT',
      chapter: 'Chương 3: Pháp luật Dân sự - Thừa kế',
      topicCode: 'CIVIL_INHERIT',
      frameworkTitle: 'Quy trình 6 bước giải bài tập Chia di sản thừa kế',
      rulesJson: {
        steps: [
          'Bước 1: Xác định tài sản chung của vợ chồng ➔ Di sản thực tế',
          'Bước 2: Xét tính hợp pháp của di chúc',
          'Bước 3: Tính giá trị 1 suất thừa kế theo pháp luật (Điều 651 BLDS)',
          'Bước 4: Trích 2/3 suất thừa kế không phụ thuộc nội dung di chúc (Điều 644 BLDS)',
          'Bước 5: Xét điều kiện thừa kế thế vị (Điều 652 BLDS)',
          'Bước 6: Bảng tổng kết số tiền phân chia cụ thể'
        ]
      },
      theoryContent: 'Di sản thừa kế gồm tài sản riêng của người chết và 1/2 tài sản chung với vợ/chồng (Điều 33 Luật HNGĐ, Điều 612 BLDS). Điều 644 bảo vệ người thân thích không phụ thuộc di chúc (được hưởng ít nhất 2/3 của một suất thừa kế theo luật).'
    },
    {
      principleId: 'GT_PLDC_CH4_CRIMINAL_AGE',
      chapter: 'Chương 4: Pháp luật Hình sự - Năng lực TNHS theo Độ tuổi',
      topicCode: 'CRIMINAL_AGE',
      frameworkTitle: 'Barem xác định Năng lực Trách nhiệm hình sự theo Độ tuổi',
      rulesJson: {
        brackets: [
          'Dưới 14 tuổi: Không chịu TNHS',
          'Từ đủ 14 đến dưới 16 tuổi: Chỉ chịu TNHS về tội rất nghiêm trọng hoặc đặc biệt nghiêm trọng quy định tại Khoản 2 Điều 12 BLHS',
          'Từ đủ 16 tuổi trở lên: Chịu TNHS về mọi tội phạm theo Khoản 1 Điều 12 BLHS'
        ]
      },
      theoryContent: 'Căn cứ Điều 12 BLHS 2015, độ tuổi chịu TNHS là mốc pháp lý then chốt. Cần đối chiếu với Điều 9 để phân loại mức độ nguy hiểm của hành vi (khung hình phạt tối đa) trước khi kết luận đối tượng có phải chịu TNHS hay không.'
    },
    {
      principleId: 'GT_PLDC_CH0_GENERAL',
      chapter: 'Chương Tổng quan: Lý luận chung về Nhà nước và Pháp luật',
      topicCode: 'GENERAL_THEORY',
      frameworkTitle: 'Khung lý luận mở rộng môn Pháp luật đại cương',
      rulesJson: {
        scope: ['Nguồn pháp luật', 'Hệ thống văn bản QPPL', 'Thực hiện pháp luật']
      },
      theoryContent: 'Lý luận chung về bản chất giai cấp và xã hội của pháp luật, các hình thức thực hiện pháp luật (Tuân thủ, Thi hành, Sử dụng, Áp dụng pháp luật) và hiệu lực của văn bản quy phạm pháp luật.'
    },
    // --- 9 CHƯƠNG GIÁO TRÌNH PHÁP LUẬT ĐẠI CƯƠNG (ĐH THƯƠNG MẠI 2021) ---
    {
      principleId: 'TMU_PLDC_CH1_NHA_NUOC',
      chapter: 'Chương 1: Những vấn đề lý luận cơ bản về nhà nước - Nhà nước CHXHCN VN',
      topicCode: 'GENERAL_THEORY',
      frameworkTitle: 'Lý luận về Nhà nước và Nhà nước CHXHCN Việt Nam (ĐH Thương Mại)',
      rulesJson: {
        origin: ['Thuyết phi Mác-xít: Thần học, Gia trưởng, Bạo lực, Khế ước xã hội', 'Học thuyết Mác-Lênin: 3 lần phân công lao động, Chế độ tư hữu và Đấu tranh giai cấp'],
        nature: ['Tính giai cấp (Kinh tế, Chính trị, Tư tưởng)', 'Tính xã hội (Duy trì trật tự chung, y tế, văn hóa, giáo dục)'],
        vietnamModel: ['Chính thể: Cộng hòa dân chủ', 'Cấu trúc: Nhà nước đơn nhất', 'Chế độ chính trị: Dân chủ XHCN', 'Bộ máy: Quốc hội, Chủ tịch nước, Chính phủ, Tòa án, Viện kiểm sát']
      },
      theoryContent: 'Nhà nước là tổ chức quyền lực công cộng đặc biệt có bộ máy cưỡng chế chuyên nghiệp. Bản chất gồm tính giai cấp và tính xã hội. Nhà nước Việt Nam là nhà nước pháp quyền XHCN của nhân dân, do nhân dân, vì nhân dân.'
    },
    {
      principleId: 'TMU_PLDC_CH2_PHAP_LUAT',
      chapter: 'Chương 2: Một số vấn đề lý luận cơ bản về pháp luật',
      topicCode: 'GENERAL_THEORY',
      frameworkTitle: 'Lý luận cơ bản về Pháp luật và Hệ thống VBQPPL (ĐH Thương Mại)',
      rulesJson: {
        nature: ['Tính giai cấp', 'Tính xã hội', 'Tính quy phạm phổ biến', 'Tính bắt buộc chung'],
        forms: ['Tập quán pháp', 'Tiền lệ pháp (Án lệ)', 'Văn bản QPPL (Luật Ban hành VBQPPL 2015)']
      },
      theoryContent: 'Pháp luật là hệ thống quy tắc xử sự mang tính bắt buộc chung do Nhà nước ban hành/thừa nhận và bảo đảm thực hiện. Hệ thống VBQPPL tuân thủ nghiêm ngặt Điều 4 và Điều 156 Luật Ban hành VBQPPL 2015.'
    },
    {
      principleId: 'TMU_PLDC_CH3_QPPL',
      chapter: 'Chương 3: Quy phạm pháp luật và Thực hiện pháp luật',
      topicCode: 'QPPL_STRUCT',
      frameworkTitle: 'Cơ cấu Quy phạm và 4 Hình thức Thực hiện Pháp luật (ĐH Thương Mại)',
      rulesJson: {
        structure: ['Giả định', 'Quy định', 'Chế tài'],
        implementation: ['Tuân thủ pháp luật (không làm điều cấm)', 'Thi hành pháp luật (thực hiện nghĩa vụ bắt buộc)', 'Sử dụng pháp luật (thực hiện quyền cho phép)', 'Áp dụng pháp luật (cơ quan nhà nước có thẩm quyền)']
      },
      theoryContent: 'Quy phạm pháp luật gồm Giả định, Quy định, Chế tài. Thực hiện pháp luật gồm 4 hình thức: Tuân thủ, Thi hành, Sử dụng và Áp dụng pháp luật.'
    },
    {
      principleId: 'TMU_PLDC_CH4_QHPL',
      chapter: 'Chương 4: Quan hệ pháp luật',
      topicCode: 'GENERAL_THEORY',
      frameworkTitle: 'Cấu thành Quan hệ pháp luật và Sự kiện pháp lý (ĐH Thương Mại)',
      rulesJson: {
        elements: ['Chủ thể (Cá nhân, Pháp nhân, Nhà nước)', 'Khách thể (Lợi ích vật chất, tinh thần)', 'Nội dung (Quyền và nghĩa vụ pháp lý)'],
        legalEvents: ['Sự biến pháp lý (tự nhiên/ngoài ý chí)', 'Hành vi pháp lý (hợp pháp hoặc không hợp pháp)']
      },
      theoryContent: 'Quan hệ pháp luật là quan hệ xã hội được quy phạm pháp luật điều chỉnh. Sự kiện pháp lý là cầu nối thực tế làm phát sinh, thay đổi, chấm dứt quan hệ pháp luật.'
    },
    {
      principleId: 'TMU_PLDC_CH5_VPPL_TNPL',
      chapter: 'Chương 5: Vi phạm pháp luật và Trách nhiệm pháp lý',
      topicCode: 'VPPL_4_ELEMENTS',
      frameworkTitle: 'Cấu thành 4 yếu tố VPPL và Phân loại Trách nhiệm pháp lý (ĐH Thương Mại)',
      rulesJson: {
        elements: ['Mặt khách quan (Hành vi, Hậu quả, Mối quan hệ nhân quả)', 'Mặt chủ quan (Lỗi cố ý/vô ý, Động cơ, Mục đích)', 'Khách thể', 'Chủ thể'],
        liabilities: ['Trách nhiệm hình sự', 'Trách nhiệm hành chính', 'Trách nhiệm dân sự', 'Trách nhiệm kỷ luật']
      },
      theoryContent: 'Vi phạm pháp luật là hành vi trái pháp luật, có lỗi, do chủ thể có năng lực trách nhiệm pháp lý thực hiện. Không áp dụng đồng thời trách nhiệm hình sự và hành chính trên cùng một vi phạm.'
    },
    {
      principleId: 'TMU_PLDC_CH6_DAN_SU',
      chapter: 'Chương 6: Một số nội dung cơ bản của Luật Dân sự',
      topicCode: 'CIVIL_INHERIT',
      frameworkTitle: 'Pháp nhân, Giao dịch dân sự, Quyền sở hữu và Thừa kế (ĐH Thương Mại)',
      rulesJson: {
        legalEntity: ['4 điều kiện thành lập pháp nhân Điều 74 BLDS 2015'],
        transactions: ['Điều kiện có hiệu lực Điều 117 BLDS 2015', 'Hậu quả vô hiệu Điều 131 BLDS 2015'],
        ownership: ['Chiếm hữu', 'Sử dụng', 'Định đoạt'],
        inheritance: ['Di sản thừa kế Điều 612', 'Không được hưởng di sản Điều 621', 'Không phụ thuộc di chúc Điều 644 (2/3 suất)', 'Thừa kế theo luật Điều 651', 'Thế vị Điều 652']
      },
      theoryContent: 'Luật Dân sự điều chỉnh quan hệ nhân thân và quan hệ tài sản trên nguyên tắc bình đẳng, tự nguyện. Thừa kế bảo đảm quyền định đoạt qua di chúc đồng thời bảo vệ thân nhân theo Điều 644 BLDS 2015.'
    },
    {
      principleId: 'TMU_PLDC_CH7_HINH_SU',
      chapter: 'Chương 7: Một số nội dung cơ bản của Luật Hình sự',
      topicCode: 'GENERAL_THEORY',
      frameworkTitle: 'Tội phạm, Phân loại, Đồng phạm và Loại trừ TNHS (ĐH Thương Mại)',
      rulesJson: {
        classification: ['Ít nghiêm trọng', 'Nghiêm trọng', 'Rất nghiêm trọng', 'Đặc biệt nghiêm trọng (Điều 9 BLHS 2015)'],
        accomplice: ['Người thực hành', 'Người tổ chức', 'Người xúi giục', 'Người giúp sức (Điều 17 BLHS)'],
        exclusion: ['Phòng vệ chính đáng (Điều 22)', 'Tình thế cấp thiết (Điều 23)', 'Sự kiện bất ngờ, Tình trạng không có năng lực TNHS']
      },
      theoryContent: 'Tội phạm là hành vi nguy hiểm cho xã hội quy định trong BLHS. Phòng vệ chính đáng và tình thế cấp thiết là các trường hợp loại trừ tính chất phạm tội và trách nhiệm hình sự.'
    },
    {
      principleId: 'TMU_PLDC_CH8_HANH_CHINH',
      chapter: 'Chương 8: Một số nội dung cơ bản của Luật Hành chính',
      topicCode: 'GENERAL_THEORY',
      frameworkTitle: 'Quản lý hành chính nhà nước và Xử phạt VPHC (ĐH Thương Mại)',
      rulesJson: {
        method: ['Mệnh lệnh đơn phương', 'Quyền uy - phục tùng'],
        sanctions: ['Cảnh cáo', 'Phạt tiền', 'Tước quyền sử dụng GPLX/chứng chỉ', 'Tịch thu tang vật', 'Trục xuất (Luật XLVPHC 2012)']
      },
      theoryContent: 'Luật Hành chính điều chỉnh các quan hệ chấp hành và điều hành của nhà nước bằng phương pháp mệnh lệnh đơn phương. Xử phạt VPHC nhằm bảo đảm trật tự quản lý hành chính.'
    },
    {
      principleId: 'TMU_PLDC_CH9_THAM_NHUNG',
      chapter: 'Chương 9: Pháp luật về Phòng, chống tham nhũng',
      topicCode: 'GENERAL_THEORY',
      frameworkTitle: 'Dấu hiệu tham nhũng và Các biện pháp phòng ngừa (ĐH Thương Mại)',
      rulesJson: {
        elements: ['Chủ thể: Người có chức vụ, quyền hạn', 'Hành vi: Lợi dụng chức vụ, quyền hạn', 'Mục đích: Vụ lợi'],
        corruptActs: ['12 hành vi tham nhũng (Tham ô, Nhận hối lộ, Lạm quyền, Giả mạo trong công tác...)'],
        prevention: ['Công khai minh bạch', 'Định mức tiêu chuẩn', 'Quy tắc ứng xử và chuyển đổi vị trí', 'Minh bạch tài sản thu nhập', 'Cải cách hành chính']
      },
      theoryContent: 'Tham nhũng là hành vi của người có chức vụ quyền hạn lợi dụng chức vụ quyền hạn vì vụ lợi. Phòng ngừa là giải pháp căn cơ qua công khai minh bạch, kê khai tài sản và cải cách hành chính.'
    }
  ];

  for (const p of principles) {
    await TextbookPrinciple.findOneAndUpdate({ principleId: p.principleId }, p, { upsert: true });
  }
  console.log(` -> Đã nạp ${principles.length} khung barem giáo trình môn học.`);
}

if (process.argv[1]?.includes('seed')) {
  (async () => {
    await connectDB();
    await runSeed();
    process.exit(0);
  })();
}
