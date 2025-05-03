@echo off
REM SXS CLI Launcher for Windows
REM This script launches the SXS CLI in the appropriate environment

REM Check if PowerShell is available
where powershell >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    REM Launch PowerShell version
    powershell -ExecutionPolicy Bypass -File "%~dp0\sxs-cli.ps1" %*
) else (
    REM Check if WSL is available
    where wsl >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        REM Launch bash version through WSL
        wsl -e bash "%~dp0\sxs-cli.sh" %*
    ) else (
        REM Check if Git Bash is available
        if exist "C:\Program Files\Git\bin\bash.exe" (
            "C:\Program Files\Git\bin\bash.exe" "%~dp0\sxs-cli.sh" %*
        ) else (
            echo SXS CLI requires PowerShell, WSL, or Git Bash to run.
            echo None of these environments were found.
            pause
            exit /b 1
        )
    )
)
