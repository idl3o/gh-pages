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
    Write-Host "Building Jekyll site..." -ForegroundColor Blue

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

Write-Host "Deploying to GitHub Pages..." -ForegroundColor Blue

# Save current branch name
$currentBranch = git rev-parse --abbrev-ref HEAD

# Create temporary branch
git checkout --orphan temp-gh-pages

# Add built files
git add -f _site

# Commit with timestamp
git commit -m "Deploy to GitHub Pages: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Update the branch (force push)
git push origin HEAD:gh-pages --force

# Clean up
git checkout $currentBranch
git branch -D temp-gh-pages

Write-Host "Successfully deployed to GitHub Pages!" -ForegroundColor Green
Write-Host "Your site should be available at https://yourusername.github.io/your-repo-name/" -ForegroundColor Green
```
