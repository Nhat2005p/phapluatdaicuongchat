# VietLawAssist - Local LLM Server (Qwen2.5-3B)
$Host.UI.RawUI.WindowTitle = "VietLawAssist - Local LLM Server (Qwen2.5-3B)"

$rootDir = $PSScriptRoot
Set-Location $rootDir

Write-Host "===================================================================" -ForegroundColor Cyan
Write-Host "VietLawAssist: Khởi động Local LLM Inference Engine" -ForegroundColor Cyan
Write-Host "Model: models\qwen2.5-3b-legal-vn-Q4_K_M.gguf" -ForegroundColor Yellow
Write-Host "Server: http://127.0.0.1:8088/v1" -ForegroundColor Green
Write-Host "===================================================================" -ForegroundColor Cyan

$modelPath = Join-Path $rootDir "models\qwen2.5-3b-legal-vn-Q4_K_M.gguf"
$llamaExe = Join-Path $rootDir "tools\llama\llama-server.exe"
$loraPath = Join-Path $rootDir "models\vietlaw_lora_adapter.gguf"

if (-not (Test-Path $modelPath)) {
    Write-Host "[ERROR] Không tìm thấy file: $modelPath" -ForegroundColor Red
    pause
    exit 1
}

if (-not (Test-Path $llamaExe)) {
    Write-Host "[ERROR] Không tìm thấy file: $llamaExe" -ForegroundColor Red
    pause
    exit 1
}

# Giải phóng cổng 8088 nếu đã có tiến trình llama-server chạy ngầm trước đó
Get-Process -Name "llama-server" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 500

if (Test-Path $loraPath) {
    Write-Host "[INFO] Nạp kèm LoRA adapter: $loraPath" -ForegroundColor Magenta
    & $llamaExe -m $modelPath --lora $loraPath --host 127.0.0.1 --port 8088 -c 4096 -np 1 -t 6
} else {
    Write-Host "[INFO] Khởi chạy mô hình trên cổng 8088..." -ForegroundColor Green
    & $llamaExe -m $modelPath --host 127.0.0.1 --port 8088 -c 4096 -np 1 -t 6
}

