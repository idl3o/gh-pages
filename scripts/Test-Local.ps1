# Test-Local.ps1
# Runs local tests for the project

$ErrorActionPreference = "Stop"

# Script root directory
$scriptRoot = $PSScriptRoot

Write-Host "Starting local test process..." -ForegroundColor Cyan

# Run unit tests
Write-Host "Running unit tests..." -ForegroundColor Cyan
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Unit tests failed" -ForegroundColor Red
} else {
    Write-Host "  √ Unit tests passed" -ForegroundColor Green
}

# Test RED X build if available
if (Test-Path -Path "$scriptRoot\red_x") {
    Write-Host "Testing RED X build..." -ForegroundColor Cyan
    
    # Build web version
    Write-Host "Building RED X web version..." -ForegroundColor Yellow
    & "$scriptRoot\.vscode\tasks.json" "make_web"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: RED X web build had issues" -ForegroundColor Yellow
    } else {
        Write-Host "  √ RED X web build completed" -ForegroundColor Green
    }
    
    # Check if build files exist
    if (Test-Path -Path "$scriptRoot\red_x\index.html" -and 
        Test-Path -Path "$scriptRoot\red_x\index.js" -and 
        Test-Path -Path "$scriptRoot\red_x\index.wasm") {
        Write-Host "  √ RED X build files verified" -ForegroundColor Green
    } else {
        Write-Host "Warning: RED X build files missing or incomplete" -ForegroundColor Yellow
    }
}

# Final message
Write-Host "Local test process completed!" -ForegroundColor Green
