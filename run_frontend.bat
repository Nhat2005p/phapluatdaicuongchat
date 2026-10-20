@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

cd /d "%~dp0"
if not exist "frontend" (
    echo [ERROR] Không tìm thấy thư mục frontend.
    pause
    exit /b 1
)

cd frontend
if not exist "node_modules" (
    echo [*] Đang cài đặt dependencies...
    call npm install
)

echo [*] Khởi động Vite frontend server trên http://localhost:3000 ...
call npm run dev -- --port 3000
pause
