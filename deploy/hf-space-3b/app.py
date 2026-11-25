import os
import time
import tarfile
import subprocess
import urllib.request
from contextlib import asynccontextmanager
from pathlib import Path
import httpx
import gradio as gr
import spaces
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from huggingface_hub import hf_hub_download, list_repo_files

os.environ.setdefault("HF_HUB_ENABLE_HF_TRANSFER", "1")

REPO_ID = os.getenv("HF_MODEL_REPO", "pthanh635/chatbot3b")
FILENAME = os.getenv("HF_MODEL_FILE", "qwen2.5-3b-legal-vn-Q5_K_M.gguf")
LLAMA_TGZ_URL = "https://github.com/ggml-org/llama.cpp/releases/download/b12627/llama-b12627-bin-ubuntu-x64.tar.gz"
LLAMA_DIR = Path("/tmp/llama_bin")
LLAMA_PORT = 8088
LLAMA_URL = f"http://127.0.0.1:{LLAMA_PORT}"

# Tối ưu luồng & context trên HF Space ZeroGPU CPU
LLAMA_THREADS = os.getenv("LLAMA_THREADS", "8")
LLAMA_THREADS_BATCH = os.getenv("LLAMA_THREADS_BATCH", "16")
LLAMA_CTX = os.getenv("LLAMA_CTX", "2048")


def resolve_gguf_filename(repo_id: str, preferred: str) -> str:
    try:
        files = list_repo_files(repo_id=repo_id)
        if preferred in files:
            return preferred
        ggufs = [f for f in files if f.lower().endswith(".gguf")]
        if ggufs:
            return ggufs[0]
    except Exception:
        pass
    return preferred


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
    server_bin = str(found[0])
    os.chmod(server_bin, 0o755)
    lib_dir = str(found[0].parent)
    return server_bin, lib_dir


target_file = resolve_gguf_filename(REPO_ID, FILENAME)
print(f"Downloading {target_file} from {REPO_ID}...")
model_path = hf_hub_download(repo_id=REPO_ID, filename=target_file)
server_bin, lib_dir = setup_llama_server()

env = os.environ.copy()
env["LD_LIBRARY_PATH"] = f"{lib_dir}:{env.get('LD_LIBRARY_PATH', '')}"

print(f"Starting optimized llama-server ({server_bin}) for Qwen2.5-3B (t={LLAMA_THREADS}, tb={LLAMA_THREADS_BATCH}, c={LLAMA_CTX})...")
llama_proc = subprocess.Popen(
    [
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
    ],
    env=env,
)

for _ in range(60):
    try:
        r = httpx.get(f"{LLAMA_URL}/health", timeout=2.0)
        if r.status_code == 200 and r.json().get("status") == "ok":
            print("llama-server (Qwen2.5-3B) is ready!")
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


app = FastAPI(title="Qwen2.5-3B-Legal-VN OpenAI-Compatible API", lifespan=lifespan)


@app.get("/health")
async def health():
    try:
        r = await http_client.get("/health", timeout=3.0)
        return JSONResponse(status_code=r.status_code, content=r.json())
    except Exception:
        return JSONResponse(status_code=503, content={"status": "loading"})


@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    body = await request.json()
    r = await http_client.post("/v1/chat/completions", json=body)
    return JSONResponse(status_code=r.status_code, content=r.json())


@spaces.GPU
def dummy_gpu(x: str):
    return x


def chat_ui(message, history):
    payload = {
        "model": "qwen2.5-3b-legal-vn",
        "messages": [
            {"role": "system", "content": "Bạn là trợ lý Pháp luật đại cương Việt Nam."},
            {"role": "user", "content": message},
        ],
        "temperature": 0.2,
        "max_tokens": 450,
    }
    r = httpx.post(f"{LLAMA_URL}/v1/chat/completions", json=payload, timeout=180.0)
    return r.json()["choices"][0]["message"]["content"]


demo = gr.ChatInterface(
    fn=chat_ui,
    title="Qwen2.5-3B-Legal-VN API Server",
    description="API Endpoints: GET /health | POST /v1/chat/completions",
)

app = gr.mount_gradio_app(app, demo, path="/", ssr_mode=False)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "7860")))
