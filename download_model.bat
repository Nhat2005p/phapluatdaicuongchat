@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo  VietLawAssist - Kiem tra Model GGUF Local
echo  Chi su dung duy nhat: models\qwen2.5-7b-legal-vn-Q4_K_M.gguf
echo ============================================================

if not exist "models" mkdir "models"

if exist "models\qwen2.5-7b-legal-vn-Q4_K_M.gguf" (
  echo [OK] Model da san sang tai: %cd%\models\qwen2.5-7b-legal-vn-Q4_K_M.gguf
  echo Khong can tai them model khac.
) else (
  echo [THIEU] Khong tim thay file: models\qwen2.5-7b-legal-vn-Q4_K_M.gguf
  echo Vui long copy file qwen2.5-7b-legal-vn-Q4_K_M.gguf vao thu muc:
  echo   %cd%\models\
)

echo.
pause
