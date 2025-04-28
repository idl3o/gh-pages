@echo off
setlocal enabledelayedexpansion
title Web3 Crypto Streaming Service - Deployment Status
echo Checking GitHub Pages deployment status...
call npm run deploy:status
if !errorlevel! neq 0 (
  echo [ERROR] Status check failed with error code !errorlevel!
) else (
  echo [INFO] Status check completed.
)
pause
endlocal
