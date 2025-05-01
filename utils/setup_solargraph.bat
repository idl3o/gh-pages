@echo off
echo Setting up Solargraph for better Ruby code intelligence...

where ruby >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Ruby is not installed or not in PATH
  exit /b 1
)

cd %~dp0..
ruby utils\setup_solargraph.rb

if %ERRORLEVEL% NEQ 0 (
  echo Failed to set up Solargraph
  exit /b 1
)

echo.
echo To use Solargraph in VS Code, please install these extensions:
echo - Solargraph (castwide.solargraph)
echo - Ruby (rebornix.ruby)
