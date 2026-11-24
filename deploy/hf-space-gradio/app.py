import os
import glob
import time
import tarfile
import subprocess
import urllib.request
from pathlib import Path
import httpx
import gradio as gr
import spaces
import uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from huggingface_hub import hf_hub_download

REPO_ID = os.getenv("HF_MODEL_REPO", "pthanh635/qwen2.5-7b-legal-vn-gguf")
FILENAME = os.getenv("HF_MODEL_FILE", "qwen2.5-7b-legal-vn-Q4_K_M.gguf")
LLAMA_TGZ_URL = "https://github.com/ggml-org/llama.cpp/releases/download/b12627/llama-b12627-bin-ubuntu-x64.tar.gz"
LLAMA_DIR = Path("/tmp/llama_bin")
LLAMA_PORT = 8088
LLAMA_URL = f"http://127.0.0.1:{LLAMA_PORT}"


def setup_llama_server() -> tuple[str, str]:
    LLAMA_DIR.mkdir(parents=True, exist_ok=True)
    found = list(LLAMA_DIR.rglob("llama-server"))
    if not found:
        tgz_path = LLAMA_DIR / "llama.tar.gz"
        print(f"Downloading prebuilt llama-server from {LLAMA_TGZ_URL}...")
        urllib.request.urlretrieve(LLAMA_TGZ_URL, tgz_path)
        with tarfile.open(tgz_path, "r:gz") as tar:
            tar.extractall(LLAMA_DIR)
        tgz_path.unlink(missing_ok=True)
        found = list(LLAMA_DIR.rglob("llama-server"))
    server_bin = str(found[0])
    os.chmod(server_bin, 0o755)
    lib_dir = str(found[0].parent)
    return server_bin, lib_dir


print(f"Downloading {FILENAME} from {REPO_ID}...")
model_path = hf_hub_download(repo_id=REPO_ID, filename=FILENAME)
server_bin, lib_dir = setup_llama_server()

env = os.environ.copy()
env["LD_LIBRARY_PATH"] = f"{lib_dir}:{env.get('LD_LIBRARY_PATH', '')}"

print(f"Starting llama-server ({server_bin}) with {model_path}...")
llama_proc = subprocess.Popen(
    [
        server_bin,
        "-m", model_path,
        "--host", "127.0.0.1",
        "--port", str(LLAMA_PORT),
        "-c", "4096",
        "-t", "4",
        "-np", "1",
        "--cache-reuse", "64",
    ],
    env=env,
)

for _ in range(60):
    try:
        r = httpx.get(f"{LLAMA_URL}/health", timeout=2.0)
        if r.status_code == 200 and r.json().get("status") == "ok":
            print("llama-server is ready!")
            break
    except Exception:
        pass
    time.sleep(1)

app = FastAPI(title="Qwen2.5-7B-Legal-VN OpenAI-Compatible API")


@app.get("/health")
async def health():
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            r = await client.get(f"{LLAMA_URL}/health")
            return JSONResponse(status_code=r.status_code, content=r.json())
    except Exception:
        return JSONResponse(status_code=503, content={"status": "loading"})


@app.post("/v1/chat/completions")
async def chat_completions(request: Request):
    body = await request.json()
    async with httpx.AsyncClient(timeout=180.0) as client:
        r = await client.post(f"{LLAMA_URL}/v1/chat/completions", json=body)
        return JSONResponse(status_code=r.status_code, content=r.json())


@spaces.GPU
def dummy_gpu(x: str):
    return x


def chat_ui(message, history):
    payload = {
        "model": "qwen2.5-7b-legal-vn",
        "messages": [
            {"role": "system", "content": "Bạn là trợ lý Pháp luật đại cương Việt Nam."},
            {"role": "user", "content": message},
        ],
        "temperature": 0.2,
        "max_tokens": 512,
    }
    r = httpx.post(f"{LLAMA_URL}/v1/chat/completions", json=payload, timeout=180.0)
    return r.json()["choices"][0]["message"]["content"]


demo = gr.ChatInterface(
    fn=chat_ui,
    title="Qwen2.5-7B-Legal-VN API Server",
    description="API Endpoints: GET /health | POST /v1/chat/completions",
)

app = gr.mount_gradio_app(app, demo, path="/", ssr_mode=False)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "7860")))
