# PowerShell script for running commands in Ubuntu Docker container
# This script requires Docker and Docker Compose to be installed

function CheckDocker {
    # Check if Docker is installed and running
    try {
        docker info | Out-Null
        return $true
    } catch {
        Write-Host "Docker is not running or not installed." -ForegroundColor Red
        Write-Host "Please install Docker Desktop and start it before running this script." -ForegroundColor Yellow
        return $false
    }
}

if (-not (CheckDocker)) {
    exit 1
}

# Build the Web version in Ubuntu container
function BuildWeb {
    Write-Host "Building Web version in Ubuntu container..." -ForegroundColor Cyan
    docker-compose exec ubuntu-dev bash -c "cd /app/red_x && make web"
}

# Build the native version in Ubuntu container
function BuildNative {
    Write-Host "Building native version in Ubuntu container..." -ForegroundColor Cyan
    docker-compose exec ubuntu-dev bash -c "cd /app/red_x && make"
}

# Start the web server in Ubuntu container
function StartServer {
    Write-Host "Starting web server in Ubuntu container..." -ForegroundColor Cyan
    docker-compose exec -d ubuntu-dev bash -c "cd /app/red_x && node server.js"
    
    # Wait for the server to start
    Start-Sleep -Seconds 2
    Write-Host "Server should be running at http://localhost:3000" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the script (server will continue running in container)" -ForegroundColor Yellow
}

# Clean the build in Ubuntu container
function CleanBuild {
    Write-Host "Cleaning build in Ubuntu container..." -ForegroundColor Cyan
    docker-compose exec ubuntu-dev bash -c "cd /app/red_x && make clean"
}

# Main script
if (-not (Test-Path -Path "docker-compose.yml")) {
    Write-Host "docker-compose.yml not found in the current directory." -ForegroundColor Red
    exit 1
}

# Start the Docker container if not already running
docker-compose up -d

# Parse command line arguments
param (
    [switch]$BuildWeb,
    [switch]$BuildNative,
    [switch]$StartServer,
    [switch]$CleanBuild,
    [switch]$All
)

if ($All) {
    BuildWeb
    BuildNative
    StartServer
} elseif ($BuildWeb) {
    BuildWeb
} elseif ($BuildNative) {
    BuildNative
} elseif ($StartServer) {
    StartServer
} elseif ($CleanBuild) {
    CleanBuild
} else {
    # Default: show help
    Write-Host "Usage: .\run-ubuntu.ps1 [options]" -ForegroundColor Cyan
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -BuildWeb     : Build the WebAssembly version" -ForegroundColor Gray
    Write-Host "  -BuildNative  : Build the native version" -ForegroundColor Gray
    Write-Host "  -StartServer  : Start the web server" -ForegroundColor Gray
    Write-Host "  -CleanBuild   : Clean the build" -ForegroundColor Gray
    Write-Host "  -All          : Build web, native, and start the server" -ForegroundColor Gray
}
