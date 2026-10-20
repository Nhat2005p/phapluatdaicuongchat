@echo off
setlocal

echo ==========================================
echo  Legal Chatbot Local - Windows Setup
echo ==========================================

where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Khong tim thay Python trong PATH.
  echo Cai Python 3.10 hoac 3.11 truoc.
  pause
  exit /b 1
)

if not exist .venv (
  echo [1/4] Tao virtual environment...
  python -m venv .venv
)

echo [2/4] Kich hoat virtual environment...
call .venv\Scripts\activate.bat

echo [3/4] Nang cap pip...
python -m pip install --upgrade pip

echo [4/4] Cai dependencies...
pip install -r requirements.txt

if not exist .env (
  copy .env.example .env >nul
)

echo.
echo Setup xong.
echo Tiep theo:
echo   1. python src\check_env.py
echo   2. python src\download_model.py
echo   3. python src\chat_cli.py
echo Hoac:
echo   python app.py
echo.
pause
