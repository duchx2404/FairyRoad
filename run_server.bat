@echo off
chcp 65001 >nul
title FairyRoad Server - Cloud & Multiplayer (localhost:3001)
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
echo   FAIRYROAD CLOUD ^& MULTIPLAYER SERVER
echo   Dia chi: http://localhost:3001
echo   Dang chay he thong Tai khoan, Gemini AI Proxy ^& Van Gioi...
echo   Dong cua so nay de tat Server.
echo ========================================================
echo.

call npm run server
pause
