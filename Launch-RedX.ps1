# Launch-RedX.ps1
# Easy launcher script for Project RED X
# Created: April 25, 2025

# Script directory
$scriptDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$redXDir = Join-Path -Path $scriptDir -ChildPath "red_x"

function Show-Menu {
    Clear-Host
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host "              PROJECT RED X LAUNCHER           " -ForegroundColor Cyan
    Write-Host "===============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Launch RED X Web Version" -ForegroundColor White
    Write-Host "2. Launch RED X Native Version" -ForegroundColor White
    Write-Host "3. Launch AFK Downloading Hub" -ForegroundColor Yellow
    Write-Host "4. Developer Mode (with auto-reload)" -ForegroundColor Magenta
    Write-Host "5. Build Web Version" -ForegroundColor Green
    Write-Host "6. Build Native Version" -ForegroundColor Green
    Write-Host "7. Launch Custom Server (specify port)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "X. Exit" -ForegroundColor Red
    Write-Host ""
    Write-Host "Select an option: " -ForegroundColor Cyan -NoNewline
}

function Start-RedXRunner {
    param$VerboseParam = $false
    )

    $runnerPath = Join-Path -Path $redXDir -ChildPath "Run-RedX.ps1"

    if (-not (Test-Path -Path $runnerPath)) {
        Write-Host "Error: Run-RedX.ps1 script not found at $runnerPath" -ForegroundColor Red
        Write-Host "Press any key to continue..."
        $null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        return
    }

    $params = @("-Mode", $Mode)

    if ($Port -ne 8080) {
        $params += @("-Port", $Port)
    }

    if ($Verbose) {
        $params += "-Verbose"
    }

    & $runnerPath @params
}

# Main script loop
do {
    Show-Menu
    $selection = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    $key = $selection.Character.ToString().ToUpper()

    switch ($key) {
        "1" {
            Write-Host "`nLaunching RED X Web Version..." -ForegroundColor Cyan
            Start-RedXRunner -Mode "web" -Verbose
        }
        "2" {
            Write-Host "`nLaunching RED X Native Version..." -ForegroundColor Cyan
            Start-RedXRunner -Mode "native" -Verbose
        }
        "3" {
            Write-Host "`nLaunching AFK Downloading Hub..." -ForegroundColor Yellow
            Start-RedXRunner -Mode "afk" -Verbose
        }
        "4" {
            Write-Host "`nStarting Developer Mode..." -ForegroundColor Magenta
            Start-RedXRunner -Mode "dev" -Verbose
        }
        "5" {
            Write-Host "`nBuilding Web Version..." -ForegroundColor Green
            & "$redXDir\Run-RedX.ps1" -Mode "web" -Verbose -NoWindow
            Write-Host "Build completed. Press any key to continue..."
            $null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "6" {
            Write-Host "`nBuilding Native Version..." -ForegroundColor Green
            & "$redXDir\Run-RedX.ps1" -Mode "native" -Verbose -NoWindow
            Write-Host "Build completed. Press any key to continue..."
            $null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
        "7" {
            Write-Host "`nEnter port number (default: 8080): " -ForegroundColor Cyan -NoNewline
            $portInput = Read-Host

            if (-not [string]::IsNullOrWhiteSpace($portInput)) {
                $portNumber = 0
                if ([int]::TryParse($portInput, [ref]$portNumber) -and $portNumber -gt 0 -and $portNumber -lt 65536) {
                    Write-Host "Starting server on port $portNumber..." -ForegroundColor Cyan
                    Start-RedXRunner -Mode "server" -Port $portNumber -Verbose
                } else {
                    Write-Host "Invalid port number. Press any key to continue..." -ForegroundColor Red
                    $null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
                }
            } else {
                Write-Host "Using default port 8080..." -ForegroundColor Cyan
                Start-RedXRunner -Mode "server" -Verbose
            }
        }
        "X" {
            Write-Host "`nExiting..." -ForegroundColor Red
            exit
        }
        default {
            Write-Host "`nInvalid selection. Press any key to continue..." -ForegroundColor Red
            $null = $host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        }
    }
} while ($true)

