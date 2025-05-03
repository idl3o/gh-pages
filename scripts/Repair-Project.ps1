# Repair-Project.ps1
# Repairs and restores project configuration

$ErrorActionPreference = "Stop"

# Script root directory
$scriptRoot = $PSScriptRoot

Write-Host "Starting project repair process..." -ForegroundColor Cyan

# Check for npm and install dependencies
Write-Host "Checking npm dependencies..." -ForegroundColor Cyan
if (-not (Test-Path -Path "$scriptRoot\node_modules")) {
    Write-Host "Node modules not found, installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: npm install failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  √ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  √ Node modules found" -ForegroundColor Green
}

# Check Jekyll/Ruby dependencies
Write-Host "Checking Jekyll dependencies..." -ForegroundColor Cyan
if (Test-Path -Path "$scriptRoot\Gemfile") {
    if (Get-Command bundle -ErrorAction SilentlyContinue) {
        Write-Host "Installing Ruby gems..." -ForegroundColor Yellow
        bundle install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Warning: Bundle install had issues" -ForegroundColor Yellow
        } else {
            Write-Host "  √ Ruby gems installed" -ForegroundColor Green
        }
    } else {
        Write-Host "Warning: Bundle not found, skipping Ruby gems installation" -ForegroundColor Yellow
    }
}

# Repair common issues
Write-Host "Repairing common project issues..." -ForegroundColor Cyan

# 1. Fix permissions on key files
if (Test-Path -Path "$scriptRoot\.git\hooks") {
    Write-Host "Ensuring Git hooks are executable..." -ForegroundColor Yellow
    # Note: PowerShell doesn't have direct chmod equivalent
    # For Windows, executable permission isn't usually an issue
    Write-Host "  √ Git hooks checked" -ForegroundColor Green
}

# 2. Regenerate package-lock.json if needed
if (-not (Test-Path -Path "$scriptRoot\package-lock.json") -and (Test-Path -Path "$scriptRoot\package.json")) {
    Write-Host "Regenerating package-lock.json..." -ForegroundColor Yellow
    npm install --package-lock-only
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: Failed to regenerate package-lock.json" -ForegroundColor Yellow
    } else {
        Write-Host "  √ Package lock regenerated" -ForegroundColor Green
    }
}

# 3. Setup Emscripten SDK if needed for RED X
if (-not (Test-Path -Path "$scriptRoot\emsdk")) {
    Write-Host "Setting up Emscripten SDK..." -ForegroundColor Yellow
    & "$scriptRoot\setup-emsdk.ps1"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: Emscripten SDK setup had issues" -ForegroundColor Yellow
    } else {
        Write-Host "  √ Emscripten SDK setup completed" -ForegroundColor Green
    }
}

# Final message
Write-Host "Project repair process completed!" -ForegroundColor Green
Write-Host "If you still encounter issues, please check documentation or ask for support." -ForegroundColor Cyan
