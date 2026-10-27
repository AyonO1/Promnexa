@echo off
setlocal
cd /d "%~dp0promnexa-ext"
where node >nul 2>nul
if errorlevel 1 goto missing
where npm >nul 2>nul
if errorlevel 1 goto missing
node -e "const [major,minor]=process.versions.node.split('.').map(Number);process.exit(major>22||(major===22&&minor>=18)?0:1)"
if errorlevel 1 goto missing
call npm ci
if errorlevel 1 goto failed
call npm run compile
if errorlevel 1 goto failed
call npm test
if errorlevel 1 goto failed
call npm run build
if errorlevel 1 goto failed
call npm run build:firefox
if errorlevel 1 goto failed
call npm run zip
if errorlevel 1 goto failed
call npm run zip:firefox
if errorlevel 1 goto failed
echo Build complete. In Chrome Load unpacked, select:
echo %~dp0promnexa-ext\.output\chrome-mv3
echo Store ZIPs are in promnexa-ext\.output
pause
exit /b 0
:missing
echo Install Node.js 22.18 or newer with npm, then retry.
pause
exit /b 1
:failed
echo Build failed. See the error above; do not load an incomplete build.
pause
exit /b 1
