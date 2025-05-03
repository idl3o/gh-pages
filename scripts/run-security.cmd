@echo off
setlocal enabledelayedexpansion
title Web3 Crypto Streaming Service - Security Analysis
echo Opening Security Analysis...

REM Check if http-server is installed
where http-server >nul 2>nul
if !errorlevel! neq 0 (
  echo [WARNING] http-server is not installed. Would you like to install it? (Y/N)
  set /p INSTALL=
  if /i "!INSTALL!"=="Y" (
    echo [INFO] Installing http-server...
    call npm install -g http-server
    if !errorlevel! neq 0 (
      echo [ERROR] Failed to install http-server.
      pause
      exit /b !errorlevel!
    )
  ) else (
    echo [INFO] Using alternative method...
    goto use_alternative
  )
)

:start_server
echo [INFO] Starting local server...
start "" http://127.0.0.1:5500/security.html
http-server -p 5500 --cors
goto end

:use_alternative
echo [INFO] Opening security page using Node.js...
if not exist "_site" (
  echo [WARNING] Build directory not found. Building project...
  call npm run build
)
start "" http://localhost:3000/security.html
node app.js

:end
endlocal
