@echo off
setlocal enabledelayedexpansion
title Web3 Crypto Streaming Service - Configuration Tool
echo Web3 Crypto Streaming Service Configuration Tool
echo ================================================

if "%~1"=="" (
  echo Available commands:
  echo   get ^<path^>          - Get a configuration value
  echo   set ^<path^> ^<value^> - Set a configuration value
  echo   list                - List all configuration
  echo   env [environment]   - Show environment configuration
  echo   features           - List all feature flags
  echo.
  echo Examples:
  echo   run-cfig get ui.theme
  echo   run-cfig set ui.theme dark
  echo   run-cfig env production
  set /p COMMAND=Enter command:
  call npm run cfig !COMMAND!
) else (
  call npm run cfig %*
)
pause
endlocal
