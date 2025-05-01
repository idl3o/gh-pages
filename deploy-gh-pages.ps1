```powershell
param (
    [switch]$SkipBuild = $false,
    [switch]$Force = $false,
    [string]$Branch = "gh-pages"
)

# Set error action preference to stop on any error
$ErrorActionPreference = "Stop"

Write-Host "===== GitHub Pages Deployment Script =====" -ForegroundColor Green

# Check if git is installed
if (-not (Get-Command "git" -ErrorAction SilentlyContinue)) {
    Write-Host "Error: Git is not installed or not in the PATH" -ForegroundColor Red
    exit 1
}

# Check git status
$gitStatus = git status --porcelain
if ($gitStatus -and -not $Force) {
    Write-Host "Error: There are uncommitted changes in your working directory." -ForegroundColor Red
    Write-Host "Please commit or stash your changes before deploying." -ForegroundColor Red
    Write-Host "Use -Force to override this check (not recommended)." -ForegroundColor Yellow
    exit 1
}

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

# Build the site if not skipping build
if (-not $SkipBuild) {
    Write-Host "Building Jekyll site..." -ForegroundColor Yellow

    # Check Ruby environment
    $env:PATH = 'C:\Ruby27-x64\bin;' + $env:PATH

    # Install dependencies if needed
    if (-not (Test-Path -Path "_site")) {
        Write-Host "Installing dependencies..." -ForegroundColor Yellow
        bundle install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Bundle install failed!" -ForegroundColor Red
            exit 1
        }
    }

    # Build the site
    bundle exec jekyll build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Jekyll build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Jekyll build successful!" -ForegroundColor Green

    # Build TypeScript SDK if it exists
    if (Test-Path -Path "ts") {
        Write-Host "Building TypeScript SDK..." -ForegroundColor Yellow
        Push-Location ts
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-Host "TypeScript build failed!" -ForegroundColor Red
            Pop-Location
            exit 1
        }

        # Copy TypeScript build to _site if it exists
        if (Test-Path -Path "dist") {
            if (-not (Test-Path -Path "../_site/assets/js/ts-sdk")) {
                New-Item -Path "../_site/assets/js/ts-sdk" -ItemType Directory -Force | Out-Null
            }
            Copy-Item -Path "dist/*" -Destination "../_site/assets/js/ts-sdk/" -Recurse -Force
            Write-Host "TypeScript SDK copied to _site/assets/js/ts-sdk/" -ForegroundColor Green
        }

        Pop-Location
    }
}

# Check if _site directory exists
if (-not (Test-Path -Path "_site")) {
    Write-Host "Error: _site directory does not exist. Run with default options to build the site." -ForegroundColor Red
    exit 1
}

# Create a temporary directory for the gh-pages branch
$tempDir = Join-Path -Path $env:TEMP -ChildPath "gh-pages-$(Get-Random)"
Write-Host "Creating temporary directory: $tempDir" -ForegroundColor Yellow
New-Item -Path $tempDir -ItemType Directory -Force | Out-Null

# Copy _site contents to temp directory
Write-Host "Copying _site contents to temporary directory..." -ForegroundColor Yellow
Copy-Item -Path "_site/*" -Destination $tempDir -Recurse -Force

# Copy CNAME file if it exists
if (Test-Path -Path "CNAME") {
    Write-Host "Copying CNAME file..." -ForegroundColor Yellow
    Copy-Item -Path "CNAME" -Destination $tempDir -Force
}

# Initialize git in the temp directory
Write-Host "Initializing git repository in temporary directory..." -ForegroundColor Yellow
Push-Location $tempDir

git init
if ($LASTEXITCODE -ne 0) {
    Write-Host "Git initialization failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

git checkout --orphan $Branch
if ($LASTEXITCODE -ne 0) {
    Write-Host "Git checkout failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "Git add failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Get remote URL from original repo
Pop-Location
$remoteUrl = git config --get remote.origin.url
Push-Location $tempDir

git remote add origin $remoteUrl
if ($LASTEXITCODE -ne 0) {
    Write-Host "Adding remote origin failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

# Commit and push
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
git commit -m "Deploy to GitHub Pages: $timestamp"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Git commit failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "Pushing to $Branch branch..." -ForegroundColor Yellow
git push -f origin $Branch
if ($LASTEXITCODE -ne 0) {
    Write-Host "Git push failed!" -ForegroundColor Red
    Write-Host "Note: If this is the first push, you may need to set up the gh-pages branch on GitHub." -ForegroundColor Yellow
    Pop-Location
    exit 1
}

Pop-Location

# Clean up
Write-Host "Cleaning up temporary directory..." -ForegroundColor Yellow
Remove-Item -Path $tempDir -Recurse -Force

Write-Host "===== Deployment Completed Successfully! =====" -ForegroundColor Green
Write-Host "Your site should now be available at: https://$(git config --get remote.origin.url | ForEach-Object { if ($_ -match "github.com[:/]([^/]+)/([^/.]+)") { "$($Matches[1]).github.io/$($Matches[2])" } else { "your-github-pages-url" } })" -ForegroundColor Cyan
```
