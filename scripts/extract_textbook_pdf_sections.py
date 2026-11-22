# -*- coding: utf-8 -*-
"""
Trích xuất toàn bộ 58 tiểu mục thuộc 9 Chương từ file
data/raw/giao_trinh_phap_luat_dai_cuong_2021.pdf (237 trang, NXB Hà Nội 2021),
làm sạch triệt để lỗi tách ký tự OCR tiếng Việt và lưu ra data/rag/textbook_pdf_58_sections.json.
"""

import json
import os
import re
import sys
import pypdf

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

PDF_PATH = "data/raw/giao_trinh_phap_luat_dai_cuong_2021.pdf"
OUT_PATH = "data/rag/textbook_pdf_58_sections.json"

# (sectionCode, chapterNumber, chapterTitle, sectionTitle, bookPageStart, bookPageEnd)
# Book page N corresponds to 0-based PDF page index N (because PDF page 0 is cover, page 1 is book p.1)
TOC_SECTIONS = [
    ("1.1.1", 1, "Chương 1: Lý luận cơ bản về Nhà nước - Nhà nước CHXHCN Việt Nam", "Nguồn gốc của nhà nước", 5, 10),
    ("1.1.2", 1, "Chương 1: Lý luận cơ bản về Nhà nước - Nhà nước CHXHCN Việt Nam", "Khái niệm nhà nước", 10, 11),
    ("1.1.3", 1, "Chương 1: Lý luận cơ bản về Nhà nước - Nhà nước CHXHCN Việt Nam", "Bản chất và đặc điểm của nhà nước", 11, 14),
    ("1.1.4", 1, "Chương 1: Lý luận cơ bản về Nhà nước - Nhà nước CHXHCN Việt Nam", "Hình thức nhà nước", 14, 16),
    ("1.1.5", 1, "Chương 1: Lý luận cơ bản về Nhà nước - Nhà nước CHXHCN Việt Nam", "Chức năng nhà nước", 16, 18),
    ("1.1.6", 1, "Chương 1: Lý luận cơ bản về Nhà nước - Nhà nước CHXHCN Việt Nam", "Các kiểu nhà nước trong lịch sử", 18, 21),
    ("1.2.1", 1, "Chương 1: Lý luận cơ bản về Nhà nước - Nhà nước CHXHCN Việt Nam", "Sự ra đời, bản chất và chức năng của Nhà nước CHXHCN Việt Nam", 21, 25),
    ("1.2.2", 1, "Chương 1: Lý luận cơ bản về Nhà nước - Nhà nước CHXHCN Việt Nam", "Hình thức Nhà nước CHXHCN Việt Nam", 25, 27),
    ("1.2.3", 1, "Chương 1: Lý luận cơ bản về Nhà nước - Nhà nước CHXHCN Việt Nam", "Bộ máy Nhà nước CHXHCN Việt Nam", 27, 32),

    ("2.1.1", 2, "Chương 2: Một số vấn đề lý luận cơ bản về Pháp luật", "Khái niệm pháp luật", 33, 34),
    ("2.1.2", 2, "Chương 2: Một số vấn đề lý luận cơ bản về Pháp luật", "Nguồn gốc pháp luật", 34, 35),
    ("2.1.3", 2, "Chương 2: Một số vấn đề lý luận cơ bản về Pháp luật", "Đặc trưng cơ bản của pháp luật", 35, 37),
    ("2.1.4", 2, "Chương 2: Một số vấn đề lý luận cơ bản về Pháp luật", "Bản chất của pháp luật", 37, 39),
    ("2.2.1", 2, "Chương 2: Một số vấn đề lý luận cơ bản về Pháp luật", "Mối quan hệ giữa pháp luật với kinh tế", 39, 40),
    ("2.2.2", 2, "Chương 2: Một số vấn đề lý luận cơ bản về Pháp luật", "Mối quan hệ giữa pháp luật với chính trị", 40, 40),
    ("2.2.3", 2, "Chương 2: Một số vấn đề lý luận cơ bản về Pháp luật", "Mối quan hệ giữa pháp luật với nhà nước", 40, 41),
    ("2.2.4", 2, "Chương 2: Một số vấn đề lý luận cơ bản về Pháp luật", "Mối quan hệ giữa pháp luật với đạo đức", 41, 42),
    ("2.3.1", 2, "Chương 2: Một số vấn đề lý luận cơ bản về Pháp luật", "Khái niệm và các hình thức pháp luật", 42, 47),
    ("2.3.3", 2, "Chương 2: Một số vấn đề lý luận cơ bản về Pháp luật", "Các loại văn bản quy phạm pháp luật ở Việt Nam hiện nay", 47, 52),
    ("2.3.4", 2, "Chương 2: Một số vấn đề lý luận cơ bản về Pháp luật", "Hiệu lực của văn bản quy phạm pháp luật ở Việt Nam", 52, 56),
    ("2.3.5", 2, "Chương 2: Một số vấn đề lý luận cơ bản về Pháp luật", "Nguyên tắc áp dụng văn bản quy phạm pháp luật", 56, 57),
    ("2.4.1", 2, "Chương 2: Một số vấn đề lý luận cơ bản về Pháp luật", "Khái niệm, đặc điểm và cấu thành của hệ thống pháp luật", 57, 62),
    ("2.5.1", 2, "Chương 2: Một số vấn đề lý luận cơ bản về Pháp luật", "Sự ra đời, bản chất và đặc điểm pháp luật nước CHXHCN Việt Nam", 62, 67),
    ("2.5.2", 2, "Chương 2: Một số vấn đề lý luận cơ bản về Pháp luật", "Các ngành luật cơ bản trong hệ thống pháp luật Việt Nam", 67, 70),

    ("3.1.1", 3, "Chương 3: Quy phạm pháp luật và Thực hiện pháp luật", "Khái niệm và đặc điểm quy phạm pháp luật", 71, 73),
    ("3.1.2", 3, "Chương 3: Quy phạm pháp luật và Thực hiện pháp luật", "Cấu thành của quy phạm pháp luật (Giả định, Quy định, Chế tài)", 73, 78),
    ("3.1.3", 3, "Chương 3: Quy phạm pháp luật và Thực hiện pháp luật", "Phương thức thể hiện của quy phạm pháp luật", 78, 79),
    ("3.1.4", 3, "Chương 3: Quy phạm pháp luật và Thực hiện pháp luật", "Phân loại quy phạm pháp luật", 79, 80),
    ("3.2.1", 3, "Chương 3: Quy phạm pháp luật và Thực hiện pháp luật", "Khái niệm và các hình thức thực hiện pháp luật", 80, 82),
    ("3.2.2", 3, "Chương 3: Quy phạm pháp luật và Thực hiện pháp luật", "Áp dụng pháp luật và các giai đoạn áp dụng pháp luật", 82, 89),

    ("4.1.1", 4, "Chương 4: Quan hệ pháp luật", "Khái niệm và các đặc điểm đặc trưng cơ bản của quan hệ pháp luật", 90, 93),
    ("4.2.1", 4, "Chương 4: Quan hệ pháp luật", "Chủ thể của quan hệ pháp luật", 93, 98),
    ("4.2.2", 4, "Chương 4: Quan hệ pháp luật", "Nội dung của quan hệ pháp luật (Quyền chủ thể và Nghĩa vụ pháp lý)", 98, 100),
    ("4.2.3", 4, "Chương 4: Quan hệ pháp luật", "Khách thể của quan hệ pháp luật", 100, 100),
    ("4.3.1", 4, "Chương 4: Quan hệ pháp luật", "Khái niệm và phân loại sự kiện pháp lý (Sự biến và Hành vi pháp lý)", 100, 103),

    ("5.1.1", 5, "Chương 5: Vi phạm pháp luật và Trách nhiệm pháp lý", "Khái niệm và các dấu hiệu cơ bản của vi phạm pháp luật", 104, 108),
    ("5.1.2", 5, "Chương 5: Vi phạm pháp luật và Trách nhiệm pháp lý", "Cấu thành vi phạm pháp luật (4 yếu tố)", 108, 111),
    ("5.1.3", 5, "Chương 5: Vi phạm pháp luật và Trách nhiệm pháp lý", "Phân loại vi phạm pháp luật", 111, 112),
    ("5.2.1", 5, "Chương 5: Vi phạm pháp luật và Trách nhiệm pháp lý", "Khái niệm, đặc điểm và các loại trách nhiệm pháp lý", 112, 116),

    ("6.1.1", 6, "Chương 6: Một số nội dung cơ bản của Luật Dân sự", "Đối tượng điều chỉnh và phương pháp điều chỉnh của Luật Dân sự", 117, 121),
    ("6.2.1", 6, "Chương 6: Một số nội dung cơ bản của Luật Dân sự", "Chủ thể của quan hệ pháp luật dân sự: Cá nhân", 121, 124),
    ("6.2.2", 6, "Chương 6: Một số nội dung cơ bản của Luật Dân sự", "Chủ thể của quan hệ pháp luật dân sự: Pháp nhân", 124, 126),
    ("6.3.1", 6, "Chương 6: Một số nội dung cơ bản của Luật Dân sự", "Giao dịch dân sự, điều kiện có hiệu lực và giao dịch dân sự vô hiệu", 126, 130),
    ("6.4.1", 6, "Chương 6: Một số nội dung cơ bản của Luật Dân sự", "Tài sản và quyền sở hữu trong Bộ luật Dân sự 2015", 130, 135),
    ("6.5.1", 6, "Chương 6: Một số nội dung cơ bản của Luật Dân sự", "Quy định chung về thừa kế trong Bộ luật Dân sự 2015", 135, 139),
    ("6.5.2", 6, "Chương 6: Một số nội dung cơ bản của Luật Dân sự", "Thừa kế theo di chúc", 139, 144),
    ("6.5.3", 6, "Chương 6: Một số nội dung cơ bản của Luật Dân sự", "Thừa kế theo pháp luật và thừa kế thế vị", 144, 147),

    ("7.1.1", 7, "Chương 7: Một số nội dung cơ bản của Luật Hình sự", "Khái niệm, nguyên tắc cơ bản và nguồn của Luật Hình sự Việt Nam", 148, 159),
    ("7.2.1", 7, "Chương 7: Một số nội dung cơ bản của Luật Hình sự", "Khái niệm, đặc điểm và phân loại tội phạm", 160, 165),
    ("7.2.3", 7, "Chương 7: Một số nội dung cơ bản của Luật Hình sự", "Đồng phạm trong Luật Hình sự Việt Nam", 165, 166),
    ("7.2.4", 7, "Chương 7: Một số nội dung cơ bản của Luật Hình sự", "Các giai đoạn thực hiện tội phạm", 166, 168),
    ("7.2.5", 7, "Chương 7: Một số nội dung cơ bản của Luật Hình sự", "Các trường hợp loại trừ trách nhiệm hình sự", 168, 171),
    ("7.3.1", 7, "Chương 7: Một số nội dung cơ bản của Luật Hình sự", "Khái niệm, đặc điểm, hệ thống hình phạt và biện pháp tư pháp", 171, 180),

    ("8.1.1", 8, "Chương 8: Một số nội dung cơ bản của Luật Hành chính", "Khái niệm, đối tượng điều chỉnh và phương pháp điều chỉnh của Luật Hành chính", 181, 190),
    ("8.2.1", 8, "Chương 8: Một số nội dung cơ bản của Luật Hành chính", "Quan hệ pháp luật hành chính (Khái niệm, đặc điểm, chủ thể, khách thể)", 190, 195),
    ("8.3.1", 8, "Chương 8: Một số nội dung cơ bản của Luật Hành chính", "Vi phạm pháp luật hành chính và Trách nhiệm hành chính", 195, 201),

    ("9.1.1", 9, "Chương 9: Một số nội dung cơ bản của Pháp luật về Phòng, chống tham nhũng", "Khái niệm chung về tham nhũng và Pháp luật phòng, chống tham nhũng", 202, 209),
    ("9.2.1", 9, "Chương 9: Một số nội dung cơ bản của Pháp luật về Phòng, chống tham nhũng", "Các hành vi tham nhũng và xử lý hành vi tham nhũng", 209, 215),
    ("9.2.2", 9, "Chương 9: Một số nội dung cơ bản của Pháp luật về Phòng, chống tham nhũng", "Các biện pháp phòng ngừa tham nhũng theo Luật Phòng, chống tham nhũng 2018", 215, 222),
    ("9.2.3", 9, "Chương 9: Một số nội dung cơ bản của Pháp luật về Phòng, chống tham nhũng", "Trách nhiệm của cơ quan nhà nước và công dân trong phòng, chống tham nhũng", 222, 229),
]

# Common Vietnamese syllables split by pypdf on PDF font kerning
VN_DIAC = "àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ"
VN_ALL_LOWER = "a-z" + VN_DIAC + "đ"
VN_ALL_UPPER = "A-Z" + VN_DIAC.upper() + "Đ"

SPLIT_FIXES = [
    # Fix common multi-letter OCR kerning splits (strictly syllable-safe pairs!)
    (r"\bnhà\s+n\s+ước\b", "nhà nước"),
    (r"\bpháp\s+lu\s+ật\b", "pháp luật"),
    (r"\bquy\s+đ\s+ịnh\b", "quy định"),
    (r"\bqu\s+yền\b", "quyền"),
    (r"\bquy\s+ền\b", "quyền"),
    (r"\bquyề\s+n\b", "quyền"),
    (r"\blự\s+c\b", "lực"),
    (r"\bl\s+ực\b", "lực"),
    (r"\bth\s+ực\b", "thực"),
    (r"\bhi\s+ện\b", "hiện"),
    (r"\bhiệ\s+n\b", "hiện"),
    (r"\bch\s+ủ\b", "chủ"),
    (r"\bth\s+ể\b", "thể"),
    (r"\btr\s+ật\b", "trật"),
    (r"\btr\s+ình\b", "trình"),
    (r"\btr\s+ách\b", "trách"),
    (r"\bnhi\s+ệm\b", "nhiệm"),
    (r"\bngh\s+ĩa\b", "nghĩa"),
    (r"\bv\s+ụ\b", "vụ"),
    (r"\bh\s+ình\b", "hình"),
    (r"\bth\s+ức\b", "thức"),
    (r"\bch\s+ức\b", "chức"),
    (r"\bt\s+ổ\b", "tổ"),
    (r"\bđ\s+ối\b", "đối"),
    (r"\btư\s+ợng\b", "tượng"),
    (r"\bđ\s+ược\b", "được"),
    (r"\bđư\s+ợc\b", "được"),
    (r"\bngư\s+ời\b", "người"),
    (r"\bngườ\s+i\b", "người"),
    (r"\bn\s+ước\b", "nước"),
    (r"\bnướ\s+c\b", "nước"),
    (r"\bnh\s+ững\b", "những"),
    (r"\bnh\s+ưng\b", "nhưng"),
    (r"\bch\s+ính\b", "chính"),
    (r"\btr\s+ị\b", "trị"),
    (r"\bph\s+ạm\b", "phạm"),
    (r"\bvi\s+ệ\s*c\b", "việc"),
    (r"\bl\s+uật\b", "luật"),
    (r"\blu\s+ật\b", "luật"),
    (r"\bluậ\s+t\b", "luật"),
    (r"\bh\s+ợp\b", "hợp"),
    (r"\bđ\s+ồng\b", "đồng"),
    (r"\bt\s+ài\b", "tài"),
    (r"\bs\s+ản\b", "sản"),
    (r"\bs\s+ự\b", "sự"),
    (r"\bc\s+ủa\b", "của"),
    (r"\bcủ\s+a\b", "của"),
    (r"\bv\s+ề\b", "về"),
    (r"\bv\s+à\b", "và"),
    (r"\bl\s+à\b", "là"),
    (r"\bm\s+ột\b", "một"),
    (r"\bc\s+ác\b", "các"),
    (r"\bc\s+ó\b", "có"),
    (r"\bkh\s+ông\b", "không"),
    (r"\bph\s+ải\b", "phải"),
    (r"\btr\s+ong\b", "trong"),
    (r"\bng\s+ành\b", "ngành"),
    (r"\bđ\s+iều\b", "điều"),
    (r"\bđi\s+ều\b", "điều"),
    (r"\bkh\s+oản\b", "khoản"),
    (r"\bkho\s+ản\b", "khoản"),
    (r"\bg\s+ồm\b", "gồm"),
    (r"\bc\s+ơ\b", "cơ"),
    (r"\bb\s+ản\b", "bản"),
    (r"\bb\s+ộ\b", "bộ"),
    (r"\by\s+ếu\b", "yếu"),
    (r"\bt\s+ố\b", "tố"),
    (r"\bph\s+ương\b", "phương"),
    (r"\bphư\s+ơng\b", "phương"),
    (r"\bnguy\s+ên\b", "nguyên"),
    (r"\bt\s+ắc\b", "tắc"),
    (r"\bh\s+ành\b", "hành"),
    (r"\bqu\s+an\b", "quan"),
    (r"\bh\s+ệ\b", "hệ"),
    (r"\bx\s+ã\b", "xã"),
    (r"\bh\s+ội\b", "hội"),
    (r"\bnh\s+ân\b", "nhân"),
    (r"\bd\s+ân\b", "dân"),
    (r"\bc\s+ông\b", "công"),
    (r"\bđ\s+ịnh\b", "định"),
    (r"\bch\s+ế\b", "chế"),
    (r"\bđ\s+ộ\b", "độ"),
    (r"\bth\s+am\b", "tham"),
    (r"\bnh\s+ũng\b", "nhũng"),
    (r"\bnhũ\s+ng\b", "nhũng"),
    (r"\bt\s+ội\b", "tội"),
    (r"\bph\s+ạt\b", "phạt"),
    (r"\bph\s+ân\b", "phân"),
    (r"\bl\s+oại\b", "loại"),
    (r"\bg\s+iao\b", "giao"),
    (r"\bd\s+ịch\b", "dịch"),
    (r"\bth\s+ừa\b", "thừa"),
    (r"\bk\s+ế\b", "kế"),
    (r"\bc\s+ấu\b", "cấu"),
    (r"\bcấ\s+u\b", "cấu"),
    (r"\bt\s+ạo\b", "tạo"),
    (r"\bở\s+i\b", "ởi"),
    (r"\bb\s+ởi\b", "bởi"),
    (r"\bn\s+ắm\b", "nắm"),
    (r"\bnắ\s+m\b", "nắm"),
    (r"\bgi\s+ữ\b", "giữ"),
    (r"\bnh\s+ư\b", "như"),
    (r"\bc\s+ũng\b", "cũng"),
    (r"\bv\s+ậy\b", "vậy"),
    (r"\bhi\s+ểu\b", "hiểu"),
    (r"\bch\s+ủ\b", "chủ"),
    (r"\bđ\s+ặc\b", "đặc"),
    (r"\btr\s+ưng\b", "trưng"),
    (r"\bđi\s+ểm\b", "điểm"),
    (r"\bb\s+ao\b", "bao"),
    (r"\bc\s+ấp\b", "cấp"),
    (r"\bch\s+ất\b", "chất"),
    (r"\bgi\s+ai\b", "giai"),
    (r"\bng\s+uồn\b", "nguồn"),
    (r"\bngu\s+ồn\b", "nguồn"),
    (r"\bg\s+ốc\b", "gốc"),
    (r"\btr\s+ên\b", "trên"),
    (r"\bdư\s+ới\b", "dưới"),
    (r"\bgi\s+ải\b", "giải"),
    (r"\bth\s+ích\b", "thích"),
    (r"\bqu\s+ốc\b", "quốc"),
    (r"\bgi\s+a\b", "gia"),
    (r"\bv\s+ăn\b", "văn"),
    (r"\bh\s+iệu\b", "hiệu"),
    (r"\báp\s+d\s+ụng\b", "áp dụng"),
    (r"\bd\s+ụng\b", "dụng"),
    (r"\bt\s+ư\b", "tư"),
    (r"\bh\s+ữu\b", "hữu"),
    (r"\bs\s+ở\b", "sở"),
    (r"\bn\s+ăng\b", "năng"),
    (r"\bki\s+ểm\b", "kiểm"),
    (r"\bs\s+oát\b", "soát"),
    (r"\bph\s+òng\b", "phòng"),
    (r"\bch\s+ống\b", "chống"),
    (r"\bng\s+ừa\b", "ngừa"),
    (r"\bx\s+ử\b", "xử"),
    (r"\bl\s+ý\b", "lý"),
    (r"\bnh\s+à\b", "nhà"),
    (r"\bth\s+ành\b", "thành"),
    (r"\bqu\s+ản\b", "quản"),
    (r"\bl\s+ập\b", "lập"),
    (r"\bh\s+ọc\b", "học"),
    (r"\bt\s+ập\b", "tập"),
    (r"\bnghi\s+ên\b", "nghiên"),
    (r"\bc\s+ứu\b", "cứu"),
    (r"\bl\s+ợi\b", "lợi"),
    (r"\bích\b", "ích"),
    (r"\bđ\s+ời\b", "đời"),
    (r"\bs\s+ống\b", "sống"),
    (r"\bđ\s+ất\b", "đất"),
    (r"\bt\s+rường\b", "trường"),
    (r"\btrư\s+ờng\b", "trường"),
    (r"\bh\s+òa\b", "hòa"),
    (r"\bđ\s+ộc\b", "độc"),
    (r"\bnh\s+ất\b", "nhất"),
    (r"\bc\s+ao\b", "cao"),
    (r"\bth\s+ấp\b", "thấp"),
    (r"\bth\s+ời\b", "thời"),
    (r"\bg\s+ian\b", "gian"),
    (r"\bch\s+ưa\b", "chưa"),
    (r"\bđ\s+ã\b", "đã"),
    (r"\bđ\s+ang\b", "đang"),
    (r"\bkh\s+i\b", "khi"),
    (r"\bđ\s+ể\b", "để"),
    (r"\bnh\s+ằm\b", "nhằm"),
    (r"\bch\s+o\b", "cho"),
    (r"\bv\s+ới\b", "với"),
    (r"\bth\s+eo\b", "theo"),
    (r"\bkh\s+ác\b", "khác"),
    (r"\bn\s+ày\b", "này"),
    (r"\bđ\s+ó\b", "đó"),
    (r"\bch\s+ỉ\b", "chỉ"),
    (r"\btr\s+ước\b", "trước"),
    (r"\bs\s+au\b", "sau"),
    (r"\bt\s+ừ\b", "từ"),
    (r"\bđ\s+ến\b", "Đến"),
    (r"\bđế\s+n\b", "đến"),
    (r"\bm\s+ọi\b", "mọi"),
    (r"\bt\s+ất\b", "tất"),
    (r"\bc\s+ả\b", "cả"),
    (r"\bđ\s+ều\b", "đều"),
    (r"\bph\s+ục\b", "phục"),
    (r"\bb\s+ảo\b", "bảo"),
    (r"\bv\s+ệ\b", "vệ"),
    (r"\bđ\s+ảm\b", "đảm"),
    (r"\bcư\s+ỡng\b", "cưỡng"),
    (r"\bh\s+ậu\b", "hậu"),
    (r"\bqu\s+ả\b", "quả"),
    (r"\bt\s+ính\b", "tính"),
    (r"\bch\s+ất\b", "chất"),
    (r"\bm\s+ức\b", "mức"),
    (r"\bl\s+ỗi\b", "lỗi"),
    (r"\bc\s+ố\b", "cố"),
    (r"\bv\s+ô\b", "vô"),
    (r"\btr\s+ực\b", "trực"),
    (r"\bti\s+ếp\b", "tiếp"),
    (r"\bgi\s+án\b", "gián"),
    (r"\bnh\s+ận\b", "nhận"),
    (r"\bth\s+ức\b", "thức"),
    (r"\bđ\s+iều\b", "điều"),
    (r"\bkhi\s+ển\b", "khiển"),
    (r"\bkh\s+ách\b", "khách"),
    (r"\bch\s+ủ\b", "chủ"),
    (r"\bm\s+ặt\b", "mặt"),
    (r"\bt\s+òa\b", "tòa"),
    (r"\bán\b", "án"),
    (r"\bvi\s+ện\b", "viện"),
    (r"\bs\s+át\b", "sát"),
    (r"\bch\s+ính\b", "chính"),
    (r"\bph\s+ủ\b", "phủ"),
    (r"\bh\s+ội\b", "hội"),
    (r"\bt\s+ỉnh\b", "tỉnh"),
    (r"\bhuy\s+ện\b", "huyện"),
    (r"\bx\s+ã\b", "xã"),
    (r"\bhi\s+ến\b", "hiến"),
    (r"\bng\s+hị\b", "nghị"),
    (r"\bqu\s+yết\b", "quyết"),
    (r"\bth\s+ông\b", "thông"),
    (r"\bgi\s+ấy\b", "giấy"),
    (r"\bph\s+ép\b", "phép"),
    (r"\bch\s+ứng\b", "chứng"),
    (r"\bt\s+ổn\b", "tổn"),
    (r"\bth\s+ất\b", "thất"),
    (r"\bth\s+iệt\b", "thiệt"),
    (r"\bh\s+ại\b", "hại"),
    (r"\bb\s+ồi\b", "bồi"),
    (r"\bthư\s+ờng\b", "thường"),
    (r"\bk\s+ết\b", "kết"),
    (r"\bh\s+ôn\b", "hôn"),
    (r"\bl\s+y\b", "ly"),
    (r"\bl\s+ao\b", "lao"),
    (r"\bđ\s+ộng\b", "động"),
    (r"\bng\s+ười\b", "người"),
    (r"\bs\s+ử\b", "sử"),
    (r"\bti\s+ền\b", "tiền"),
    (r"\blư\s+ơng\b", "lương"),
    (r"\bth\s+ưởng\b", "thưởng"),
    (r"\bk\s+ỷ\b", "kỷ"),
    (r"\bph\s+áp\b", "pháp"),
    (r"\bl\s+ệ\b", "lệ"),
    (r"\bt\s+ập\b", "tập"),
    (r"\bqu\s+án\b", "quán"),
    (r"\bđ\s+ạo\b", "đạo"),
    (r"\bđ\s+ức\b", "đức"),
    (r"\bđ\s+ất\b", "đất"),
    (r"\bđ\s+ai\b", "đai"),
    (r"\bki\s+nh\b", "kinh"),
    (r"\bt\s+ế\b", "tế"),
    (r"\bv\s+ăn\b", "văn"),
    (r"\bh\s+óa\b", "hóa"),
    (r"\bgi\s+áo\b", "giáo"),
    (r"\bd\s+ục\b", "dục"),
    (r"\bm\s+ôi\b", "môi"),
    (r"\btr\s+ường\b", "trường"),
    (r"\bthu\s+ế\b", "thuế"),
    (r"\bng\s+ân\b", "ngân"),
    (r"\bs\s+ách\b", "sách"),
    (r"\bđ\s+ầu\b", "đầu"),
    (r"\bph\s+át\b", "phát"),
    (r"\btr\s+iển\b", "triển"),
    (r"\btri\s+ển\b", "triển"),
    (r"\bs\s+inh\b", "sinh"),
    (r"\bch\s+ết\b", "chết"),
    (r"\bm\s+ất\b", "mất"),
    (r"\bt\s+ích\b", "tích"),
    (r"\bdi\s+ch\s+úc\b", "di chúc"),
    (r"\bch\s+úc\b", "chúc"),
    (r"\bh\s+àng\b", "hàng"),
    (r"\bth\s+ứ\b", "thứ"),
    (r"\bnh\s+ị\b", "nhị"),
    (r"\bđ\s+ại\b", "đại"),
    (r"\bdi\s+ện\b", "diện"),
    (r"\bủy\s+qu\s+yền\b", "ủy quyền"),
    (r"\btư\s+ơng\b", "tương"),
    (r"\btuy\s+ệt\b", "tuyệt"),
    (r"\bng\s+oại\b", "ngoại"),
    (r"\bn\s+ội\b", "nội"),
    (r"\bph\s+ụ\b", "phụ"),
    (r"\bth\s+uộc\b", "thuộc"),
    (r"\bthu\s+ộc\b", "thuộc"),
    (r"\bt\s+ồn\b", "tồn"),
    (r"\bt\s+ại\b", "tại"),
    (r"\bx\s+uất\b", "xuất"),
    (r"\bng\s+hĩa\b", "nghĩa"),
    (r"\bth\s+ế\b", "thế"),
    (r"\bv\s+ị\b", "vị"),
    (r"\bgi\s+ả\b", "giả"),
    (r"\bch\s+ế\s+t\s+ài\b", "chế tài"),
    (r"\bt\s+ự\b", "tự"),
    (r"\bnguy\s+ện\b", "nguyện"),
    (r"\bth\s+ỏa\b", "thỏa"),
    (r"\bthu\s+ận\b", "thuận"),
    (r"\bb\s+ình\b", "bình"),
    (r"\bđ\s+ẳng\b", "đẳng"),
    (r"\bkh\s+ởi\b", "khởi"),
    (r"\bki\s+ện\b", "kiện"),
    (r"\bx\s+ét\b", "xét"),
    (r"\btr\s+uy\b", "truy"),
    (r"\bt\s+ố\b", "tố"),
    (r"\bt\s+ụng\b", "tụng"),
    (r"\bkh\s+áng\b", "kháng"),
    (r"\bc\s+áo\b", "cáo"),
    (r"\bt\s+ạm\b", "tạm"),
    (r"\bgi\s+am\b", "giam"),
    (r"\bb\s+ắt\b", "bắt"),
    (r"\bkh\s+ẩn\b", "khẩn"),
    (r"\bch\s+ấp\b", "chấp"),
    (r"\btu\s+ân\b", "tuân"),
    (r"\bth\s+ủ\b", "thủ"),
    (r"\bđ\s+ồng\s+ph\s+ạm\b", "đồng phạm"),
    (r"\bchu\s+ẩn\b", "chuẩn"),
    (r"\bb\s+ị\b", "bị"),
    (r"\bho\s+àn\b", "hoàn"),
    (r"\bch\s+ưa\b", "chưa"),
    (r"\bđ\s+ạt\b", "đạt"),
    (r"\blo\s+ại\b", "loại"),
    (r"\btr\s+ừ\b", "trừ"),
    (r"\bph\s+òng\s+v\s+ệ\b", "phòng vệ"),
    (r"\bđ\s+áng\b", "đáng"),
    (r"\bt\s+ình\b", "tình"),
    (r"\bth\s+iết\b", "thiết"),
    (r"\bb\s+ất\b", "bất"),
    (r"\bng\s+ờ\b", "ngờ"),
    (r"\bkh\s+ả\b", "khả"),
    (r"\bkh\s+áng\b", "kháng"),
    (r"\bc\s+ơ\s+qu\s+an\b", "cơ quan"),
    (r"\bki\s+ểu\b", "kiểu"),
    (r"\bch\s+ủ\s+n\s+ô\b", "chủ nô"),
    (r"\bph\s+ong\b", "phong"),
    (r"\bki\s+ến\b", "kiến"),
    (r"\bt\s+ư\s+s\s+ản\b", "tư sản"),
]

COMPILED_FIXES = [(re.compile(pat, re.IGNORECASE), rep) for pat, rep in SPLIT_FIXES]


def repair_case(orig: str, rep: str) -> str:
    if orig.isupper():
        return rep.upper()
    if orig and orig[0].isupper():
        return rep[0].upper() + rep[1:]
    return rep


def clean_pdf_page(raw: str) -> str:
    if not raw:
        return ""
    # Strip Studocu download watermarks
    text = re.sub(r"Downloaded\s+by\s+IDLAW[^\n]*", "", raw, flags=re.IGNORECASE)
    text = re.sub(r"lOMoARcPSD\|\d+", "", text)
    # Strip standalone page number line at top/bottom
    lines = text.splitlines()
    if lines and re.match(r"^\s*\d{1,3}\s*$", lines[0]):
        lines = lines[1:]
    if lines and re.match(r"^\s*\d{1,3}\s*$", lines[-1]):
        lines = lines[:-1]
    text = "\n".join(lines)

    # Join lines where a line doesn't end in sentence punctuation and next line starts with lowercase
    text = re.sub(
        r"([^\n.?!:;])\n(?=[" + VN_ALL_LOWER + r"])",
        r"\1 ",
        text,
    )
    text = re.sub(r"[ \t]{2,}", " ", text)

    # STEP 1: Apply exact known syllable/word fixes FIRST so "nhà n ước" -> "nhà nước" BEFORE any generic regex!
    for rx, rep in COMPILED_FIXES:
        text = rx.sub(lambda m, r=rep: repair_case(m.group(0), r), text)

    # STEP 2: Only join an isolated onset consonant (preceded by space/punctuation) to a following accented cluster:
    # e.g., " t ổ ch ức" -> " tổ chức", " tr ật" -> " trật", " đ ịnh" -> " định"
    for _ in range(2):
        text = re.sub(
            r"(?<=[\s(\"“\-—])(ch|gh|gi|kh|ng|ngh|nh|ph|qu|th|tr|[bcdđghklmnpqrstvx])\s+([" + VN_DIAC + r"][" + VN_ALL_LOWER + r"]*)",
            r"\1\2",
            text,
            flags=re.IGNORECASE,
        )
        # Re-run exact fixes after onset join
        for rx, rep in COMPILED_FIXES:
            text = rx.sub(lambda m, r=rep: repair_case(m.group(0), r), text)

    # STEP 3: Join split trailing consonant ONLY when preceded by an incomplete vowel cluster (NOT a standalone VN word!)
    standalone_words = {
        "nhà", "là", "và", "về", "có", "bị", "từ", "của", "mà", "đã", "sẽ", "để", "cho",
        "với", "tại", "khi", "như", "nếu", "thì", "vì", "do", "bởi", "hay", "hoặc", "nên",
        "rất", "quá", "lại", "cũng", "chỉ", "mọi", "các", "một", "hai", "ba", "bốn", "năm",
        "số", "bộ", "độ", "hệ", "vụ", "lệ", "trị", "xã", "tư", "cơ", "thế", "vị", "kế", "tố",
        "sự", "chủ", "thể", "thứ", "tự", "dự", "họ", "nó", "ta", "tôi", "bà", "cô", "chú",
        "chị", "bé", "kẻ", "trẻ", "già", "mẹ", "cha", "vợ", "con", "em", "anh", "ông", "cụ",
        "ở", "ra", "vào", "đi", "lên", "xuống", "qua", "sang", "đó", "này", "ấy", "đây", "kia",
        "tới", "theo", "nhờ", "dù", "tuy", "nhưng", "song", "còn", "đều", "chưa", "đang",
        "phá", "chớ", "đủ", "rõ", "kỹ", "dễ", "khó", "lớn", "nhỏ", "mới", "cũ", "tốt", "xấu",
        "bỏ", "mở", "giữ", "trả", "gửi", "gọi", "nói", "làm", "xem", "biết", "thấy", "mua", "bán",
        "nhỏ", "tòa", "án", "hòa", "lý", "ý", "kỳ", "tỷ", "lũ", "bão", "gió", "lửa", "cá", "chó"
    }

    def fix_trailing_split(m):
        w1 = m.group(1)
        tail = m.group(2)
        if w1.lower() in standalone_words:
            return m.group(0)
        return w1 + tail

    text = re.sub(
        r"\b([" + VN_ALL_LOWER + VN_ALL_UPPER + r"]*[" + VN_DIAC + r"])\s+(ng|nh|ch|[cmnpt])(?=$|[\s.,;:?!)\"”])",
        fix_trailing_split,
        text,
    )

    # Clean common leftover pairs like "nhà nước", "pháp luật", "của", "trong"
    text = text.replace(" Đến ", " đến ").replace("nhàn ước", "nhà nước").replace("làt ổ", "là tổ")
    # Remove stray footnote numbers stuck to quotes/words like 'nước”8.' -> 'nước”.'
    text = re.sub(r'([”"\'a-z' + VN_DIAC + r'])(\d{1,2})([.,;:])', r"\1\3", text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def main():
    reader = pypdf.PdfReader(PDF_PATH)
    total_pages = len(reader.pages)
    print(f"[*] Loaded PDF: {PDF_PATH} ({total_pages} pages)")

    cleaned_pages = {}
    for idx in range(total_pages):
        cleaned_pages[idx] = clean_pdf_page(reader.pages[idx].extract_text() or "")

    sections_out = []
    for sec_code, ch_num, ch_title, sec_title, p_start, p_end in TOC_SECTIONS:
        # Book page p corresponds to PDF index p (verified: p.14 -> PDF index 14, p.230 -> PDF index 230)
        chunks = []
        for p in range(p_start, min(p_end + 1, total_pages - 7)):
            if cleaned_pages.get(p):
                chunks.append(cleaned_pages[p])
        joined = "\n\n".join(chunks).strip()

        # Trim to start near sec_code heading if found inside the first page
        m_start = re.search(rf"(?:^|\n)\s*{re.escape(sec_code)}\.?\s+", joined)
        if m_start:
            joined = joined[m_start.start():].strip()

        # Keep concise, clean body (up to 4500 chars per subsection)
        if len(joined) > 4500:
            cut = joined[:4500].rfind(".")
            joined = joined[: cut + 1 if cut > 2500 else 4500].strip()

        sections_out.append({
            "id": f"PDF2021_{sec_code.replace('.', '_')}",
            "chapterNumber": ch_num,
            "chapterTitle": ch_title,
            "sectionCode": sec_code,
            "sectionTitle": sec_title,
            "pageRange": f"tr. {p_start} - {p_end}" if p_end > p_start else f"tr. {p_start}",
            "source": "Giáo trình Pháp luật đại cương - Trường Đại học Thương mại (NXB Hà Nội, 2021)",
            "content": joined,
        })

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(sections_out, f, ensure_ascii=False, indent=2)

    print(f"[OK] Extracted {len(sections_out)} structured textbook sections -> {OUT_PATH}")
    avg_len = sum(len(s["content"]) for s in sections_out) // max(1, len(sections_out))
    print(f"     Average cleaned section length: {avg_len} chars")
    print("     Sample preview (1.1.4):", sections_out[3]["content"][:380].replace("\n", " "))
    print("     Sample preview (7.2.4):", [s for s in sections_out if s["sectionCode"] == "7.2.4"][0]["content"][:380].replace("\n", " "))


if __name__ == "__main__":
    main()
