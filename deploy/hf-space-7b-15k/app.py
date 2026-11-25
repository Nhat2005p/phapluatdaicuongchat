import importlib.util
import inspect
import os
import subprocess
import tarfile
import time
import urllib.request
from contextlib import asynccontextmanager
from pathlib import Path

import gradio as gr
import httpx
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from huggingface_hub import hf_hub_download, list_repo_files

try:
    import spaces

    _gpu_decorator = spaces.GPU
except ImportError:
    def _gpu_decorator(fn):
        return fn


# Chỉ bật hf_transfer khi môi trường thực sự đã cài gói này
if importlib.util.find_spec("hf_transfer") is not None:
    os.environ.setdefault("HF_HUB_ENABLE_HF_TRANSFER", "1")

REPO_ID = os.getenv("HF_MODEL_REPO", "kien1152005/7b-instruct-15k")
FILENAME = os.getenv("HF_MODEL_FILE", "models/qwen2.5-7b-instruct-q4_k_m.gguf")
LORA_FILENAME = os.getenv("HF_LORA_FILE", "models/vietlaw_lora_7b.gguf")
LLAMA_TGZ_URL = os.getenv(
    "LLAMA_TGZ_URL",
    "https://github.com/ggml-org/llama.cpp/releases/download/b12627/llama-b12627-bin-ubuntu-x64.tar.gz",
)
LLAMA_DIR = Path("/tmp/llama_bin")
LLAMA_PORT = 8088
LLAMA_URL = f"http://127.0.0.1:{LLAMA_PORT}"

# Tối ưu luồng & context trên HF Space (có thể override qua Space Variables)
_cpu_count = os.cpu_count() or 4
LLAMA_THREADS = os.getenv("LLAMA_THREADS", str(_cpu_count))
LLAMA_THREADS_BATCH = os.getenv("LLAMA_THREADS_BATCH", str(min(16, max(4, _cpu_count * 2))))
LLAMA_CTX = os.getenv("LLAMA_CTX", "2048")


def resolve_gguf_files(repo_id: str, preferred_base: str, preferred_lora: str) -> tuple[str, str | None]:
    try:
        files = list_repo_files(repo_id=repo_id)
        ggufs = [f for f in files if f.lower().endswith(".gguf")]

        if preferred_base in files:
            base_file = preferred_base
        else:
            non_lora_ggufs = [f for f in ggufs if "lora" not in f.lower()]
            base_file = non_lora_ggufs[0] if non_lora_ggufs else (ggufs[0] if ggufs else preferred_base)

        lora_file: str | None = None
        if preferred_lora:
            if preferred_lora in files:
                lora_file = preferred_lora
            else:
                lora_ggufs = [f for f in ggufs if "lora" in f.lower() and f != base_file]
                if lora_ggufs:
                    lora_file = lora_ggufs[0]

        return base_file, lora_file
    except Exception:
        return preferred_base, preferred_lora or None


def setup_llama_server() -> tuple[str, str]:
    LLAMA_DIR.mkdir(parents=True, exist_ok=True)
    found = list(LLAMA_DIR.rglob("llama-server"))
    if not found:
        tgz_path = LLAMA_DIR / "llama.tar.gz"
        print(f"Downloading prebuilt llama-server from {LLAMA_TGZ_URL}...")
        urllib.request.urlretrieve(LLAMA_TGZ_URL, tgz_path)
        with tarfile.open(tgz_path, "r:gz") as tar:
            tar.extractall(LLAMA_DIR, filter="data")
        tgz_path.unlink(missing_ok=True)
        found = list(LLAMA_DIR.rglob("llama-server"))
    if not found:
        raise RuntimeError("llama-server binary not found after extracting archive.")
    server_bin = str(found[0])
    os.chmod(server_bin, 0o755)
    lib_dir = str(found[0].parent)
    return server_bin, lib_dir


base_file, lora_file = resolve_gguf_files(REPO_ID, FILENAME, LORA_FILENAME)
print(f"Downloading base model {base_file} from {REPO_ID}...")
model_path = hf_hub_download(repo_id=REPO_ID, filename=base_file)

lora_path: str | None = None
if lora_file:
    print(f"Downloading LoRA adapter {lora_file} from {REPO_ID}...")
    lora_path = hf_hub_download(repo_id=REPO_ID, filename=lora_file)

server_bin, lib_dir = setup_llama_server()

env = os.environ.copy()
env["LD_LIBRARY_PATH"] = f"{lib_dir}:{env.get('LD_LIBRARY_PATH', '')}"

llama_cmd = [
    server_bin,
    "-m", model_path,
    "--host", "127.0.0.1",
    "--port", str(LLAMA_PORT),
    "-c", LLAMA_CTX,
    "-np", "1",
    "-t", LLAMA_THREADS,
    "-tb", LLAMA_THREADS_BATCH,
    "-b", "1024",
    "-ub", "512",
    "-fa", "on",
    "--cache-reuse", "64",
]
if lora_path:
    llama_cmd.extend(["--lora", lora_path])

print(f"Starting optimized llama-server ({server_bin}) t={LLAMA_THREADS}, tb={LLAMA_THREADS_BATCH}, c={LLAMA_CTX}...")
llama_proc = subprocess.Popen(llama_cmd, env=env)

for _ in range(90):
    if llama_proc.poll() is not None:
        raise RuntimeError(f"llama-server exited early with code {llama_proc.returncode}")
    try:
        r = httpx.get(f"{LLAMA_URL}/health", timeout=2.0)
        if r.status_code == 200 and r.json().get("status") == "ok":
            print("llama-server is ready!")
            break
    except Exception:
        pass
    time.sleep(1)

http_client: httpx.AsyncClient | None = None


@asynccontextmanager
async def lifespan(_app: FastAPI):
    global http_client
    http_client = httpx.AsyncClient(
        base_url=LLAMA_URL,
        timeout=httpx.Timeout(180.0, connect=5.0),
        limits=httpx.Limits(max_connections=16, max_keepalive_connections=8),
    )
    try:
        yield
    finally:
        await http_client.aclose()
        if llama_proc.poll() is None:
            llama_proc.terminate()


app = FastAPI(title="Qwen2.5-7B-VietLaw-LoRA OpenAI-Compatible API", lifespan=lifespan)


@app.get("/health")
async def health():
    if http_client is None:
        return JSONResponse(status_code=503, content={"status": "loading"})
    try:
        r = await http_client.get("/health", timeout=3.0)
        return JSONResponse(status_code=r.status_code, content=r.json())
    except Exception:
        return JSONResponse(status_code=503, content={"status": "loading"})


@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    if http_client is None:
        return JSONResponse(status_code=503, content={"error": "Server is starting"})
    body = await request.json()
    r = await http_client.post("/v1/chat/completions", json=body)
    return JSONResponse(status_code=r.status_code, content=r.json())


@_gpu_decorator
def dummy_gpu(x: str):
    return x


def chat_ui(message, history):
    messages = [{"role": "system", "content": "Bạn là trợ lý Pháp luật đại cương Việt Nam."}]
    for item in history or []:
        if isinstance(item, dict) and "role" in item and "content" in item:
            messages.append({"role": str(item["role"]), "content": str(item["content"])})
        elif isinstance(item, (list, tuple)) and len(item) == 2:
            if item[0]:
                messages.append({"role": "user", "content": str(item[0])})
            if item[1]:
                messages.append({"role": "assistant", "content": str(item[1])})
    messages.append({"role": "user", "content": message})

    payload = {
        "model": "qwen2.5-7b-vietlaw-lora",
        "messages": messages,
        "temperature": 0.2,
        "max_tokens": 450,
    }
    try:
        r = httpx.post(f"{LLAMA_URL}/v1/chat/completions", json=payload, timeout=180.0)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]
    except Exception as exc:
        return f"Lỗi khi gọi mô hình: {exc}"


demo = gr.ChatInterface(
    fn=chat_ui,
    title="Qwen2.5-7B-VietLaw-LoRA API Server",
    description="API Endpoints: GET /health | POST /v1/chat/completions",
)

_mount_kwargs: dict[str, object] = {"path": "/"}
if "ssr_mode" in inspect.signature(gr.mount_gradio_app).parameters:
    _mount_kwargs["ssr_mode"] = False

app = gr.mount_gradio_app(app, demo, **_mount_kwargs)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "7860")))