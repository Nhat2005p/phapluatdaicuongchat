FROM ghcr.io/ggml-org/llama.cpp:server

WORKDIR /app

# Cài curl để tải model GGUF từ Hugging Face Model Repo (hoặc dùng file local nếu đã copy)
RUN apt-get update && apt-get install -y --no-install-recommends curl ca-certificates && rm -rf /var/lib/apt/lists/*

# Biến môi trường trỏ tới link tải trực tiếp file qwen2.5-7b-legal-vn-Q4_K_M.gguf trên Hugging Face
# Ví dụ: https://huggingface.co/<username>/<repo>/resolve/main/qwen2.5-7b-legal-vn-Q4_K_M.gguf
ENV MODEL_URL=""
ENV MODEL_PATH="/app/qwen2.5-7b-legal-vn-Q4_K_M.gguf"

EXPOSE 7860

ENTRYPOINT ["/bin/sh", "-c", "if [ ! -f \"$MODEL_PATH\" ]; then echo 'Downloading GGUF model...' && curl -fSL \"$MODEL_URL\" -o \"$MODEL_PATH\"; fi && exec /app/llama-server -m \"$MODEL_PATH\" --host 0.0.0.0 --port 7860 -c 4096 -t 2 -np 1 --cache-reuse 64"]
