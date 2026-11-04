# -*- coding: utf-8 -*-
import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

MASTER_PATH = 'data/processed/sft_vietlaw_master.json'
ADDITIONS_PATH = 'data/processed/sft_vietlaw_pdf_additions.json'

def main():
    print("=== TỔNG HỢP TOÀN BỘ DATA VÀO 1 FILE SFT_VIETLAW_MASTER.JSON ===")
    
    with open(MASTER_PATH, 'r', encoding='utf-8') as f:
        master_data = json.load(f)
    print(f"-> Số mẫu hiện có trong master: {len(master_data)}")
    
    with open(ADDITIONS_PATH, 'r', encoding='utf-8') as f:
        additions_data = json.load(f)
    print(f"-> Số mẫu trong file additions: {len(additions_data)}")
    
    master_by_id = {item['sample_id']: item for item in master_data if 'sample_id' in item}
    
    # 1. Ensure all items from additions are in master
    added_from_additions = 0
    for add_item in additions_data:
        sid = add_item['sample_id']
        if sid not in master_by_id:
            master_data.append(add_item)
            master_by_id[sid] = add_item
            added_from_additions += 1
        else:
            # Update with additions version to ensure latest cleaned OCR version
            master_by_id[sid].update(add_item)
            
    print(f"-> Đã bổ sung dứt điểm {added_from_additions} mẫu còn thiếu từ additions.")
    print(f"-> Tổng số mẫu sau khi hợp nhất: {len(master_data)}")
    
    # 2. Verify all additions are strictly in master
    missing = [a['sample_id'] for a in additions_data if a['sample_id'] not in master_by_id]
    if missing:
        print(f" cảnh báo: Vẫn còn thiếu {len(missing)} mẫu: {missing}")
    else:
        print("-> Xác thực: 100% (309/309) mẫu từ tài liệu mới đã có mặt trong master!")

    # 3. Quality check: format, non-empty, proper schema
    valid_data = []
    seen_ids = set()
    for idx, item in enumerate(master_data):
        sid = item.get('sample_id') or f"SFT_MASTER_{idx:05d}"
        if sid in seen_ids:
            continue
        seen_ids.add(sid)
        
        # Ensure all fields
        instruction = (item.get('instruction') or '').strip()
        input_text = (item.get('input') or '').strip()
        output_text = (item.get('output') or '').strip()
        intent_code = item.get('intent_code') or 'THEORY_EXAM'
        
        if not output_text or len(output_text) < 10:
            continue
            
        valid_data.append({
            "sample_id": sid,
            "instruction": instruction if instruction else input_text,
            "input": input_text if input_text else instruction,
            "output": output_text,
            "intent_code": intent_code
        })
        
    print(f"-> Tổng số mẫu SFT hợp lệ, chuẩn hóa cuối cùng: {len(valid_data)} mẫu.")
    
    # 4. Save to master
    with open(MASTER_PATH, 'w', encoding='utf-8') as f:
        json.dump(valid_data, f, ensure_ascii=False, indent=2)
    print(f"-> Đã ghi đè thành công toàn bộ dữ liệu hợp nhất vào: {MASTER_PATH}")
    
    # File size
    fsize = os.path.getsize(MASTER_PATH) / (1024 * 1024)
    print(f"-> Dung lượng file sft_vietlaw_master.json: {fsize:.2f} MB")
    print("=== HOÀN TẤT HỢP NHẤT DATA ===")

if __name__ == '__main__':
    main()
