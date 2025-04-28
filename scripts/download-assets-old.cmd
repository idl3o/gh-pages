@echo off
setlocal enabledelayedexpansion
title Red X UI Asset Downloader - Enterprise Edition
echo ===============================================
echo RED X MODSIAS UI ASSET DOWNLOADER
echo Full-Stack Web Development Suite
echo ===============================================
echo.

:: Set directories
set BASE_DIR=%~dp0..
set ASSETS_DIR=%BASE_DIR%\assets
set TEMP_DIR=%TEMP%\red_x_assets
set LOG_FILE=%BASE_DIR%\logs\asset-download.log

:: Create directories if they don't exist
if not exist "%ASSETS_DIR%" mkdir "%ASSETS_DIR%"
if not exist "%ASSETS_DIR%\images" mkdir "%ASSETS_DIR%\images"
if not exist "%ASSETS_DIR%\icons" mkdir "%ASSETS_DIR%\icons"
if not exist "%ASSETS_DIR%\fonts" mkdir "%ASSETS_DIR%\fonts"
if not exist "%ASSETS_DIR%\videos" mkdir "%ASSETS_DIR%\videos"
if not exist "%BASE_DIR%\logs" mkdir "%BASE_DIR%\logs"
if not exist "%TEMP_DIR%" mkdir "%TEMP_DIR%"

:: Clear log file
echo Asset Download Log - %date% %time% > "%LOG_FILE%"

:: Check GitHub authentication
echo Checking GitHub credentials...
call gh auth status >nul 2>&1
if !errorlevel! neq 0 (
  echo [WARNING] GitHub CLI not authenticated. Some enterprise assets may be unavailable.
  echo Would you like to log in to GitHub now? (Y/N)
  set /p LOGIN_CHOICE=
  if /i "!LOGIN_CHOICE!"=="Y" (
    call gh auth login
  )
) else (
  echo [SUCCESS] GitHub authentication confirmed.
)

:: Display menu
echo.
echo Please select asset category to download:
echo 1. All assets (recommended)
echo 2. Basic UI kit only
echo 3. Icons and illustrations
echo 4. Fonts and typography
echo 5. Animation assets
echo 6. Custom enterprise theme assets
echo.
set /p CHOICE=Enter selection (1-6):

:: Process choice
if "%CHOICE%"=="1" (
  call :download_all
) else if "%CHOICE%"=="2" (
  call :download_basic_ui
) else if "%CHOICE%"=="3" (
  call :download_icons
) else if "%CHOICE%"=="4" (
  call :download_fonts
) else if "%CHOICE%"=="5" (
  call :download_animations
) else if "%CHOICE%"=="6" (
  call :download_enterprise
) else (
  echo Invalid selection. Please try again.
  exit /b 1
)

echo.
echo ===============================================
echo Asset download complete!
echo Assets are located in: %ASSETS_DIR%
echo Log file: %LOG_FILE%
echo.
echo Your coffee is ready! Take a break and then continue your development.
echo ===============================================
echo Press any key to exit...
pause > nul
exit /b 0

:: Download function for all assets
:download_all
echo Downloading all UI assets...
call :show_progress 0 "Starting full download"

:: Basic UI
call :download_basic_ui
call :show_progress 30 "Basic UI downloaded"

:: Icons
call :download_icons
call :show_progress 50 "Icons downloaded"

:: Fonts
call :download_fonts
call :show_progress 70 "Fonts downloaded"

:: Animations
call :download_animations
call :show_progress 90 "Animations downloaded"

:: Enterprise theme
call :download_enterprise
call :show_progress 100 "Download complete"

exit /b 0

:: Download basic UI kit assets
:download_basic_ui
echo Downloading basic UI kit...
set UI_KIT_URL=https://cdn.jsdelivr.net/gh/modsias/red_x@main/assets/ui-kit.zip
call :download_and_extract "%UI_KIT_URL%" "ui-kit" "%ASSETS_DIR%"
exit /b 0

:: Download icons and illustrations
:download_icons
echo Downloading icons and illustrations...
set ICONS_URL=https://cdn.jsdelivr.net/gh/modsias/red_x@main/assets/icons.zip
call :download_and_extract "%ICONS_URL%" "icons" "%ASSETS_DIR%\icons"

:: Download SVG icons separately
echo Downloading individual SVG icons...
set SVG_ICONS=(wallet.svg streaming.svg token.svg creator.svg logo.svg blockchain.svg)
for %%i in %SVG_ICONS% do (
  echo - Downloading %%i
  curl -s -o "%ASSETS_DIR%\icons\%%i" "https://cdn.jsdelivr.net/gh/modsias/red_x@main/assets/icons/%%i" 2>> "%LOG_FILE%"
)
exit /b 0

:: Download fonts and typography assets
:download_fonts
echo Downloading fonts...
set FONTS_URL=https://cdn.jsdelivr.net/gh/modsias/red_x@main/assets/fonts.zip
call :download_and_extract "%FONTS_URL%" "fonts" "%ASSETS_DIR%\fonts"
exit /b 0

:: Download animation assets
:download_animations
echo Downloading animation assets...
set ANIMATIONS_URL=https://cdn.jsdelivr.net/gh/modsias/red_x@main/assets/animations.zip
call :download_and_extract "%ANIMATIONS_URL%" "animations" "%ASSETS_DIR%\animations"
exit /b 0

:: Download enterprise theme assets
:download_enterprise
echo Checking enterprise license...
if exist "%BASE_DIR%\enterprise-license.key" (
  echo [SUCCESS] Enterprise license found. Downloading enterprise assets...
  set ENTERPRISE_URL=https://cdn.jsdelivr.net/gh/modsias/red_x@main/assets/enterprise.zip
  call :download_and_extract "%ENTERPRISE_URL%" "enterprise" "%ASSETS_DIR%\enterprise"
) else (
  echo [INFO] No enterprise license found. Using community edition assets.
  set COMMUNITY_URL=https://cdn.jsdelivr.net/gh/modsias/red_x@main/assets/community.zip
  call :download_and_extract "%COMMUNITY_URL%" "community" "%ASSETS_DIR%\community"
)
exit /b 0

:: Utility function to download and extract a zip file
:download_and_extract
set URL=%~1
set NAME=%~2
set DEST=%~3

echo Downloading %NAME% package...
curl -s -L -o "%TEMP_DIR%\%NAME%.zip" "%URL%" 2>> "%LOG_FILE%"
if %errorlevel% neq 0 (
  echo [ERROR] Failed to download %NAME% package.
  echo Check network connection or repository access.
  exit /b 1
)

echo Extracting %NAME% package...
powershell -Command "Expand-Archive -Path '%TEMP_DIR%\%NAME%.zip' -DestinationPath '%DEST%' -Force" 2>> "%LOG_FILE%"
if %errorlevel% neq 0 (
  echo [ERROR] Failed to extract %NAME% package.
  exit /b 1
)

echo [SUCCESS] %NAME% package downloaded and extracted.
exit /b 0

:: Show progress bar
:show_progress
set PROGRESS=%~1
set STATUS=%~2

call :print_progress_bar %PROGRESS%
echo %STATUS%
exit /b 0

:print_progress_bar
set /a FILLED=%~1/2
set BAR=[
for /l %%A in (1,1,%FILLED%) do call set "BAR=%%BAR%%#"
set /a EMPTY=50-%FILLED%
for /l %%A in (1,1,%EMPTY%) do call set "BAR=%%BAR%% "
set BAR=%BAR%] %~1%%
echo %BAR%
exit /b 0
