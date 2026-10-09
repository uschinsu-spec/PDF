@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
echo ==============================================
echo PDF made by Nghia - CAI DAT RIENG TU
echo Ma nguon BentoPDF duoc lay tu Git submodule.
echo Khong tai file PDF cua ban len BentoPDF.
echo ==============================================
where git >nul 2>&1 || (echo CAN CAI GIT: https://git-scm.com/downloads & pause & exit /b 1)
where node >nul 2>&1 || (echo CAN CAI NODE.JS 22: https://nodejs.org/ & pause & exit /b 1)
where npm >nul 2>&1 || (echo Khong tim thay npm & pause & exit /b 1)
git submodule update --init --recursive || (echo LOI: git submodule & pause & exit /b 1)
pushd vendor\bentopdf
call npm ci --no-audit --no-fund || (popd & echo LOI: npm ci & pause & exit /b 1)
popd
set HUSKY=0
set BASE_URL=/PDF/
set SITE_URL=http://127.0.0.1:8080
set VITE_USE_CDN=false
set SIMPLE_MODE=true
set VITE_DEFAULT_LANGUAGE=vi
set VITE_BRAND_NAME=PDF made by Nghia
set VITE_FOOTER_TEXT=PDF ca nhan - xu ly tai trinh duyet
set DISABLE_GITHUB_STARS=true
set VITE_WASM_PYMUPDF_URL=/PDF/wasm/pymupdf/
set VITE_WASM_GS_URL=/PDF/wasm/ghostscript/assets/
set VITE_WASM_CPDF_URL=/PDF/wasm/cpdf/
set VITE_TESSERACT_WORKER_URL=/PDF/ocr/worker.min.js
set VITE_TESSERACT_CORE_URL=/PDF/ocr/core
set VITE_TESSERACT_LANG_URL=/PDF/ocr/lang
set VITE_TESSERACT_AVAILABLE_LANGUAGES=eng,vie
set VITE_OCR_FONT_BASE_URL=/PDF/ocr/fonts
set VITE_CORS_PROXY_URL=
node scripts\prepare-private-bento.mjs || (echo LOI: tai thu vien OCR/WASM & pause & exit /b 1)
pushd vendor\bentopdf
call npm run build || (popd & echo LOI: build & pause & exit /b 1)
popd
node scripts\secure-private-build.mjs || (echo LOI: kiem tra bao mat & pause & exit /b 1)
echo.
echo XONG - truy cap tren may cua ban:
echo http://127.0.0.1:8080/PDF/
echo.
node scripts\serve-private-bento.mjs
pause
