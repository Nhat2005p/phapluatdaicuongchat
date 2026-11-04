# -*- coding: utf-8 -*-
import os
import sys
import re
import json
import shutil
import pypdf

sys.stdout.reconfigure(encoding='utf-8')

MASTER_PATH = 'data/processed/sft_vietlaw_master.json'
BACKUP_PATH = 'data/processed/sft_vietlaw_master.json.bak'

PDF_PATHS = {
    'nhandinh': r'C:\Users\HP ENVY\.gemini\antigravity\brain\c8bec685-ca6d-467c-aae7-0a97a4b65b1f\.user_uploaded\media_1793808910422_eb5d662a.pdf',
    'dethi': r'C:\Users\HP ENVY\.gemini\antigravity\brain\c8bec685-ca6d-467c-aae7-0a97a4b65b1f\.user_uploaded\media_1793808914964_0d9bb452.pdf',
    'luat': r'C:\Users\HP ENVY\.gemini\antigravity\brain\c8bec685-ca6d-467c-aae7-0a97a4b65b1f\.user_uploaded\media_1793808905854_80e0ac23.pdf'
}

def clean_ocr_text(text: str) -> str:
    """Clean Vietnamese OCR split artifacts like 's ự', 'đ ịnh', 'c ủa'"""
    if not text:
        return ""
    # Common OCR vowel-diacritic splits
    text = re.sub(r'([a-zA-ZàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđĐ])\s+([àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ])', r'\1\2', text)
    # Specific known common OCR mis-spaces
    replacements = [
        ('đ ịnh', 'định'), ('s ự', 'sự'), ('c ủa', 'của'), ('ngư ời', 'người'), ('quy đ ịnh', 'quy định'),
        ('tr ị', 'trị'), ('l ực', 'lực'), ('h ợp', 'hợp'), ('pháp lu ật', 'pháp luật'), ('hành vi c ủa', 'hành vi của'),
        ('đư ợc', 'được'), ('th ực', 'thực'), ('ch ủ', 'chủ'), ('năng l ực', 'năng lực'), ('hình s ự', 'hình sự'),
        ('quan h ệ', 'quan hệ'), ('đ ời', 'đời'), ('đi ều', 'điều'), ('b ộ', 'bộ'), ('đ ồng', 'đồng'),
        ('v ề', 'về'), ('th ể', 'thể'), ('k ết', 'kết'), ('m ột', 'một'), ('y ếu', 'yếu'), ('t ổ', 'tổ'),
        ('ch ức', 'chức'), ('dư ới', 'dưới'), ('gi ải', 'giải'), ('c ấu', 'cấu'), ('ngu ồn', 'nguồn'),
        ('ch ất', 'chất'), ('tài s ản', 'tài sản'), ('trách nhi ệm', 'trách nhiệm'), ('h ậu', 'hậu'),
        ('quả ngh iêm', 'quả nghiêm'), ('th ừa', 'thừa'), ('k ế', 'kế'), ('di chúc', 'di chúc'),
        ('vi ph ạm', 'vi phạm'), ('d ân', 'dân'), ('hôn nh ân', 'hôn nhân'), ('gia đ ình', 'gia đình')
    ]
    for old, new in replacements:
        text = text.replace(old, new)
    # Normalize excessive newlines and whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def parse_196_nhan_dinh(pdf_path: str):
    print("-> Đang trích xuất 196 Câu Nhận Định...")
    reader = pypdf.PdfReader(pdf_path)
    full_text = '\n'.join([p.extract_text() for p in reader.pages])
    
    q_indices = []
    for m in re.finditer(r'(?:^|\n)\s*(\d{1,3})\.\s+', full_text):
        num = int(m.group(1))
        q_indices.append((num, m.start(), m.end()))
        
    valid_q = []
    last_num = 0
    for num, start, end in q_indices:
        if num > last_num and num <= last_num + 3:
            valid_q.append((num, start, end))
            last_num = num
            
    samples = []
    for i in range(len(valid_q)):
        num, start, end = valid_q[i]
        next_start = valid_q[i+1][1] if i+1 < len(valid_q) else len(full_text)
        block = full_text[start:next_start].strip()
        
        ans_match = re.search(r'(?:Trả\s+lời\s*:|Nhận\s+đ\s*ịnh\s*:)', block, re.IGNORECASE)
        if ans_match:
            stmt = block[:ans_match.start()].strip()
            ans = block[ans_match.start():].strip()
        else:
            stmt = block
            ans = ""
            
        stmt = re.sub(r'^\d+\.\s*', '', stmt).strip()
        stmt = clean_ocr_text(stmt)
        ans = clean_ocr_text(ans)
        
        if stmt and ans:
            samples.append({
                "sample_id": f"SFT_196Q_ND_{num:03d}",
                "instruction": f"Nhận định sau đây ĐÚNG hay SAI? Giải thích chi tiết theo Pháp luật đại cương: \"{stmt}\"",
                "input": stmt,
                "output": ans,
                "intent_code": "TRUE_FALSE"
            })
    print(f"   Trích xuất thành công: {len(samples)} câu nhận định!")
    return samples

def parse_de_thi(pdf_path: str):
    print("-> Đang trích xuất Đề thi Pháp luật đại cương có đáp án...")
    reader = pypdf.PdfReader(pdf_path)
    full_text = '\n'.join([p.extract_text() for p in reader.pages])
    
    samples = []
    # Find exam blocks: ĐỀ SỐ 1, 2, 3, 04, 5
    exam_matches = list(re.finditer(r'(ĐỀ\s+SỐ\s*0?(\d+)[^\n]*)', full_text, re.IGNORECASE))
    for e_idx, em in enumerate(exam_matches):
        de_num = em.group(2)
        de_title = em.group(1).strip()
        start = em.start()
        end = exam_matches[e_idx+1].start() if e_idx+1 < len(exam_matches) else len(full_text)
        exam_text = full_text[start:end]
        
        # Split into Câu 1, Câu 2, Câu 3, ...
        c_matches = list(re.finditer(r'(Câu\s+(\d+)\s*:[^\n]*)', exam_text, re.IGNORECASE))
        for c_idx, cm in enumerate(c_matches):
            c_num = cm.group(2)
            c_start = cm.start()
            c_end = c_matches[c_idx+1].start() if c_idx+1 < len(c_matches) else len(exam_text)
            c_block = exam_text[c_start:c_end].strip()
            
            # Check if this question has True/False sub-items or an answer
            # Usually: Câu X: <Question> \n Trả lời: / Đáp án: <Answer>
            ans_match = re.search(r'(?:Trả\s+lời\s*:|Đáp\s+án\s*:|Hướng\s+dẫn\s+chấm\s*:|Giải\s+thích\s*:)', c_block, re.IGNORECASE)
            if ans_match:
                q_text = c_block[:ans_match.start()].strip()
                ans_text = c_block[ans_match.start():].strip()
            else:
                q_text = cm.group(0).strip()
                ans_text = c_block[len(q_text):].strip()
                
            q_clean = clean_ocr_text(q_text)
            ans_clean = clean_ocr_text(ans_text)
            
            # Determine intent
            intent = "THEORY_EXAM"
            q_upper = q_clean.upper()
            if "ĐÚNG HAY SAI" in q_upper:
                intent = "TRUE_FALSE"
            elif any(w in q_upper for w in ["TÌNH HUỐNG", "THỪA KẾ", "DI CHÚC", "TỔNG TÀI SẢN", "BỒI THƯỜNG", "ÔNG A VÀ BÀ B"]):
                intent = "CASE_ANALYSIS"
                
            if q_clean and ans_clean:
                samples.append({
                    "sample_id": f"SFT_DETHI_DE{de_num}_C{c_num}",
                    "instruction": f"[{de_title}] {q_clean}",
                    "input": q_clean,
                    "output": ans_clean,
                    "intent_code": intent
                })
                
            # If this question contains sub-statements a), b), c), d) for True/False, extract them too!
            if intent == "TRUE_FALSE":
                sub_stmts = re.findall(r'([a-hA-H]\.?\s+[^\n]+)', q_clean)
                for s_stmt in sub_stmts:
                    samples.append({
                        "sample_id": f"SFT_DETHI_DE{de_num}_C{c_num}_{s_stmt[:2].replace('.', '').strip()}",
                        "instruction": f"Nhận định sau đây ĐÚNG hay SAI? Giải thích chi tiết theo đề thi Pháp luật đại cương (Đề số {de_num}): \"{s_stmt}\"",
                        "input": s_stmt,
                        "output": f"Căn cứ đáp án Đề số {de_num} - Môn Pháp luật đại cương:\n{ans_clean}",
                        "intent_code": "TRUE_FALSE"
                    })
                    
    print(f"   Trích xuất thành công: {len(samples)} mẫu từ Đề thi có đáp án!")
    return samples

def parse_luat_ch7_8_9_and_parts(pdf_path: str):
    print("-> Đang trích xuất toàn bộ 109 trang tài liệu Luật & Chuyên đề...")
    reader = pypdf.PdfReader(pdf_path)
    full_text = '\n'.join([p.extract_text() for p in reader.pages])
    
    samples = []
    
    # 1. Chương 7: Luật Hình sự (10 câu)
    ch7_idx = full_text.find('Chương 7.')
    ch8_idx = full_text.find('Chương 8.')
    ch9_idx = full_text.find('Chương 9.')
    hoc247_idx = full_text.find('• Câu 1:Mã câu hỏi: 96869')
    phan1_idx = full_text.find('PHẦN I. QUAN HỆ PHÁP LUẬT')
    
    def extract_chapter_questions(ch_text: str, ch_code: str, ch_title: str):
        ch_samples = []
        # Pattern for questions: Q Câu X \n ... AĐáp án: / A Đáp án:
        # Note in luat.pdf OCR: Q Câu X ... AĐáp ...
        c_matches = list(re.finditer(r'(?:^|\n)\s*(?:Q\s*)?(Câu\s+(\d+)[^\n]*)', ch_text))
        for idx, cm in enumerate(c_matches):
            c_num = cm.group(2)
            c_start = cm.start()
            c_end = c_matches[idx+1].start() if idx+1 < len(c_matches) else len(ch_text)
            block = ch_text[c_start:c_end].strip()
            
            # Split Q vs A
            # AĐáp án: or A Đáp án: or Đáp án: or Trả lời:
            ans_match = re.search(r'(?:A\s*Đáp\s*án\s*:|Đáp\s*án\s*:|Trả\s*lời\s*:)', block, re.IGNORECASE)
            if ans_match:
                q_text = block[:ans_match.start()].strip()
                ans_text = block[ans_match.start():].strip()
            else:
                q_text = cm.group(1).strip()
                ans_text = block[len(q_text):].strip()
                
            q_clean = clean_ocr_text(re.sub(r'^[QA]\s*', '', q_text))
            ans_clean = clean_ocr_text(re.sub(r'^[QA]\s*', '', ans_text))
            
            intent = "THEORY_EXAM"
            q_upper = q_clean.upper()
            if any(w in q_upper for w in ["TÌNH HUỐNG", "BÀI TẬP", "A GIẾT B", "GÂY THƯƠNG TÍCH", "THAM Ô", "HỐI LỘ"]):
                intent = "CASE_ANALYSIS"
            elif "ĐÚNG HAY SAI" in q_upper:
                intent = "TRUE_FALSE"
                
            if q_clean and ans_clean:
                ch_samples.append({
                    "sample_id": f"SFT_LUAT_{ch_code}_C{c_num}",
                    "instruction": f"[{ch_title}] {q_clean}",
                    "input": q_clean,
                    "output": ans_clean,
                    "intent_code": intent
                })
        return ch_samples

    # Chapter 7
    if ch7_idx != -1 and ch8_idx != -1:
        samples.extend(extract_chapter_questions(full_text[ch7_idx:ch8_idx], "CH7_HINHSU", "Chương 7: Luật Hình sự"))
    # Chapter 8
    if ch8_idx != -1 and ch9_idx != -1:
        samples.extend(extract_chapter_questions(full_text[ch8_idx:ch9_idx], "CH8_HANHCHINH", "Chương 8: Luật Hành chính"))
    # Chapter 9
    if ch9_idx != -1 and hoc247_idx != -1:
        samples.extend(extract_chapter_questions(full_text[ch9_idx:hoc247_idx], "CH9_THAMNHUNG", "Chương 9: Phòng chống tham nhũng"))
        
    # 2. HỌC247 (16 câu có Mã câu hỏi)
    if hoc247_idx != -1 and phan1_idx != -1:
        hoc_text = full_text[hoc247_idx:phan1_idx]
        h_matches = list(re.finditer(r'(•\s*Câu\s+(\d+)\s*:\s*Mã\s+câu\s+hỏi\s*:\s*(\d+))', hoc_text))
        for h_idx, hm in enumerate(h_matches):
            h_code = hm.group(3)
            h_start = hm.start()
            h_end = h_matches[h_idx+1].start() if h_idx+1 < len(h_matches) else len(hoc_text)
            h_block = hoc_text[h_start:h_end].strip()
            
            ans_match = re.search(r'(?:Lời\s+giải\s+chi\s+tiết|Đáp\s+án\s*:|Trả\s+lời\s*:)', h_block, re.IGNORECASE)
            if ans_match:
                q_text = h_block[:ans_match.start()].strip()
                ans_text = h_block[ans_match.start():].strip()
            else:
                q_text = hm.group(0)
                ans_text = h_block[len(q_text):].strip()
                
            q_clean = clean_ocr_text(q_text)
            ans_clean = clean_ocr_text(ans_text)
            
            intent = "THEORY_EXAM"
            q_upper = q_clean.upper()
            if "ĐÚNG HAY SAI" in q_upper:
                intent = "TRUE_FALSE"
            elif any(w in q_upper for w in ["TÌNH HUỐNG", "THỪA KẾ", "DI CHÚC", "TÀI SẢN"]):
                intent = "CASE_ANALYSIS"
                
            if q_clean and ans_clean:
                samples.append({
                    "sample_id": f"SFT_HOC247_{h_code}",
                    "instruction": f"[Đề thi HỌC247 - Mã {h_code}] {q_clean}",
                    "input": q_clean,
                    "output": ans_clean,
                    "intent_code": intent
                })
                
    # 3. PHẦN I -> PHẦN VII (36 chuyên đề tự luận)
    if phan1_idx != -1:
        parts_text = full_text[phan1_idx:]
        # Find parts: PHẦN I, PHẦN II, ...
        p_matches = list(re.finditer(r'(PHẦN\s+([IVXLCDM]+)\.\s+[^\n]+)', parts_text))
        for p_idx, pm in enumerate(p_matches):
            p_roman = pm.group(2)
            p_title = pm.group(1).strip()
            p_start = pm.start()
            p_end = p_matches[p_idx+1].start() if p_idx+1 < len(p_matches) else len(parts_text)
            part_sub = parts_text[p_start:p_end]
            
            # Find questions inside this part: Câu 1, Câu 2, Bài tập 1, Bài 1, ...
            sub_q_matches = list(re.finditer(r'(?:^|\n)\s*(?:[•\-*]\s*)?(Câu\s+(\d+)|Bài\s+tập\s+(\d+)|\d+\.)\s*[:\.]\s*([^\n]+)', part_sub))
            if sub_q_matches:
                for sq_idx, sqm in enumerate(sub_q_matches):
                    sq_start = sqm.start()
                    sq_end = sub_q_matches[sq_idx+1].start() if sq_idx+1 < len(sub_q_matches) else len(part_sub)
                    sq_block = part_sub[sq_start:sq_end].strip()
                    
                    ans_match = re.search(r'(?:Trả\s+lời\s*:|Đáp\s+án\s*:|Lời\s+giải\s*:|Giải\s*:)', sq_block, re.IGNORECASE)
                    if ans_match:
                        q_text = sq_block[:ans_match.start()].strip()
                        ans_text = sq_block[ans_match.start():].strip()
                    else:
                        q_text = sqm.group(0).strip()
                        ans_text = sq_block[len(q_text):].strip()
                        
                    q_clean = clean_ocr_text(q_text)
                    ans_clean = clean_ocr_text(ans_text)
                    
                    intent = "THEORY_EXAM"
                    q_upper = q_clean.upper()
                    if "ĐÚNG HAY SAI" in q_upper:
                        intent = "TRUE_FALSE"
                    elif any(w in q_upper for w in ["TÌNH HUỐNG", "BÀI TẬP", "THỪA KẾ", "DI CHÚC", "BỒI THƯỜNG", "HỢP ĐỒNG"]):
                        intent = "CASE_ANALYSIS"
                        
                    if q_clean and ans_clean and len(ans_clean) > 20:
                        samples.append({
                            "sample_id": f"SFT_PART_{p_roman}_Q{sq_idx+1:02d}",
                            "instruction": f"[{p_title}] {q_clean}",
                            "input": q_clean,
                            "output": ans_clean,
                            "intent_code": intent
                        })
                        
    print(f"   Trích xuất thành công: {len(samples)} mẫu từ 109 trang tài liệu Luật!")
    return samples

def main():
    print("=== BẮT ĐẦU TRÍCH XUẤT VÀ NẠP TOÀN BỘ TÀI LIỆU VÀO SFT_VIETLAW ===")
    
    # 1. Parse all 3 PDF sources
    samples_196 = parse_196_nhan_dinh(PDF_PATHS['nhandinh'])
    samples_dethi = parse_de_thi(PDF_PATHS['dethi'])
    samples_luat = parse_luat_ch7_8_9_and_parts(PDF_PATHS['luat'])
    
    all_new_samples = samples_196 + samples_dethi + samples_luat
    print(f"\n=> TỔNG CỘNG MẪU MỚI TRÍCH XUẤT: {len(all_new_samples)} mẫu chuẩn SFT.")
    
    # 2. Read existing master dataset
    if os.path.exists(MASTER_PATH):
        # Backup first
        shutil.copyfile(MASTER_PATH, BACKUP_PATH)
        print(f"-> Đã sao lưu bộ dữ liệu gốc tại: {BACKUP_PATH}")
        with open(MASTER_PATH, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    else:
        existing_data = []
        
    print(f"-> Số mẫu hiện có trong sft_vietlaw_master.json: {len(existing_data)}")
    
    # Existing IDs & Inputs map for deduplication
    existing_ids = set(item['sample_id'] for item in existing_data if 'sample_id' in item)
    existing_inputs = set(item['input'].strip().lower() for item in existing_data if 'input' in item and len(item['input'].strip()) > 15)
    
    added_count = 0
    for s in all_new_samples:
        clean_in = s['input'].strip().lower()
        if s['sample_id'] in existing_ids or clean_in in existing_inputs:
            # Check if existing has shorter output, if so replace
            continue
        existing_data.append(s)
        existing_ids.add(s['sample_id'])
        if len(clean_in) > 15:
            existing_inputs.add(clean_in)
        added_count += 1
        
    print(f"-> Đã thêm mới thành công: {added_count} mẫu không trùng lặp.")
    print(f"-> Tổng số mẫu sau khi cập nhật: {len(existing_data)} mẫu.")
    
    # 3. Write back to sft_vietlaw_master.json
    with open(MASTER_PATH, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=2)
    print(f"-> Đã lưu thành công vào: {MASTER_PATH}")
    
    # Also write a standalone file of just these new additions for user inspection / Kaggle fine-tuning
    NEW_STANDALONE = 'data/processed/sft_vietlaw_pdf_additions.json'
    with open(NEW_STANDALONE, 'w', encoding='utf-8') as f:
        json.dump(all_new_samples, f, ensure_ascii=False, indent=2)
    print(f"-> Đã lưu bộ dữ liệu mới trích xuất độc lập tại: {NEW_STANDALONE}")
    
    print("\n=== HOÀN TẤT 100%! ===")

if __name__ == '__main__':
    main()

