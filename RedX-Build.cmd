@echo off
echo ===================================
echo   Project RED X Build Script
echo ===================================
echo.

REM Check if script exists in the expected location
if exist "%~dp0\red_x\Run-RedX.ps1" (
    cd "%~dp0\red_x"
    echo Running RED X script from: %CD%
    echo.
) else (
    echo ERROR: Could not find Run-RedX.ps1 in %~dp0\red_x
    echo Please ensure you're running this script from the correct directory.
    echo.
    pause
    exit /b 1
)

REM Create log file location
set LOGFILE=%~dp0red_x\build_log.txt
echo Build log will be created at: %LOGFILE%
echo.

REM Create the direct PowerShell script if it doesn't exist
echo Checking for direct PowerShell script...
if not exist "%~dp0\red_x\Start-RedX-Build.ps1" (
    echo Creating PowerShell execution script...
    powershell -ExecutionPolicy Bypass -Command "Set-Content -Path '%~dp0\red_x\Start-RedX-Build.ps1' -Value '$ErrorActionPreference = \"Stop\"; $VerbosePreference = \"Continue\"; $logFile = \"%LOGFILE%\"; Start-Transcript -Path $logFile -Force; try { Write-Host \"Starting RED X build process...\" -ForegroundColor Cyan; & \"%~dp0\red_x\Run-RedX.ps1\" -Mode build -Verbose; if (Test-Path -Path \"%~dp0\red_x\red_x.exe\") { Write-Host \"BUILD SUCCESSFUL!\" -ForegroundColor Green; } else { Write-Host \"BUILD FAILED - Executable not found\" -ForegroundColor Red; } } catch { Write-Host \"Error: $_\" -ForegroundColor Red; } finally { Stop-Transcript; Read-Host \"Press Enter to exit...\"; }'"
)

echo.
echo *** IMPORTANT ***
echo When prompted to allow PowerShell to make changes,
echo you MUST select "YES" to continue the build.
echo.
echo Press any key when ready to proceed...
pause > nul

REM Execute the PowerShell script with elevated privileges
echo Starting build process with logging to %LOGFILE%...
powershell -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"%~dp0\red_x\Start-RedX-Build.ps1\"' -Verb RunAs"

echo.
echo Build started in a new window with administrator privileges.
echo A log file will be created at: %LOGFILE%
echo.
echo Press any key to exit this window...
pause > nul
