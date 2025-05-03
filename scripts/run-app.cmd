@echo off
setlocal enabledelayedexpansion
title Web3 Crypto Streaming Service
echo Starting Web3 Crypto Streaming Service local server...
echo.
echo This will serve the built files from the dist directory.
echo If the dist directory doesn't exist, please run build first with run-build.cmd
echo.

REM Check if node is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [ERROR] Node.js is not installed or not in your PATH.
  echo Please install Node.js from https://nodejs.org/
  pause
  exit /b 1
)

REM Check for required modules
if not exist "node_modules\serve-static" (
  echo [WARNING] Required modules may not be installed.
  echo Would you like to install dependencies now? (Y/N)
  set /p INSTALL_DEPS=
  if /i "!INSTALL_DEPS!"=="Y" (
    call npm install
    if !errorlevel! neq 0 (
      echo [ERROR] Failed to install dependencies.
      pause
      exit /b !errorlevel!
    )
  )
)

REM Check if the dist directory exists
if not exist "dist\" (
  echo [WARNING] The dist directory doesn't exist.
  echo Would you like to build the project first? (Y/N)
  set /p BUILD_FIRST=
  if /i "!BUILD_FIRST!"=="Y" (
    call npm run build
    if !errorlevel! neq 0 (
      echo [ERROR] Build failed with error code !errorlevel!
      pause
      exit /b !errorlevel!
    )
  )
)

echo [INFO] Starting server on http://localhost:3000
echo Press Ctrl+C to stop the server
echo.
start "" http://localhost:3000
node app.js
pause
endlocal
