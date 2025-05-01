@echo off
echo === Setting Up Jekyll ===

echo Checking Ruby installation...
where ruby >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Ruby is not installed or not in PATH.
  echo Please install Ruby from https://rubyinstaller.org/
  exit /b 1
)

echo Ruby found:
ruby -v

echo Checking Bundler installation...
where bundle >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Bundler is not installed. Installing now...
  gem install bundler
  if %ERRORLEVEL% NEQ 0 (
    echo Failed to install Bundler.
    exit /b 1
  )
)

echo Bundler found:
bundle -v

echo Cleaning up old installations...
if exist Gemfile.lock (
  del Gemfile.lock
  echo Removed Gemfile.lock.
)

if exist vendor\ (
  rmdir /s /q vendor
  echo Removed vendor directory.
)

echo Installing Jekyll and dependencies...
bundle install
if %ERRORLEVEL% NEQ 0 (
  echo Failed to install dependencies.
  echo Trying with local path...
  set BUNDLE_PATH=vendor/bundle
  bundle install --path vendor/bundle
  if %ERRORLEVEL% NEQ 0 (
    echo Bundle install failed.
    exit /b 1
  )
)

echo Verifying Jekyll installation...
bundle exec jekyll -v
if %ERRORLEVEL% NEQ 0 (
  echo Jekyll installation verification failed.
  exit /b 1
)

echo Creating Jekyll binstubs for direct access...
bundle binstubs jekyll --force
if %ERRORLEVEL% EQU 0 (
  echo Created Jekyll binstubs in bin directory.
  echo You can now run Jekyll using: bin\jekyll command
) else (
  echo Failed to create binstubs.
)

echo.
echo === Jekyll Setup Complete ===
echo.
echo You can now run Jekyll with:
echo   bundle exec jekyll serve
echo.
echo To add Jekyll directly to your PATH, run:
echo   set PATH=%CD%\bin;%PATH%
echo.
