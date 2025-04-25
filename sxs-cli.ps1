# SXS CLI - Simple eXtensible Shell
# A PowerShell-based CLI for project management

function Show-SXSHeader {
    Write-Host ""
    Write-Host "§§§§§  ✧✧✧✧✧  §§§§§" -ForegroundColor Cyan
    Write-Host "§      ✧   ✧  §   §" -ForegroundColor Cyan
    Write-Host "§§§§§  ✧   ✧  §§§§§" -ForegroundColor Cyan
    Write-Host "    §  ✧   ✧  §   §" -ForegroundColor Cyan
    Write-Host "§§§§§  ✧✧✧✧✧  §   §" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Simple eXtensible Shell (SXS) v1.0.0" -ForegroundColor Yellow
    Write-Host "Type 'help' to see available commands" -ForegroundColor Gray
    Write-Host ""
}

function Show-Help {
    Write-Host "Available commands:" -ForegroundColor Yellow
    Write-Host "  help         - Show this help menu" -ForegroundColor Gray
    Write-Host "  clear        - Clear the console" -ForegroundColor Gray
    Write-Host "  exit         - Exit SXS CLI" -ForegroundColor Gray
    Write-Host "  status       - Show current branch and status" -ForegroundColor Gray
    Write-Host "  build        - Build the project (web or native)" -ForegroundColor Gray
    Write-Host "  clean        - Clean build artifacts" -ForegroundColor Gray
    Write-Host "  server       - Start the development server" -ForegroundColor Gray
    Write-Host "  deploy       - Deploy to GitHub Pages" -ForegroundColor Gray
    Write-Host "  branch info  - Show branch information" -ForegroundColor Gray
    Write-Host "  branch main  - Switch to main branch" -ForegroundColor Gray
    Write-Host "  branch docs  - Switch to docs branch" -ForegroundColor Gray
    Write-Host "  branch sync  - Sync all branches" -ForegroundColor Gray
    Write-Host ""
}

function Invoke-TaskRunner {
    param (
        [string]$TaskName
    )

    $workspaceFolder = "c:\Users\Sam\Documents\GitHub\gh-pages"

    # Map commands to VS Code tasks
    switch ($TaskName) {
        "build web" {
            Write-Host "Building web version..." -ForegroundColor Cyan
            Start-Process powershell -ArgumentList "-Command", "& {`$emsdkDir = Join-Path -Path '$workspaceFolder' -ChildPath 'emsdk'; if (Test-Path -Path `$emsdkDir) { & '`$emsdkDir\emsdk_env.bat' | Out-Null; Push-Location '$workspaceFolder/red_x'; make web } else { Write-Host 'emsdk not found. Please run setup first.' -ForegroundColor Red }}" -NoNewWindow -Wait
        }
        "build native" {
            Write-Host "Building native version..." -ForegroundColor Cyan
            Start-Process "C:\tools\msys64\msys2_shell.cmd" -ArgumentList "-mingw64", "-defterm", "-no-start", "-here", "-c", "cd '$workspaceFolder/red_x' && make" -NoNewWindow -Wait
        }
        "clean" {
            Write-Host "Cleaning build artifacts..." -ForegroundColor Cyan
            Start-Process powershell -ArgumentList "-Command", "Set-Location -Path '$workspaceFolder/red_x'; make clean" -NoNewWindow -Wait
        }
        "server" {
            Write-Host "Starting development server..." -ForegroundColor Cyan
            Start-Process powershell -ArgumentList "-Command", "Set-Location -Path '$workspaceFolder/red_x'; node server.js" -NoNewWindow
        }
        "deploy" {
            Write-Host "Deploying to GitHub Pages..." -ForegroundColor Cyan
            Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-File", "$workspaceFolder/deploy-gh-pages.ps1" -NoNewWindow -Wait
        }
        "branch info" {
            Write-Host "Getting branch info..." -ForegroundColor Cyan
            Start-Process "$workspaceFolder/branch-manager.cmd" -ArgumentList "info" -NoNewWindow -Wait
        }
        "branch main" {
            Write-Host "Switching to main branch..." -ForegroundColor Cyan
            Start-Process "$workspaceFolder/branch-manager.cmd" -ArgumentList "switch", "001" -NoNewWindow -Wait
        }
        "branch docs" {
            Write-Host "Switching to docs branch..." -ForegroundColor Cyan
            Start-Process "$workspaceFolder/branch-manager.cmd" -ArgumentList "switch", "temp-check-actions" -NoNewWindow -Wait
        }
        "branch sync" {
            Write-Host "Syncing branches..." -ForegroundColor Cyan
            Start-Process "$workspaceFolder/branch-manager.cmd" -ArgumentList "sync" -NoNewWindow -Wait
        }
        "setup" {
            Write-Host "Setting up emsdk..." -ForegroundColor Cyan
            Start-Process powershell -ArgumentList "-ExecutionPolicy", "Bypass", "-File", "$workspaceFolder/setup-emsdk.ps1" -NoNewWindow -Wait
        }
        "status" {
            Write-Host "Current project status:" -ForegroundColor Cyan
            Push-Location $workspaceFolder
            git status
            Pop-Location
        }
        default {
            Write-Host "Unknown command: $TaskName" -ForegroundColor Red
            Write-Host "Type 'help' to see available commands" -ForegroundColor Gray
        }
    }
}

# Main CLI loop
function Start-SXS {
    Clear-Host
    Show-SXSHeader

    while ($true) {
        Write-Host "sxs>" -NoNewline -ForegroundColor Green
        $command = Read-Host " "

        switch -Regex ($command.Trim().ToLower()) {
            "^exit$" {
                Write-Host "Exiting SXS CLI. Goodbye!" -ForegroundColor Yellow
                return
            }
            "^clear$" {
                Clear-Host
                Show-SXSHeader
            }
            "^help$" { Show-Help }
            "^build web$" { Invoke-TaskRunner "build web" }
            "^build native$" { Invoke-TaskRunner "build native" }
            "^build$" {
                Write-Host "Please specify build type: 'build web' or 'build native'" -ForegroundColor Yellow
            }
            "^clean$" { Invoke-TaskRunner "clean" }
            "^server$" { Invoke-TaskRunner "server" }
            "^deploy$" { Invoke-TaskRunner "deploy" }
            "^branch info$" { Invoke-TaskRunner "branch info" }
            "^branch main$" { Invoke-TaskRunner "branch main" }
            "^branch docs$" { Invoke-TaskRunner "branch docs" }
            "^branch sync$" { Invoke-TaskRunner "branch sync" }
            "^status$" { Invoke-TaskRunner "status" }
            "^setup$" { Invoke-TaskRunner "setup" }
            "" { } # Do nothing for empty command
            default {
                Write-Host "Unknown command: $command" -ForegroundColor Red
                Write-Host "Type 'help' to see available commands" -ForegroundColor Gray
            }
        }

        Write-Host "" # Add a blank line after each command
    }
}

# Start the CLI
Start-SXS
