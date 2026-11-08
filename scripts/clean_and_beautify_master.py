# -*- coding: utf-8 -*-
import json
import re
import sys
import shutil

sys.stdout.reconfigure(encoding='utf-8')

MASTER_PATH = 'data/processed/sft_vietlaw_master.json'
HYPHEN_PATH = 'data/processed/sft-vietlaw-master.json'
BACKUP_PATH = 'data/processed/sft_vietlaw_master.json.bak_pre_beauty'

VN_LOWER = r'a-zàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ'
VN_UPPER = r'A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ'

def clean_ai_terms(text: str) -> str:
    if not text:
        return text
        
    replacements = [
        # Topics & Titles
        ('Trách nhiệm pháp lý khi dùng AI tạo nội dung', 'Trách nhiệm pháp lý khi ứng dụng công nghệ tự động tạo nội dung'),
        ('Đánh giá độ tin cậy của câu trả lời pháp luật AI', 'Đánh giá độ tin cậy của tài liệu tư vấn pháp luật trực tuyến'),
        ('câu trả lời pháp luật AI', 'thông tin tư vấn pháp luật trực tuyến'),
        ('khi dùng AI tạo nội dung', 'khi dùng phần mềm tự động tạo nội dung'),
        ('khi dùng AI tạo', 'khi dùng công nghệ tự động tạo'),
        ('dùng AI tạo nội dung', 'dùng phần mềm tự động tạo nội dung'),
        
        # Testing / Hallucination phrases
        ('Trong bài kiểm thử AI về', 'Trong bài tập thảo luận về'),
        ('bài kiểm thử AI', 'bài tập thảo luận pháp luật'),
        ('kiểm thử AI', 'thảo luận pháp luật'),
        ('Bạn cần chấm một chatbot pháp luật tuyên bố:', 'Khi đánh giá một bài giải tham khảo có nhận định:'),
        ('chấm một chatbot pháp luật tuyên bố:', 'đánh giá một bài giải tham khảo có nhận định:'),
        ('chấm một chatbot pháp luật', 'đánh giá một bài làm pháp luật'),
        ('chấm một chatbot', 'đánh giá một bài làm'),
        ('Hãy thực hiện kiểm thử hallucination cho câu trả lời', 'Hãy phân tích và chỉ ra điểm sai trong nhận định'),
        ('kiểm thử hallucination cho câu trả lời', 'chỉ ra điểm sai trong nhận định'),
        ('kiểm thử hallucination', 'kiểm chứng và phát hiện lỗi sai lệch căn cứ'),
        ('hallucination nguồn', 'sai lệch căn cứ viện dẫn'),
        ('hallucination', 'sai lệch thông tin'),
        
        # Model / Bot phrases
        ('model xuất ra mệnh đề:', 'có ý kiến đưa ra nhận định:'),
        ('model xuất ra mệnh đề', 'có nhận định cho rằng'),
        ('Một model trả lời câu hỏi về', 'Một bài làm trả lời câu hỏi về'),
        ('Một model trả lời', 'Một bài giải trả lời'),
        ('Một Model trả lời', 'Một bài giải trả lời'),
        ('Một model', 'Một bài làm'),
        ('Một Model', 'Một bài giải'),
        ('Model nêu danh mục', 'Tài liệu tham khảo nêu danh mục'),
        ('Model khẳng định', 'Tài liệu tham khảo khẳng định'),
        ('model trả lời', 'người học trả lời'),
        ('model đưa ra', 'bài làm đưa ra'),
        ('model nhận định', 'bài làm nhận định'),
        ('Tình huống: Model', 'Tình huống: Bài làm'),
        ('tình huống: Model', 'tình huống: Bài làm'),
        ('Tình huống: model', 'Tình huống: Bài làm'),
        
        # Chatbot phrases
        ('Một chatbot hướng dẫn người dân', 'Một tài liệu hướng dẫn người dân'),
        ('Một chatbot tự tạo số điều khoản', 'Một văn bản tổng hợp tự viện dẫn sai số điều khoản'),
        ('Chatbot loại bỏ số điều không kiểm chứng', 'Tài liệu đính chính loại bỏ số điều không có căn cứ'),
        ('Một doanh nghiệp dùng chatbot tạo', 'Một doanh nghiệp dùng phần mềm tự động tạo'),
        ('một chatbot tuyên bố:', 'một ý kiến cho rằng:'),
        ('chatbot tuyên bố:', 'ý kiến cho rằng:'),
        ('chấm một chatbot', 'đánh giá một ý kiến'),
        ('Một chatbot', 'Một tài liệu hướng dẫn'),
        ('một chatbot', 'một tài liệu hướng dẫn'),
        ('Chatbot', 'Tài liệu hướng dẫn'),
        ('chatbot', 'tài liệu hướng dẫn'),
        ('chat-bot', 'tài liệu hướng dẫn'),
        
        # Output headers
        ('**1. Lỗi trong câu AI:**', '**1. Lỗi trong nhận định:**'),
        ('*1. Lỗi trong câu AI:*', '*1. Lỗi trong nhận định:*'),
        ('1. Lỗi trong câu AI:', '1. Lỗi trong nhận định:'),
        ('Lỗi trong câu AI:', 'Lỗi trong nhận định:'),
        ('câu AI:', 'nhận định trên:'),
        ('câu trả lời AI:', 'nhận định trên:'),
        ('**2. Sửa nội dung:**', '**2. Nhận định chính xác:**'),
        ('**3. Vì sao phải sửa:**', '**3. Cơ sở lý luận và pháp lý:**'),
        
        # AI in context of Artificial Intelligence
        ('AI có thể tạo văn bản', 'Công nghệ tự động có thể tạo văn bản'),
        ('Không thể suy máy tự chịu', 'Không thể coi máy móc tự chịu'),
        ('nhưng AI dùng bản luật', 'nhưng tài liệu dẫn bản luật'),
        ('AI dùng bản luật', 'tài liệu dẫn bản luật'),
        
        # Headings in case studies with uppercase AI (Vietnamese pronoun "Ai")
        ('AI PHẢI BỒI THƯỜNG THIỆT HẠI?', 'Ai phải bồi thường thiệt hại?'),
        ('AI PHẢI BỒI THƯỜNG', 'Ai phải bồi thường'),
        ('AI CÓ TRÁCH NHIỆM BỒI THƯỜNG', 'Ai có trách nhiệm bồi thường'),
        ('AI PHẢI CHỊU TRÁCH NHIỆM', 'Ai phải chịu trách nhiệm'),
        ('AI LÀ NGƯỜI', 'Ai là người'),
        ('AI ĐƯỢC HƯỞNG', 'Ai được hưởng'),
        ('AI CÓ QUYỀN', 'Ai có quyền'),
    ]
    
    for old, new in replacements:
        text = text.replace(old, new)
        
    # Standalone model/Model
    text = re.sub(r'\bModel\b', 'Bài làm', text)
    text = re.sub(r'\bmodel\b', 'bài làm', text)
    
    # Standalone remaining AI
    def replace_ai_tech(match):
        suffix = text[match.end():min(len(text), match.end()+20)]
        if re.search(r'^\s*(?:phải|có|được|là|chịu|thuộc)\b', suffix, re.IGNORECASE):
            return 'Ai'
        return 'công nghệ tự động'

    text = re.sub(r'\bAI\b', replace_ai_tech, text)
    return text

def beautify_formatting(text: str) -> str:
    if not text:
        return ""
        
    # 1. Normalize line endings
    text = text.replace('\r\n', '\n').replace('\r', '\n')
    
    # 2. Convert bullet artifacts: en-dash, em-dash, bullets, single asterisk (NOT double asterisk **)
    text = re.sub(r'(?:^|\n)\s*[–—•\uf0b7]\s*', r'\n- ', text)
    text = re.sub(r'(?:^|\n)\s*\*(?!\*)\s*', r'\n- ', text)
    text = re.sub(r'([–—•\uf0b7])([A-ZÀ-Ỹa-zà-ỹ])', r'\n- \2', text)
    
    # 3. Numbered lists missing space: '1.Khái quát' -> '1. Khái quát'
    text = re.sub(rf'(?:^|\n)\s*(\d{{1,2}})\.([{VN_UPPER}{VN_LOWER}])', r'\n\1. \2', text)
    
    # 4. Glued syllables with đ / Đ:
    # 'luậtđộc' -> 'luật độc', 'quyđịnh' -> 'quy định', 'Ađang' -> 'A đang'
    pat_d = re.compile(rf'([{VN_LOWER}A-Z])([đĐ][{VN_LOWER}]+)')
    for _ in range(5):
        new_text = pat_d.sub(r'\1 \2', text)
        if new_text == text:
            break
        text = new_text
        
    # 5. Common stuck words from PDF extraction
    stuck_replacements = [
        # Two tone glued words
        (r'\b(cố|vô|có|khổ|bỏ|thể|là)(ý)\b', r'\1 \2'),
        (r'\b(Cố|Vô|Có|Khổ|Bỏ|Thể|Là)(ý)\b', r'\1 \2'),
        (r'\b(lợi)(ích)\b', r'\1 \2'),
        (r'\b(Lợi)(ích)\b', r'\1 \2'),
        (r'\b(tiếng)(ồn)\b', r'\1 \2'),
        (r'\b(Tiếng)(ồn)\b', r'\1 \2'),
        (r'\b(phải|nhà|chỗ|thể|sự|người|kế|chồng|hình|khoản|nhiệm)(ở)\b', r'\1 \2'),
        (r'\b(Phải|Nhà|Chỗ|Thể|Sự|Người|Kế|Chồng|Hình|Khoản|Nhiệm)(ở)\b', r'\1 \2'),
        (r'\b(tránh|hoặc|cần|không|bị|thì|chỉ|cứ|sự|thể|dù|sở|giúp|kiện|luôn|luật)(áp)\b', r'\1 \2'),
        (r'\b(Tránh|Hoặc|Cần|Không|Bị|Thì|Chỉ|Cứ|Sự|Thể|Dù|Sở|Giúp|Kiện|Luôn|Luật)(áp)\b', r'\1 \2'),
        (r'\b(bị|sự)(ép)\b', r'\1 \2'),
        (r'\b(Bị|Sự)(ép)\b', r'\1 \2'),
        (r'\b(thể|tương)(ứng)\b', r'\1 \2'),
        (r'\b(Thể|Tương)(ứng)\b', r'\1 \2'),
        (r'\b(thể|dán|dùng|hình)(ảnh)\b', r'\1 \2'),
        (r'\b(Thể|Dán|Dùng|Hình)(ảnh)\b', r'\1 \2'),
        (r'\b(nhà)(nước)\b', r'\1 \2'),
        (r'\b(Nhà)(nước)\b', r'\1 \2'),
        (r'\b(thực)(hiện)\b', r'\1 \2'),
        (r'\b(Thực)(hiện)\b', r'\1 \2'),
        (r'\b(liên)(hiệp)\b', r'\1 \2'),
        (r'\b(Liên)(hiệp)\b', r'\1 \2'),
        (r'\b(bản|chánh|kết|lên|hành|tòa|toà|dụng|các|mang)(án)\b', r'\1 \2'),
        (r'\b(Bản|Chánh|Kết|Lên|Hành|Tòa|Toà|Dụng|Các|Mang)(án)\b', r'\1 \2'),
        (r'\b(chủ)(nhiệm)\b', r'\1 \2'),
        (r'\b(Chủ)(nhiệm)\b', r'\1 \2'),
        (r'\b(diện)(tích)\b', r'\1 \2'),
        (r'\b(Diện)(tích)\b', r'\1 \2'),
        (r'\b(bán|chuyển)(hàng)\b', r'\1 \2'),
        (r'\b(Bán|Chuyển)(hàng)\b', r'\1 \2'),
        (r'\b(cùng|chính)(cấp)\b', r'\1 \2'),
        (r'\b(Cùng|Chính)(cấp)\b', r'\1 \2'),
        (r'\b(công)(chức|nghệ|nghiệp)\b', r'\1 \2'),
        (r'\b(Công)(chức|nghệ|nghiệp)\b', r'\1 \2'),
        (r'\b(trường)(hợp)\b', r'\1 \2'),
        (r'\b(Trường)(hợp)\b', r'\1 \2'),
        # Font typos
        ('Toàán', 'Tòa án'),
        ('toàán', 'tòa án'),
        ('Quỵết', 'Quyết'),
        ('quỵết', 'quyết'),
        ('ngàỵ', 'ngày'),
        ('Trựởng', 'Trưởng'),
        ('trựởng', 'trưởng'),
        ('nhiềụ', 'nhiều'),
        ('Hộí', 'Hội'),
        ('cầù', 'cầu'),
    ]
    for pattern, repl in stuck_replacements:
        text = re.sub(pattern, repl, text)
        
    # 6. Spacing around colons and punctuation
    text = re.sub(r'\s+([,.:;?!])', r'\1', text)
    text = re.sub(rf',([{VN_UPPER}{VN_LOWER}])', r', \1', text)
    text = re.sub(rf':([{VN_UPPER}{VN_LOWER}])', r': \1', text)
    text = re.sub(rf';([{VN_UPPER}{VN_LOWER}])', r'; \1', text)
    text = re.sub(rf'([.?!])([{VN_UPPER}])', r'\1 \2', text)
    
    # 7. Normalize consecutive spaces
    text = re.sub(r'[ \t]+', ' ', text)
    # Normalize multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text.strip()

def process_item(item):
    new_item = dict(item)
    for field in ['instruction', 'input', 'output']:
        val = new_item.get(field, '')
        if val:
            # 1. Clean AI terms
            val = clean_ai_terms(val)
            # 2. Beautify formatting and un-glue words
            val = beautify_formatting(val)
            new_item[field] = val
    return new_item

def main():
    print("-> Đang tải dữ liệu từ bản sao lưu ban đầu...")
    with open(BACKUP_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"   Tổng số mẫu: {len(data)}")
    
    # Process all items
    processed = []
    for idx, item in enumerate(data):
        new_item = process_item(item)
        processed.append(new_item)
        
    print(f"-> Hoàn tất xử lý {len(processed)} mẫu!")
    
    # Verify no illegal terms remain
    forbidden_count = 0
    forbidden_pat = re.compile(r'\b(?:chatbot|chat-bot|model|hallucination|kiểm thử ai|câu ai)\b', re.IGNORECASE)
    for idx, d in enumerate(processed):
        for fld in ['instruction', 'input', 'output']:
            txt = d.get(fld, '')
            matches = forbidden_pat.findall(txt)
            if matches:
                forbidden_count += 1
                print(f"   [CẢNH BÁO] {d.get('sample_id')} field '{fld}' still has: {matches}")
                
    print(f"-> Số mẫu còn sót thuật ngữ cấm: {forbidden_count}")
    
    # Write to both MASTER_PATH and HYPHEN_PATH
    print(f"-> Đang ghi vào {MASTER_PATH}...")
    with open(MASTER_PATH, 'w', encoding='utf-8') as f:
        json.dump(processed, f, ensure_ascii=False, indent=2)
        
    print(f"-> Đang đồng bộ vào {HYPHEN_PATH}...")
    with open(HYPHEN_PATH, 'w', encoding='utf-8') as f:
        json.dump(processed, f, ensure_ascii=False, indent=2)
        
    print("-> THÀNH CÔNG! Đã cập nhật cả hai file master dataset.")

if __name__ == '__main__':
    main()
