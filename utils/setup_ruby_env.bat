@echo off
echo Setting up Ruby environment for VS Code...

where ruby >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Ruby is not installed or not in PATH
  echo Please install Ruby using RubyInstaller from https://rubyinstaller.org/downloads/
  echo Make sure to check "Add Ruby executables to your PATH" during installation
  exit /b 1
)

echo Ruby found. Running environment setup...
ruby "%~dp0ruby_env_setup.rb"

if %ERRORLEVEL% NEQ 0 (
  echo Failed to set up Ruby environment
  exit /b 1
)

echo.
echo Ruby environment setup complete.
echo You can now run the "RuboCop: Start Language Server" command in VS Code.
