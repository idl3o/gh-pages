# PowerShell script for deploying to GitHub Pages
# deploy-gh-pages.ps1

$ErrorActionPreference = "Stop"

Write-Host "Building static version for GitHub Pages..." -ForegroundColor Cyan

# Make sure we're in the right directory
Set-Location -Path $PSScriptRoot

# Create static build directory
$BUILD_DIR = "./_site"
if (-not (Test-Path -Path $BUILD_DIR)) {
  New-Item -ItemType Directory -Path $BUILD_DIR | Out-Null
}

# Create assets directory structure in build
New-Item -ItemType Directory -Path "$BUILD_DIR/assets/css" -Force | Out-Null
New-Item -ItemType Directory -Path "$BUILD_DIR/assets/js" -Force | Out-Null
New-Item -ItemType Directory -Path "$BUILD_DIR/assets/images" -Force | Out-Null

# Copy root HTML files
Copy-Item -Path "index.html" -Destination "$BUILD_DIR/" -ErrorAction SilentlyContinue
Copy-Item -Path "404.html" -Destination "$BUILD_DIR/" -ErrorAction SilentlyContinue
Copy-Item -Path "url-launcher.html" -Destination "$BUILD_DIR/" -ErrorAction SilentlyContinue
Copy-Item -Path "team.html" -Destination "$BUILD_DIR/" -ErrorAction SilentlyContinue
Copy-Item -Path "status.html" -Destination "$BUILD_DIR/" -ErrorAction SilentlyContinue
Copy-Item -Path "streaming.html" -Destination "$BUILD_DIR/" -ErrorAction SilentlyContinue
Copy-Item -Path "creator-dashboard.html" -Destination "$BUILD_DIR/" -ErrorAction SilentlyContinue
Copy-Item -Path "governance-visualization.html" -Destination "$BUILD_DIR/" -ErrorAction SilentlyContinue
Copy-Item -Path "ranking-power.html" -Destination "$BUILD_DIR/" -ErrorAction SilentlyContinue
Copy-Item -Path "ai-companion.html" -Destination "$BUILD_DIR/" -ErrorAction SilentlyContinue

# Copy Markdown files (for Jekyll processing)
Copy-Item -Path "*.md" -Destination "$BUILD_DIR/" -ErrorAction SilentlyContinue

# Copy Jekyll config
Copy-Item -Path "_config.yml" -Destination "$BUILD_DIR/" -ErrorAction SilentlyContinue

# Copy assets
if (Test-Path -Path "assets/css") {
  Copy-Item -Path "assets/css/*" -Destination "$BUILD_DIR/assets/css/" -Recurse -ErrorAction SilentlyContinue
}
if (Test-Path -Path "assets/js") {
  Copy-Item -Path "assets/js/*" -Destination "$BUILD_DIR/assets/js/" -Recurse -ErrorAction SilentlyContinue
}
if (Test-Path -Path "assets/images") {
  Copy-Item -Path "assets/images/*" -Destination "$BUILD_DIR/assets/images/" -Recurse -ErrorAction SilentlyContinue
}

# Copy any smart contracts
Copy-Item -Path "Streaming.sol" -Destination "$BUILD_DIR/" -ErrorAction SilentlyContinue
if (Test-Path -Path "StreamToken.sol") {
  Copy-Item -Path "StreamToken.sol" -Destination "$BUILD_DIR/"
}
if (Test-Path -Path "StreamPayment.sol") {
  Copy-Item -Path "StreamPayment.sol" -Destination "$BUILD_DIR/"
}
if (Test-Path -Path "StreamAccessContract.sol") {
  Copy-Item -Path "StreamAccessContract.sol" -Destination "$BUILD_DIR/"
}

# Check if npm is available
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  Write-Host "Error: npm not found. Please install Node.js and npm." -ForegroundColor Red
  exit 1
}

# Check if Emscripten is available - First try direct command
$emccAvailable = $false
try {
  $emccPath = Join-Path -Path $PSScriptRoot -ChildPath "emsdk\upstream\emscripten\emcc.bat"
  if (Test-Path $emccPath) {
    $emccAvailable = $true
  }
  else {
    # Try to find emcc in PATH
    $emcc = Get-Command emcc -ErrorAction SilentlyContinue
    if ($emcc) {
      $emccAvailable = $true
    }
  }
}
catch {
  $emccAvailable = $false
}

if (-not $emccAvailable) {
  Write-Host "Error: Emscripten compiler (emcc) not found." -ForegroundColor Red
  Write-Host "Please install Emscripten or make sure it's in your PATH." -ForegroundColor Red
  Write-Host "Attempting to activate emsdk automatically..." -ForegroundColor Yellow

  $emsdkPath = Join-Path -Path $PSScriptRoot -ChildPath "emsdk"
  if (Test-Path $emsdkPath) {
    Write-Host "Found emsdk, activating environment..." -ForegroundColor Cyan
    Push-Location $emsdkPath
    & .\emsdk_env.bat
    Pop-Location
  }
  else {
    Write-Host "emsdk not found. Please run the setup_emsdk task first." -ForegroundColor Red
    exit 1
  }
}

# Create a minimal package.json for GitHub Pages in the build directory
@'
{
  "name": "web3-core-functionality",
  "version": "1.0.0",
  "private": true,
  "dependencies": {}
}
'@ | Out-File -FilePath "$BUILD_DIR/package.json" -Encoding utf8

# Build the Red X web version
Push-Location "red_x"

# Make sure required JavaScript libraries are available
Write-Host "Checking for required npm packages..." -ForegroundColor Cyan
if (-not (Test-Path -Path "node_modules")) {
  Write-Host "Installing npm packages..." -ForegroundColor Cyan
  npm install --no-optional
  if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install failed" -ForegroundColor Red
    exit 1
  }
}

# Create a fallback template.html if needed
if ((-not (Test-Path -Path "template.html")) -and (Test-Path -Path "index.html")) {
  Copy-Item -Path "index.html" -Destination "template.html"
  # Remove any server-dependent references
    (Get-Content -Path "template.html") -replace '/api/version', '#' | Set-Content -Path "template.html"
    (Get-Content -Path "template.html") -replace '/socket.io/socket.io.js', 'https://cdn.socket.io/4.5.0/socket.io.min.js' | Set-Content -Path "template.html"
}

Write-Host "Building Red X WebAssembly..." -ForegroundColor Cyan
# Activate emsdk environment
$emsdkPath = Join-Path -Path $PSScriptRoot -ChildPath "emsdk"
if (Test-Path $emsdkPath) {
  # Source the emsdk_env.bat to set up environment variables
  & "$emsdkPath\emsdk_env.bat" | Out-Null
}

# Build using emcc
$emccPath = Join-Path -Path $PSScriptRoot -ChildPath "emsdk\upstream\emscripten\emcc.bat"
if (Test-Path $emccPath) {
  & $emccPath main.c -o index.html -s USE_SDL=2 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 `
    --shell-file template.html -s NO_EXIT_RUNTIME=1 -s "EXPORTED_RUNTIME_METHODS=cwrap" `
    -s ENVIRONMENT=web -s MODULARIZE=1 -s "EXPORT_NAME=RedXModule"
}
else {
  # Fall back to PATH-based emcc
  emcc main.c -o index.html -s USE_SDL=2 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 `
    --shell-file template.html -s NO_EXIT_RUNTIME=1 -s "EXPORTED_RUNTIME_METHODS=cwrap" `
    -s ENVIRONMENT=web -s MODULARIZE=1 -s "EXPORT_NAME=RedXModule"
}

if ($LASTEXITCODE -ne 0) {
  Write-Host "Build failed" -ForegroundColor Red
  Pop-Location
  exit 1
}

# Create static version directory
New-Item -ItemType Directory -Path "../_site/red_x" -Force | Out-Null

# Copy necessary files
Copy-Item -Path "index.html" -Destination "../_site/red_x/"
Copy-Item -Path "index.js" -Destination "../_site/red_x/"
Copy-Item -Path "index.wasm" -Destination "../_site/red_x/"

# Copy test deployment file if it exists
if (Test-Path -Path "deployment_test.html") {
  Write-Host "Copying deployment test file..." -ForegroundColor Cyan
  Copy-Item -Path "deployment_test.html" -Destination "../_site/red_x/"
}

# Copy copyright information in machine language
New-Item -ItemType Directory -Path "../_site/red_x/legal" -Force | Out-Null
Copy-Item -Path "COPYRIGHT.*" -Destination "../_site/red_x/legal/" -ErrorAction SilentlyContinue

# Make sure the js directory exists before copying
if (Test-Path -Path "js") {
  New-Item -ItemType Directory -Path "../_site/red_x/js" -Force | Out-Null
  Copy-Item -Path "js/*" -Destination "../_site/red_x/js/" -Recurse
}
else {
  New-Item -ItemType Directory -Path "../_site/red_x/js" -Force | Out-Null
  # Create minimal required JS files
  "// Fallback file created by deployment script" | Out-File -FilePath "../_site/red_x/js/link-extractor.js" -Encoding utf8

  # Create a simple link extractor
  @'
class LinkExtractor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container element with ID "${containerId}" not found`);
    }
  }
  async loadLinks(txtFilePath) {
    try {
      const response = await fetch(txtFilePath);
      if (!response.ok) { throw new Error(`Failed to load ${txtFilePath}`); }
      const content = await response.text();
      this.parseAndDisplay(content);
    } catch (error) {
      console.error('Error loading links:', error);
      this.container.innerHTML = `<p class="error">Failed to load links</p>`;
      this.useFallbackData();
    }
  }
  useFallbackData() {
    const fallbackData = `# GitHub Pages Fallback Links\n\n## WebAssembly Resources\n<a href="https://developer.mozilla.org/en-US/docs/WebAssembly">WebAssembly Documentation</a>\n<a href="https://emscripten.org/">Emscripten</a>`;
    this.parseAndDisplay(fallbackData);
  }
  parseAndDisplay(content) {
    this.container.innerHTML = '<p>Static GitHub Pages version - links loaded</p>';
    const sections = content.split(/^## /m);
    sections.forEach(section => {
      if (section.trim()) {
        const div = document.createElement('div');
        div.className = 'link-section';
        div.innerHTML = section;
        this.container.appendChild(div);
      }
    });
  }
}
if (typeof window !== 'undefined') { window.LinkExtractor = LinkExtractor; }
'@ | Out-File -FilePath "../_site/red_x/js/link-extractor.js" -Encoding utf8
}

# Copy links file if it exists
if (Test-Path -Path "../wub-links.txt") {
  Copy-Item -Path "../wub-links.txt" -Destination "../_site/"
}
else {
  # Create a simple fallback file
  @'
# WUB Links (Fallback)

## Resources
<a href="https://developer.mozilla.org/en-US/docs/WebAssembly">WebAssembly Documentation</a>
'@ | Out-File -FilePath "../_site/wub-links.txt" -Encoding utf8
}

# Create .nojekyll file to prevent Jekyll processing
"" | Out-File -FilePath "../_site/.nojekyll" -Encoding utf8 -NoNewline

# Create _headers file for Cloudflare/Netlify edge caching
@'
# All pages
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.socket.io; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.cloudflare.com wss://*.cloudflare.com; worker-src 'self' blob:;

# WebAssembly specific headers
/*.wasm
  Content-Type: application/wasm
  Cache-Control: public, max-age=86400

# API responses should not be cached
/api/*
  Cache-Control: no-cache
'@ | Out-File -FilePath "../_site/_headers" -Encoding utf8

# Write edge functions redirects file for Netlify/Vercel
@'
# Netlify/Vercel Edge Functions redirects
/api/*  /.netlify/functions/api-handler  200
'@ | Out-File -FilePath "../_site/_redirects" -Encoding utf8

# Create a CNAME file if needed (customize domain here)
"www.web3streaming.example" | Out-File -FilePath "../_site/CNAME" -Encoding utf8 -NoNewline

# Automated GitHub Pages deployment
Write-Host "Deploying to GitHub Pages..." -ForegroundColor Cyan
$gitAvailable = Get-Command git -ErrorAction SilentlyContinue
if ($gitAvailable) {
  # Check if gh-pages branch exists
  $ghPagesBranchExists = git branch --list gh-pages
  if (-not $ghPagesBranchExists) {
    Write-Host "Creating gh-pages branch..." -ForegroundColor Cyan
    git checkout --orphan gh-pages
    git rm -rf .
    "" | Out-File -FilePath ".nojekyll" -Encoding utf8 -NoNewline
    git add .nojekyll
    git commit -m "Initialize gh-pages branch"
    git push origin gh-pages
    git checkout -
  }

  # Deploy to GitHub Pages using git worktree
  Write-Host "Deploying build to gh-pages branch..." -ForegroundColor Cyan
  # Clean up any existing worktree
  if (Test-Path -Path ".git/worktrees/gh-pages") {
    Remove-Item -Path ".git/worktrees/gh-pages" -Recurse -Force
  }

  git worktree add -f gh-pages gh-pages
  if (Test-Path -Path "gh-pages") {
    # Remove all files in gh-pages but keep .git
    Get-ChildItem -Path "gh-pages" -Exclude .git | Remove-Item -Recurse -Force
    # Copy build files to gh-pages
    Copy-Item -Path "_site/*" -Destination "gh-pages/" -Recurse -Force

    Push-Location "gh-pages"
    git add --all
    git commit -m "Deploy to GitHub Pages: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git push origin gh-pages
    Pop-Location
    git worktree remove gh-pages
    Write-Host "Successfully deployed to GitHub Pages!" -ForegroundColor Green
  }
  else {
    Write-Host "Failed to create git worktree for gh-pages branch." -ForegroundColor Red
  }
}
else {
  Write-Host "Git not available, skipping automatic deployment." -ForegroundColor Yellow
  Write-Host "Static build complete! Files are in the ./_site directory." -ForegroundColor Green
}

Pop-Location

Write-Host ""
Write-Host "To manually deploy to GitHub Pages:" -ForegroundColor Cyan
Write-Host "1. Create a gh-pages branch (if not already created)"
Write-Host "2. Copy the contents of the _site directory to the gh-pages branch"
Write-Host "3. Push the gh-pages branch to GitHub"
Write-Host ""
Write-Host "Or use gh-pages npm package with: npm install -g gh-pages && gh-pages -d _site"
