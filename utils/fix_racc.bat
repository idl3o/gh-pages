@echo off
echo ===== Fixing Ruby Native Gems =====

echo Step 1: Rebuilding racc gem...
gem pristine racc --version 1.7.3
if %ERRORLEVEL% NEQ 0 (
  echo Failed to rebuild racc. Trying to reinstall...
  gem uninstall racc --all --executables --ignore-dependencies
  gem install racc --version 1.7.3 --platform=ruby
)

echo Step 2: Cleaning up bundle environment...
if exist Gemfile.lock (
  del Gemfile.lock
  echo Removed Gemfile.lock
)

if exist vendor\ (
  rmdir /s /q vendor
  echo Removed vendor directory
)

echo Step 3: Installing bundle dependencies...
bundle install
if %ERRORLEVEL% NEQ 0 (
  echo Bundle install failed. Trying with more options...
  bundle install --verbose
)

echo.
echo Step 4: Verifying Jekyll works with bundle exec...
bundle exec jekyll -v
if %ERRORLEVEL% EQU 0 (
  echo SUCCESS! Jekyll is working correctly.
  echo.
  echo You can now run Jekyll with:
  echo   bundle exec jekyll serve
) else (
  echo Jekyll verification failed.
  echo Try running these commands manually:
  echo   bundle update
  echo   bundle exec jekyll -v
)
