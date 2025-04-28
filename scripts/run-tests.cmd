@echo off
setlocal enabledelayedexpansion
title Web3 Crypto Streaming Service - Test Runner
echo Web3 Crypto Streaming Service Test Runner
echo ===========================================

REM Check if node_modules exists
if not exist "node_modules" (
  echo [WARNING] node_modules not found. Installing dependencies first...
  call npm install
  if !errorlevel! neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b !errorlevel!
  )
)

REM Check if jest is available locally
if not exist "node_modules\.bin\jest.cmd" (
  echo [WARNING] Jest not found in local node_modules. Installing Jest...
  call npm install --save-dev jest
  if !errorlevel! neq 0 (
    echo [ERROR] Failed to install Jest.
    pause
    exit /b !errorlevel!
  )
)

echo [INFO] Running tests with local Jest installation...

REM Pass all arguments to Jest
if "%~1"=="" (
  call npx jest
) else (
  call npx jest %*
)

if !errorlevel! neq 0 (
  echo [ERROR] Tests failed with exit code !errorlevel!
  pause
  exit /b !errorlevel!
)

echo [SUCCESS] All tests passed!
pause
