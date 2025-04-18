@echo off
echo Web3 Crypto Streaming Service - Branch Switcher
echo.

if "%1"=="" (
    echo Usage: switch-branch [branch-name]
    echo.
    echo Available branches:
    git branch
    exit /b 1
)

echo Switching to branch: %1
git checkout %1

if %errorlevel% neq 0 (
    echo Failed to switch to branch %1
    exit /b %errorlevel%
)

echo.
echo Current branch:
git branch --show-current
echo.
echo Successfully switched to branch: %1
