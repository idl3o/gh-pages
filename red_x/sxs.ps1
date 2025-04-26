# SxS CLI PowerShell Launcher
# Cross-platform script that launches the appropriate RED X runtime
# Created: April 26, 2025

param (
    [Parameter(Mandatory = $false)]
    [ValidateSet("web", "native", "server", "dev", "afk")]
    [string]$Mode = "web",

    [Parameter(Mandatory = $false)]
    [switch]$NoWindow = $false,

    [Parameter(Mandatory = $false)]
    [int]$Port = 8080,

    [Parameter(Mandatory = $false)]
    [switch]$Verbose = $false,

    [Parameter(Mandatory = $false)]
    [switch]$Help = $false
)

function Show-Help {
    Write-Host "SxS CLI - Cross-platform launcher for RED X"
    Write-Host ""
    Write-Host "Usage: ./sxs.ps1 [options]"
    Write-Host ""
    Write-Host "Options:"
    Write-Host "  -Mode <mode>      Select mode: web, native, server, dev, afk (default: web)"
    Write-Host "  -NoWindow         Don't open a new terminal window for the server"
    Write-Host "  -Port <port>      Set server port (default: 8080)"
    Write-Host "  -Verbose          Enable verbose output"
    Write-Host "  -Help             Show this help message"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  ./sxs.ps1                    # Run in web mode with default settings"
    Write-Host "  ./sxs.ps1 -Mode server -Port 3000  # Run in server mode on port 3000"
    Write-Host "  ./sxs.ps1 -Mode native       # Run in native mode"
    Write-Host ""
}

# Check for help flag
if ($Help) {
    Show-Help
    exit 0
}

# Get script directory
$scriptDir = $PSScriptRoot
if (-not $scriptDir) {
    $scriptDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
}

# Main execution
$redXScript = Join-Path -Path $scriptDir -ChildPath "Run-RedX.ps1"

if (Test-Path $redXScript) {
    $arguments = @{
        Mode = $Mode
        Port = $Port
    }

    if ($NoWindow) {
        $arguments.Add("NoWindow", $true)
    }

    if ($Verbose) {
        $arguments.Add("Verbose", $true)
    }

    # Execute the Run-RedX.ps1 script with the provided parameters
    & $redXScript @arguments
}
else {
    Write-Host "Error: Could not find Run-RedX.ps1 in $scriptDir" -ForegroundColor Red
    exit 1
}
