@echo off
echo Setting up development environment for Project RED X
echo ===================================================

echo Checking for NVM for Windows...
where nvm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo NVM for Windows not found. Please install from:
    echo https://github.com/coreybutler/nvm-windows/releases
    echo Then run this script again.
    pause
    exit /b 1
)

echo NVM for Windows found. Checking available Node.js versions...
nvm list available

echo Installing Node.js 16.15.1...
nvm install 16.15.1

echo Setting Node.js 16.15.1 as default...
nvm use 16.15.1

echo Verifying installation...
node -v
npm -v

echo Installing project dependencies...
cd /d "%~dp0"
npm install

echo Setup complete! You can now run the project using:
echo npm start

pause
