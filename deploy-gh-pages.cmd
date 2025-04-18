@echo off
echo Building static version for GitHub Pages...

:: Create static build directory
set BUILD_DIR=.\build
if not exist %BUILD_DIR% mkdir %BUILD_DIR%

:: Create assets directory structure
if not exist %BUILD_DIR%\assets mkdir %BUILD_DIR%\assets
if not exist %BUILD_DIR%\assets\css mkdir %BUILD_DIR%\assets\css
if not exist %BUILD_DIR%\assets\js mkdir %BUILD_DIR%\assets\js
if not exist %BUILD_DIR%\assets\images mkdir %BUILD_DIR%\assets\images

:: Copy HTML files
echo Copying HTML files...
copy /Y index.html %BUILD_DIR%\
if exist streaming.html copy /Y streaming.html %BUILD_DIR%\
if exist 404.html copy /Y 404.html %BUILD_DIR%\
if exist url-launcher.html copy /Y url-launcher.html %BUILD_DIR%\
if exist team.html copy /Y team.html %BUILD_DIR%\
if exist status.html copy /Y status.html %BUILD_DIR%\
if exist creator-dashboard.html copy /Y creator-dashboard.html %BUILD_DIR%\
if exist governance-visualization.html copy /Y governance-visualization.html %BUILD_DIR%\
if exist ranking-power.html copy /Y ranking-power.html %BUILD_DIR%\
if exist ai-companion.html copy /Y ai-companion.html %BUILD_DIR%\

:: Copy Markdown files (for Jekyll processing)
echo Copying Markdown files...
for %%f in (*.md) do copy /Y %%f %BUILD_DIR%\

:: Copy Jekyll config
if exist _config.yml copy /Y _config.yml %BUILD_DIR%\

:: Copy assets
echo Copying assets...
if exist assets\css\*.css copy /Y assets\css\*.css %BUILD_DIR%\assets\css\
if exist assets\js\*.js copy /Y assets\js\*.js %BUILD_DIR%\assets\js\
if exist assets\images\*.* copy /Y assets\images\*.* %BUILD_DIR%\assets\images\
if exist main.css copy /Y main.css %BUILD_DIR%\assets\css\

:: Copy smart contract files
echo Copying smart contracts...
if exist Streaming.sol copy /Y Streaming.sol %BUILD_DIR%\
if exist StreamToken.sol copy /Y StreamToken.sol %BUILD_DIR%\
if exist StreamPayment.sol copy /Y StreamPayment.sol %BUILD_DIR%\
if exist StreamAccessContract.sol copy /Y StreamAccessContract.sol %BUILD_DIR%\

:: Create a minimal package.json for GitHub Pages
echo Creating package.json...
echo { > %BUILD_DIR%\package.json
echo   "name": "web3-core-functionality", >> %BUILD_DIR%\package.json
echo   "version": "1.0.0", >> %BUILD_DIR%\package.json
echo   "private": true, >> %BUILD_DIR%\package.json
echo   "dependencies": {} >> %BUILD_DIR%\package.json
echo } >> %BUILD_DIR%\package.json

:: Create .nojekyll file to prevent Jekyll processing
echo Creating .nojekyll file...
type nul > %BUILD_DIR%\.nojekyll

:: Create CNAME file
echo www.web3streaming.example > %BUILD_DIR%\CNAME

:: Create _headers file for Cloudflare/Netlify edge caching
echo Creating edge headers file...
(
echo # All pages
echo /*
echo   X-Frame-Options: DENY
echo   X-Content-Type-Options: nosniff
echo   Referrer-Policy: strict-origin-when-cross-origin
echo   Permissions-Policy: camera=^(^), microphone=^(^), geolocation=^(^)
echo   Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.socket.io; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.cloudflare.com wss://*.cloudflare.com; worker-src 'self' blob:;
echo.
echo # WebAssembly specific headers
echo /*.wasm
echo   Content-Type: application/wasm
echo   Cache-Control: public, max-age=86400
echo.
echo # API responses should not be cached
echo /api/*
echo   Cache-Control: no-cache
) > %BUILD_DIR%\_headers

:: Create redirects file
echo Creating redirects file...
(
echo # Netlify/Vercel Edge Functions redirects
echo /api/*  /.netlify/functions/api-handler  200
) > %BUILD_DIR%\_redirects

echo Static build complete! Files are in the ./build directory.
echo.
echo To deploy to GitHub Pages:
echo 1. Create a gh-pages branch
echo 2. Copy the contents of the build directory to the gh-pages branch
echo 3. Push the gh-pages branch to GitHub
echo.
echo Or with npm:
echo npm install -g gh-pages ^&^& gh-pages -d build
echo.

echo Would you like to deploy to GitHub Pages now? (Y/N)
set /p DEPLOY_CHOICE=

if /i "%DEPLOY_CHOICE%"=="Y" (
  where npm >nul 2>nul
  if %ERRORLEVEL% NEQ 0 (
    echo Error: npm not found. Please install Node.js and npm.
    exit /b 1
  )

  echo Installing gh-pages package...
  npm install -g gh-pages

  echo Deploying to GitHub Pages...
  gh-pages -d build

  if %ERRORLEVEL% NEQ 0 (
    echo Deployment failed.
    exit /b 1
  ) else (
    echo Deployment successful! Your site should be available shortly at:
    echo https://^<your-username^>.github.io/web3-core-functionality/
    echo.
    echo Remember to update the CNAME file with your actual domain if you're using a custom domain.
  )
) else (
  echo Deployment skipped. You can deploy manually later.
)

exit /b 0
