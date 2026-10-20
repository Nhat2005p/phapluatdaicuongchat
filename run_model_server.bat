@echo off
chcp 65001 >nul
title VietLawAssist - Local LLM Server (Qwen2.5-3B)
cd /d "%~dp0"

echo ===================================================================
echo 🤖 VietLawAssist: Khởi động Local LLM Inference Engine
echo 📦 Model: models\qwen2.5-3b-legal-vn-Q4_K_M.gguf (Qwen2.5-3B LoRA)
echo 🚀 Server: http://127.0.0.1:8088/v1
echo ===================================================================

if not exist "models\qwen2.5-3b-legal-vn-Q4_K_M.gguf" (
    echo [ERROR] Không tìm thấy file models\qwen2.5-3b-legal-vn-Q4_K_M.gguf!
    pause
    exit /b 1
)

if not exist "tools\llama\llama-server.exe" (
    echo [ERROR] Không tìm thấy tools\llama\llama-server.exe!
    pause
    exit /b 1
)

if exist "models\vietlaw_lora_adapter.gguf" (
    echo 🔗 Đang nạp kèm trọng số Fine-tune Tầng 4: models\vietlaw_lora_adapter.gguf
    tools\llama\llama-server.exe -m models\qwen2.5-3b-legal-vn-Q4_K_M.gguf --lora models\vietlaw_lora_adapter.gguf --host 127.0.0.1 --port 8088 -c 2048 -t 6
) else (
    tools\llama\llama-server.exe -m models\qwen2.5-3b-legal-vn-Q4_K_M.gguf --host 127.0.0.1 --port 8088 -c 2048 -t 6
)
pause
