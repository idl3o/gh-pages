@echo off
echo === Resetting Bundler Environment ===

echo Step 1: Removing vendor directory...
if exist vendor\ (
  rmdir /s /q vendor
  echo Vendor directory removed.
) else (
  echo No vendor directory found.
)

echo Step 2: Removing Gemfile.lock...
if exist Gemfile.lock (
  del Gemfile.lock
  echo Gemfile.lock removed.
) else (
  echo No Gemfile.lock found.
)

echo Step 3: Making sure we have a recent Bundler...
gem install bundler --no-document
echo Current bundler version:
bundle -v

echo Step 4: Running bundle install with clean environment...
set BUNDLE_IGNORE_CONFIG=1
bundle install

echo.
if %ERRORLEVEL% == 0 (
  echo ✓ Bundler reset successful!
  echo Now you can run: bundle exec jekyll serve
) else (
  echo ✗ Bundle install failed.
  echo Try running these commands manually:
  echo   gem install bundler --no-document
  echo   set BUNDLE_IGNORE_CONFIG=1
  echo   bundle install
)
