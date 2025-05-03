@echo off
echo === Fixing Bundler for Ruby 3.3 ===

where ruby >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Ruby is not installed or not in PATH
  exit /b 1
)

echo Detected Ruby version:
ruby -v

echo.
echo Step 1: Removing vendor directory with old bundler installation...
if exist vendor\ (
  rmdir /s /q vendor
  echo Vendor directory removed.
) else (
  echo No vendor directory found. Skipping.
)

echo.
echo Step 2: Removing old bundler versions...
gem uninstall bundler --all --executables
if %ERRORLEVEL% NEQ 0 (
  echo Warning: Failed to uninstall bundler, but continuing...
)

echo.
echo Step 3: Installing bundler 2.4.22 (compatible with Ruby 3.3)...
gem install bundler -v 2.4.22
if %ERRORLEVEL% NEQ 0 (
  echo Failed to install bundler
  exit /b 1
)

echo.
echo Step 4: Updating gems...
bundle update --bundler
if %ERRORLEVEL% NEQ 0 (
  echo Warning: Bundle update failed, trying bundle install...
  bundle install
)

echo.
echo Bundler has been updated!
echo Current bundler version:
bundle -v

echo.
echo Now you can run:
echo bundle exec jekyll serve
