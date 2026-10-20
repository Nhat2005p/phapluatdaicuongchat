import atexit
import json
import os
import subprocess
import sys
import time
from pathlib import Path
import urllib.request
import urllib.error

if sys.stdout and getattr(sys.stdout, 'encoding', '') and getattr(sys.stdout, 'encoding', '').lower() != 'utf-8':
    reconfigure = getattr(sys.stdout, 'reconfigure', None)
    if callable(reconfigure):
        try:
            reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

PROJECT_ROOT = Path(__file__).resolve().parents[1]
GGUF_MODEL_PATH = PROJECT_ROOT / "models" / "qwen2.5-3b-legal-vn-Q4_K_M.gguf"
LLAMA_SERVER_EXE = PROJECT_ROOT / "tools" / "llama" / "llama-server.exe"

SERVER_HOST = "127.0.0.1"
SERVER_PORT = 8088
SERVER_URL = f"http://{SERVER_HOST}:{SERVER_PORT}"

_server_process = None

def is_gguf_available() -> bool:
    return GGUF_MODEL_PATH.exists() and LLAMA_SERVER_EXE.exists()

def is_server_healthy() -> bool:
    try:
        req = urllib.request.Request(f"{SERVER_URL}/health", headers={"User-Agent": "LegalChatbot"})
        with urllib.request.urlopen(req, timeout=1.5) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            return data.get("status") == "ok"
    except urllib.error.HTTPError:
        # HTTP 503: server đang chạy nhưng đang nạp model vào RAM
        return False
    except Exception:
        return False

def start_llama_server():
    global _server_process
    if not is_gguf_available():
        return False

    if is_server_healthy():
        print("[llama-server] Đang hoạt động trên cổng", SERVER_PORT)
        return True

    print(f"[llama-server] Đang khởi động llama-server AVX2 với model: {GGUF_MODEL_PATH.name}...")
    cmd = [
        str(LLAMA_SERVER_EXE),
        "-m", str(GGUF_MODEL_PATH),
        "--host", SERVER_HOST,
        "--port", str(SERVER_PORT),
        "-c", "4096",
        "-t", "4",
        "--log-disable",
    ]

    creation_flags = 0
    if sys.platform == "win32":
        creation_flags = subprocess.CREATE_NO_WINDOW

    _server_process = subprocess.Popen(
        cmd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        creationflags=creation_flags,
    )

    # Đợi server load model xong (thường mất 5-10 giây trên CPU)
    for _ in range(40):
        time.sleep(0.5)
        if is_server_healthy():
            print("[llama-server] Đã sẵn sàng phục vụ!")
            return True

    print("[llama-server] Server đã khởi động nhưng chưa sẵn sàng hoàn toàn, sẽ thử kết nối khi có request.")
    return True

def stop_llama_server():
    global _server_process
    if _server_process and _server_process.poll() is None:
        print("[llama-server] Đang dừng tiến trình nền...")
        _server_process.terminate()
        try:
            _server_process.wait(timeout=3)
        except Exception:
            _server_process.kill()

atexit.register(stop_llama_server)

def stream_chat_gguf(messages, max_tokens=2048, temperature=0.2, top_p=0.85):
    """
    Gửi prompt tới llama-server qua OpenAI-compatible API và stream delta tokens.
    """
    payload = {
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "top_p": top_p,
        "stream": True,
    }
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{SERVER_URL}/v1/chat/completions",
        data=data_bytes,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    partial_text = ""
    with urllib.request.urlopen(req, timeout=60) as response:
        for raw_line in response:
            line = raw_line.decode("utf-8").strip()
            if not line:
                continue
            if line.startswith("data: "):
                chunk_str = line[6:].strip()
                if chunk_str == "[DONE]":
                    break
                try:
                    chunk = json.loads(chunk_str)
                    choices = chunk.get("choices", [])
                    if choices:
                        delta = choices[0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            partial_text += content
                            yield partial_text
                except Exception:
                    continue
