@echo off
echo Loading StreamChain CLI...

REM Run setup first, then start the CLI only if setup succeeds
npm run sxs:setup
IF %ERRORLEVEL% EQU 0 (
    echo Setup completed successfully. Starting CLI...
    npm run sxs:start
) ELSE (
    echo Setup failed with error code %ERRORLEVEL%. CLI will not start.
    exit /b %ERRORLEVEL%
)
