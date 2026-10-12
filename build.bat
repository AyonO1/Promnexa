@echo off
setlocal
echo ===================================================
echo           Promnexa Extension - Builder
echo ===================================================
echo.

:: Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in your PATH.
    echo Please install Node.js 18+ from https://nodejs.org
    echo.
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
if not exist "%~dp0promnexa-ext\node_modules\" (
    echo Installing dependencies in promnexa-ext...
    cd /d "%~dp0promnexa-ext"
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
    cd /d "%~dp0"
) else (
    echo Dependencies are already installed.
)

echo.
echo [2/3] Building Chrome (MV3) and Firefox (MV2) packages...
cd /d "%~dp0promnexa-ext"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Chrome build failed.
    pause
    exit /b 1
)

call npm run build:firefox
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Firefox build failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Packaging distribution ZIP archives...
call npm run zip
call npm run zip:firefox

echo.
echo ===================================================
echo              Build Complete!
echo ===================================================
echo.
echo Ready-to-load folders:
echo   - Chrome / Brave / Edge:  promnexa-ext\.output\chrome-mv3
echo   - Firefox:                promnexa-ext\.output\firefox-mv2
echo.
echo Pre-built ZIP packages:
echo   - Chrome ZIP:   promnexa-ext\.output\promnexa-1.0.0-chrome.zip
echo   - Firefox ZIP:  promnexa-ext\.output\promnexa-1.0.0-firefox.zip
echo.
echo See INSTALL.md for 30-second loading instructions.
echo ===================================================
echo.
pause
