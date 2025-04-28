# SxS Build Web Script
# Used by SxS CLI to build the PRX web version
# Created: April 26, 2025

$ErrorActionPreference = "Stop"

$workspaceFolder = Split-Path -Parent -Path $PSScriptRoot
$emsdkDir = Join-Path -Path $workspaceFolder -ChildPath "emsdk"

Write-Host "Building PRX web version..." -ForegroundColor Cyan
Write-Host "Workspace: $workspaceFolder"
Write-Host "EMSDK: $emsdkDir"

if (-not (Test-Path -Path $emsdkDir)) {
    Write-Host "Error: Emscripten SDK not found at $emsdkDir" -ForegroundColor Red
    Write-Host "Please run the setup_emsdk task first." -ForegroundColor Yellow
    exit 1
}

try {
    # Activate Emscripten environment
    Write-Host "Activating Emscripten environment..." -ForegroundColor Cyan
    & "$emsdkDir\emsdk_env.bat"

    # Change to red_x directory
    Push-Location $PSScriptRoot
    Write-Host "Changed directory to: $(Get-Location)" -ForegroundColor DarkGray

    # Run make web
    Write-Host "Running 'make web'..." -ForegroundColor Cyan
    make web

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: make web failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }

    Write-Host "Web build completed successfully!" -ForegroundColor Green
    exit 0
}
catch {
    Write-Host "Error during web build: $_" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
