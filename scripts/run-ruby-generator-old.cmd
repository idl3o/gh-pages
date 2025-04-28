@echo off
setlocal enabledelayedexpansion
title Web3 Asset Generator - S-Poe Distribution

echo ===============================================
echo Web3 Design Asset Generator and S-Poe Distributor
echo ===============================================
echo.

:: Check if ruby is available
where ruby >nul 2>nul
if !errorlevel! neq 0 (
  echo [ERROR] Ruby is not installed or not in your PATH.
  echo Please install Ruby from https://rubyinstaller.org/
  pause
  exit /b 1
)

echo [INFO] Ruby version:
ruby -v
echo.

:: Ensure required gems are installed
echo [INFO] Checking required gems...
call gem list --local bundler > nul 2>&1
if !errorlevel! neq 0 (
  echo [INFO] Installing bundler gem...
  call gem install bundler
)

:: Menu
echo Please select an operation:
echo 1. Generate assets only
echo 2. Optimize existing assets
echo 3. Distribute assets to S-Poe
echo 4. Complete pipeline (Generate + Optimize + Distribute)
echo 5. Exit
echo.

set /p CHOICE=Enter selection (1-5):

:: Process choice
set COMMAND=
set OPTIONS=

if "%CHOICE%"=="1" (
  set COMMAND=generate
) else if "%CHOICE%"=="2" (
  set COMMAND=optimize
) else if "%CHOICE%"=="3" (
  set COMMAND=distribute
) else if "%CHOICE%"=="4" (
  set COMMAND=all
) else if "%CHOICE%"=="5" (
  echo Exiting...
  exit /b 0
) else (
  echo Invalid selection. Please try again.
  pause
  exit /b 1
)

:: Get theme
echo.
echo Available themes: cyber, minimal, neon, corporate, retro
set /p THEME=Select theme (default: cyber):
if not "!THEME!"=="" (
  set OPTIONS=!OPTIONS! --theme=!THEME!
)

:: Get currency
echo.
echo Available currencies: GBP (£), EUR (€), USD ($)
set /p CURRENCY=Select currency (default: GBP):
if not "!CURRENCY!"=="" (
  set OPTIONS=!OPTIONS! --currency=!CURRENCY!
)

:: API key for distribution
if "%COMMAND%"=="distribute" (
  echo.
  echo S-Poe API key is required for actual distribution.
  echo Leave blank to use simulation mode.
  set /p API_KEY=Enter your S-Poe API key:
  if not "!API_KEY!"=="" (
    set OPTIONS=!OPTIONS! --api-key=!API_KEY!
  )
)

:: Run the generator
echo.
echo [INFO] Running asset generator...
cd /d "%~dp0"
ruby design-generator.rb %COMMAND% %OPTIONS%

if !errorlevel! neq 0 (
  echo [ERROR] Generator failed with error code !errorlevel!
  pause
  exit /b !errorlevel!
)

echo.
echo [SUCCESS] Operation completed successfully!
pause
endlocal
