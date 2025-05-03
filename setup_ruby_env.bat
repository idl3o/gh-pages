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

REM Check if ruby_env_setup.rb exists in utils directory
if exist "%~dp0utils\ruby_env_setup.rb" (
  ruby "%~dp0utils\ruby_env_setup.rb"
) else (
  echo Script not found: utils\ruby_env_setup.rb
  echo Creating minimal setup...

  REM Install required gems
  echo Installing required gems...
  gem install bundler

  REM Run bundle install
  echo Running bundle install...
  bundle install
)

if %ERRORLEVEL% NEQ 0 (
  echo Failed to set up Ruby environment
  exit /b 1
)

echo.
echo Ruby environment setup complete.
echo You can now run the "RuboCop: Start Language Server" command in VS Code.
