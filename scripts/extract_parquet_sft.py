"""
=============================================================================
VietLawAssist — Trình trích xuất & Chuẩn hóa Parquet sang SFT/RAG Dataset
=============================================================================
Trích xuất 3.516 mẫu chất lượng cao từ test-00000-of-00001.parquet:
- 1.766 mẫu qa_practical (Tư vấn áp dụng luật thực tiễn)
- 1.750 mẫu explain_simple (Giải thích quy định pháp luật dễ hiểu)
"""

import json
import re
import sys
from pathlib import Path
import pandas as pd

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parents[1]
PARQUET_PATH = PROJECT_ROOT / "data" / "new" / "test-00000-of-00001.parquet"
OUTPUT_PRACTICAL_PATH = PROJECT_ROOT / "data" / "processed" / "sft_practical_3500.json"
OUTPUT_MASTER_PATH = PROJECT_ROOT / "data" / "processed" / "sft_vietlaw_master.json"
SFT_500_PATH = PROJECT_ROOT / "data" / "processed" / "sft_vietlaw_500.json"


def extract_parquet_samples():
    if not PARQUET_PATH.exists():
        print(f"[!] Không tìm thấy file: {PARQUET_PATH}")
        return []

    print(f"[*] Đang đọc file Parquet: {PARQUET_PATH}...")
    df = pd.read_parquet(PARQUET_PATH)
    subset = df[df["qa_type"].isin(["qa_practical", "explain_simple"])].copy()
    print(f"[*] Đã lọc {len(subset)} dòng thuộc nhóm qa_practical & explain_simple.")

    extracted_samples = []
    skipped = 0

    for idx, row in subset.iterrows():
        qa_type = row["qa_type"]
        doc_type = row.get("document_type", "Văn bản QPPL")
        source_id = str(row.get("source_id", idx))
        conversations = row["conversations"]

        if len(conversations) < 3:
            skipped += 1
            continue

        user_content = conversations[1]["content"].strip()
        assistant_content = conversations[2]["content"].strip()

        if not user_content or not assistant_content:
            skipped += 1
            continue

        if qa_type == "qa_practical":
            intent_code = "PRACTICAL_CONSULT"
            instruction = f"Tư vấn pháp lý thực tiễn và xác định trách nhiệm, nghĩa vụ của các chủ thể liên quan đến {doc_type}."
        else:
            intent_code = "EXPLAIN_LAW"
            instruction = f"Giải thích nội dung, đối tượng áp dụng và tính hiệu lực của {doc_type} một cách đơn giản, dễ hiểu."

        sample_id = f"SFT_PARQUET_{qa_type.upper()}_{source_id}_{idx}"

        extracted_samples.append({
            "sample_id": sample_id,
            "intent_code": intent_code,
            "instruction": instruction,
            "input": user_content,
            "output": assistant_content
        })

    print(f"[+] Đã chuẩn hóa thành công {len(extracted_samples)} mẫu (bỏ qua {skipped} mẫu không hợp lệ).")
    return extracted_samples


def main():
    extracted = extract_parquet_samples()
    if not extracted:
        return

    # 1. Lưu file sft_practical_3500.json
    OUTPUT_PRACTICAL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PRACTICAL_PATH, "w", encoding="utf-8") as f:
        json.dump(extracted, f, ensure_ascii=False, indent=2)
    print(f"[*] Đã lưu {len(extracted)} mẫu vào: {OUTPUT_PRACTICAL_PATH}")

    # 2. Hợp nhất với sft_vietlaw_500.json tạo Master Dataset
    master_samples = []
    if SFT_500_PATH.exists():
        with open(SFT_500_PATH, "r", encoding="utf-8") as f:
            core_samples = json.load(f)
        master_samples.extend(core_samples)
        print(f"[*] Nạp {len(core_samples)} mẫu cốt lõi từ {SFT_500_PATH.name}")

    master_samples.extend(extracted)

    with open(OUTPUT_MASTER_PATH, "w", encoding="utf-8") as f:
        json.dump(master_samples, f, ensure_ascii=False, indent=2)
    print(f"[SUCCESS] Đã tạo Master Dataset gồm {len(master_samples)} mẫu tại: {OUTPUT_MASTER_PATH}")

    # Thống kê
    stats = {}
    for item in master_samples:
        c = item.get("intent_code", "UNKNOWN")
        stats[c] = stats.get(c, 0) + 1

    print("\n[*] THỐNG KÊ TOÀN BỘ MASTER DATASET (3.813 MẪU):")
    for k, v in stats.items():
        print(f"    - {k}: {v} mẫu")


if __name__ == "__main__":
    main()
