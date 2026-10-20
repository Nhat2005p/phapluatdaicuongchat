"""
=============================================================================
VietLawAssist — Huấn luyện LoRA Tầng 4 & Xuất GGUF Siêu Tốc (PEFT + BnB 4-bit)
=============================================================================
Phiên bản tối ưu hóa loại bỏ hoàn toàn việc biên dịch xformers/unsloth gây treo,
tương thích 100% với Kaggle Python 3.12 (GPU T4 x2 / P100) và Local GPU.
"""

import gc
import glob
import json
import os
import shutil
import torch
from datasets import Dataset
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    DataCollatorForSeq2Seq,
    Trainer,
    TrainingArguments,
)
from peft import LoraConfig, PeftModel, get_peft_model, prepare_model_for_kbit_training

BASE_MODEL_NAME = "bqbbao6/Qwen2.5-3B-legal-vn"
CLEAN_FP16_BASE = "Qwen/Qwen2.5-3B-Instruct"
MAX_SEQ_LENGTH = 1536
ADAPTER_DIR = "models/vietlaw_lora_adapter"

INTENT_BAREM_SPECS = {
    "QPPL_STRUCT": "[INTENT: QPPL_STRUCT] Barem 3 bộ phận Quy phạm pháp luật (Giả định - Quy định - Chế tài), xác định phương thức thể hiện và cơ cấu Quan hệ pháp luật (Chủ thể - Nội dung - Khách thể).",
    "VPPL_4_ELEMENTS": "[INTENT: VPPL_4_ELEMENTS] Barem 4 yếu tố cấu thành Vi phạm pháp luật (1. Mặt khách quan - 2. Mặt chủ quan/Lỗi - 3. Khách thể - 4. Chủ thể) và Trách nhiệm bồi thường thiệt hại ngoài hợp đồng (BLDS 2015).",
    "TRUE_FALSE": "[INTENT: TRUE_FALSE] Barem Nhận định Đúng/Sai 3 bước (I. Kết luận dứt khoát Đúng/Sai - II. Giải thích lý luận giáo trình - III. Căn cứ pháp lý & Phản ví dụ thực tế).",
    "CIVIL_INHERIT": "[INTENT: CIVIL_INHERIT] Barem thuật toán chia thừa kế (Xác định di sản riêng/chung vợ chồng -> Xét di chúc & người thừa kế không phụ thuộc di chúc Điều 644 BLDS 2015 hưởng 2/3 suất -> Chia theo pháp luật Điều 651 & thế vị Điều 652).",
    "CRIMINAL_AGE": "[INTENT: CRIMINAL_AGE] Barem xác định năng lực trách nhiệm hình sự theo độ tuổi (Điều 12, Điều 9, Điều 101 BLHS 2015: mốc 14-16 tuổi và từ đủ 16 tuổi).",
    "GENERAL_THEORY": "[INTENT: GENERAL_THEORY] Barem Lý luận chung về Nhà nước và Pháp luật (Nguồn gốc, bản chất, chức năng, hình thức nhà nước, bộ máy nhà nước CHXHCN VN, hệ thống VBQPPL, thực hiện pháp luật và phòng chống tham nhũng).",
    "PRACTICAL_CONSULT": "[INTENT: PRACTICAL_CONSULT] Barem Tư vấn pháp lý thực tiễn (1. Xác định phạm vi và đối tượng điều chỉnh - 2. Quyền và nghĩa vụ của các bên - 3. Thẩm quyền cơ quan xử lý - 4. Hiệu lực văn bản áp dụng).",
    "EXPLAIN_LAW": "[INTENT: EXPLAIN_LAW] Barem Giải thích pháp luật đơn giản (1. Bản chất văn bản/quy định - 2. Ai cần quan tâm - 3. Nội dung điều khoản then chốt - 4. Tình trạng hiệu lực pháp lý)."
}

SYSTEM_PROMPT = (
    "Bạn là Giảng viên / Chuyên gia Pháp lý VietLawAssist môn Pháp luật Đại cương. "
    "Hãy giải bài tập rõ ràng theo barem chuẩn của Bộ GD&ĐT."
)


def resolve_dataset_path() -> str:
    candidates = glob.glob("/kaggle/input/**/sft_vietlaw_*.json", recursive=True)
    if not candidates:
        candidates = glob.glob("/kaggle/input/**/*.json", recursive=True)
    if candidates:
        return candidates[0]
    if os.path.exists("data/processed/sft_vietlaw_master.json"):
        return "data/processed/sft_vietlaw_master.json"
    if os.path.exists("data/processed/sft_vietlaw_500.json"):
        return "data/processed/sft_vietlaw_500.json"
    return "sft_vietlaw_500.json"


def main():
    assert torch.cuda.is_available(), "Cần bật GPU (CUDA) để chạy huấn luyện 4-bit!"
    print(f"[*] 1. Đang chạy trên GPU: {torch.cuda.get_device_name(0)}")

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    print(f"[*] 2. Tải mô hình gốc: {BASE_MODEL_NAME}...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_NAME,
        quantization_config=bnb_config,
        device_map={"": 0},
        trust_remote_code=True,
    )
    model = prepare_model_for_kbit_training(model)

    print("[*] 3. Gắn LoRA Adapter Tầng 4 (r=16, alpha=32, dropout=0.05)...")
    lora_config = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
    )
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()

    dataset_path = resolve_dataset_path()
    print(f"[*] 4. Tiền xử lý dữ liệu chuẩn 4 Tầng từ: {dataset_path}...")
    with open(dataset_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    processed_samples = []
    for item in raw_data:
        intent_code = item.get("intent_code", "VPPL_4_ELEMENTS").strip()
        instruction = item.get("instruction", "").strip()
        input_text = item.get("input", "").strip()
        output_text = item.get("output", "").strip()
        barem_spec = INTENT_BAREM_SPECS.get(intent_code, INTENT_BAREM_SPECS["VPPL_4_ELEMENTS"])

        user_rag_prompt = (
            f"{barem_spec}\nNhiệm vụ: {instruction}\n\n"
            f"Yêu cầu: Hãy phân tích và giải đề thi sau đây theo chuẩn khung chấm điểm:\n{input_text}"
        )
        msg_tier4 = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_rag_prompt},
            {"role": "assistant", "content": output_text},
        ]
        processed_samples.append(
            {"text": tokenizer.apply_chat_template(msg_tier4, tokenize=False, add_generation_prompt=False)}
        )

        msg_direct = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"{instruction}\n\n{input_text}"},
            {"role": "assistant", "content": output_text},
        ]
        processed_samples.append(
            {"text": tokenizer.apply_chat_template(msg_direct, tokenize=False, add_generation_prompt=False)}
        )

    def tokenize_fn(batch):
        out = tokenizer(batch["text"], truncation=True, max_length=MAX_SEQ_LENGTH, padding=False)
        out["labels"] = out["input_ids"].copy()
        return out

    dataset = Dataset.from_list(processed_samples).shuffle(seed=42)
    tokenized_dataset = dataset.map(tokenize_fn, batched=True, remove_columns=["text"])
    print(f"     -> Đã tạo {len(tokenized_dataset)} mẫu huấn luyện đa tầng!")

    print("[*] 5. Bắt đầu huấn luyện LoRA Tầng 4...")
    trainer = Trainer(
        model=model,
        train_dataset=tokenized_dataset,
        data_collator=DataCollatorForSeq2Seq(tokenizer, pad_to_multiple_of=8, return_tensors="pt", padding=True),
        args=TrainingArguments(
            per_device_train_batch_size=2,
            gradient_accumulation_steps=4,
            warmup_steps=5,
            num_train_epochs=5,
            learning_rate=2e-4,
            fp16=True,
            logging_steps=5,
            optim="paged_adamw_8bit",
            lr_scheduler_type="cosine",
            seed=42,
            output_dir="models/checkpoints",
            save_strategy="no",
            report_to="none",
            ddp_find_unused_parameters=False,
        ),
    )
    trainer.train()

    os.makedirs(ADAPTER_DIR, exist_ok=True)
    model.save_pretrained(ADAPTER_DIR)
    tokenizer.save_pretrained(ADAPTER_DIR)
    print(f"[SUCCESS] Đã lưu trọng số LoRA Adapter tại: {ADAPTER_DIR}")


if __name__ == "__main__":
    main()
