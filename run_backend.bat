@echo off
setlocal enabledelayedexpansion
title VietLawAssist - Node.js Backend Server
cd /d "%~dp0\backend"

echo ========================================================
echo Dang don dep cac tien trinh cu va khoi dong VietLawAssist Backend...
taskkill /F /IM llama-server.exe >nul 2>&1
echo API Base: http://127.0.0.1:8000/api/v1
echo ========================================================
call npm run dev
pause
