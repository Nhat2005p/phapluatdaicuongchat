@echo off
chcp 65001 >nul
cd /d "%~dp0\backend"
echo ========================================================
echo Đang khởi động VietLawAssist Node.js Backend Server...
echo API Base: http://127.0.0.1:8000/api/v1
echo ========================================================
npm run dev
pause
