"""
=============================================================================
VietLawAssist — Bộ dữ liệu Chuẩn Barem Bài giảng Pháp luật Đại cương
(Trường Đại học Kinh tế - Đại học Đà Nẵng, Khoa Luật, 2020)
=============================================================================
Tích hợp toàn diện 7 Chương:
- Chương 1: Nguồn gốc nhà nước (phi Mác-xít, Mác-Lênin, 3 lần phân công LĐ), Bản chất, 5 dấu hiệu, Kiểu & Hình thức NN.
- Chương 2: Bộ máy Nhà nước CHXHCN Việt Nam (Quốc hội, HĐND, Chủ tịch nước, Chính phủ, Tòa án, VKS; 5 nguyên tắc).
- Chương 3: Khái niệm, nguồn gốc, bản chất, 3 thuộc tính, 3 chức năng và 4 kiểu pháp luật.
- Chương 4: Quy phạm pháp luật (Giả định, Quy định, Chế tài), Quan hệ pháp luật (Chủ thể, Khách thể, Nội dung, Sự kiện pháp lý) & Hệ thống VBQPPL (Luật Ban hành VBQPPL 2015, hiệu lực thời gian/không gian/đối tượng, hồi tố).
- Chương 5: Thực hiện pháp luật (Tuân thủ, Thi hành, Sử dụng, Áp dụng), Cấu thành 4 yếu tố VPPL, Trách nhiệm pháp lý.
- Chương 6: Hệ thống pháp luật (QPPL, Chế định, Ngành luật), Ý thức pháp luật (Hệ tư tưởng & Tâm lý), Pháp chế XHCN.
- Chương 7: Phòng, chống tham nhũng theo Luật PCTN 2018 & BLHS 2015 (Khái niệm, 3 dấu hiệu, 12 hành vi khu vực công, 3 hành vi khu vực tư, trách nhiệm công dân và người có chức vụ quyền hạn).
"""

DUE_LECTURE_SAMPLES = [
    # --- CHƯƠNG 1 (ĐH KINH TẾ ĐÀ NẴNG): NHÀ NƯỚC ---
    {
        "sample_id": "SFT_DUE_CH1_001",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày các học thuyết phi Mác-xít về nguồn gốc ra đời của Nhà nước theo bài giảng Đại học Kinh tế Đà Nẵng.",
        "input": "Các quan điểm phi Mác-xít về nguồn gốc ra đời của Nhà nước gồm những học thuyết nào? Giá trị và hạn chế của thuyết khế ước xã hội?",
        "output": """I. CÁC HỌC THUYẾT PHI MÁC-XÍT VỀ NGUỒN GỐC NHÀ NƯỚC:
1. Thuyết thần học (Ph. Ácvin, Masiten, Koct...): Thượng đế là người sắp đặt mọi trật tự xã hội, nhà nước do Thượng đế sáng tạo ra để bảo vệ trật tự chung, quyền lực nhà nước là vĩnh cửu và con người phải phục tùng ý chí của Chúa trời.
2. Thuyết gia trưởng (Aristote, Bodin): Nhà nước là kết quả phát triển tự nhiên của gia đình, quyền lực nhà nước tương tự quyền gia trưởng của người đứng đầu gia đình.
3. Thuyết bạo lực (Gumplôvích, E. Đuyrinh, Kauxky): Nhà nước xuất hiện trực tiếp từ việc sử dụng bạo lực của thị tộc này đối với thị tộc khác, thị tộc chiến thắng lập ra bộ máy nhà nước để nô dịch kẻ chiến bại.
4. Thuyết tâm lý (L. Petơrazitki, Phơređơ...): Nhà nước xuất hiện do nhu cầu tâm lý của con người nguyên thủy luôn muốn phụ thuộc vào thủ lĩnh, giáo sĩ; nhà nước là tổ chức của những siêu nhân có sứ mệnh lãnh đạo.
5. Thuyết khế ước xã hội (Grotius, Spinoza, Hobbes, Locke, Rousseau...): Nhà nước ra đời là kết quả của một bản hợp đồng (khế ước) được ký kết giữa các thành viên sống trong trạng thái tự nhiên.

II. GIÁ TRỊ VÀ HẠN CHẾ CỦA THUYẾT KHẾ ƯỚC XÃ HỘI:
1. Giá trị lịch sử và tính cách mạng:
- Đánh dấu bước tiến lớn trong nhận thức con người, giáng đòn mạnh mẽ vào thành trì phong kiến và thần quyền, chống lại sự chuyên quyền độc đoán.
- Khẳng định chủ quyền nhà nước thuộc về nhân dân; nếu nhà nước vi phạm quyền tự nhiên thì nhân dân có quyền lật đổ và ký kết khế ước mới.
2. Hạn chế:
- Đứng trên lập trường duy tâm chủ quan, coi nhà nước ra đời theo ý muốn chủ quan mà chưa giải thích được nguồn gốc vật chất kinh tế và bản chất giai cấp của nhà nước."""
    },
    {
        "sample_id": "SFT_DUE_CH1_002",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày 5 dấu hiệu đặc trưng cơ bản phân biệt Nhà nước với các tổ chức xã hội khác theo bài giảng ĐH Kinh tế Đà Nẵng.",
        "input": "Nêu và phân tích 5 dấu hiệu đặc trưng cơ bản của Nhà nước?",
        "output": """I. NĂM DẤU HIỆU ĐẶC TRƯNG CƠ BẢN CỦA NHÀ NƯỚC:
1. Nhà nước phân chia dân cư theo các đơn vị hành chính - lãnh thổ: Khác với thị tộc tập hợp theo huyết thống, nhà nước quản lý dân cư theo lãnh thổ (tỉnh, huyện, xã...) không phân biệt huyết thống, giới tính, nghề nghiệp. Dấu hiệu này làm xuất hiện chế định Quốc tịch gắn kết công dân với nhà nước.
2. Nhà nước thiết lập quyền lực công cộng đặc biệt: Nhà nước tách rời và đứng lên trên xã hội, có bộ máy chuyên nghiệp làm nhiệm vụ quản lý và cưỡng chế (quân đội, cảnh sát, tòa án, nhà tù).
3. Nhà nước có chủ quyền quốc gia: Quyền tối cao trong phạm vi lãnh thổ đối với mọi dân cư và tổ chức, quyền độc lập tự quyết trong chính sách đối nội và đối ngoại, bình đẳng với các quốc gia khác.
4. Nhà nước ban hành pháp luật và bảo đảm thực hiện bằng sức mạnh cưỡng chế: Nhà nước là chủ thể duy nhất có quyền ban hành các quy tắc xử sự mang tính bắt buộc chung trên toàn quốc.
5. Nhà nước quy định và tiến hành thu các loại thuế: Thuế là nguồn tài chính bắt buộc để nuôi dưỡng bộ máy nhà nước và phục vụ lợi ích công cộng; không một tổ chức nào ngoài nhà nước có quyền thu thuế.

II. ĐỊNH NGHĨA CHUNG:
Nhà nước là tổ chức đặc biệt của quyền lực chính trị, có bộ máy chuyên làm nhiệm vụ cưỡng chế và thực hiện chức năng quản lý xã hội nhằm bảo vệ lợi ích của giai cấp thống trị và duy trì trật tự xã hội."""
    },
    {
        "sample_id": "SFT_DUE_CH1_003",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày 4 kiểu nhà nước trong lịch sử và các con đường hình thành nhà nước điển hình theo Ăng-ghen.",
        "input": "Trình bày các kiểu nhà nước trong lịch sử và 3 hình thức xuất hiện nhà nước điển hình theo Ph. Ăng-ghen?",
        "output": """I. BỐN KIỂU NHÀ NƯỚC TRONG LỊCH SỬ (GẮN VỚI HÌNH THÁI KINH TẾ - XÃ HỘI):
1. Kiểu nhà nước chủ nô: Dựa trên chế độ chiếm hữu nô lệ, nhà nước bóc lột của giai cấp chủ nô.
2. Kiểu nhà nước phong kiến: Dựa trên chế độ sở hữu ruộng đất của địa chủ phong kiến, bóc lột địa tô đối với nông dân.
3. Kiểu nhà nước tư sản: Dựa trên chế độ chiếm hữu tư nhân tư bản chủ nghĩa, bóc lột giá trị thặng dư của giai cấp công nhân.
4. Kiểu nhà nước xã hội chủ nghĩa: Kiểu nhà nước tiến bộ nhất và cuối cùng trong lịch sử, của nhân dân lao động dưới sự lãnh đạo của Đảng Cộng sản, nhằm xóa bỏ áp bức bóc lột.

II. BA HÌNH THỨC XUẤT HIỆN NHÀ NƯỚC ĐIỂN HÌNH (THEO PH. ĂNG-GHEN):
1. Nhà nước Aten: Ra đời thuần túy và cổ điển nhất từ sự phân hóa nội bộ xã hội thị tộc do kinh tế phát triển và mâu thuẫn giai cấp đối kháng gay gắt.
2. Nhà nước La Mã: Ra đời từ thắng lợi của phong trào đấu tranh của giới bình dân chống lại quý tộc La Mã.
3. Nhà nước Giéc-manh: Ra đời do nhu cầu quản lý lãnh thổ rộng lớn sau khi người Giéc-manh đánh bại và xâm chiếm đế quốc La Mã cổ đại.
* Đặc thù phương Đông và Việt Nam: Nhà nước ra đời sớm chủ yếu do nhu cầu trị thủy (đắp đê, làm thủy lợi) và chống giặc ngoại xâm liên kết cộng đồng, mâu thuẫn giai cấp chưa gay gắt (Nhà nước Văn Lang thời Hùng Vương)."""
    },

    # --- CHƯƠNG 2 (ĐH KINH TẾ ĐÀ NẴNG): BỘ MÁY NHÀ NƯỚC CHXHCN VN ---
    {
        "sample_id": "SFT_DUE_CH2_001",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày 5 nguyên tắc cơ bản tổ chức và hoạt động của bộ máy Nhà nước CHXHCN Việt Nam.",
        "input": "Phân tích 5 nguyên tắc tổ chức và hoạt động của bộ máy Nhà nước CHXHCN Việt Nam theo Hiến pháp 2013?",
        "output": """I. NĂM NGUYÊN TẮC CƠ BẢN THEO HIẾN PHÁP 2013:
1. Nguyên tắc tất cả quyền lực nhà nước thuộc về Nhân dân (Điều 2): Quyền lực nhà nước là thống nhất trên nền tảng liên minh công nhân - nông dân - trí thức; nhân dân thực hiện quyền lực qua dân chủ đại diện (Quốc hội, HĐND) và dân chủ trực tiếp (trưng cầu ý dân, đóng góp dự thảo luật).
2. Nguyên tắc bảo đảm sự lãnh đạo của Đảng Cộng sản Việt Nam (Điều 4): Đảng là lực lượng lãnh đạo Nhà nước và xã hội; định ra đường lối, giới thiệu cán bộ, thể chế hóa chủ trương thành pháp luật và giám sát; Đảng hoạt động trong khuôn khổ Hiến pháp và pháp luật.
3. Nguyên tắc tập trung dân chủ (Điều 8): Kết hợp chỉ đạo tập trung thống nhất của cấp trên với phát huy dân chủ, chủ động sáng tạo của cấp dưới; cơ quan dân cử do dân bầu; cấp dưới phục tùng cấp trên, văn bản cấp dưới không được trái văn bản cấp trên.
4. Nguyên tắc pháp chế xã hội chủ nghĩa: Mọi cơ quan nhà nước, cán bộ công chức và công dân phải nghiêm chỉnh chấp hành Hiến pháp và pháp luật; làm việc đúng thẩm quyền, xử lý nghiêm minh mọi vi phạm.
5. Nguyên tắc bảo đảm sự bình đẳng và đoàn kết giữa các dân tộc (Điều 5): Các dân tộc bình đẳng, tương trợ cùng phát triển, nghiêm cấm kỳ thị, chia rẽ dân tộc."""
    },
    {
        "sample_id": "SFT_DUE_CH2_002",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày vị trí, tính chất và chức năng của Quốc hội và Chính phủ theo Hiến pháp 2013.",
        "input": "Phân biệt vị trí pháp lý, chức năng của Quốc hội và Chính phủ nước CHXHCN Việt Nam?",
        "output": """I. QUỐC HỘI (ĐIỀU 69 HIẾN PHÁP 2013):
- Vị trí pháp lý: Là cơ quan đại biểu cao nhất của Nhân dân, cơ quan quyền lực nhà nước cao nhất của nước CHXHCN Việt Nam.
- Chức năng:
  1. Thực hiện quyền lập hiến và quyền lập pháp (duy nhất Quốc hội có quyền sửa đổi Hiến pháp, làm luật).
  2. Quyết định các vấn đề quan trọng của đất nước (kinh tế, ngân sách, nhân sự cấp cao, chiến tranh - hòa bình).
  3. Giám sát tối cao đối với hoạt động của Nhà nước.
- Cơ cấu: Tổ chức theo chế độ một viện, nhiệm kỳ 5 năm, có Ủy ban Thường vụ Quốc hội là cơ quan thường trực.

II. CHÍNH PHỦ (ĐIỀU 94 HIẾN PHÁP 2013):
- Vị trí pháp lý: Là cơ quan hành chính nhà nước cao nhất của nước CHXHCN Việt Nam, thực hiện quyền hành pháp, là cơ quan chấp hành của Quốc hội.
- Chức năng:
  1. Thống nhất quản lý mọi mặt đời sống kinh tế, chính trị, văn hóa, xã hội, quốc phòng, an ninh và đối ngoại.
  2. Tổ chức thi hành Hiến pháp và luật trên thực tế.
- Trách nhiệm: Chịu trách nhiệm trước Quốc hội và báo cáo công tác trước Quốc hội, Ủy ban Thường vụ Quốc hội, Chủ tịch nước."""
    },

    # --- CHƯƠNG 3 (ĐH KINH TẾ ĐÀ NẴNG): NHỮNG KIẾN THỨC CƠ BẢN VỀ PHÁP LUẬT ---
    {
        "sample_id": "SFT_DUE_CH3_001",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày các thuộc tính (đặc trưng cơ bản) của pháp luật theo bài giảng ĐH Kinh tế Đà Nẵng.",
        "input": "Pháp luật có những thuộc tính cơ bản nào? Phân tích tính quy phạm phổ biến và tính được bảo đảm bằng nhà nước?",
        "output": """I. BA THUỘC TÍNH CƠ BẢN CỦA PHÁP LUẬT:
1. Tính quy phạm phổ biến:
- Pháp luật gồm các quy tắc xử sự chung, là khuôn mẫu, mực thước cho hành vi của nhiều người.
- Được áp dụng nhiều lần, trong thời gian dài và trên phạm vi rộng lớn đối với mọi chủ thể thuộc điều kiện dự liệu.
- Tính quy phạm phổ biến bắt nguồn từ quyền lực nhà nước được đề lên thành luật, mang tính tối cao duy nhất trong quốc gia.
2. Tính xác định chặt chẽ về mặt hình thức:
- Nội dung pháp luật được thể hiện rõ ràng, chính xác trong các điều, khoản của văn bản quy phạm pháp luật.
- Sử dụng ngôn ngữ pháp lý rõ ràng, đơn nghĩa, trong sáng; không dùng từ ngữ mập mờ \"vân vân\", \"...\" để đảm bảo chỉ có một cách hiểu và thi hành thống nhất.
3. Tính được bảo đảm thực hiện bằng nhà nước:
- Pháp luật do nhà nước ban hành hoặc thừa nhận và được bảo đảm thực hiện bằng cả hai phương pháp: thuyết phục, giáo dục và cưỡng chế nhà nước khi cần thiết.
- Nhà nước trao cho quy phạm pháp luật hiệu lực bắt buộc chung, buộc mọi cá nhân, tổ chức phải phục tùng."""
    },
    {
        "sample_id": "SFT_DUE_CH3_002",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày 3 chức năng chủ yếu của pháp luật theo bài giảng ĐH Kinh tế Đà Nẵng.",
        "input": "Pháp luật có những chức năng cơ bản nào? Phân tích mối quan hệ giữa chức năng điều chỉnh và bảo vệ?",
        "output": """I. BA CHỨC NĂNG CHỦ YẾU CỦA PHÁP LUẬT:
1. Chức năng điều chỉnh:
- Là chức năng cơ bản nhất; pháp luật ghi nhận các quan hệ xã hội chủ yếu và định hướng, tạo hành lang pháp lý cho các quan hệ xã hội phát triển theo chiều hướng ổn định, tiến bộ phù hợp ý chí nhà nước.
2. Chức năng bảo vệ:
- Pháp luật là công cụ bảo vệ các quan hệ xã hội được xác lập trước các hành vi vi phạm. Khi có hành vi xâm phạm, cơ quan nhà nước có thẩm quyền áp dụng các biện pháp chế tài cưỡng chế để xử lý người vi phạm và khôi phục trật tự.
3. Chức năng giáo dục:
- Tác động vào nhận thức và ý thức con người, hình thành niềm tin, thói quen xử sự tôn trọng pháp luật và hướng con người đến hành vi hợp pháp.

II. MỐI QUAN HỆ:
Chức năng điều chỉnh tạo ra trật tự xã hội; chức năng bảo vệ giữ vững và răn đe để bảo vệ trật tự đó. Hai chức năng bổ trợ chặt chẽ cho nhau."""
    },

    # --- CHƯƠNG 4 (ĐH KINH TẾ ĐÀ NẴNG): QPPL, QHPL & VBQPPL ---
    {
        "sample_id": "SFT_DUE_CH4_001",
        "intent_code": "QPPL_STRUCT",
        "instruction": "Trình bày các dạng bộ phận giả định, quy định và chế tài của quy phạm pháp luật.",
        "input": "Phân tích các dạng giả định (giản đơn, phức tạp), quy định (dứt khoát, không dứt khoát) và chế tài (cố định, không cố định)? Cho ví dụ?",
        "output": """I. CÁC DẠNG CỦA BỘ PHẬN GIẢ ĐỊNH:
1. Giả định giản đơn: Chỉ nêu một hoàn cảnh, điều kiện cụ thể.
- Ví dụ: \"Người có quốc tịch Việt Nam là công dân Nước Cộng hoà Xã hội chủ nghĩa Việt Nam\" (Khoản 1 Điều 4 Luật Quốc tịch).
2. Giả định phức tạp: Nêu lên nhiều hoàn cảnh, điều kiện kết hợp cùng lúc.
- Ví dụ: Khoản 1 Điều 202 BLHS: \"Người nào điều khiển phương tiện giao thông đường bộ mà vi phạm về an toàn... gây thiệt hại cho tính mạng hoặc gây thiệt hại nghiêm trọng cho sức khỏe, tài sản...\"

II. CÁC DẠNG CỦA BỘ PHẬN QUY ĐỊNH:
1. Quy định dứt khoát: Chỉ nêu một cách xử sự duy nhất, bắt buộc chủ thể phải làm theo không có lựa chọn.
- Ví dụ: \"Khi việc kết hôn trái pháp luật bị hủy thì hai bên nam nữ phải chấm dứt quan hệ vợ chồng\".
2. Quy định không dứt khoát (tùy nghi): Nêu ra 2 hoặc nhiều cách xử sự cho phép chủ thể lựa chọn cách phù hợp.
- Ví dụ: Các bên trong hợp đồng mua bán tài sản được quyền tự thỏa thuận về giá cả và phương thức thanh toán.

III. CÁC DẠNG CỦA BỘ PHẬN CHẾ TÀI:
1. Chế tài cố định: Quy định chính xác, dứt khoát một mức/biện pháp cưỡng chế cụ thể.
- Ví dụ: Phạt tiền 500.000 đồng; cách chức ngay lập tức.
2. Chế tài không cố định: Quy định khoảng dao động (mức tối thiểu đến tối đa) để cơ quan có thẩm quyền cân nhắc theo mức độ lỗi.
- Ví dụ: \"phạt tù từ 03 tháng đến 03 năm\" (Điều 134 BLHS 2015)."""
    },
    {
        "sample_id": "SFT_DUE_CH4_002",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày về nguyên tắc không hồi tố của văn bản QPPL và các trường hợp ngoại lệ theo Luật Ban hành VBQPPL 2015.",
        "input": "Hiệu lực trở về trước (hiệu lực hồi tố) của văn bản quy phạm pháp luật là gì? Pháp luật Việt Nam cấm hồi tố trong trường hợp nào?",
        "output": """I. KHÁI NIỆM HIỆU LỰC HỒI TỐ:
Hiệu lực hồi tố là việc văn bản quy phạm pháp luật được áp dụng đối với những hành vi, sự kiện thực tế đã xảy ra trước ngày văn bản đó có hiệu lực thi hành.

II. NGUYÊN TẮC CHUNG:
Văn bản quy phạm pháp luật KHÔNG CÓ HIỆU LỰC TRỞ VỀ TRƯỚC nhằm bảo đảm tính ổn định của trật tự pháp luật và an toàn pháp lý cho người dân.

III. HAI TRƯỜNG HỢP TUYỆT ĐỐI CẤM HỒI TỐ (ĐIỀU 152 LUẬT BAN HÀNH VBQPPL 2015):
1. Quy định trách nhiệm pháp lý mới đối với hành vi mà vào thời điểm thực hiện hành vi đó pháp luật không quy định trách nhiệm pháp lý.
2. Quy định trách nhiệm pháp lý nặng hơn đối với hành vi đã xảy ra.

IV. NGOẠI LỆ CHO PHÉP HỒI TỐ:
Chỉ áp dụng hiệu lực trở về trước khi có lợi cho đối tượng áp dụng (ví dụ: bãi bỏ một tội danh, giảm nhẹ khung hình phạt, bổ sung tình tiết giảm nhẹ theo Khoản 3 Điều 7 Bộ luật Hình sự 2015)."""
    },

    # --- CHƯƠNG 5 (ĐH KINH TẾ ĐÀ NẴNG): THỰC HIỆN PL, VPPL & TNPL ---
    {
        "sample_id": "SFT_DUE_CH5_001",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày đặc điểm của hình thức áp dụng pháp luật theo bài giảng ĐH Kinh tế Đà Nẵng.",
        "input": "Áp dụng pháp luật là gì? Phân tích các đặc điểm của áp dụng pháp luật và các trường hợp cần áp dụng pháp luật?",
        "output": """I. KHÁI NIỆM ÁP DỤNG PHÁP LUẬT:
Áp dụng pháp luật là hình thức thực hiện pháp luật mang tính quyền lực nhà nước, do cơ quan nhà nước có thẩm quyền hoặc nhà chức trách tiến hành nhằm cá biệt hóa quy phạm pháp luật thành quyền, nghĩa vụ hoặc trách nhiệm pháp lý cụ thể đối với cá nhân, tổ chức.

II. ĐẶC ĐIỂM CỦA ÁP DỤNG PHÁP LUẬT:
1. Mang tính quyền lực nhà nước: Chỉ cơ quan, cá nhân có thẩm quyền luật định mới được thực hiện.
2. Tiến hành theo trình tự, thủ tục chặt chẽ do pháp luật quy định.
3. Mang tính cá biệt: Ban hành văn bản áp dụng pháp luật giải quyết vụ việc cụ thể, đối tượng xác định, áp dụng một lần.
4. Là hoạt động mang tính sáng tạo: Phải đối chiếu vụ việc thực tế với quy phạm pháp luật để lựa chọn điều luật phù hợp.

III. CÁC TRƯỜNG HỢP CẦN ÁP DỤNG PHÁP LUẬT:
1. Khi có vi phạm pháp luật xảy ra cần áp dụng chế tài xử lý (truy cứu TNHS, xử phạt hành chính).
2. Khi quyền và nghĩa vụ của các bên không thể tự phát sinh nếu thiếu sự can thiệp của Nhà nước (gọi nhập ngũ, cấp giấy chứng nhận quyền sử dụng đất).
3. Khi xảy ra tranh chấp quyền, nghĩa vụ mà các bên không tự giải quyết được (tranh chấp tài sản, ly hôn).
4. Khi Nhà nước cần kiểm tra, giám sát, công nhận sự tồn tại của sự kiện thực tế (công chứng hợp đồng, đăng ký khai sinh)."""
    },

    # --- CHƯƠNG 6 (ĐH KINH TẾ ĐÀ NẴNG): HỆ THỐNG PL, Ý THỨC PL & PHÁP CHẾ XHCN ---
    {
        "sample_id": "SFT_DUE_CH6_001",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày cấu trúc của ý thức pháp luật và mối quan hệ giữa ý thức pháp luật với pháp luật.",
        "input": "Ý thức pháp luật là gì? Phân tích cấu trúc của ý thức pháp luật và mối quan hệ giữa ý thức pháp luật với pháp luật?",
        "output": """I. KHÁI NIỆM Ý THỨC PHÁP LUẬT:
Ý thức pháp luật là một hình thái ý thức xã hội, là tổng thể những tư tưởng, quan điểm, học thuyết, tâm trạng, cảm xúc của con người đối với pháp luật hiện hành, pháp luật đã qua và pháp luật cần phải có.

II. CẤU TRÚC Ý THỨC PHÁP LUẬT:
Gồm 2 bộ phận hợp thành:
1. Hệ tư tưởng pháp luật: Toàn bộ những học thuyết, quan điểm khoa học, tư tưởng pháp lý mang tính tự giác, hệ thống và khoa học (ở VN dựa trên chủ nghĩa Mác-Lênin, tư tưởng Hồ Chí Minh và đường lối của Đảng).
2. Tâm lý pháp luật: Những trạng thái cảm xúc, thái độ, tâm tư, tình cảm và thói quen của con người đối với pháp luật trong đời sống thường ngày (tâm lý tôn trọng luật hoặc thờ ơ, né tránh).

III. MỐI QUAN HỆ BIỆN CHỨNG:
- Ý thức pháp luật là tiền đề tư tưởng trực tiếp để xây dựng pháp luật và là nhân tố thúc đẩy việc thực hiện pháp luật nghiêm chỉnh.
- Pháp luật là cơ sở chuẩn mực để củng cố, định hình và nâng cao trình độ ý thức pháp luật của toàn xã hội."""
    },
    {
        "sample_id": "SFT_DUE_CH6_002",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày khái niệm và các yêu cầu cơ bản của pháp chế xã hội chủ nghĩa.",
        "input": "Pháp chế xã hội chủ nghĩa là gì? Nêu 4 yêu cầu cơ bản của pháp chế xã hội chủ nghĩa?",
        "output": """I. KHÁI NIỆM PHÁP CHẾ XÃ HỘI CHỦ NGHĨA:
Pháp chế xã hội chủ nghĩa là một chế độ đặc biệt của đời sống chính trị - xã hội, trong đó tất cả các cơ quan nhà nước, tổ chức kinh tế, tổ chức xã hội, cán bộ công chức và mọi công dân đều phải tôn trọng và thực hiện pháp luật một cách nghiêm chỉnh, triệt để và chính xác.

II. BỐN YÊU CẦU CƠ BẢN CỦA PHÁP CHẾ XHCN:
1. Tôn trọng tính tối cao của Hiến pháp và Luật: Mọi văn bản dưới luật khi ban hành phải phù hợp với Hiến pháp và luật, không được trái luật.
2. Bảo đảm tính thống nhất của pháp chế trên quy mô toàn quốc: Pháp luật phải được hiểu và thi hành thống nhất, không chấp nhận việc cát cứ địa phương hay đặc quyền, biệt lệ.
3. Các cơ quan xây dựng, thực hiện và bảo vệ pháp luật phải hoạt động tích cực, chủ động và có hiệu quả: Xử lý kịp thời, nghiêm minh mọi hành vi vi phạm pháp luật, đặc biệt là tội phạm.
4. Gắn liền công tác pháp chế với văn hóa và nâng cao văn hóa pháp lý của nhân dân: Xây dựng thói quen \"sống và làm việc theo Hiến pháp và pháp luật\"."""
    },

    # --- CHƯƠNG 7 (ĐH KINH TẾ ĐÀ NẴNG): PHÒNG, CHỐNG THAM NHŨNG (LUẬT PCTN 2018) ---
    {
        "sample_id": "SFT_DUE_CH7_001",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày các hành vi tham nhũng trong khu vực nhà nước và khu vực ngoài nhà nước theo Luật PCTN 2018.",
        "input": "Luật Phòng, chống tham nhũng năm 2018 quy định những hành vi tham nhũng nào trong khu vực công và khu vực tư (ngoài nhà nước)?",
        "output": """I. 12 HÀNH VI THAM NHŨNG TRONG KHU VỰC NHÀ NƯỚC (ĐIỀU 2 LUẬT PCTN 2018):
1. Tham ô tài sản.
2. Nhận hối lộ.
3. Lạm dụng chức vụ, quyền hạn chiếm đoạt tài sản.
4. Lợi dụng chức vụ, quyền hạn trong khi thi hành nhiệm vụ, công vụ vì vụ lợi.
5. Lạm quyền trong khi thi hành nhiệm vụ, công vụ vì vụ lợi.
6. Lợi dụng chức vụ, quyền hạn gây ảnh hưởng đối với người khác để trục lợi.
7. Giả mạo trong công tác vì vụ lợi.
8. Đưa hối lộ, môi giới hối lộ được thực hiện bởi người có chức vụ, quyền hạn để giải quyết công việc vì vụ lợi.
9. Lợi dụng chức vụ, quyền hạn sử dụng trái phép tài sản công vì vụ lợi.
10. Nhũng nhiễu vì vụ lợi.
11. Không thực hiện, thực hiện không đúng hoặc không đầy đủ nhiệm vụ, công vụ vì vụ lợi.
12. Lợi dụng chức vụ, quyền hạn để bao che cho người có hành vi vi phạm pháp luật vì vụ lợi; cản trở, can thiệp trái pháp luật vào việc kiểm tra, thanh tra, kiểm toán, điều tra, truy tố, xét xử, thi hành án vì vụ lợi.

II. 3 HÀNH VI THAM NHŨNG TRONG KHU VỰC NGOÀI NHÀ NƯỚC (ĐIỀU 2 KHOẢN 2 LUẬT PCTN 2018):
1. Tham ô tài sản trong doanh nghiệp, tổ chức khu vực ngoài nhà nước.
2. Nhận hối lộ trong doanh nghiệp, tổ chức khu vực ngoài nhà nước.
3. Đưa hối lộ, môi giới hối lộ để giải quyết công việc của doanh nghiệp, tổ chức mình vì vụ lợi."""
    },
    {
        "sample_id": "SFT_DUE_CH7_002",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày 7 tội phạm tham nhũng theo Bộ luật Hình sự 2015 (sửa đổi 2017) và chính sách khoan hồng khi nộp lại 3/4 tài sản.",
        "input": "Bộ luật Hình sự năm 2015 quy định các tội phạm tham nhũng nào? Quy định không thi hành án tử hình khi nộp lại 3/4 tài sản tham ô, nhận hối lộ được áp dụng ra sao?",
        "output": """I. BẢY TỘI PHẠM THAM NHŨNG (MỤC 1 CHƯƠNG XXIII BLHS 2015):
1. Tội tham ô tài sản (Điều 353).
2. Tội nhận hối lộ (Điều 354) - bao gồm cả nhận lợi ích vật chất hoặc lợi ích phi vật chất (tình dục, danh tiếng, việc làm...).
3. Tội lạm dụng chức vụ, quyền hạn chiếm đoạt tài sản (Điều 355).
4. Tội lợi dụng chức vụ, quyền hạn trong khi thi hành công vụ (Điều 356).
5. Tội lạm quyền trong khi thi hành công vụ (Điều 357).
6. Tội lợi dụng chức vụ, quyền hạn gây ảnh hưởng đối với người khác để trục lợi (Điều 358).
7. Tội giả mạo trong công tác (Điều 359).

II. CHÍNH SÁCH NHÂN ĐẠO KHOAN HỒNG KHI THU HỒI TÀI SẢN (KHOẢN 3 ĐIỀU 40 BLHS 2015):
- Quy định: Không thi hành án tử hình đối với người bị kết án tử hình về Tội tham ô tài sản (Điều 353) hoặc Tội nhận hối lộ (Điều 354) nếu sau khi bị kết án, họ đã:
  1. Chủ động nộp lại ít nhất ba phần tư (3/4) tài sản tham ô, nhận hối lộ; VÀ
  2. Hợp tác tích cực với cơ quan chức năng trong việc phát hiện, điều tra, xử lý tội phạm hoặc lập công lớn.
- Hậu quả pháp lý: Chuyển hình phạt tử hình thành TÙ CHUNG THÂN nhằm khuyến khích khắc phục hậu quả kinh tế và thu hồi tối đa tài sản cho Nhà nước."""
    },
    {
        "sample_id": "SFT_DUE_CH7_003",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Trình bày trách nhiệm phòng chống tham nhũng của người có chức vụ quyền hạn và chế độ trách nhiệm của người đứng đầu theo Luật PCTN 2018.",
        "input": "Trách nhiệm của người đứng đầu cơ quan, tổ chức khi để xảy ra tham nhũng và những điều người có chức vụ, quyền hạn không được làm?",
        "output": """I. NHỮNG VIỆC NGƯỜI CÓ CHỨC VỤ, QUYỀN HẠN KHÔNG ĐƯỢC LÀM (ĐIỀU 20 LUẬT PCTN 2018):
1. Không được nhũng nhiễu, sách nhiễu trong giải quyết công việc.
2. Không được thành lập, tham gia quản lý, điều hành doanh nghiệp tư nhân, công ty TNHH, CTCP, hợp tác xã (trừ trường hợp luật định).
3. Không được tư vấn cho doanh nghiệp, tổ chức trong và ngoài nước về công việc liên quan đến bí mật nhà nước hoặc thuộc thẩm quyền quản lý của mình.
4. Không được sử dụng trái phép thông tin của cơ quan, đơn vị.
5. Không được bố trí người thân thích (vợ/chồng, bố mẹ, con, anh chị em ruột) giữ chức vụ quản lý nhân sự, kế toán, thủ quỹ, thủ kho trong đơn vị mình phụ trách.

II. TRÁCH NHIỆM CỦA NGƯỜI ĐỨNG ĐẦU KHI ĐỂ XẢY RA THAM NHŨNG (ĐIỀU 72, 73 LUẬT PCTN 2018):
1. Phân định trách nhiệm:
- Người đứng đầu chịu trách nhiệm trực tiếp nếu để xảy ra tham nhũng trong cơ quan, đơn vị do mình trực tiếp quản lý, giao việc.
- Cấp phó chịu trách nhiệm trực tiếp đối với lĩnh vực công tác được phân công; người đứng đầu chịu trách nhiệm liên đới.
2. Biện pháp xử lý: Phải bị xử lý kỷ luật hoặc truy cứu trách nhiệm hình sự.
3. Miễn/giảm trách nhiệm: Nếu chủ động từ chức trước khi cơ quan có thẩm quyền phát hiện, xử lý thì được xem xét miễn hoặc giảm hình thức kỷ luật."""
    }
]
