@echo off
setlocal enabledelayedexpansion
title Web3 Crypto Streaming Service - Build
echo Running build process...
cd /d "%~dp0"
call npm run build
if !errorlevel! neq 0 (
  echo [ERROR] Build failed with error code !errorlevel!
  pause
  exit /b !errorlevel!
)
echo [SUCCESS] Build complete! Files should be in the dist directory.
echo Checking if dist directory exists:
if exist dist (
  echo [INFO] dist directory found! Build was successful.
  dir dist
) else (
  echo [WARNING] dist directory not found. Build may have failed.
)
pause
endlocal
