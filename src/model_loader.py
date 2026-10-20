import os
import sys
import json
import psutil  # type: ignore
import torch

if sys.stdout and getattr(sys.stdout, 'encoding', '') and getattr(sys.stdout, 'encoding', '').lower() != 'utf-8':
    reconfigure = getattr(sys.stdout, 'reconfigure', None)
    if callable(reconfigure):
        try:
            reconfigure(encoding='utf-8')
        except Exception:
            pass
from transformers import (
    AutoConfig,
    AutoTokenizer,
    AutoModelForCausalLM,
    BitsAndBytesConfig,
)
try:
    from config import MODEL_DIR, MODEL_ID, CPU_THREADS
except ModuleNotFoundError:
    from src.config import MODEL_DIR, MODEL_ID, CPU_THREADS

def _source():
    if MODEL_DIR.exists() and any(MODEL_DIR.iterdir()):
        return str(MODEL_DIR)
    return MODEL_ID

def load_tokenizer_and_model():
    source = _source()
    print(f"Đang load model từ: {source}")

    tokenizer = AutoTokenizer.from_pretrained(
        source,
        trust_remote_code=True,
        use_fast=True,
        fix_mistral_regex=True,
    )

    config = AutoConfig.from_pretrained(source, trust_remote_code=True)
    quant_config = getattr(config, "quantization_config", None)

    common = dict(
        device_map="auto",
        low_cpu_mem_usage=True,
        trust_remote_code=True,
    )

    if torch.cuda.is_available():
        # Nếu repository đã chứa cấu hình quantization, Transformers sẽ dùng nó.
        if quant_config:
            print("Phát hiện quantization_config có sẵn trong model.")
            model = AutoModelForCausalLM.from_pretrained(
                source,
                dtype="auto",
                **common,
            )
        else:
            # Fallback: tự quantize model về 4-bit lúc load để giảm VRAM.
            print("Không thấy quantization_config. Sẽ load bằng bitsandbytes 4-bit.")
            bnb_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
                bnb_4bit_compute_dtype=torch.float16,
            )
            model = AutoModelForCausalLM.from_pretrained(
                source,
                quantization_config=bnb_config,
                dtype=torch.float16,
                **common,
            )
    else:
        num_threads = CPU_THREADS if CPU_THREADS > 0 else (psutil.cpu_count(logical=False) or os.cpu_count() or 4)
        torch.set_num_threads(num_threads)
        print(f"Không có CUDA: load CPU (bfloat16). Đã thiết lập {torch.get_num_threads()} luồng CPU. Quá trình này có thể mất một vài phút...")
        model = AutoModelForCausalLM.from_pretrained(
            source,
            dtype=torch.bfloat16,
            device_map={"": "cpu"},
            low_cpu_mem_usage=True,
            trust_remote_code=True,
        )

    model.eval()
    return tokenizer, model
