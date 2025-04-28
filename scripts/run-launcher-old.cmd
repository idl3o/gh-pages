@echo off
setlocal enabledelayedexpansion
title Web3 Crypto Streaming Service - URL Launcher
echo Opening URL Launcher page...

REM Check if the server is already running
netstat -ano | findstr ":%PORT%" > nul
if !errorlevel! equ 0 (
  echo [INFO] Server already running. Opening URL launcher...
  start "" http://localhost:3000/url-launcher.html
  exit /b 0
)

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
start "" http://localhost:5500/url-launcher.html
http-server -p 5500 --cors
goto end

:use_alternative
echo [INFO] Opening URL launcher using Node.js...
if not exist "dist" (
  echo [WARNING] Build directory not found. Building project...
  call npm run build
)
start "" http://localhost:3000/url-launcher.html
node app.js

:end
endlocal
