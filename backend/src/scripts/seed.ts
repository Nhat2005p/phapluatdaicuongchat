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

  // Khôi phục toàn bộ lịch sử hỏi đáp của người dùng từ file persisted_history.json
  await PersistenceService.restoreAllHistory();

  // 2. Seed Law Articles (Bộ luật Hình sự, Dân sự, Hôn nhân gia đình, Hiến pháp)
  const laws = [
    // BLHS 2015
    {
      articleId: 'BLHS2015_D123',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự 2015 (sửa đổi, bổ sung 2017)',
      articleNumber: 123,
      title: 'Tội giết người',
      contentRaw: '1. Người nào giết người thuộc một trong các trường hợp sau đây, thì bị phạt tù từ 12 năm đến 20 năm, tù chung thân hoặc tử hình: a) Giết 02 người trở lên; b) Giết người dưới 16 tuổi; c) Giết phụ nữ mà biết là có thai; d) Giết người đang thi hành công vụ;... n) Có tính chất côn đồ; p) Vì động cơ đê hèn...\n2. Phạm tội không thuộc các trường hợp quy định tại khoản 1 Điều này, thì bị phạt tù từ 07 năm đến 15 năm.\n3. Người chuẩn bị phạm tội này, thì bị phạt tù từ 01 năm đến 05 năm.',
      keywords: ['tội giết người', 'đâm chết', 'chém chết', 'tước đoạt mạng sống', 'giết người', 'tử hình', 'tù chung thân']
    },
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
      contentRaw: '1. Tài sản chung của vợ chồng gồm tài sản do vợ, chồng tạo ra, thu nhập do lao động, hoạt động sản xuất, kinh doanh, hoa lợi, lợi tức phát sinh từ tài sản riêng và thu nhập hợp pháp khác trong thời kỳ hôn nhân; tài sản mà vợ chồng được thừa kế chung hoặc được tặng cho chung và tài sản khác mà vợ chồng thỏa thuận là tài sản chung.\nQuyền sử dụng đất mà vợ, chồng có được sau khi kết hôn là tài sản chung của vợ chồng, trừ trường hợp vợ hoặc chồng được thừa kế riêng, được tặng cho riêng hoặc có được thông qua giao dịch bằng tài sản riêng.\n2. Tài sản chung của vợ chồng thuộc sở hữu chung hợp nhất, được dùng để bảo đảm nhu cầu của gia đình, thực hiện nghĩa vụ chung của vợ chồng.',
      keywords: ['tài sản chung', 'thời kỳ hôn nhân', 'vợ chồng', 'chia đôi tài sản', 'thừa kế chung', 'tặng cho chung']
    },
    {
      articleId: 'HNGD2014_D43',
      lawCode: 'HNGD2014',
      lawName: 'Luật Hôn nhân và Gia đình 2014',
      articleNumber: 43,
      title: 'Tài sản riêng của vợ, chồng',
      contentRaw: '1. Tài sản riêng của vợ, chồng gồm tài sản mà mỗi người có trước khi kết hôn; tài sản được thừa kế riêng, được tặng cho riêng trong thời kỳ hôn nhân; tài sản được chia riêng cho vợ, chồng theo quy định tại các điều 38, 39 và 40 của Luật này; tài sản phục vụ nhu cầu thiết yếu của vợ, chồng và tài sản khác mà theo quy định của pháp luật thuộc sở hữu riêng của vợ, chồng.\n2. Tài sản được hình thành từ tài sản riêng của vợ, chồng cũng là tài sản riêng của vợ, chồng. Hoa lợi, lợi tức phát sinh từ tài sản riêng trong thời kỳ hôn nhân được thực hiện theo quy định tại khoản 1 Điều 33 và khoản 1 Điều 40 của Luật này.',
      keywords: ['tài sản riêng', 'tặng cho riêng', 'thừa kế riêng', 'cho riêng', 'nhà chồng cho', 'nhà vợ cho', 'tài sản trước kết hôn', 'cho tặng']
    },
    {
      articleId: 'HNGD2014_D46',
      lawCode: 'HNGD2014',
      lawName: 'Luật Hôn nhân và Gia đình 2014',
      articleNumber: 46,
      title: 'Nhập tài sản riêng của vợ, chồng vào tài sản chung',
      contentRaw: '1. Việc nhập tài sản riêng của vợ, chồng vào tài sản chung được thực hiện theo thỏa thuận của vợ chồng.\n2. Tài sản được nhập vào tài sản chung mà theo quy định của pháp luật, giao dịch liên quan đến tài sản đó phải tuân theo hình thức nhất định thì thỏa thuận đó phải bảo đảm hình thức theo quy định của pháp luật.\n3. Nghĩa vụ liên quan đến tài sản riêng đã nhập vào tài sản chung được thực hiện bằng tài sản chung, trừ trường hợp vợ chồng có thỏa thuận khác hoặc pháp luật có quy định khác.',
      keywords: ['nhập tài sản riêng', 'tài sản chung', 'thỏa thuận nhập tài sản', 'nhập vào tài sản chung']
    },
    {
      articleId: 'HNGD2014_D59',
      lawCode: 'HNGD2014',
      lawName: 'Luật Hôn nhân và Gia đình 2014',
      articleNumber: 59,
      title: 'Nguyên tắc giải quyết tài sản của vợ chồng khi ly hôn',
      contentRaw: '1. Trong trường hợp chế độ tài sản của vợ chồng theo luật định thì việc giải quyết tài sản do các bên thỏa thuận; nếu không thỏa thuận được thì theo yêu cầu của vợ, chồng hoặc của cả hai vợ chồng, Tòa án giải quyết theo quy định tại các khoản 2, 3, 4 và 5 Điều này...\n2. Tài sản chung của vợ chồng được chia đôi nhưng có tính đến các yếu tố sau đây:\na) Hoàn cảnh của gia đình và của vợ, chồng;\nb) Công sức đóng góp của vợ, chồng vào việc tạo lập, duy trì và phát triển khối tài sản chung. Lao động của vợ, chồng trong gia đình được coi như lao động có thu nhập;\nc) Bảo vệ lợi ích chính đáng của mỗi bên trong sản xuất, kinh doanh và nghề nghiệp để các bên có điều kiện tiếp tục lao động tạo thu nhập;\nd) Lỗi của mỗi bên trong vi phạm quyền, nghĩa vụ của vợ chồng.\n4. Tài sản riêng của vợ, chồng thuộc quyền sở hữu của người đó, trừ trường hợp tài sản riêng đã nhập vào tài sản chung theo quy định của Luật này. Trong trường hợp có sự sáp nhập, trộn lẫn giữa tài sản riêng với tài sản chung mà vợ, chồng có yêu cầu chia tài sản thì được thanh toán phần giá trị tài sản của mình đóng góp vào khối tài sản đó, trừ trường hợp vợ chồng có thỏa thuận khác.',
      keywords: ['chia tài sản khi ly hôn', 'nguyên tắc giải quyết tài sản', 'tài sản riêng thuộc quyền sở hữu của người đó', 'chia đôi tài sản', 'công sức đóng góp', 'ly hôn chia tài sản']
    },
    {
      articleId: 'BLDS2015_D457',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 457,
      title: 'Hợp đồng tặng cho tài sản',
      contentRaw: 'Hợp đồng tặng cho tài sản là sự thỏa thuận giữa các bên, theo đó bên tặng cho giao tài sản của mình và chuyển quyền sở hữu cho bên được tặng cho mà không yêu cầu đền bù, bên được tặng cho đồng ý nhận.',
      keywords: ['hợp đồng tặng cho tài sản', 'tặng cho', 'chuyển quyền sở hữu', 'cho tặng', 'nhà chồng cho']
    },
    {
      articleId: 'GT2019_ND100',
      lawCode: 'ND100_2019',
      lawName: 'Nghị định 100/2019/NĐ-CP (sửa đổi bổ sung bởi Nghị định 123/2021/NĐ-CP)',
      articleNumber: 6,
      title: 'Xử phạt người điều khiển xe mô tô, xe gắn máy vi phạm quy tắc giao thông đường bộ',
      contentRaw: '1. Phạt tiền từ 800.000 đồng đến 1.000.000 đồng đối với người điều khiển xe thực hiện hành vi không chấp hành hiệu lệnh của đèn tín hiệu giao thông (vượt đèn đỏ hoặc đèn vàng trái quy định).\n2. Ngoài việc bị phạt tiền, người điều khiển xe thực hiện hành vi vi phạm còn bị áp dụng hình thức xử phạt bổ sung: bị tước quyền sử dụng Giấy phép lái xe từ 01 tháng đến 03 tháng.',
      keywords: ['vượt đèn đỏ', 'giao thông', 'xe máy', 'tước bằng lái', 'xử phạt vi phạm giao thông']
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
      articleId: 'BLDS2015_D131',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 131,
      title: 'Hậu quả pháp lý của giao dịch dân sự vô hiệu',
      contentRaw: '1. Giao dịch dân sự vô hiệu không làm phát sinh, thay đổi, chấm dứt quyền, nghĩa vụ dân sự của các bên kể từ thời điểm giao dịch được xác lập.\n2. Khi giao dịch dân sự vô hiệu thì các bên khôi phục lại tình trạng ban đầu, hoàn trả cho nhau những gì đã nhận. Trường hợp không thể hoàn trả được bằng hiện vật thì trị giá thành tiền để hoàn trả.\n3. Bên ngay tình trong việc thu hoa lợi, lợi tức không phải hoàn trả lại hoa lợi, lợi tức đó.\n4. Bên có lỗi gây thiệt hại thì phải bồi thường.',
      keywords: ['hậu quả giao dịch vô hiệu', 'khôi phục lại tình trạng ban đầu', 'hoàn trả những gì đã nhận', 'bồi thường thiệt hại', 'giao dịch vô hiệu']
    },
    {
      articleId: 'BLDS2015_D158',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 158,
      title: 'Quyền sở hữu',
      contentRaw: 'Quyền sở hữu bao gồm quyền chiếm hữu, quyền sử dụng và quyền định đoạt tài sản của chủ sở hữu theo quy định của luật.',
      keywords: ['quyền sở hữu', 'quyền chiếm hữu', 'quyền sử dụng', 'quyền định đoạt', 'chủ sở hữu']
    },
    {
      articleId: 'BLDS2015_D166',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 166,
      title: 'Quyền đòi lại tài sản của chủ sở hữu, chủ thể có quyền khác đối với tài sản',
      contentRaw: '1. Chủ sở hữu, chủ thể có quyền khác đối với tài sản có quyền đòi lại tài sản từ người chiếm hữu, người sử dụng tài sản, người được lợi về tài sản không có căn cứ pháp luật.\n2. Chủ sở hữu không có quyền đòi lại tài sản từ sự chiếm hữu của người chiếm hữu ngay tình, nếu thời hiệu khởi kiện đã hết hoặc thuộc trường hợp quy định tại khoản 2 Điều 168 của Bộ luật này.',
      keywords: ['quyền đòi lại tài sản', 'chủ sở hữu đòi lại tài sản', 'chiếm hữu không có căn cứ pháp luật', 'đòi lại xe']
    },
    {
      articleId: 'BLDS2015_D168',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự 2015',
      articleNumber: 168,
      title: 'Quyền đòi lại động sản phải đăng ký quyền sở hữu hoặc bất động sản từ người chiếm hữu ngay tình',
      contentRaw: 'Chủ sở hữu được đòi lại động sản phải đăng ký quyền sở hữu hoặc bất động sản từ người chiếm hữu ngay tình, trừ trường hợp người thứ ba ngay tình nhận được tài sản này thông qua bán đấu giá tại tổ chức có thẩm quyền hoặc giao dịch với người mà theo bản án, quyết định của cơ quan nhà nước có thẩm quyền là chủ sở hữu tài sản nhưng sau đó bản án, quyết định bị hủy, sửa.',
      keywords: ['đòi lại động sản đăng ký quyền sở hữu', 'xe máy phải đăng ký', 'người chiếm hữu ngay tình', 'đòi lại xe máy từ người thứ ba']
    },
    {
      articleId: 'BLHS2015_D175',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự 2015 (sửa đổi, bổ sung 2017)',
      articleNumber: 175,
      title: 'Tội lạm dụng tín nhiệm chiếm đoạt tài sản',
      contentRaw: '1. Người nào thực hiện một trong các hành vi sau đây chiếm đoạt tài sản của người khác trị giá từ 4.000.000 đồng đến dưới 50.000.000 đồng hoặc dưới 4.000.000 đồng nhưng đã bị xử phạt vi phạm hành chính về hành vi chiếm đoạt tài sản hoặc đã bị kết án về tội này...:\na) Vay, mượn, thuê tài sản của người khác hoặc nhận được tài sản của người khác bằng hình thức hợp đồng rồi dùng thủ đoạn gian dối hoặc bỏ trốn để chiếm đoạt tài sản đó hoặc đến thời hạn trả lại tài sản mặc dù có điều kiện, khả năng nhưng cố tình không trả;\nb) Vay, mượn, thuê tài sản của người khác hoặc nhận được tài sản của người khác bằng hình thức hợp đồng và đã sử dụng tài sản đó vào mục đích bất hợp pháp dẫn đến không có khả năng trả lại tài sản.',
      keywords: ['lạm dụng tín nhiệm chiếm đoạt tài sản', 'mượn xe đem bán', 'thuê xe đem bán', 'chiếm đoạt tài sản', 'bán xe của người khác']
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
    },

    // Hiến pháp năm 2013 (Lý luận cơ bản về Nhà nước & Bộ máy nhà nước)
    {
      articleId: 'HP2013_D1',
      lawCode: 'HP2013',
      lawName: 'Hiến pháp năm 2013',
      articleNumber: 1,
      title: 'Chủ quyền quốc gia và toàn vẹn lãnh thổ',
      contentRaw: 'Nước Cộng hòa xã hội chủ nghĩa Việt Nam là một nước độc lập, có chủ quyền, thống nhất và toàn vẹn lãnh thổ, bao gồm đất liền, hải đảo, vùng biển và vùng trời.',
      keywords: ['hiến pháp', 'nhà nước', 'chủ quyền quốc gia', 'độc lập', 'lãnh thổ', 'đặc trưng nhà nước', 'bản chất nhà nước']
    },
    {
      articleId: 'HP2013_D2',
      lawCode: 'HP2013',
      lawName: 'Hiến pháp năm 2013',
      articleNumber: 2,
      title: 'Bản chất Nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam',
      contentRaw: '1. Nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam là nhà nước pháp quyền xã hội chủ nghĩa của Nhân dân, do Nhân dân, vì Nhân dân.\n2. Nước Cộng hòa xã hội chủ nghĩa Việt Nam do Nhân dân làm chủ; tất cả quyền lực nhà nước thuộc về Nhân dân mà nền tảng là liên minh giữa giai cấp công nhân với giai cấp nông dân và đội ngũ trí thức.\n3. Quyền lực nhà nước là thống nhất, có sự phân công, phối hợp, kiểm soát giữa các cơ quan nhà nước trong việc thực hiện các quyền lập pháp, hành pháp, tư pháp.',
      keywords: ['bản chất nhà nước', 'nhà nước pháp quyền', 'của nhân dân do nhân dân vì nhân dân', 'tất cả quyền lực thuộc về nhân dân', 'hiến pháp 2013', 'nguồn gốc nhà nước']
    },
    {
      articleId: 'HP2013_D8',
      lawCode: 'HP2013',
      lawName: 'Hiến pháp năm 2013',
      articleNumber: 8,
      title: 'Nguyên tắc tổ chức và hoạt động của Nhà nước',
      contentRaw: '1. Nhà nước được tổ chức và hoạt động theo Hiến pháp và pháp luật, quản lý xã hội bằng Hiến pháp và pháp luật, thực hiện nguyên tắc tập trung dân chủ.\n2. Các cơ quan nhà nước, cán bộ, công chức, viên chức phải tôn trọng Nhân dân, tận tụy phục vụ Nhân dân, liên hệ chặt chẽ với Nhân dân, lắng nghe ý kiến và chịu sự giám sát của Nhân dân; kiên quyết đấu tranh chống tham nhũng, lãng phí và mọi biểu hiện quan liêu, hách dịch, cửa quyền.',
      keywords: ['quản lý xã hội bằng pháp luật', 'hiến pháp và pháp luật', 'đặc trưng nhà nước', 'nguyên tắc tổ chức nhà nước']
    },
    {
      articleId: 'HP2013_D119',
      lawCode: 'HP2013',
      lawName: 'Hiến pháp năm 2013',
      articleNumber: 119,
      title: 'Hiệu lực tối cao của Hiến pháp',
      contentRaw: '1. Hiến pháp là luật cơ bản của nước Cộng hòa xã hội chủ nghĩa Việt Nam, có hiệu lực pháp lý cao nhất.\nMọi văn bản quy phạm pháp luật khác phải phù hợp với Hiến pháp.\nMọi hành vi vi phạm Hiến pháp đều bị xử lý.\n2. Quốc hội, các cơ quan của Quốc hội, Chủ tịch nước, Chính phủ, Tòa án nhân dân, Viện kiểm sát nhân dân, các cơ quan khác của Nhà nước và toàn thể Nhân dân có trách nhiệm bảo vệ Hiến pháp.',
      keywords: ['hiến pháp 2013', 'hiệu lực tối cao', 'văn bản quy phạm pháp luật', 'thứ tự hiệu lực']
    },
    {
      articleId: 'VBQPPL2015_D4',
      lawCode: 'VBQPPL2015',
      lawName: 'Luật Ban hành văn bản quy phạm pháp luật năm 2015',
      articleNumber: 4,
      title: 'Hệ thống văn bản quy phạm pháp luật',
      contentRaw: '1. Hiến pháp.\n2. Bộ luật, luật (sau đây gọi chung là luật), nghị quyết của Quốc hội.\n3. Pháp lệnh, nghị quyết của Ủy ban thường vụ Quốc hội...\n4. Lệnh, quyết định của Chủ tịch nước.\n5. Nghị định của Chính phủ...\n6. Quyết định của Thủ tướng Chính phủ.\n7. Nghị quyết của Hội đồng Thẩm phán Tòa án nhân dân tối cao.\n8. Thông tư của Chánh án Tòa án nhân dân tối cao; thông tư của Viện trưởng Viện kiểm sát nhân dân tối cao; thông tư của Bộ trưởng, Thủ trưởng cơ quan ngang bộ...',
      keywords: ['hệ thống văn bản quy phạm pháp luật', 'thứ tự hiệu lực', 'hiến pháp', 'luật', 'nghị định', 'thông tư']
    },
    {
      articleId: 'VBQPPL2015_D156',
      lawCode: 'VBQPPL2015',
      lawName: 'Luật Ban hành văn bản quy phạm pháp luật năm 2015',
      articleNumber: 156,
      title: 'Áp dụng văn bản quy phạm pháp luật',
      contentRaw: '1. Văn bản quy phạm pháp luật được áp dụng từ thời điểm bắt đầu có hiệu lực.\n2. Trong trường hợp các văn bản quy phạm pháp luật có quy định khác nhau về cùng một vấn đề thì áp dụng văn bản có hiệu lực pháp lý cao hơn.\n3. Trong trường hợp các văn bản quy phạm pháp luật do cùng một cơ quan ban hành có quy định khác nhau về cùng một vấn đề thì áp dụng quy định của văn bản quy phạm pháp luật ban hành sau.',
      keywords: ['áp dụng văn bản', 'hiệu lực pháp lý cao hơn', 'nguyên tắc áp dụng', 'xung đột hiệu lực']
    },
    {
      articleId: 'BLHS2015_D20',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự năm 2015',
      articleNumber: 20,
      title: 'Sự kiện bất ngờ',
      contentRaw: 'Người thực hiện hành vi gây hậu quả nguy hại cho xã hội do sự kiện bất ngờ, tức là không thể thấy trước hoặc không buộc phải thấy trước hậu quả của hành vi đó, thì không phải chịu trách nhiệm hình sự.',
      keywords: ['sự kiện bất ngờ', 'không có lỗi', 'loại trừ trách nhiệm hình sự', 'không vi phạm pháp luật', 'tai nạn giao thông']
    },
    {
      articleId: 'BLHS2015_D155',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự năm 2015',
      articleNumber: 155,
      title: 'Tội làm nhục người khác',
      contentRaw: '1. Người nào xúc phạm nghiêm trọng nhân phẩm, danh dự của người khác, thì bị phạt cảnh cáo, phạt tiền từ 10.000.000 đồng đến 30.000.000 đồng hoặc phạt cải tạo không giam giữ đến 03 năm.',
      keywords: ['xúc phạm danh dự nhân phẩm', 'làm nhục người khác', 'giả định chế tài quy định', 'quy phạm pháp luật']
    },
    {
      articleId: 'BLHS2015_D170',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự năm 2015',
      articleNumber: 170,
      title: 'Tội cưỡng đoạt tài sản',
      contentRaw: '1. Người nào đe dọa sẽ dùng vũ lực hoặc có thủ đoạn khác uy hiếp tinh thần người khác nhằm chiếm đoạt tài sản, thì bị phạt tù từ 01 năm đến 05 năm.',
      keywords: ['cưỡng đoạt tài sản', 'đe dọa', 'đòi nợ thuê', 'uy hiếp tinh thần']
    },
    {
      articleId: 'BLHS2015_D171',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự năm 2015',
      articleNumber: 171,
      title: 'Tội cướp giật tài sản',
      contentRaw: '1. Người nào cướp giật tài sản của người khác, thì bị phạt tù từ 01 năm đến 05 năm.\n2. Phạm tội thuộc một trong các trường hợp sau đây, thì bị phạt tù từ 03 năm đến 10 năm: a) Có tổ chức; b) Có tính chất chuyên nghiệp; c) Chiếm đoạt tài sản trị giá từ 50.000.000 đồng đến dưới 200.000.000 đồng; d) Dùng thủ đoạn nguy hiểm; đ) Hành hung để tẩu thoát; e) Gây thương tích hoặc gây tổn hại cho sức khỏe của người khác mà tỷ lệ tổn thương cơ thể từ 11% đến 30%...',
      keywords: ['cướp giật tài sản', 'tuổi chịu trách nhiệm hình sự', '15 tuổi', '17 tuổi', 'điều 12']
    },
    {
      articleId: 'BLHS2015_D200',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự năm 2015',
      articleNumber: 200,
      title: 'Tội trốn thuế',
      contentRaw: '1. Người nào thực hiện một trong các hành vi trốn thuế với số tiền từ 100.000.000 đồng đến dưới 300.000.000 đồng hoặc dưới 100.000.000 đồng nhưng đã bị xử phạt vi phạm hành chính về hành vi trốn thuế hoặc đã bị kết án về tội này, chưa được xóa án tích mà còn vi phạm, thì bị phạt tiền từ 100.000.000 đồng đến 500.000.000 đồng hoặc phạt tù từ 03 tháng đến 01 năm...',
      keywords: ['trốn thuế', 'kê khai thuế', 'hợp đồng hai giá', 'điều 200']
    },
    {
      articleId: 'BLDS2015_D124',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 124,
      title: 'Giao dịch dân sự vô hiệu do giả tạo',
      contentRaw: '1. Khi các bên xác lập giao dịch dân sự một cách giả tạo nhằm che giấu một giao dịch dân sự khác thì giao dịch dân sự giả tạo vô hiệu, còn giao dịch dân sự bị che giấu vẫn có hiệu lực, trừ trường hợp giao dịch đó cũng vô hiệu theo quy định của Bộ luật này hoặc luật khác có liên quan.\n2. Trường hợp xác lập giao dịch dân sự giả tạo nhằm trốn tránh nghĩa vụ với người thứ ba thì giao dịch dân sự đó vô hiệu.',
      keywords: ['giao dịch giả tạo', 'vô hiệu do giả tạo', 'hợp đồng hai giá', 'trốn thuế']
    },
    {
      articleId: 'BLDS2015_D591',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 591,
      title: 'Thiệt hại do tính mạng bị xâm phạm',
      contentRaw: '1. Thiệt hại do tính mạng bị xâm phạm bao gồm: a) Chi phí hợp lý cho việc cứu chữa, bồi dưỡng, phục hồi sức khỏe và chức năng bị mất, bị giảm sút của người bị thiệt hại trước khi chết; b) Chi phí hợp lý cho việc mai táng; c) Tiền cấp dưỡng cho những người mà người bị thiệt hại có nghĩa vụ cấp dưỡng...',
      keywords: ['tính mạng bị xâm phạm', 'chết do tai nạn', 'bồi thường thiệt hại', 'sự kiện pháp lý']
    },
    {
      articleId: 'BLDS2015_D595',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 595,
      title: 'Bồi thường thiệt hại trong trường hợp vượt quá yêu cầu của tình thế cấp thiết',
      contentRaw: '1. Trường hợp thiệt hại xảy ra do vượt quá yêu cầu của tình thế cấp thiết thì người gây thiệt hại phải bồi thường phần thiệt hại do vượt quá yêu cầu của tình thế cấp thiết cho người bị thiệt hại.\n2. Người đã gây ra tình thế cấp thiết dẫn đến thiệt hại xảy ra thì phải bồi thường cho người bị thiệt hại.',
      keywords: ['tình thế cấp thiết', 'người gây ra tình thế cấp thiết phải bồi thường', 'điều 595 bộ luật dân sự', 'chạy trốn truy sát lấy xe']
    },
    {
      articleId: 'BLDS2015_D611',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 611,
      title: 'Thời điểm, địa điểm mở thừa kế',
      contentRaw: '1. Thời điểm mở thừa kế là thời điểm người có tài sản chết. Trường hợp Tòa án tuyên bố một người là đã chết thì thời điểm mở thừa kế là ngày được xác định tại khoản 2 Điều 71 của Bộ luật này.\n2. Địa điểm mở thừa kế là nơi cư trú cuối cùng của người để lại di sản; nếu không xác định được nơi cư trú cuối cùng thì địa điểm mở thừa kế là nơi có toàn bộ di sản hoặc nơi có phần lớn di sản.',
      keywords: ['thời điểm mở thừa kế', 'người chết', 'sự biến pháp lý', 'thừa kế']
    },
    {
      articleId: 'HNGD2014_D8',
      lawCode: 'HNGD2014',
      lawName: 'Luật Hôn nhân và Gia đình năm 2014',
      articleNumber: 8,
      title: 'Điều kiện kết hôn',
      contentRaw: '1. Nam, nữ kết hôn với nhau phải tuân theo các điều kiện sau đây: a) Nam từ đủ 20 tuổi trở lên, nữ từ đủ 18 tuổi trở lên; b) Việc kết hôn do nam và nữ tự nguyện quyết định; c) Không bị mất năng lực hành vi dân sự; d) Việc kết hôn không thuộc một trong các trường hợp cấm kết hôn theo quy định tại các điểm a, b, c và d khoản 2 Điều 5 của Luật này.',
      keywords: ['tuổi kết hôn', 'độ tuổi kết hôn', 'nam đủ 20 nữ đủ 18', 'điều kiện kết hôn']
    },
    {
      articleId: 'HNGD2014_D65',
      lawCode: 'HNGD2014',
      lawName: 'Luật Hôn nhân và Gia đình năm 2014',
      articleNumber: 65,
      title: 'Thời điểm chấm dứt hôn nhân',
      contentRaw: 'Hôn nhân chấm dứt kể từ thời điểm vợ hoặc chồng chết. Trong trường hợp Tòa án tuyên bố vợ hoặc chồng là đã chết thì thời điểm hôn nhân chấm dứt được xác định theo ngày chết được ghi trong bản án, quyết định của Tòa án.',
      keywords: ['chấm dứt hôn nhân', 'vợ chồng chết', 'sự biến pháp lý', 'hôn nhân gia đình']
    },
    {
      articleId: 'BLLD2019_D36',
      lawCode: 'BLLD2019',
      lawName: 'Bộ luật Lao động năm 2019',
      articleNumber: 36,
      title: 'Quyền đơn phương chấm dứt hợp đồng lao động của người sử dụng lao động',
      contentRaw: '1. Người sử dụng lao động có quyền đơn phương chấm dứt hợp đồng lao động trong các trường hợp sau đây: a) Người lao động thường xuyên không hoàn thành công việc theo hợp đồng lao động; b) Người lao động bị ốm đau, tai nạn đã điều trị... c) Do thiên tai, hỏa hoạn, dịch bệnh... d) Người lao động không có mặt tại nơi làm việc sau thời hạn tạm hoãn... đ) Đủ tuổi nghỉ hưu... e) Người lao động tự ý bỏ việc mà không có lý do chính đáng từ 05 ngày làm việc liên tục trở lên... 2. Khi đơn phương chấm dứt hợp đồng lao động phải báo trước ít nhất 45 ngày đối với HĐLĐ không xác định thời hạn, ít nhất 30 ngày đối với HĐLĐ xác định thời hạn từ 12 đến 36 tháng, ít nhất 03 ngày làm việc đối với HĐLĐ dưới 12 tháng.',
      keywords: ['đơn phương chấm dứt hợp đồng', 'bộ luật lao động 2019', 'sa thải', 'báo trước']
    },
    {
      articleId: 'BLLD2019_D41',
      lawCode: 'BLLD2019',
      lawName: 'Bộ luật Lao động năm 2019',
      articleNumber: 41,
      title: 'Nghĩa vụ của người sử dụng lao động khi đơn phương chấm dứt hợp đồng lao động trái pháp luật',
      contentRaw: '1. Phải nhận người lao động trở lại làm việc theo hợp đồng lao động đã giao kết; phải trả tiền lương, đóng bảo hiểm xã hội, bảo hiểm y tế, bảo hiểm thất nghiệp trong những ngày người lao động không được làm việc và phải trả thêm cho người lao động một khoản tiền ít nhất bằng 02 tháng tiền lương theo hợp đồng lao động.\n2. Trường hợp người lao động không muốn tiếp tục làm việc thì ngoài khoản tiền quy định tại khoản 1 Điều này người sử dụng lao động phải trả trợ cấp thôi việc theo quy định tại Điều 46 của Bộ luật này để chấm dứt hợp đồng lao động.',
      keywords: ['đuổi việc trái luật', 'bồi thường sa thải', 'đuổi việc ngang', '2 tháng tiền lương', 'bảo hiểm']
    },
    {
      articleId: 'BLLD2019_D125',
      lawCode: 'BLLD2019',
      lawName: 'Bộ luật Lao động năm 2019',
      articleNumber: 125,
      title: 'Áp dụng hình thức xử lý kỷ luật sa thải',
      contentRaw: 'Hình thức xử lý kỷ luật sa thải được người sử dụng lao động áp dụng trong trường hợp sau đây: 1. Người lao động có hành vi trộm cắp, tham ô, đánh bạc, cố ý gây thương tích, sử dụng ma túy tại nơi làm việc; 2. Người lao động có hành vi tiết lộ bí mật kinh doanh, bí mật công nghệ, xâm phạm quyền sở hữu trí tuệ của người sử dụng lao động, có hành vi gây thiệt hại nghiêm trọng hoặc đe dọa gây thiệt hại đặc biệt nghiêm trọng về tài sản, lợi ích của người sử dụng lao động...',
      keywords: ['sa thải', 'trộm cắp laptop', 'kỷ luật lao động', 'nội quy']
    },
    {
      articleId: 'BLHS2015_D27',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự năm 2015',
      articleNumber: 27,
      title: 'Thời hiệu truy cứu trách nhiệm hình sự',
      contentRaw: '1. Thời hiệu truy cứu trách nhiệm hình sự là thời hạn do Bộ luật này quy định mà khi hết thời hạn đó thì người phạm tội không bị truy cứu trách nhiệm hình sự.\n2. Thời hiệu truy cứu trách nhiệm hình sự được quy định như sau: a) 05 năm đối với tội phạm ít nghiêm trọng; b) 10 năm đối với tội phạm nghiêm trọng; c) 20 năm đối với tội phạm rất nghiêm trọng; d) 20 năm đối với tội phạm đặc biệt nghiêm trọng.\n3. Thời hiệu truy cứu trách nhiệm hình sự được tính từ ngày tội phạm được thực hiện. Nếu trong thời hạn quy định tại khoản 2 Điều này, người phạm tội lại thực hiện hành vi phạm tội mới mà Bộ luật này quy định mức cao nhất của khung hình phạt đối với tội đó trên 01 năm tù, thì thời hiệu đối với tội cũ được tính lại kể từ ngày thực hiện hành vi phạm tội mới. Nếu người phạm tội cố tình trốn tránh và đã có quyết định truy nã, thì thời hiệu tính lại kể từ khi người đó ra đầu thú hoặc bị bắt giữ.',
      keywords: ['thời hiệu truy cứu trách nhiệm hình sự', '5 năm', '10 năm', '20 năm', 'gián đoạn thời hiệu', 'tính lại thời hiệu', 'truy nã', 'tội phạm mới']
    },
    {
      articleId: 'BLHS2015_D28',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự năm 2015',
      articleNumber: 28,
      title: 'Không áp dụng thời hiệu truy cứu trách nhiệm hình sự',
      contentRaw: 'Không áp dụng thời hiệu truy cứu trách nhiệm hình sự quy định tại Điều 27 của Bộ luật này đối với các tội phạm sau đây: 1. Các tội xâm phạm an ninh quốc gia quy định tại Chương XIII của Bộ luật này; 2. Các tội phá hoại hòa bình, chống loài người và tội phạm chiến tranh quy định tại Chương XXVI của Bộ luật này; 3. Tội tham ô tài sản thuộc trường hợp quy định tại khoản 3 và khoản 4 Điều 353 của Bộ luật này; tội nhận hối lộ thuộc trường hợp quy định tại khoản 3 và khoản 4 Điều 354 của Bộ luật này.',
      keywords: ['không áp dụng thời hiệu', 'an ninh quốc gia', 'chống loài người', 'tham ô nhận hối lộ đặc biệt nghiêm trọng']
    },
    {
      articleId: 'BLDS2015_D149',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 149,
      title: 'Thời hiệu',
      contentRaw: '1. Thời hiệu là thời hạn do luật quy định mà khi kết thúc thời hạn đó thì phát sinh hậu quả pháp lý đối với chủ thể theo điều kiện do luật quy định. Thời hiệu được áp dụng theo quy định của Bộ luật này, luật khác có liên quan.\n2. Tòa án chỉ áp dụng quy định về thời hiệu theo yêu cầu áp dụng thời hiệu của một bên hoặc các bên với điều kiện yêu cầu này phải được đưa ra trước khi Tòa án cấp sơ thẩm ra bản án, quyết định giải quyết vụ việc.',
      keywords: ['thời hiệu dân sự', 'yêu cầu áp dụng thời hiệu', 'tòa án chỉ áp dụng khi có yêu cầu']
    },
    {
      articleId: 'BLDS2015_D150',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 150,
      title: 'Thời hiệu khởi kiện, thời hiệu yêu cầu giải quyết việc dân sự',
      contentRaw: '1. Thời hiệu khởi kiện là thời hạn mà chủ thể được quyền khởi kiện để yêu cầu Tòa án giải quyết vụ án dân sự bảo vệ quyền và lợi ích hợp pháp bị xâm phạm; nếu thời hạn đó kết thúc thì mất quyền khởi kiện.\n2. Thời hiệu yêu cầu giải quyết việc dân sự là thời hạn mà chủ thể được quyền yêu cầu Tòa án giải quyết việc dân sự để bảo vệ quyền và lợi ích hợp pháp của cá nhân, pháp nhân, lợi ích quốc gia, dân tộc, lợi ích công cộng; nếu thời hạn đó kết thúc thì mất quyền yêu cầu.',
      keywords: ['thời hiệu khởi kiện', 'thời hiệu yêu cầu', 'mất quyền khởi kiện']
    },
    {
      articleId: 'BLDS2015_D154',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 154,
      title: 'Bắt đầu lại thời hiệu khởi kiện vụ án dân sự',
      contentRaw: '1. Thời hiệu khởi kiện vụ án dân sự bắt đầu lại trong trường hợp sau đây: a) Bên có nghĩa vụ đã thừa nhận một phần hoặc toàn bộ nghĩa vụ của mình đối với người khởi kiện; b) Bên có nghĩa vụ thừa nhận hoặc thực hiện xong một phần nghĩa vụ của mình đối với người khởi kiện; c) Các bên đã tự hòa giải với nhau.\n2. Thời hiệu khởi kiện vụ án dân sự bắt đầu lại kể từ ngày tiếp theo sau ngày xảy ra sự kiện quy định tại khoản 1 Điều này.',
      keywords: ['bắt đầu lại thời hiệu', 'thừa nhận nghĩa vụ', 'tự hòa giải', 'thời hiệu khởi kiện dân sự']
    },
    {
      articleId: 'BLDS2015_D157',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 157,
      title: 'Gián đoạn thời hiệu khởi kiện vụ án dân sự',
      contentRaw: '1. Thời hiệu khởi kiện vụ án dân sự bị gián đoạn khi có một trong các căn cứ quy định tại khoản 1 Điều 154 của Bộ luật này.\n2. Khi thời hiệu khởi kiện vụ án dân sự bị gián đoạn thì thời hiệu khởi kiện bắt đầu lại kể từ ngày tiếp theo sau ngày kết thúc hành vi làm gián đoạn.',
      keywords: ['gián đoạn thời hiệu', 'thời hiệu bị gián đoạn', 'tính lại thời hiệu dân sự']
    },
    {
      articleId: 'XLVPHC2012_D125',
      lawCode: 'XLVPHC2012',
      lawName: 'Luật Xử lý vi phạm hành chính năm 2012',
      articleNumber: 125,
      title: 'Tạm giữ tang vật, phương tiện, giấy phép, chứng chỉ hành nghề theo thủ tục hành chính',
      contentRaw: '1. Việc tạm giữ tang vật, phương tiện vi phạm hành chính chỉ được áp dụng trong trường hợp thật cần thiết sau đây: a) Để xác minh tình tiết mà nếu không tạm giữ thì không có căn cứ ra quyết định xử phạt... b) Để ngăn chặn ngay hành vi vi phạm hành chính mà nếu không tạm giữ thì sẽ gây hậu quả nghiêm trọng cho xã hội; c) Để bảo đảm thi hành quyết định xử phạt...\n8. Thời hạn tạm giữ tang vật, phương tiện vi phạm hành chính, giấy phép, chứng chỉ hành nghề là 07 ngày, kể từ ngày tạm giữ. Thời hạn tạm giữ có thể được kéo dài đối với những vụ việc có nhiều tình tiết phức tạp, cần tiến hành xác minh nhưng tối đa không quá 30 ngày...',
      keywords: ['tạm giữ phương tiện', 'giam xe', 'tạm giữ 7 ngày', 'nồng độ cồn', 'ngăn chặn ngay vi phạm', 'xử lý vi phạm hành chính']
    },
    {
      articleId: 'HP2013_D33',
      lawCode: 'HP2013',
      lawName: 'Hiến pháp năm 2013',
      articleNumber: 33,
      title: 'Quyền tự do kinh doanh',
      contentRaw: 'Mọi người có quyền tự do kinh doanh trong những ngành nghề mà pháp luật không cấm.',
      keywords: ['tự do kinh doanh', 'điều 33 hiến pháp', 'ngành nghề pháp luật không cấm', 'quy phạm pháp luật khuyết chế tài']
    },
    {
      articleId: 'HP2013_D69',
      lawCode: 'HP2013',
      lawName: 'Hiến pháp năm 2013',
      articleNumber: 69,
      title: 'Vị trí, chức năng của Quốc hội',
      contentRaw: 'Quốc hội là cơ quan đại biểu cao nhất của Nhân dân, cơ quan quyền lực nhà nước cao nhất của nước Cộng hòa xã hội chủ nghĩa Việt Nam. Quốc hội thực hiện quyền lập hiến, quyền lập pháp, quyết định các vấn đề quan trọng của đất nước và giám sát tối cao đối với hoạt động của Nhà nước.',
      keywords: ['quốc hội', 'cơ quan đại biểu cao nhất', 'cơ quan quyền lực nhà nước cao nhất', 'quyền lập hiến', 'quyền lập pháp', 'giám sát tối cao']
    },
    {
      articleId: 'HP2013_D91',
      lawCode: 'HP2013',
      lawName: 'Hiến pháp năm 2013',
      articleNumber: 91,
      title: 'Văn bản của Chủ tịch nước',
      contentRaw: 'Chủ tịch nước ban hành lệnh, quyết định để thực hiện nhiệm vụ, quyền hạn của mình.',
      keywords: ['chủ tịch nước', 'ban hành lệnh', 'lệnh quyết định của chủ tịch nước', 'điều 91 hiến pháp']
    },
    {
      articleId: 'HP2013_D94',
      lawCode: 'HP2013',
      lawName: 'Hiến pháp năm 2013',
      articleNumber: 94,
      title: 'Vị trí, chức năng của Chính phủ',
      contentRaw: 'Chính phủ là cơ quan hành chính nhà nước cao nhất của nước Cộng hòa xã hội chủ nghĩa Việt Nam, thực hiện quyền hành pháp, là cơ quan chấp hành của Quốc hội. Chính phủ chịu trách nhiệm trước Quốc hội và báo cáo công tác trước Quốc hội, Ủy ban thường vụ Quốc hội, Chủ tịch nước.',
      keywords: ['chính phủ', 'cơ quan hành chính nhà nước cao nhất', 'quyền hành pháp', 'cơ quan chấp hành của quốc hội']
    },
    {
      articleId: 'BLDS2015_D14',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 14,
      title: 'Bảo vệ quyền dân sự thông qua cơ quan có thẩm quyền và giới hạn hạn chế quyền dân sự',
      contentRaw: '1. Trường hợp quyền dân sự bị xâm phạm hoặc có tranh chấp thì việc bảo vệ quyền được thực hiện theo pháp luật tố tụng tại Tòa án hoặc trọng tài.\n2. Quyền dân sự chỉ có thể bị hạn chế theo quy định của luật trong trường hợp cần thiết vì lý do quốc phòng, an ninh quốc gia, trật tự, an toàn xã hội, đạo đức xã hội, sức khỏe của cộng đồng.',
      keywords: ['khoản 1 điều 14', 'khoản 2 điều 14', 'bảo vệ quyền dân sự', 'hạn chế quyền dân sự', 'quốc phòng an ninh quốc gia']
    },
    {
      articleId: 'BLDS2015_D16',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 16,
      title: 'Năng lực pháp luật dân sự của cá nhân',
      contentRaw: '1. Năng lực pháp luật dân sự của cá nhân là khả năng của cá nhân có quyền dân sự và nghĩa vụ dân sự.\n2. Mọi cá nhân đều có năng lực pháp luật dân sự như nhau.\n3. Năng lực pháp luật dân sự của cá nhân có từ khi người đó sinh ra và chấm dứt khi người đó chết.',
      keywords: ['năng lực pháp luật dân sự', 'có từ khi sinh ra', 'chấm dứt khi chết']
    },
    {
      articleId: 'BLDS2015_D19',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 19,
      title: 'Năng lực hành vi dân sự của cá nhân',
      contentRaw: 'Năng lực hành vi dân sự của cá nhân là khả năng của cá nhân bằng hành vi của mình xác lập, thực hiện quyền, nghĩa vụ dân sự.',
      keywords: ['năng lực hành vi dân sự', 'bằng hành vi của mình xác lập thực hiện quyền nghĩa vụ dân sự']
    },
    {
      articleId: 'BLDS2015_D20',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 20,
      title: 'Người thành niên',
      contentRaw: '1. Người thành niên là người từ đủ mười tám tuổi trở lên.\n2. Người thành niên có năng lực hành vi dân sự đầy đủ, trừ trường hợp quy định tại các điều 22, 23 và 24 của Bộ luật này.',
      keywords: ['người thành niên', 'đủ 18 tuổi', 'năng lực hành vi dân sự đầy đủ']
    },
    {
      articleId: 'BLDS2015_D127',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 127,
      title: 'Giao dịch dân sự vô hiệu do bị lừa dối, đe dọa, cưỡng ép',
      contentRaw: 'Khi một bên tham gia giao dịch dân sự do bị lừa dối hoặc bị đe dọa, cưỡng ép thì có quyền yêu cầu Tòa án tuyên bố giao dịch dân sự đó là vô hiệu.',
      keywords: ['lừa dối', 'đe dọa', 'cưỡng ép', 'vô hiệu do bị lừa dối']
    },
    {
      articleId: 'BLDS2015_D129',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 129,
      title: 'Giao dịch dân sự vô hiệu do không tuân thủ quy định về hình thức',
      contentRaw: 'Giao dịch dân sự vi phạm quy định điều kiện có hiệu lực về hình thức thì vô hiệu, trừ trường hợp sau đây:\n1. Giao dịch dân sự đã được xác lập theo quy định phải bằng văn bản nhưng văn bản không đúng quy định của luật mà một bên hoặc các bên đã thực hiện ít nhất hai phần ba nghĩa vụ trong giao dịch thì theo yêu cầu của một bên hoặc các bên, Tòa án ra quyết định công nhận hiệu lực của giao dịch đó.\n2. Giao dịch dân sự đã được xác lập bằng văn bản nhưng vi phạm quy định bắt buộc về công chứng, chứng thực mà một bên hoặc các bên đã thực hiện ít nhất hai phần ba nghĩa vụ trong giao dịch thì theo yêu cầu của một bên hoặc các bên, Tòa án ra quyết định công nhận hiệu lực của giao dịch đó.',
      keywords: ['vi phạm hình thức', 'giấy viết tay', 'công chứng chứng thực', 'hai phần ba nghĩa vụ', '2/3 nghĩa vụ']
    },
    {
      articleId: 'BLHS2015_D156',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung 2017)',
      articleNumber: 156,
      title: 'Tội vu khống',
      contentRaw: '1. Người nào thực hiện một trong các hành vi sau đây, thì bị phạt tiền từ 10.000.000 đồng đến 50.000.000 đồng, phạt cải tạo không giam giữ đến 02 năm hoặc phạt tù từ 03 tháng đến 01 năm: a) Bịa đặt hoặc loan truyền những điều biết rõ là sai sự thật nhằm xúc phạm nghiêm trọng nhân phẩm, danh dự hoặc gây thiệt hại đến quyền, lợi ích hợp pháp của người khác; b) Bịa đặt người khác phạm tội và tố cáo họ trước cơ quan có thẩm quyền.',
      keywords: ['tội vu khống', 'bịa đặt sai sự thật', 'loan truyền', 'xúc phạm danh dự nhân phẩm']
    },
    {
      articleId: 'BLLD2019_D190',
      lawCode: 'BLLD2019',
      lawName: 'Bộ luật Lao động năm 2019',
      articleNumber: 190,
      title: 'Thời hiệu yêu cầu giải quyết tranh chấp lao động cá nhân',
      contentRaw: '1. Thời hiệu yêu cầu Hòa giải viên lao động thực hiện hòa giải tranh chấp lao động cá nhân là 06 tháng kể từ ngày phát hiện ra hành vi mà bên tranh chấp cho rằng quyền và lợi ích hợp pháp của mình bị vi phạm.\n2. Thời hiệu yêu cầu Hội đồng trọng tài lao động giải quyết tranh chấp lao động cá nhân là 09 tháng.\n3. Thời hiệu yêu cầu Tòa án giải quyết tranh chấp lao động cá nhân là 01 năm kể từ ngày phát hiện ra hành vi mà bên tranh chấp cho rằng quyền và lợi ích hợp pháp của mình bị vi phạm.',
      keywords: ['thời hiệu tranh chấp lao động', 'hòa giải viên lao động 6 tháng', 'trọng tài lao động 9 tháng', 'tòa án 1 năm', 'điều 190 bộ luật lao động']
    },
    {
      articleId: 'TTATGT2024_D57',
      lawCode: 'TTATGT2024',
      lawName: 'Luật Trật tự, an toàn giao thông đường bộ năm 2024 (hiệu lực từ 01/01/2025)',
      articleNumber: 57,
      title: 'Giấy phép lái xe (Phân hạng A1, A từ 01/01/2025)',
      contentRaw: '1. Các hạng giấy phép lái xe bao gồm:\na) Hạng A1 cấp cho người lái xe mô tô hai bánh có dung tích xi-lanh đến 125 cm3 hoặc có công suất động cơ điện đến 11 kW;\nb) Hạng A cấp cho người lái xe mô tô hai bánh có dung tích xi-lanh trên 125 cm3 hoặc có công suất động cơ điện trên 11 kW và các loại xe quy định cho giấy phép lái xe hạng A1.',
      keywords: ['giấy phép lái xe hạng a1', 'bằng lái xe hạng a1', '125 cm3', '11 kw', 'luật trật tự an toàn giao thông đường bộ 2024']
    },
    {
      articleId: 'ND168_2024_D7',
      lawCode: 'ND168_2024',
      lawName: 'Nghị định 168/2024/NĐ-CP (hiệu lực từ 01/01/2025)',
      articleNumber: 7,
      title: 'Xử phạt người điều khiển xe mô tô, xe gắn máy vi phạm quy tắc giao thông đường bộ',
      contentRaw: 'Phạt tiền từ 400.000 đồng đến 600.000 đồng đối với người điều khiển xe mô tô, xe gắn máy không đội "mũ bảo hiểm cho người đi mô tô, xe máy" hoặc đội mũ bảo hiểm không cài quai đúng quy cách khi tham gia giao thông trên đường bộ (Điểm h Khoản 2 Điều 7). Phạt tiền từ 4.000.000 đồng đến 6.000.000 đồng và trừ 04 điểm giấy phép lái xe đối với hành vi không chấp hành hiệu lệnh của đèn tín hiệu giao thông (Điểm c Khoản 7 Điều 7).',
      keywords: ['không đội mũ bảo hiểm', 'nghị định 168', '400.000 đồng đến 600.000 đồng', 'vượt đèn đỏ xe máy']
    },
    {
      articleId: 'HP2013_D27',
      lawCode: 'HP2013',
      lawName: 'Hiến pháp năm 2013',
      articleNumber: 27,
      title: 'Quyền bầu cử và quyền ứng cử của công dân',
      contentRaw: 'Công dân đủ mười tám tuổi trở lên có quyền bầu cử và đủ hai mươi mốt tuổi trở lên có quyền ứng cử vào Quốc hội, Hội đồng nhân dân. Việc thực hiện các quyền này do luật định.',
      keywords: ['quyền công dân', 'quyền con người', 'quyền bầu cử', 'quyền ứng cử', 'quốc tịch việt nam']
    },
    {
      articleId: 'HP2013_D71',
      lawCode: 'HP2013',
      lawName: 'Hiến pháp năm 2013',
      articleNumber: 71,
      title: 'Nhiệm kỳ của Quốc hội và đại biểu Quốc hội',
      contentRaw: '1. Nhiệm kỳ của mỗi khóa Quốc hội là năm năm.\n2. Sáu mươi ngày trước khi Quốc hội hết nhiệm kỳ, Quốc hội khóa mới phải được bầu xong. Nhiệm kỳ của đại biểu Quốc hội theo nhiệm kỳ của Quốc hội.',
      keywords: ['nhiệm kỳ của quốc hội', 'nhiệm kỳ đại biểu quốc hội', '5 năm', 'điều 71 hiến pháp']
    },
    {
      articleId: 'XLVPHC2012_D5',
      lawCode: 'XLVPHC2012',
      lawName: 'Luật Xử lý vi phạm hành chính năm 2012 (sửa đổi, bổ sung năm 2020)',
      articleNumber: 5,
      title: 'Đối tượng bị xử phạt vi phạm hành chính (Độ tuổi chịu trách nhiệm hành chính)',
      contentRaw: '1. Các đối tượng bị xử phạt vi phạm hành chính bao gồm: a) Người từ đủ 14 tuổi đến dưới 16 tuổi bị xử phạt vi phạm hành chính về vi phạm hành chính do cố ý; người từ đủ 16 tuổi trở lên bị xử phạt vi phạm hành chính về mọi vi phạm hành chính.',
      keywords: ['độ tuổi chịu trách nhiệm hành chính', '14 đến dưới 16 tuổi cố ý', 'điều 5 luật xử lý vi phạm hành chính']
    },
    {
      articleId: 'XLVPHC2012_D21',
      lawCode: 'XLVPHC2012',
      lawName: 'Luật Xử lý vi phạm hành chính năm 2012 (sửa đổi, bổ sung năm 2020)',
      articleNumber: 21,
      title: 'Các hình thức xử phạt vi phạm hành chính và nguyên tắc áp dụng',
      contentRaw: '1. Các hình thức xử phạt vi phạm hành chính bao gồm: a) Cảnh cáo; b) Phạt tiền; c) Tước quyền sử dụng giấy phép, chứng chỉ hành nghề có thời hạn hoặc đình chỉ hoạt động có thời hạn; d) Tịch thu tang vật vi phạm hành chính, phương tiện được sử dụng để vi phạm hành chính; đ) Trục xuất.\n3. Đối với mỗi vi phạm hành chính, cá nhân, tổ chức vi phạm hành chính chỉ bị áp dụng một hình thức xử phạt chính; có thể bị áp dụng một hoặc nhiều hình thức xử phạt bổ sung.',
      keywords: ['hình thức xử phạt chính', '5 hình thức xử phạt hành chính', 'chỉ bị áp dụng một hình thức xử phạt chính']
    },
    {
      articleId: 'BLDS2015_D68',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 68,
      title: 'Tuyên bố mất tích',
      contentRaw: '1. Khi một người biệt tích 02 năm liền trở lên, mặc dù đã áp dụng đầy đủ các biện pháp thông báo, tìm kiếm theo quy định của pháp luật về tố tụng dân sự nhưng vẫn không có tin tức xác thực về việc người đó còn sống hay đã chết thì theo yêu cầu của người có quyền, lợi ích liên quan, Tòa án có thể tuyên bố người đó mất tích.',
      keywords: ['tuyên bố mất tích', 'biệt tích 02 năm liền trở lên', 'điều 68 bộ luật dân sự']
    },
    {
      articleId: 'BLDS2015_D71',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 71,
      title: 'Tuyên bố một người là đã chết',
      contentRaw: '1. Người có quyền, lợi ích liên quan có thể yêu cầu Tòa án ra quyết định tuyên bố một người là đã chết trong trường hợp sau đây: a) Sau 03 năm, kể từ ngày quyết định tuyên bố mất tích của Tòa án có hiệu lực pháp luật mà vẫn không có tin tức xác thực là còn sống; ... d) Biệt tích 05 năm liền trở lên và không có tin tức xác thực là còn sống.',
      keywords: ['tuyên bố đã chết', 'biệt tích 05 năm liền trở lên', 'điều 71 bộ luật dân sự']
    },
    {
      articleId: 'BLDS2015_D136',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 136,
      title: 'Đại diện theo pháp luật của cá nhân và Đại diện theo ủy quyền (Điều 138)',
      contentRaw: 'Điều 136: Đại diện theo pháp luật của cá nhân gồm: 1. Cha, mẹ đối với con chưa thành niên; 2. Người giám hộ đối với người được giám hộ; 3. Người do Tòa án chỉ định.\nĐiều 138: Cá nhân, pháp nhân có thể ủy quyền cho cá nhân, pháp nhân khác xác lập, thực hiện giao dịch dân sự. Người từ đủ mười lăm tuổi đến chưa đủ mười tám tuổi có thể là người đại diện theo ủy quyền, trừ trường hợp pháp luật quy định giao dịch dân sự phải do người từ đủ mười tám tuổi trở lên xác lập, thực hiện.',
      keywords: ['đại diện theo pháp luật', 'đại diện theo ủy quyền', '16 tuổi ủy quyền bất động sản']
    },
    {
      articleId: 'BLDS2015_D429',
      lawCode: 'BLDS2015',
      lawName: 'Bộ luật Dân sự năm 2015',
      articleNumber: 429,
      title: 'Thời hiệu khởi kiện về hợp đồng',
      contentRaw: 'Thời hiệu khởi kiện để yêu cầu Tòa án giải quyết tranh chấp hợp đồng là 03 năm, kể từ ngày người có quyền yêu cầu biết hoặc phải biết quyền và lợi ích hợp pháp của mình bị xâm phạm.',
      keywords: ['thời hiệu khởi kiện hợp đồng', '03 năm', '3 năm', 'điều 429 bộ luật dân sự']
    },
    {
      articleId: 'BLHS2015_D17',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung 2017)',
      articleNumber: 17,
      title: 'Đồng phạm',
      contentRaw: '1. Đồng phạm là trường hợp có hai người trở lên cố ý cùng thực hiện một tội phạm.\n3. Người đồng phạm bao gồm người tổ chức, người thực hành, người xúi giục, người giúp sức. Người thực hành là người trực tiếp thực hiện tội phạm. Người tổ chức là người chủ mưu, cầm đầu, chỉ huy việc thực hiện tội phạm. Người xúi giục là người kích động, dụ dỗ, thúc đẩy người khác thực hiện tội phạm. Người giúp sức là người tạo điều kiện tinh thần hoặc vật chất cho việc thực hiện tội phạm.',
      keywords: ['đồng phạm', 'người thực hành', 'người tổ chức', 'người xúi giục', 'người giúp sức', 'điều 17 blhs']
    },
    {
      articleId: 'BLHS2015_D126',
      lawCode: 'BLHS2015',
      lawName: 'Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung 2017)',
      articleNumber: 126,
      title: 'Tội giết người do vượt quá giới hạn phòng vệ chính đáng',
      contentRaw: '1. Người nào giết người trong trường hợp vượt quá giới hạn phòng vệ chính đáng hoặc trong trường hợp vượt quá mức cần thiết khi bắt giữ người phạm tội, thì bị phạt cải tạo không giam giữ đến 02 năm hoặc phạt tù từ 03 tháng đến 02 năm.',
      keywords: ['vượt quá giới hạn phòng vệ chính đáng', 'rõ ràng quá mức cần thiết', 'điều 126 blhs']
    },
    {
      articleId: 'PCTN2018_D22',
      lawCode: 'PCTN2018',
      lawName: 'Luật Phòng, chống tham nhũng năm 2018 (và Nghị định 59/2019/NĐ-CP)',
      articleNumber: 22,
      title: 'Việc tặng quà và nhận quà tặng của cán bộ, công chức, viên chức',
      contentRaw: 'Khoản 2 Điều 22 Luật PCTN 2018: Cơ quan, tổ chức, đơn vị, người có chức vụ, quyền hạn không được trực tiếp hoặc gián tiếp nhận quà tặng dưới mọi hình thức của cơ quan, tổ chức, đơn vị, cá nhân có liên quan đến công việc do mình giải quyết hoặc thuộc phạm vi quản lý của mình. Trường hợp không từ chối được thì cơ quan, tổ chức, đơn vị phải tổ chức quản lý, xử lý quà tặng; người có chức vụ, quyền hạn phải báo cáo Thủ trưởng cơ quan, đơn vị và nộp lại quà tặng để xử lý trong thời hạn 05 ngày làm việc kể từ ngày nhận được quà tặng (Điều 25 Nghị định 59/2019/NĐ-CP).',
      keywords: ['nhận quà tặng', 'luật phòng chống tham nhũng 2018', '05 ngày làm việc', 'nộp lại quà tặng']
    },
    {
      articleId: 'BLLD2019_D25',
      lawCode: 'BLLD2019',
      lawName: 'Bộ luật Lao động năm 2019',
      articleNumber: 25,
      title: 'Thời gian thử việc và Tiền lương thử việc (Điều 26)',
      contentRaw: 'Điều 25: Thời gian thử việc căn cứ vào tính chất và mức độ phức tạp của công việc nhưng chỉ được thử việc một lần đối với một công việc và bảo đảm điều kiện: 1. Không quá 180 ngày đối với công việc của người quản lý doanh nghiệp; 2. Không quá 60 ngày đối với công việc có chức danh nghề nghiệp cần trình độ chuyên môn, kỹ thuật từ cao đẳng trở lên; 3. Không quá 30 ngày đối với trình độ trung cấp, công nhân kỹ thuật; 4. Không quá 06 ngày làm việc đối với công việc khác.\nĐiều 26: Tiền lương của người lao động trong thời gian thử việc do hai bên thỏa thuận nhưng ít nhất phải bằng 85% mức lương của công việc đó.',
      keywords: ['thời gian thử việc', '60 ngày', 'tiền lương thử việc', '85%', 'tốt nghiệp đại học']
    },
    {
      articleId: 'BLLD2019_D35',
      lawCode: 'BLLD2019',
      lawName: 'Bộ luật Lao động năm 2019',
      articleNumber: 35,
      title: 'Quyền đơn phương chấm dứt HĐLĐ của người lao động và nghĩa vụ khi chấm dứt trái pháp luật (Điều 40)',
      contentRaw: 'Khoản 1 Điều 35: Người lao động có quyền đơn phương chấm dứt hợp đồng lao động nhưng phải báo trước cho người sử dụng lao động: a) Ít nhất 45 ngày nếu làm việc theo hợp đồng lao động không xác định thời hạn; b) Ít nhất 30 ngày nếu HĐLĐ xác định thời hạn từ 12 đến 36 tháng; c) Ít nhất 03 ngày làm việc nếu HĐLĐ dưới 12 tháng.\nĐiều 40: Nghĩa vụ của người lao động khi đơn phương chấm dứt HĐLĐ trái pháp luật: 1. Không được trợ cấp thôi việc; 2. Phải bồi thường cho người sử dụng lao động nửa tháng tiền lương theo HĐLĐ và một khoản tiền tương ứng với tiền lương theo HĐLĐ trong những ngày không báo trước; 3. Phải hoàn trả cho người sử dụng lao động chi phí đào tạo quy định tại Điều 62 của Bộ luật này.',
      keywords: ['báo trước 45 ngày', 'tự ý nghỉ việc', 'đơn phương chấm dứt hợp đồng trái pháp luật', 'nửa tháng tiền lương', 'chi phí đào tạo']
    },
    {
      articleId: 'BLLD2019_D105',
      lawCode: 'BLLD2019',
      lawName: 'Bộ luật Lao động năm 2019',
      articleNumber: 105,
      title: 'Thời giờ làm việc bình thường',
      contentRaw: '1. Thời giờ làm việc bình thường không quá 08 giờ trong 01 ngày và không quá 48 giờ trong 01 tuần.\n2. Người sử dụng lao động có quyền quy định thời giờ làm việc theo ngày hoặc tuần nhưng phải thông báo cho người lao động biết; trường hợp theo tuần thì thời giờ làm việc bình thường không quá 10 giờ trong 01 ngày và không quá 48 giờ trong 01 tuần.',
      keywords: ['thời giờ làm việc bình thường', '8 giờ', '48 giờ', 'điều 105 bộ luật lao động 2019']
    },
    {
      articleId: 'HNGD2014_D12',
      lawCode: 'HNGD2014',
      lawName: 'Luật Hôn nhân và Gia đình năm 2014',
      articleNumber: 12,
      title: 'Hậu quả pháp lý của việc hủy kết hôn trái pháp luật',
      contentRaw: '1. Khi việc kết hôn trái pháp luật bị hủy thì hai bên kết hôn phải chấm dứt quan hệ như vợ chồng.\n2. Quyền, nghĩa vụ của cha, mẹ, con được giải quyết theo quy định về quyền, nghĩa vụ của cha, mẹ, con khi ly hôn.\n3. Quan hệ tài sản, nghĩa vụ và hợp đồng giữa các bên được giải quyết theo quy định tại Điều 16 của Luật này (theo thỏa thuận của các bên; nếu không thỏa thuận được thì giải quyết theo quy định của Bộ luật Dân sự về chia tài sản thuộc sở hữu chung theo phần, bảo đảm quyền lợi chính đáng của phụ nữ và con).',
      keywords: ['hủy việc kết hôn trái pháp luật', 'chưa đủ tuổi kết hôn', 'chấm dứt quan hệ như vợ chồng', 'điều 12 luật hôn nhân']
    },
    {
      articleId: 'LDD2024_D159',
      lawCode: 'LDD2024',
      lawName: 'Luật Đất đai năm 2024',
      articleNumber: 159,
      title: 'Bảng giá đất hằng năm (Bỏ khung giá đất 05 năm/lần)',
      contentRaw: 'Luật Đất đai năm 2024 đã bãi bỏ hoàn toàn quy định về Khung giá đất của Chính phủ ban hành định kỳ 05 năm một lần. Theo Khoản 3 Điều 159 Luật Đất đai 2024, Ủy ban nhân dân cấp tỉnh xây dựng, trình Hội đồng nhân dân cùng cấp quyết định Bảng giá đất lần đầu để công bố và áp dụng từ ngày 01/01/2026; hằng năm, Ủy ban nhân dân cấp tỉnh có trách nhiệm trình Hội đồng nhân dân cấp tỉnh quyết định điều chỉnh, sửa đổi, bổ sung Bảng giá đất để công bố và áp dụng từ ngày 01 tháng 01 của năm tiếp theo.',
      keywords: ['luật đất đai 2024', 'khung giá đất', 'bảng giá đất hằng năm', 'điều 159 luật đất đai']
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
