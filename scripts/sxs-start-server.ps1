# SxS Start Server Script
# Used by SxS CLI to start the PRX server
# Created: April 26, 2025

param (
    [int]$Port = 8080,
    [string]$Mode = "normal"
)

$ErrorActionPreference = "Stop"

Write-Host "Starting Project RED X server..." -ForegroundColor Cyan
Write-Host "Server Mode: $Mode" -ForegroundColor Cyan
Write-Host "Port: $Port" -ForegroundColor Cyan

# Set environment variables based on mode
if ($Mode -eq "afk") {
    $env:RED_X_MODE = "afk"
    $env:RED_X_TITLE = "AFK Downloader Hub"
    $env:RED_X_STARTUP_PAGE = "afk-downloader.html"
}
else {
    $env:RED_X_MODE = "normal"
    $env:RED_X_TITLE = "Project RED X"
    $env:RED_X_STARTUP_PAGE = "index.html"
}

# Set port
$env:PORT = $Port

try {
    # Change to the directory containing this script
    Push-Location $PSScriptRoot

    # Check if server.js exists
    if (-not (Test-Path -Path "server.js")) {
        Write-Host "Error: server.js not found in current directory" -ForegroundColor Red
        exit 1
    }

    Write-Host "Starting node.js server..." -ForegroundColor Cyan
    node server.js

    # This will only execute if the server exits normally
    Write-Host "Server stopped" -ForegroundColor Yellow
    exit 0
}
catch {
    Write-Host "Error starting server: $_" -ForegroundColor Red
    exit 1
}
finally {
    Pop-Location
}
