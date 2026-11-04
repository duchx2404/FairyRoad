@echo off
chcp 65001 >nul
title FairyRoad Dev - Tien Lo Man Man (Vite Dev Server)
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo [Loi] Chua cai Node.js. Hay tai tai https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo Dang cai thu vien lan dau ^(npm install^)...
  call npm install
  if errorlevel 1 (
    echo [Loi] npm install that bai.
    pause
    exit /b 1
  )
)

echo.
echo ========================================================
echo   FAIRYROAD CLIENT (VITE DEV)
echo   Dang khoi dong giao dien game...
echo   Dong cua so nay de tat Dev Server.
echo ========================================================
echo.

start "" cmd /c "timeout /t 3 >nul & start http://localhost:5173"
call npm run dev
pause
