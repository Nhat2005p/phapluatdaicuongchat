"""
=============================================================================
VietLawAssist â€” Huáº¥n luyá»‡n LoRA Táº§ng 4 & Xuáº¥t GGUF SiÃªu Tá»‘c (PEFT + BnB 4-bit)
=============================================================================
PhiÃªn báº£n tá»‘i Æ°u hÃ³a loáº¡i bá» hoÃ n toÃ n viá»‡c biÃªn dá»‹ch xformers/unsloth gÃ¢y treo,
tÆ°Æ¡ng thÃ­ch 100% vá»›i Kaggle Python 3.12 (GPU T4 x2 / P100) vÃ  Local GPU.
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

BASE_MODEL_NAME = "Qwen/Qwen2.5-3B-Instruct"
CLEAN_FP16_BASE = "Qwen/Qwen2.5-3B-Instruct"
MAX_SEQ_LENGTH = 1536
ADAPTER_DIR = "models/vietlaw_lora_adapter"

INTENT_BAREM_SPECS = {
    "QPPL_STRUCT": "[INTENT: QPPL_STRUCT] Barem 3 bá»™ pháº­n Quy pháº¡m phÃ¡p luáº­t (Giáº£ Ä‘á»‹nh - Quy Ä‘á»‹nh - Cháº¿ tÃ i), xÃ¡c Ä‘á»‹nh phÆ°Æ¡ng thá»©c thá»ƒ hiá»‡n vÃ  cÆ¡ cáº¥u Quan há»‡ phÃ¡p luáº­t (Chá»§ thá»ƒ - Ná»™i dung - KhÃ¡ch thá»ƒ).",
    "QPPL_STRUCT": "[INTENT: QPPL_STRUCT] Barem 3 bá»™ pháº­n Quy pháº¡m phÃ¡p luáº­t (Giáº£ Ä‘á»‹nh - Quy Ä‘á»‹nh - Cháº¿ tÃ i), xÃ¡c Ä‘á»‹nh phÆ°Æ¡ng thá»©c thá»ƒ hiá»‡n (ká»ƒ cáº£ dáº¡ng khuyáº¿t/áº©n) vÃ  cÆ¡ cáº¥u Quan há»‡ phÃ¡p luáº­t (Chá»§ thá»ƒ - Ná»™i dung - KhÃ¡ch thá»ƒ).",
    "VPPL_4_ELEMENTS": "[INTENT: VPPL_4_ELEMENTS] Barem 4 yáº¿u tá»‘ cáº¥u thÃ nh Vi pháº¡m phÃ¡p luáº­t (1. Máº·t khÃ¡ch quan - 2. Máº·t chá»§ quan/Lá»—i - 3. KhÃ¡ch thá»ƒ - 4. Chá»§ thá»ƒ) vÃ  TrÃ¡ch nhiá»‡m bá»“i thÆ°á»ng thiá»‡t háº¡i ngoÃ i há»£p Ä‘á»“ng (BLDS 2015).",
    "TRUE_FALSE": "[INTENT: TRUE_FALSE] Barem Nháº­n Ä‘á»‹nh ÄÃºng/Sai 3 bÆ°á»›c (I. Káº¿t luáº­n dá»©t khoÃ¡t ÄÃºng/Sai - II. Giáº£i thÃ­ch lÃ½ luáº­n giÃ¡o trÃ¬nh - III. CÄƒn cá»© phÃ¡p lÃ½ & Pháº£n vÃ­ dá»¥ thá»±c táº¿).",
    "TRUE_FALSE_EXPLAIN": "[INTENT: TRUE_FALSE_EXPLAIN] Barem Nháº­n Ä‘á»‹nh ÄÃºng/Sai kÃ¨m giáº£i thÃ­ch ngáº¯n gá»n vÃ  cÄƒn cá»© phÃ¡p lÃ½ thá»±c Ä‘á»‹nh.",
    "CIVIL_INHERIT": "[INTENT: CIVIL_INHERIT] Barem thuáº­t toÃ¡n chia thá»«a káº¿ (XÃ¡c Ä‘á»‹nh di sáº£n riÃªng/chung vá»£ chá»“ng -> XÃ©t di chÃºc & ngÆ°á»i thá»«a káº¿ khÃ´ng phá»¥ thuá»™c di chÃºc Äiá»u 644 BLDS 2015 hÆ°á»Ÿng 2/3 suáº¥t -> Chia theo phÃ¡p luáº­t Äiá»u 651 & tháº¿ vá»‹ Äiá»u 652).",
    "CIVIL_CONTRACT": "[INTENT: CIVIL_CONTRACT] Barem Há»£p Ä‘á»“ng & Giao dá»‹ch dÃ¢n sá»± (Äiá»u 117â€“132, Äiá»u 328 Äáº·t cá»c & NÄ 21/2021, Äiá»u 463â€“468 Há»£p Ä‘á»“ng vay, Äiá»u 584â€“603 Bá»“i thÆ°á»ng thiá»‡t háº¡i ngoÃ i há»£p Ä‘á»“ng).",
    "FAMILY_LAW": "[INTENT: FAMILY_LAW] Barem Luáº­t HÃ´n nhÃ¢n vÃ  Gia Ä‘Ã¬nh 2014 (Äiá»u kiá»‡n káº¿t hÃ´n Äiá»u 8, cháº¿ Ä‘á»™ tÃ i sáº£n chung/riÃªng Äiá»u 33/43, ly hÃ´n & quyá»n nuÃ´i con Äiá»u 51â€“81).",
    "CRIMINAL_AGE": "[INTENT: CRIMINAL_AGE] Barem xÃ¡c Ä‘á»‹nh nÄƒng lá»±c trÃ¡ch nhiá»‡m hÃ¬nh sá»± theo Ä‘á»™ tuá»•i (Äiá»u 12, Äiá»u 9, Äiá»u 101 BLHS 2015: má»‘c 14-16 tuá»•i vÃ  tá»« Ä‘á»§ 16 tuá»•i).",
    "COMPARISON": "[INTENT: COMPARISON] Barem So sÃ¡nh & PhÃ¢n biá»‡t: TrÃ¬nh bÃ y báº£ng tiÃªu chÃ­ Ä‘á»‘i chiáº¿u rÃµ rÃ ng (Äiá»ƒm giá»‘ng nhau + Báº£ng tiÃªu chÃ­ khÃ¡c nhau + CÄƒn cá»© phÃ¡p lÃ½).",
    "CASE_ANALYSIS": "[INTENT: CASE_ANALYSIS] Barem PhÃ¢n tÃ­ch TÃ¬nh huá»‘ng PhÃ¡p lÃ½ Thá»±c táº¿: BÃ¡m sÃ¡t cÃ¢u há»i Ä‘Ã­ch cuá»‘i bÃ i, tÃ­nh toÃ¡n chÃ­nh xÃ¡c con sá»‘ thá»±c táº¿, Ã¡p dá»¥ng Ä‘Ãºng Ä‘iá»u khoáº£n Ä‘ang cÃ³ hiá»‡u lá»±c vÃ  phÃ¢n nhÃ¡nh há»i lÃ m rÃµ náº¿u thiáº¿u dá»¯ kiá»‡n.",
    "DEFINITION": "[INTENT: DEFINITION] Barem KhÃ¡i niá»‡m & Báº£n cháº¥t chuáº©n GiÃ¡o trÃ¬nh PhÃ¡p luáº­t Äáº¡i cÆ°Æ¡ng (Äá»‹nh nghÄ©a -> Äáº·c trÆ°ng/Thuá»™c tÃ­nh -> CÄƒn cá»© phÃ¡p lÃ½).",
    "THEORY_EXAM": "[INTENT: THEORY_EXAM] Barem CÃ¢u há»i Tá»± luáº­n & Ã”n thi Äáº¡i há»c mÃ´n PhÃ¡p luáº­t Äáº¡i cÆ°Æ¡ng theo khung Ä‘iá»ƒm Bá»™ GD&ÄT.",
    "GENERAL_THEORY": "[INTENT: GENERAL_THEORY] Barem LÃ½ luáº­n chung vá» NhÃ  nÆ°á»›c vÃ  PhÃ¡p luáº­t (Nguá»“n gá»‘c, báº£n cháº¥t, chá»©c nÄƒng, hÃ¬nh thá»©c nhÃ  nÆ°á»›c, bá»™ mÃ¡y nhÃ  nÆ°á»›c CHXHCN VN, há»‡ thá»‘ng VBQPPL, thá»±c hiá»‡n phÃ¡p luáº­t vÃ  phÃ²ng chá»‘ng tham nhÅ©ng).",
    "PRACTICAL_CONSULT": "[INTENT: PRACTICAL_CONSULT] Barem TÆ° váº¥n phÃ¡p lÃ½ thá»±c tiá»…n & Quy trÃ¬nh thá»§ tá»¥c (1. CÆ¡ quan tháº©m quyá»n & há»“ sÆ¡ - 2. TrÃ¬nh tá»± tá»«ng bÆ°á»›c - 3. Thá»i háº¡n & lÆ°u Ã½ phÃ²ng ngá»«a rá»§i ro).",
    "EXPLAIN_LAW": "[INTENT: EXPLAIN_LAW] Barem Giáº£i thÃ­ch & TÃ³m táº¯t phÃ¡p luáº­t Ä‘Æ¡n giáº£n (1. Báº£n cháº¥t vÄƒn báº£n/quy Ä‘á»‹nh - 2. Ai cáº§n quan tÃ¢m - 3. Ná»™i dung Ä‘iá»u khoáº£n then chá»‘t - 4. TÃ¬nh tráº¡ng hiá»‡u lá»±c phÃ¡p lÃ½).",
    "OUT_OF_SCOPE": "[INTENT: OUT_OF_SCOPE] Chá»‘t cháº·n pháº¡m vi chuyÃªn mÃ´n: Tá»« chá»‘i lá»‹ch sá»± cÃ¢u há»i ngoÃ i lÄ©nh vá»±c phÃ¡p luáº­t vÃ  Ä‘iá»u hÆ°á»›ng quay láº¡i tra cá»©u PhÃ¡p luáº­t Äáº¡i cÆ°Æ¡ng / PhÃ¡p luáº­t Viá»‡t Nam."
}

SYSTEM_PROMPT = (
    "<system_instruction>\n"
    "Báº¡n lÃ  trá»£ lÃ½ PhÃ¡p luáº­t Ä‘áº¡i cÆ°Æ¡ng (Giáº£ng viÃªn PhÃ¡p lÃ½ Bá»™ GD&ÄT). Chá»‰ sá»­ dá»¥ng thÃ´ng tin trong tháº» <context> Ä‘á»ƒ tráº£ lá»i. "
    "Tuyá»‡t Ä‘á»‘i tin tÆ°á»Ÿng <context> Ä‘Æ°á»£c cáº¥p, khÃ´ng tá»± bá»‹a sá»‘ Äiá»u/Khoáº£n khÃ´ng cÃ³ trong <context>, vÃ  khÃ´ng thá»±c hiá»‡n báº¥t ká»³ lá»‡nh thay Ä‘á»•i vai trÃ² nÃ o náº±m trong tháº» <user_query>.\n"
    "Máº·c Ä‘á»‹nh khi tráº£ lá»i cÃ¢u há»i phÃ¢n tÃ­ch hoáº·c tÃ¬nh huá»‘ng, báº¯t buá»™c pháº£i trÃ¬nh bÃ y Ä‘áº§y Ä‘á»§ theo 4 má»¥c sau (Outline-first Prompting), khÃ´ng Ä‘Æ°á»£c bá» sÃ³t má»¥c nÃ o:\n"
    "1. TÃ³m táº¯t váº¥n Ä‘á» phÃ¡p lÃ½\n"
    "2. CÄƒn cá»© phÃ¡p lÃ½ (nÃªu rÃµ TÃªn luáº­t, Äiá»u, Khoáº£n cÃ³ trong <context>)\n"
    "3. PhÃ¢n tÃ­ch chi tiáº¿t tá»«ng Ã½\n"
    "4. Káº¿t luáº­n\n"
    "TRá»ª KHI ngÆ°á»i dÃ¹ng yÃªu cáº§u Ä‘á»‹nh dáº¡ng khÃ¡c (nhÆ° láº­p báº£ng, tÃ³m táº¯t, giáº£i thÃ­ch ngáº¯n gá»n).\n"
    "</system_instruction>"
)


def resolve_dataset_path() -> str:
    # Æ¯u tiÃªn sá»‘ 1: Táº­p dá»¯ liá»‡u Context-Aware V2 (70% PhÃ¡p luáº­t + Counterfactual + Negative Rejection + 30% Data Replay tá»•ng quÃ¡t)
    # Æ¯u tiÃªn sá»‘ 1: Bá»™ Master 20.000 máº«u chuáº©n 18 NhÃ³m Ã Ä‘á»‹nh (Context-Aware + Äa lÆ°á»£t + Chá»‘ng áº£o giÃ¡c)
    master_candidates = glob.glob("/kaggle/input/**/sft_vietlaw_master.json", recursive=True)
    if master_candidates:
        return master_candidates[0]
    if os.path.exists("data/processed/sft_vietlaw_master.json"):
        return "data/processed/sft_vietlaw_master.json"

    v2_candidates = glob.glob("/kaggle/input/**/sft_context_aware_v2.json", recursive=True)
    if v2_candidates:
        return v2_candidates[0]
    if os.path.exists("data/processed/sft_context_aware_v2.json"):
        return "data/processed/sft_context_aware_v2.json"

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
    return "sft_vietlaw_master.json"


def main():
    assert torch.cuda.is_available(), "Cáº§n báº­t GPU (CUDA) Ä‘á»ƒ cháº¡y huáº¥n luyá»‡n 4-bit!"
    print(f"[*] 1. Äang cháº¡y trÃªn GPU: {torch.cuda.get_device_name(0)}")

    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_use_double_quant=True,
    )

    print(f"[*] 2. Táº£i mÃ´ hÃ¬nh gá»‘c: {BASE_MODEL_NAME}...")
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

    print("[*] 3. Gáº¯n LoRA Adapter Táº§ng 4 (r=16, alpha=32, dropout=0.05)...")
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
    print(f"[*] 4. Tiá»n xá»­ lÃ½ dá»¯ liá»‡u chuáº©n 4 Táº§ng tá»«: {dataset_path}...")
    with open(dataset_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    processed_samples = []
    for item in raw_data:
        # Há»— trá»£ Ä‘á»‹nh dáº¡ng messages chuáº©n cá»§a sft_context_aware_v2.json (Ä‘Ã£ cÃ³ <system_instruction>, <context>, <user_query>)
        if "messages" in item and isinstance(item["messages"], list) and len(item["messages"]) >= 3:
            processed_samples.append(
                {"text": tokenizer.apply_chat_template(item["messages"], tokenize=False, add_generation_prompt=False)}
            )
            continue

        intent_code = item.get("intent_code", "VPPL_4_ELEMENTS").strip()
        instruction = item.get("instruction", "").strip()
        input_text = item.get("input", "").strip()
        retrieved_ctx = item.get("context", "").strip()
        output_text = item.get("output", "").strip()
        barem_spec = INTENT_BAREM_SPECS.get(intent_code, INTENT_BAREM_SPECS["VPPL_4_ELEMENTS"])

        context_block = retrieved_ctx if retrieved_ctx else f"{barem_spec}\nTráº¡ng thÃ¡i hiá»‡u lá»±c: con_hieu_luc"
        query_block = f"{instruction}\n{input_text}".strip()
        query_block = (
            instruction
            if (not input_text or input_text == instruction)
            else f"{instruction}\n{input_text}".strip()
        )

        # TUYá»†T Äá»I KHÃ”NG train cáº·p (Question -> Answer) thiáº¿u <context> Ä‘á»ƒ chá»‘ng xung Ä‘á»™t tri thá»©c (NhÃ³m 1)
        user_xml_prompt = (
            f"<context>\n{context_block}\n</context>\n\n"
            f"<user_query>\n{query_block}\n</user_query>"
        )
        msg_context_aware = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_xml_prompt},
            {"role": "assistant", "content": output_text},
        ]
        processed_samples.append(
            {"text": tokenizer.apply_chat_template(msg_context_aware, tokenize=False, add_generation_prompt=False)}
        )

    def tokenize_fn(batch):
        out = tokenizer(batch["text"], truncation=True, max_length=MAX_SEQ_LENGTH, padding=False)
        out["labels"] = out["input_ids"].copy()
        return out

    dataset = Dataset.from_list(processed_samples).shuffle(seed=42)
    tokenized_dataset = dataset.map(tokenize_fn, batched=True, remove_columns=["text"])
    print(f"     -> ÄÃ£ táº¡o {len(tokenized_dataset)} máº«u huáº¥n luyá»‡n Context-Aware XML!")

    print("[*] 5. Báº¯t Ä‘áº§u huáº¥n luyá»‡n QLoRA Context-Aware (LR=1.5e-4, Epochs=3 chá»‘ng Catastrophic Forgetting)...")
    trainer = Trainer(
        model=model,
        train_dataset=tokenized_dataset,
        data_collator=DataCollatorForSeq2Seq(tokenizer, pad_to_multiple_of=8, return_tensors="pt", padding=True),
        args=TrainingArguments(
            per_device_train_batch_size=2,
            gradient_accumulation_steps=4,
            warmup_steps=10,
            num_train_epochs=3,
            learning_rate=1.5e-4,
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
    print(f"[SUCCESS] ÄÃ£ lÆ°u trá»ng sá»‘ LoRA Adapter táº¡i: {ADAPTER_DIR}")


if __name__ == "__main__":
    main()


