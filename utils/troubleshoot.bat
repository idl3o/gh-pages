@echo off
echo ===== Development Environment Troubleshooter =====
echo.

echo Checking common issues...

REM Check Python installation
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Python is installed and in PATH
    python --version
) else (
    echo [ERROR] Python is not in PATH
)

REM Check pip installation
where pip >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] pip is installed and in PATH
    pip --version
) else (
    echo [ERROR] pip is not in PATH
)

REM Check Ruby installation
where ruby >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Ruby is installed and in PATH
    ruby -v
) else (
    echo [ERROR] Ruby is not in PATH
)

echo.
echo ===== Common Commands =====
echo.
echo Python package installation:
echo   python -m pip install package_name
echo   or use: utils\install_package.bat package_name
echo.
echo Jekyll commands:
echo   bundle install     - Install Ruby dependencies
echo   bundle exec jekyll serve  - Run Jekyll server
echo.
echo ===== Common Errors =====
echo.
echo 1. "no such option: -o" with pip:
echo    - Correct syntax is: python -m pip install package_name
echo    - Or use our helper: utils\install_package.bat package_name
echo.
echo 2. Ruby gem issues with racc:
echo    - Run: gem pristine racc --version 1.7.3
echo    - Then: bundle update
echo.
echo 3. PATH issues:
echo    - Run: utils\check_path.bat
echo.
