@echo off
setlocal enabledelayedexpansion
title Web3 Crypto Streaming Service - Script Runner

if "%~1"=="" (
  echo [INFO] Please provide a script name from package.json
  echo Available scripts:
  call npm run
  goto :end
)

echo [INFO] Running script: %~1
call npm run %~1
if !errorlevel! neq 0 (
  echo [ERROR] Script failed with error code !errorlevel!
  goto :end
)
echo [SUCCESS] Script '%~1' completed successfully.

:end
pause
endlocal
