import os
import sys
import subprocess
from pathlib import Path
if sys.stdout and getattr(sys.stdout, 'encoding', '') and getattr(sys.stdout, 'encoding', '').lower() != 'utf-8':
    reconfigure = getattr(sys.stdout, 'reconfigure', None)
    if callable(reconfigure):
        try:
            reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

PROJECT_ROOT = Path(__file__).resolve().parents[1]
HF_MODEL_DIR = PROJECT_ROOT / "models" / "qwen2.5-3b-legal-vn"
F16_GGUF = PROJECT_ROOT / "models" / "qwen2.5-3b-legal-vn-f16.gguf"
FINAL_GGUF = PROJECT_ROOT / "models" / "qwen2.5-3b-legal-vn-Q4_K_M.gguf"
CONVERT_SCRIPT = PROJECT_ROOT / "tools" / "llama-src" / "convert_hf_to_gguf.py"
QUANTIZE_EXE = PROJECT_ROOT / "tools" / "llama" / "llama-quantize.exe"
PYTHON_EXE = PROJECT_ROOT / ".venv" / "Scripts" / "python.exe"

if not PYTHON_EXE.exists():
    PYTHON_EXE = Path(sys.executable)

def run():
    print("==========================================================")
    print(" BẮT ĐẦU CHUYỂN ĐỔI MODEL SANG GGUF 4-BIT (Q4_K_M)")
    print("==========================================================")

    if not HF_MODEL_DIR.exists():
        print(f"[LỖI] Thư mục model không tồn tại: {HF_MODEL_DIR}")
        sys.exit(1)

    if FINAL_GGUF.exists() and FINAL_GGUF.stat().st_size > 1024 * 1024 * 500:
        print(f"[THÀNH CÔNG] File GGUF 4-bit đã tồn tại sẵn: {FINAL_GGUF} ({FINAL_GGUF.stat().st_size / (1024**3):.2f} GB)")
        return

    # Bước 1: Convert HF sang F16 GGUF
    print(f"\n[Bước 1/2] Đang chuyển đổi Safetensors -> F16 GGUF...")
    cmd1 = [
        str(PYTHON_EXE),
        str(CONVERT_SCRIPT),
        str(HF_MODEL_DIR),
        "--outfile", str(F16_GGUF),
        "--outtype", "f16"
    ]
    res1 = subprocess.run(cmd1)
    if res1.returncode != 0:
        print("[LỖI] Chuyển đổi sang F16 GGUF thất bại!")
        sys.exit(res1.returncode)

    print(f"Đã tạo file F16 GGUF: {F16_GGUF.stat().st_size / (1024**3):.2f} GB")

    # Bước 2: Quantize F16 GGUF sang Q4_K_M GGUF
    print(f"\n[Bước 2/2] Đang nén lượng tử hóa (Quantize) sang 4-bit (Q4_K_M)...")
    cmd2 = [
        str(QUANTIZE_EXE),
        str(F16_GGUF),
        str(FINAL_GGUF),
        "Q4_K_M",
        "4"
    ]
    res2 = subprocess.run(cmd2)
    if res2.returncode != 0:
        print("[LỖI] Quantize sang 4-bit thất bại!")
        sys.exit(res2.returncode)

    # Dọn dẹp file F16 trung gian
    if F16_GGUF.exists():
        print(f"Xóa file F16 trung gian để tiết kiệm ổ đĩa...")
        F16_GGUF.unlink()

    print("\n==========================================================")
    print(f" [HOÀN TẤT] File GGUF 4-bit siêu nhẹ: {FINAL_GGUF}")
    print(f" Dung lượng: {FINAL_GGUF.stat().st_size / (1024**3):.2f} GB")
    print("==========================================================")

if __name__ == "__main__":
    run()
