@echo off
echo Checking Ruby installation...

where ruby >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Ruby is not installed or not in PATH
  echo Please install Ruby using RubyInstaller from https://rubyinstaller.org/downloads/
  echo Make sure to check "Add Ruby executables to your PATH" during installation
  exit /b 1
)

echo Ruby found in PATH
ruby -v
echo.
echo Setting up Ruby environment...
ruby "%~dp0ruby_setup.rb"

if %ERRORLEVEL% NEQ 0 (
  echo Failed to set up Ruby environment
  exit /b 1
)

echo Ruby environment activated successfully
