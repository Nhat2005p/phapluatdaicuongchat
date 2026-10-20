"""
=============================================================================
VietLawAssist — Trình trích xuất & Chuẩn hóa 10.000 mẫu SFT Master Dataset
=============================================================================
Thu thập và deduplicate từ 4 nguồn:
1. sft_vietlaw_500.json (297 mẫu cốt lõi TMU, DUE, Bộ 200 câu)
2. test-00000-of-00001.parquet (đã có từ trước)
3. train-00000-of-00003.parquet (74.058 dòng)
4. train-00002-of-00003.parquet (74.057 dòng)

Mục tiêu: Đạt đúng 10.000 mẫu chất lượng cao, đa dạng thể loại và KHÔNG TRÙNG LẶP.
"""

import hashlib
import json
import re
import sys
from pathlib import Path
import pyarrow.parquet as pq

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
PARQUET_TEST = DATA_DIR / "new" / "test-00000-of-00001.parquet"
PARQUET_TRAIN_0 = DATA_DIR / "new" / "train-00000-of-00003.parquet"
PARQUET_TRAIN_2 = DATA_DIR / "new" / "train-00002-of-00003.parquet"

CORE_500_PATH = DATA_DIR / "processed" / "sft_vietlaw_500.json"
PRACTICAL_PREV_PATH = DATA_DIR / "processed" / "sft_practical_3500.json"
OUTPUT_MASTER_PATH = DATA_DIR / "processed" / "sft_vietlaw_master.json"

TARGET_TOTAL = 10000


def normalize_text(text: str) -> str:
    """Chuẩn hóa chuỗi để so sánh trùng lặp."""
    text = text.lower()
    text = re.sub(r"\s+", " ", text).strip()
    return text


def get_hash(text: str) -> str:
    norm = normalize_text(text)
    return hashlib.md5(norm.encode("utf-8")).hexdigest()


def process_parquet_batch(parquet_path, seen_hashes, quota_per_type, collected_samples):
    """Đọc và trích xuất mẫu từ 1 file Parquet theo hạn mức qa_type và kiểm tra trùng lặp."""
    if not parquet_path.exists():
        print(f"[!] Bỏ qua (không tìm thấy): {parquet_path.name}")
        return

    print(f"[*] Đang xử lý: {parquet_path.name}...")
    parquet_file = pq.ParquetFile(parquet_path)
    
    # Đọc theo từng row group (batch) để tối ưu RAM
    num_row_groups = parquet_file.num_row_groups
    print(f"    Tổng số row groups: {num_row_groups}")

    for rg_idx in range(num_row_groups):
        table = parquet_file.read_row_group(rg_idx, columns=["qa_type", "conversations", "source_id", "document_type"])
        df = table.to_pandas()

        for idx, row in df.iterrows():
            qa_type = str(row.get("qa_type", "")).strip()
            
            # Chỉ lấy các dạng chất lượng cao phục vụ tư vấn pháp lý
            if qa_type not in quota_per_type:
                continue
            if quota_per_type[qa_type] <= 0:
                continue

            conversations = row.get("conversations")
            if conversations is None or len(conversations) < 3:
                continue

            user_content = str(conversations[1].get("content", "")).strip()
            assistant_content = str(conversations[2].get("content", "")).strip()

            # Lọc chất lượng nội dung
            if len(user_content) < 25 or len(assistant_content) < 80:
                continue
            
            # Loại trừ câu cụt hoặc lỗi font
            if "..." in user_content[-10:] and len(user_content) < 50:
                continue

            # Kiểm tra chống trùng lặp input & output
            input_hash = get_hash(user_content)
            if input_hash in seen_hashes:
                continue

            seen_hashes.add(input_hash)
            quota_per_type[qa_type] -= 1

            doc_type = str(row.get("document_type", "Văn bản QPPL")).strip()
            source_id = str(row.get("source_id", f"{rg_idx}_{idx}")).strip()

            if qa_type == "qa_practical":
                intent_code = "PRACTICAL_CONSULT"
                instruction = f"Tư vấn pháp lý thực tiễn và xác định quyền, nghĩa vụ, trách nhiệm theo {doc_type}."
            elif qa_type == "explain_simple":
                intent_code = "EXPLAIN_LAW"
                instruction = f"Giải thích nội dung, đối tượng áp dụng và tính hiệu lực của {doc_type} một cách đơn giản, dễ hiểu."
            elif qa_type == "summarize":
                intent_code = "SUMMARIZE_LAW"
                instruction = f"Tóm tắt các điểm mấu chốt, nội dung quan trọng nhất của {doc_type}."
            elif qa_type == "legal_basis":
                intent_code = "LEGAL_BASIS"
                instruction = f"Phân tích căn cứ pháp lý và thẩm quyền ban hành đối với {doc_type}."
            else:
                intent_code = "GENERAL_THEORY"
                instruction = f"Phân tích các quy định và khía cạnh pháp lý liên quan đến {doc_type}."

            sample_id = f"SFT_{qa_type.upper()}_{source_id}_{len(collected_samples)+1}"

            collected_samples.append({
                "sample_id": sample_id,
                "intent_code": intent_code,
                "instruction": instruction,
                "input": user_content,
                "output": assistant_content
            })

            if sum(quota_per_type.values()) <= 0:
                print("    Đã đạt đủ hạn mức từ Parquet.")
                return


def main():
    print("=" * 70)
    print("BẮT ĐẦU QUY TRÌNH XÂY DỰNG 10.000 MẪU SFT VIETLAW MASTER")
    print("=" * 70)

    seen_hashes = set()
    master_samples = []

    # BƯỚC 1: Nạp 297 mẫu cốt lõi (Đề thi, Bài tập đại cương TMU, DUE, Bộ 200 câu)
    if CORE_500_PATH.exists():
        with open(CORE_500_PATH, "r", encoding="utf-8") as f:
            core_data = json.load(f)
        for item in core_data:
            inp = item.get("input", "")
            h = get_hash(inp)
            seen_hashes.add(h)
            master_samples.append(item)
        print(f"[1] Đã nạp {len(core_data)} mẫu cốt lõi từ sft_vietlaw_500.json.")
    else:
        print("[!] Không tìm thấy sft_vietlaw_500.json!")

    # BƯỚC 2: Nạp các mẫu hiện có từ sft_practical_3500.json (đã deduplicate)
    prev_count = 0
    if PRACTICAL_PREV_PATH.exists():
        with open(PRACTICAL_PREV_PATH, "r", encoding="utf-8") as f:
            prev_data = json.load(f)
        for item in prev_data:
            inp = item.get("input", "")
            h = get_hash(inp)
            if h not in seen_hashes:
                seen_hashes.add(h)
                master_samples.append(item)
                prev_count += 1
        print(f"[2] Đã kế thừa {prev_count} mẫu không trùng lặp từ sft_practical_3500.json.")

    print(f"[*] Hiện đã có {len(master_samples)} mẫu. Cần bổ sung thêm {TARGET_TOTAL - len(master_samples)} mẫu.")

    needed = TARGET_TOTAL - len(master_samples)
    if needed > 0:
        # Phân bổ hạn mức đa dạng các thể loại câu hỏi thực tế
        # Ưu tiên cao nhất: qa_practical (tình huống), explain_simple (giải thích), summarize (tóm tắt)
        half_needed = needed // 2
        
        # Đợt 1: Lấy từ train-00000-of-00003.parquet
        quota_shard_0 = {
            "qa_practical": int(half_needed * 0.45),
            "explain_simple": int(half_needed * 0.35),
            "summarize": int(half_needed * 0.15),
            "legal_basis": int(half_needed * 0.05) + 10,
        }
        process_parquet_batch(PARQUET_TRAIN_0, seen_hashes, quota_shard_0, master_samples)

        # Đợt 2: Lấy số lượng còn lại từ train-00002-of-00003.parquet
        remaining_needed = TARGET_TOTAL - len(master_samples)
        if remaining_needed > 0:
            quota_shard_2 = {
                "qa_practical": int(remaining_needed * 0.45),
                "explain_simple": int(remaining_needed * 0.35),
                "summarize": int(remaining_needed * 0.15),
                "legal_basis": int(remaining_needed * 0.05) + 20,
            }
            process_parquet_batch(PARQUET_TRAIN_2, seen_hashes, quota_shard_2, master_samples)

    # Đảm bảo chính xác đúng TARGET_TOTAL nếu lấy dôi
    if len(master_samples) > TARGET_TOTAL:
        # Giữ nguyên 297 mẫu cốt lõi đầu tiên, cắt phần sau
        core_len = len(core_data) if 'core_data' in locals() else 297
        core_part = master_samples[:core_len]
        rest_part = master_samples[core_len:TARGET_TOTAL]
        master_samples = core_part + rest_part

    print(f"\n[+] Tổng số mẫu sau deduplication & kiểm định: {len(master_samples)}")

    # Ghi file Master
    print(f"[*] Đang ghi file {OUTPUT_MASTER_PATH}...")
    with open(OUTPUT_MASTER_PATH, "w", encoding="utf-8") as f:
        json.dump(master_samples, f, ensure_ascii=False, indent=2)

    file_size_mb = OUTPUT_MASTER_PATH.stat().st_size / (1024 * 1024)
    print(f"[SUCCESS] Đã tạo thành công Master Dataset {len(master_samples)} mẫu ({file_size_mb:.2f} MB)!")

    # Thống kê phân bổ intent
    intent_stats = {}
    for item in master_samples:
        it = item.get("intent_code", "UNKNOWN")
        intent_stats[it] = intent_stats.get(it, 0) + 1

    print("\n" + "=" * 50)
    print("PHÂN BỔ INTENT TRONG MASTER DATASET:")
    for k, v in intent_stats.items():
        pct = (v / len(master_samples)) * 100
        print(f"  • {k:20s}: {v:5d} mẫu ({pct:.1f}%)")
    print("=" * 50)


if __name__ == "__main__":
    main()
