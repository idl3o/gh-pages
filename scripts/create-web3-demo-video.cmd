@echo off
setlocal EnableDelayedExpansion

echo ===================================
echo    Web3 Demo Video Creator
echo ===================================

set DURATION=30
set RESOLUTION=1920x1080
set FILENAME=web3-demo-video.mp4
set THEME=blockchain
set INCLUDE_CODE=
set INCLUDE_LOGO=true

REM Parse command line arguments
:parse_args
if "%~1"=="" goto :continue
if /i "%~1"=="-duration" (
    set DURATION=%~2
    shift
) else if /i "%~1"=="-resolution" (
    set RESOLUTION=%~2
    shift
) else if /i "%~1"=="-filename" (
    set FILENAME=%~2
    shift
) else if /i "%~1"=="-theme" (
    set THEME=%~2
    shift
) else if /i "%~1"=="-code" (
    set INCLUDE_CODE=-IncludeCodeDemo
) else if /i "%~1"=="-nologo" (
    set INCLUDE_LOGO=
) else if /i "%~1"=="-help" (
    goto :help
)
shift
goto :parse_args

:help
echo Usage: create-web3-demo-video [options]
echo.
echo Options:
echo   -duration NUMBER    Duration in seconds (default: 30)
echo   -resolution WxH     Video resolution (default: 1920x1080)
echo   -filename NAME      Output filename (default: web3-demo-video.mp4)
echo   -theme NAME         Theme (blockchain, token, smart-contract)
echo   -code               Include code demo
echo   -nologo             Don't include the logo
echo   -help               Show this help message
exit /b 0

:continue
echo Creating a %DURATION% second %THEME% demo video at %RESOLUTION% resolution
echo Output will be saved as: %FILENAME%

REM Prepare PowerShell parameters
set PS_PARAMS=-Duration %DURATION% -Resolution "%RESOLUTION%" -FileName "%FILENAME%" -Theme %THEME%

if defined INCLUDE_CODE (
    set PS_PARAMS=!PS_PARAMS! -IncludeCodeDemo
)

if defined INCLUDE_LOGO (
    set PS_PARAMS=!PS_PARAMS! -IncludeLogo
)

REM Execute the PowerShell script with the parameters
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0create-web3-demo-video.ps1" %PS_PARAMS%

if %ERRORLEVEL% NEQ 0 (
    echo Error creating video. Please check the errors above.
    exit /b %ERRORLEVEL%
)

echo.
echo Video creation completed successfully.
echo The video is available at: %~dp0%FILENAME%

exit /b 0
