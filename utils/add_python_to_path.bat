@echo off
setlocal enabledelayedexpansion

echo === Python PATH Configuration Utility ===
echo.

set PYTHON_SCRIPTS_DIR=C:\Users\Sam\AppData\Roaming\Python\Python313\Scripts

echo Checking if Python Scripts directory exists...
if not exist "%PYTHON_SCRIPTS_DIR%" (
  echo Error: Python Scripts directory not found at %PYTHON_SCRIPTS_DIR%
  echo Please install Python or check the correct path to the Scripts directory.
  exit /b 1
)

echo Python Scripts directory found: %PYTHON_SCRIPTS_DIR%
echo.

echo Checking if directory is already in PATH...
echo %PATH% | findstr /C:"%PYTHON_SCRIPTS_DIR%" > nul
if %ERRORLEVEL% EQU 0 (
  echo Python Scripts directory is already in your PATH.
  goto :MENU
) else (
  echo Python Scripts directory is NOT in your PATH.
  echo.
)

:MENU
echo What would you like to do?
echo 1. Add Python Scripts to PATH permanently (requires admin privileges)
echo 2. Add Python Scripts to PATH temporarily (current session only)
echo 3. Show current PATH
echo 4. Exit
echo.
set /p CHOICE="Enter your choice (1-4): "

if "%CHOICE%"=="1" goto :PERMANENT
if "%CHOICE%"=="2" goto :TEMPORARY
if "%CHOICE%"=="3" goto :SHOW_PATH
if "%CHOICE%"=="4" goto :END

echo Invalid choice. Please try again.
goto :MENU

:PERMANENT
echo.
echo Adding Python Scripts to PATH permanently...
echo This requires administrative privileges.

powershell -Command "Start-Process cmd -ArgumentList '/c setx PATH \"\"%PATH%;%PYTHON_SCRIPTS_DIR%\"\"' -Verb RunAs"

if %ERRORLEVEL% EQU 0 (
  echo.
  echo Python Scripts directory has been added to your system PATH.
  echo You'll need to restart any open command prompts for the change to take effect.
) else (
  echo.
  echo Failed to add directory to PATH. Make sure to run as administrator.
)
goto :MENU

:TEMPORARY
echo.
echo Adding Python Scripts to PATH temporarily (for this session only)...
set PATH=%PATH%;%PYTHON_SCRIPTS_DIR%
echo Done! Python scripts will be available in this command prompt session.
echo To verify, try: pip --version
goto :MENU

:SHOW_PATH
echo.
echo Current PATH environment variable:
echo ---------------------------------------------
echo %PATH%
echo ---------------------------------------------
echo.
goto :MENU

:END
echo.
echo === Exiting PATH Configuration Utility ===
endlocal
