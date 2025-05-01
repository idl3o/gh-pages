@echo off
echo === Python PATH Verification Tool ===
echo.

set PYTHON_SCRIPTS_DIR=C:\Users\Sam\AppData\Roaming\Python\Python313\Scripts

echo Checking if Python Scripts directory is in PATH...
echo %PATH% | findstr /C:"%PYTHON_SCRIPTS_DIR%" > nul
if %ERRORLEVEL% EQU 0 (
  echo SUCCESS: Python Scripts directory is now in your PATH.
  echo You should be able to run Python scripts directly.
) else (
  echo WARNING: Python Scripts directory was not found in your PATH.
  echo Please verify that you've added it correctly.
)

echo.
echo Verifying access to Python tools:
echo.

where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo Python: Available
  python --version
) else (
  echo Python: Not found in PATH
)

where pip >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  echo pip: Available
  pip --version
) else (
  echo pip: Not found in PATH
)

echo.
echo To test that everything is working, try running:
echo pip --version
echo.
echo If the above command works, your PATH is correctly configured.
