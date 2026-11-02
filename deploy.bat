@echo off
chcp 65001 >nul
title FairyRoad - Deploy len GitHub Pages
cd /d "%~dp0"

rem Build ban web roi day rieng thu muc dist len nhanh gh-pages.
rem Khong commit/push nhanh main: ma nguon van do ban tu quan ly.

where node >nul 2>nul
if errorlevel 1 (
  echo [Loi] Chua cai Node.js. Tai tai https://nodejs.org roi chay lai.
  goto :fail
)
where git >nul 2>nul
if errorlevel 1 (
  echo [Loi] Chua cai Git.
  goto :fail
)

if not exist "node_modules" (
  echo Dang cai thu vien lan dau ^(npm install^)...
  call npm install
  if errorlevel 1 (
    echo [Loi] npm install that bai.
    goto :fail
  )
)

echo.
echo [1/2] Dang build ^(kiem tra TypeScript + vite build^)...
call npm run build
if errorlevel 1 (
  echo [Loi] Build that bai - chua deploy gi ca.
  goto :fail
)

echo.
echo [2/2] Dang day dist len nhanh gh-pages...
powershell -NoProfile -ExecutionPolicy Bypass -File "tools\publish-web.ps1"
if errorlevel 1 (
  echo [Loi] Day len gh-pages that bai ^(kiem tra mang / quyen push GitHub^).
  goto :fail
)

echo.
echo  Xong. GitHub Pages can 1-2 phut de cap nhat:
echo  https://duchx2404.github.io/FairyRoad/
echo.
git status --porcelain | findstr . >nul
if not errorlevel 1 echo  Luu y: con thay doi chua commit o nhanh main ^(ban web van da cap nhat^).
pause
exit /b 0

:fail
echo.
pause
exit /b 1
