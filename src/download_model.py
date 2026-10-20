from pathlib import Path
from huggingface_hub import snapshot_download
from config import MODEL_ID, MODEL_DIR

MODEL_DIR.mkdir(parents=True, exist_ok=True)

print("Model:", MODEL_ID)
print("Download vào:", MODEL_DIR)
print("Bắt đầu tải model từ Hugging Face...")

snapshot_download(
    repo_id=MODEL_ID,
    local_dir=str(MODEL_DIR),
    ignore_patterns=[
        "*.h5",
        "*.msgpack",
        "*.onnx",
        "*.tflite",
    ],
)

print("\nHoàn tất.")
print("Model local:", MODEL_DIR.resolve())
