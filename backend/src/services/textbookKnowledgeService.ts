
/**
 * =============================================================================
 * VietLawAssist — Dịch vụ RAG Giáo trình Pháp luật Đại cương Chuẩn mực
 * Nguồn: Giáo trình Pháp luật đại cương — Trường Đại học Thương Mại (NXB Hà Nội, 2021)
 * Chủ biên: TS. Trần Thành Thọ
 * =============================================================================
 * Tích hợp toàn bộ 9 chương lý thuyết cốt lõi phục vụ truy xuất lai (Hybrid RAG)
 * đối với tất cả các câu hỏi lý thuyết, câu hỏi ôn tập mà hệ thống chưa gán mẫu train.
 */

export interface TextbookChunk {
  chapterNumber: number;
  chapterTitle: string;
  sectionCode: string;
  sectionTitle: string;
  pageRange: string;
  keywords: string[];
  summary: string;
  baremContent: string;
  legalBasis: string[];
}

export class TextbookKnowledgeService {
  private static CHUNKS: TextbookChunk[] = [
    // =========================================================================
    // CHƯƠNG 1: MỘT SỐ VẤN ĐỀ LÝ LUẬN CƠ BẢN VỀ NHÀ NƯỚC - NHÀ NƯỚC CHXHCN VN (tr. 5 - 32)
    // =========================================================================
    {
      chapterNumber: 1,
      chapterTitle: 'Chương 1: Một số vấn đề lý luận cơ bản về nhà nước - Nhà nước CHXHCN Việt Nam',
      sectionCode: '1.1.1',
      sectionTitle: 'Nguồn gốc của Nhà nước (Quan niệm phi Mác-xít và Học thuyết Mác - Lênin)',
      pageRange: 'tr. 5 - 10',
      keywords: ['nguồn gốc nhà nước', 'thuyết thần học', 'thuyết gia trưởng', 'thuyết bạo lực', 'khế ước xã hội', 'mác lênin', 'tiền đề kinh tế', 'tiền đề xã hội', 'nguyên nhân ra đời'],
      summary: 'Lý giải nguồn gốc nhà nước qua các học thuyết phi Mác-xít và 2 tiền đề kinh tế - xã hội của Chủ nghĩa Mác - Lênin.',
      legalBasis: ['Học thuyết Mác - Lênin về Nhà nước và Pháp luật', 'Tác phẩm Nguồn gốc của gia đình, của tư hữu và của nhà nước (Ph.Ăngghen)'],
      baremContent: `I. CÁC QUAN NIỆM PHI MÁC-XÍT VỀ NGUỒN GỐC NHÀ NƯỚC:
1. Thuyết thần học: Thượng đế là người sắp đặt trật tự xã hội, nhà nước là do Thượng đế sáng tạo ra để bảo vệ trật tự chung; quyền lực nhà nước là vĩnh cửu và con người có bổn phận phục tùng (J.Calvin, J.Althisius).
2. Thuyết gia trưởng: Nhà nước là kết quả phát triển tự nhiên của gia đình và quyền gia trưởng; quyền lực nhà nước giống như quyền lực gia trưởng của người đứng đầu gia đình (Aristote, Bodin).
3. Thuyết bạo lực: Nhà nước xuất hiện trực tiếp từ việc sử dụng bạo lực của thị tộc này đối với thị tộc khác, thị tộc chiến thắng lập ra bộ máy nhà nước để nô dịch kẻ chiến bại (Hume, Gumplowicz, E.Duhring).
4. Thuyết khế ước xã hội: Nhà nước ra đời từ một bản "khế ước xã hội" (hợp đồng) giữa các thành viên nhằm bảo vệ quyền tự nhiên của con người. Nếu nhà nước vi phạm khế ước, nhân dân có quyền lật đổ và lập khế ước mới (Thomas Hobbes, John Locke, J.J.Rousseau).

II. HỌC THUYẾT MÁC - LÊNIN VỀ NGUỒN GỐC NHÀ NƯỚC:
Chủ nghĩa Mác - Lênin khẳng định nhà nước là một hiện tượng lịch sử khách quan, xuất hiện khi xã hội phát triển đến một giai đoạn nhất định do 2 tiền đề:
1. Tiền đề kinh tế: Lực lượng sản xuất phát triển qua ba lần phân công lao động xã hội lớn (Chăn nuôi tách khỏi trồng trọt -> Thủ công nghiệp tách khỏi nông nghiệp -> Thương nghiệp xuất hiện) làm năng suất lao động tăng, xuất hiện của cải dư thừa, dẫn đến sự xuất hiện của chế độ tư hữu về tư liệu sản xuất.
2. Tiền đề xã hội: Xã hội phân chia thành các giai cấp đối kháng có lợi ích mâu thuẫn gay gắt không thể điều hòa. Để giữ cho sự xung đột giai cấp không tự thiêu hủy xã hội, giai cấp thống trị đã lập ra bộ máy quyền lực công đặc biệt để trấn áp và quản lý - đó là Nhà nước.`
    },
    {
      chapterNumber: 1,
      chapterTitle: 'Chương 1: Một số vấn đề lý luận cơ bản về nhà nước - Nhà nước CHXHCN Việt Nam',
      sectionCode: '1.1.2_1.1.3',
      sectionTitle: 'Khái niệm, Bản chất và Đặc điểm của Nhà nước',
      pageRange: 'tr. 10 - 14',
      keywords: ['khái niệm nhà nước', 'bản chất nhà nước', 'tính giai cấp', 'tính xã hội', 'đặc điểm nhà nước', '5 đặc trưng nhà nước'],
      summary: 'Định nghĩa nhà nước, phân tích tính giai cấp và tính xã hội, 5 đặc trưng cơ bản phân biệt nhà nước với tổ chức khác.',
      legalBasis: ['Hiến pháp 2013 (Điều 2)', 'Giáo trình Pháp luật đại cương (ĐH Thương mại 2021)'],
      baremContent: `I. KHÁI NIỆM VÀ BẢN CHẤT NHÀ NƯỚC:
- Định nghĩa: Nhà nước là tổ chức quyền lực công cộng đặc biệt, có bộ máy chuyên làm nhiệm vụ cưỡng chế và thực hiện chức năng quản lý xã hội, phục vụ và bảo vệ lợi ích của giai cấp cầm quyền và lợi ích chung của xã hội.
- Bản chất của nhà nước bao gồm hai thuộc tính thống nhất biện chứng:
  1. Tính giai cấp: Nhà nước là công cụ thống trị giai cấp của giai cấp cầm quyền trên 3 mặt: quyền lực kinh tế (nắm tư liệu sản xuất), quyền lực chính trị (sử dụng bộ máy bạo lực trấn áp) và quyền lực tư tưởng (xác lập hệ tư tưởng thống trị).
  2. Tính xã hội: Nhà nước là bộ máy thực thi quyền lực công nhằm duy trì trật tự xã hội, giải quyết các nhu cầu chung của cộng đồng (y tế, giao thông, an sinh, đê điều, phòng chống dịch bệnh, thiên tai).

II. NĂM ĐẶC ĐIỂM CƠ BẢN PHÂN BIỆT NHÀ NƯỚC VỚI CÁC TỔ CHỨC KHÁC:
1. Thiết lập quyền lực công cộng đặc biệt: Có lớp người chuyên làm nhiệm vụ quản lý và bộ máy cưỡng chế chuyên nghiệp (quân đội, cảnh sát, tòa án, nhà tù).
2. Phân chia dân cư theo lãnh thổ: Quản lý theo đơn vị hành chính lãnh thổ, không phụ thuộc vào quan hệ huyết thống.
3. Có chủ quyền quốc gia: Có quyền tối cao về đối nội và độc lập tự quyết trong quan hệ đối ngoại.
4. Ban hành pháp luật và quản lý xã hội bằng pháp luật: Là tổ chức duy nhất có quyền ban hành các quy tắc xử sự có tính bắt buộc chung.
5. Quy định và thực hiện việc thu các loại thuế: Là chủ thể duy nhất quy định và thu thuế nhằm nuôi dưỡng bộ máy nhà nước và điều tiết xã hội.`
    },
    {
      chapterNumber: 1,
      chapterTitle: 'Chương 1: Một số vấn đề lý luận cơ bản về nhà nước - Nhà nước CHXHCN Việt Nam',
      sectionCode: '1.1.4_1.1.5_1.1.6',
      sectionTitle: 'Hình thức Nhà nước, Chức năng Nhà nước và Các kiểu Nhà nước',
      pageRange: 'tr. 14 - 21',
      keywords: ['hình thức nhà nước', 'hình thức chính thể', 'quân chủ', 'cộng hòa', 'cấu trúc nhà nước', 'đơn nhất', 'liên bang', 'chế độ chính trị', 'chức năng nhà nước', 'các kiểu nhà nước'],
      summary: 'Cấu tạo 3 yếu tố hình thức nhà nước (chính thể, cấu trúc, chế độ chính trị), chức năng đối nội/đối ngoại, 4 kiểu nhà nước lịch sử.',
      legalBasis: ['Hiến pháp 2013 (Điều 1, Điều 2)', 'Giáo trình Pháp luật đại cương (ĐH Thương mại 2021)'],
      baremContent: `I. HÌNH THỨC NHÀ NƯỚC (GỒM 3 YẾU TỐ CẤU THÀNH):
1. Hình thức chính thể: Cách thức tổ chức và trình tự thành lập cơ quan quyền lực nhà nước tối cao:
   - Chính thể quân chủ: Quyền lực tối cao tập trung vào người đứng đầu theo nguyên tắc thế vị (Quân chủ tuyệt đối hoặc Quân chủ hạn chế/lập hiến như Anh, Nhật).
   - Chính thể cộng hòa: Quyền lực tối cao thuộc về cơ quan được bầu theo nhiệm kỳ (Cộng hòa dân chủ và Cộng hòa quý tộc).
2. Hình thức cấu trúc: Cách thức tổ chức thành đơn vị hành chính lãnh thổ:
   - Nhà nước đơn nhất: Có chủ quyền chung, một Hiến pháp, một hệ thống pháp luật, một cơ quan quyền lực và hành chính cao nhất (Việt Nam, Pháp, Nhật).
   - Nhà nước liên bang: Gồm hai hay nhiều nhà nước thành viên hợp lại, có hệ thống cơ quan chung và từng bang có hệ thống riêng (Mỹ, Đức, Nga).
3. Chế độ chính trị: Tổng thể phương pháp thực hiện quyền lực nhà nước (Phương pháp dân chủ và Phương pháp phản dân chủ/độc tài).

II. CHỨC NĂNG NHÀ NƯỚC:
- Chức năng đối nội: Quản lý kinh tế, bảo đảm trật tự an toàn xã hội, y tế, giáo dục, bảo vệ môi trường.
- Chức năng đối ngoại: Phòng thủ đất nước, mở rộng quan hệ hữu nghị và hội nhập quốc tế.

III. BỐN KIỂU NHÀ NƯỚC TRONG LỊCH SỬ:
Kiểu nhà nước chủ nô -> Kiểu nhà nước phong kiến -> Kiểu nhà nước tư sản -> Kiểu nhà nước xã hội chủ nghĩa.`
    },
    {
      chapterNumber: 1,
      chapterTitle: 'Chương 1: Một số vấn đề lý luận cơ bản về nhà nước - Nhà nước CHXHCN Việt Nam',
      sectionCode: '1.2.1_1.2.3',
      sectionTitle: 'Nhà nước CHXHCN Việt Nam và Bộ máy Nhà nước theo Hiến pháp 2013',
      pageRange: 'tr. 21 - 32',
      keywords: ['bộ máy nhà nước việt nam', 'quốc hội', 'chính phủ', 'chủ tịch nước', 'tòa án', 'viện kiểm sát', 'hiến pháp 2013', 'ubnd', 'hđnd'],
      summary: 'Bản chất nhà nước pháp quyền XHCN của nhân dân, do nhân dân, vì nhân dân; cơ cấu bộ máy nhà nước theo Hiến pháp 2013.',
      legalBasis: ['Hiến pháp năm 2013 (Điều 2, 69, 86, 94, 102, 107, 113, 114)'],
      baremContent: `I. BẢN CHẤT NHÀ NƯỚC CHXHCN VIỆT NAM (ĐIỀU 2 HIẾN PHÁP 2013):
"Nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam là nhà nước pháp quyền xã hội chủ nghĩa của Nhân dân, do Nhân dân, vì Nhân dân. Tất cả quyền lực nhà nước thuộc về Nhân dân mà nền tảng là liên minh giữa giai cấp công nhân với giai cấp nông dân và đội ngũ trí thức."

II. HỆ THỐNG CÁC CƠ QUAN TRONG BỘ MÁY NHÀ NƯỚC THEO HIẾN PHÁP 2013:
1. Cơ quan quyền lực nhà nước (Cơ quan đại diện do nhân dân bầu):
   - Quốc hội: Cơ quan đại biểu cao nhất của Nhân dân, cơ quan quyền lực nhà nước cao nhất; thực hiện quyền lập hiến, lập pháp, quyết định các vấn đề trọng đại và giám sát tối cao (Điều 69).
   - Hội đồng nhân dân (cấp tỉnh, huyện, xã): Cơ quan quyền lực nhà nước ở địa phương (Điều 113).
2. Nguyên thủ quốc gia: Chủ tịch nước là người đứng đầu Nhà nước, thay mặt nước CHXHCN Việt Nam về đối nội và đối ngoại, thống lĩnh lực lượng vũ trang nhân dân (Điều 86).
3. Cơ quan hành chính nhà nước (Cơ quan chấp hành và hành pháp):
   - Chính phủ: Cơ quan hành chính nhà nước cao nhất, cơ quan chấp hành của Quốc hội, thực hiện quyền hành pháp (Điều 94).
   - Ủy ban nhân dân các cấp: Cơ quan chấp hành của HĐND cùng cấp, cơ quan hành chính nhà nước ở địa phương (Điều 114).
4. Cơ quan xét xử (Thực hiện quyền tư pháp): Tòa án nhân dân (TAND Tối cao, TAND Cấp cao, TAND cấp tỉnh, cấp huyện và Tòa án quân sự) (Điều 102).
5. Cơ quan thực hiện quyền công tố và kiểm sát hoạt động tư pháp: Viện kiểm sát nhân dân (Điều 107).
6. Các thiết chế hiến định độc lập: Kiểm toán nhà nước (Điều 118) và Hội đồng bầu cử quốc gia (Điều 117).`
    },
    {
      chapterNumber: 1,
      chapterTitle: 'Chương 1: Một số vấn đề lý luận cơ bản về nhà nước - Nhà nước CHXHCN Việt Nam',
      sectionCode: '1.1.7',
      sectionTitle: 'Phân biệt Quyền lực Nhà nước và Quyền lực Xã hội trong thị tộc nguyên thủy',
      pageRange: 'tr. 8 - 12',
      keywords: [
        'quyền lực nhà nước và quyền lực xã hội',
        'quyền lực nhà nước',
        'quyền lực xã hội',
        'giống nhau',
        'khác nhau',
        'quyền lực công cộng đặc biệt',
        'thị tộc nguyên thủy',
        'bộ máy cưỡng chế'
      ],
      summary: 'So sánh và phân biệt Quyền lực Nhà nước (quyền lực công cộng đặc biệt mang tính giai cấp) với Quyền lực Xã hội trong xã hội nguyên thủy.',
      legalBasis: ['Giáo trình Pháp luật đại cương (ĐH Thương mại 2021, tr. 8 - 12)'],
      baremContent: `I. KHẲNG ĐỊNH NHẬN ĐỊNH:
Nhận định: "Quyền lực nhà nước và quyền lực xã hội là giống nhau" là HOÀN TOÀN SAI.

II. BẢNG TIÊU CHÍ PHÂN BIỆT QUYỀN LỰC NHÀ NƯỚC VÀ QUYỀN LỰC XÃ HỘI:

| Tiêu chí phân biệt | Quyền lực Xã hội (Thị tộc nguyên thủy) | Quyền lực Nhà nước (Xã hội có giai cấp) |
| :--- | :--- | :--- |
| **1. Bản chất** | Mang tính xã hội thuần túy, thể hiện ý chí chung của mọi thành viên trong thị tộc, bộ lạc. | Mang tính giai cấp sâu sắc, thể hiện ý chí của giai cấp thống trị được hợp pháp hóa thành ý chí nhà nước. |
| **2. Bộ máy thực thi** | Không tách rời khỏi xã hội, không có lớp người chuyên làm nhiệm vụ quản lý, không có bộ máy bạo lực cưỡng chế riêng. | Tách rời khỏi xã hội, thiết lập "quyền lực công cộng đặc biệt" gồm lớp người chuyên nghiệp và bộ máy bạo lực (quân đội, cảnh sát, tòa án, nhà tù). |
| **3. Phạm vi tác động** | Chỉ giới hạn trong nội bộ thị tộc, bộ lạc dựa trên quan hệ huyết thống. | Bao trùm lên toàn bộ lãnh thổ quốc gia, quản lý dân cư theo đơn vị hành chính lãnh thổ không phụ thuộc huyết thống. |
| **4. Công cụ quản lý** | Dựa trên tập quán, đạo đức, tín điều tôn giáo và dư luận xã hội. | Dựa trên Pháp luật - hệ thống quy tắc có tính bắt buộc chung và được cưỡng chế thi hành. |
| **5. Phương thức thực hiện** | Dựa vào sự phục tùng tự nguyện, uy tín của tộc trưởng, già làng. | Dựa vào sức mạnh cưỡng chế đơn phương của Nhà nước, bắt buộc mọi chủ thể phải phục tùng.`
    },

    // =========================================================================
    // CHƯƠNG 2: MỘT SỐ VẤN ĐỀ LÝ LUẬN CƠ BẢN VỀ PHÁP LUẬT (tr. 33 - 70)
    // =========================================================================
    {
      chapterNumber: 2,
      chapterTitle: 'Chương 2: Một số vấn đề lý luận cơ bản về pháp luật',
      sectionCode: '2.1.1_2.1.4',
      sectionTitle: 'Khái niệm, Nguồn gốc, Bản chất và 4 Đặc trưng của Pháp luật',
      pageRange: 'tr. 33 - 39',
      keywords: ['khái niệm pháp luật', 'nguồn gốc pháp luật', 'bản chất pháp luật', '4 đặc trưng pháp luật', 'tính quyền lực', 'tính ý chí', 'tính bắt buộc chung', 'tính quy phạm phổ biến'],
      summary: 'Khái niệm pháp luật, bản chất giai cấp và xã hội, 4 đặc trưng cốt lõi theo giáo trình ĐH Thương Mại.',
      legalBasis: ['Giáo trình Pháp luật đại cương (ĐH Thương mại 2021, tr. 34-38)'],
      baremContent: `I. KHÁI NIỆM VÀ BẢN CHẤT CỦA PHÁP LUẬT:
- Khái niệm: Pháp luật là hệ thống các quy tắc xử sự mang tính bắt buộc chung do Nhà nước ban hành hoặc thừa nhận, nhằm điều chỉnh các quan hệ xã hội theo mục tiêu, định hướng cụ thể và được bảo đảm thực hiện bằng sức mạnh quyền lực nhà nước.
- Bản chất của pháp luật:
  1. Tính giai cấp: Phản ánh ý chí nhà nước của giai cấp thống trị, là công cụ để điều chỉnh các quan hệ xã hội phục vụ cho lợi ích của giai cấp cầm quyền.
  2. Tính xã hội: Do nhà nước đại diện chính thức cho toàn xã hội ban hành, điều chỉnh các vấn đề chung bảo đảm an toàn, trật tự và sự phát triển ổn định của cộng đồng.

II. BỐN ĐẶC TRƯNG CƠ BẢN CỦA PHÁP LUẬT:
1. Thể hiện tính quyền lực nhà nước: Do nhà nước ban hành hoặc thừa nhận; chỉ pháp luật mới được bảo đảm thực hiện bằng sức mạnh cưỡng chế nhà nước.
2. Mang tính ý chí: Thể hiện ý chí của giai cấp cầm quyền được hợp pháp hóa thành ý chí của nhà nước.
3. Mang tính bắt buộc chung: Bất cứ chủ thể nào ở vào hoàn cảnh pháp luật dự liệu đều phải xử sự theo quy định, không ai được đứng ngoài pháp luật.
4. Mang tính quy phạm phổ biến: Là khuôn mẫu, mực thước chuẩn cho hành vi của nhiều người, được áp dụng lặp đi lặp lại nhiều lần trong không gian và thời gian rộng lớn.`
    },
    {
      chapterNumber: 2,
      chapterTitle: 'Chương 2: Một số vấn đề lý luận cơ bản về pháp luật',
      sectionCode: '2.2.1_2.2.2',
      sectionTitle: 'Mối quan hệ biện chứng giữa Nhà nước và Pháp luật',
      pageRange: 'tr. 39 - 42',
      keywords: [
        'mối quan hệ giữa nhà nước và pháp luật',
        'nhà nước và pháp luật',
        'nhà nước không cần pháp luật',
        'tồn tại mà không cần pháp luật',
        'phát huy tốt chức năng của mình mà không cần đến pháp luật',
        'không cần đến pháp luật',
        'chức năng của mình mà không cần',
        'tác động của nhà nước đối với pháp luật',
        'tác động của pháp luật đối với nhà nước',
        'công cụ quản lý xã hội'
      ],
      summary: 'Phân tích mối quan hệ hữu cơ biện chứng 2 chiều giữa Nhà nước và Pháp luật: Nhà nước ban hành và bảo đảm pháp luật; Pháp luật là công cụ tối cao để Nhà nước quản lý xã hội và thực thi chức năng.',
      legalBasis: ['Hiến pháp 2013 (Điều 2, Điều 8)', 'Giáo trình Pháp luật đại cương (ĐH Thương mại 2021, tr. 39 - 42)'],
      baremContent: `I. BẢN CHẤT MỐI QUAN HỆ GIỮA NHÀ NƯỚC VÀ PHÁP LUẬT:
Trong khoa học pháp lý đại cương, Nhà nước và Pháp luật là hai hiện tượng thượng tầng kiến trúc cùng phát sinh, cùng tồn tại, cùng phát triển và cùng tiêu vong; có mối quan hệ biện chứng gắn bó hữu cơ, tương hỗ và không thể tách rời:

1. Tác động của Nhà nước đối với Pháp luật (Nhà nước sinh ra và bảo đảm thực thi Pháp luật):
- Nhà nước là tổ chức quyền lực công cộng đặc biệt duy nhất có thẩm quyền ban hành hoặc thừa nhận các quy tắc xử sự chung thành Pháp luật.
- Nhà nước bảo đảm cho pháp luật được thực hiện trong đời sống bằng các biện pháp thuyết phục, giáo dục và đặc biệt là bằng sức mạnh cưỡng chế của bộ máy nhà nước (quân đội, công an, tòa án, viện kiểm sát, nhà tù). Nếu không có quyền lực nhà nước bảo đảm, pháp luật sẽ mất đi tính bắt buộc chung và không thể phát huy hiệu lực thực tế.

2. Tác động của Pháp luật đối với Nhà nước (Pháp luật là công cụ chủ yếu để Nhà nước tồn tại và quản lý):
- Pháp luật là công cụ quản lý chủ yếu, quan trọng và sắc bén nhất của Nhà nước: Thông qua pháp luật, Nhà nước thể chế hóa đường lối chính trị, điều hòa các mâu thuẫn giai cấp và quản lý mọi mặt của đời sống kinh tế - xã hội. Không có pháp luật, Nhà nước không thể thiết lập trật tự xã hội và không thể thực hiện các chức năng đối nội, đối ngoại của mình.
- Pháp luật là khuôn khổ pháp lý xác lập cơ cấu tổ chức, thẩm quyền và phương thức hoạt động của các cơ quan trong bộ máy nhà nước; đồng thời tạo ra cơ chế kiểm soát, kiềm chế quyền lực nhà nước, ngăn ngừa sự tùy tiện, lạm quyền và độc đoán (nguyên tắc thượng tôn pháp luật theo Điều 8 Hiến pháp 2013).

II. KẾT LUẬN & ĐÁNH GIÁ NHẬN ĐỊNH:
Nhà nước KHÔNG THỂ tồn tại và KHÔNG THỂ phát huy chức năng của mình nếu không có pháp luật. Mọi nhận định cho rằng Nhà nước có thể tồn tại và phát huy tốt chức năng mà không cần đến pháp luật là HOÀN TOÀN SAI LẦM VÀ TRÁI VỚI NGUYÊN LÝ KHOA HỌC PHÁP LÝ.`
    },
    {
      chapterNumber: 2,
      chapterTitle: 'Chương 2: Một số vấn đề lý luận cơ bản về pháp luật',
      sectionCode: '2.3.1_2.3.3',
      sectionTitle: 'Ba hình thức Pháp luật và Hệ thống VBQPPL Việt Nam',
      pageRange: 'tr. 42 - 52',
      keywords: ['hình thức pháp luật', 'tập quán pháp', 'tiền lệ pháp', 'án lệ', 'văn bản quy phạm pháp luật', 'hệ thống vbqppl', 'luật ban hành văn bản 2015'],
      summary: '3 hình thức pháp luật (tập quán pháp, tiền lệ pháp/án lệ, VBQPPL) và bảng hệ thống 13 loại văn bản QPPL theo Luật 2015.',
      legalBasis: ['Luật Ban hành văn bản quy phạm pháp luật năm 2015 (sửa đổi 2020) Điều 4', 'Bộ luật Dân sự 2015 Điều 5'],
      baremContent: `I. BA HÌNH THỨC CƠ BẢN CỦA PHÁP LUẬT:
1. Tập quán pháp: Những tập quán lưu truyền trong xã hội được nhà nước thừa nhận có giá trị pháp lý (Điều 5 BLDS 2015: áp dụng tập quán khi không có thỏa thuận và luật không quy định).
2. Tiền lệ pháp (Án lệ): Các quyết định hoặc bản án của tòa án có thẩm quyền trong vụ việc cụ thể được thừa nhận làm khuôn mẫu xét xử vụ việc tương tự (Việt Nam chính thức áp dụng án lệ từ năm 2014 theo Luật Tổ chức TAND).
3. Văn bản quy phạm pháp luật: Văn bản do cơ quan nhà nước có thẩm quyền ban hành theo trình tự, thủ tục luật định, chứa quy tắc xử sự chung. Đây là hình thức chủ yếu và quan trọng nhất ở Việt Nam.

II. HỆ THỐNG VĂN BẢN QUY PHẠM PHÁP LUẬT Ở VIỆT NAM (ĐIỀU 4 LUẬT BAN HÀNH VBQPPL 2015):
- Quốc hội: Hiến pháp, Bộ luật, Luật, Nghị quyết.
- UBTVQH: Pháp lệnh, Nghị quyết; Nghị quyết liên tịch với UBTW MTTQVN.
- Chủ tịch nước: Lệnh, Quyết định.
- Chính phủ: Nghị định; Nghị quyết liên tịch với UBTW MTTQVN.
- Thủ tướng Chính phủ: Quyết định.
- Hội đồng Thẩm phán TAND Tối cao: Nghị quyết.
- Chánh án TANDTC, Viện trưởng VKSNDTC, Bộ trưởng: Thông tư, Thông tư liên tịch.
- Tổng Kiểm toán nhà nước: Quyết định.
- HĐND các cấp: Nghị quyết.
- UBND các cấp: Quyết định.`
    },
    {
      chapterNumber: 2,
      chapterTitle: 'Chương 2: Một số vấn đề lý luận cơ bản về pháp luật',
      sectionCode: '2.3.4_2.3.5',
      sectionTitle: 'Hiệu lực của VBQPPL và Nguyên tắc Áp dụng Văn bản',
      pageRange: 'tr. 52 - 57',
      keywords: ['hiệu lực văn bản', 'hiệu lực thời gian', 'hiệu lực hồi tố', 'nguyên tắc áp dụng văn bản', 'điều ước quốc tế'],
      summary: 'Hiệu lực về thời gian, không gian, đối tượng, hiệu lực trở về trước (hồi tố) và các nguyên tắc xử lý xung đột văn bản.',
      legalBasis: ['Luật Ban hành VBQPPL 2015 (Điều 79, 154, 156)', 'Bộ luật Hình sự 2015 (Khoản 3 Điều 7)'],
      baremContent: `I. HIỆU LỰC CỦA VĂN BẢN QUY PHẠM PHÁP LUẬT:
1. Hiệu lực về thời gian: Bắt đầu phát sinh và chấm dứt hiệu lực (văn bản trung ương có hiệu lực không sớm hơn 45 ngày; cấp tỉnh 10 ngày; cấp huyện/xã 07 ngày).
2. Hiệu lực hồi tố (trở về trước): Về nguyên tắc không áp dụng hồi tố. Chỉ áp dụng trong trường hợp nhân đạo có lợi cho đối tượng chịu tác động (Khoản 3 Điều 7 BLHS 2015: điều luật xóa bỏ tội phạm, giảm nhẹ hình phạt mới được áp dụng hồi tố). Tuyệt đối không hồi tố quy định trách nhiệm pháp lý mới hoặc nặng hơn.
3. Hiệu lực về không gian và đối tượng: Toàn quốc hoặc địa phương; áp dụng đối với mọi cơ quan, tổ chức, công dân và người nước ngoài tại Việt Nam.

II. NGUYÊN TẮC ÁP DỤNG VĂN BẢN QUY PHẠM PHÁP LUẬT (ĐIỀU 156 LUẬT 2015):
1. Áp dụng văn bản có hiệu lực pháp lý cao hơn nếu có quy định khác nhau về cùng một vấn đề.
2. Áp dụng văn bản ban hành sau nếu các văn bản do cùng một cơ quan ban hành có quy định khác nhau.
3. Ưu tiên áp dụng Điều ước quốc tế mà Việt Nam là thành viên (trừ Hiến pháp).`
    },

    // =========================================================================
    // CHƯƠNG 3: QUY PHẠM PHÁP LUẬT VÀ THỰC HIỆN PHÁP LUẬT (tr. 71 - 89)
    // =========================================================================
    {
      chapterNumber: 3,
      chapterTitle: 'Chương 3: Quy phạm pháp luật và Thực hiện pháp luật',
      sectionCode: '3.1.1_3.1.2',
      sectionTitle: 'Khái niệm và Cơ cấu 3 bộ phận của Quy phạm pháp luật (Giả định - Quy định - Chế tài)',
      pageRange: 'tr. 71 - 78',
      keywords: ['quy phạm pháp luật', 'cơ cấu quy phạm', '3 bộ phận', 'giả định', 'quy định', 'chế tài'],
      summary: 'Quy phạm pháp luật là tế bào nhỏ nhất của hệ thống pháp luật; phân tích chi tiết Giả định, Quy định, Chế tài và ví dụ thực tế.',
      legalBasis: ['Giáo trình Pháp luật đại cương (ĐH Thương mại 2021, tr. 71-77)'],
      baremContent: `I. KHÁI NIỆM QUY PHẠM PHÁP LUẬT:
Là quy tắc xử sự mang tính bắt buộc chung do cơ quan nhà nước có thẩm quyền ban hành hoặc thừa nhận và được nhà nước bảo đảm thực hiện để điều chỉnh các quan hệ xã hội.

II. CƠ CẤU 3 BỘ PHẬN CỦA QUY PHẠM PHÁP LUẬT:
1. Giả định: Nêu lên hoàn cảnh, điều kiện, chủ thể cụ thể chịu sự tác động của quy phạm (Trả lời câu hỏi: Chủ thể nào? Khi nào? Trong điều kiện, hoàn cảnh nào?).
   - Ví dụ: Khoản 1 Điều 35 Hiến pháp 2013: "Công dân" (chủ thể) "có quyền làm việc...".
2. Quy định: Nêu lên cách xử sự mà chủ thể phải làm, được làm hoặc không được làm khi rơi vào hoàn cảnh nêu ở phần giả định (Trả lời câu hỏi: Phải làm gì? Được làm gì? Không được làm gì?).
   - Phân loại: Quy định bắt buộc (cấm, phải), quy định tùy nghi, quy định trao quyền.
3. Chế tài: Nêu lên các biện pháp tác động bất lợi (hậu quả pháp lý) mà Nhà nước áp dụng đối với chủ thể vi phạm phần quy định (Trả lời câu hỏi: Hậu quả sẽ ra sao nếu không thực hiện đúng mệnh lệnh?).
   - Phân loại: Chế tài hình sự (phạt tù, tử hình), chế tài hành chính (phạt tiền, tước bằng lái), chế tài dân sự (bồi thường thiệt hại), chế tài kỷ luật (khiển trách, buộc thôi việc).`
    },
    {
      chapterNumber: 3,
      chapterTitle: 'Chương 3: Quy phạm pháp luật và Thực hiện pháp luật',
      sectionCode: '3.2.1_3.2.2',
      sectionTitle: 'Bốn hình thức Thực hiện pháp luật và Áp dụng pháp luật',
      pageRange: 'tr. 80 - 89',
      keywords: ['thực hiện pháp luật', '4 hình thức thực hiện', 'tuân thủ', 'thi hành', 'sử dụng', 'áp dụng pháp luật', 'văn bản áp dụng pháp luật'],
      summary: 'So sánh 4 hình thức thực hiện pháp luật (Tuân thủ, Thi hành, Sử dụng, Áp dụng); 5 trường hợp áp dụng pháp luật và 4 giai đoạn áp dụng.',
      legalBasis: ['Giáo trình Pháp luật đại cương (ĐH Thương mại 2021, tr. 80-88)'],
      baremContent: `I. BỐN HÌNH THỨC THỰC HIỆN PHÁP LUẬT:
1. Tuân theo (Tuân thủ) pháp luật: Chủ thể kiềm chế không thực hiện điều pháp luật cấm (Hành vi thụ động, dạng không hành động. Ví dụ: Không vượt đèn đỏ, không buôn ma túy).
2. Thi hành (Chấp hành) pháp luật: Chủ thể chủ động thực hiện nghĩa vụ pháp lý bắt buộc (Hành vi tích cực, dạng hành động. Ví dụ: Đi nghĩa vụ quân sự, đóng thuế đầy đủ).
3. Sử dụng pháp luật: Chủ thể chủ động quyết định thực hiện hay không thực hiện quyền luật cho phép (Ví dụ: Đăng ký kết hôn, khiếu nại, lập di chúc).
4. Áp dụng pháp luật: Nhà nước thông qua cơ quan có thẩm quyền ra quyết định cá biệt làm phát sinh, thay đổi, chấm dứt quan hệ pháp luật cụ thể hoặc áp dụng chế tài cưỡng chế (Ví dụ: Tòa án tuyên phạt tù, CSGT ra quyết định xử phạt).

II. ĐẶC ĐIỂM CỦA ÁP DỤNG PHÁP LUẬT:
- Mang tính quyền lực nhà nước, chỉ do chủ thể có thẩm quyền tiến hành.
- Tiến hành theo trình tự, thủ tục chặt chẽ do pháp luật quy định.
- Cá biệt hóa quy phạm pháp luật vào từng trường hợp cụ thể thông qua Văn bản áp dụng pháp luật.`
    },

    // =========================================================================
    // CHƯƠNG 4: QUAN HỆ PHÁP LUẬT (tr. 90 - 103)
    // =========================================================================
    {
      chapterNumber: 4,
      chapterTitle: 'Chương 4: Quan hệ pháp luật',
      sectionCode: '4.1_4.2',
      sectionTitle: 'Khái niệm, Đặc điểm và Cơ cấu 3 yếu tố của Quan hệ pháp luật',
      pageRange: 'tr. 90 - 100',
      keywords: ['quan hệ pháp luật', 'cơ cấu quan hệ pháp luật', 'chủ thể', 'khách thể', 'nội dung', 'năng lực pháp luật', 'năng lực hành vi', 'pháp nhân điều 74'],
      summary: 'Cơ cấu 3 yếu tố: Chủ thể (năng lực pháp luật, năng lực hành vi, 4 điều kiện pháp nhân Điều 74 BLDS), Khách thể và Nội dung (Quyền & Nghĩa vụ).',
      legalBasis: ['Bộ luật Dân sự 2015 (Điều 16, 19, 74, 105)'],
      baremContent: `I. KHÁI NIỆM QUAN HỆ PHÁP LUẬT & MỐI QUAN HỆ VỚI QUAN HỆ XÃ HỘI:
- Định nghĩa: Quan hệ pháp luật là những quan hệ xã hội được các quy phạm pháp luật điều chỉnh, trong đó các bên tham gia có các quyền chủ thể và nghĩa vụ pháp lý cụ thể được Nhà nước quy định và bảo đảm thực hiện bằng sức mạnh cưỡng chế.
- Phân biệt Quan hệ xã hội và Quan hệ pháp luật: Không phải mọi quan hệ xã hội đều được điều chỉnh bằng pháp luật. Pháp luật chỉ điều chỉnh những quan hệ xã hội phổ biến, điển hình, quan trọng gắn liền với lợi ích nhà nước và trật tự công cộng; các quan hệ xã hội khác (như tình bạn, tình yêu, giao tiếp đạo đức, tín ngưỡng tôn giáo thuần túy) do các quy phạm xã hội khác (đạo đức, tập quán, tín điều tôn giáo) điều chỉnh.

II. CƠ CẤU 3 YẾU TỐ CỦA QUAN HỆ PHÁP LUẬT:
1. Chủ thể: Các bên tham gia quan hệ có năng lực chủ thể gồm:
   - Năng lực pháp luật: Khả năng hưởng quyền và gánh vác nghĩa vụ (có từ khi sinh ra đến khi chết).
   - Năng lực hành vi: Khả năng tự mình bằng hành vi xác lập quyền và nghĩa vụ (phụ thuộc độ tuổi và nhận thức).
   - Cá nhân & Pháp nhân (Pháp nhân phải đủ 4 điều kiện theo Điều 74 BLDS: Thành lập hợp pháp; Cơ cấu chặt chẽ; Tài sản độc lập; Nhân danh mình tham gia quan hệ độc lập).
2. Khách thể: Lợi ích vật chất, giá trị tinh thần hoặc lợi ích xã hội mà các chủ thể hướng tới (tài sản, quyền tác giả, tính mạng, sức khỏe).
3. Nội dung: Tổng hợp các Quyền chủ thể (cách xử sự được phép) và Nghĩa vụ pháp lý (cách xử sự bắt buộc phải thực hiện hoặc kiềm chế không làm).`
    },
    {
      chapterNumber: 4,
      chapterTitle: 'Chương 4: Quan hệ pháp luật',
      sectionCode: '4.3',
      sectionTitle: 'Sự kiện pháp lý (Khái niệm, Sự biến pháp lý và Hành vi pháp lý)',
      pageRange: 'tr. 100 - 103',
      keywords: ['sự kiện pháp lý', 'sự biến pháp lý', 'hành vi pháp lý', 'hợp pháp', 'bất hợp pháp', 'sự kiện đơn giản', 'sự kiện phức tạp'],
      summary: 'Khái niệm sự kiện pháp lý; phân loại theo ý chí (sự biến pháp lý, hành vi pháp lý) và theo số lượng điều kiện.',
      legalBasis: ['Bộ luật Dân sự 2015 (Điều 116, 611)'],
      baremContent: `I. KHÁI NIỆM SỰ KIỆN PHÁP LÝ:
Sự kiện pháp lý là những sự kiện thực tế xảy ra trong đời sống mà sự xuất hiện hay mất đi của chúng được pháp luật gắn liền với việc làm phát sinh, thay đổi hoặc chấm dứt quan hệ pháp luật.

II. PHÂN LOẠI SỰ KIỆN PHÁP LÝ:
1. Căn cứ vào tiêu chuẩn ý chí:
   - Sự biến pháp lý: Hiện tượng tự nhiên hoặc xã hội xảy ra không phụ thuộc vào ý chí con người nhưng được pháp luật dự liệu gắn với hậu quả pháp lý (Ví dụ: Người chết làm phát sinh thừa kế; thiên tai lũ lụt là sự kiện bất khả kháng miễn trách nhiệm).
   - Hành vi pháp lý: Sự kiện xảy ra theo ý chí của con người (hành động hoặc không hành động). Gồm:
     + Hành vi hợp pháp: Ký hợp đồng, nộp thuế, đăng ký kết hôn.
     + Hành vi không hợp pháp: Trộm cắp, gây thương tích, vi phạm hợp đồng.
2. Căn cứ vào số lượng điều kiện:
   - Sự kiện pháp lý đơn giản: Chỉ một sự kiện thực tế là đủ (Ví dụ: Cá nhân chết chấm dứt hôn nhân).
   - Sự kiện pháp lý phức tạp: Cần tập hợp nhiều sự kiện liên tiếp (Ví dụ: Để chia thừa kế cần có sự kiện chết + có tài sản + có người thừa kế còn sống).`
    },

    // =========================================================================
    // CHƯƠNG 5: VI PHẠM PHÁP LUẬT VÀ TRÁCH NHIỆM PHÁP LÝ (tr. 104 - 116)
    // =========================================================================
    {
      chapterNumber: 5,
      chapterTitle: 'Chương 5: Vi phạm pháp luật và Trách nhiệm pháp lý',
      sectionCode: '5.1_5.2',
      sectionTitle: 'Bốn dấu hiệu, Cấu thành 4 yếu tố của VPPL và 4 loại Trách nhiệm pháp lý',
      pageRange: 'tr. 104 - 116',
      keywords: ['vi phạm pháp luật', '4 dấu hiệu vppl', 'cấu thành vppl', 'mặt khách quan', 'mặt chủ quan', 'yếu tố lỗi', 'khách thể', 'chủ thể', 'trách nhiệm pháp lý', '4 loại trách nhiệm'],
      summary: 'Khái niệm, 4 dấu hiệu nhận diện, cấu thành 4 yếu tố và bảng phân loại 4 loại vi phạm pháp luật / trách nhiệm pháp lý.',
      legalBasis: ['Bộ luật Hình sự 2015', 'Bộ luật Dân sự 2015', 'Luật Xử lý vi phạm hành chính 2012'],
      baremContent: `I. BỐN DẤU HIỆU CƠ BẢN CỦA VI PHẠM PHÁP LUẬT:
1. Là hành vi xác định của con người (hành động hoặc không hành động; tư tưởng trong đầu không bị xử lý).
2. Có tính trái pháp luật (xâm phạm quan hệ được pháp luật bảo vệ).
3. Có lỗi của chủ thể (lỗi cố ý trực tiếp, cố ý gián tiếp, vô ý vì quá tự tin, vô ý do cẩu thả).
4. Do chủ thể có năng lực trách nhiệm pháp lý thực hiện (đủ tuổi luật định và nhận thức bình thường).

II. CẤU THÀNH 4 YẾU TỐ CỦA VI PHẠM PHÁP LUẬT:
1. Mặt khách quan: Hành vi trái pháp luật, Hậu quả thiệt hại cho xã hội, Mối quan hệ nhân quả giữa hành vi và hậu quả, công cụ/phương tiện.
2. Mặt chủ quan: Lỗi (cố ý/vô ý), Động cơ vi phạm, Mục đích vi phạm.
3. Khách thể: Quan hệ xã hội được pháp luật bảo vệ bị hành vi xâm hại.
4. Chủ thể: Cá nhân hoặc tổ chức có năng lực trách nhiệm pháp lý.

III. BỐN LOẠI VI PHẠM PHÁP LUẬT VÀ TRÁCH NHIỆM PHÁP LÝ TƯƠNG ỨNG:
1. Vi phạm hình sự (Tội phạm) -> Trách nhiệm hình sự (Tòa án áp dụng hình phạt nghiêm khắc nhất).
2. Vi phạm hành chính -> Trách nhiệm hành chính (Cơ quan hành chính nhà nước xử phạt).
3. Vi phạm dân sự -> Trách nhiệm dân sự (Bồi thường thiệt hại, phạt vi phạm hợp đồng).
4. Vi phạm kỷ luật -> Trách nhiệm kỷ luật (Cơ quan, đơn vị xử lý khiển trách, cảnh cáo, sa thải).`
    },
    {
      chapterNumber: 5,
      chapterTitle: 'Chương 5: Vi phạm pháp luật và Trách nhiệm pháp lý',
      sectionCode: '5.3',
      sectionTitle: 'Phân biệt 4 hình thức lỗi trong vi phạm pháp luật (Cố ý trực tiếp, Cố ý gián tiếp, Vô ý quá tự tin, Vô ý cẩu thả)',
      pageRange: 'tr. 108 - 112',
      keywords: [
        'so sánh lỗi cố ý trực tiếp và cố ý gián tiếp',
        'cố ý trực tiếp và cố ý gián tiếp',
        'lỗi cố ý trực tiếp',
        'lỗi cố ý gián tiếp',
        'cố ý trực tiếp',
        'cố ý gián tiếp',
        'ví dụ minh hoạ',
        'ví dụ minh họa',
        'mặt chủ quan',
        'vô ý do quá tự tin',
        'vô ý do cẩu thả'
      ],
      summary: 'Lập bảng so sánh 4 tiêu chí giữa lỗi cố ý trực tiếp và cố ý gián tiếp theo Bộ luật Hình sự 2015 và Giáo trình Pháp luật Đại cương, kèm ví dụ minh họa chi tiết.',
      legalBasis: ['Bộ luật Hình sự năm 2015 (Điều 10, Điều 11)', 'Giáo trình Pháp luật đại cương (ĐH Thương mại 2021, tr. 108-111)'],
      baremContent: `I. CĂN CỨ PHÁP LÝ VÀ ĐỊNH NGHĨA (ĐIỀU 10 BLHS 2015):
1. Cố ý phạm tội trực tiếp (Khoản 1 Điều 10): Người phạm tội nhận thức rõ hành vi của mình là nguy hiểm cho xã hội, thấy trước hậu quả của hành vi đó và mong muốn hậu quả xảy ra.
2. Cố ý phạm tội gián tiếp (Khoản 2 Điều 10): Người phạm tội nhận thức rõ hành vi của mình là nguy hiểm cho xã hội, thấy trước hậu quả của hành vi đó có thể xảy ra, tuy không mong muốn nhưng vẫn có ý thức để mặc cho hậu quả xảy ra.

---

II. BẢNG TIÊU CHÍ SO SÁNH GIỮA CỐ Ý TRỰC TIẾP VÀ CỐ Ý GIÁN TIẾP:

| Tiêu chí phân biệt | Lỗi cố ý trực tiếp | Lỗi cố ý gián tiếp |
| :--- | :--- | :--- |
| **1. Về mặt lý trí (Nhận thức hành vi)** | Nhận thức rõ tính chất nguy hiểm cho xã hội của hành vi của mình. | Nhận thức rõ tính chất nguy hiểm cho xã hội của hành vi của mình. |
| **2. Về mặt lý trí (Dự kiến hậu quả)** | Thấy trước hậu quả của hành vi là **tất yếu xảy ra** hoặc **chắc chắn xảy ra**. | Thấy trước hậu quả của hành vi là **có thể xảy ra** (khả năng xảy ra). |
| **3. Về mặt ý chí (Thái độ tâm lý)** | **Mong muốn** hậu quả xảy ra (hậu quả là mục đích hướng tới của chủ thể). | **Không mong muốn**, nhưng **có ý thức chấp nhận, để mặc** cho hậu quả xảy ra. |
| **4. Mối quan hệ giữa hành vi và mục đích** | Hành vi được thực hiện chính là phương tiện trực tiếp để đạt mục đích phạm tội. | Hành vi được thực hiện nhằm đạt một mục đích khác, hậu quả nguy hại chỉ là hệ quả đi kèm mà chủ thể chấp nhận. |

---

III. VÍ DỤ MINH HỌA CỤ THỂ:
- **Ví dụ về Lỗi cố ý trực tiếp**:
  Do mâu thuẫn sâu sắc, A cầm súng ngắm thẳng vào ngực B và bóp cò với mục đích bắn chết B để trả thù. A nhận thức rõ việc bắn súng vào ngực sẽ làm B chết và mong muốn B phải chết. Hành vi của A mang lỗi cố ý trực tiếp.
- **Ví dụ về Lỗi cố ý gián tiếp**:
  A giăng dây điện trần 220V xung quanh ao cá nhà mình để bẫy kẻ trộm cá. A biết rõ nguồn điện có thể giật chết bất kỳ người nào vô tình vướng phải, nhưng A nghĩ "ai bước vào bị điện giật chết thì ráng chịu". Đêm đó, cháu B đi bắt ếch vướng vào dây điện và tử vong. A không chủ tâm muốn giết cháu B, nhưng đã có ý thức để mặc hậu quả chết người xảy ra. Hành vi của A mang lỗi cố ý gián tiếp.`
    },
    {
      chapterNumber: 5,
      chapterTitle: 'Chương 5: Vi phạm pháp luật và Trách nhiệm pháp lý',
      sectionCode: '5.4',
      sectionTitle: 'Mặt khách quan của vi phạm pháp luật và Dấu hiệu thiệt hại thực tế',
      pageRange: 'tr. 105 - 108',
      keywords: [
        'thiệt hại thực tế xảy ra cho xã hội là dấu hiệu bắt buộc',
        'thiệt hại thực tế',
        'mặt khách quan',
        'dấu hiệu bắt buộc',
        'dấu hiệu bắt buộc trong mặt khách quan',
        'cấu thành vật chất',
        'cấu thành hình thức'
      ],
      summary: 'Khẳng định nhận định là SAI; phân tích hành vi trái pháp luật là dấu hiệu bắt buộc duy nhất, phân biệt cấu thành hình thức và cấu thành vật chất.',
      legalBasis: ['Bộ luật Hình sự năm 2015 (Điều 8, Điều 168, Điều 249)', 'Giáo trình Pháp luật đại cương (ĐH Thương mại 2021)'],
      baremContent: `I. KHẲNG ĐỊNH NHẬN ĐỊNH:
Nhận định: "Thiệt hại thực tế xảy ra cho xã hội là dấu hiệu bắt buộc trong mặt khách quan của vi phạm pháp luật" là HOÀN TOÀN SAI.

II. LUẬN CỨ GIẢI THÍCH LÝ LUẬN VÀ THỰC TIỄN:
1. Trong mặt khách quan của vi phạm pháp luật, chỉ có duy nhất **HÀNH VI TRÁI PHÁP LUẬT** là dấu hiệu bắt buộc đối với tất cả các vi phạm pháp luật (vì không có hành vi thể hiện ra thế giới khách quan thì không thể có vi phạm pháp luật).
2. Yếu tố **Hậu quả thiệt hại thực tế KHÔNG PHẢI là dấu hiệu bắt buộc** trong mọi trường hợp, bởi vì khoa học pháp lý phân chia cấu thành vi phạm thành hai dạng:
   - **Cấu thành vật chất**: Bắt buộc phải có hậu quả thiệt hại thực tế xảy ra thì mới hoàn thành vi phạm (Ví dụ: Tội giết người, Tội trộm cắp tài sản theo giá trị tài sản từ 2 triệu đồng trở lên, trách nhiệm bồi thường thiệt hại ngoài hợp đồng theo Điều 584 BLDS 2015).
   - **Cấu thành hình thức**: Chỉ cần chủ thể thực hiện hành vi nguy hiểm cho xã hội bị pháp luật cấm là vi phạm pháp luật đã hoàn thành đầy đủ, **hoàn toàn không bắt buộc phải có thiệt hại thực tế xảy ra** (Ví dụ: Tội cướp tài sản theo Điều 168 BLHS - chỉ cần có hành vi dùng vũ lực nhằm chiếm đoạt là tội phạm đã hoàn thành; Tội tàng trữ trái phép chất ma túy theo Điều 249 BLHS; hoặc trong luật hành chính, hành vi vượt đèn đỏ, chạy quá tốc độ dù chưa gây ra tai nạn hay thiệt hại thực tế nào vẫn cấu thành vi phạm pháp luật hành chính và bị xử phạt).`
    },

    // =========================================================================
    // CHƯƠNG 6: MỘT SỐ NỘI DUNG CƠ BẢN CỦA LUẬT DÂN SỰ (tr. 117 - 147)
    // =========================================================================
        {
      chapterNumber: 6,
      chapterTitle: 'Chương 6: Một số nội dung cơ bản của Luật Dân sự',
      sectionCode: '6.2_6.3',
      sectionTitle: 'Giao dịch dân sự, Điều kiện có hiệu lực và Hợp đồng dân sự vô hiệu',
      pageRange: 'tr. 145 - 158',
      keywords: ['giao dịch dân sự', 'hợp đồng dân sự', 'điều kiện có hiệu lực', 'giao dịch vô hiệu', 'hợp đồng vô hiệu', 'điều 117 blds', 'điều 122 blds', 'lừa dối đe dọa', 'hình thức giao dịch', 'hậu quả vô hiệu'],
      summary: 'Quy định về khái niệm giao dịch dân sự, 4 điều kiện có hiệu lực theo Điều 117 BLDS 2015 và các trường hợp giao dịch dân sự vô hiệu cùng hậu quả pháp lý.',
      legalBasis: ['Bộ luật Dân sự năm 2015 (Điều 116, Điều 117, Điều 122 - 133, Điều 385, Điều 407, Điều 408)'],
      baremContent: `I. KHÁI NIỆM VÀ ĐIỀU KIỆN CÓ HIỆU LỰC CỦA GIAO DỊCH DÂN SỰ (ĐIỀU 116, 117 BLDS 2015):
1. Khái niệm: Giao dịch dân sự là hợp đồng hoặc hành vi pháp lý đơn phương làm phát sinh, thay đổi hoặc chấm dứt quyền, nghĩa vụ dân sự.
2. Bốn điều kiện có hiệu lực (Điều 117 BLDS 2015):
- Chủ thể có năng lực pháp luật dân sự, năng lực hành vi dân sự phù hợp với giao dịch dân sự được xác lập.
- Chủ thể tham gia giao dịch dân sự hoàn toàn tự nguyện.
- Mục đích và nội dung của giao dịch dân sự không vi phạm điều cấm của luật, không trái đạo đức xã hội.
- Hình thức của giao dịch dân sự là điều kiện có hiệu lực trong trường hợp luật có quy định (bằng văn bản, công chứng, chứng thực, đăng ký).

II. CÁC TRƯỜNG HỢP GIAO DỊCH DÂN SỰ VÔ HIỆU (ĐIỀU 122 - 129 BLDS 2015):
1. Vô hiệu do vi phạm điều cấm của luật, trái đạo đức xã hội (Điều 123).
2. Vô hiệu do giả tạo (Điều 124): Xác lập giao dịch nhằm che giấu một giao dịch khác hoặc trốn tránh nghĩa vụ.
3. Vô hiệu do người chưa thành niên, người mất NLHVDS, người có khó khăn trong nhận thức xác lập (Điều 125).
4. Vô hiệu do nhầm lẫn (Điều 126).
5. Vô hiệu do bị lừa dối, đe dọa, cưỡng ép (Điều 127).
6. Vô hiệu do người xác lập không nhận thức và làm chủ được hành vi của mình (Điều 128).
7. Vô hiệu do không tuân thủ quy định về hình thức (Điều 129).

III. HẬU QUẢ PHÁP LÝ CỦA GIAO DỊCH DÂN SỰ VÔ HIỆU (ĐIỀU 131 BLDS 2015):
- Không làm phát sinh, thay đổi, chấm dứt quyền, nghĩa vụ dân sự của các bên từ thời điểm giao dịch được xác lập.
- Các bên khôi phục lại tình trạng ban đầu, hoàn trả cho nhau những gì đã nhận; nếu không hoàn trả được bằng hiện vật thì trị giá thành tiền để hoàn trả.
- Bên ngay tình trong việc thu hoa lợi, lợi tức không phải hoàn trả hoa lợi, lợi tức đó.
- Bên có lỗi gây thiệt hại thì phải bồi thường.`
    },
{
      chapterNumber: 6,
      chapterTitle: 'Chương 6: Một số nội dung cơ bản của Luật Dân sự',
      sectionCode: '6.4_6.5',
      sectionTitle: 'Tài sản, Quyền sở hữu và Thừa kế theo BLDS 2015',
      pageRange: 'tr. 130 - 147',
      keywords: ['tài sản điều 105', 'quyền sở hữu', 'chiếm hữu', 'sử dụng', 'định đoạt', 'thừa kế', 'di sản điều 612', 'điều 644', 'điều 651', 'thừa kế thế vị điều 652'],
      summary: 'Tài sản Điều 105, 3 quyền sở hữu (Điều 158), Thừa kế theo di chúc, người thừa kế không phụ thuộc nội dung di chúc (Điều 644), 3 hàng thừa kế (Điều 651) và thừa kế thế vị (Điều 652).',
      legalBasis: ['Bộ luật Dân sự 2015 (Điều 105, 158, 179, 189, 192, 612, 644, 651, 652)'],
      baremContent: `I. TÀI SẢN VÀ QUYỀN SỞ HỮU (BLDS 2015):
- Tài sản (Điều 105): Gồm vật, tiền, giấy tờ có giá và quyền tài sản. Gồm bất động sản và động sản (Điều 107).
- Quyền sở hữu (Điều 158): Gồm 3 quyền năng:
  1. Quyền chiếm hữu (Điều 179): Chiếm hữu có căn cứ pháp luật (Điều 165) và chiếm hữu không có căn cứ (ngay tình hoặc không ngay tình).
  2. Quyền sử dụng (Điều 189): Khai thác công dụng, hưởng hoa lợi, lợi tức.
  3. Quyền định đoạt (Điều 192): Định đoạt số phận thực tế (tiêu dùng, hủy bỏ) và định đoạt số phận pháp lý (bán, tặng cho, để thừa kế).

II. CHẾ ĐỊNH THỪA KẾ (CHƯƠNG XXII - XXIII BLDS 2015):
1. Di sản thừa kế (Điều 612): Tài sản riêng của người chết + phần trong khối tài sản chung.
2. Người thừa kế không phụ thuộc vào nội dung di chúc (Điều 644):
   - Đối tượng: Cha mẹ, vợ chồng, con chưa thành niên, con đã thành niên mất khả năng lao động.
   - Suất hưởng: Được hưởng ít nhất bằng 2/3 của một suất thừa kế theo pháp luật (nếu di sản chia theo pháp luật).
3. Hàng thừa kế theo pháp luật (Điều 651):
   - Hàng 1: Vợ, chồng, cha đẻ, mẹ đẻ, cha nuôi, mẹ nuôi, con đẻ, con nuôi.
   - Hàng 2: Ông bà nội ngoại, anh chị em ruột, cháu ruột (mà người chết là ông bà).
   - Hàng 3: Cụ nội ngoại, bác chú cậu cô dì ruột, cháu ruột, chắt ruột.
4. Thừa kế thế vị (Điều 652): Con của người để lại di sản chết trước/cùng thời điểm thì cháu thế vị; cháu chết thì chắt thế vị.`
    },

    // =========================================================================
    // CHƯƠNG 7: MỘT SỐ NỘI DUNG CƠ BẢN CỦA LUẬT HÌNH SỰ (tr. 148 - 180)
    // =========================================================================
    {
      chapterNumber: 7,
      chapterTitle: 'Chương 7: Một số nội dung cơ bản của Luật Hình sự',
      sectionCode: '7.1',
      sectionTitle: 'Khái niệm, Đối tượng và Phương pháp điều chỉnh, Các nguyên tắc cơ bản và Nguồn của Luật Hình sự',
      pageRange: 'tr. 148 - 159',
      keywords: [
        'luật hình sự',
        'khái niệm luật hình sự',
        'đối tượng điều chỉnh luật hình sự',
        'phương pháp điều chỉnh luật hình sự',
        'nguyên tắc của luật hình sự',
        'nguyên tắc pháp lý cơ bản của luật hình sự',
        'nguyên tắc pháp chế',
        'nguồn của luật hình sự',
        'nguồn pháp luật hình sự',
        'nguồn luật hình sự việt nam'
      ],
      summary: 'Khái niệm Luật Hình sự, đối tượng điều chỉnh giữa Nhà nước và người phạm tội, phương pháp mệnh lệnh - quyền uy nghiêm ngặt; 6 nguyên tắc cơ bản; các nguồn của Luật Hình sự (Hiến pháp 2013, BLHS 2015 sửa đổi 2017, Án lệ).',
      legalBasis: [
        'Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam năm 2013 (Điều 14, 19, 31)',
        'Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017) Điều 1, 2, 3, 8',
        'Giáo trình Pháp luật đại cương (ĐH Thương mại 2021, tr. 148 - 159)'
      ],
      baremContent: `I. KHÁI NIỆM, ĐỐI TƯỢNG VÀ PHƯƠNG PHÁP ĐIỀU CHỈNH CỦA LUẬT HÌNH SỰ:
1. Khái niệm Luật Hình sự:
   - Luật Hình sự là một ngành luật độc lập trong hệ thống pháp luật Việt Nam, bao gồm hệ thống các quy phạm pháp luật do Nhà nước ban hành, xác định những hành vi nguy hiểm cho xã hội nào là tội phạm, đồng thời quy định các loại và biện pháp hình phạt, biện pháp tư pháp áp dụng đối với người hoặc pháp nhân thương mại thực hiện tội phạm đó.
2. Đối tượng điều chỉnh của Luật Hình sự:
   - Là các quan hệ xã hội phát sinh giữa Nhà nước (thông qua cơ quan tiến hành tố tụng: Cơ quan điều tra, Viện kiểm sát, Tòa án) và người phạm tội (hoặc pháp nhân thương mại phạm tội) khi có hành vi phạm tội xảy ra trên thực tế.
   - Vị thế các bên trong quan hệ:
     + Nhà nước có quyền và nghĩa vụ truy tố, xét xử, áp dụng hình phạt và các biện pháp cưỡng chế hình sự tương xứng đối với chủ thể phạm tội.
     + Người/pháp nhân phạm tội có nghĩa vụ chấp hành sự cưỡng chế và hình phạt do Tòa án tuyên, đồng thời được pháp luật bảo đảm các quyền tố tụng chính đáng (quyền bào chữa, suy đoán vô tội).
3. Phương pháp điều chỉnh của Luật Hình sự:
   - Sử dụng **phương pháp quyền uy - mệnh lệnh (phục tùng)** mang tính cưỡng chế nhà nước nghiêm ngặt và triệt để nhất. Nhà nước đơn phương quy định tội danh và mức hình phạt trong Bộ luật Hình sự, các chủ thể bắt buộc phải phục tùng mà không có sự bình đẳng, thỏa thuận như trong luật dân sự.

II. CÁC NGUYÊN TẮC PHÁP LÝ CƠ BẢN CỦA LUẬT HÌNH SỰ VIỆT NAM (ĐIỀU 2, 3 BLHS 2015):
1. Nguyên tắc pháp chế XHCN: "Không có tội phạm, không có hình phạt nếu luật không quy định" (Nullum crimen, nulla poena sine lege). Chỉ hành vi nào được quy định trong Bộ luật Hình sự mới cấu thành tội phạm và chỉ được áp dụng các hình phạt do BLHS quy định.
2. Nguyên tắc bình đẳng trước pháp luật: Mọi người phạm tội đều bình đẳng trước pháp luật hình sự, không phân biệt giới tính, dân tộc, tín ngưỡng, tôn giáo, thành phần, địa vị xã hội.
3. Nguyên tắc nhân đạo XHCN: Khoan hồng đối với người tự thú, đầu thú, thành khẩn khai báo, ăn năn hối cải, lập công chuộc tội; không áp dụng tử hình đối với người dưới 18 tuổi, phụ nữ có thai/nuôi con nhỏ dưới 36 tháng, người từ đủ 75 tuổi trở lên khi phạm tội hoặc khi xét xử.
4. Nguyên tắc có lỗi: Chỉ truy cứu trách nhiệm hình sự đối với người thực hiện hành vi nguy hiểm cho xã hội khi họ có lỗi (cố ý hoặc vô ý). Không truy cứu trách nhiệm hình sự khi có sự kiện bất ngờ.
5. Nguyên tắc kết hợp giữa trừng trị nghiêm khắc và khoan hồng, giáo dục, cải tạo: Nghiêm trị kẻ chủ mưu, cầm đầu, tái phạm nguy hiểm; đồng thời lấy việc cảm hóa, giáo dục, hoàn lương làm mục tiêu hàng đầu.
6. Nguyên tắc phân hóa và cá thể hóa trách nhiệm hình sự: Tòa án căn cứ vào tính chất, mức độ nguy hiểm của hành vi, nhân thân người phạm tội, các tình tiết giảm nhẹ và tăng nặng để quyết định một hình phạt thích đáng đối với từng cá nhân cụ thể.

III. NGUỒN CỦA PHÁP LUẬT HÌNH SỰ Ở VIỆT NAM HIỆN NAY:
1. Hiến pháp năm 2013: Là đạo luật gốc có giá trị pháp lý cao nhất, quy định các quyền con người bất khả xâm phạm và nguyên tắc tư pháp tối cao (nguyên tắc suy đoán vô tội tại Điều 31).
2. Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017): Là nguồn **cơ bản, chủ yếu và trực tiếp duy nhất** quy định về tội phạm và hình phạt tại Việt Nam.
3. Án lệ của Hội đồng Thẩm phán TAND Tối cao: Các bản án, quyết định hình sự có tính chuẩn mực được công bố để các Tòa án nghiên cứu, áp dụng thống nhất trong xét xử các vụ việc tương tự.
4. Các Nghị quyết của Hội đồng Thẩm phán TAND Tối cao: Văn bản hướng dẫn áp dụng thống nhất các quy định của Bộ luật Hình sự trong thực tiễn xét xử.`
    },
    {
      chapterNumber: 7,
      chapterTitle: 'Chương 7: Một số nội dung cơ bản của Luật Hình sự',
      sectionCode: '7.2',
      sectionTitle: 'Khái niệm tội phạm và Bốn yếu tố cấu thành tội phạm',
      pageRange: 'tr. 165 - 175',
      keywords: ['tội phạm', 'khái niệm tội phạm', 'cấu thành tội phạm', 'dấu hiệu tội phạm', 'mặt khách quan tội phạm', 'mặt chủ quan tội phạm', 'chủ thể tội phạm', 'khách thể tội phạm', 'điều 8 blhs', 'phân loại tội phạm'],
      summary: 'Khái niệm tội phạm theo Điều 8 BLHS 2015, phân loại 4 mức độ tội phạm và phân tích chi tiết 4 yếu tố cấu thành tội phạm trong luật hình sự.',
      legalBasis: ['Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017) - Điều 8, Điều 9, Điều 10, Điều 11, Điều 12'],
      baremContent: `I. KHÁI NIỆM VÀ ĐẶC ĐIỂM CỦA TỘI PHẠM (ĐIỀU 8 BLHS 2015):
Tội phạm là hành vi nguy hiểm cho xã hội được quy định trong Bộ luật hình sự, do người có năng lực trách nhiệm hình sự hoặc pháp nhân thương mại thực hiện một cách có lỗi, cố ý hoặc vô ý, xâm phạm độc lập, chủ quyền, thống nhất, toàn vẹn lãnh thổ Tổ quốc, xâm phạm chế độ chính trị, chế độ kinh tế, trật tự, an toàn xã hội, tính mạng, sức khỏe, danh dự, nhân phẩm của công dân.
- Phân loại tội phạm (Điều 9 BLHS): Tội phạm ít nghiêm trọng (phạt tù đến 3 năm); Tội phạm nghiêm trọng (từ trên 3 năm đến 7 năm); Tội phạm rất nghiêm trọng (từ trên 7 năm đến 15 năm); Tội phạm đặc biệt nghiêm trọng (từ trên 15 năm đến 20 năm, tù chung thân hoặc tử hình).

II. BỐN YẾU TỐ CẤU THÀNH TỘI PHẠM:
1. Khách thể của tội phạm: Là quan hệ xã hội được luật hình sự bảo vệ và bị tội phạm xâm hại hoặc đe dọa xâm hại gây thiệt hại.
2. Mặt khách quan của tội phạm: Gồm hành vi nguy hiểm cho xã hội (hành động phạm tội hoặc không hành động phạm tội), hậu quả nguy hại cho xã hội, mối quan hệ nhân quả giữa hành vi và hậu quả, cùng điều kiện thời gian, địa điểm, phương tiện phạm tội.
3. Mặt chủ quan của tội phạm: Trạng thái tâm lý bên trong của chủ thể khi thực hiện hành vi phạm tội gồm:
- Lỗi: Lỗi cố ý trực tiếp, Lỗi cố ý gián tiếp, Lỗi vô ý do quá tự tin, Lỗi vô ý do cẩu thả.
- Động cơ và Mục đích phạm tội (dấu hiệu bắt buộc trong một số cấu thành tội phạm cụ thể).
4. Chủ thể của tội phạm: Cá nhân có năng lực trách nhiệm hình sự và đạt độ tuổi luật định (từ đủ 16 tuổi chịu TNHS về mọi tội phạm; từ đủ 14 đến dưới 16 tuổi chịu TNHS về tội rất nghiêm trọng, đặc biệt nghiêm trọng do cố ý theo Điều 12 BLHS) hoặc pháp nhân thương mại phạm tội theo luật định.`
    },
    {
      chapterNumber: 7,
      chapterTitle: 'Chương 7: Một số nội dung cơ bản của Luật Hình sự',
      sectionCode: '7.2_7.3',
      sectionTitle: 'Tội phạm, Đồng phạm, Phòng vệ chính đáng, Tình thế cấp thiết và Hệ thống hình phạt',
      pageRange: 'tr. 160 - 180',
      keywords: ['tội phạm điều 8', 'phân loại tội phạm điều 9', 'đồng phạm điều 17', 'phòng vệ chính đáng điều 22', 'tình thế cấp thiết điều 23', 'hệ thống hình phạt điều 32', 'tử hình điều 40'],
      summary: 'Khái niệm tội phạm, 4 phân loại, đồng phạm (4 loại người), so sánh phòng vệ chính đáng vs tình thế cấp thiết, hệ thống 7 hình phạt chính & 7 hình phạt bổ sung.',
      legalBasis: ['Bộ luật Hình sự năm 2015 (sửa đổi 2017) Điều 8, 9, 12, 17, 22, 23, 30, 32, 40'],
      baremContent: `I. TỘI PHẠM VÀ ĐỒNG PHẠM (BLHS 2015):
- Tội phạm (Điều 8): Hành vi nguy hiểm cao độ cho xã hội, trái pháp luật hình sự, có lỗi và phải chịu trách nhiệm hình sự. Phân thành 4 loại (Điều 9): Ít nghiêm trọng (đến 3 năm tù), Nghiêm trọng (3-7 năm), Rất nghiêm trọng (7-15 năm), Đặc biệt nghiêm trọng (15-20 năm, tù chung thân, tử hình).
- Đồng phạm (Điều 17): Hai người trở lên cùng cố ý thực hiện tội phạm. Gồm 4 vai trò: Người thực hành (trực tiếp), Người tổ chức (chủ mưu, cầm đầu), Người xúi giục (kích động), Người giúp sức (tạo điều kiện vật chất/tinh thần).

II. PHÂN BIỆT PHÒNG VỆ CHÍNH ĐÁNG VÀ TÌNH THẾ CẤP THIẾT:
1. Phòng vệ chính đáng (Điều 22):
   - Nguồn gốc nguy hiểm: Do hành vi tấn công trái pháp luật của con người.
   - Đối tượng tác động: Gây thiệt hại cho chính kẻ đang tấn công.
   - Yêu cầu thiệt hại: Chống trả một cách cần thiết (thiệt hại gây ra có thể lớn hơn hoặc bằng thiệt hại bị đe dọa). Không phải bồi thường dân sự.
2. Tình thế cấp thiết (Điều 23):
   - Nguồn gốc nguy hiểm: Do thiên tai, súc vật, sự cố máy móc hoặc con người gây ra.
   - Đối tượng tác động: Gây thiệt hại cho quyền, lợi ích hợp pháp của người thứ ba vô tội.
   - Yêu cầu thiệt hại: Thiệt hại gây ra bắt buộc phải NHỎ HƠN thiệt hại cần ngăn ngừa. Phải bồi thường thiệt hại dân sự theo Điều 595 BLDS 2015.

III. HỆ THỐNG HÌNH PHẠT ĐỐI VỚI CÁ NHÂN (ĐIỀU 32 BLHS 2015):
- 7 Hình phạt chính: Cảnh cáo, Phạt tiền, Cải tạo không giam giữ, Trục xuất, Tù có thời hạn, Tù chung thân, Tử hình (Điều 40: không áp dụng tử hình đối với người dưới 18 tuổi, phụ nữ có thai/nuôi con nhỏ dưới 36 tháng, người đủ 75 tuổi trở lên).
- 7 Hình phạt bổ sung: Cấm đảm nhiệm chức vụ, Cấm cư trú, Quản chế, Tước quyền công dân, Tịch thu tài sản, Phạt tiền, Trục xuất.`
    },

    // =========================================================================
    // CHƯƠNG 8: MỘT SỐ NỘI DUNG CƠ BẢN CỦA LUẬT HÀNH CHÍNH (tr. 181 - 201)
    // =========================================================================
    {
      chapterNumber: 8,
      chapterTitle: 'Chương 8: Một số nội dung cơ bản của Luật Hành chính',
      sectionCode: '8.1_8.3',
      sectionTitle: 'Quản lý hành chính nhà nước, Vi phạm hành chính và Xử phạt VPHC',
      pageRange: 'tr. 181 - 201',
      keywords: ['luật hành chính', 'quản lý hành chính', 'phương pháp quyền uy', 'quan hệ hành chính dọc ngang', 'vi phạm hành chính', 'xử phạt vphc', 'biện pháp ngăn chặn điều 119'],
      summary: 'Quản lý hành chính nhà nước, phương pháp mệnh lệnh đơn phương; định nghĩa vi phạm hành chính, các hình thức xử phạt và biện pháp ngăn chặn Điều 119 Luật XLVPHC 2012.',
      legalBasis: ['Luật Xử lý vi phạm hành chính năm 2012 (sửa đổi 2020) Điều 2, 21, 119'],
      baremContent: `I. ĐẶC TRƯNG CỦA LUẬT HÀNH CHÍNH:
1. Đối tượng điều chỉnh: Các quan hệ xã hội phát sinh trong hoạt động chấp hành và điều hành của các cơ quan quản lý nhà nước (quan hệ dọc giữa cấp trên - cấp dưới; quan hệ ngang giữa các cơ quan cùng cấp; quan hệ giữa cơ quan nhà nước với cá nhân, tổ chức).
2. Phương pháp điều chỉnh: Phương pháp mệnh lệnh đơn phương (Quyền uy - phục tùng). Cơ quan nhà nước nhân danh quyền lực công ra quyết định bắt buộc đối tượng quản lý phải phục tùng.

II. VI PHẠM HÀNH CHÍNH VÀ XỬ PHẠT (LUẬT XLVPHC 2012):
1. Định nghĩa (Khoản 1 Điều 2): Là hành vi có lỗi do cá nhân, tổ chức thực hiện, vi phạm quy định của pháp luật về quản lý nhà nước mà không phải là tội phạm và theo quy định của pháp luật phải bị xử phạt vi phạm hành chính.
2. Các hình thức xử phạt (Điều 21):
   - Cảnh cáo; Phạt tiền;
   - Tước quyền sử dụng giấy phép, chứng chỉ hành nghề có thời hạn;
   - Tịch thu tang vật, phương tiện vi phạm hành chính; Trục xuất.
3. Các biện pháp ngăn chặn và bảo đảm xử phạt (Điều 119):
   - Tạm giữ người theo thủ tục hành chính, áp giải người vi phạm;
   - Tạm giữ tang vật, phương tiện; Khám người, khám phương tiện, nơi cất giấu tang vật.`
    },

    // =========================================================================
    // CHƯƠNG 9: PHÁP LUẬT VỀ PHÒNG, CHỐNG THAM NHŨNG (tr. 202 - 229)
    // =========================================================================
    {
      chapterNumber: 9,
      chapterTitle: 'Chương 9: Một số nội dung cơ bản của pháp luật về Phòng, chống tham nhũng',
      sectionCode: '9.1_9.2',
      sectionTitle: 'Khái niệm, Dấu hiệu tham nhũng, 12 Hành vi tham nhũng và Các biện pháp phòng ngừa',
      pageRange: 'tr. 202 - 229',
      keywords: ['phòng chống tham nhũng', 'tham nhũng là gì', '3 dấu hiệu tham nhũng', '12 hành vi tham nhũng', 'biện pháp phòng ngừa tham nhũng', 'kê khai tài sản', 'minh bạch'],
      summary: 'Khái niệm tham nhũng 3 dấu hiệu (chủ thể, hành vi, mục đích), 12 hành vi tham nhũng luật định và 6 biện pháp phòng ngừa tham nhũng căn cơ.',
      legalBasis: ['Luật Phòng, chống tham nhũng năm 2018 (và các quy định sửa đổi)', 'Bộ luật Hình sự 2015 (Điều 352-366)'],
      baremContent: `I. KHÁI NIỆM VÀ 3 DẤU HIỆU CƠ BẢN CỦA THAM NHŨNG:
- Khái niệm: Tham nhũng là hành vi của người có chức vụ, quyền hạn đã lợi dụng chức vụ, quyền hạn đó vì vụ lợi.
- Ba dấu hiệu pháp lý bắt buộc:
  1. Chủ thể: Phải là người có chức vụ, quyền hạn (do bổ nhiệm, bầu cử, hợp đồng hoặc giao nhiệm vụ công vụ theo Điều 352 BLHS).
  2. Hành vi: Lợi dụng chức vụ, quyền hạn được giao làm phương tiện để thực hiện hành vi trái pháp luật.
  3. Mục đích: Bắt buộc phải có động cơ VỤ LỢI (vụ lợi vật chất như tiền, tài sản hoặc vụ lợi phi vật chất như danh tiếng, địa vị).

II. CÁC HÀNH VI THAM NHŨNG ĐIỂN HÌNH:
Tham ô tài sản; Nhận hối lộ; Lạm dụng chức vụ quyền hạn chiếm đoạt tài sản; Lạm quyền trong khi thi hành công vụ; Lợi dụng chức vụ quyền hạn gây ảnh hưởng với người khác để trục lợi; Giả mạo trong công tác; Nhũng nhiễu vì vụ lợi; Không thực hiện công vụ vì vụ lợi...

III. CÁC BIỆN PHÁP PHÒNG NGỪA THAM NHŨNG CĂN CƠ:
1. Công khai, minh bạch trong hoạt động của cơ quan, tổ chức, đơn vị (mua sắm công, tài chính, dự án, đất đai).
2. Xây dựng và thực hiện nghiêm ngặt các chế độ, định mức, tiêu chuẩn.
3. Quy tắc ứng xử, đạo đức nghề nghiệp và chuyển đổi vị trí công tác định kỳ đối với cán bộ, công chức làm ở vị trí nhạy cảm.
4. Minh bạch tài sản, thu nhập: Kê khai tài sản hàng năm của bản thân, vợ/chồng, con chưa thành niên và giải trình nguồn gốc tài sản tăng thêm.
5. Đề cao trách nhiệm và xử lý nghiêm trách nhiệm của người đứng đầu khi để xảy ra tham nhũng trong cơ quan.
6. Cải cách hành chính, đổi mới công nghệ quản lý và thanh toán không dùng tiền mặt qua hệ thống ngân hàng.`
    }
  ];

  /**
   * Chuẩn hóa truy vấn người dùng
   */
  private static normalizeWords(text: string): string[] {
    return (text || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);
  }

  /**
   * =========================================================================
   * MỤC 2.2.1: MÃ HÓA VĂN BẢN (VECTOR EMBEDDING / VECTOR SPACE) & INDEXING
   * Tài liệu giáo trình được chia thành các khối (chunks), tính toán độ dài,
   * tần suất từ TF, nghịch đảo tần suất tài liệu IDF và sinh vector TF-IDF.
   * =========================================================================
   */
  private static isIndexed = false;
  private static chunkTokens: string[][] = [];
  private static chunkTermFreqs: Map<string, number>[] = [];
  private static chunkDocLengths: number[] = [];
  private static avgDocLength = 0;
  private static docFreq: Map<string, number> = new Map();
  private static idfMap: Map<string, number> = new Map();
  private static chunkTfidfVectors: Map<string, number>[] = [];
  private static chunkVectorNorms: number[] = [];

  private static buildIndex(): void {
    if (this.isIndexed) return;
    const N = this.CHUNKS.length;
    let totalLen = 0;

    this.chunkTokens = this.CHUNKS.map((c) => {
      const fullText = `${c.chapterTitle} ${c.sectionTitle} ${c.keywords.join(' ')} ${c.summary} ${c.baremContent}`;
      return this.normalizeWords(fullText);
    });

    this.chunkDocLengths = this.chunkTokens.map((tokens) => tokens.length);
    totalLen = this.chunkDocLengths.reduce((acc, len) => acc + len, 0);
    this.avgDocLength = totalLen / Math.max(N, 1);

    this.docFreq = new Map();
    this.chunkTermFreqs = this.chunkTokens.map((tokens) => {
      const tf = new Map<string, number>();
      const seen = new Set<string>();
      for (const t of tokens) {
        tf.set(t, (tf.get(t) || 0) + 1);
        if (!seen.has(t)) {
          seen.add(t);
          this.docFreq.set(t, (this.docFreq.get(t) || 0) + 1);
        }
      }
      return tf;
    });

    // Tính toán IDF theo chuẩn Okapi BM25
    this.idfMap = new Map();
    this.docFreq.forEach((df, term) => {
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      this.idfMap.set(term, Math.max(idf, 0.1));
    });

    // Xây dựng Vector TF-IDF chuẩn hóa phục vụ Cosine Similarity
    this.chunkTfidfVectors = this.chunkTermFreqs.map((tfMap) => {
      const vec = new Map<string, number>();
      let sumSq = 0;
      tfMap.forEach((count, term) => {
        const idf = this.idfMap.get(term) || 0.1;
        const weight = (1 + Math.log(count)) * idf;
        vec.set(term, weight);
        sumSq += weight * weight;
      });
      return vec;
    });

    this.chunkVectorNorms = this.chunkTfidfVectors.map((vec) => {
      let sumSq = 0;
      vec.forEach((w) => {
        sumSq += w * w;
      });
      return Math.sqrt(sumSq) || 1;
    });

    this.isIndexed = true;
  }

  /**
   * MỤC 2.2.2: ĐỘ TƯƠNG TỰ COSIN (Cosine similarity)
   * Tính góc cosin giữa vector truy vấn Q và vector đoạn văn bản D trong không gian nhiều chiều.
   */
  private static computeCosineSimilarity(qVec: Map<string, number>, qNorm: number, chunkIdx: number): number {
    if (qNorm === 0) return 0;
    const dVec = this.chunkTfidfVectors[chunkIdx];
    const dNorm = this.chunkVectorNorms[chunkIdx];
    if (!dVec || dNorm === 0) return 0;

    let dot = 0;
    qVec.forEach((qWeight, term) => {
      const dWeight = dVec.get(term);
      if (dWeight) {
        dot += qWeight * dWeight;
      }
    });

    return dot / (qNorm * dNorm);
  }

  /**
   * MỤC 2.2.2: PHƯƠNG PHÁP BM25 (Okapi BM25)
   * Thuật toán xác suất tính độ liên quan dựa trên tần suất từ, độ dài đoạn văn và tính bão hòa.
   */
  private static computeBm25(qMeaningful: string[], chunkIdx: number): number {
    const k1 = 1.5;
    const b = 0.75;
    const tfMap = this.chunkTermFreqs[chunkIdx];
    const docLen = this.chunkDocLengths[chunkIdx];
    if (!tfMap || docLen === 0) return 0;

    let bm25Score = 0;
    for (const term of qMeaningful) {
      const tf = tfMap.get(term) || 0;
      if (tf > 0) {
        const idf = this.idfMap.get(term) || 0.1;
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * (1 - b + b * (docLen / this.avgDocLength));
        bm25Score += idf * (numerator / denominator);
      }
    }
    return bm25Score;
  }


  /**
   * =========================================================================
   * BƯỚC 1 TRONG INFOGRAPHIC: QUERY REWRITE & EXPANSION (CẦU NỐI LỆCH NGÔN NGỮ)
   * Khắc phục lỗi: Người dùng hỏi ngôn ngữ đời thường vs Giáo trình viết thuật ngữ pháp lý.
   * Tự động viết lại và mở rộng câu hỏi với các thuật ngữ khoa học pháp lý tương ứng.
   * =========================================================================
   */
  public static rewriteAndExpandQuery(query: string): string {
    const qLower = query.toLowerCase();
    const additions: string[] = [];

    // 1. Nhóm thực hiện pháp luật (Hành động / Không hành động)
    if (
      qLower.includes('thực hiện pháp luật') ||
      qLower.includes('tuân thủ') ||
      qLower.includes('thi hành') ||
      qLower.includes('áp dụng pháp luật')
    ) {
      additions.push(
        'bốn hình thức thực hiện pháp luật tuân thủ pháp luật chấp hành pháp luật sử dụng pháp luật áp dụng pháp luật hành vi hành động không hành động'
      );
    }

    // 2. Nhóm văn bản cơ quan nhà nước ban hành
    if (
      (qLower.includes('văn bản') || qLower.includes('quyết định') || qLower.includes('chỉ thị')) &&
      (qLower.includes('cơ quan nhà nước') || qLower.includes('ubnd') || qLower.includes('ban hành'))
    ) {
      additions.push(
        'văn bản quy phạm pháp luật văn bản áp dụng pháp luật văn bản cá biệt văn bản hành chính thông thường luật ban hành văn bản 2015'
      );
    }

    // 3. Nhóm đa vi phạm (vừa hình sự vừa hành chính)
    if (
      (qLower.includes('hình sự') && qLower.includes('hành chính')) ||
      qLower.includes('vi phạm pháp luật')
    ) {
      additions.push(
        'vi phạm hình sự tội phạm vi phạm hành chính xử phạt vi phạm hành chính 4 loại vi phạm pháp luật và trách nhiệm pháp lý tương ứng'
      );
    }

    // 4. Nhóm ném đá, chống cảnh sát giao thông, tấn công người thi hành công vụ
    if (
      qLower.includes('ném đá') ||
      qLower.includes('gạch đá') ||
      qLower.includes('cảnh sát') ||
      qLower.includes('csgt') ||
      qLower.includes('đánh võng')
    ) {
      additions.push(
        'tội chống người thi hành công vụ điều 330 BLHS tội cố ý gây thương tích điều 134 BLHS khách thể trật tự quản lý hành chính'
      );
    }

    // 5. Nhóm xả thải, ô nhiễm môi trường
    if (
      qLower.includes('xả thải') ||
      qLower.includes('sông bưởi') ||
      qLower.includes('ô nhiễm') ||
      qLower.includes('nhà máy đường')
    ) {
      additions.push(
        'bồi thường thiệt hại ngoài hợp đồng điều 584 BLDS bồi thường thiệt hại do ô nhiễm môi trường trách nhiệm hành chính và dân sự'
      );
    }

    // 6. Nhóm mượn tài sản, làm rơi vỡ, bất khả kháng
    if (
      qLower.includes('mượn') &&
      (qLower.includes('hỏng') || qLower.includes('rơi') || qLower.includes('vỡ') || qLower.includes('laptop'))
    ) {
      additions.push(
        'hợp đồng mượn tài sản nghĩa vụ bên mượn điều 496 BLDS bồi thường thiệt hại ngoài hợp đồng sự kiện bất khả kháng điều 156 BLDS'
      );
    }

    // 7. Nhóm vay tiền, quỵt nợ
    if (
      qLower.includes('vay') &&
      (qLower.includes('tiền') || qLower.includes('triệu') || qLower.includes('hợp đồng'))
    ) {
      additions.push(
        'hợp đồng vay tài sản điều 463 BLDS nghĩa vụ trả nợ điều 466 BLDS lãi suất chậm trả điều 357 điều kiện có hiệu lực điều 117'
      );
    }

    // 8. Nhóm chia thừa kế, di chúc
    if (
      qLower.includes('thừa kế') ||
      qLower.includes('di chúc') ||
      qLower.includes('di sản')
    ) {
      additions.push(
        'thừa kế theo pháp luật hàng thừa kế thứ nhất điều 651 BLDS di sản thừa kế điều 612 thừa kế không phụ thuộc nội dung di chúc điều 644'
      );
    }

    // 9. Nhóm cấu trúc quy phạm pháp luật
    if (
      qLower.includes('quy phạm pháp luật') &&
      (qLower.includes('cấu trúc') || qLower.includes('cơ cấu') || qLower.includes('bộ phận') || qLower.includes('giả định'))
    ) {
      additions.push('cơ cấu 3 bộ phận quy phạm pháp luật bộ phận giả định bộ phận quy định bộ phận chế tài');
    }

    return additions.length > 0 ? `${query} ${additions.join(' ')}` : query;
  }

  /**
   * =========================================================================
   * BƯỚC 2 & 4 TRONG INFOGRAPHIC: TWO-STAGE RETRIEVAL VỚI CROSS-RERANKER
   * Stage 1: Coarse Hybrid Retrieval (BM25 + Semantic Keywords) với Query Expansion
   * Stage 2: Reranker tính điểm đối sánh ngữ nghĩa chuyên sâu và đẩy chunk chuẩn lên Top 1
   * =========================================================================
   */
  public static searchTopChunks(query: string, topK: number = 2): { chunk: TextbookChunk; score: number }[] {
    const expandedQuery = this.rewriteAndExpandQuery(query);
    const STOP_WORDS = new Set([
      'nhà', 'nước', 'pháp', 'luật', 'của', 'và', 'là', 'trong', 'các', 'cho',
      'với', 'theo', 'về', 'khi', 'này', 'đó', 'thì', 'ở', 'đến', 'từ', 'những',
      'được', 'sau', 'đúng', 'hay', 'sai', 'mọi', 'đều', 'cho', 'biết', 'nhận', 'định'
    ]);

    const qWords = this.normalizeWords(expandedQuery);
    if (qWords.length === 0) return [];
    const qMeaningful = qWords.filter((w) => !STOP_WORDS.has(w));
    const qText = expandedQuery.toLowerCase();
    const rawQueryText = query.toLowerCase();

    // Khởi tạo chỉ mục Vector & BM25 nếu chưa nạp (Mục 2.2: Indexing)
    this.buildIndex();

    // Sinh Vector truy vấn cho Cosine Similarity (Mục 2.2.1 & 2.2.2)
    const qTf = new Map<string, number>();
    for (const t of qMeaningful) {
      qTf.set(t, (qTf.get(t) || 0) + 1);
    }
    const qVec = new Map<string, number>();
    let qSumSq = 0;
    qTf.forEach((count, term) => {
      const idf = this.idfMap.get(term) || 0.5;
      const w = (1 + Math.log(count)) * idf;
      qVec.set(term, w);
      qSumSq += w * w;
    });
    const qNorm = Math.sqrt(qSumSq) || 1;

    // =========================================================================
    // MỤC 2.2.2: TRÍCH XUẤT ĐOẠN VĂN (PASSAGE RETRIEVAL) KẾT HỢP BM25 + COSINE SIMILARITY
    // =========================================================================
    const candidates = this.CHUNKS.map((chunk, idx) => {
      // 1. Điểm BM25 (xác suất theo tần suất từ và độ dài tài liệu)
      const bm25Score = this.computeBm25(qMeaningful, idx);

      // 2. Điểm Cosine Similarity (góc tương đồng giữa 2 vector TF-IDF)
      const cosineScore = this.computeCosineSimilarity(qVec, qNorm, idx);

      // 3. Khớp từ khóa chủ đề (Keywords boost)
      let kwScore = 0;
      for (const kw of chunk.keywords) {
        if (qText.includes(kw)) {
          kwScore += 25;
        } else {
          const kwWords = kw.split(' ');
          const kwMeaningful = kwWords.filter((w) => !STOP_WORDS.has(w));
          if (kwMeaningful.length > 0) {
            const matchCount = kwMeaningful.filter((w) => qMeaningful.includes(w)).length;
            if (matchCount === kwMeaningful.length) {
              kwScore += 14;
            } else if (kwMeaningful.length >= 3 && matchCount / kwMeaningful.length >= 0.75) {
              kwScore += 7;
            }
          }
        }
      }

      // 4. Khớp số chương nếu người dùng ghi rõ
      let chapterScore = 0;
      if (qText.includes(`chương ${chunk.chapterNumber}`) || qText.includes(`chương ${chunk.chapterNumber}:`)) {
        chapterScore += 30;
      }

      // Hợp nhất điểm Retrieval sơ bộ (Hybrid Retrieval)
      const score = (bm25Score * 2.5) + (cosineScore * 35) + kwScore + chapterScore;

      return { chunk, score, bm25Score, cosineScore };
    });

    // STAGE 2: RERANKER (Sắp xếp lại candidate theo độ liên quan mục tiêu)
    const reranked = candidates.map((item) => {
      let finalScore = item.score;
      const c = item.chunk;

      // Ưu tiên đặc biệt theo trọng tâm câu hỏi thực tế của người dùng:
      // A. Nếu hỏi về "văn bản", "văn bản quy phạm pháp luật", "văn bản do cơ quan nhà nước ban hành" -> Ưu tiên Chương 2 (Hệ thống VBQPPL)
      if (
        (rawQueryText.includes('văn bản') || rawQueryText.includes('vbqppl')) &&
        (rawQueryText.includes('cơ quan nhà nước') || rawQueryText.includes('ban hành') || rawQueryText.includes('hình thức pháp luật'))
      ) {
        if (c.sectionCode.includes('2.3.1_2.3.3')) finalScore += 45;
      }

      // B. Nếu hỏi về "thực hiện pháp luật", "tuân thủ", "hành động", "không hành động" -> Ưu tiên Mục 3.2.1_3.2.2 (Bốn hình thức thực hiện pháp luật)
      if (
        rawQueryText.includes('thực hiện pháp luật') ||
        rawQueryText.includes('tuân thủ') ||
        rawQueryText.includes('chấp hành') ||
        rawQueryText.includes('áp dụng pháp luật')
      ) {
        if (c.sectionCode.includes('3.2.1_3.2.2')) finalScore += 50;
      }

      // C. Nếu hỏi về "vừa là hình sự vừa là hành chính" hoặc các loại vi phạm pháp luật -> Ưu tiên Mục 5.1_5.2 hoặc Chương 8 (Luật Hành chính)
      if (rawQueryText.includes('vi phạm hình sự') && rawQueryText.includes('vi phạm hành chính')) {
        if (c.sectionCode.includes('5.1_5.2') || c.sectionCode.includes('8.1_8.3')) finalScore += 35;
      }

      // D. Nếu hỏi về cấu trúc quy phạm pháp luật (Giả định - Quy định - Chế tài)
      if (
        rawQueryText.includes('quy phạm pháp luật') &&
        (rawQueryText.includes('cấu trúc') || rawQueryText.includes('bộ phận') || rawQueryText.includes('giả định') || rawQueryText.includes('chế tài'))
      ) {
        if (c.sectionCode.includes('3.1.1_3.1.2')) finalScore += 45;
      }

      // E. Phạt điểm nếu chunk nói về Nhà nước nhưng câu hỏi hoàn toàn về Hợp đồng Dân sự / Thừa kế
      if (
        (rawQueryText.includes('thừa kế') || rawQueryText.includes('hợp đồng') || rawQueryText.includes('vay tiền')) &&
        c.chapterNumber === 1
      ) {
        finalScore -= 30;
      }

      // F. Nếu hỏi về "hình thức pháp luật", "hình thức thể hiện của pháp luật", "hình thức của pháp luật", "đặc điểm pháp luật" -> Ưu tiên Chương 2, PHẠT NẶNG Chương 1 (Hình thức nhà nước)
      if (
        (rawQueryText.includes('hình thức') || rawQueryText.includes('đặc điểm') || rawQueryText.includes('đặc trưng')) &&
        rawQueryText.includes('pháp luật') &&
        !rawQueryText.includes('hình thức nhà nước') &&
        !rawQueryText.includes('chính thể') &&
        !rawQueryText.includes('cấu trúc nhà nước')
      ) {
        if (c.chapterNumber === 1) finalScore -= 40;
        if (c.chapterNumber === 2 && (c.sectionCode.includes('2.3.1_2.3.3') || c.sectionCode.includes('2.1.1_2.1.3'))) finalScore += 50;
      }

      // G. Nếu hỏi về "pháp luật xã hội chủ nghĩa", "pháp luật xhcn" -> Ưu tiên Mục 2.1.1_2.1.3 (Khái niệm, Bản chất và Đặc trưng của Pháp luật)
      if (
        rawQueryText.includes('pháp luật') &&
        (rawQueryText.includes('xã hội chủ nghĩa') || rawQueryText.includes('xhcn'))
      ) {
        if (c.chapterNumber === 1) finalScore -= 40;
        if (c.sectionCode.includes('2.1.1_2.1.3')) finalScore += 55;
      }

      return { chunk: c, score: finalScore };
    });

    return reranked
      .filter((item) => item.score > 8)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * Phân giải và định dạng chi tiết từng Căn cứ Pháp luật Thực định (Tên luật, Điều luật, Nội dung cốt lõi)
   */
  public static formatDetailedLaws(
    legalBases: string[],
    extraArticles: { lawName: string; articleNumber: number | string; title: string; contentRaw?: string }[] = []
  ): string {
    const lines: string[] = [];
    const addedKeys = new Set<string>();

    // 1. Xử lý các điều luật thực định cụ thể được truy xuất từ DB / RAG (nếu có)
    if (extraArticles && extraArticles.length > 0) {
      extraArticles.forEach((art) => {
        const key = `${art.lawName}_${art.articleNumber}`.toLowerCase();
        if (!addedKeys.has(key)) {
          addedKeys.add(key);
          const excerpt = art.contentRaw ? `\n    + *Nội dung quy định*: ${art.contentRaw.replace(/\n+/g, ' ').slice(0, 190)}...` : '';
          lines.push(`- ⚖️ **${art.lawName} — Điều ${art.articleNumber} (${art.title})**:${excerpt}`);
        }
      });
    }

    // 2. Xử lý và diễn giải chi tiết các căn cứ luật định từ Giáo trình (legalBasis)
    legalBases.forEach((basis) => {
      // Bỏ qua nếu là chuỗi tham chiếu nội bộ sách hoặc học thuyết
      if (basis.toLowerCase().includes('giáo trình pháp luật đại cương') || basis.toLowerCase().includes('học thuyết mác')) {
        return;
      }

      if (basis.includes('Hiến pháp 2013') || basis.includes('Hiến pháp năm 2013')) {
        const key = 'hp2013';
        if (!addedKeys.has(key)) {
          addedKeys.add(key);
          lines.push(`- ⚖️ **Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam năm 2013**:
  + *Điều 2*: Khẳng định Nhà nước CHXHCN Việt Nam là nhà nước pháp quyền XHCN của Nhân dân, do Nhân dân, vì Nhân dân; tất cả quyền lực nhà nước thuộc về Nhân dân.
  + *Điều 8*: Cơ quan nhà nước, cán bộ, công chức, viên chức phải tôn trọng Nhân dân, tận tụy phục vụ Nhân dân, liên hệ chặt chẽ với Nhân dân; thực hiện pháp luật nghiêm minh, quản lý xã hội bằng Hiến pháp và pháp luật.
  + *Điều 65*: Lực lượng vũ trang nhân dân tuyệt đối trung thành với Tổ quốc, Nhân dân, Đảng và Nhà nước; có nhiệm vụ bảo vệ độc lập, chủ quyền, an ninh quốc gia và trật tự, an toàn xã hội.`);
        }
        return;
      }

      if (basis.includes('Bộ luật Hình sự') || basis.includes('BLHS')) {
        const key = 'blhs2015';
        if (!addedKeys.has(key)) {
          addedKeys.add(key);
          lines.push(`- ⚖️ **Bộ luật Hình sự năm 2015 (sửa đổi, bổ sung năm 2017)**:
  + *Điều 8 (Khái niệm tội phạm)*: Hành vi nguy hiểm cho xã hội được quy định trong BLHS, do người có năng lực TNHS hoặc pháp nhân thương mại thực hiện một cách có lỗi.
  + *Điều 10 (Cố ý phạm tội)*: Phân định ranh giới lỗi Cố ý trực tiếp (thấy trước hậu quả và mong muốn hậu quả) và Lỗi cố ý gián tiếp (thấy trước hậu quả, không mong muốn nhưng để mặc hậu quả xảy ra).
  + *Điều 12 (Tuổi chịu trách nhiệm hình sự)*: Người từ đủ 16 tuổi trở lên chịu TNHS về mọi tội phạm; người từ đủ 14 đến dưới 16 tuổi chỉ chịu TNHS về tội phạm rất nghiêm trọng hoặc đặc biệt nghiêm trọng do cố ý luật định.
  + *Điều 134 (Tội cố ý gây thương tích)*: Tội cố ý gây thương tích hoặc gây tổn hại cho sức khỏe của người khác (tình tiết định khung khi phạm tội đối với người đang thi hành công vụ).
  + *Điều 330 (Tội chống người thi hành công vụ)*: Hành vi dùng vũ lực, đe dọa dùng vũ lực hoặc thủ đoạn khác cản trở người thi hành công vụ thực hiện công vụ.`);
        }
        return;
      }

      if (basis.includes('Bộ luật Dân sự') || basis.includes('BLDS')) {
        const key = 'blds2015';
        if (!addedKeys.has(key)) {
          addedKeys.add(key);
          lines.push(`- ⚖️ **Bộ luật Dân sự năm 2015**:
  + *Điều 16, 19, 20*: Quy định về Năng lực pháp luật dân sự, Năng lực hành vi dân sự và mốc từ đủ 18 tuổi trở lên là người thành niên có năng lực hành vi dân sự đầy đủ.
  + *Điều 74 (Điều kiện công nhận pháp nhân)*: Tổ chức được công nhận là pháp nhân khi có đủ 4 điều kiện (thành lập hợp pháp; cơ cấu tổ chức chặt chẽ; tài sản độc lập; nhân danh mình tham gia quan hệ pháp luật độc lập).
  + *Điều 117, Điều 122 - 133*: Quy định điều kiện có hiệu lực của giao dịch dân sự và các trường hợp giao dịch dân sự vô hiệu (do giả tạo, nhầm lẫn, lừa dối, đe dọa...).
  + *Điều 584, Điều 590*: Căn cứ phát sinh trách nhiệm bồi thường thiệt hại ngoài hợp đồng (người nào có hành vi xâm phạm tính mạng, sức khỏe, tài sản của người khác mà gây thiệt hại thì phải bồi thường) và xác định thiệt hại do sức khỏe bị xâm phạm.`);
        }
        return;
      }

      if (basis.includes('Ban hành văn bản') || basis.includes('VBQPPL')) {
        const key = 'vbqppl2015';
        if (!addedKeys.has(key)) {
          addedKeys.add(key);
          lines.push(`- ⚖️ **Luật Ban hành văn bản quy phạm pháp luật năm 2015 (sửa đổi, bổ sung năm 2020)**:
  + *Điều 4 (Hệ thống văn bản QPPL)*: Quy định thứ bậc hiệu lực pháp lý từ Hiến pháp, Bộ luật, Luật, Nghị quyết của Quốc hội đến Pháp lệnh, Lệnh, Quyết định, Nghị định, Thông tư.
  + *Điều 156 (Áp dụng văn bản QPPL)*: Nguyên tắc ưu tiên áp dụng văn bản có hiệu lực pháp lý cao hơn; áp dụng văn bản ban hành sau của cùng một cơ quan; ưu tiên áp dụng Điều ước quốc tế mà Việt Nam là thành viên.`);
        }
        return;
      }

      if (basis.includes('Xử lý vi phạm hành chính') || basis.includes('XLVPHC')) {
        const key = 'xlvphc2012';
        if (!addedKeys.has(key)) {
          addedKeys.add(key);
          lines.push(`- ⚖️ **Luật Xử lý vi phạm hành chính năm 2012 (sửa đổi, bổ sung năm 2020)**:
  + *Điều 2 (Khái niệm vi phạm hành chính)*: Hành vi có lỗi do cá nhân, tổ chức thực hiện, vi phạm quy định pháp luật về quản lý nhà nước mà không phải là tội phạm.
  + *Điều 21 (Các hình thức xử phạt)*: Cảnh cáo, Phạt tiền, Tước quyền sử dụng giấy phép, chứng chỉ hành nghề, Tịch thu tang vật, phương tiện vi phạm hành chính.
  + *Điều 119*: Các biện pháp ngăn chặn và bảo đảm xử lý vi phạm hành chính (tạm giữ người, áp giải người vi phạm, tạm giữ tang vật, phương tiện vi phạm).`);
        }
        return;
      }

      if (basis.includes('Phòng, chống tham nhũng') || basis.includes('tham nhũng')) {
        const key = 'pctn2018';
        if (!addedKeys.has(key)) {
          addedKeys.add(key);
          lines.push(`- ⚖️ **Luật Phòng, chống tham nhũng năm 2018**:
  + *Điều 2, Điều 3*: Định nghĩa hành vi tham nhũng là hành vi của người có chức vụ, quyền hạn đã lợi dụng chức vụ, quyền hạn đó vì vụ lợi; bao gồm các hành vi tham nhũng trong khu vực nhà nước và khu vực ngoài nhà nước.`);
        }
        return;
      }

      const rawKey = basis.toLowerCase();
      if (!addedKeys.has(rawKey)) {
        addedKeys.add(rawKey);
        lines.push(`- ⚖️ **${basis}**`);
      }
    });

    if (lines.length === 0) {
      lines.push(`- ⚖️ **Hiến pháp nước Cộng hòa xã hội chủ nghĩa Việt Nam năm 2013** (Nguyên tắc Nhà nước pháp quyền XHCN và quản lý xã hội bằng Hiến pháp và pháp luật).`);
    }

    return lines.join('\n');
  }

  /**
   * Chuẩn hóa nội dung học liệu giáo trình sang dạng danh sách phân cấp rõ ràng, dễ đọc trên UI
   */
  public static formatCleanTextbookContent(rawContent: string): string {
    if (!rawContent) return '';
    return rawContent
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        // Chuyển tiêu đề La Mã "I. ...", "II. ..." thành subheading H3 gọn đẹp (tránh banner MỤC I quá lớn)
        const romanMatch = trimmed.match(/^(I|II|III|IV|V|VI)\.\s*(.+)$/i);
        if (romanMatch) {
          return `### 🔹 ${romanMatch[1].toUpperCase()}. ${romanMatch[2].replace(/:$/, '')}`;
        }
        // Chuyển dòng thụt lề "   - ..." thành sub-bullet "+ ..."
        if (/^\s{2,}[-•*]\s+/.test(line)) {
          return `+ ${trimmed.replace(/^[-•*]\s+/, '')}`;
        }
        return trimmed;
      })
      .join('\n');
  }

  /**
   * Tạo khối trích dẫn & phân tích học liệu RAG rõ ràng, đầy đủ (Tên sách, Chương, Mục, Trang, Tóm tắt, Nội dung giáo trình & Căn cứ pháp lý)
   */
  public static buildCompactCitation(
    chunk: TextbookChunk,
    extraArticles: { lawName: string; articleNumber: number | string; title: string; contentRaw?: string }[] = []
  ): string {
    return this.buildDetailedCitation(chunk, extraArticles);
  }

  /**
   * Định dạng khối Trích dẫn RAG & Căn cứ Học liệu Giáo trình TMU 2021 chi tiết chuẩn mực
   * Đáp ứng: Nêu rõ Chương gì, Luật gì, Trang mấy, Nội dung chi tiết tại các trang đó là gì.
   */
  public static buildDetailedCitation(
    chunk: TextbookChunk,
    extraArticles: { lawName: string; articleNumber: number | string; title: string; contentRaw?: string }[] = []
  ): string {
    const pages = chunk.pageRange.replace(/^tr\.\s*/i, '');
    const cleanSectionCode = chunk.sectionCode.replace(/_/g, ' – ');
    const detailedLaws = this.formatDetailedLaws(chunk.legalBasis, extraArticles);
    const formattedContent = this.formatCleanTextbookContent(chunk.baremContent);

    return `\n\n---\n\n### 📚 CĂN CỨ THAM KHẢO GIÁO TRÌNH PHÁP LUẬT ĐẠI CƯƠNG (TMU 2021 — BỘ GD&ĐT):
- **Tên Giáo trình**: Giáo trình Pháp luật đại cương — Trường Đại học Thương Mại (NXB Hà Nội, 2021 — Chủ biên: TS. Trần Thành Thọ).
- **Tên Chương học phần**: **${chunk.chapterTitle}**
- **Mục & Tiết bài học**: **Mục ${cleanSectionCode}: ${chunk.sectionTitle}**
- **Vị trí học liệu trong sách**: **Trang ${pages}**
- **Trọng tâm lý luận**: ${chunk.summary}

### 📖 NỘI DUNG LÝ LUẬN ĐỐI CHIẾU TRONG GIÁO TRÌNH (TRANG ${pages}):
${formattedContent}

### ⚖️ CĂN CỨ VĂN BẢN QUY PHẠM PHÁP LUẬT THỰC ĐỊNH ÁP DỤNG:
${detailedLaws}`;
  }

  /**
   * Định dạng câu trả lời hoàn chỉnh dựa trên Giáo trình Pháp luật Đại cương TMU 2021
   */
  public static buildTextbookResponse(query: string, topMatch: { chunk: TextbookChunk; score: number }): string {
    const c = topMatch.chunk;
    return `📚 **GIẢI ĐÁP THEO GIÁO TRÌNH PHÁP LUẬT ĐẠI CƯƠNG — BỘ GIÁO DỤC VÀ ĐÀO TẠO**  
*(Trường Đại học Thương Mại — NXB Hà Nội 2021, Chủ biên: TS. Trần Thành Thọ)*

${this.buildDetailedCitation(c)}`;
  }
}
