@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1 || (echo Can cai Node.js 22: https://nodejs.org/ & pause & exit /b 1)
if not exist "app\dist\index.html" (
  echo Ban chua build PDF ca nhan.
  echo Hay chay CAI_DAT_VA_CHAY_WINDOWS.bat mot lan khi co internet.
  pause
  exit /b 1
)
echo Truy cap: http://127.0.0.1:8080/PDF/
echo Chi truy cap tren may nay. Nhan Ctrl+C de dung.
node scripts\serve-private-bento.mjs
pause
