@echo off
reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Session Manager\Memory Management" /v PagingFiles /t REG_MULTI_SZ /d "D:\pagefile.sys 16384 24576" /f
echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo  [OK] Da thiet lap RAM ao 16GB - 24GB tren o D thanh cong!
    echo  Vui long RESTART (khoi dong lai) may tinh de ap dung.
    echo ========================================================
) else (
    echo ========================================================
    echo  [ERROR] That bai! Vui long chay voi quyen Administrator.
    echo ========================================================
)
echo.
pause
