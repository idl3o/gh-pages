# PowerShell script to run commands in Ubuntu Docker container for Project RED X
# run-ubuntu.ps1

# Ensure Docker is running and the container exists
function Ensure-Container {
    # Check if the container is already running
    $containerRunning = docker-compose ps | Select-String "ubuntu-dev.*Up"

    if ($containerRunning) {
        Write-Host "Docker container is already running." -ForegroundColor Green
    } else {
        Write-Host "Starting Docker container..." -ForegroundColor Yellow
        docker-compose up -d
        Write-Host "Docker container started." -ForegroundColor Green
    }
}

# Command to build the red_x web version
function Build-Web {
    Write-Host "Building web version in Ubuntu environment..." -ForegroundColor Cyan
    docker-compose exec ubuntu-dev bash -c "cd /app/red_x && make web"
    Write-Host "Build completed." -ForegroundColor Green
}

# Command to build the red_x native version
function Build-Native {
    Write-Host "Building native version in Ubuntu environment..." -ForegroundColor Cyan
    docker-compose exec ubuntu-dev bash -c "cd /app/red_x && make"
    Write-Host "Build completed." -ForegroundColor Green
}

# Command to start the server
function Start-PRXServer {
    Write-Host "Starting server in Ubuntu environment..." -ForegroundColor Cyan
    docker-compose exec -d ubuntu-dev bash -c "cd /app/red_x && node server.js"
    Write-Host "Server started at http://localhost:8080" -ForegroundColor Green

    # Open browser automatically
    Start-Process "http://localhost:8080"
}

# Command to clean the project
function Clean-Project {
    Write-Host "Cleaning project in Ubuntu environment..." -ForegroundColor Cyan
    docker-compose exec ubuntu-dev bash -c "cd /app/red_x && make clean"
    Write-Host "Clean completed." -ForegroundColor Green
}

# Command to open a shell in the container
function Open-UbuntuShell {
    Write-Host "Opening shell in Ubuntu environment..." -ForegroundColor Cyan
    docker-compose exec ubuntu-dev bash
}

# Command to stop the Docker container
function Stop-Container {
    Write-Host "Stopping Docker container..." -ForegroundColor Yellow
    docker-compose down
    Write-Host "Docker container stopped." -ForegroundColor Green
}

# Help message
function Show-Help {
    Write-Host "Usage: .\run-ubuntu.ps1 [command]" -ForegroundColor Cyan
    Write-Host "Commands:"
    Write-Host "  build-web    - Build the web version of the project"
    Write-Host "  build-native - Build the native version of the project"
    Write-Host "  start-server - Start the web server and open browser"
    Write-Host "  clean        - Clean the project build files"
    Write-Host "  shell        - Open a shell in the Ubuntu environment"
    Write-Host "  stop         - Stop the Docker container"
    Write-Host "  help         - Show this help message"
    Write-Host ""
}

# Main script execution
Ensure-Container

# Parse command line arguments
$command = $args[0]

if (-not $command) {
    Show-Help
} else {
    switch ($command) {
        "build-web" {
            Build-Web
        }
        "build-native" {
            Build-Native
        }
        "start-server" {
            Start-PRXServer
        }
        "clean" {
            Clean-Project
        }
        "shell" {
            Open-UbuntuShell
        }
        "stop" {
            Stop-Container
        }
        { $_ -in "help","--help","-h" } {
            Show-Help
        }
        default {
            Write-Host "Unknown command: $command" -ForegroundColor Red
            Show-Help
            exit 1
        }
    }
}
