import os
import time
import uuid
import gradio as gr
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from huggingface_hub import hf_hub_download
from llama_cpp import Llama

REPO_ID = os.getenv("HF_MODEL_REPO", "pthanh635/qwen2.5-7b-legal-vn-gguf")
FILENAME = os.getenv("HF_MODEL_FILE", "qwen2.5-7b-legal-vn-Q4_K_M.gguf")

print(f"Downloading {FILENAME} from {REPO_ID}...")
model_path = hf_hub_download(repo_id=REPO_ID, filename=FILENAME)
print(f"Loading model from {model_path}...")

llm = Llama(
    model_path=model_path,
    n_ctx=4096,
    n_threads=2,
    verbose=False,
)
print("Model loaded successfully!")

app = FastAPI(title="Qwen2.5-7B-Legal-VN OpenAI-Compatible API")


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatCompletionRequest(BaseModel):
    model: Optional[str] = "qwen2.5-7b-legal-vn"
    messages: List[ChatMessage]
    temperature: Optional[float] = 0.2
    top_p: Optional[float] = 0.9
    max_tokens: Optional[int] = 768
    repeat_penalty: Optional[float] = 1.12


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/v1/chat/completions")
def chat_completions(req: ChatCompletionRequest):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]
    result = llm.create_chat_completion(
        messages=messages,
        temperature=req.temperature if req.temperature is not None else 0.2,
        top_p=req.top_p if req.top_p is not None else 0.9,
        max_tokens=req.max_tokens if req.max_tokens is not None else 768,
        repeat_penalty=req.repeat_penalty if req.repeat_penalty is not None else 1.12,
    )
    if "id" not in result:
        result["id"] = f"chatcmpl-{uuid.uuid4().hex[:12]}"
    if "created" not in result:
        result["created"] = int(time.time())
    return result


def chat_ui(message, history):
    msgs = [{"role": "system", "content": "Bạn là trợ lý Pháp luật đại cương Việt Nam."}]
    msgs.append({"role": "user", "content": message})
    res = llm.create_chat_completion(messages=msgs, temperature=0.2, max_tokens=512)
    return res["choices"][0]["message"]["content"]


demo = gr.ChatInterface(
    fn=chat_ui,
    title="Qwen2.5-7B-Legal-VN API Server",
    description="API Endpoints: GET /health | POST /v1/chat/completions",
)

app = gr.mount_gradio_app(app, demo, path="/")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=7860)
