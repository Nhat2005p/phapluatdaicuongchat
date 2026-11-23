@echo off
setlocal enabledelayedexpansion
title VietLawAssist - Local LLM Server (Qwen2.5-7B)
cd /d "%~dp0"

echo ===================================================================
echo VietLawAssist: Khoi dong Local LLM Server (Qwen2.5-7B)
echo Model: models\qwen2.5-7b-legal-vn-Q4_K_M.gguf
echo Server: http://127.0.0.1:8088/v1
echo ===================================================================

if not exist "models\qwen2.5-7b-legal-vn-Q4_K_M.gguf" (
    echo [ERROR] Khong tim thay file models\qwen2.5-7b-legal-vn-Q4_K_M.gguf!
    pause
    exit /b 1
)

if not exist "tools\llama\llama-server.exe" (
    echo [ERROR] Khong tim thay tools\llama\llama-server.exe!
    pause
    exit /b 1
)

taskkill /F /IM llama-server.exe >nul 2>&1

echo [INFO] Dang khoi chay llama-server GPU (-ngl 99) + FlashAttention tren cong 8088...
tools\llama\llama-server.exe -m models\qwen2.5-7b-legal-vn-Q4_K_M.gguf -ngl 99 --host 127.0.0.1 --port 8088 -c 4096 -np 1 -t 6 -tb 12 -b 1024 -ub 512 -fa on --cache-reuse 64
pause
