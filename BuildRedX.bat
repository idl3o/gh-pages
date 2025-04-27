@echo off
echo ===================================
echo   Project RED X Build Script
echo ===================================
echo.

REM Check if script exists in the expected location
if not exist "%~dp0\red_x\Run-RedX.ps1" (
    echo ERROR: Could not find Run-RedX.ps1 in %~dp0\red_x
    echo Please ensure you're running this script from the correct directory.
    echo.
    pause
    exit /b 1
)

REM Clear any existing PowerShell sessions that might be blocking execution
taskkill /f /im powershell.exe >nul 2>&1

REM Change to the script directory
cd /d "%~dp0\red_x"
echo Working directory: %CD%
echo.

REM Create a log file for the output
set LOGFILE="%~dp0\red_x\build_log.txt"
echo Writing logs to: %LOGFILE%
echo.

echo Press any key to start the build process...
pause > nul

REM Run PowerShell with increased execution timeout and restart options
echo Starting build process...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Transcript -Path %LOGFILE% -Force; try { & '.\Run-RedX.ps1' -Mode build -Verbose; } catch { Write-Host \"Error: $_\" -ForegroundColor Red; } finally { Stop-Transcript; }"

echo.
if exist "%~dp0\red_x\red_x.exe" (
    echo ===================================
    echo   BUILD SUCCESSFUL!
    echo ===================================
    echo.
    echo Executable created at:
    echo %~dp0\red_x\red_x.exe
    echo.
) else (
    echo ===================================
    echo   BUILD PROCESS COMPLETED
    echo ===================================
    echo.
    echo Check the log file for details:
    echo %LOGFILE%
    echo.
)

echo Press any key to exit...
pause > nul
