"""
=============================================================================
VietLawAssist — Bộ dữ liệu Chuẩn Barem Giáo trình Pháp luật Đại cương
(Trường Đại học Thương Mại - NXB Hà Nội 2021 - Chủ biên: TS. Trần Thành Thọ)
=============================================================================
Chứa toàn bộ câu hỏi ôn tập, thảo luận của 9 chương lý thuyết cốt lõi.
"""

TMU_TEXTBOOK_SAMPLES = [
    # -------------------------------------------------------------------------
    # CHƯƠNG 1: MỘT SỐ VẤN ĐỀ LÝ LUẬN CƠ BẢN VỀ NHÀ NƯỚC - NHÀ NƯỚC CHXHCN VN
    # -------------------------------------------------------------------------
    {
        "sample_id": "SFT_TMU_CH1_001",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy trình bày câu hỏi ôn tập Chương 1 môn Pháp luật đại cương theo giáo trình chuẩn.",
        "input": "Sự hình thành nhà nước trong lịch sử, các quan điểm khác nhau về sự hình thành của nhà nước? Quan điểm của chủ nghĩa Mác - Lênin về nguồn gốc nhà nước?",
        "output": """I. CÁC QUAN NIỆM PHI MÁC-XÍT VỀ NGUỒN GỐC NHÀ NƯỚC:
1. Thuyết thần học: Thượng đế là người sắp đặt trật tự xã hội, nhà nước do Thượng đế sáng tạo ra để bảo vệ trật tự chung, quyền lực nhà nước là vĩnh cửu và con người có bổn phận phục tùng (J.Calvin, J.Althisius).
2. Thuyết gia trưởng: Nhà nước là kết quả phát triển tự nhiên của gia đình và quyền gia trưởng; quyền lực nhà nước giống quyền của người đứng đầu gia đình (Aristote, Bodin).
3. Thuyết bạo lực: Nhà nước xuất hiện trực tiếp từ việc thị tộc này dùng bạo lực nô dịch thị tộc khác, lập ra bộ máy để thống trị kẻ chiến bại (Hume, Gumplowicz, E.Duhring).
4. Thuyết khế ước xã hội: Nhà nước ra đời từ một bản hợp đồng thỏa thuận giữa các thành viên trong xã hội nhằm bảo vệ quyền tự nhiên của con người. Nếu nhà nước vi phạm khế ước, nhân dân có quyền lật đổ (Thomas Hobbes, John Locke, J.J.Rousseau).

II. QUAN ĐIỂM CỦA CHỦ NGHĨA MÁC - LÊNIN VỀ NGUỒN GỐC NHÀ NƯỚC:
Chủ nghĩa Mác - Lênin khẳng định: Nhà nước không phải hiện tượng vĩnh cửu mà là một hiện tượng lịch sử có quá trình xuất hiện, tồn tại, phát triển và tiêu vong khi các điều kiện không còn. Nhà nước ra đời do 2 nguyên nhân cốt lõi:
1. Tiền đề kinh tế: Ba lần phân công lao động xã hội lớn (Chăn nuôi tách trồng trọt -> Thủ công nghiệp tách nông nghiệp -> Thương nghiệp xuất hiện) làm năng suất lao động tăng, xuất hiện sản phẩm dư thừa, dẫn tới sự xuất hiện của chế độ tư hữu tư liệu sản xuất.
2. Tiền đề xã hội: Xã hội phân chia thành các giai cấp đối kháng có lợi ích mâu thuẫn gay gắt không thể điều hòa. Để giữ cho sự xung đột giai cấp không tự thiêu hủy xã hội, giai cấp thống trị đã tổ chức ra một quyền lực công đặc biệt để trấn áp và quản lý xã hội - đó chính là Nhà nước.

III. KẾT LUẬN:
Nhà nước xuất hiện một cách khách quan, là sản phẩm và biểu hiện của sự không thể điều hòa được của các mâu thuẫn giai cấp."""
    },
    {
        "sample_id": "SFT_TMU_CH1_002",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy phân tích bản chất của nhà nước theo giáo trình Pháp luật đại cương.",
        "input": "Phân tích tính giai cấp và tính xã hội của nhà nước? Cho ví dụ minh họa?",
        "output": """I. KHÁI NIỆM BẢN CHẤT NHÀ NƯỚC:
Bản chất của nhà nước được hiểu là tổng thể những mặt, những thuộc tính tương đối ổn định bên trong của nhà nước, quy định sự tồn tại và phát triển của nhà nước, gồm hai thuộc tính thống nhất biện chứng:

1. TÍNH GIAI CẤP CỦA NHÀ NƯỚC:
- Thể hiện sự thống trị của giai cấp này đối với giai cấp khác trong xã hội trên 3 mặt:
  + Quyền lực kinh tế: Giai cấp thống trị nắm tư liệu sản xuất chủ yếu, buộc giai cấp bị trị phụ thuộc kinh tế.
  + Quyền lực chính trị: Sử dụng nhà nước như công cụ bạo lực có tổ chức để trấn áp sự phản kháng của giai cấp bị trị, thể chế hóa ý chí giai cấp thành ý chí nhà nước.
  + Quyền lực tư tưởng: Xây dựng hệ tư tưởng của giai cấp thống trị thành hệ tư tưởng chủ đạo trong toàn xã hội.
- Ví dụ: Trong nhà nước chủ nô, pháp luật công khai quy định chủ nô có quyền mua bán, thậm chí giết chết người nô lệ (coi nô lệ là công cụ biết nói).

2. TÍNH XÃ HỘI CỦA NHÀ NƯỚC:
- Với tư cách là bộ máy thực thi quyền lực công cộng, nhà nước phải giải quyết các công việc chung phục vụ cộng đồng, bảo đảm trật tự công cộng, xây dựng công trình giao thông, y tế, giáo dục, cứu trợ thiên tai, dịch bệnh.
- Ví dụ: Nhà nước tổ chức phòng chống thiên tai bão lụt, xây dựng đường sá, hệ thống đê điều thủy lợi, tổ chức tiêm chủng phòng dịch bệnh miễn phí cho toàn dân.

II. MỐI QUAN HỆ BIỆN CHỨNG:
Trong nhà nước hiện đại và xu thế nhà nước pháp quyền, tính xã hội ngày càng mở rộng và phát triển, tính giai cấp hướng tới phục vụ lợi ích của nhân dân lao động."""
    },
    {
        "sample_id": "SFT_TMU_CH1_003",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy trình bày câu hỏi về hình thức chính thể của nhà nước theo giáo trình.",
        "input": "Hình thức chính thể: khái niệm, phân loại, so sánh các dạng hình thức chính thể nhà nước?",
        "output": """I. KHÁI NIỆM HÌNH THỨC CHÍNH THỂ:
Hình thức chính thể là cách thức tổ chức và trình tự thành lập các cơ quan cấp cao của quyền lực nhà nước, cũng như mối quan hệ giữa các cơ quan đó với nhau và với nhân dân.

II. PHÂN LOẠI VÀ SO SÁNH CÁC DẠNG CHÍNH THỂ:
1. CHÍNH THỂ QUÂN CHỦ:
- Quyền lực tối cao của nhà nước tập trung toàn bộ hoặc một phần trong tay một người đứng đầu (Vua, Nữ hoàng, Hoàng đế) theo nguyên tắc thừa kế vị trí (cha truyền con nối).
- Gồm 2 dạng:
  + Quân chủ tuyệt đối: Quyền lực nhà vua là tối cao vô hạn (Ví dụ: phong kiến Việt Nam, Trung Quốc thời xưa, Brunei, Ả-rập Xê-út hiện nay).
  + Quân chủ hạn chế (quân chủ lập hiến/đại nghị): Quyền lực nhà vua bị giới hạn bởi Hiến pháp và chia sẻ với Nghị viện, Chính phủ (Ví dụ: Vương quốc Anh, Nhật Bản, Thụy Điển, Thái Lan).

2. CHÍNH THỂ CỘNG HÒA:
- Quyền lực tối cao của nhà nước thuộc về một cơ quan được nhân dân bầu ra theo nhiệm kỳ nhất định.
- Gồm 2 dạng:
  + Cộng hòa quý tộc: Chỉ tầng lớp quý tộc mới có quyền bầu cử và nắm quyền lực nhà nước (Ví dụ: Nhà nước La Mã cổ đại thế kỷ VI-I TCN).
  + Cộng hòa dân chủ: Mọi công dân đủ điều kiện luật định đều có quyền bầu cử, ứng cử vào cơ quan quyền lực nhà nước cao nhất (Ví dụ: Việt Nam, Hoa Kỳ, Pháp, Đức).

III. LIÊN HỆ VIỆT NAM:
Nhà nước Cộng hòa xã hội chủ nghĩa Việt Nam có hình thức chính thể là CỘNG HÒA DÂN CHỦ (Điều 2 Hiến pháp 2013), quyền lực nhà nước thuộc về nhân dân, cơ quan quyền lực nhà nước cao nhất là Quốc hội do nhân dân trực tiếp bầu ra."""
    },
    {
        "sample_id": "SFT_TMU_CH1_004",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy trình bày về hình thức cấu trúc nhà nước và chế độ chính trị theo giáo trình.",
        "input": "Hình thức cấu trúc nhà nước, chế độ chính trị? Liên hệ với nhà nước Việt Nam?",
        "output": """I. HÌNH THỨC CẤU TRÚC NHÀ NƯỚC:
1. Khái niệm: Là cách thức tổ chức nhà nước thành các đơn vị hành chính - lãnh thổ và mối quan hệ giữa các cơ quan chính quyền trung ương với chính quyền địa phương.
2. Hai hình thức cấu trúc cơ bản:
- Nhà nước đơn nhất: Có chủ quyền chung, một hệ thống cơ quan nhà nước tối cao thống nhất từ trung ương đến địa phương, một bản Hiến pháp và một hệ thống pháp luật (Ví dụ: Việt Nam, Pháp, Nhật Bản, Trung Quốc).
- Nhà nước liên bang: Được hợp thành từ hai hay nhiều nhà nước thành viên (bang), ngoài hệ thống pháp luật và cơ quan chung của liên bang, mỗi bang có hiến pháp, pháp luật và bộ máy nhà nước riêng (Ví dụ: Hoa Kỳ, Đức, Nga, Ấn Độ).

II. CHẾ ĐỘ CHÍNH TRỊ:
1. Khái niệm: Là tổng thể những phương pháp, cách thức và thủ đoạn mà các cơ quan nhà nước sử dụng để thực hiện quyền lực nhà nước.
2. Phân loại:
- Phương pháp dân chủ: Ghi nhận và bảo đảm các quyền tự do, dân chủ thực sự của công dân; tạo điều kiện cho nhân dân tham gia quản lý nhà nước (dân chủ trực tiếp và đại diện).
- Phương pháp phản dân chủ: Mang tính độc tài, chuyên chế, vi phạm quyền con người (ở mức độ cực đoan là chế độ phát xít).

III. LIÊN HỆ VIỆT NAM:
- Về cấu trúc: Việt Nam là NHÀ NƯỚC ĐƠN NHẤT (Điều 1 Hiến pháp 2013: độc lập, có chủ quyền, thống nhất và toàn vẹn lãnh thổ; có một Hiến pháp và một hệ thống cơ quan quyền lực cao nhất là Quốc hội).
- Về chế độ chính trị: Là CHẾ ĐỘ DÂN CHỦ XÃ HỘI CHỦ NGHĨA, nhà nước pháp quyền của nhân dân, do nhân dân, vì nhân dân."""
    },
    {
        "sample_id": "SFT_TMU_CH1_005",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày về chức năng của nhà nước và các yếu tố tác động theo giáo trình.",
        "input": "Chức năng nhà nước: khái niệm, phân loại, các yếu tố tác động đến việc thực hiện chức năng nhà nước?",
        "output": """I. KHÁI NIỆM CHỨC NĂNG NHÀ NƯỚC:
Chức năng của nhà nước là những phương diện hoạt động chủ yếu của nhà nước, phản ánh bản chất của nhà nước nhằm thực hiện những nhiệm vụ cơ bản của nhà nước trong từng giai đoạn phát triển lịch sử.

II. PHÂN LOẠI CHỨC NĂNG NHÀ NƯỚC:
1. Căn cứ vào phạm vi hoạt động:
- Chức năng đối nội: Toàn bộ hoạt động trong nội bộ đất nước nhằm duy trì trật tự xã hội, phát triển kinh tế, y tế, văn hóa, giáo dục, trấn áp tội phạm.
- Chức năng đối ngoại: Thể hiện vai trò của nhà nước trong quan hệ quốc tế: bảo vệ tổ quốc, bảo vệ chủ quyền biên giới, hải đảo, thiết lập quan hệ ngoại giao, hợp tác kinh tế - thương mại quốc tế.
2. Căn cứ vào hình thức thực hiện quyền lực: Chức năng lập pháp, chức năng hành pháp và chức năng tư pháp.

III. CÁC YẾU TỐ TÁC ĐỘNG ĐẾN VIỆC THỰC HIỆN CHỨC NĂNG:
- Bản chất giai cấp và bản chất xã hội của nhà nước.
- Điều kiện kinh tế - xã hội và trình độ phát triển của lực lượng sản xuất trong nước.
- Bối cảnh quốc tế, tình hình an ninh, địa chính trị và xu thế toàn cầu hóa."""
    },
    {
        "sample_id": "SFT_TMU_CH1_006",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày về bộ máy nhà nước và các nguyên tắc tổ chức của Nhà nước CHXHCN Việt Nam.",
        "input": "Bộ máy nhà nước CHXHCN Việt Nam: khái niệm, phân loại các cơ quan trong bộ máy nhà nước, các nguyên tắc cơ bản về tổ chức và hoạt động?",
        "output": """I. KHÁI NIỆM BỘ MÁY NHÀ NƯỚC:
Bộ máy nhà nước CHXHCN Việt Nam là hệ thống các cơ quan nhà nước từ trung ương đến địa phương, được tổ chức và hoạt động theo những nguyên tắc chung thống nhất, mang quyền lực nhà nước nhằm thực hiện các chức năng và nhiệm vụ của nhà nước.

II. HỆ THỐNG CÁC CƠ QUAN TRONG BỘ MÁY NHÀ NƯỚC THEO HIẾN PHÁP 2013:
1. Cơ quan quyền lực nhà nước (cơ quan đại diện do dân bầu):
- Quốc hội: Cơ quan đại biểu cao nhất của nhân dân, cơ quan quyền lực nhà nước cao nhất (thực hiện quyền lập hiến, lập pháp, giám sát tối cao).
- Hội đồng nhân dân các cấp (tỉnh, huyện, xã): Cơ quan quyền lực nhà nước ở địa phương.
2. Nguyên thủ quốc gia: Chủ tịch nước (đứng đầu Nhà nước, thay mặt nước CHXHCN Việt Nam về đối nội và đối ngoại, thống lĩnh lực lượng vũ trang nhân dân).
3. Cơ quan hành chính nhà nước (cơ quan chấp hành và hành pháp):
- Chính phủ: Cơ quan hành chính nhà nước cao nhất, cơ quan chấp hành của Quốc hội, thực hiện quyền hành pháp.
- Ủy ban nhân dân các cấp: Cơ quan chấp hành của HĐND cùng cấp, cơ quan hành chính nhà nước ở địa phương.
4. Cơ quan xét xử (quyền tư pháp): Tòa án nhân dân (TAND Tối cao, TAND Cấp cao, TAND cấp tỉnh, TAND cấp huyện và Tòa án quân sự).
5. Cơ quan thực hiện quyền công tố và kiểm sát tư pháp: Viện kiểm sát nhân dân.
6. Thiết chế độc lập hiến định: Hội đồng bầu cử quốc gia và Kiểm toán nhà nước.

III. CÁC NGUYÊN TẮC CƠ BẢN VỀ TỔ CHỨC VÀ HOẠT ĐỘNG:
1. Nguyên tắc tất cả quyền lực nhà nước thuộc về nhân dân.
2. Nguyên tắc Đảng Cộng sản Việt Nam lãnh đạo Nhà nước và xã hội (Điều 4 Hiến pháp 2013).
3. Nguyên tắc quyền lực nhà nước là thống nhất, có sự phân công, phối hợp, kiểm soát giữa các cơ quan nhà nước trong việc thực hiện quyền lập pháp, hành pháp, tư pháp.
4. Nguyên tắc tập trung dân chủ.
5. Nguyên tắc pháp chế xã hội chủ nghĩa."""
    },

    # -------------------------------------------------------------------------
    # CHƯƠNG 2: MỘT SỐ VẤN ĐỀ LÝ LUẬN CƠ BẢN VỀ PHÁP LUẬT
    # -------------------------------------------------------------------------
    {
        "sample_id": "SFT_TMU_CH2_001",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày các đặc điểm và các hình thức thể hiện của pháp luật theo giáo trình.",
        "input": "Phân tích đặc điểm, các hình thức thể hiện sự tồn tại của pháp luật?",
        "output": """I. CÁC ĐẶC TRƯNG CƠ BẢN CỦA PHÁP LUẬT:
1. Tính quyền lực nhà nước: Pháp luật do nhà nước ban hành hoặc thừa nhận, thể hiện ý chí của nhà nước và được bảo đảm thực hiện bằng sức mạnh cưỡng chế của nhà nước.
2. Tính quy phạm phổ biến: Pháp luật là khuôn mẫu, mực thước chung cho hành vi của nhiều người, được áp dụng nhiều lần trong không gian và thời gian rộng lớn.
3. Tính ý chí: Pháp luật phản ánh ý chí của giai cấp thống trị được thể chế hóa thành ý chí của nhà nước.
4. Tính bắt buộc chung: Mọi cá nhân, cơ quan, tổ chức khi ở vào hoàn cảnh pháp luật dự liệu đều phải xử sự theo quy định, không ai được đứng ngoài hay đứng trên pháp luật.

II. BA HÌNH THỨC THỂ HIỆN CỦA PHÁP LUẬT TRÊN THẾ GIỚI:
1. Tập quán pháp: Nhà nước thừa nhận những tập quán đã lưu truyền trong xã hội, nâng lên thành quy tắc có giá trị pháp lý bắt buộc (phổ biến thời cổ - trung đại).
2. Tiền lệ pháp (Án lệ): Nhà nước thừa nhận các bản án, quyết định của tòa án giải quyết vụ việc cụ thể làm khuôn mẫu pháp lý để xét xử các vụ việc tương tự xảy ra sau này (phổ biến ở hệ thống Thông luật Common Law).
3. Văn bản quy phạm pháp luật: Văn bản do cơ quan nhà nước có thẩm quyền ban hành theo trình tự, thủ tục và hình thức luật định, chứa đựng quy tắc xử sự chung (hình thức chủ yếu tại các nước Dân luật Civil Law và Việt Nam)."""
    },
    {
        "sample_id": "SFT_TMU_CH2_002",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày hệ thống văn bản quy phạm pháp luật và nguyên tắc áp dụng theo Luật Ban hành VBQPPL 2015.",
        "input": "Trình bày hệ thống các văn bản quy phạm pháp luật và nguyên tắc áp dụng các văn bản quy phạm pháp luật ở Việt Nam hiện nay?",
        "output": """I. HỆ THỐNG VĂN BẢN QUY PHẠM PHÁP LUẬT (ĐIỀU 4 LUẬT BAN HÀNH VBQPPL 2015):
1. Quốc hội: Hiến pháp, Bộ luật, Luật, Nghị quyết.
2. Ủy ban Thường vụ Quốc hội: Pháp lệnh, Nghị quyết; Nghị quyết liên tịch với Đoàn Chủ tịch UBTW MTTQ Việt Nam.
3. Chủ tịch nước: Lệnh, Quyết định.
4. Chính phủ: Nghị định; Nghị quyết liên tịch với Đoàn Chủ tịch UBTW MTTQ Việt Nam.
5. Thủ tướng Chính phủ: Quyết định.
6. Hội đồng Thẩm phán TAND Tối cao: Nghị quyết.
7. Chánh án TANDTC, Viện trưởng VKSNDTC, Bộ trưởng, Thủ trưởng cơ quan ngang bộ: Thông tư; Thông tư liên tịch.
8. Tổng Kiểm toán nhà nước: Quyết định.
9. Hội đồng nhân dân các cấp: Nghị quyết.
10. Ủy ban nhân dân các cấp: Quyết định.

II. NGUYÊN TẮC ÁP DỤNG VBQPPL (ĐIỀU 156 LUẬT BAN HÀNH VBQPPL 2015):
1. Văn bản quy phạm pháp luật được áp dụng từ thời điểm bắt đầu có hiệu lực đối với hành vi xảy ra tại thời điểm văn bản đang có hiệu lực.
2. Ưu tiên thứ bậc hiệu lực: Nếu các VBQPPL quy định khác nhau về cùng một vấn đề thì áp dụng văn bản có hiệu lực pháp lý cao hơn.
3. Cùng cơ quan ban hành: Nếu các văn bản do cùng một cơ quan ban hành có quy định khác nhau về cùng một vấn đề thì áp dụng quy định của văn bản ban hành sau.
4. Văn bản mới không quy định trách nhiệm pháp lý hoặc quy định trách nhiệm pháp lý nhẹ hơn đối với hành vi xảy ra trước đó thì được áp dụng văn bản mới.
5. Ưu tiên Điều ước quốc tế: Nếu VBQPPL trong nước và Điều ước quốc tế mà VN là thành viên có quy định khác nhau thì áp dụng Điều ước quốc tế (trừ Hiến pháp)."""
    },
    {
        "sample_id": "SFT_TMU_CH2_003",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày cấu thành của hệ thống pháp luật Việt Nam.",
        "input": "Phân tích cấu thành của hệ thống pháp luật và hệ thống pháp luật của Việt Nam?",
        "output": """I. KHÁI NIỆM HỆ THỐNG PHÁP LUẬT:
Hệ thống pháp luật là một chỉnh thể thống nhất các hiện tượng pháp luật, thể hiện sự liên kết chặt chẽ nội tại giữa các quy phạm pháp luật và hình thức thể hiện bên ngoài của chúng.

II. HAI PHƯƠNG DIỆN CẤU THÀNH HỆ THỐNG PHÁP LUẬT:
1. Hệ thống cấu trúc (cơ sở bên trong): Gồm 3 cấp độ:
- Quy phạm pháp luật: Tế bào nhỏ nhất của hệ thống pháp luật, điều chỉnh hành vi xử sự cụ thể.
- Chế định pháp luật: Tập hợp nhóm quy phạm pháp luật điều chỉnh một nhóm quan hệ xã hội có liên quan mật thiết (Ví dụ: chế định quyền sở hữu, chế định hợp đồng trong Luật Dân sự).
- Ngành luật: Tổng thể các quy phạm pháp luật điều chỉnh toàn bộ các quan hệ xã hội cùng loại trong một lĩnh vực đời sống bằng phương pháp điều chỉnh đặc thù.
2. Hệ thống nguồn pháp luật (hình thức bên ngoài): Toàn bộ các văn bản quy phạm pháp luật được sắp xếp theo trật tự thang bậc hiệu lực pháp lý thống nhất từ Hiến pháp đến các quyết định của chính quyền địa phương.

III. CÁC NGÀNH LUẬT CƠ BẢN TRONG HỆ THỐNG PHÁP LUẬT VIỆT NAM:
Gồm: Luật Hiến pháp, Luật Hành chính, Luật Hình sự, Luật Dân sự, Luật Tố tụng Hình sự, Luật Tố tụng Dân sự, Luật Hôn nhân và Gia đình, Luật Lao động, Luật Kinh tế - Thương mại, Luật Đất đai, Luật Tài chính, Luật Môi trường..."""
    },

    # -------------------------------------------------------------------------
    # CHƯƠNG 3: QUY PHẠM PHÁP LUẬT VÀ THỰC HIỆN PHÁP LUẬT
    # -------------------------------------------------------------------------
    {
        "sample_id": "SFT_TMU_CH3_001",
        "intent_code": "QPPL_STRUCT",
        "instruction": "Trình bày khái niệm, đặc điểm và 3 bộ phận của quy phạm pháp luật theo giáo trình.",
        "input": "Quy phạm pháp luật là gì? Trình bày cấu thành của quy phạm pháp luật? Cho ví dụ minh họa?",
        "output": """I. KHÁI NIỆM QUY PHẠM PHÁP LUẬT:
Quy phạm pháp luật là quy tắc xử sự chung mang tính chất bắt buộc, do cơ quan nhà nước có thẩm quyền ban hành hoặc thừa nhận và được Nhà nước bảo đảm thực hiện bằng các biện pháp cưỡng chế nhằm điều chỉnh các quan hệ xã hội.

II. BA BỘ PHẬN CẤU THÀNH QUY PHẠM PHÁP LUẬT:
1. BỘ PHẬN GIẢ ĐỊNH:
- Khái niệm: Nêu rõ điều kiện, hoàn cảnh, địa điểm, thời gian và chủ thể nào sẽ chịu sự tác động điều chỉnh của quy phạm pháp luật.
- Trả lời cho câu hỏi: \"Chủ thể nào? Trong điều kiện, hoàn cảnh nào?\".
2. BỘ PHẬN QUY ĐỊNH:
- Khái niệm: Xác định rõ quyền và nghĩa vụ pháp lý, mô hình hóa cách xử sự của chủ thể khi ở vào hoàn cảnh nêu trong bộ phận giả định (được làm gì, không được làm gì, phải làm gì).
- Trả lời cho câu hỏi: \"Chủ thể được làm gì, không được làm gì, phải làm như thế nào?\".
3. BỘ PHẬN CHẾ TÀI:
- Khái niệm: Xác định hậu quả pháp lý bất lợi mà chủ thể phải gánh chịu nếu không thực hiện hoặc thực hiện không đúng mệnh lệnh nêu trong bộ phận quy định.
- Trả lời cho câu hỏi: \"Hậu quả bất lợi gì sẽ xảy ra nếu chủ thể vi phạm?\".

III. VÍ DỤ MINH HỌA (KHOẢN 1 ĐIỀU 168 BLHS 2015):
\"Người nào dùng vũ lực, đe dọa dùng vũ lực ngay tức khắc hoặc có hành vi khác làm cho người bị tấn công lâm vào tình trạng không thể chống cự được nhằm chiếm đoạt tài sản, thì bị phạt tù từ 03 năm đến 10 năm.\"
- Giả định: \"Người nào dùng vũ lực, đe dọa dùng vũ lực ngay tức khắc hoặc có hành vi khác làm cho người bị tấn công lâm vào tình trạng không thể chống cự được nhằm chiếm đoạt tài sản\"
- Quy định: Cấm hành vi cướp tài sản (thể hiện dưới dạng quy phạm cấm đoán ngầm ẩn).
- Chế tài: \"thì bị phạt tù từ 03 năm đến 10 năm\" (chế tài hình sự phạt tù có thời hạn)."""
    },
    {
        "sample_id": "SFT_TMU_CH3_002",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày 4 hình thức thực hiện pháp luật và cho ví dụ minh họa.",
        "input": "Phân tích các hình thức thực hiện pháp luật. Cho ví dụ về từng hình thức thực hiện pháp luật?",
        "output": """I. KHÁI NIỆM THỰC HIỆN PHÁP LUẬT:
Thực hiện pháp luật là quá trình hoạt động có mục đích làm cho những quy định của pháp luật đi vào đời sống thực tế, trở thành hành vi hợp pháp của các chủ thể pháp luật.

II. BỐN HÌNH THỨC THỰC HIỆN PHÁP LUẬT:
1. TUÂN THỦ PHÁP LUẬT (Tuân theo pháp luật):
- Đặc điểm: Chủ thể kiềm chế, không tiến hành những hoạt động mà pháp luật cấm (thực hiện dưới dạng KHÔNG HÀNH ĐỘNG).
- Ví dụ: Công dân không vượt đèn đỏ, không buôn bán ma túy, không trộm cắp tài sản.
2. THI HÀNH PHÁP LUẬT (Chấp hành pháp luật):
- Đặc điểm: Chủ thể tích cực thực hiện nghĩa vụ pháp lý bắt buộc mà pháp luật yêu cầu (thực hiện dưới dạng HÀNH ĐỘNG).
- Ví dụ: Công dân đủ 18 tuổi đi đăng ký nghĩa vụ quân sự; doanh nghiệp nộp thuế thu nhập doanh nghiệp đúng hạn.
3. SỬ DỤNG PHÁP LUẬT:
- Đặc điểm: Chủ thể chủ động tự mình quyết định thực hiện hay không thực hiện các quyền và tự do pháp lý mà pháp luật cho phép (thực hiện quyền năng của mình).
- Ví dụ: Công dân làm đơn khiếu nại quyết định hành chính trái pháp luật; công dân thực hiện quyền tự do kinh doanh hàng hóa hợp pháp.
4. ÁP DỤNG PHÁP LUẬT:
- Đặc điểm: Là hình thức đặc thù DÀNH RIÊNG CHO CƠ QUAN NHÀ NƯỚC, người có thẩm quyền căn cứ pháp luật để ban hành văn bản cá biệt làm phát sinh, thay đổi, chấm dứt quyền, nghĩa vụ cụ thể hoặc áp dụng chế tài cưỡng chế.
- Ví dụ: Cảnh sát giao thông ra quyết định xử phạt 4 triệu đồng đối với lái xe say xỉn; Tòa án tuyên án 5 năm tù đối với bị cáo phạm tội trộm cắp tài sản."""
    },
    {
        "sample_id": "SFT_TMU_CH3_003",
        "intent_code": "GENERAL_THEORY",
        "instruction": "So sánh văn bản quy phạm pháp luật và văn bản áp dụng pháp luật theo giáo trình.",
        "input": "So sánh văn bản quy phạm pháp luật với văn bản áp dụng pháp luật. Cho ví dụ về từng loại văn bản?",
        "output": """I. BẢNG SO SÁNH VĂN BẢN QUY PHẠM PHÁP LUẬT VÀ VĂN BẢN ÁP DỤNG PHÁP LUẬT:

1. THẨM QUYỀN BAN HÀNH:
- Văn bản QPPL: Do các cơ quan nhà nước được Luật Ban hành VBQPPL quy định (Quốc hội, Chính phủ, Bộ trưởng, HĐND, UBND...).
- Văn bản áp dụng PL: Do cơ quan nhà nước, người có thẩm quyền hoặc tổ chức được nhà nước ủy quyền ban hành (Thủ trưởng cơ quan, Thẩm phán, Cảnh sát, Hiệu trưởng...).

2. NỘI DUNG VĂN BẢN:
- Văn bản QPPL: Chứa đựng các quy tắc xử sự chung mang tính trừu tượng, là khuôn mẫu chung cho xã hội.
- Văn bản áp dụng PL: Chứa đựng các mệnh lệnh cá biệt, giải quyết vụ việc cụ thể, áp dụng cho đối tượng cụ thể.

3. PHẠM VI VÀ HIỆU LỰC ÁP DỤNG:
- Văn bản QPPL: Áp dụng nhiều lần, trong thời gian dài đối với mọi chủ thể thuộc diện điều chỉnh trên phạm vi cả nước hoặc địa phương.
- Văn bản áp dụng PL: Áp dụng một lần đối với một hoặc một số đối tượng đích danh; chấm dứt hiệu lực khi việc thi hành hoàn tất.

4. CƠ SỞ BAN HÀNH:
- Văn bản QPPL: Dựa trên Hiến pháp và các văn bản luật có hiệu lực cao hơn.
- Văn bản áp dụng PL: Dựa trực tiếp trên các Văn bản QPPL đang có hiệu lực và tình tiết thực tế của vụ việc cụ thể.

II. VÍ DỤ MINH HỌA:
- Văn bản QPPL: Nghị định số 100/2019/NĐ-CP của Chính phủ quy định xử phạt vi phạm hành chính trong lĩnh vực giao thông đường bộ.
- Văn bản áp dụng pháp luật: Quyết định xử phạt vi phạm hành chính số 123/QĐ-XPHC của Trưởng Công an quận Cầu Giấy phạt tiền 7.000.000 đồng và tước GPLX 11 tháng đối với ông Nguyễn Văn A vì điều khiển ô tô chạy quá tốc độ."""
    },

    # -------------------------------------------------------------------------
    # CHƯƠNG 4: QUAN HỆ PHÁP LUẬT
    # -------------------------------------------------------------------------
    {
        "sample_id": "SFT_TMU_CH4_001",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày khái niệm, đặc điểm của quan hệ pháp luật theo giáo trình.",
        "input": "Anh chị hãy trình bày khái niệm về quan hệ pháp luật, qua đó phân biệt quan hệ pháp luật với các quan hệ xã hội thông thường khác?",
        "output": """I. KHÁI NIỆM QUAN HỆ PHÁP LUẬT:
Quan hệ pháp luật là một dạng quan hệ xã hội đặc biệt được hình thành, tồn tại và phát triển trên cơ sở các quy phạm pháp luật, theo đó các bên tham gia thực hiện các quyền và nghĩa vụ pháp lý cụ thể được Nhà nước quy định và bảo đảm thực hiện.

II. ĐẶC ĐIỂM PHÂN BIỆT QUAN HỆ PHÁP LUẬT VỚI CÁC QUAN HỆ XÃ HỘI KHÁC:
1. Quan hệ pháp luật mang tính ý chí: Vừa thể hiện ý chí của các bên tham gia, vừa thể hiện tập trung ý chí của Nhà nước (các quan hệ tình bạn, tình yêu thông thường chỉ mang ý chí cá nhân).
2. Có nội dung biểu hiện thành quyền và nghĩa vụ pháp lý: Quyền và nghĩa vụ của các bên được quy phạm pháp luật xác định cụ thể và có tính bắt buộc.
3. Được Nhà nước bảo đảm thực hiện: Khi quyền lợi bị xâm hại hoặc một bên trốn tránh nghĩa vụ, Nhà nước sẽ can thiệp bằng các biện pháp cưỡng chế (các quan hệ đạo đức, tôn giáo chỉ được bảo đảm bằng dư luận hoặc niềm tin).
4. Có cơ cấu chủ thể xác định: Các chủ thể tham gia phải có năng lực pháp luật và năng lực hành vi theo quy định của pháp luật."""
    },
    {
        "sample_id": "SFT_TMU_CH4_002",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày về năng lực chủ thể trong quan hệ pháp luật theo giáo trình.",
        "input": "Anh chị hãy trình bày các khái niệm về năng lực chủ thể, năng lực pháp luật, năng lực hành vi của chủ thể, qua đó hãy xác định năng lực chủ thể của cá nhân hoặc tổ chức trong các quan hệ pháp luật?",
        "output": """I. CÁC KHÁI NIỆM CƠ BẢN:
1. Năng lực chủ thể: Là khả năng pháp lý do Nhà nước thừa nhận cho cá nhân, tổ chức để có thể tham gia vào các quan hệ pháp luật với tư cách là chủ thể mang quyền và nghĩa vụ pháp lý. Năng lực chủ thể gồm hai yếu tố:
- Năng lực pháp luật: Khả năng của chủ thể được pháp luật thừa nhận có thể có quyền và nghĩa vụ pháp lý.
- Năng lực hành vi: Khả năng của chủ thể bằng chính hành vi của mình xác lập và thực hiện các quyền và nghĩa vụ pháp lý đó.

II. ĐẶC ĐIỂM NĂNG LỰC CHỦ THỂ CỦA CÁ NHÂN VÀ TỔ CHỨC:
1. Đối với cá nhân:
- Năng lực pháp luật có từ khi cá nhân sinh ra và chỉ chấm dứt khi chết; mọi cá nhân đều có năng lực pháp luật bình đẳng như nhau.
- Năng lực hành vi không xuất hiện cùng lúc với năng lực pháp luật mà phụ thuộc vào độ tuổi (18 tuổi), khả năng nhận thức và tình trạng sức khỏe tâm thần của cá nhân.
2. Đối với tổ chức (pháp nhân):
- Năng lực pháp luật và năng lực hành vi phát sinh đồng thời tại thời điểm thành lập/đăng ký hợp pháp và chấm dứt đồng thời khi tổ chức bị giải thể hoặc phá sản."""
    },
    {
        "sample_id": "SFT_TMU_CH4_003",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày khái niệm sự kiện pháp lý và phân loại theo giáo trình.",
        "input": "Sự kiện pháp lý là gì? Cho biết ý nghĩa pháp lý của sự kiện pháp lý và phân loại sự kiện pháp lý?",
        "output": """I. KHÁI NIỆM VÀ Ý NGHĨA SỰ KIỆN PHÁP LÝ:
1. Khái niệm: Sự kiện pháp lý là những sự kiện thực tế xảy ra trong đời sống mà sự xuất hiện hay mất đi của chúng được pháp luật dự liệu, gắn liền với việc làm phát sinh, thay đổi hoặc chấm dứt quan hệ pháp luật cụ thể.
2. Ý nghĩa: Là cầu nối trực tiếp giữa quy phạm pháp luật trừu tượng với các quan hệ pháp luật trong thực tiễn; thiếu sự kiện pháp lý thì quy phạm pháp luật không thể tự động làm phát sinh quan hệ pháp luật.

II. PHÂN LOẠI SỰ KIỆN PHÁP LÝ:
1. Căn cứ vào yếu tố ý chí của con người:
- Sự biến pháp lý: Các hiện tượng tự nhiên hoặc xã hội xảy ra không phụ thuộc vào ý chí của con người nhưng được pháp luật gắn với hậu quả pháp lý (Ví dụ: thiên tai bão lụt làm chấm dứt hợp đồng vì bất khả kháng; cái chết tự nhiên của cá nhân làm phát sinh quan hệ thừa kế).
- Hành vi pháp lý: Những sự kiện xảy ra theo ý chí của con người (dưới dạng hành động hoặc không hành động). Gồm hành vi hợp pháp (ký kết hợp đồng mua bán) và hành vi bất hợp pháp (trộm cắp tài sản, gây tai nạn).
2. Căn cứ vào số lượng điều kiện, hoàn cảnh:
- Sự kiện pháp lý đơn giản: Chỉ cần 1 sự kiện thực tế xảy ra (Ví dụ: một người chết làm chấm dứt hôn nhân).
- Sự kiện pháp lý phức tạp: Đòi hỏi tập hợp chuỗi nhiều sự kiện kết hợp (Ví dụ: việc kết hôn đòi hỏi nam nữ đủ tuổi, tự nguyện và có đăng ký kết hôn tại UBND)."""
    },

    # -------------------------------------------------------------------------
    # CHƯƠNG 5: VI PHẠM PHÁP LUẬT VÀ TRÁCH NHIỆM PHÁP LÝ
    # -------------------------------------------------------------------------
    {
        "sample_id": "SFT_TMU_CH5_001",
        "intent_code": "VPPL_4_ELEMENTS",
        "instruction": "Trình bày 4 dấu hiệu cơ bản của vi phạm pháp luật theo giáo trình.",
        "input": "Nêu khái niệm và phân tích các dấu hiệu đặc trưng cơ bản của hành vi vi phạm pháp luật? Cho ví dụ minh họa?",
        "output": """I. KHÁI NIỆM VI PHẠM PHÁP LUẬT:
Vi phạm pháp luật là hành vi trái pháp luật, có lỗi, do chủ thể có năng lực trách nhiệm pháp lý thực hiện, xâm hại đến các quan hệ xã hội được pháp luật xác lập và bảo vệ.

II. BỐN DẤU HIỆU ĐẶC TRƯNG CƠ BẢN:
1. Là hành vi xác định của con người: Phải thể hiện ra thế giới khách quan dưới dạng hành động (đánh người, trộm cắp) hoặc không hành động (trốn thuế, không cứu giúp người đang gặp nguy hiểm). Ý nghĩ, tư tưởng thuần túy trong đầu không bị coi là vi phạm pháp luật.
2. Có tính chất trái pháp luật: Hành vi không phù hợp với quy định của pháp luật (làm điều pháp luật cấm, không làm điều pháp luật bắt buộc hoặc vượt quá giới hạn pháp luật cho phép).
3. Có lỗi của chủ thể: Chủ thể nhận thức được hành vi của mình và hậu quả nguy hại, nhưng vẫn cố ý hoặc vô ý thực hiện. Nếu do sự kiện bất ngờ hoặc bất khả kháng thì không có lỗi và không coi là vi phạm pháp luật.
4. Do chủ thể có năng lực trách nhiệm pháp lý thực hiện: Chủ thể phải đạt độ tuổi luật định và có khả năng nhận thức, điều khiển hành vi của mình (người mắc bệnh tâm thần làm mất khả năng nhận thức không phải là chủ thể của vi phạm pháp luật)."""
    },
    {
        "sample_id": "SFT_TMU_CH5_002",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày phân loại trách nhiệm pháp lý theo giáo trình.",
        "input": "Phân biệt trách nhiệm pháp lý với các loại trách nhiệm xã hội khác? Các loại trách nhiệm pháp lý?",
        "output": """I. PHÂN BIỆT TRÁCH NHIỆM PHÁP LÝ VỚI TRÁCH NHIỆM XÃ HỘI KHÁC:
- Trách nhiệm pháp lý luôn gắn liền với sự cưỡng chế của Nhà nước, do các cơ quan nhà nước có thẩm quyền áp dụng theo trình tự, thủ tục luật định chặt chẽ đối với chủ thể vi phạm pháp luật.
- Các trách nhiệm xã hội khác (đạo đức, tôn giáo, chính trị) chỉ được bảo đảm bằng lương tâm, dư luận xã hội, niềm tin tôn giáo hoặc kỷ luật nội bộ đảng phái, không mang tính cưỡng chế nhà nước.

II. BỐN LOẠI TRÁCH NHIỆM PHÁP LÝ CHỦ YẾU:
1. Trách nhiệm hình sự: Loại trách nhiệm nghiêm khắc nhất do Tòa án áp dụng đối với người phạm tội bằng các hình phạt trong Bộ luật Hình sự (tù có thời hạn, tù chung thân, tử hình...).
2. Trách nhiệm hành chính: Do các cơ quan quản lý nhà nước áp dụng đối với cá nhân, tổ chức vi phạm hành chính (cảnh cáo, phạt tiền, tước giấy phép...).
3. Trách nhiệm dân sự: Do Tòa án hoặc các chủ thể áp dụng nhằm khôi phục lại tình trạng tài sản và bù đắp tổn thất tinh thần cho bên bị thiệt hại (bồi thường thiệt hại, phạt vi phạm...).
4. Trách nhiệm kỷ luật: Do thủ trưởng cơ quan, đơn vị áp dụng đối với cán bộ, công chức, viên chức, người lao động vi phạm nội quy, kỷ luật công vụ (khiển trách, cảnh cáo, cách chức, buộc thôi việc...)."""
    },

    # -------------------------------------------------------------------------
    # CHƯƠNG 6: MỘT SỐ NỘI DUNG CƠ BẢN CỦA LUẬT DÂN SỰ
    # -------------------------------------------------------------------------
    {
        "sample_id": "SFT_TMU_CH6_001",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày điều kiện công nhận một tổ chức là pháp nhân theo Bộ luật Dân sự 2015.",
        "input": "Phân tích các điều kiện công nhận một tổ chức là pháp nhân? Cho ví dụ minh họa?",
        "output": """I. ĐIỀU KIỆN CÔNG NHẬN PHÁP NHÂN (ĐIỀU 74 BLDS 2015):
Một tổ chức được công nhận là pháp nhân khi có đủ 4 điều kiện sau:
1. Được thành lập một cách hợp pháp: Theo trình tự, thủ tục do Bộ luật Dân sự và các luật chuyên ngành quy định (đăng ký doanh nghiệp, quyết định thành lập của cơ quan nhà nước).
2. Có cơ cấu tổ chức chặt chẽ: Có cơ quan điều hành và các phòng ban tổ chức theo điều lệ hoặc quyết định thành lập của pháp nhân.
3. Có tài sản độc lập với cá nhân, pháp nhân khác và tự chịu trách nhiệm bằng tài sản đó: Tài sản của pháp nhân tách biệt hoàn toàn khỏi tài sản riêng của các thành viên sáng lập; trách nhiệm của pháp nhân là trách nhiệm hữu hạn trong phạm vi tài sản của mình.
4. Nhân danh mình tham gia các quan hệ pháp luật một cách độc lập: Tự mình đứng tên ký kết hợp đồng, tham gia tố tụng tại Tòa án với tư cách nguyên đơn, bị đơn dân sự.

II. VÍ DỤ MINH HỌA:
- Công ty Cổ phần Sữa Việt Nam (Vinamilk) là pháp nhân vì được thành lập hợp pháp, có điều lệ và hội đồng quản trị, có vốn điều lệ và tài sản riêng, tự nhân danh công ty ký kết hợp đồng thương mại.
- Doanh nghiệp tư nhân hoặc Hộ kinh doanh cá thể KHÔNG phải là pháp nhân vì không có tài sản độc lập (chủ doanh nghiệp phải chịu trách nhiệm vô hạn bằng toàn bộ tài sản của cá nhân mình)."""
    },
    {
        "sample_id": "SFT_TMU_CH6_002",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày điều kiện có hiệu lực của giao dịch dân sự và hậu quả khi giao dịch vô hiệu.",
        "input": "Phân tích khái niệm và điều kiện có hiệu lực của giao dịch dân sự? Hậu quả pháp lý của giao dịch dân sự vô hiệu?",
        "output": """I. ĐIỀU KIỆN CÓ HIỆU LỰC CỦA GIAO DỊCH DÂN SỰ (ĐIỀU 117 BLDS 2015):
Giao dịch dân sự có hiệu lực khi đáp ứng đủ các điều kiện sau:
1. Chủ thể có năng lực pháp luật dân sự, năng lực hành vi dân sự phù hợp với giao dịch được xác lập.
2. Chủ thể tham gia giao dịch hoàn toàn tự nguyện (không bị lừa dối, đe dọa, cưỡng ép).
3. Mục đích và nội dung của giao dịch dân sự không vi phạm điều cấm của luật, không trái đạo đức xã hội.
4. Hình thức của giao dịch dân sự phù hợp với quy định của luật trong trường hợp luật có quy định (bằng văn bản, có công chứng/chứng thực đối với chuyển nhượng bất động sản).

II. HẬU QUẢ PHÁP LÝ KHI GIAO DỊCH DÂN SỰ VÔ HIỆU (ĐIỀU 131 BLDS 2015):
1. Giao dịch dân sự vô hiệu không làm phát sinh, thay đổi, chấm dứt quyền, nghĩa vụ dân sự của các bên kể từ thời điểm giao dịch được xác lập.
2. Khôi phục tình trạng ban đầu, hoàn trả cho nhau những gì đã nhận; nếu không hoàn trả được bằng hiện vật thì phải trị giá thành tiền để hoàn trả.
3. Bên ngay tình trong việc thu hoa lợi, lợi tức không phải hoàn trả hoa lợi, lợi tức đó.
4. Bên có lỗi làm cho giao dịch vô hiệu mà gây thiệt hại thì phải bồi thường cho bên kia."""
    },
    {
        "sample_id": "SFT_TMU_CH6_003",
        "intent_code": "CIVIL_INHERIT",
        "instruction": "Trình bày các trường hợp không được quyền hưởng di sản thừa kế theo Điều 621 BLDS 2015.",
        "input": "Nêu chủ thể của quan hệ pháp luật thừa kế? Phân tích những trường hợp người thừa kế không được quyền hưởng di sản do người chết để lại?",
        "output": """I. CHỦ THỂ CỦA QUAN HỆ THỪA KẾ:
1. Người để lại di sản: Chỉ có thể là CÁ NHÂN có tài sản sau khi chết.
2. Người thừa kế: Là cá nhân còn sống vào thời điểm mở thừa kế (hoặc sinh ra và còn sống sau thời điểm mở thừa kế nhưng đã thành thai trước khi người để lại di sản chết - Điều 613 BLDS 2015); hoặc cơ quan, tổ chức còn tồn tại vào thời điểm mở thừa kế nếu được chỉ định theo di chúc.

II. 4 TRƯỜNG HỢP KHÔNG ĐƯỢC HƯỞNG DI SẢN (ĐIỀU 621 BLDS 2015):
1. Người bị kết án về hành vi cố ý xâm phạm tính mạng, sức khỏe hoặc ngược đãi nghiêm trọng, hành hạ người để lại di sản, xâm phạm nghiêm trọng danh dự, nhân phẩm của người đó.
2. Người vi phạm nghiêm trọng nghĩa vụ nuôi dưỡng người để lại di sản.
3. Người bị kết án về hành vi cố ý xâm phạm tính mạng người thừa kế khác nhằm chiếm đoạt một phần hoặc toàn bộ phần di sản mà người đó được hưởng.
4. Người có hành vi lừa dối, cưỡng ép hoặc ngăn cản người để lại di sản trong việc lập di chúc; giả mạo di chúc, sửa chữa di chúc, hủy di chúc, che giấu di chúc nhằm hưởng di sản trái ý chí của người để lại di sản.

* Ngoại lệ: Nếu người để lại di sản đã biết rõ các hành vi trên nhưng vẫn cho họ được hưởng di sản theo di chúc thì họ vẫn được nhận di sản theo di chúc đó."""
    },
    {
        "sample_id": "SFT_TMU_CH6_004",
        "intent_code": "CIVIL_INHERIT",
        "instruction": "Trình bày về người thừa kế không phụ thuộc nội dung di chúc theo Điều 644 BLDS 2015.",
        "input": "Phân tích trường hợp người được hưởng di sản không phụ thuộc vào nội dung của di chúc?",
        "output": """I. Ý NGHĨA PHÁP LÝ CỦA ĐIỀU 644 BLDS 2015:
Quy định nhằm bảo vệ quyền lợi chính đáng của những người thân thích gần gũi nhất, phụ thuộc kinh tế vào người đã chết, phản ánh truyền thống đạo lý gia đình Việt Nam, hạn chế quyền định đoạt tuyệt đối của người lập di chúc.

II. CÁC ĐỐI TƯỢNG ĐƯỢC BẢO VỆ:
Bao gồm:
1. Cha đẻ, mẹ đẻ, cha nuôi, mẹ nuôi của người chết.
2. Vợ hoặc chồng hợp pháp của người chết.
3. Con chưa thành niên (dưới 18 tuổi).
4. Con đã thành niên (từ đủ 18 tuổi trở lên) nhưng không có khả năng lao động.

III. MỨC HƯỞNG BẢO VỆ:
- Những người trên được hưởng phần di sản bằng HAI PHẦN BA (2/3) SUẤT THỪA KẾ THEO PHÁP LUẬT (nếu di sản được chia theo luật), trong trường hợp họ không được người lập di chúc cho hưởng di sản hoặc chỉ cho hưởng phần di sản ít hơn 2/3 suất đó.
- Không áp dụng đối với người từ chối nhận di sản (Điều 620) hoặc người không có quyền hưởng di sản (Điều 621 BLDS 2015)."""
    },

    # -------------------------------------------------------------------------
    # CHƯƠNG 7: MỘT SỐ NỘI DUNG CƠ BẢN CỦA LUẬT HÌNH SỰ
    # -------------------------------------------------------------------------
    {
        "sample_id": "SFT_TMU_CH7_001",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày định nghĩa tội phạm và 4 phân loại tội phạm theo Điều 9 BLHS 2015.",
        "input": "Trình bày khái niệm tội phạm, đặc điểm của tội phạm và phân loại tội phạm?",
        "output": """I. KHÁI NIỆM TỘI PHẠM (KHOẢN 1 ĐIỀU 8 BLHS 2015):
Tội phạm là hành vi nguy hiểm cho xã hội được quy định trong Bộ luật Hình sự, do người có năng lực trách nhiệm hình sự hoặc pháp nhân thương mại thực hiện một cách cố ý hoặc vô ý, xâm phạm các quan hệ xã hội được pháp luật hình sự bảo vệ.

II. PHÂN LOẠI TỘI PHẠM THEO ĐIỀU 9 BLHS 2015:
Căn cứ vào tính chất và mức độ nguy hiểm cho xã hội, tội phạm được phân thành 4 loại:
1. Tội phạm ít nghiêm trọng: Tính chất nguy hiểm không lớn; mức cao nhất của khung hình phạt là phạt tiền, phạt cải tạo không giam giữ hoặc phạt tù đến 03 năm.
2. Tội phạm nghiêm trọng: Tính chất nguy hiểm lớn; mức cao nhất của khung hình phạt là từ trên 03 năm tù đến 07 năm tù.
3. Tội phạm rất nghiêm trọng: Tính chất nguy hiểm rất lớn; mức cao nhất của khung hình phạt là từ trên 07 năm tù đến 15 năm tù.
4. Tội phạm đặc biệt nghiêm trọng: Tính chất nguy hiểm đặc biệt lớn; mức cao nhất của khung hình phạt là từ trên 15 năm tù đến 20 năm tù, tù chung thân hoặc tử hình."""
    },
    {
        "sample_id": "SFT_TMU_CH7_002",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày nội dung pháp lý về đồng phạm, phòng vệ chính đáng và tình thế cấp thiết theo BLHS 2015.",
        "input": "Trình bày nội dung pháp lý về đồng phạm, phòng vệ chính đáng và tình thế cấp thiết?",
        "output": """I. ĐỒNG PHẠM (ĐIỀU 17 BLHS 2015):
1. Khái niệm: Là trường hợp có 2 người trở lên cố ý cùng thực hiện một tội phạm.
2. Các loại người trong đồng phạm:
- Người thực hành: Người trực tiếp thực hiện tội phạm.
- Người tổ chức: Người chủ mưu, cầm đầu, chỉ huy việc thực hiện tội phạm.
- Người xúi giục: Người kích động, dụ dỗ, thúc đẩy người khác thực hiện tội phạm.
- Người giúp sức: Người tạo điều kiện tinh thần hoặc vật chất cho việc thực hiện tội phạm.

II. PHÒNG VỆ CHÍNH ĐÁNG (ĐIỀU 22 BLHS 2015):
- Là hành vi của người vì bảo vệ quyền hoặc lợi ích chính đáng của mình, của người khác hoặc lợi ích của Nhà nước, tổ chức mà chống trả lại một cách cần thiết người đang có hành vi xâm phạm các lợi ích nói trên.
- Phòng vệ chính đáng KHÔNG PHẢI LÀ TỘI PHẠM. Người vượt quá giới hạn phòng vệ chính đáng phải chịu trách nhiệm hình sự về hành vi vượt quá.

III. TÌNH THẾ CẤP THIẾT (ĐIỀU 23 BLHS 2015):
- Là tình thế của người vì muốn tránh gây thiệt hại cho quyền, lợi ích hợp pháp của mình, của người khác hoặc lợi ích Nhà nước mà không còn cách nào khác là phải gây một thiệt hại nhỏ hơn thiệt hại cần ngăn ngừa.
- Hành vi gây thiệt hại trong tình thế cấp thiết KHÔNG PHẢI LÀ TỘI PHẠM."""
    },
    {
        "sample_id": "SFT_TMU_CH7_003",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày 4 hình thức lỗi trong luật hình sự theo Điều 10, 11 BLHS 2015.",
        "input": "Trình bày về các loại lỗi trong luật hình sự, qua đó phân biệt các loại lỗi?",
        "output": """I. BỐN LOẠI LỖI TRONG LUẬT HÌNH SỰ (ĐIỀU 10, 11 BLHS 2015):

1. LỖI CỐ Ý TRỰC TIẾP:
- Lý trí: Nhận thức rõ hành vi của mình là nguy hiểm cho xã hội, thấy trước hậu quả tất yếu hoặc có thể xảy ra.
- Ý chí: Mong muốn hậu quả đó xảy ra (Ví dụ: dùng dao đâm vào tim nạn nhân để giết người).

2. LỖI CỐ Ý GIÁN TIẾP:
- Lý trí: Nhận thức rõ hành vi nguy hiểm cho xã hội, thấy trước hậu quả có thể xảy ra.
- Ý chí: Tuy không mong muốn nhưng có ý thức để mặc cho hậu quả xảy ra (Ví dụ: chăng dây điện trần bẫy chuột quanh ruộng lúa khiến người đi qua giật tử vong).

3. LỖI VÔ Ý VÌ QUÁ TỰ TIN:
- Lý trí: Thấy trước hành vi của mình có thể gây ra hậu quả nguy hại cho xã hội.
- Ý chí: Tin tưởng rằng hậu quả đó sẽ không xảy ra hoặc có thể tự mình ngăn ngừa được nhưng thực tế hậu quả xảy ra (Ví dụ: tài xế phóng nhanh vượt ẩu vì tự tin tay lái lụa dẫn tới tông xe).

4. LỖI VÔ Ý DO CẨU THẢ:
- Lý trí: Không thấy trước hành vi của mình có thể gây ra hậu quả nguy hại cho xã hội.
- Ý chí: Mặc dù pháp luật buộc phải thấy trước và có thể thấy trước hậu quả đó (Ví dụ: y tá tiêm nhầm thuốc cho bệnh nhân do không kiểm tra nhãn thuốc)."""
    },

    # -------------------------------------------------------------------------
    # CHƯƠNG 8: MỘT SỐ NỘI DUNG CƠ BẢN CỦA LUẬT HÀNH CHÍNH
    # -------------------------------------------------------------------------
    {
        "sample_id": "SFT_TMU_CH8_001",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày định nghĩa vi phạm hành chính và phân tích các dấu hiệu cấu thành.",
        "input": "Phân tích khái niệm vi phạm hành chính? Phân tích các dấu hiệu cấu thành của vi phạm hành chính và phân biệt với tội phạm?",
        "output": """I. KHÁI NIỆM VI PHẠM HÀNH CHÍNH (KHOẢN 1 ĐIỀU 2 LUẬT XLVPHC 2012):
Vi phạm hành chính là hành vi có lỗi do cá nhân, tổ chức thực hiện, vi phạm quy định của pháp luật về quản lý nhà nước mà không phải là tội phạm và theo quy định của pháp luật phải bị xử phạt vi phạm hành chính.

II. BỐN YẾU TỐ CẤU THÀNH VI PHẠM HÀNH CHÍNH:
1. Mặt khách quan: Hành vi xâm phạm các quy tắc quản lý nhà nước bị pháp luật hành chính nghiêm cấm (hành động hoặc không hành động).
2. Mặt chủ quan: Lỗi của chủ thể (cố ý hoặc vô ý).
3. Khách thể: Trật tự quản lý hành chính nhà nước trên các lĩnh vực (giao thông, trật tự đô thị, kinh doanh, môi trường...).
4. Chủ thể: Cá nhân hoặc tổ chức có năng lực trách nhiệm hành chính (cá nhân từ đủ 14 đến dưới 16 tuổi chịu phạt khi cố ý; từ đủ 16 tuổi trở lên chịu phạt về mọi vi phạm).

III. PHÂN BIỆT VI PHẠM HÀNH CHÍNH VÀ TỘI PHẠM HÌNH SỰ:
- Mức độ nguy hiểm: Tội phạm có mức độ nguy hiểm cao độ cho xã hội; vi phạm hành chính có mức độ nguy hiểm thấp hơn.
- Chế tài áp dụng: Tội phạm bị áp dụng hình phạt theo BLHS do Tòa án quyết định; vi phạm hành chính bị áp dụng các hình thức xử phạt hành chính (phạt tiền, tịch thu...) do cơ quan hành chính nhà nước quyết định.
- Hậu quả pháp lý: Tội phạm để lại án tích; vi phạm hành chính không để lại án tích (chỉ coi là chưa bị xử lý sau 1 năm nếu không tái phạm)."""
    },
    {
        "sample_id": "SFT_TMU_CH8_002",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày các hình thức xử phạt hành chính và biện pháp xử lý hành chính theo Luật XLVPHC 2012.",
        "input": "Trình bày các hình thức xử phạt hành chính và các biện pháp xử lý hành chính khác?",
        "output": """I. CÁC HÌNH THỨC XỬ PHẠT VI PHẠM HÀNH CHÍNH (ĐIỀU 21 LUẬT XLVPHC 2012):
1. Cảnh cáo.
2. Phạt tiền.
3. Tước quyền sử dụng giấy phép, chứng chỉ hành nghề có thời hạn hoặc đình chỉ hoạt động có thời hạn.
4. Tịch thu tang vật vi phạm hành chính, phương tiện được sử dụng để vi phạm hành chính.
5. Trục xuất (áp dụng đối với người nước ngoài).

II. CÁC BIỆN PHÁP KHẮC PHỤC HẬU QUẢ:
- Buộc khôi phục lại tình trạng ban đầu; buộc tháo dỡ công trình xây dựng trái phép;
- Buộc thực hiện biện pháp khắc phục tình trạng ô nhiễm môi trường;
- Buộc tiêu hủy hàng hóa, vật phẩm gây hại cho sức khỏe con người, vật nuôi, cây trồng.

III. CÁC BIỆN PHÁP XỬ LÝ HÀNH CHÍNH KHÁC:
1. Giáo dục tại xã, phường, thị trấn.
2. Đưa vào trường giáo dưỡng (áp dụng cho người từ đủ 12 đến dưới 18 tuổi).
3. Đưa vào cơ sở giáo dục bắt buộc.
4. Đưa vào cơ sở cai nghiện bắt buộc."""
    },

    # -------------------------------------------------------------------------
    # CHƯƠNG 9: PHÁP LUẬT VỀ PHÒNG, CHỐNG THAM NHŨNG
    # -------------------------------------------------------------------------
    {
        "sample_id": "SFT_TMU_CH9_001",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Phân tích các dấu hiệu đặc trưng của tham nhũng và các hành vi tham nhũng theo Luật PCTN.",
        "input": "Phân tích các dấu hiệu đặc trưng của tham nhũng? Phân tích các hành vi tham nhũng theo quy định của pháp luật Việt Nam?",
        "output": """I. ĐỊNH NGHĨA VÀ 3 DẤU HIỆU ĐẶC TRƯNG CỦA THAM NHŨNG:
Tham nhũng là hành vi của người có chức vụ, quyền hạn đã lợi dụng chức vụ, quyền hạn đó vì vụ lợi. Gồm 3 dấu hiệu cốt lõi:
1. Dấu hiệu chủ thể: Phải là người có chức vụ, quyền hạn (do bổ nhiệm, bầu cử, tuyển dụng, hợp đồng trong cơ quan, tổ chức, doanh nghiệp).
2. Dấu hiệu hành vi: Lợi dụng chức vụ, quyền hạn được giao như một công cụ, phương tiện để làm trái quy định công vụ.
3. Dấu hiệu mục đích: Vì vụ lợi (nhằm đạt được lợi ích vật chất hoặc lợi ích phi vật chất cho bản thân hoặc người khác).

II. CÁC HÀNH VI THAM NHŨNG ĐIỂN HÌNH THEO LUẬT PHÒNG CHỐNG THAM NHŨNG:
1. Tham ô tài sản.
2. Nhận hối lộ.
3. Lạm dụng chức vụ, quyền hạn chiếm đoạt tài sản.
4. Lợi dụng chức vụ, quyền hạn trong khi thi hành nhiệm vụ, công vụ vì vụ lợi.
5. Lạm quyền trong khi thi hành nhiệm vụ, công vụ vì vụ lợi.
6. Lợi dụng chức vụ, quyền hạn gây ảnh hưởng đối với người khác để trục lợi.
7. Giả mạo trong công tác vì vụ lợi.
8. Đưa hối lộ, môi giới hối lộ được thực hiện bởi người có chức vụ, quyền hạn để giải quyết công việc vì vụ lợi.
9. Nhũng nhiễu vì vụ lợi.
10. Sử dụng trái phép tài sản công vì vụ lợi."""
    },
    {
        "sample_id": "SFT_TMU_CH9_002",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày các biện pháp phòng ngừa tham nhũng theo Luật Phòng, chống tham nhũng.",
        "input": "Trình bày các biện pháp phòng ngừa tham nhũng trong pháp luật về phòng chống tham nhũng ở nước ta hiện nay? Cho biết ý nghĩa của các biện pháp đó?",
        "output": """I. CÁC BIỆN PHÁP PHÒNG NGỪA THAM NHŨNG TRỌNG TÂM:
1. Công khai, minh bạch về tổ chức và hoạt động của cơ quan, tổ chức, đơn vị: Công khai ngân sách, mua sắm công, tuyển dụng cán bộ để người dân và xã hội giám sát.
2. Xây dựng và thực hiện định mức, chế độ, tiêu chuẩn: Ngăn chặn việc lạm dụng tài sản công, chi tiêu sai tiêu chuẩn.
3. Thực hiện quy tắc ứng xử, đạo đức nghề nghiệp và chuyển đổi vị trí công tác của cán bộ, công chức: Nhằm triệt tiêu môi trường và điều kiện câu kết hình thành tiêu cực kéo dài.
4. Minh bạch tài sản, thu nhập: Kê khai tài sản, thu nhập hàng năm của cán bộ diện quản lý; giải trình nguồn gốc tài sản tăng thêm.
5. Cải cách hành chính, ứng dụng công nghệ thông tin và thanh toán không dùng tiền mặt: Giảm tối đa tiếp xúc trực tiếp giữa công chức và người dân, thực hiện dịch vụ công trực tuyến để loại bỏ nạn vòi vĩnh, phong bì.

II. Ý NGHĨA:
Các biện pháp phòng ngừa giúp tạo cơ chế \"không thể tham nhũng, không dám tham nhũng và không muốn tham nhũng\", bảo vệ sự trong sạch của bộ máy nhà nước và củng cố lòng tin của nhân dân."""
    },
    # --- CÁC MẪU BỔ SUNG CHI TIẾT TỪ GIÁO TRÌNH TMU 2021 ---
    {
        "sample_id": "SFT_TMU_EXTRA_001",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày 3 yếu tố cấu thành hình thức nhà nước theo giáo trình.",
        "input": "Hình thức nhà nước là gì? Hình thức nhà nước gồm những yếu tố nào?",
        "output": """I. KHÁI NIỆM HÌNH THỨC NHÀ NƯỚC:
Hình thức nhà nước là cách thức tổ chức quyền lực nhà nước và phương pháp thực hiện quyền lực nhà nước của giai cấp thống trị.

II. BA YẾU TỐ HỢP THÀNH HÌNH THỨC NHÀ NƯỚC:
1. Hình thức chính thể: Là cách thức tổ chức và trình tự thành lập các cơ quan quyền lực tối cao của nhà nước (gồm Chính thể Quân chủ và Chính thể Cộng hòa).
2. Hình thức cấu trúc nhà nước: Là cách thức phân chia nhà nước thành các đơn vị hành chính - lãnh thổ và mối quan hệ giữa trung ương với địa phương (gồm Nhà nước đơn nhất và Nhà nước liên bang).
3. Chế độ chính trị: Tổng thể các phương pháp, thủ đoạn mà nhà nước sử dụng để thực thi quyền lực nhà nước (gồm Phương pháp dân chủ và Phương pháp phản dân chủ).

III. LIÊN HỆ VIỆT NAM:
- Chính thể: Cộng hòa dân chủ.
- Cấu trúc: Nhà nước đơn nhất.
- Chế độ chính trị: Dân chủ xã hội chủ nghĩa."""
    },
    {
        "sample_id": "SFT_TMU_EXTRA_002",
        "intent_code": "CIVIL_INHERIT",
        "instruction": "Phân tích quyền chiếm hữu tài sản theo quy định của Bộ luật Dân sự 2015.",
        "input": "Thế nào là quyền chiếm hữu? Chiếm hữu có căn cứ pháp luật và chiếm hữu không có căn cứ pháp luật khác nhau như thế nào?",
        "output": """I. KHÁI NIỆM QUYỀN CHIẾM HỮU (ĐIỀU 179 BLDS 2015):
Chiếm hữu là việc chủ thể nắm giữ, chi phối tài sản một cách trực tiếp hoặc gián tiếp như chủ thể có quyền đối với tài sản.

II. PHÂN BIỆT CÁC LOẠI CHIẾM HỮU:
1. Chiếm hữu có căn cứ pháp luật (Điều 165 BLDS 2015):
- Chủ sở hữu tự chiếm hữu tài sản của mình.
- Người được chủ sở hữu ủy quyền quản lý tài sản.
- Người được chuyển giao quyền chiếm hữu thông qua giao dịch dân sự hợp pháp (thuê, mượn, gửi giữ).
- Người phát hiện và giữ tài sản vô chủ, đánh rơi, chôn giấu, gia súc thất lạc theo đúng điều kiện luật định.
2. Chiếm hữu không có căn cứ pháp luật: Là việc chiếm hữu không dựa trên các căn cứ tại Điều 165. Gồm 2 dạng:
- Chiếm hữu ngay tình: Người chiếm hữu không biết và không thể biết việc chiếm hữu của mình là không có căn cứ pháp luật (Ví dụ: mua phải chiếc xe do trộm cắp bán nhưng có giấy tờ đầy đủ và người mua tin tưởng hợp pháp).
- Chiếm hữu không ngay tình: Người chiếm hữu biết rõ hoặc buộc phải biết việc chiếm hữu của mình là trái pháp luật (Ví dụ: mua xe gian giá rẻ không giấy tờ, nhặt được của rơi nhưng cố tình cất giấu sử dụng)."""
    },
    {
        "sample_id": "SFT_TMU_EXTRA_003",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày hệ thống hình phạt đối với cá nhân phạm tội theo Bộ luật Hình sự 2015.",
        "input": "Hình phạt là gì? Phân tích các loại hình phạt chính và hình phạt bổ sung trong Luật Hình sự Việt Nam?",
        "output": """I. KHÁI NIỆM HÌNH PHẠT (ĐIỀU 30 BLHS 2015):
Hình phạt là biện pháp cưỡng chế nghiêm khắc nhất của Nhà nước được quy định trong Bộ luật Hình sự, do Tòa án quyết định áp dụng đối với người hoặc pháp nhân thương mại phạm tội nhằm tước bỏ hoặc hạn chế quyền, lợi ích của họ.

II. HỆ THỐNG HÌNH PHẠT ĐỐI VỚI CÁ NHÂN (ĐIỀU 32 BLHS 2015):
1. BẢY HÌNH PHẠT CHÍNH (mỗi tội phạm chỉ áp dụng một hình phạt chính):
- Cảnh cáo: Khiển trách công khai của Nhà nước đối với tội ít nghiêm trọng có nhiều tình tiết giảm nhẹ.
- Phạt tiền: Áp dụng đối với tội ít nghiêm trọng, nghiêm trọng hoặc một số tội xâm phạm kinh tế, môi trường.
- Cải tạo không giam giữ: Từ 06 tháng đến 03 năm, không cách ly khỏi xã hội.
- Trục xuất: Buộc người nước ngoài phạm tội rời khỏi lãnh thổ Việt Nam.
- Tù có thời hạn: Từ 03 tháng đến 20 năm, giam giữ tại trại giam.
- Tù chung thân: Tù không thời hạn đối với tội đặc biệt nghiêm trọng (không áp dụng người dưới 18 tuổi).
- Tử hình: Tước bỏ quyền sống, áp dụng cho tội đặc biệt nghiêm trọng xâm phạm an ninh quốc gia, tính mạng (không áp dụng người dưới 18 tuổi, phụ nữ có thai/nuôi con dưới 36 tháng, người từ đủ 75 tuổi trở lên).

2. BẢY HÌNH PHẠT BỔ SUNG (có thể áp dụng kèm hình phạt chính):
- Cấm đảm nhiệm chức vụ, cấm hành nghề hoặc làm công việc nhất định (1 - 5 năm).
- Cấm cư trú (1 - 5 năm).
- Quản chế (1 - 5 năm).
- Tước một số quyền công dân (1 - 5 năm).
- Tịch thu tài sản.
- Phạt tiền (khi không áp dụng là hình phạt chính).
- Trục xuất (khi không áp dụng là hình phạt chính)."""
    },
    {
        "sample_id": "SFT_TMU_EXTRA_004",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày về quy tắc ứng xử, đạo đức nghề nghiệp của cán bộ công chức phòng chống tham nhũng.",
        "input": "Quy tắc ứng xử của cán bộ, công chức và việc chuyển đổi vị trí công tác có vai trò như thế nào trong phòng chống tham nhũng?",
        "output": """I. QUY TẮC ỨNG XỬ VÀ ĐẠO ĐỨC NGHỀ NGHIỆP CỦA CÁN BỘ, CÔNG CHỨC:
1. Khái niệm: Là các chuẩn mực xử sự của cán bộ, công chức, viên chức trong thi hành nhiệm vụ, công vụ và trong quan hệ xã hội, bao gồm những việc phải làm hoặc không được làm.
2. Những điều cán bộ, công chức không được làm (Luật PCTN):
- Không được cửa quyền, hách dịch, nhũng nhiễu, gây khó khăn phiền hà cho nhân dân.
- Không được thành lập, tham gia quản lý, điều hành doanh nghiệp tư nhân, công ty TNHH, công ty cổ phần trong lĩnh vực mình quản lý.
- Không được nhận tiền, tài sản hoặc lợi ích vật chất khác của cơ quan, tổ chức, cá nhân liên quan đến công việc do mình giải quyết.
- Không được bố trí vợ/chồng, bố, mẹ, con, anh chị em ruột giữ chức vụ quản lý về nhân sự, kế toán - thủ quỹ trong cơ quan, đơn vị mình đứng đầu.

II. Ý NGHĨA CỦA VIỆC CHUYỂN ĐỔI VỊ TRÍ CÔNG TÁC:
- Áp dụng định kỳ đối với các vị trí công tác nhạy cảm liên quan đến ngân sách, tài chính công, cấp phép đầu tư, quản lý đất đai, hải quan, thuế, xây dựng.
- Mục đích: Chủ động phòng ngừa tham nhũng, triệt tiêu môi trường và điều kiện cấu kết hình thành các \"đường dây lợi ích nhóm\" khép kín giữa người quản lý với các đối tượng bị quản lý."""
    },
    {
        "sample_id": "SFT_TMU_EXTRA_005",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày các biện pháp ngăn chặn và bảo đảm xử phạt vi phạm hành chính.",
        "input": "Các biện pháp ngăn chặn và bảo đảm việc xử phạt vi phạm hành chính gồm những biện pháp nào?",
        "output": """I. MỤC ĐÍCH CỦA CÁC BIỆN PHÁP NGĂN CHẶN:
Nhằm kịp thời ngăn chặn vi phạm hành chính hoặc để bảo đảm việc xử lý vi phạm hành chính được nghiêm minh, đúng pháp luật.

II. HỆ THỐNG CÁC BIỆN PHÁP NGĂN CHẶN (ĐIỀU 119 LUẬT XLVPHC 2012):
1. Tạm giữ người theo thủ tục hành chính.
2. Áp giải người vi phạm.
3. Tạm giữ tang vật, phương tiện vi phạm hành chính, giấy phép, chứng chỉ hành nghề.
4. Khám người theo thủ tục hành chính.
5. Khám phương tiện vận tải, đồ vật.
6. Khám nơi cất giấu tang vật, phương tiện vi phạm hành chính.
7. Bảo lãnh hành chính.
8. Quản lý người nước ngoài vi phạm pháp luật trong thời gian chờ thủ tục trục xuất.
9. Truy tìm đối tượng trốn chấp hành quyết định đưa vào trường giáo dưỡng, cơ sở giáo dục, cơ sở cai nghiện bắt buộc."""
    }
]

