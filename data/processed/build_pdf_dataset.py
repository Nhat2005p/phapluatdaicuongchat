# -*- coding: utf-8 -*-
"""
Script xây dựng và tích hợp toàn bộ dữ liệu từ file PDF:
'TÀI LIỆU ÔN TẬP VẤN ĐÁP VÀ TỰ LUẬN MÔN PHÁP LUẬT ĐẠI CƯƠNG' (18 trang)
vào sft_vietlaw_master.json và diem10_samples.py.
"""

PDF_SAMPLES = [
    # =========================================================================
    # PHẦN 1: CÂU HỎI TỰ LUẬN LÝ THUYẾT VÀ ĐÁP ÁN CHUẨN XÁC (CÂU 1 - CÂU 10)
    # =========================================================================

    # --- CÂU 1 (Trang 1 - 2) ---
    {
        "sample_id": "SFT_10D_CH1_001",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy phân tích và trả lời câu hỏi tự luận Pháp luật Đại cương sau đây theo thang điểm 10 chuẩn Barem.",
        "input": "Câu 1: Phân tích nguồn gốc và bản chất của Nhà nước theo quan điểm của Chủ nghĩa Mác - Lênin. Phân tích nguyên tắc \"Tập trung dân chủ\" trong tổ chức và hoạt động của Bộ máy Nhà nước CHXHCN Việt Nam.",
        "output": """Lời giải chi tiết / Lập luận pháp lý:

1. Nguồn gốc của Nhà nước (Thang điểm: 2.0 điểm)
● Quan điểm Mác-xít: Nhà nước không phải là một hiện tượng vĩnh cửu hay siêu nhiên, mà là một hiện tượng xã hội có tính lịch sử. Nhà nước xuất hiện khi xã hội phát triển đến một giai đoạn nhất định.
● Nguyên nhân kinh tế: Xuất hiện chế độ tư hữu về tư liệu sản xuất do có sự phân công lao động xã hội và sự phát triển của lực lượng sản xuất.
● Nguyên nhân xã hội: Xã hội phân chia thành các giai cấp đối kháng và mâu thuẫn giai cấp phát triển đến mức không thể điều hòa được. Nhà nước ra đời như một lực lượng đứng trên xã hội nhằm giữ cho mâu thuẫn đó trong một "trật tự" nhất định.

2. Bản chất của Nhà nước (Thang điểm: 2.0 điểm)
● Tính giai cấp: Nhà nước là công cụ thống trị giai cấp, bảo vệ lợi ích của giai cấp thống trị về kinh tế, chính trị, tư tưởng.
● Tính xã hội: Nhà nước phải giải quyết các công việc chung của toàn xã hội (bảo đảm an ninh, y tế, giáo dục, giao thông, bảo vệ môi trường...) để duy trì sự tồn tại của cộng đồng dân cư.

3. Nguyên tắc "Tập trung dân chủ" trong Bộ máy Nhà nước Việt Nam (Thang điểm: 1.0 điểm)
● Khái niệm: Là sự kết hợp hài hòa giữa sự lãnh đạo tập trung, thống nhất của cơ quan nhà nước cấp trên với việc phát huy quyền chủ động, sáng tạo của cơ quan cấp dưới và nhân dân.
● Biểu hiện cụ thể:
○ Cơ quan quyền lực nhà nước (Quốc hội, HĐND) do nhân dân bầu ra theo nguyên tắc phổ thông, bình đẳng, trực tiếp và bỏ phiếu kín.
○ Lãnh đạo tập trung: Báo cáo công tác, chấp hành quyết định của cấp trên, văn bản cấp dưới không được trái văn bản cấp trên.
○ Mở rộng dân chủ: Phân cấp, phân quyền hợp lý cho địa phương; cấp dưới có quyền đề xuất, kiến nghị."""
    },
    {
        "sample_id": "SFT_10D_CH1_001_SUB1",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy trả lời câu hỏi vấn đáp lý luận nhà nước và pháp luật sau đây.",
        "input": "Theo quan điểm Chủ nghĩa Mác - Lênin, Nhà nước ra đời từ những nguyên nhân nào?",
        "output": """Theo quan điểm của Chủ nghĩa Mác - Lênin, Nhà nước không phải là một hiện tượng vĩnh cửu hay siêu nhiên, mà là hiện tượng xã hội có tính lịch sử, xuất hiện khi xã hội phát triển đến một giai đoạn nhất định do 2 nguyên nhân cốt lõi:

1. Nguyên nhân kinh tế:
Xuất hiện chế độ tư hữu về tư liệu sản xuất do có sự phân công lao động xã hội và sự phát triển vượt bậc của lực lượng sản xuất (tạo ra của cải dư thừa tương đối).

2. Nguyên nhân xã hội:
Xã hội phân chia thành các giai cấp đối kháng và mâu thuẫn giai cấp phát triển gay gắt đến mức không thể điều hòa được. Nhà nước ra đời như một lực lượng đứng trên xã hội nhằm giữ cho mâu thuẫn đó trong một "trật tự" nhất định để bảo vệ lợi ích của giai cấp thống trị."""
    },
    {
        "sample_id": "SFT_10D_CH1_001_SUB2",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy phân tích bản chất của Nhà nước theo quan điểm Chủ nghĩa Mác - Lênin.",
        "input": "Phân tích bản chất của Nhà nước theo quan điểm Mác - Lênin: Tính giai cấp và Tính xã hội?",
        "output": """Theo quan điểm Mác - Lênin, bản chất của Nhà nước luôn thể hiện qua hai thuộc tính thống nhất biện chứng:

1. Tính giai cấp:
- Nhà nước là công cụ thống trị giai cấp, bảo vệ lợi ích của giai cấp thống trị về ba mặt: kinh tế, chính trị và tư tưởng.
- Nhà nước sử dụng bộ máy cưỡng chế đặc biệt (quân đội, cảnh sát, tòa án, nhà tù...) để duy trì trật tự có lợi cho giai cấp cầm quyền.

2. Tính xã hội:
- Bên cạnh việc bảo vệ lợi ích giai cấp, Nhà nước còn phải thực hiện chức năng quản lý, giải quyết các công việc chung của toàn xã hội (bảo đảm an ninh trật tự, y tế, giáo dục, giao thông, phòng chống thiên tai, bảo vệ môi trường...).
- Việc thực hiện tính xã hội nhằm duy trì sự tồn tại, ổn định và phát triển của toàn bộ cộng đồng dân cư trong lãnh thổ."""
    },
    {
        "sample_id": "SFT_10D_CH1_001_SUB3",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy phân tích nguyên tắc tổ chức bộ máy nhà nước CHXHCN Việt Nam.",
        "input": "Phân tích nguyên tắc \"Tập trung dân chủ\" trong tổ chức và hoạt động của Bộ máy Nhà nước CHXHCN Việt Nam?",
        "output": """Nguyên tắc "Tập trung dân chủ" trong tổ chức và hoạt động của Bộ máy Nhà nước CHXHCN Việt Nam được thể hiện như sau:

1. Khái niệm:
Là sự kết hợp hài hòa, chặt chẽ giữa sự lãnh đạo tập trung, thống nhất của cơ quan nhà nước cấp trên với việc phát huy quyền chủ động, sáng tạo, dân chủ của cơ quan cấp dưới và toàn thể nhân dân.

2. Biểu hiện cụ thể:
- Về nguồn gốc quyền lực: Các cơ quan quyền lực nhà nước (Quốc hội ở trung ương, Hội đồng nhân dân ở địa phương) đều do Nhân dân trực tiếp bầu ra theo nguyên tắc phổ thông, bình đẳng, trực tiếp và bỏ phiếu kín; chịu trách nhiệm trước Nhân dân và báo cáo công tác trước cử tri.
- Về mặt tập trung: Cấp dưới phục tùng cấp trên, địa phương phục tùng trung ương; định kỳ báo cáo công tác; nghiêm chỉnh chấp hành quyết định của cấp trên; văn bản của cơ quan cấp dưới không được trái với văn bản của cơ quan cấp trên.
- Về mặt dân chủ: Phân cấp, phân quyền hợp lý cho chính quyền địa phương nhằm phát huy tính chủ động, năng động, sáng tạo; cơ quan cấp dưới và nhân dân có quyền đề xuất, kiến nghị, đóng góp ý kiến xây dựng pháp luật và chính sách."""
    },

    # --- CÂU 2 (Trang 2 - 3) ---
    {
        "sample_id": "SFT_10D_CH1_002",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy phân tích và trả lời câu hỏi tự luận Pháp luật Đại cương sau đây theo thang điểm 10 chuẩn Barem.",
        "input": "Câu 2: Phân tích các chức năng cơ bản của Nhà nước và cơ cấu phân công quyền lực trong Bộ máy Nhà nước CHXHCN Việt Nam theo Hiến pháp 2013.",
        "output": """Lời giải chi tiết / Lập luận pháp lý:

1. Chức năng của Nhà nước (Thang điểm: 2.0 điểm)
Chức năng của Nhà nước là những phương diện hoạt động cơ bản, có tính chiến lược và ổn định tương đối nhằm thực hiện các nhiệm vụ đặt ra trước Nhà nước.
● Theo phạm vi hoạt động:
○ Chức năng đối nội: Bảo vệ trật tự pháp luật, phát triển kinh tế, giáo dục, văn hóa, y tế, an sinh xã hội.
○ Chức năng đối ngoại: Bảo vệ độc lập, chủ quyền, toàn vẹn lãnh thổ; mở rộng quan hệ hợp tác quốc tế, hội nhập kinh tế thế giới.
● Theo tính chất quyền lực: Chức năng lập pháp, chức năng hành pháp và chức năng tư pháp.

2. Cơ cấu phân công quyền lực nhà nước ở Việt Nam (Thang điểm: 3.0 điểm)
Theo Điều 2 Hiến pháp 2013: "Quyền lực nhà nước là thống nhất, có sự phân công, phối hợp, kiểm soát giữa các cơ quan nhà nước trong việc thực hiện các quyền lập pháp, hành pháp, tư pháp."

| Nhánh quyền lực | Cơ quan thực hiện | Chức năng & Nhiệm vụ chính |
|---|---|---|
| Quyền Lập pháp | Quốc hội | Cơ quan đại biểu cao nhất của Nhân dân, cơ quan quyền lực nhà nước cao nhất. Thực hiện quyền lập hiến, lập pháp; quyết định các vấn đề quan trọng của đất nước; giám sát tối cao. |
| Quyền Hành pháp | Chính phủ | Cơ quan hành chính nhà nước cao nhất, thực hiện quyền hành pháp, là cơ quan chấp hành của Quốc hội. Quản lý toàn bộ đời sống kinh tế - xã hội. |
| Quyền Tư pháp | Tòa án nhân dân | Cơ quan xét xử, thực hiện quyền tư pháp. Bảo vệ công lý, bảo vệ quyền con người, quyền công dân, bảo vệ chế độ XHCN. |
| Kiểm sát tư pháp | Viện kiểm sát nhân dân | Thực hành quyền công tố và kiểm sát hoạt động tư pháp. |"""
    },
    {
        "sample_id": "SFT_10D_CH1_002_SUB1",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy trình bày về chức năng của Nhà nước theo giáo trình Pháp luật Đại cương.",
        "input": "Chức năng của Nhà nước là gì? Phân loại các chức năng của Nhà nước theo phạm vi hoạt động và theo tính chất quyền lực?",
        "output": """1. Khái niệm:
Chức năng của Nhà nước là những phương diện hoạt động cơ bản, có tính chiến lược và ổn định tương đối nhằm thực hiện các nhiệm vụ chính trị, kinh tế, xã hội đặt ra trước Nhà nước.

2. Phân loại chức năng của Nhà nước:
- Căn cứ vào phạm vi hoạt động:
  + Chức năng đối nội: Là những mặt hoạt động chủ yếu của Nhà nước trong nội bộ quốc gia (bảo vệ trật tự pháp luật, bảo đảm quyền công dân, phát triển kinh tế, giáo dục, văn hóa, y tế, an sinh xã hội).
  + Chức năng đối ngoại: Là những mặt hoạt động của Nhà nước trong quan hệ quốc tế (bảo vệ độc lập, chủ quyền, toàn vẹn lãnh thổ; mở rộng quan hệ hợp tác quốc tế, hội nhập kinh tế khu vực và thế giới, giữ gìn hòa bình).
- Căn cứ vào tính chất quyền lực nhà nước:
  + Chức năng lập pháp (lập hiến, làm luật).
  + Chức năng hành pháp (quản lý, điều hành và tổ chức thực thi pháp luật).
  + Chức năng tư pháp (xét xử và bảo vệ công lý, pháp luật)."""
    },
    {
        "sample_id": "SFT_10D_CH1_002_SUB2",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy phân tích cơ cấu quyền lực nhà nước theo Hiến pháp năm 2013.",
        "input": "Trình bày nguyên tắc và cơ cấu phân công, phối hợp, kiểm soát quyền lực nhà nước Việt Nam theo Hiến pháp 2013?",
        "output": """Theo Điều 2 Hiến pháp năm 2013: "Quyền lực nhà nước là thống nhất, có sự phân công, phối hợp, kiểm soát giữa các cơ quan nhà nước trong việc thực hiện các quyền lập pháp, hành pháp, tư pháp."

Cơ cấu phân công cụ thể gồm 4 hệ thống cơ quan trọng yếu:
1. Quyền Lập pháp - Quốc hội:
- Là cơ quan đại biểu cao nhất của Nhân dân, cơ quan quyền lực nhà nước cao nhất của nước CHXHCN Việt Nam.
- Thực hiện quyền lập hiến, quyền lập pháp; quyết định các vấn đề quan trọng của đất nước và thực hiện giám sát tối cao đối với hoạt động của Nhà nước.

2. Quyền Hành pháp - Chính phủ:
- Là cơ quan hành chính nhà nước cao nhất của nước CHXHCN Việt Nam, thực hiện quyền hành pháp, là cơ quan chấp hành của Quốc hội.
- Chịu trách nhiệm trước Quốc hội và thống nhất quản lý mọi mặt đời sống kinh tế, văn hóa, xã hội, quốc phòng, an ninh và đối ngoại.

3. Quyền Tư pháp - Tòa án nhân dân:
- Là cơ quan xét xử của nước CHXHCN Việt Nam, thực hiện quyền tư pháp.
- Có nhiệm vụ bảo vệ công lý, bảo vệ quyền con người, quyền công dân, bảo vệ chế độ xã hội chủ nghĩa, bảo vệ lợi ích của Nhà nước, quyền và lợi ích hợp pháp của tổ chức, cá nhân.

4. Kiểm sát tư pháp - Viện kiểm sát nhân dân:
- Là cơ quan thực hành quyền công tố và kiểm sát các hoạt động tư pháp theo luật định, bảo đảm cho pháp luật được chấp hành nghiêm chỉnh và thống nhất."""
    },

    # --- CÂU 3 (Trang 3 - 4) ---
    {
        "sample_id": "SFT_10D_CH2_003",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy phân tích và trả lời câu hỏi tự luận Pháp luật Đại cương sau đây theo thang điểm 10 chuẩn Barem.",
        "input": "Câu 3: Nêu định nghĩa pháp luật. Phân tích mối quan hệ giữa Pháp luật với Kinh tế, Chính trị và Đạo đức.",
        "output": """Lời giải chi tiết / Lập luận pháp lý:

1. Định nghĩa Pháp luật (Thang điểm: 1.0 điểm)
Pháp luật là hệ thống các quy tắc xử sự có tính bắt buộc chung, do Nhà nước ban hành hoặc thừa nhận và bảo đảm thực hiện, thể hiện ý chí của giai cấp thống trị và là công cụ điều chỉnh các quan hệ xã hội nhằm duy trì trật tự và sự phát triển của xã hội.

2. Mối quan hệ giữa Pháp luật và Kinh tế (Thang điểm: 1.5 điểm)
● Kinh tế quyết định Pháp luật: Cơ sở hạ tầng kinh tế quyết định sự ra đời, cơ cấu, nội dung và sự phát triển của hệ thống pháp luật (kiến trúc thượng tầng).
● Pháp luật tác động trở lại Kinh tế: Pháp luật thúc đẩy kinh tế phát triển nếu phản ánh đúng quy luật kinh tế khách quan; ngược lại, sẽ kìm hãm sự phát triển kinh tế nếu ban hành chủ quan, trái quy luật.

3. Mối quan hệ giữa Pháp luật và Chính trị (Thang điểm: 1.25 điểm)
● Pháp luật là công cụ thể hiện đường lối, chủ trương, chính sách của lực lượng lãnh đạo chính trị (Đảng cầm quyền).
● Pháp luật thể chế hóa đường lối chính trị thành quy tắc bắt buộc chung, tạo tính pháp lý vững chắc cho các mục tiêu chính trị.

4. Mối quan hệ giữa Pháp luật và Đạo đức (Thang điểm: 1.25 điểm)
● Sự tương đồng: Đều là các quy phạm xã hội nhằm hướng dẫn, điều chỉnh hành vi con người hướng tới giá trị Chân - Thiện - Mỹ.
● Pháp luật thể chế hóa đạo đức: Nhiều quy phạm đạo đức tiến bộ được Nhà nước nâng lên thành quy phạm pháp luật (ví dụ: nghĩa vụ phụng dưỡng cha mẹ, cấm hành vi ngược đãi).
● Đạo đức hỗ trợ thi hành pháp luật: Đạo đức tạo cơ sở tâm lý, nâng cao ý thức chấp hành pháp luật của người dân."""
    },
    {
        "sample_id": "SFT_10D_CH2_003_SUB1",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy phân tích mối quan hệ giữa Pháp luật và Kinh tế.",
        "input": "Phân tích mối quan hệ tác động qua lại giữa Pháp luật và Kinh tế?",
        "output": """Mối quan hệ giữa Pháp luật và Kinh tế là mối quan hệ giữa kiến trúc thượng tầng và cơ sở hạ tầng theo triết học Mác - Lênin:

1. Kinh tế giữ vai trò quyết định đối với Pháp luật:
- Cơ sở kinh tế quyết định sự ra đời, tồn tại, nội dung, cơ cấu và xu hướng phát triển của pháp luật.
- Mỗi kiểu quan hệ sản xuất sẽ sản sinh ra một kiểu pháp luật tương ứng; chế độ kinh tế thay đổi tất yếu dẫn tới sự thay đổi của pháp luật.

2. Pháp luật tác động trở lại mạnh mẽ đối với Kinh tế:
- Tác động tích cực (thúc đẩy): Khi pháp luật tiến bộ, phản ánh đúng các quy luật kinh tế khách quan và nhu cầu phát triển của lực lượng sản xuất, nó sẽ tạo hành lang pháp lý an toàn, giải phóng sức sản xuất và thúc đẩy kinh tế tăng trưởng.
- Tác động tiêu cực (kìm hãm): Khi pháp luật ban hành mang tính chủ quan duy ý chí, bảo thủ, lạc hậu hoặc trái quy luật kinh tế, nó sẽ cản trở đầu tư, gây ách tắc lưu thông hàng hóa và kìm hãm phát triển kinh tế."""
    },
    {
        "sample_id": "SFT_10D_CH2_003_SUB2",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy phân tích mối quan hệ giữa Pháp luật và Đạo đức.",
        "input": "Phân tích mối quan hệ giữa Pháp luật và Đạo đức trong điều chỉnh hành vi con người?",
        "output": """Pháp luật và Đạo đức là hai hình thái ý thức xã hội quan trọng cùng tham gia điều chỉnh quan hệ xã hội:

1. Sự tương đồng:
Đều là hệ thống các quy tắc xử sự chuẩn mực của xã hội, nhằm định hướng, uốn nắn hành vi con người hướng tới những giá trị tốt đẹp (Chân - Thiện - Mỹ).

2. Sự tác động hỗ trợ lẫn nhau:
- Pháp luật thể chế hóa và bảo vệ đạo đức: Nhà nước thường nâng các chuẩn mực đạo đức tiến bộ, phổ quát lên thành quy phạm pháp luật bắt buộc (ví dụ: nghĩa vụ phụng dưỡng cha mẹ già, nghĩa vụ nuôi dưỡng con cái, cấm hành vi bạo lực gia đình, cấm xúc phạm danh dự nhân phẩm người khác).
- Đạo đức là nền tảng tâm lý hỗ trợ thực hiện pháp luật: Ý thức đạo đức cao giúp người dân tự giác tôn trọng và tuân thủ pháp luật từ bên trong lương tâm chứ không chỉ vì lo sợ bị xử phạt cưỡng chế."""
    },

    # --- CÂU 4 (Trang 4 - 5) ---
    {
        "sample_id": "SFT_10D_CH2_004",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy phân tích và trả lời câu hỏi tự luận Pháp luật Đại cương sau đây theo thang điểm 10 chuẩn Barem.",
        "input": "Câu 4: Phân tích các loại Hiệu lực của Văn bản quy phạm pháp luật (VBQPPL) theo Luật Ban hành VBQPPL. Trong trường hợp nào VBQPPL có hiệu lực hồi tố (trở về trước)?",
        "output": """Lời giải chi tiết / Lập luận pháp lý:

1. Các loại hiệu lực của VBQPPL (Thang điểm: 3.0 điểm)
● Hiệu lực theo thời gian:
○ Xác định thời điểm phát sinh và chấm dứt hiệu lực thi hành của văn bản (VD: VBQPPL của cơ quan nhà nước trung ương có hiệu lực sau không quá 45 ngày kể từ ngày thông qua/ký ban hành trừ trường hợp đặc biệt).
● Hiệu lực theo không gian:
○ VBQPPL do các cơ quan trung ương ban hành có hiệu lực trên toàn bộ lãnh thổ quốc gia.
○ VBQPPL do HĐND, UBND ban hành có hiệu lực trong phạm vi địa giới hành chính của địa phương đó.
● Hiệu lực theo đối tượng tác động:
○ Xác định cá nhân, cơ quan, tổ chức chịu sự điều chỉnh của văn bản đó (có thể áp dụng toàn bộ người dân hoặc áp dụng riêng cho một nhóm đối tượng đặc thù như công chức, doanh nghiệp...).

2. Nguyên tắc và điều kiện áp dụng hiệu lực hồi tố (Thang điểm: 2.0 điểm)
● Nguyên tắc chung: Không quy định hiệu lực hồi tố đối với VBQPPL để đảm bảo tính ổn định của trật tự pháp luật.
● Trường hợp ngoại lệ được áp dụng hiệu lực hồi tố:
○ Chỉ áp dụng trong trường hợp thật cần thiết để bảo vệ lợi ích chung của xã hội, bảo vệ quyền và lợi ích hợp pháp của tổ chức, cá nhân.
○ Quy định trách nhiệm pháp lý nhẹ hơn đối với hành vi vi phạm pháp luật xảy ra trước ngày văn bản có hiệu lực; bãi bỏ trách nhiệm pháp lý; hoặc áp dụng quyền lợi ưu đãi hơn cho chủ thể.
● Cấm hiệu lực hồi tố: Không được quy định hiệu lực hồi tố trong các trường hợp:
○ Quy định trách nhiệm pháp lý mới nặng hơn.
○ Bỏ hoặc giảm nhẹ nghĩa vụ pháp lý của một bên mà gây thiệt hại cho bên khác."""
    },
    {
        "sample_id": "SFT_10D_CH2_004_SUB1",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy phân tích quy định về hiệu lực hồi tố theo Luật Ban hành văn bản quy phạm pháp luật.",
        "input": "Hiệu lực hồi tố của VBQPPL là gì? Khi nào được áp dụng và khi nào tuyệt đối bị cấm áp dụng hiệu lực hồi tố?",
        "output": """1. Khái niệm Hiệu lực hồi tố (trở về trước):
Hiệu lực hồi tố là việc một văn bản quy phạm pháp luật có hiệu lực áp dụng đối với những hành vi, quan hệ xã hội xảy ra trước ngày văn bản đó chính thức phát sinh hiệu lực.

2. Nguyên tắc chung:
Theo Luật Ban hành văn bản quy phạm pháp luật, nguyên tắc chung là KHÔNG quy định hiệu lực hồi tố đối với VBQPPL nhằm bảo đảm tính ổn định, dự liệu trước của pháp luật và an toàn pháp lý cho các chủ thể.

3. Các trường hợp ngoại lệ ĐƯỢC áp dụng hiệu lực hồi tố:
Chỉ áp dụng trong trường hợp thật cần thiết để bảo vệ lợi ích chung của xã hội, bảo vệ quyền và lợi ích hợp pháp của tổ chức, cá nhân, cụ thể:
- Quy định trách nhiệm pháp lý nhẹ hơn đối với hành vi vi phạm pháp luật xảy ra trước ngày văn bản có hiệu lực.
- Bãi bỏ trách nhiệm pháp lý đối với hành vi trước đó bị coi là vi phạm.
- Áp dụng quyền lợi, chính sách ưu đãi có lợi hơn cho chủ thể.

4. Các trường hợp TUYỆT ĐỐI CẤM hiệu lực hồi tố:
- Quy định trách nhiệm pháp lý mới hoặc trách nhiệm pháp lý nặng hơn.
- Bỏ hoặc giảm nhẹ nghĩa vụ pháp lý của một bên mà gây thiệt hại cho quyền, lợi ích hợp pháp của bên khác."""
    },

    # --- CÂU 5 (Trang 5 - 6) ---
    {
        "sample_id": "SFT_10D_CH3_005",
        "intent_code": "QPPL_STRUCT",
        "instruction": "Hãy phân tích và trả lời câu hỏi tự luận Pháp luật Đại cương sau đây theo thang điểm 10 chuẩn Barem.",
        "input": "Câu 5: Phân tích cơ cấu 3 bộ phận của Quy phạm pháp luật (Giả định, Quy định, Chế tài). Cho ví dụ minh họa và phân tích cụ thể từng bộ phận trong ví dụ đó.",
        "output": """Lời giải chi tiết / Lập luận pháp lý:

1. Lý thuyết cơ cấu Quy phạm pháp luật (QPPL) (Thang điểm: 3.0 điểm)
● Bộ phận Giả định:
○ Khái niệm: Là bộ phận quy định địa điểm, thời gian, chủ thể, điều kiện, hoàn cảnh thực tế mà khi xuất hiện thì chủ thể phải xử sự theo dự liệu của quy phạm pháp luật.
○ Trả lời cho câu hỏi: Ai? Khi nào? Trong hoàn cảnh, điều kiện nào?
● Bộ phận Quy định:
○ Khái niệm: Là bộ phận trung tâm của QPPL, đưa ra mô hình xử sự (được làm gì, phải làm gì, không được làm gì) mà chủ thể khi ở vào hoàn cảnh đã nêu tại phần Giả định bắt buộc phải tuân theo.
○ Trả lời cho câu hỏi: Chủ thể được làm gì, phải làm gì, hoặc không được làm gì?
● Bộ phận Chế tài:
○ Khái niệm: Là bộ phận chỉ ra các biện pháp tác động bất lợi (hậu quả pháp lý bất lợi) mà Nhà nước dự kiến áp dụng đối với chủ thể vi phạm không thực hiện đúng phần Quy định.
○ Trả lời cho câu hỏi: Chủ thể sẽ chịu hậu quả gì nếu không thực hiện đúng quy định?

2. Ví dụ thực tế và phân tích cụ thể (Thang điểm: 2.0 điểm)
● Căn cứ pháp lý: Khoản 1 Điều 260 Bộ luật Hình sự 2015 (Sửa đổi, bổ sung 2017):
"Người nào tham gia giao thông đường bộ mà vi phạm quy định về an toàn giao thông đường bộ gây thiệt hại cho người khác thuộc một trong các trường hợp sau đây […], thì bị phạt tiền từ 30.000.000 đồng đến 100.000.000 đồng, phạt cải tạo không giam giữ đến 03 năm hoặc phạt tù từ 01 năm đến 05 năm..."
● Phân tích cơ cấu:
○ Giả định: "Người nào tham gia giao thông đường bộ mà vi phạm quy định về an toàn giao thông đường bộ gây thiệt hại cho người khác thuộc một trong các trường hợp sau đây" (Nêu rõ chủ thể và hoàn cảnh thực tế).
○ Quy định: Bộ phận này bị ẩn trong điều luật (Mô hình xử sự ẩn là: Khi tham gia giao thông đường bộ, chủ thể phải chấp hành đúng các quy định về an toàn giao thông đường bộ).
○ Chế tài: "thì bị phạt tiền từ 30.000.000 đồng đến 100.000.000 đồng, phạt cải tạo không giam giữ đến 03 năm hoặc phạt tù từ 01 năm đến 05 năm" (Hậu quả pháp lý bất lợi)."""
    },
    {
        "sample_id": "SFT_10D_CH3_005_SUB1",
        "intent_code": "QPPL_STRUCT",
        "instruction": "Hãy phân tích câu hỏi về cơ cấu quy phạm pháp luật môn Pháp luật Đại cương.",
        "input": "Cơ cấu 3 bộ phận của Quy phạm pháp luật gồm những bộ phận nào? Ý nghĩa và câu hỏi nhận diện của từng bộ phận?",
        "output": """Một quy phạm pháp luật hoàn chỉnh thường được cấu thành từ 3 bộ phận:

1. Bộ phận Giả định:
- Khái niệm: Xác định địa điểm, thời gian, chủ thể, điều kiện, hoàn cảnh thực tế của đời sống mà khi xảy ra thì quy phạm pháp luật bắt đầu tác động.
- Câu hỏi nhận diện: "Ai? Khi nào? Trong điều kiện, hoàn cảnh nào?".

2. Bộ phận Quy định:
- Khái niệm: Là bộ phận trung tâm, quy định khuôn mẫu, quy tắc xử sự cho chủ thể khi ở vào hoàn cảnh giả định (cho phép làm gì, cấm làm gì, hoặc bắt buộc phải làm gì).
- Câu hỏi nhận diện: "Được làm gì? Phải làm gì? Không được làm gì?".

3. Bộ phận Chế tài:
- Khái niệm: Xác định các biện pháp tác động bất lợi (hình phạt, phạt tiền, cưỡng chế...) mà Nhà nước dự kiến áp dụng đối với chủ thể không thực hiện đúng mệnh lệnh tại phần quy định.
- Câu hỏi nhận diện: "Sẽ phải chịu hậu quả pháp lý bất lợi nào nếu không tuân thủ quy định?"."""
    },

    # --- CÂU 6 (Trang 6 - 7) ---
    {
        "sample_id": "SFT_10D_CH3_006",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy phân tích và trả lời câu hỏi tự luận Pháp luật Đại cương sau đây theo thang điểm 10 chuẩn Barem.",
        "input": "Câu 6: So sánh 4 hình thức thực hiện pháp luật (Tuân thủ, Chấp hành, Sử dụng, Áp dụng pháp luật). Phân tích các trường hợp bắt buộc phải Áp dụng pháp luật.",
        "output": """Lời giải chi tiết / Lập luận pháp lý:

1. Bảng so sánh 4 hình thức thực hiện pháp luật (Thang điểm: 3.0 điểm)

| Tiêu chí | Tuân thủ pháp luật | Chấp hành pháp luật | Sử dụng pháp luật | Áp dụng pháp luật |
|---|---|---|---|---|
| Tính chất hành vi | Thụ động (Kiềm chế) | Chủ động (Thực hiện nghĩa vụ) | Chủ động (Thực hiện quyền) | Mang tính quyền lực nhà nước |
| Nội dung | Không làm điều pháp luật cấm. | Làm những gì pháp luật bắt buộc phải làm. | Làm những gì pháp luật cho phép làm. | Cơ quan/Cá nhân có thẩm quyền ra quyết định làm phát sinh/thay đổi/chấm dứt QPPL. |
| Chủ thể | Mọi cá nhân, tổ chức. | Mọi cá nhân, tổ chức. | Mọi cá nhân, tổ chức. | Chỉ có cơ quan, nhà chức trách có thẩm quyền. |
| Ví dụ | Không vượt đèn đỏ; không nhận hối lộ. | Nộp thuế đầy đủ; thực hiện nghĩa vụ quân sự. | Đăng ký kinh doanh; lập di chúc; khiếu nại. | Tòa án tuyên án; Cảnh sát giao thông ra quyết định xử phạt. |

2. Các trường hợp bắt buộc phải Áp dụng pháp luật (Thang điểm: 2.0 điểm)
Cơ quan nhà nước có thẩm quyền bắt buộc phải thực hiện hình thức Áp dụng pháp luật trong 4 trường hợp sau:
1. Khi xảy ra vi phạm pháp luật và cần áp dụng biện pháp cưỡng chế/trách nhiệm pháp lý đối với chủ thể vi phạm.
2. Khi các quyền và nghĩa vụ pháp lý của chủ thể không tự phát sinh nếu thiếu sự can thiệp, công nhận của Nhà nước (Ví dụ: Đăng ký kết hôn, bổ nhiệm chức vụ, cấp sổ đỏ).
3. Khi xảy ra tranh chấp về quyền và nghĩa vụ pháp lý giữa các bên mà các bên không tự hòa giải/thỏa thuận được.
4. Khi Nhà nước cần kiểm tra, giám sát việc thực hiện quyền và nghĩa vụ của các chủ thể trong một số quan hệ pháp luật nhất định."""
    },
    {
        "sample_id": "SFT_10D_CH3_006_SUB1",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy trình bày các trường hợp bắt buộc áp dụng pháp luật theo giáo trình Pháp luật Đại cương.",
        "input": "Cơ quan nhà nước có thẩm quyền bắt buộc phải thực hiện hình thức Áp dụng pháp luật trong những trường hợp nào? Cho ví dụ cụ thể?",
        "output": """Áp dụng pháp luật là hình thức thực hiện pháp luật mang tính quyền lực nhà nước, chỉ do các cơ quan nhà nước, người có thẩm quyền luật định tiến hành. Cơ quan nhà nước bắt buộc phải áp dụng pháp luật trong 4 trường hợp sau:

1. Khi xảy ra hành vi vi phạm pháp luật:
Cần áp dụng biện pháp cưỡng chế hoặc chế tài trách nhiệm pháp lý đối với chủ thể vi phạm.
- Ví dụ: Cảnh sát giao thông ra quyết định xử phạt người vượt đèn đỏ; Tòa án tuyên phạt tù người phạm tội trộm cắp.

2. Khi quyền và nghĩa vụ của các chủ thể không thể tự phát sinh nếu thiếu sự công nhận, can thiệp của Nhà nước:
- Ví dụ: Ủy ban nhân dân cấp Giấy chứng nhận kết hôn; cấp Giấy chứng nhận quyền sử dụng đất; quyết định bổ nhiệm cán bộ công chức.

3. Khi xảy ra tranh chấp quyền, nghĩa vụ pháp lý mà các bên không tự hòa giải được:
Cần cơ quan tài phán đứng ra phán quyết để giải quyết dứt điểm mâu thuẫn.
- Ví dụ: Tòa án thụ lý và xét xử vụ án tranh chấp tài sản thừa kế giữa các đồng thừa kế; giải quyết tranh chấp hợp đồng kinh doanh thương mại.

4. Khi Nhà nước cần giám sát, kiểm tra hoặc xác lập sự kiện pháp lý đặc biệt:
- Ví dụ: Thanh tra cơ quan tài chính ra kết luận kiểm toán; cơ quan hộ tịch cấp giấy khai tử."""
    },

    # --- CÂU 7 (Trang 7 - 8) ---
    {
        "sample_id": "SFT_10D_CH4_007",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy phân tích và trả lời câu hỏi tự luận Pháp luật Đại cương sau đây theo thang điểm 10 chuẩn Barem.",
        "input": "Câu 7: Quan hệ pháp luật là gì? Phân tích các thành tố cấu thành Năng lực chủ thể (Năng lực pháp luật và Năng lực hành vi) của Cá nhân.",
        "output": """Lời giải chi tiết / Lập luận pháp lý:

1. Định nghĩa Quan hệ pháp luật (Thang điểm: 1.0 điểm)
Quan hệ pháp luật là quan hệ xã hội được các quy phạm pháp luật điều chỉnh, trong đó các bên tham gia xuất hiện với tư cách là chủ thể mang các quyền và nghĩa vụ pháp lý xác định do Nhà nước bảo đảm thực hiện.

2. Phân tích Năng lực chủ thể của Cá nhân (Thang điểm: 4.0 điểm)
Năng lực chủ thể là điều kiện do pháp luật quy định cho phép cá nhân, tổ chức trở thành chủ thể của quan hệ pháp luật, bao gồm 2 yếu tố:

● Năng lực pháp luật (NLPL) của cá nhân:
○ Khái niệm: Là khả năng của cá nhân được hưởng các quyền và phải chịu các nghĩa vụ pháp lý theo quy định của pháp luật.
○ Đặc điểm: Xuất hiện từ thời điểm cá nhân sinh ra và chỉ chấm dứt khi cá nhân đó chết (hoặc bị Tòa án tuyên bố đã chết). Mọi cá nhân đều có NLPL bình đẳng như nhau (trừ một số hạn chế theo luật định).

● Năng lực hành vi (NLHV) của cá nhân:
○ Khái niệm: Là khả năng của cá nhân bằng hành vi của chính mình tự xác lập, thực hiện các quyền và nghĩa vụ pháp lý, đồng thời độc lập chịu trách nhiệm pháp lý về hành vi của mình.
○ Điều kiện phụ thuộc:
■ Độ tuổi: Càng lớn tuổi thì NLHV càng đầy đủ (Theo Bộ luật Dân sự: Đủ 18 tuổi có NLHV dân sự đầy đủ).
■ Tình trạng thể chất, trí tuệ: Phải có khả năng nhận thức và làm chủ hành vi (Không bị bệnh tâm thần, không bị Tòa án tuyên bố mất hoặc hạn chế NLHV)."""
    },
    {
        "sample_id": "SFT_10D_CH4_007_SUB1",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy so sánh năng lực pháp luật và năng lực hành vi của cá nhân.",
        "input": "So sánh Năng lực pháp luật và Năng lực hành vi của cá nhân theo pháp luật hiện hành?",
        "output": """Năng lực pháp luật và Năng lực hành vi là hai bộ phận hợp thành Năng lực chủ thể của cá nhân:

1. Năng lực pháp luật của cá nhân:
- Bản chất: Khả năng hưởng quyền và gánh vác nghĩa vụ do Nhà nước ban hành và thừa nhận.
- Thời điểm phát sinh: Xuất hiện tự nhiên ngay từ khi cá nhân sinh ra.
- Thời điểm chấm dứt: Chỉ chấm dứt khi cá nhân chết (hoặc bị Tòa án tuyên bố là đã chết).
- Tính chất: Mọi cá nhân đều có năng lực pháp luật bình đẳng như nhau, không phụ thuộc vào độ tuổi hay tình trạng sức khỏe.

2. Năng lực hành vi của cá nhân:
- Bản chất: Khả năng bằng chính hành vi của bản thân tự xác lập, thực hiện các quyền và nghĩa vụ, đồng thời tự chịu trách nhiệm về hậu quả hành vi.
- Điều kiện xuất hiện: Không có sẵn từ lúc mới sinh mà phát triển dần theo thời gian, phụ thuộc chặt chẽ vào:
  + Độ tuổi (đủ 18 tuổi trở lên mới có năng lực hành vi dân sự đầy đủ).
  + Khả năng nhận thức, điều khiển hành vi (người mắc bệnh tâm thần làm mất khả năng nhận thức sẽ bị tuyên mất năng lực hành vi).

3. Mối quan hệ: Năng lực pháp luật là tiền đề; năng lực hành vi là phương tiện thực tế để biến các quyền năng pháp luật thành hiện thực."""
    },

    # --- CÂU 8 (Trang 9 - 10) ---
    {
        "sample_id": "SFT_10D_CH5_008",
        "intent_code": "VPPL_4_ELEMENTS",
        "instruction": "Hãy phân tích và trả lời câu hỏi tự luận Pháp luật Đại cương sau đây theo thang điểm 10 chuẩn Barem.",
        "input": "Câu 8: Phân tích 4 dấu hiệu cơ bản để nhận diện một hành vi là Vi phạm pháp luật và 4 yếu tố cấu thành Vi phạm pháp luật.",
        "output": """Lời giải chi tiết / Lập luận pháp lý:

1. 4 Dấu hiệu nhận diện Vi phạm pháp luật (VPPL) (Thang điểm: 2.0 điểm)
Một hành vi chỉ được xem là VPPL khi hội đủ 4 dấu hiệu bắt buộc:
1. Là hành vi xác định của con người: Phải thể hiện ra bên ngoài thế giới khách quan dưới dạng hành động (làm điều cấm) hoặc không hành động (không làm điều bắt buộc). Tư tưởng, suy nghĩ chưa thể hiện ra ngoài không phải là VPPL.
2. Tính trái pháp luật (Tính nguy hiểm cho xã hội): Hành vi xâm phạm, làm tổn hại đến các quan hệ xã hội được pháp luật bảo vệ.
3. Có lỗi của chủ thể: Chủ thể thực hiện hành vi trong trạng thái nhận thức được hành vi của mình và hậu quả của nó, lựa chọn thực hiện hành vi đó dù có điều kiện lựa chọn hành vi khác phù hợp pháp luật (Lỗi cố ý hoặc vô ý).
4. Do chủ thể có năng lực trách nhiệm pháp lý thực hiện: Chủ thể phải đạt độ tuổi luật định và có khả năng nhận thức, làm chủ được hành vi tại thời điểm thực hiện.

2. 4 Yếu tố cấu thành Vi phạm pháp luật (Thang điểm: 3.0 điểm)
● MẶT KHÁCH QUAN:
- Hành vi trái pháp luật.
- Hậu quả nguy hiểm cho xã hội.
- Quan hệ nhân quả giữa hành vi trái pháp luật và hậu quả xảy ra.
- Thời gian, địa điểm, phương tiện, phương thức thực hiện hành vi vi phạm.

● MẶT CHỦ QUAN:
- Lỗi của chủ thể: Lỗi cố ý (cố ý trực tiếp, cố ý gián tiếp) hoặc Lỗi vô ý (vô ý do quá tự tin, vô ý do cẩu thả).
- Mục đích vi phạm.
- Động cơ vi phạm.

● CHỦ THỂ:
- Cá nhân hoặc tổ chức thực hiện hành vi vi phạm.
- Có năng lực trách nhiệm pháp lý và đạt đủ độ tuổi luật định theo quy định của từng ngành luật.

● KHÁCH THỂ:
- Các quan hệ xã hội được pháp luật xác lập, bảo vệ nhưng bị hành vi vi phạm pháp luật xâm hại gây thiệt hại hoặc đe dọa gây thiệt hại."""
    },
    {
        "sample_id": "SFT_10D_CH5_008_SUB1",
        "intent_code": "VPPL_4_ELEMENTS",
        "instruction": "Hãy trình bày 4 dấu hiệu nhận diện vi phạm pháp luật.",
        "input": "Nêu và phân tích 4 dấu hiệu bắt buộc để nhận diện một hành vi là Vi phạm pháp luật?",
        "output": """Để một hành vi bị coi là Vi phạm pháp luật, bắt buộc phải hội tụ đầy đủ 4 dấu hiệu sau đây (nếu thiếu bất kỳ dấu hiệu nào thì không cấu thành vi phạm pháp luật):

1. Là hành vi xác định của con người:
- Phải thể hiện ra thế giới khách quan bên ngoài dưới dạng "hành động" (làm điều pháp luật cấm) hoặc "không hành động" (không thực hiện nghĩa vụ mà pháp luật bắt buộc phải làm).
- Ý nghĩ, tư tưởng, động cơ nội tâm dù đen tối đến đâu nhưng chưa bộc lộ ra thành hành vi cụ thể thì không phải là vi phạm pháp luật.

2. Có tính trái pháp luật (xâm phạm trật tự pháp luật):
Hành vi đó đi ngược lại mệnh lệnh của quy phạm pháp luật, trực tiếp xâm phạm, làm tổn hại tới các quan hệ xã hội được pháp luật bảo vệ.

3. Có lỗi của chủ thể:
- Chủ thể thực hiện hành vi trong trạng thái có khả năng nhận thức và lựa chọn xử sự, nhưng đã lựa chọn thực hiện hành vi trái pháp luật gây nguy hại.
- Lỗi gồm hai loại: Lỗi cố ý (cố ý trực tiếp, cố ý gián tiếp) hoặc Lỗi vô ý (vô ý do quá tự tin, vô ý do cẩu thả). Trường hợp do sự kiện bất ngờ hoặc bất khả kháng thì không có lỗi và không phải là vi phạm pháp luật.

4. Do chủ thể có năng lực trách nhiệm pháp lý thực hiện:
Chủ thể phải đạt độ tuổi theo luật định và có trạng thái tâm thần bình thường, có đủ khả năng nhận thức và làm chủ hành vi của mình tại thời điểm vi phạm."""
    },

    # --- CÂU 9 (Trang 10 - 12) ---
    {
        "sample_id": "SFT_10D_CH6_009",
        "intent_code": "CIVIL_INHERIT",
        "instruction": "Hãy phân tích và trả lời câu hỏi tự luận Pháp luật Đại cương sau đây theo thang điểm 10 chuẩn Barem.",
        "input": "Câu 9: Trình bày quy định của Luật Dân sự về Pháp nhân (Điều kiện trở thành pháp nhân) và các Hàng thừa kế theo pháp luật theo Bộ luật Dân sự 2015.",
        "output": """Lời giải chi tiết / Lập luận pháp lý:

1. Điều kiện để một tổ chức có tư cách Pháp nhân (Điều 74 BLDS 2015) (Thang điểm: 2.5 điểm)
Một tổ chức được công nhận là pháp nhân khi có đủ 4 điều kiện sau:
1. Được thành lập hợp pháp: Theo quy định của BLDS và luật khác có liên quan.
2. Có cơ cấu tổ chức chặt chẽ: Có cơ quan điều hành và các cơ quan khác theo quy định tại điều lệ hoặc quyết định thành lập.
3. Có tài sản độc lập với cá nhân, tổ chức khác và tự chịu trách nhiệm bằng tài sản đó.
4. Nhân danh chính mình tham gia vào các quan hệ pháp luật một cách độc lập.

2. Các hàng thừa kế theo pháp luật (Điều 651 BLDS 2015) (Thang điểm: 2.5 điểm)
Khi người chết không để lại di chúc hoặc di chúc không hợp pháp, di sản được chia theo hàng thừa kế theo thứ tự ưu tiên:

● HÀNG THỪA KẾ THỨ NHẤT:
- Vợ, chồng, bố đẻ, mẹ đẻ, bố nuôi, mẹ nuôi, con đẻ, con nuôi.

● HÀNG THỪA KẾ THỨ HAI (Nếu không còn ai ở Hàng 1):
- Ông nội, bà nội, ông ngoại, bà ngoại.
- Anh ruột, chị ruột, em ruột.
- Cháu ruột (gọi bằng ông nội, bà nội, ông ngoại, bà ngoại).

● HÀNG THỪA KẾ THỨ BA (Nếu không còn ai ở Hàng 2):
- Cụ nội, cụ ngoại.
- Bác ruột, chú ruột, cậu ruột, cô ruột, dì ruột.
- Cháu ruột (gọi người chết bằng bác ruột, chú ruột, cậu ruột, cô ruột, dì ruột).
- Chắt ruột (gọi người chết bằng cụ nội, cụ ngoại).

● Nguyên tắc chia: Những người thừa kế cùng hàng được hưởng phần di sản bằng nhau. Những người ở hàng thừa kế sau chỉ được hưởng thừa kế nếu không còn ai ở hàng thừa kế trước (do đã chết, không có quyền hưởng, bị truất quyền hoặc từ chối nhận di sản)."""
    },
    {
        "sample_id": "SFT_10D_CH6_009_SUB1",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy trình bày các điều kiện công nhận tư cách pháp nhân theo Bộ luật Dân sự 2015.",
        "input": "Điều kiện để một tổ chức có tư cách Pháp nhân theo Điều 74 Bộ luật Dân sự 2015 là gì?",
        "output": """Căn cứ Khoản 1 Điều 74 Bộ luật Dân sự năm 2015, một tổ chức được công nhận là pháp nhân khi có đầy đủ 4 điều kiện sau:

1. Được thành lập theo quy định của Bộ luật Dân sự, luật khác có liên quan:
Tổ chức được thành lập theo đúng trình tự, thủ tục do luật định (như đăng ký doanh nghiệp tại Sở Kế hoạch & Đầu tư, thành lập cơ quan nhà nước theo luật tổ chức, v.v.).

2. Có cơ cấu tổ chức theo quy định tại Điều 83 của Bộ luật này:
Pháp nhân phải có cơ quan điều hành và các cơ quan chức năng khác theo quy định tại điều lệ hoặc quyết định thành lập của pháp nhân đó.

3. Có tài sản độc lập với cá nhân, pháp nhân khác và tự chịu trách nhiệm bằng tài sản của mình:
Tài sản của pháp nhân tách biệt hoàn toàn khỏi tài sản riêng của các thành viên sáng lập, góp vốn; pháp nhân tự chịu trách nhiệm về các nghĩa vụ tài chính trong phạm vi tài sản của mình.

4. Nhân danh chính mình tham gia các quan hệ pháp luật một cách độc lập:
Pháp nhân có quyền tự mình xác lập giao dịch, ký kết hợp đồng, đứng tên nguyên đơn hoặc bị đơn trong tố tụng tại Tòa án và trọng tài."""
    },

    # --- CÂU 10 (Trang 12) ---
    {
        "sample_id": "SFT_10D_CH7_010",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy phân tích và trả lời câu hỏi tự luận Pháp luật Đại cương sau đây theo thang điểm 10 chuẩn Barem.",
        "input": "Câu 10: Khái niệm Tham nhũng theo Luật Phòng, chống tham nhũng 2018. Phân tích nguyên nhân, hậu quả của tham nhũng và Trách nhiệm của công dân trong công tác phòng, chống tham nhũng.",
        "output": """Lời giải chi tiết / Lập luận pháp lý:

1. Khái niệm Tham nhũng (Thang điểm: 1.0 điểm)
Theo Khoản 1 Điều 3 Luật Phòng, chống tham nhũng 2018: "Tham nhũng là hành vi của người có chức vụ, quyền hạn đã lợi dụng chức vụ, quyền hạn đó vì vụ lợi."

2. Nguyên nhân và Hậu quả của tham nhũng (Thang điểm: 2.5 điểm)
● Nguyên nhân:
○ Chủ quan: Sự suy thoái về tư tưởng, đạo đức, lối sống của một bộ phận cán bộ, công chức; sự thiếu minh bạch, vụ lợi cá nhân.
○ Khách quan: Hệ thống pháp luật, cơ chế quản lý kinh tế - xã hội còn lỗ hổng; công tác kiểm tra, giám sát chưa đủ chặt chẽ; chế độ đãi ngộ đối với cán bộ, công chức chưa thực sự thỏa đáng.
● Hậu quả:
○ Về kinh tế: Làm thất thoát tài sản nhà nước, giảm hiệu quả đầu tư, cản trở sự phát triển kinh tế.
○ Về chính trị - xã hội: Làm suy giảm niềm tin của nhân dân vào Đảng và Nhà nước, xói mòn chuẩn mực đạo đức xã hội, gây bất bình đẳng xã hội.

3. Trách nhiệm của Công dân trong phòng, chống tham nhũng (Thang điểm: 1.5 điểm)
● Chấp hành nghiêm chỉnh pháp luật về phòng, chống tham nhũng.
● Phát hiện, phản ánh, tố cáo, tố giác hành vi tham nhũng đến các cơ quan có thẩm quyền.
● Hợp tác với cơ quan, tổ chức, cá nhân có thẩm quyền trong việc xác minh, xử lý hành vi tham nhũng.
● Trực tiếp hoặc thông qua các tổ chức xã hội tham gia giám sát hoạt động của các cơ quan, cán bộ, công chức nhà nước."""
    },
    {
        "sample_id": "SFT_10D_CH7_010_SUB1",
        "intent_code": "GENERAL_THEORY",
        "instruction": "Hãy phân tích trách nhiệm của công dân trong phòng chống tham nhũng.",
        "input": "Công dân có những quyền và trách nhiệm gì trong công tác phòng, chống tham nhũng theo Luật PCTN 2018?",
        "output": """Theo Luật Phòng, chống tham nhũng năm 2018, công dân đóng vai trò chủ thể giám sát quan trọng với 4 nhóm trách nhiệm chủ yếu:

1. Chấp hành nghiêm chỉnh pháp luật về phòng, chống tham nhũng:
Bản thân công dân không thực hiện hành vi đưa hối lộ, không tiếp tay, bao che hoặc môi giới cho các hành vi tiêu cực, nhũng nhiễu.

2. Chủ động phát hiện và tố cáo tham nhũng:
Kịp thời phản ánh, tố cáo, tố giác hành vi tham nhũng của người có chức vụ, quyền hạn đến cơ quan thanh tra, công an, viện kiểm sát hoặc người có thẩm quyền giải quyết.

3. Hợp tác với cơ quan có thẩm quyền:
Cung cấp trung thực các chứng cứ, tài liệu, thông tin liên quan và hỗ trợ cơ quan chức năng trong quá trình xác minh, làm rõ, điều tra và xử lý người có hành vi tham nhũng.

4. Thực hiện quyền giám sát xã hội:
Trực tiếp hoặc thông qua Mặt trận Tổ quốc Việt Nam và các tổ chức đoàn thể xã hội thực hiện quyền giám sát việc thực hiện chính sách, pháp luật, đạo đức công vụ của cán bộ, công chức nhà nước."""
    },

    # =========================================================================
    # PHẦN 2: BÀI TẬP TÌNH HUỐNG THỰC TẾ VÀ LỜI GIẢI CHI TIẾT (TÌNH HUỐNG 1 - 3)
    # =========================================================================

    # --- TÌNH HUỐNG 1 (Trang 13 - 14) ---
    {
        "sample_id": "SFT_10D_CASE_001",
        "intent_code": "CASE_ANALYSIS",
        "instruction": "Hãy giải bài tập tình huống thực tế môn Pháp luật Đại cương theo đúng phương pháp lập luận pháp lý và thang điểm 10 chuẩn.",
        "input": """TÌNH HUỐNG 1: QUAN HỆ PHÁP LUẬT & NĂNG LỰC HÀNH VI DÂN SỰ (Chương 4 & 6)
Đề bài:
Nguyễn Văn A (16 tuổi) được ông ngoại tặng cho một chiếc xe máy số trị giá 22 triệu đồng nhân dịp sinh nhật. Do cần tiền mua laptop chơi game, A đã tự ý bán chiếc xe máy này cho anh B (25 tuổi, người cùng làng) với giá 15 triệu đồng mà không hỏi ý kiến của bố mẹ. Khi bố mẹ A phát hiện ra sự việc đã tìm gặp anh B yêu cầu hủy hợp đồng mua bán và trả lại chiếc xe máy với lý do A chưa đủ tuổi bán tài sản có giá trị lớn. Anh B không đồng ý vì cho rằng giao dịch mua bán là hoàn toàn thuận mua vừa bán, A đã 16 tuổi và xe thuộc sở hữu riêng của A.

Hỏi:
1. Hợp đồng mua bán xe máy giữa A và anh B có hiệu lực pháp lý không? Tại sao?
2. Bố mẹ A có quyền yêu cầu Tòa án tuyên bố giao dịch trên vô hiệu không? Giải quyết tài sản ra sao?""",
        "output": """Lời giải chi tiết / Lập luận pháp lý:

1. Đánh giá tính hiệu lực của hợp đồng mua bán (Thang điểm: 2.5 điểm)
● Căn cứ pháp lý: Khoản 4 Điều 21 Bộ luật Dân sự 2015 quy định về người từ đủ 15 tuổi đến dưới 18 tuổi:
"Người từ đủ mười lăm tuổi đến dưới mười tám tuổi tự mình xác lập, thực hiện giao dịch dân sự, trừ giao dịch dân sự liên quan đến bất động sản, động sản phải đăng ký và giao dịch dân sự khác theo quy định của luật phải được người đại diện theo pháp luật đồng ý."
● Áp dụng pháp luật:
○ Xe máy là động sản phải đăng ký quyền sở hữu theo quy định của pháp luật giao thông đường bộ.
○ A hiện tại 16 tuổi (thuộc nhóm từ đủ 15 đến dưới 18 tuổi).
○ Do đó, khi A bán chiếc xe máy cho anh B, bắt buộc phải được sự đồng ý của người đại diện theo pháp luật (ở đây là bố mẹ của A).
○ Việc A tự ý giao dịch bán xe máy mà không có sự đồng ý của bố mẹ là vi phạm điều kiện về năng lực hành vi dân sự của chủ thể khi xác lập giao dịch.
● Kết luận: Hợp đồng mua bán giữa A và B không có hiệu lực pháp lý (vô hiệu do người chưa thành niên thực hiện).

2. Quyền của bố mẹ A và việc xử lý hậu quả pháp lý (Thang điểm: 2.5 điểm)
● Căn cứ pháp lý: Điều 125 BLDS 2015 (Giao dịch dân sự vô hiệu do người chưa thành niên xác lập, thực hiện) và Điều 131 BLDS 2015 (Hậu quả pháp lý của giao dịch dân sự vô hiệu).
● Giải quyết:
○ Bố mẹ A là người đại diện theo pháp luật có đầy đủ quyền gửi đơn yêu cầu Tòa án tuyên bố giao dịch mua bán xe giữa A và B là vô hiệu.
○ Xử lý hậu quả của giao dịch vô hiệu:
■ Các bên khôi phục lại tình trạng ban đầu, hoàn trả cho nhau những gì đã nhận.
■ Anh B phải giao trả lại chiếc xe máy cho gia đình A (A và bố mẹ).
■ Gia đình A (hoặc A) phải hoàn trả lại số tiền 15.000.000 đồng cho anh B.
■ Nếu có thiệt hại phát sinh thì bên có lỗi gây thiệt hại phải bồi thường theo quy định."""
    },
    {
        "sample_id": "SFT_10D_CASE_001_SUB1",
        "intent_code": "CASE_ANALYSIS",
        "instruction": "Hãy trả lời câu hỏi pháp lý tình huống môn Pháp luật Đại cương.",
        "input": "Tình huống: Nguyễn Văn A (16 tuổi) tự ý bán xe máy số trị giá 22 triệu đồng cho anh B (25 tuổi) với giá 15 triệu mà không hỏi ý kiến bố mẹ. Hợp đồng mua bán này có hiệu lực pháp lý không? Tại sao?",
        "output": """1. Kết luận:
Hợp đồng mua bán xe máy giữa Nguyễn Văn A và anh B KHÔNG CÓ HIỆU LỰC PHÁP LÝ (giao dịch dân sự vô hiệu).

2. Căn cứ pháp lý:
- Khoản 4 Điều 21 Bộ luật Dân sự 2015: "Người từ đủ mười lăm tuổi đến dưới mười tám tuổi tự mình xác lập, thực hiện giao dịch dân sự, trừ giao dịch dân sự liên quan đến bất động sản, động sản phải đăng ký và giao dịch dân sự khác theo quy định của luật phải được người đại diện theo pháp luật đồng ý."
- Điều 117 và Điều 125 Bộ luật Dân sự 2015 về điều kiện có hiệu lực của giao dịch dân sự.

3. Lập luận:
- Xe máy là động sản bắt buộc phải đăng ký quyền sở hữu theo quy định của pháp luật.
- A mới 16 tuổi (thuộc độ tuổi từ đủ 15 đến dưới 18 tuổi), do đó khi định đoạt bán xe máy phải có sự đồng ý của cha mẹ là người đại diện theo pháp luật.
- Việc A tự ý bán xe khi chưa có sự đồng ý của cha mẹ đã vi phạm điều kiện về năng lực hành vi dân sự của chủ thể tham gia giao dịch, nên hợp đồng vô hiệu."""
    },
    {
        "sample_id": "SFT_10D_CASE_001_SUB2",
        "intent_code": "CASE_ANALYSIS",
        "instruction": "Hãy giải quyết hậu quả pháp lý của giao dịch dân sự vô hiệu do người chưa thành niên xác lập.",
        "input": "Trong tình huống A (16 tuổi) tự ý bán xe máy cho B với giá 15 triệu đồng: Bố mẹ A có quyền yêu cầu hủy hợp đồng không và hậu quả tài sản được xử lý như thế nào theo quy định của Bộ luật Dân sự 2015?",
        "output": """1. Về quyền của bố mẹ A:
Căn cứ Điều 125 Bộ luật Dân sự 2015, bố mẹ của A là người đại diện theo pháp luật có đầy đủ quyền làm đơn yêu cầu Tòa án tuyên bố giao dịch mua bán xe giữa A và anh B là vô hiệu.

2. Về xử lý hậu quả pháp lý của giao dịch vô hiệu (Căn cứ Điều 131 BLDS 2015):
- Giao dịch vô hiệu không làm phát sinh, thay đổi, chấm dứt quyền, nghĩa vụ dân sự của các bên kể từ thời điểm giao dịch được xác lập.
- Các bên có nghĩa vụ khôi phục lại tình trạng ban đầu, hoàn trả cho nhau những gì đã nhận:
  + Anh B phải giao trả lại chiếc xe máy cho gia đình A.
  + Gia đình A (hoặc A) phải hoàn trả lại số tiền 15.000.000 đồng đã nhận cho anh B.
- Bên nào có lỗi gây thiệt hại thì phải bồi thường theo quy định của pháp luật."""
    },

    # --- TÌNH HUỐNG 2 (Trang 14 - 16) ---
    {
        "sample_id": "SFT_10D_CASE_002",
        "intent_code": "CASE_ANALYSIS",
        "instruction": "Hãy giải bài tập tình huống thực tế môn Pháp luật Đại cương theo đúng phương pháp lập luận pháp lý và thang điểm 10 chuẩn.",
        "input": """TÌNH HUỐNG 2: VI PHẠM PHÁP LUẬT VÀ TRÁCH NHIỆM PHÁP LÝ (Chương 5)
Đề bài:
Ông Trần Văn X (42 tuổi, lái xe tải của Công ty VT) điều khiển xe tải lưu thông trên quốc lộ. Do đã uống bia rượu tại tiệm tạp hóa trước đó (nồng độ cồn đo được vượt quá mức cho phép) và điều khiển xe chạy quá tốc độ quy định (75km/h ở đoạn đường giới hạn 50km/h), ông X đã tông vào xe máy do anh K điều khiển đi đúng làn đường. Hậu quả: Anh K tử vong tại chỗ, xe máy hư hỏng nặng (thiệt hại ước tính 30 triệu đồng).

Hỏi:
1. Hành vi của ông X có cấu thành Vi phạm pháp luật không? Phân tích 4 yếu tố cấu thành VPPL của ông X.
2. Ông X và Công ty VT phải chịu những loại Trách nhiệm pháp lý nào?""",
        "output": """Lời giải chi tiết / Lập luận pháp lý:

1. Phân tích 4 yếu tố cấu thành Vi phạm pháp luật của ông X (Thang điểm: 3.0 điểm)
Hành vi của ông X đã cấu thành Vi phạm pháp luật (Cụ thể là Vi phạm hình sự - Tội vi phạm quy định về tham gia giao thông đường bộ theo Điều 260 BLHS 2015).

PHÂN TÍCH YẾU TỐ CẤU THÀNH:
1. MẶT KHÁCH QUAN:
- Hành vi: Lái xe khi có nồng độ cồn, chạy quá tốc độ (75/50 km/h).
- Hậu quả: Anh K tử vong tại chỗ; thiệt hại tài sản 30 triệu đồng.
- Mối quan hệ nhân quả: Hành vi vi phạm tốc độ/nồng độ cồn của ông X là nguyên nhân trực tiếp dẫn đến cái chết của anh K.

2. MẶT CHỦ QUAN:
- Lỗi: Vô ý do quá tự tin (hoặc Vô ý do cẩu thả). Ông X nhận thức được uống rượu và chạy quá tốc độ là nguy hiểm nhưng tin rằng hậu quả không xảy ra hoặc có thể ngăn ngừa được.

3. CHỦ THỂ:
- Ông Trần Văn X (42 tuổi) - Đủ độ tuổi chịu TNHS và hoàn toàn có năng lực trách nhiệm pháp lý.

4. KHÁCH THỂ:
- Xâm phạm đến An toàn giao thông đường bộ, Quyền được sống (tính mạng) của anh K và Quyền sở hữu tài sản.

2. Các loại Trách nhiệm pháp lý áp dụng (Thang điểm: 2.0 điểm)
● Đối với ông Trần Văn X:
○ Trách nhiệm Hình sự: Bị truy cứu trách nhiệm hình sự theo Điều 260 Bộ luật Hình sự 2015 (Khung hình phạt tăng nặng do sử dụng rượu bia có nồng độ cồn vượt quy định khi lái xe).
○ Trách nhiệm Hành chính: Bị phạt tiền và tước quyền sử dụng giấy phép lái xe đối với hành vi vi phạm hành chính về trật tự an toàn giao thông trước đó (nếu các hành vi này chưa được cấu thành bộ phận hình sự).
● Đối với Công ty VT (Chủ sở hữu nguồn nguy hiểm cao độ / Nguồn tài sản):
○ Trách nhiệm Dân sự: Theo Điều 600, 601 BLDS 2015, Công ty VT là bồi thường thiệt hại do người của mình (ông X) gây ra trong khi thực hiện nhiệm vụ được giao. Công ty VT có trách nhiệm bồi thường chi phí mai táng, tiền cấp dưỡng (nếu anh K có nghĩa vụ nuôi dưỡng) và thiệt hại xe máy hư hỏng cho gia đình anh K.
○ Sau khi bồi thường, Công ty VT có quyền yêu cầu ông X hoàn trả lại khoản tiền bồi thường này theo quy định của pháp luật lao động/dân sự."""
    },
    {
        "sample_id": "SFT_10D_CASE_002_SUB1",
        "intent_code": "VPPL_4_ELEMENTS",
        "instruction": "Hãy phân tích 4 yếu tố cấu thành vi phạm pháp luật trong tình huống tai nạn giao thông.",
        "input": "Tình huống: Ông Trần Văn X (42 tuổi, lái xe tải) say rượu, chạy quá tốc độ (75/50 km/h) tông trúng xe máy anh K làm anh K tử vong tại chỗ, xe máy thiệt hại 30 triệu. Hãy phân tích 4 yếu tố cấu thành vi phạm pháp luật của ông X?",
        "output": """Hành vi của ông X đã cấu thành Vi phạm pháp luật hình sự (Tội phạm theo Điều 260 BLHS 2015):

1. Mặt khách quan:
- Hành vi nguy hiểm cho xã hội: Điều khiển xe tải trong tình trạng có nồng độ cồn vượt mức quy định và chạy quá tốc độ giới hạn (75 km/h trên đoạn đường tối đa 50 km/h).
- Hậu quả: Làm anh K tử vong tại chỗ và gây thiệt hại tài sản (xe máy hư hỏng trị giá 30 triệu đồng).
- Quan hệ nhân quả: Hành vi lái xe vi phạm tốc độ và nồng độ cồn của ông X là nguyên nhân trực tiếp dẫn tới tai nạn và cái chết của anh K.

2. Mặt chủ quan:
- Lỗi vô ý do quá tự tin: Ông X nhận thức được lái xe khi uống rượu bia và chạy quá tốc độ là nguy hiểm, nhưng tự tin vào tay lái và cho rằng hậu quả sẽ không xảy ra hoặc có thể xử lý được.

3. Chủ thể:
Ông Trần Văn X đã 42 tuổi, có đầy đủ năng lực trách nhiệm hình sự (đạt độ tuổi luật định và nhận thức bình thường).

4. Khách thể:
Xâm phạm trật tự an toàn giao thông đường bộ, đồng thời trực tiếp xâm phạm tính mạng (quyền được sống) của anh K và quyền sở hữu tài sản của công dân."""
    },
    {
        "sample_id": "SFT_10D_CASE_002_SUB2",
        "intent_code": "CASE_ANALYSIS",
        "instruction": "Hãy xác định các loại trách nhiệm pháp lý áp dụng trong tình huống tai nạn giao thông.",
        "input": "Trong vụ tai nạn ông X lái xe tải say rượu gây chết người: Ông X và Công ty VT (chủ xe) phải chịu những loại trách nhiệm pháp lý nào?",
        "output": """1. Trách nhiệm pháp lý đối với ông Trần Văn X:
- Trách nhiệm Hình sự: Bị khởi tố, truy cứu trách nhiệm hình sự theo Điều 260 Bộ luật Hình sự 2015 với tình tiết định khung tăng nặng là sử dụng rượu bia có nồng độ cồn vượt quá mức quy định.
- Trách nhiệm Hành chính: Bị tước quyền sử dụng giấy phép lái xe theo luật giao thông.
- Trách nhiệm Hoàn trả nội bộ: Có nghĩa vụ bồi hoàn số tiền mà công ty đã bồi thường cho nạn nhân theo quy định của pháp luật lao động.

2. Trách nhiệm pháp lý đối với Công ty VT:
- Căn cứ Điều 600 và Điều 601 Bộ luật Dân sự 2015 về bồi thường thiệt hại do người của pháp nhân gây ra và bồi thường thiệt hại do nguồn nguy hiểm cao độ gây ra:
- Công ty VT phải chịu Trách nhiệm Dân sự bồi thường toàn bộ thiệt hại cho gia đình anh K, bao gồm:
  + Chi phí hợp lý cho việc mai táng nạn nhân.
  + Tiền bồi thường thiệt hại tài sản (xe máy hư hỏng trị giá 30 triệu đồng).
  + Khoản tiền bù đắp tổn thất về tinh thần cho thân nhân nạn nhân.
  + Tiền cấp dưỡng nuôi con chưa thành niên hoặc người mà anh K đang có nghĩa vụ nuôi dưỡng (nếu có)."""
    },

    # --- TÌNH HUỐNG 3 (Trang 16 - 18) ---
    {
        "sample_id": "SFT_10D_CASE_003",
        "intent_code": "CIVIL_INHERIT",
        "instruction": "Hãy giải bài tập tình huống thực tế môn Pháp luật Đại cương theo đúng phương pháp lập luận pháp lý và thang điểm 10 chuẩn.",
        "input": """TÌNH HUỐNG 3: THỪA KẾ THEO PHÁP LUẬT VÀ DI CHÚC (Chương 6)
Đề bài:
Ông An và bà Bình là vợ chồng, có tài sản chung hợp pháp là một căn nhà và đất trị giá 3.6 tỷ đồng. Ông bà có 2 người con đẻ là Cường (sinh năm 1990) và Dũng (sinh năm 1995). Cường đã lập gia đình và có con là Bé X (5 tuổi). Năm 2022, Cường không may qua đời do tai nạn lao động.

Năm 2023, do đau buồn và bệnh nặng, ông An qua đời. Trước khi mất, ông An có lập di chúc hợp pháp với nội dung: "Để lại toàn bộ phần tài sản của tôi cho con trai là Dũng". Hãy xác định và chia di sản thừa kế của ông An theo quy định của Bộ luật Dân sự 2015.""",
        "output": """Lời giải chi tiết / Lập luận pháp lý:

Bước 1: Xác định khối di sản thừa kế của ông An (Thang điểm: 1.0 điểm)
● Tài sản chung của ông An và bà Bình = 3.600.000.000 đồng.
● Theo quy định về tài sản chung vợ chồng (Điều 66 Luật Hôn nhân & Gia đình), phần tài sản của ông An trong khối tài sản chung là 1/2.
● Khối di sản thừa kế của ông An = 3.6 tỷ / 2 = 1.800.000.000 đồng (1.8 tỷ đồng).

Bước 2: Xác định suất thừa kế bắt buộc không phụ thuộc vào di chúc (Thang điểm: 2.0 điểm)
● Căn cứ pháp lý: Điều 644 Bộ luật Dân sự 2015 (Người thừa kế không phụ thuộc vào nội dung của di chúc):
"Những người sau đây vẫn được hưởng phần di sản bằng hai phần ba suất của một người thừa kế theo pháp luật nếu di sản được chia theo pháp luật, trong trường hợp họ không được người lập di chúc cho hưởng di sản hoặc chỉ cho hưởng phần di sản ít hơn hai phần ba suất đó: a) Con chưa thành niên, cha, mẹ, vợ, chồng; b) Con đã thành niên mà không có khả năng lao động."
● Tính toán suất thừa kế theo pháp luật (nếu không có di chúc):
○ Những người thuộc hàng thừa kế thứ nhất của ông An gồm: Bà Bình (vợ), Cường (con - đã chết trước ông An nên cháu X được thừa kế thế vị theo Điều 652), Dũng (con).
○ Tổng số người thừa kế theo pháp luật = 3 người (Bà Bình, Cường/X thế vị, Dũng).
○ Giá trị 1 suất thừa kế theo pháp luật = 1.800.000.000 / 3 = 600.000.000 đồng.
● Xác định đối tượng hưởng thừa kế bắt buộc (Điều 644):
○ Bà Bình (vợ của ông An) thuộc đối tượng hưởng 2/3 một suất thừa kế theo pháp luật.
○ Mức di sản bà Bình bắt buộc phải nhận = 2/3 x 600.000.000 = 400.000.000 đồng.

Bước 3: Chia di sản theo di chúc và thế vị (Thang điểm: 2.0 điểm)
● Tổng di sản: 1.800.000.000 đồng.
● Trích trả cho bà Bình (suất bắt buộc): 400.000.000 đồng.
● Số di sản còn lại dùng để thực hiện di chúc = 1.800.000.000 - 400.000.000 = 1.400.000.000 đồng.
● Theo di chúc, ông An cho Dũng toàn bộ phần di sản của mình, do đó Dũng nhận trọn vẹn phần còn lại này là 1.400.000.000 đồng.

(Lưu ý: Bé X không được hưởng thừa kế thế vị đối với di chúc của ông An vì ông An đã lập di chúc định đoạt tài sản hợp pháp và phần di sản thế vị chỉ áp dụng cho chia theo pháp luật).

TỔNG KẾT BẢNG CHIA DI SẢN THỪA KẾ:
| Chủ thể nhận di sản | Căn cứ nhận di sản | Số tiền thực nhận |
|---|---|---|
| Bà Bình (Vợ) | Hưởng suất bắt buộc (Điều 644 BLDS 2015) | 400.000.000 VNĐ |
| Anh Dũng (Con) | Hưởng theo di chúc của ông An | 1.400.000.000 VNĐ |
| Bé X (Cháu) | Không được hưởng (Do ông An có di chúc hợp pháp) | 0 VNĐ |
| TỔNG CỘNG | Khối di sản của ông An | 1.800.000.000 VNĐ |"""
    },
    {
        "sample_id": "SFT_10D_CASE_003_SUB1",
        "intent_code": "CIVIL_INHERIT",
        "instruction": "Hãy giải thích quy định về suất thừa kế bắt buộc không phụ thuộc vào di chúc trong tình huống thừa kế.",
        "input": "Trong tình huống ông An để lại di chúc cho một mình con trai Dũng: Tại sao bà Bình (vợ ông An) vẫn được nhận 400 triệu đồng di sản dù di chúc không chia cho bà?",
        "output": """Bà Bình vẫn được nhận 400 triệu đồng là do quy định bảo vệ người thừa kế không phụ thuộc vào nội dung di chúc:

1. Căn cứ pháp lý:
Khoản 1 Điều 644 Bộ luật Dân sự 2015 quy định: Vợ, chồng, cha, mẹ, con chưa thành niên hoặc con đã thành niên không có khả năng lao động vẫn được hưởng phần di sản bằng 2/3 một suất của một người thừa kế theo pháp luật nếu di sản được chia theo luật, trong trường hợp họ không được người lập di chúc cho hưởng di sản hoặc chỉ cho hưởng ít hơn 2/3 suất đó.

2. Tính toán cụ thể:
- Di sản ông An để lại: 1.800.000.000 đồng (1/2 tài sản chung 3.6 tỷ).
- Nếu chia theo pháp luật: Hàng thừa kế thứ nhất có 3 suất (Bà Bình, cháu X thế vị cho Cường đã chết trước, và Dũng).
- Giá trị 1 suất theo luật = 1.800.000.000 / 3 = 600.000.000 đồng.
- Suất bắt buộc của bà Bình = 2/3 x 600.000.000 = 400.000.000 đồng.

Vì vậy, phần di chúc để lại cho Dũng bắt buộc phải trích ra 400.000.000 đồng để thanh toán cho bà Bình."""
    },
    {
        "sample_id": "SFT_10D_CASE_003_SUB2",
        "intent_code": "CIVIL_INHERIT",
        "instruction": "Hãy phân tích về thừa kế thế vị trong trường hợp người chết có để lại di chúc hợp pháp.",
        "input": "Trong tình huống thừa kế của ông An: Tại sao cháu X (con của anh Cường đã chết trước ông An) lại không được hưởng thừa kế?",
        "output": """Cháu Bé X không được hưởng phần di sản thừa kế nào trong trường hợp này vì các lý do pháp lý sau:

1. Thừa kế thế vị chỉ áp dụng khi chia thừa kế theo pháp luật (Điều 652 BLDS 2015):
Thừa kế thế vị chỉ phát sinh khi người để lại di sản không có di chúc (hoặc di chúc bị vô hiệu) dẫn tới di sản phải chia theo quy định của pháp luật.

2. Hiệu lực của di chúc:
Ông An đã lập di chúc hợp pháp định đoạt toàn bộ khối di sản 1.8 tỷ đồng của mình cho con trai là Dũng. Quyền tự do lập di chúc định đoạt tài sản của ông An được pháp luật tôn trọng và bảo vệ.

3. Cháu X không thuộc đối tượng hưởng thừa kế bắt buộc:
Căn cứ Điều 644 Bộ luật Dân sự 2015, người thừa kế không phụ thuộc vào nội dung di chúc chỉ gồm: Cha, mẹ, vợ, chồng, con chưa thành niên hoặc con đã thành niên không có khả năng lao động. Cháu nội/cháu ngoại KHÔNG thuộc đối tượng được hưởng thừa kế bắt buộc.

Do đó, sau khi trích trả suất bắt buộc cho bà Bình (vợ ông An), toàn bộ di sản còn lại (1,4 tỷ đồng) thuộc về anh Dũng theo di chúc."""
    }
]
