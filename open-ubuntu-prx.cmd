@echo off
REM open-ubuntu-prx.cmd - Command to open Project RED X in Ubuntu
REM Created April 25, 2025

echo Starting Project RED X in Ubuntu environment...

REM Check if Docker is available
docker --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Docker is not available. Trying WSL Ubuntu directly.
    goto :try_wsl
)

REM Try using Docker with run-ubuntu.ps1
echo Attempting to launch via Docker...
powershell -ExecutionPolicy Bypass -File "%~dp0\run-ubuntu.ps1" start-server
if %ERRORLEVEL% EQU 0 goto :eof

:try_wsl
REM Try using WSL Ubuntu directly
echo Attempting to launch via WSL Ubuntu...
wsl -d Ubuntu -e bash -c "cd /mnt%~dp0/red_x && node server.js"
if %ERRORLEVEL% NEQ 0 (
    echo Failed to start server via WSL Ubuntu.
    echo.
    echo Please make sure either Docker Desktop or WSL Ubuntu is installed and configured.
    echo You can also try running the server manually with:
    echo.
    echo   1. Open Ubuntu/WSL terminal
    echo   2. Navigate to: cd /mnt/c/Users/Sam/Documents/GitHub/gh-pages/red_x
    echo   3. Run: node server.js
    echo.
    pause
) else (
    echo Server started. Open your browser at http://localhost:8080
)

:end
