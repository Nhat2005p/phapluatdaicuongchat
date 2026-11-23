from pathlib import Path
import sys

if sys.stdout and getattr(sys.stdout, "encoding", "") and getattr(sys.stdout, "encoding", "").lower() != "utf-8":
    reconfigure = getattr(sys.stdout, "reconfigure", None)
    if callable(reconfigure):
        try:
            reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

PROJECT_ROOT = Path(__file__).resolve().parents[1]
GGUF_MODEL_PATH = PROJECT_ROOT / "models" / "qwen2.5-7b-legal-vn-Q4_K_M.gguf"
GGUF_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)

if GGUF_MODEL_PATH.exists():
    size_gb = GGUF_MODEL_PATH.stat().st_size / (1024 ** 3)
    print(f"[OK] Đã tìm thấy model duy nhất của dự án: {GGUF_MODEL_PATH} ({size_gb:.2f} GB)")
    print("Không tải thêm bất kỳ model nào khác.")
else:
    print(f"[THIẾU] Không tìm thấy file model tại: {GGUF_MODEL_PATH}")
    print("Vui lòng đặt file qwen2.5-7b-legal-vn-Q4_K_M.gguf vào thư mục models/ của dự án.")
    sys.exit(1)
