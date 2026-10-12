@echo off
setlocal
echo ===================================================
echo     Promnexa Extension - Live Dev Server
echo ===================================================
echo.
cd /d "%~dp0promnexa-ext"
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
)
echo Starting dev watcher...
call npm run dev
pause
