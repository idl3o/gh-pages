@echo off
rem Open PRX in Ubuntu WSL
rem This script is used to open PRX in Ubuntu WSL

rem Check if WSL is available
wsl -l -v >nul 2>&1
if %errorlevel% neq 0 (
    echo WSL is not installed or not available.
    echo Please install WSL by running:
    echo wsl --install -d Ubuntu
    pause
    exit /b 1
)

rem Check if Ubuntu is installed
wsl -l -v | find "Ubuntu" >nul 2>&1
if %errorlevel% neq 0 (
    echo Ubuntu distribution is not installed in WSL.
    echo Please install Ubuntu by running:
    echo wsl --install -d Ubuntu
    pause
    exit /b 1
)

wsl -d Ubuntu -e bash -c "cd /mnt%~dp0/red_x && node server.js || echo 'Failed to start server, check if directory exists'"
