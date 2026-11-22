# VietLaw SFT Master Dataset (21.292 Mẫu Chuẩn)

Bộ dữ liệu Supervised Fine-Tuning (SFT) & Retrieval-Augmented Generation (RAG) toàn diện môn **Pháp luật đại cương** và **Pháp luật thực định Việt Nam** (Bộ luật Dân sự 2015, Bộ luật Hình sự 2015 sđ 2017, Bộ luật Lao động 2019, Luật Hôn nhân & Gia đình 2014, Luật Ban hành VBQPPL 2015 sđ 2020...).

---

## 1. Danh Sách Các Tệp Dữ Liệu Trong Bộ Dataset

| Tên file | Định dạng | Số dòng / Mẫu | Mục đích sử dụng |
| :--- | :--- | :---: | :--- |
| **`sft_vietlaw_master.json`** | JSON (Array) | 21.292 | Bản ghi Master dạng JSON đầy đủ thông tin, cấu trúc gốc của hệ thống Chatbot. |
| **`sft_vietlaw_master.jsonl`** | JSONL (1 line/record) | 21.292 | Bản ghi Master chuẩn JSONL kèm đầy đủ metadata, nhãn split và lịch sử messages. |
| **`sft_vietlaw_train.jsonl`** | JSONL (`{"messages": [...]}`) | 17035 (80%) | Tập dữ liệu đưa vào mô hình học để cập nhật trọng số (LoRA Fine-tuning). |
| **`sft_vietlaw_validation.jsonl`** | JSONL (`{"messages": [...]}`) | 2131 (10%) | Tập kiểm định dùng để đánh giá validation loss qua từng epoch. |
| **`sft_vietlaw_test.jsonl`** | JSONL (`{"messages": [...]}`) | 2126 (10%) | Tập đề thi độc lập dùng để đánh giá năng lực thực tế sau khi train. |
| **`sft_vietlaw_flat.csv`** | CSV (UTF-8 BOM) | 21.292 | Bản phẳng dạng bảng tính mở trực tiếp bằng **Microsoft Excel / Google Sheets**. |
| **`sft_vietlaw_QA_report.json`** | JSON | Báo cáo | Báo cáo kiểm thử chất lượng, phân bố 18 nhóm taxonomy và chỉ số độ dài token. |

---

## 2. Cấu Trúc Bản Ghi (Schema Data)

Mỗi bản ghi trong bộ dữ liệu bao gồm các trường chuẩn:
- `sample_id` (String): Định danh duy nhất cho từng mẫu (ví dụ: `SFT_PLDC_001`, `SFT_GOLD_USER_CASE_01`).
- `taxonomy_group` (String): Nhóm ý định chuẩn theo Barem 18 nhóm (G01 đến G18).
- `intent_code` (String): Mã ý định pháp lý (ví dụ: `VPPL_4_ELEMENTS`, `COMPARISON`, `CIVIL_INHERIT`, `QPPL_STRUCT`...).
- `split` (String): Phân định tập huấn luyện (`train`, `validation`, `test`).
- `corpus_role` (String): Vai trò tra cứu (`exact_lookup`, `fuzzy_base`, `train_aug`).
- `is_canonical` (Boolean): Mẫu chân lý hoặc câu hỏi đề thi chuẩn (`true` / `false`).
- `instruction` (String): Câu hỏi hoặc đề bài pháp lý của người dùng.
- `input` (String): Dữ kiện mở rộng hoặc ngữ cảnh tình huống.
- `context` (String): Căn cứ pháp lý thực định và giáo trình trích dẫn đặt trong thẻ `<context>`.
- `output` (String): Câu trả lời mẫu chuẩn xác 100% theo Barem Bộ GD&ĐT và pháp luật hiện hành.
- `messages` (Array): Mảng định dạng chuẩn OpenAI / Hugging Face ChatML (`system`, `user`, `assistant`).

---

## 3. Phân Bố 18 Nhóm Intent Taxonomy

- **G05_SCENARIO_NARRATIVE**: 5177 mẫu (24.3%)
- **G04_TRUE_FALSE**: 3016 mẫu (14.2%)
- **G01_CONCEPT_NATURE**: 2987 mẫu (14.0%)
- **G06_FACTOID_THRESHOLD**: 1743 mẫu (8.2%)
- **G07_AMBIGUOUS_UNDERSPECIFIED**: 1706 mẫu (8.0%)
- **G08_ADVERSARIAL_OOS**: 1342 mẫu (6.3%)
- **G02_COMPARATIVE**: 1078 mẫu (5.1%)
- **G09_PROCEDURAL_HOWTO**: 728 mẫu (3.4%)
- **G03_STRUCTURAL_ANALYSIS**: 665 mẫu (3.1%)
- **G11_DOC_SUMMARIZATION**: 627 mẫu (2.9%)
- **G13_EXCEPTION_SEEKING**: 608 mẫu (2.9%)
- **G15_MULTITURN_FOLLOWUP**: 508 mẫu (2.4%)
- **G12_VERIFICATION_YESNO**: 312 mẫu (1.5%)
- **G14_ANALYTICAL_CRITICAL**: 222 mẫu (1.0%)
- **G16_FORMAT_CONSTRAINED**: 210 mẫu (1.0%)
- **G17_PREVENTIVE_RISK**: 192 mẫu (0.9%)
- **G18_META_CONVERSATIONAL**: 171 mẫu (0.8%)

---

## 4. Hướng Dẫn Sử Dụng Trong Python & Hugging Face

### Đọc dữ liệu bằng Pandas:
```python
import pandas as pd

# Đọc file CSV phẳng
df = pd.read_csv('data/processed/sft_vietlaw_flat.csv', encoding='utf-8-sig')
print(f"Tổng số mẫu: {len(df)}")
print(df['taxonomy_group'].value_counts())
```

### Nạp vào Hugging Face Datasets:
```python
from datasets import load_dataset

dataset = load_dataset('json', data_files={
    'train': 'data/processed/sft_vietlaw_train.jsonl',
    'validation': 'data/processed/sft_vietlaw_validation.jsonl',
    'test': 'data/processed/sft_vietlaw_test.jsonl'
})

print(dataset)
```

### Huấn luyện LoRA bằng Script dự án:
```bash
# Huấn luyện mô hình LoRA siêu tốc trên GPU:
python scripts/train_lora_unsloth.py
```
