@echo off
REM Python Package Installer Helper
REM Usage: install_package.bat package_name [options]
REM Example: install_package.bat requests --upgrade

echo Python Package Installer Helper
echo.

if "%1"=="" (
    echo Error: No package name provided
    echo Usage: install_package.bat package_name [options]
    exit /b 1
)

python "%~dp0pip_installer.py" %*

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Package installation completed successfully.
) else (
    echo.
    echo Package installation encountered errors.
)
