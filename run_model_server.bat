@echo off
setlocal enabledelayedexpansion
title VietLawAssist - Local LLM Server (Qwen2.5-3B)
cd /d "%~dp0"

echo ===================================================================
echo VietLawAssist: Khoi dong Local LLM Server (Qwen2.5-3B)
echo Model: models\qwen2.5-3b-legal-vn-Q4_K_M.gguf
echo Server: http://127.0.0.1:8088/v1
echo ===================================================================

if not exist "models\qwen2.5-3b-legal-vn-Q4_K_M.gguf" (
    echo [ERROR] Khong tim thay file models\qwen2.5-3b-legal-vn-Q4_K_M.gguf!
    pause
    exit /b 1
)

if not exist "tools\llama\llama-server.exe" (
    echo [ERROR] Khong tim thay tools\llama\llama-server.exe!
    pause
    exit /b 1
)

if exist "models\vietlaw_lora_adapter.gguf" goto :with_lora

:no_lora
echo [INFO] Dang khoi chay llama-server tren cong 8088...
tools\llama\llama-server.exe -m models\qwen2.5-3b-legal-vn-Q4_K_M.gguf --host 127.0.0.1 --port 8088 -c 1024 -np 1 -t 6
goto :end

:with_lora
echo [INFO] Nap kem LoRA adapter: models\vietlaw_lora_adapter.gguf
tools\llama\llama-server.exe -m models\qwen2.5-3b-legal-vn-Q4_K_M.gguf --lora models\vietlaw_lora_adapter.gguf --host 127.0.0.1 --port 8088 -c 1024 -np 1 -t 6
goto :end

:end
pause
