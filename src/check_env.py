import platform
import sys
import psutil  # type: ignore
import torch

if sys.stdout and getattr(sys.stdout, 'encoding', '') and getattr(sys.stdout, 'encoding', '').lower() != 'utf-8':
    reconfigure = getattr(sys.stdout, 'reconfigure', None)
    if callable(reconfigure):
        try:
            reconfigure(encoding='utf-8')
        except Exception:
            pass

def gb(x):
    return x / (1024 ** 3)

print("=== KIỂM TRA MÔI TRƯỜNG ===")
print("Python:", sys.version.split()[0])
print("OS:", platform.platform())
print(f"RAM tổng: {gb(psutil.virtual_memory().total):.1f} GB")
print("PyTorch:", torch.__version__)
print("CUDA available:", torch.cuda.is_available())

if torch.cuda.is_available():
    print("GPU:", torch.cuda.get_device_name(0))
    print(f"VRAM: {gb(torch.cuda.get_device_properties(0).total_memory):.1f} GB")
    try:
        print("CUDA runtime (PyTorch):", torch.version.cuda)
    except Exception:
        pass

    vram = gb(torch.cuda.get_device_properties(0).total_memory)
    if vram >= 8:
        print("\n[OK] Cấu hình phù hợp để thử model 7B 4-bit.")
    elif vram >= 6:
        print("\n[OK/CAUTION] Có thể thử model 7B 4-bit, nhưng nên giữ context ngắn.")
    else:
        print("\n[CAUTION] VRAM dưới 6 GB. Nên đổi .env sang model 3B.")
else:
    print("\n[WARNING] Không phát hiện NVIDIA CUDA.")
    print("Model 7B chạy CPU sẽ rất chậm và tốn RAM.")
    print("Nếu chỉ có CPU, nên đổi .env sang bản 3B hoặc dùng GGUF/llama.cpp ở bước sau.")
