@echo off
echo === Setting Up Ruby DevKit for Windows ===

echo Step 1: Checking Ruby installation...
where ruby >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Ruby is not installed or not in PATH
  echo Please install Ruby using RubyInstaller from https://rubyinstaller.org/downloads/
  echo Make sure to select the option to install MSYS2 and development toolchain
  exit /b 1
)

echo Ruby found:
ruby -v

echo Step 2: Checking if MSYS2 is installed...
where ridk >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo MSYS2/DevKit is not installed or not in PATH
  echo Please run the Ruby installer again and select option 3 - MSYS2 and development toolchain
  echo Or download from: https://github.com/oneclick/rubyinstaller2/releases
  exit /b 1
)

echo Step 3: Installing development toolchain...
echo This will open a MSYS2 terminal window. Please select option 3.
echo When the MSYS2 installation is complete, close the terminal window.
echo.
pause
ridk install 3

echo Step 4: Configuring gem installation to use local compilers...
set MAKE=make
set CC=gcc
set CXX=g++

echo Step 5: Installing racc gem directly...
gem install racc -v 1.7.1

echo Step 6: Cleaning up old bundle files...
if exist Gemfile.lock (
  del Gemfile.lock
  echo Removed Gemfile.lock
)

if exist vendor\ (
  rmdir /s /q vendor
  echo Removed vendor directory
)

echo Step 7: Reinstalling bundle...
bundle install

if %ERRORLEVEL% EQU 0 (
  echo.
  echo ===================================
  echo Installation completed successfully!
  echo You can now run: bundle exec jekyll serve
  echo ===================================
) else (
  echo.
  echo ===================================
  echo Installation encountered issues.
  echo Try running these commands manually:
  echo   ridk enable
  echo   bundle install
  echo ===================================
)
