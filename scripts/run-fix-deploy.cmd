@echo off
setlocal enabledelayedexpansion
title Web3 Crypto Streaming Service - Deployment Fix
echo Fixing GitHub Pages deployment...

REM Create empty .nojekyll file if it doesn't exist
if not exist .nojekyll (
  echo [INFO] Creating .nojekyll file...
  type nul > .nojekyll
)

REM Run Vite build
echo [INFO] Running Vite build...
call npm run build

REM Check if build succeeded
if !errorlevel! neq 0 (
  echo [ERROR] Build failed with error code !errorlevel!
  pause
  exit /b !errorlevel!
)

REM Copy .nojekyll to dist
echo [INFO] Copying .nojekyll to dist folder...
copy .nojekyll dist\ /y

REM Deploy to GitHub Pages
echo [INFO] Deploying to GitHub Pages...
call npm run deploy

if !errorlevel! neq 0 (
  echo [ERROR] Deployment failed with error code !errorlevel!
  pause
  exit /b !errorlevel!
) else (
  echo [SUCCESS] Deployment completed successfully!
)

echo Done!
pause
endlocal
