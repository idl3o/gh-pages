@echo off
echo Creating test video for Web3 Core Functionality...
powershell -ExecutionPolicy Bypass -File "%~dp0create-test-video.ps1" %*
if %ERRORLEVEL% EQU 0 (
    echo Video creation completed successfully.
) else (
    echo Video creation failed with error code %ERRORLEVEL%.
)
pause
