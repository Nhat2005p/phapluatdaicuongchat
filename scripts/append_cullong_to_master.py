# -*- coding: utf-8 -*-
import os
import sys
import re
import json
import pypdf

sys.stdout.reconfigure(encoding='utf-8')

MASTER_PATH = 'data/processed/sft_vietlaw_master.json'
PDF_PATH = r'C:\Users\HP ENVY\.gemini\antigravity\brain\c8bec685-ca6d-467c-aae7-0a97a4b65b1f\.user_uploaded\media_1793811074781_096452e7.pdf'

def clean_text(text: str) -> str:
    if not text:
        return ""
    # Remove footers and headers
    text = re.sub(r'Downloaded by.*', '', text)
    text = re.sub(r'Scan to open on Studeersnel.*', '', text)
    text = re.sub(r'lOMoARcPSD\|\d+', '', text)
    text = re.sub(r'BIÊN SOẠN TAILIEUONTHI\.IO\.VN', '', text)
    text = re.sub(r'-{10,}', '', text)
    # Remove prompt/target word counts and page numbers at beginning
    text = re.sub(r'^\s*\(Khoảng\s*[\d–\- ]+\s*chữ\)\s*', '', text, flags=re.IGNORECASE)
    text = re.sub(r'^\s*\d{1,2}\s*\n+', '', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def parse_pdf():
    print(f"-> Đang đọc tài liệu: {os.path.basename(PDF_PATH)} (56 trang)...")
    reader = pypdf.PdfReader(PDF_PATH)
    pages = [p.extract_text() for p in reader.pages]
    full_text = '\n'.join(pages)
    
    samples = []
    
    # ----------------------------------------------------
    # PHẦN 1: 30 CÂU HỎI TỰ LUẬN CHUYÊN SÂU CÓ ĐÁP ÁN MẪU
    # ----------------------------------------------------
    print("-> Trích xuất 30 Câu hỏi tự luận chuyên sâu có đáp án mẫu...")
    idx_extra_last = full_text.rfind('20 CÂU HỎI TỰ LUẬN BỔ SUNG VÀ DÀN Ý VẮN TẮT')
    main_text = full_text[:idx_extra_last] if idx_extra_last != -1 else full_text
    
    matches = list(re.finditer(r'(?:^|\n)\s*(Câu\s*(?:hỏi)?\s*(\d+)\s*:)', main_text, re.IGNORECASE))
    
    for i, m in enumerate(matches):
        c_num = int(m.group(2))
        start = m.start()
        end = matches[i+1].start() if i+1 < len(matches) else len(main_text)
        block = main_text[start:end]
        
        # Split Q vs A
        ans_m = re.search(r'Đáp\s*án\s*mẫu\s*(?:\([^\)]*\))?\s*:\s*\n?', block, re.IGNORECASE)
        if ans_m:
            q_part = block[:ans_m.start()].strip()
            ans_part = block[ans_m.end():].strip()
        else:
            q_part = m.group(0)
            ans_part = block[m.end():].strip()
            
        q_title = re.sub(r'^(?:Câu\s*(?:hỏi)?\s*\d+\s*:\s*)', '', q_part, flags=re.IGNORECASE).strip()
        q_title = clean_text(q_title).replace('\n', ' ')
        ans_clean = clean_text(ans_part)
        
        # Determine chapter
        ch_name = "Chương 1: Lý luận chung về Nhà nước" if c_num <= 10 else ("Chương 2: Lý luận chung về Pháp luật" if c_num <= 20 else "Chương 3: Luật Hiến pháp")
        ch_code = "CH1" if c_num <= 10 else ("CH2" if c_num <= 20 else "CH3")
        
        samples.append({
            "sample_id": f"SFT_30TL_{ch_code}_C{c_num:02d}",
            "instruction": f"[{ch_name}] Câu {c_num}: {q_title}",
            "input": f"Câu {c_num}: {q_title}",
            "output": ans_clean,
            "intent_code": "THEORY_EXAM"
        })
        
    print(f"   Trích xuất thành công {len(samples)} / 30 câu hỏi tự luận mẫu!")
    
    # ----------------------------------------------------
    # PHẦN 2: 20 CÂU HỎI TỰ LUẬN BỔ SUNG VÀ DÀN Ý VẮN TẮT
    # ----------------------------------------------------
    print("-> Trích xuất 20 Câu hỏi tự luận bổ sung và dàn ý chi tiết...")
    if idx_extra_last != -1:
        extra_text = full_text[idx_extra_last:]
        extra_matches = list(re.finditer(r'(?:^|\n)\s*(\d{1,2})\.\s+([^\n]+(?:\n[^\n]+)?)\n\s*•\s*Dàn\s+ý\s+vắn\s+tắt\s*:', extra_text))
        
        for idx, em in enumerate(extra_matches):
            q_num = int(em.group(1))
            q_title = clean_text(em.group(2)).replace('\n', ' ')
            start = em.start()
            end = extra_matches[idx+1].start() if idx+1 < len(extra_matches) else len(extra_text)
            e_block = extra_text[start:end]
            
            # Find Dàn ý vắn tắt:
            dy_m = re.search(r'•\s*Dàn\s+ý\s+vắn\s+tắt\s*:\s*\n', e_block, re.IGNORECASE)
            if dy_m:
                ans_text = e_block[dy_m.end():].strip()
            else:
                ans_text = e_block[len(em.group(0)):].strip()
                
            ans_clean = clean_text(ans_text)
            
            ch_name = "Chương 1: Lý luận chung về Nhà nước" if q_num <= 7 else ("Chương 2: Lý luận chung về Pháp luật" if q_num <= 14 else "Chương 3: Luật Hiến pháp")
            ch_code = "CH1" if q_num <= 7 else ("CH2" if q_num <= 14 else "CH3")
            
            samples.append({
                "sample_id": f"SFT_20BS_{ch_code}_Q{q_num:02d}",
                "instruction": f"[{ch_name} - Câu hỏi ôn tập bổ sung] {q_title}",
                "input": q_title,
                "output": f"DÀN Ý VÀ HƯỚNG DẪN GIẢI CHI TIẾT:\n\n{ans_clean}",
                "intent_code": "THEORY_EXAM"
            })
            
        print(f"   Trích xuất thành công {len(extra_matches)} câu hỏi tự luận bổ sung!")
        
    # ----------------------------------------------------
    # PHẦN 3: TÓM TẮT TRỌNG TÂM LÝ THUYẾT 3 CHƯƠNG (TRANG 2 - 8)
    # ----------------------------------------------------
    print("-> Trích xuất 10 Chuyên đề tóm tắt trọng tâm lý thuyết 3 chương...")
    idx_tomtat = full_text.find('TÓM TẮT NỘI DUNG 3 CHƯƠNG')
    idx_ch1_q1 = full_text.find('CHƯƠNG 1: LÝ LUẬN CHUNG VỀ NHÀ NƯỚC\n\nCâu 1:')
    if idx_ch1_q1 == -1:
        idx_ch1_q1 = matches[0].start() if matches else -1
        
    if idx_tomtat != -1 and idx_ch1_q1 != -1:
        tomtat_text = full_text[idx_tomtat:idx_ch1_q1]
        
        topics = [
            ("1.1. Nguồn gốc Nhà nước", "SFT_TOMTAT_CH1_1_NGUONGOC", "Trình bày tóm tắt nguồn gốc Nhà nước theo các học thuyết trước Mác và học thuyết Mác - Lênin"),
            ("1.2. Khái niệm, bản chất và chức năng cơ bản của Nhà nước", "SFT_TOMTAT_CH1_2_BANCHAT_CHUCNANG", "Trình bày tóm tắt khái niệm, bản chất (tính giai cấp, tính xã hội) và các đặc trưng của Nhà nước"),
            ("1.3. Kiểu Nhà nước", "SFT_TOMTAT_CH1_3_KIEU_NHANUOC", "Trình bày tóm tắt khái niệm kiểu Nhà nước và 4 kiểu Nhà nước trong lịch sử"),
            ("1.4. Hình thức Nhà nước", "SFT_TOMTAT_CH1_4_HINHTHUC_NHANUOC", "Trình bày tóm tắt hình thức Nhà nước: chính thể, cấu trúc và chế độ chính trị"),
            ("2.1. Khái niệm, thuộc tính, hình thức pháp luật", "SFT_TOMTAT_CH2_1_THUOCTINH_HINHTHUC_PL", "Trình bày tóm tắt khái niệm, thuộc tính, chức năng và các hình thức của pháp luật"),
            ("2.2. Quy phạm pháp luật", "SFT_TOMTAT_CH2_2_QUYPHAM_PHAPLUAT", "Trình bày tóm tắt cấu trúc ba bộ phận của quy phạm pháp luật (giả định, quy định, chế tài)"),
            ("2.3. Quan hệ pháp luật", "SFT_TOMTAT_CH2_3_QUANHE_PHAPLUAT", "Trình bày tóm tắt các thành phần cấu thành quan hệ pháp luật (chủ thể, khách thể, nội dung)"),
            ("2.4. Thực hiện pháp luật, Vi phạm pháp luật và Trách nhiệm pháp lý", "SFT_TOMTAT_CH2_4_THUCHIEN_VIPHAM_TNPL", "Trình bày tóm tắt 4 hình thức thực hiện pháp luật, dấu hiệu vi phạm pháp luật và trách nhiệm pháp lý"),
            ("3.1. Khái niệm, Đối tượng và Phương pháp điều chỉnh", "SFT_TOMTAT_CH3_1_KHAINIEM_DOITUONG_HIENPHAP", "Trình bày tóm tắt khái niệm, đối tượng và phương pháp điều chỉnh của Luật Hiến pháp"),
            ("3.2. Nội dung cơ bản của Hiến pháp 2013", "SFT_TOMTAT_CH3_2_NOIDUNG_HIENPHAP2013", "Trình bày tóm tắt nội dung cơ bản của Hiến pháp năm 2013 (chính trị, kinh tế, văn hóa - xã hội, quyền con người, bộ máy nhà nước)")
        ]
        
        for t_idx, (t_header, t_sid, t_prompt) in enumerate(topics):
            start_pos = tomtat_text.find(t_header)
            if start_pos != -1:
                next_start = len(tomtat_text)
                for next_header, _, _ in topics[t_idx+1:]:
                    p_pos = tomtat_text.find(next_header)
                    if p_pos != -1 and p_pos > start_pos:
                        next_start = p_pos
                        break
                topic_content = tomtat_text[start_pos:next_start].strip()
                topic_clean = clean_text(topic_content)
                if len(topic_clean) > 50:
                    samples.append({
                        "sample_id": t_sid,
                        "instruction": f"[Tóm tắt lý thuyết trọng tâm - Môn Pháp luật đại cương] {t_prompt}",
                        "input": t_prompt,
                        "output": topic_clean,
                        "intent_code": "THEORY_EXAM"
                    })
        print(f"   Trích xuất thành công {len([s for s in samples if s['sample_id'].startswith('SFT_TOMTAT_')])} chuyên đề lý thuyết tóm tắt!")
        
    return samples

def main():
    print("=== TÍCH HỢP TÀI LIỆU 30 CÂU HỎI TỰ LUẬN CHƯƠNG 1-2-3 VÀO MASTER DATASET ===")
    
    new_samples = parse_pdf()
    print(f"\n=> Tổng số mẫu mới tạo từ tài liệu: {len(new_samples)} mẫu.")
    
    with open(MASTER_PATH, 'r', encoding='utf-8') as f:
        master_data = json.load(f)
    print(f"-> Số mẫu hiện tại trong sft_vietlaw_master.json: {len(master_data)}")
    
    master_by_id = {item['sample_id']: item for item in master_data if 'sample_id' in item}
    
    added_count = 0
    updated_count = 0
    for s in new_samples:
        sid = s['sample_id']
        if sid not in master_by_id:
            master_data.append(s)
            master_by_id[sid] = s
            added_count += 1
        else:
            master_by_id[sid].update(s)
            updated_count += 1
            
    print(f"-> Đã thêm mới: {added_count} mẫu.")
    print(f"-> Đã cập nhật: {updated_count} mẫu.")
    print(f"-> Tổng số mẫu sau khi tích hợp: {len(master_data)} mẫu.")
    
    # Save back to master
    with open(MASTER_PATH, 'w', encoding='utf-8') as f:
        json.dump(master_data, f, ensure_ascii=False, indent=2)
    print(f"-> Đã ghi thành công vào: {MASTER_PATH}")
    
    # Also save standalone additions
    STANDALONE_PATH = 'data/processed/sft_vietlaw_30_tuluan_ch123.json'
    with open(STANDALONE_PATH, 'w', encoding='utf-8') as f:
        json.dump(new_samples, f, ensure_ascii=False, indent=2)
    print(f"-> Đã lưu bản trích xuất riêng biệt tại: {STANDALONE_PATH}")
    
    fsize = os.path.getsize(MASTER_PATH) / (1024 * 1024)
    print(f"-> Dung lượng file Master mới: {fsize:.2f} MB")
    print("=== HOÀN TẤT TÍCH HỢP DATA 100%! ===")

if __name__ == '__main__':
    main()
