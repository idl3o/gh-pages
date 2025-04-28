# PowerShell direct execution script for building RED X
$ErrorActionPreference = "Stop"
$VerbosePreference = "Continue"

# Set up logging
$logFile = Join-Path -Path $PSScriptRoot -ChildPath "build_log.txt"
Start-Transcript -Path $logFile -Force

try {
    Write-Host "Starting RED X build process..." -ForegroundColor Cyan
    Write-Host "Logging output to $logFile" -ForegroundColor Cyan
    Write-Host "================================================" -ForegroundColor Cyan

    # Run the main script with build parameter
    & "$PSScriptRoot\Run-RedX.ps1" -Mode build -Verbose

    # Check for executable
    if (Test-Path -Path "$PSScriptRoot\red_x.exe") {
        Write-Host "BUILD SUCCESSFUL!" -ForegroundColor Green
        Write-Host "Executable created at: $PSScriptRoot\red_x.exe" -ForegroundColor Green
    } else {
        Write-Host "BUILD FAILED - Executable not found" -ForegroundColor Red
    }
}
catch {
    Write-Host "Error during build: $_" -ForegroundColor Red
}
finally {
    Write-Host "================================================" -ForegroundColor Cyan
    Write-Host "Build process completed. Press Enter to exit..." -ForegroundColor Cyan
    Stop-Transcript
    Read-Host
}
