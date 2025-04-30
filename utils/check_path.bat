@echo off
setlocal enabledelayedexpansion

echo ===== Development Environment PATH Checker =====
echo.

REM Check for Ruby
echo Checking for Ruby in PATH...
where ruby >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  for /f "tokens=*" %%i in ('where ruby') do (
    echo [FOUND] Ruby: %%i
    for /f "tokens=*" %%v in ('ruby -v') do echo    Version: %%v
  )
) else (
  echo [MISSING] Ruby is not in PATH
)

REM Check for Gem
echo.
echo Checking for Gem in PATH...
where gem >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  for /f "tokens=*" %%i in ('where gem') do (
    echo [FOUND] Gem: %%i
    for /f "tokens=*" %%v in ('gem -v') do echo    Version: %%v
  )
) else (
  echo [MISSING] Gem is not in PATH
)

REM Check for Bundler
echo.
echo Checking for Bundler in PATH...
where bundle >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  for /f "tokens=*" %%i in ('where bundle') do (
    echo [FOUND] Bundler: %%i
    for /f "tokens=*" %%v in ('bundle -v') do echo    Version: %%v
  )
) else (
  echo [MISSING] Bundler is not in PATH
)

REM Check for Jekyll
echo.
echo Checking for Jekyll in PATH...
where jekyll >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  for /f "tokens=*" %%i in ('where jekyll') do (
    echo [FOUND] Jekyll: %%i
    for /f "tokens=*" %%v in ('jekyll -v') do echo    Version: %%v
  )
) else (
  echo [MISSING] Jekyll is not in system PATH

  echo Checking Jekyll with bundle exec...
  call bundle exec jekyll -v >nul 2>&1
  if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%v in ('call bundle exec jekyll -v') do echo    [BUNDLED] %%v
    echo    Jekyll is available through Bundler but not directly in PATH
  ) else (
    echo    [NOT FOUND] Jekyll is not available through Bundler either
  )
)

REM Check for Python
echo.
echo Checking for Python in PATH...
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  for /f "tokens=*" %%i in ('where python') do (
    echo [FOUND] Python: %%i
    for /f "tokens=*" %%v in ('python --version') do echo    Version: %%v
  )
) else (
  echo [MISSING] Python is not in PATH
)

REM Check for Pip
echo.
echo Checking for Pip in PATH...
where pip >nul 2>&1
if %ERRORLEVEL% EQU 0 (
  for /f "tokens=*" %%i in ('where pip') do (
    echo [FOUND] Pip: %%i
    for /f "tokens=*" %%v in ('pip --version') do echo    Version: %%v
  )
) else (
  echo [MISSING] Pip is not in PATH
  echo    Check if Python Scripts directory is in PATH: C:\Users\Sam\AppData\Roaming\Python\Python313\Scripts
)

echo.
echo ===== Current PATH Environment Variable =====
echo.
echo %PATH%
echo.
echo ============================================

echo.
echo ===== Recommendations =====

if %ERRORLEVEL% NEQ 0 (
  echo For Jekyll: Run these commands to install Jekyll:
  echo    gem install jekyll bundler
  echo    bundle install
  echo    bundle exec jekyll -v
)

if not exist "%APPDATA%\Python\Python313\Scripts" (
  echo For Python: Add Python Scripts to PATH:
  echo    setx PATH "%%PATH%%;C:\Users\Sam\AppData\Roaming\Python\Python313\Scripts"
)

echo.
echo To use Jekyll with this project, always run:
echo    bundle exec jekyll serve
echo.
