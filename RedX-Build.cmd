@echo off
setlocal enabledelayedexpansion
title Project RED X Builder

REM Set up colors for console output
set "ESC="
set "GREEN=%ESC%[92m"
set "CYAN=%ESC%[96m"
set "RED=%ESC%[91m"
set "YELLOW=%ESC%[93m"
set "RESET=%ESC%[0m"

echo %CYAN%===================================
echo   Project RED X Build System
echo ===================================%RESET%
echo.

REM Process command-line arguments
set BUILD_TYPE=full
set CLEAN_BUILD=0
set SKIP_CHECKS=0

:parse_args
if "%~1"=="" goto end_parse_args
if /i "%~1"=="-web" set BUILD_TYPE=web
if /i "%~1"=="-native" set BUILD_TYPE=native
if /i "%~1"=="-full" set BUILD_TYPE=full
if /i "%~1"=="-clean" set CLEAN_BUILD=1
if /i "%~1"=="-force" set SKIP_CHECKS=1
shift
goto parse_args
:end_parse_args

REM Check for emsdk directory and set up if needed
if not exist "%~dp0\emsdk" (
    echo %YELLOW%Emscripten SDK not found. Setting up emsdk first...%RESET%
    if exist "%~dp0\setup-emsdk.ps1" (
        echo %CYAN%Running setup-emsdk.ps1...%RESET%
        powershell -ExecutionPolicy Bypass -File "%~dp0\setup-emsdk.ps1"
        if errorlevel 1 (
            echo %RED%Failed to set up Emscripten SDK. Please run setup-emsdk.ps1 manually.%RESET%
            pause
            exit /b 1
        )
    ) else (
        echo %RED%ERROR: setup-emsdk.ps1 not found. Cannot set up Emscripten SDK.%RESET%
        pause
        exit /b 1
    )
)

REM Check if script exists in the expected location
if exist "%~dp0\red_x\Run-RedX.ps1" (
    cd "%~dp0\red_x"
    echo %CYAN%Running RED X script from: %CD%%RESET%
    echo.
) else (
    echo %RED%ERROR: Could not find Run-RedX.ps1 in %~dp0\red_x%RESET%
    echo Please ensure you're running this script from the correct directory.
    echo.
    pause
    exit /b 1
)

REM Create log file location with timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set DATE=%%c-%%a-%%b)
for /f "tokens=1-2 delims=: " %%a in ('time /t') do (set TIME=%%a%%b)
set LOGFILE=%~dp0red_x\build_logs\build_%DATE%_%TIME%.txt
mkdir "%~dp0red_x\build_logs" 2>nul
echo %CYAN%Build log will be created at: %LOGFILE%%RESET%
echo.

REM Check system requirements if not skipped
if %SKIP_CHECKS%==0 (
    echo %YELLOW%Checking system requirements...%RESET%
    powershell -ExecutionPolicy Bypass -Command "& {$requiredSpace = 1GB; $drive = (Get-Item '%~dp0').PSDrive.Name; $freeSpace = (Get-PSDrive $drive).Free; Write-Host ('Free space on drive ' + $drive + ': ' + [math]::Round($freeSpace/1GB, 2) + ' GB'); if($freeSpace -lt $requiredSpace) {Write-Host 'ERROR: Not enough disk space. At least 1GB required.' -ForegroundColor Red; exit 1} else {Write-Host 'Space requirement met.' -ForegroundColor Green}}"
    if errorlevel 1 (
        echo %RED%System requirements check failed. See above for details.%RESET%
        pause
        exit /b 1
    )
    echo.
)

REM Handle clean build if requested
if %CLEAN_BUILD%==1 (
    echo %YELLOW%Clean build requested. Removing previous build artifacts...%RESET%
    if exist "%~dp0\red_x\red_x.exe" del "%~dp0\red_x\red_x.exe"
    if exist "%~dp0\red_x\index.wasm" del "%~dp0\red_x\index.wasm"
    if exist "%~dp0\red_x\index.js" del "%~dp0\red_x\index.js"
    if exist "%~dp0\red_x\index.html" del "%~dp0\red_x\index.html"
    echo %GREEN%Previous build artifacts cleaned.%RESET%
    echo.
)

REM Create the direct PowerShell script with enhanced capabilities
echo %CYAN%Generating build script...%RESET%
(
    echo $ErrorActionPreference = "Stop";
    echo $VerbosePreference = "Continue";
    echo $ProgressPreference = "SilentlyContinue";
    echo $logFile = "%LOGFILE%";
    echo $buildType = "%BUILD_TYPE%";
    echo.
    echo $host.ui.RawUI.WindowTitle = "RED X Builder - $buildType mode";
    echo.
    echo # Helper function to show status indicator
    echo function Show-BuildProgress {
    echo     param($Message, $Status)
    echo.
    echo     switch ($Status) {
    echo         "Running" { $statusColor = "Yellow"; $icon = "⚙️ " }
    echo         "Success" { $statusColor = "Green"; $icon = "✅ " }
    echo         "Error" { $statusColor = "Red"; $icon = "❌ " }
    echo         "Warning" { $statusColor = "Yellow"; $icon = "⚠️ " }
    echo         default { $statusColor = "Cyan"; $icon = "🔍 " }
    echo     }
    echo.
    echo     Write-Host "$icon $Message" -ForegroundColor $statusColor
    echo }
    echo.
    echo # Start logging
    echo Start-Transcript -Path $logFile -Force
    echo.
    echo try {
    echo     Show-BuildProgress "Starting RED X build process... ($buildType mode)" "Running"
    echo.
    echo     # Check if any PowerShell sessions might be blocking files
    echo     Show-BuildProgress "Checking for blocking processes..." "Running"
    echo     $blockingProcesses = Get-Process -Name powershell -ErrorAction SilentlyContinue ^| Where-Object { $_.Id -ne $PID -and $_.MainWindowTitle -match "RED X" }
    echo     if ($blockingProcesses) {
    echo         Show-BuildProgress "$($blockingProcesses.Count) blocking PowerShell processes found. This might cause file lock issues." "Warning"
    echo     }
    echo.
    echo     # Run the appropriate build command based on build type
    echo     switch ($buildType) {
    echo         "web" {
    echo             Show-BuildProgress "Building web version only..." "Running"
    echo             ^& "%~dp0\red_x\Run-RedX.ps1" -Mode web -Verbose
    echo         }
    echo         "native" {
    echo             Show-BuildProgress "Building native executable only..." "Running"
    echo             ^& "%~dp0\red_x\Run-RedX.ps1" -Mode native -Verbose
    echo         }
    echo         default {
    echo             Show-BuildProgress "Building full version (web + native)..." "Running"
    echo             ^& "%~dp0\red_x\Run-RedX.ps1" -Mode build -Verbose
    echo         }
    echo     }
    echo.
    echo     # Verify build results
    echo     $success = $false
    echo     $errorMessage = ""
    echo.
    echo     if ($buildType -eq "web" -or $buildType -eq "full") {
    echo         if (Test-Path -Path "%~dp0\red_x\index.html" -and Test-Path -Path "%~dp0\red_x\index.wasm") {
    echo             Show-BuildProgress "Web build artifacts found!" "Success"
    echo             $success = $true
    echo         } else {
    echo             Show-BuildProgress "Web build artifacts not found" "Error"
    echo             $errorMessage += "Web build failed. "
    echo         }
    echo     }
    echo.
    echo     if ($buildType -eq "native" -or $buildType -eq "full") {
    echo         if (Test-Path -Path "%~dp0\red_x\red_x.exe") {
    echo             Show-BuildProgress "Native executable build successful!" "Success"
    echo             $success = $true
    echo         } else {
    echo             Show-BuildProgress "Native executable not found" "Error"
    echo             $errorMessage += "Native build failed. "
    echo         }
    echo     }
    echo.
    echo     if ($success) {
    echo         Show-BuildProgress "BUILD COMPLETED SUCCESSFULLY!" "Success"
    echo         if (Test-Path -Path "%~dp0\red_x\red_x.exe") {
    echo             $fileInfo = Get-Item "%~dp0\red_x\red_x.exe"
    echo             Show-BuildProgress "Executable: $($fileInfo.FullName) ($([Math]::Round($fileInfo.Length / 1KB, 2)) KB)" "Success"
    echo         }
    echo     } else {
    echo         Show-BuildProgress "BUILD FAILED: $errorMessage" "Error"
    echo     }
    echo }
    echo catch {
    echo     Show-BuildProgress "Error: $_" "Error"
    echo     Show-BuildProgress "Check the log file for details: $logFile" "Warning"
    echo }
    echo finally {
    echo     # Final status and cleanup
    echo     if (Test-Path -Path "%~dp0\red_x\red_x.exe") {
    echo         Show-BuildProgress "RED X is ready to run!" "Success"
    echo     }
    echo     Stop-Transcript
    echo     Write-Host "`nBuild process completed. Press Enter to exit..." -ForegroundColor Cyan
    echo     Read-Host
    echo }
) > "%~dp0\red_x\Start-RedX-Build.ps1"

echo.
echo %YELLOW%*** IMPORTANT ***%RESET%
echo When prompted to allow PowerShell to make changes,
echo you MUST select "YES" to continue the build.
echo.
echo Build options:
echo %CYAN%  Build type: %BUILD_TYPE%%RESET%
if %CLEAN_BUILD%==1 echo %CYAN%  Clean build: YES%RESET%
if %SKIP_CHECKS%==1 echo %CYAN%  Skip checks: YES%RESET%
echo.
echo Press any key when ready to proceed...
pause > nul

REM Execute the PowerShell script with elevated privileges
echo %GREEN%Starting build process with logging to %LOGFILE%...%RESET%
powershell -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0\red_x\Start-RedX-Build.ps1\"' -Verb RunAs -WindowStyle Normal"

echo.
echo %CYAN%Build started in a new window with administrator privileges.%RESET%
echo A log file will be created at: %LOGFILE%
echo.
echo Press any key to exit this window...
pause > nul
exit /b 0
