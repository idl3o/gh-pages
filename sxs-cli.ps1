# SXS CLI - Simple eXtensible Shell
# A PowerShell-based CLI for project management with cross-platform capabilities

# Parameters for script
param (
    [Parameter(Mandatory = $false)]
    [switch]$NoLogo = $false,
    
    [Parameter(Mandatory = $false)]
    [string]$Command = $null,

    [Parameter(Mandatory = $false)]
    [string[]]$CommandArgs = @()
)

# Global variables
$script:workspaceRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$script:version = "1.0.0"
$script:lastExitCode = 0

# PowerShell equivalent of '&&' operator in bash
# This function executes commands only if the previous one succeeded
function Invoke-CommandChain {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory = $true, Position = 0)]
        [scriptblock[]]$Commands
    )

    foreach ($cmd in $Commands) {
        try {
            # Execute the command
            & $cmd
            # Check if the command succeeded
            if (-not $?) {
                Write-Host "Command failed with non-zero exit code. Stopping command chain." -ForegroundColor Red
                return $false
            }
        }
        catch {
            Write-Host "Command failed with exception: $_" -ForegroundColor Red
            return $false
        }
    }
    return $true
}

# Usage example:
# Invoke-CommandChain @(
#     { command1 },
#     { command2 },
#     { command3 }
# )

function Show-SXSHeader {
    Write-Host ""
    Write-Host "§§§§§  ✧✧✧✧✧  §§§§§" -ForegroundColor Cyan
    Write-Host "§      ✧   ✧  §   §" -ForegroundColor Cyan
    Write-Host "§§§§§  ✧   ✧  §§§§§" -ForegroundColor Cyan
    Write-Host "    §  ✧   ✧  §   §" -ForegroundColor Cyan
    Write-Host "§§§§§  ✧✧✧✧✧  §   §" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Simple eXtensible Shell (SXS) v$script:version" -ForegroundColor Yellow
    Write-Host "Type 'help' to see available commands" -ForegroundColor Gray
    Write-Host ""
}

function Show-Help {
    Write-Host "Available commands:" -ForegroundColor Yellow

    # Core commands
    Write-Host "  Core Commands:" -ForegroundColor Magenta
    Write-Host "    help         - Show this help menu" -ForegroundColor Gray
    Write-Host "    clear        - Clear the console" -ForegroundColor Gray
    Write-Host "    exit         - Exit SXS CLI" -ForegroundColor Gray
    Write-Host "    status       - Show current branch and repository status" -ForegroundColor Gray

    # Build commands
    Write-Host "  Build Commands:" -ForegroundColor Magenta
    Write-Host "    build web    - Build the web version (uses Emscripten)" -ForegroundColor Gray
    Write-Host "    build native - Build the native version" -ForegroundColor Gray
    Write-Host "    clean        - Clean build artifacts" -ForegroundColor Gray

    # Serve/Deploy commands
    Write-Host "  Server & Deploy Commands:" -ForegroundColor Magenta
    Write-Host "    server       - Start the development server" -ForegroundColor Gray
    Write-Host "    deploy       - Deploy to GitHub Pages" -ForegroundColor Gray

    # Branch management
    Write-Host "  Branch Management:" -ForegroundColor Magenta
    Write-Host "    branch info  - Show branch information" -ForegroundColor Gray
    Write-Host "    branch main  - Switch to main branch" -ForegroundColor Gray
    Write-Host "    branch docs  - Switch to docs branch" -ForegroundColor Gray
    Write-Host "    branch sync  - Sync all branches" -ForegroundColor Gray

    # Fix and Repair commands
    Write-Host "  Fixes & Repairs:" -ForegroundColor Magenta
    Write-Host "    fix hooks    - Fix git hooks issues" -ForegroundColor Gray
    Write-Host "    fix deps     - Fix Node.js dependencies" -ForegroundColor Gray
    Write-Host "    setup        - Set up Emscripten SDK" -ForegroundColor Gray

    # Commit and workarounds
    Write-Host "  Git Operations:" -ForegroundColor Magenta
    Write-Host "    safe-commit \"message\" - Commit changes safely (bypassing hooks)" -ForegroundColor Gray
    Write-Host "    restore-hooks - Restore git hooks to normal operation" -ForegroundColor Gray
    Write-Host ""

    Write-Host "To run a command directly, use: ./sxs-cli.ps1 -Command \"command name\"" -ForegroundColor Gray

    # Add new section about && operator
    Write-Host "  Advanced Usage:" -ForegroundColor Magenta
    Write-Host "    try-chain    - Example of command chaining with && behavior" -ForegroundColor Gray
}

function Invoke-TaskRunner {
    param (
        [string]$TaskName
    )

    # Map commands to VS Code tasks or direct commands
    switch -Regex ($TaskName) {
        "^build web$" {
            Write-Host "Building web version..." -ForegroundColor Cyan
            Invoke-VSCodeTask "make_web"
        }
        "^build native$" {
            Write-Host "Building native version..." -ForegroundColor Cyan
            Invoke-VSCodeTask "make_native"
        }
        "^clean$" {
            Write-Host "Cleaning build artifacts..." -ForegroundColor Cyan
            Invoke-VSCodeTask "clean"
        }
        "^server$" {
            Write-Host "Starting development server..." -ForegroundColor Cyan
            Invoke-VSCodeTask "start_server"
        }
        "^deploy$" {
            Write-Host "Deploying to GitHub Pages..." -ForegroundColor Cyan
            Invoke-VSCodeTask "deploy"
        }
        "^branch info$" {
            Write-Host "Getting branch info..." -ForegroundColor Cyan
            Invoke-VSCodeTask "branch_info"
        }
        "^branch main$" {
            Write-Host "Switching to main branch..." -ForegroundColor Cyan
            Invoke-VSCodeTask "switch_to_main"
        }
        "^branch docs$" {
            Write-Host "Switching to docs branch..." -ForegroundColor Cyan
            Invoke-VSCodeTask "switch_to_docs"
        }
        "^branch sync$" {
            Write-Host "Syncing branches..." -ForegroundColor Cyan
            Invoke-VSCodeTask "sync_branches"
        }
        "^setup$" {
            Write-Host "Setting up Emscripten SDK..." -ForegroundColor Cyan
            Invoke-VSCodeTask "setup_emsdk"
        }
        "^status$" {
            Write-Host "Current project status:" -ForegroundColor Cyan
            Push-Location $script:workspaceRoot
            git status
            Pop-Location
        }
        "^fix hooks$" {
            Write-Host "Fixing git hooks..." -ForegroundColor Cyan
            Fix-GitHooks
        }
        "^fix deps$" {
            Write-Host "Fixing Node.js dependencies..." -ForegroundColor Cyan
            Fix-NodeDependencies
        }
        "^safe-commit (.+)$" {
            $message = $matches[1]
            Write-Host "Committing changes safely: $message" -ForegroundColor Cyan
            Invoke-SafeCommit -Message $message
        }
        "^restore-hooks$" {
            Write-Host "Restoring git hooks..." -ForegroundColor Cyan
            Restore-GitHooks
        }
        "^try-chain$" {
            Write-Host "Demonstrating command chaining (&& equivalent in PowerShell)..." -ForegroundColor Cyan
            $result = Invoke-CommandChain @(
                { Write-Host "Step 1: Creating temporary file..." -ForegroundColor Yellow; $true },
                { Write-Host "Step 2: Writing content to file..." -ForegroundColor Yellow; $true },
                { Write-Host "Step 3: Processing file..." -ForegroundColor Yellow; $true },
                { Write-Host "Step 4: Clean up..." -ForegroundColor Yellow; $true }
            )
            
            if ($result) {
                Write-Host "✅ All commands in chain executed successfully!" -ForegroundColor Green
            } else {
                Write-Host "❌ Command chain execution stopped due to an error." -ForegroundColor Red
            }
            
            # Demonstrate error in chain
            Write-Host "`nTrying a command chain with an error:" -ForegroundColor Cyan
            $result = Invoke-CommandChain @(
                { Write-Host "Step 1: This will succeed" -ForegroundColor Yellow; $true },
                { Write-Host "Step 2: This will fail" -ForegroundColor Yellow; $false },
                { Write-Host "Step 3: This will never execute" -ForegroundColor Yellow; $true }
            )
            
            if (-not $result) {
                Write-Host "As expected, command chain stopped at the failing command." -ForegroundColor Yellow
            }
        }
        default {
            Write-Host "Unknown command: $TaskName" -ForegroundColor Red
            Write-Host "Type 'help' to see available commands" -ForegroundColor Gray
            return $false
        }
    }
    return $true
}

function Invoke-VSCodeTask {
    param (
        [string]$TaskName
    )

    # Get the workspace folder path 
    $workspaceFolder = $script:workspaceRoot

    # Map task IDs to their implementations with improved error handling
    switch ($TaskName) {
        "make_web" {
            # Using command chaining for better error handling
            $emsdkDir = Join-Path -Path $workspaceFolder -ChildPath 'emsdk'
            if (Test-Path -Path $emsdkDir) {
                $result = Invoke-CommandChain @(
                    { & "$emsdkDir\emsdk_env.bat" | Out-Null; $true },
                    { Push-Location "$workspaceFolder/red_x"; $true },
                    { & make web; $LASTEXITCODE -eq 0 },
                    { Pop-Location; $true }
                )
                
                if ($result) {
                    Write-Host "✅ Web build completed successfully!" -ForegroundColor Green
                } else {
                    Write-Host "❌ Web build failed." -ForegroundColor Red
                    return $false
                }
            } else {
                Write-Host 'emsdk not found. Please run the setup_emsdk task first.' -ForegroundColor Red
                return $false
            }
        }
        "make_native" {
            # Direct implementation of make_native
            if (Test-Path "C:\tools\msys64\msys2_shell.cmd") {
                # MSYS2 is available
                & "C:\tools\msys64\msys2_shell.cmd" -mingw64 -defterm -no-start -here -c "cd '$($workspaceFolder -replace '\\', '/')/red_x' && make"
            } else {
                # Fall back to PowerShell
                Write-Host "MSYS2 not found. Attempting native build with MinGW if available..." -ForegroundColor Yellow
                $mingwPath = "C:\ProgramData\mingw64\mingw64\bin"
                if (Test-Path -Path $mingwPath) {
                    $env:Path = "$mingwPath;$env:Path"
                    Push-Location "$workspaceFolder/red_x"
                    & gcc -o red_x.exe main.c -lSDL2 -lm
                    Pop-Location
                } else {
                    Write-Host "MinGW not found. Creating placeholder file..." -ForegroundColor Yellow
                    Invoke-VSCodeTask "make_native_bypass"
                    return $false
                }
            }
        }
        "start_server" {
            # Start the web server
            Start-Process powershell -ArgumentList "-Command", "Set-Location -Path '$workspaceFolder/red_x'; node server.js"
            Start-Sleep -Seconds 2
            Start-Process "http://localhost:8080"
        }
        "clean" {
            # Clean build artifacts
            Push-Location "$workspaceFolder/red_x"
            & make clean
            Pop-Location
        }
        "deploy" {
            # Deploy to GitHub Pages
            & powershell -ExecutionPolicy Bypass -File "$workspaceFolder/deploy-gh-pages.ps1"
        }
        "setup_emsdk" {
            # Set up Emscripten SDK with improved error handling
            $result = Invoke-CommandChain @(
                { & powershell -ExecutionPolicy Bypass -File "$workspaceFolder/setup-emsdk.ps1"; $LASTEXITCODE -eq 0 }
            )
            
            if (-not $result) {
                Write-Host "❌ Emscripten SDK setup failed." -ForegroundColor Red
                return $false
            }
        }
        "branch_info" {
            # Show branch information
            & "$workspaceFolder/branch-manager.cmd" info
        }
        "switch_to_main" {
            # Switch to main branch
            & "$workspaceFolder/branch-manager.cmd" switch 001
        }
        "switch_to_docs" {
            # Switch to docs branch
            & "$workspaceFolder/branch-manager.cmd" switch temp-check-actions
        }
        "sync_branches" {
            # Sync branches
            & "$workspaceFolder/branch-manager.cmd" sync
        }
        "make_native_bypass" {
            # Create placeholder for native executable
            if (-not (Test-Path "$workspaceFolder/red_x/red_x.exe") -and -not (Test-Path "$workspaceFolder/red_x/red_x")) {
                "This is a placeholder for the native build." | Out-File -FilePath "$workspaceFolder/red_x/red_x.placeholder"
                Write-Host "Created placeholder for native executable" -ForegroundColor Yellow
            }
        }
        default {
            Write-Host "Unknown task: $TaskName" -ForegroundColor Red
            return $false
        }
    }

    return $true
}

function Fix-GitHooks {
    $scriptPath = Join-Path -Path $script:workspaceRoot -ChildPath "commit-fix.sh.bak"

    if (Test-Path $scriptPath) {
        Write-Host "Using commit-fix.sh.bak to fix git hooks..." -ForegroundColor Cyan

        # Disable git hooks
        git config --local core.hooksPath /dev/null
        Write-Host "Git hooks disabled." -ForegroundColor Green

        # Create safe-commit.sh if it doesn't exist
        $safeCommitPath = Join-Path -Path $script:workspaceRoot -ChildPath "safe-commit.sh"
        if (-not (Test-Path $safeCommitPath)) {
            @'
#!/bin/bash
# Safe commit script that bypasses hooks

if [ $# -eq 0 ]; then
  echo "Usage: ./safe-commit.sh \"Your commit message\""
  exit 1
fi

# Add all changed files
git add .

# Always bypass hooks when committing
git commit --no-verify -m "$1"

echo "Changes committed successfully!"
'@ | Out-File -FilePath $safeCommitPath -Encoding utf8

            Write-Host "Created safe-commit.sh script for bypassing hooks." -ForegroundColor Green
        }

        # Create restore-hooks.sh if it doesn't exist
        $restoreHooksPath = Join-Path -Path $script:workspaceRoot -ChildPath "restore-hooks.sh"
        if (-not (Test-Path $restoreHooksPath)) {
            @'
#!/bin/bash
# Script to restore git hooks

echo "Restoring git hooks configuration..."
git config --local --unset core.hooksPath
echo "Git hooks restored!"
'@ | Out-File -FilePath $restoreHooksPath -Encoding utf8

            Write-Host "Created restore-hooks.sh script for restoring hooks." -ForegroundColor Green
        }
    } else {
        # Direct implementation if the script isn't available
        Write-Host "Directly fixing git hooks..." -ForegroundColor Cyan

        # Disable git hooks
        git config --local core.hooksPath /dev/null
        Write-Host "Git hooks disabled." -ForegroundColor Green

        # Create safe-commit.sh
        @'
#!/bin/bash
# Safe commit script that bypasses hooks

if [ $# -eq 0 ]; then
  echo "Usage: ./safe-commit.sh \"Your commit message\""
  exit 1
fi

# Add all changed files
git add .

# Always bypass hooks when committing
git commit --no-verify -m "$1"

echo "Changes committed successfully!"
'@ | Out-File -FilePath (Join-Path -Path $script:workspaceRoot -ChildPath "safe-commit.sh") -Encoding utf8

        Write-Host "Created safe-commit.sh script for bypassing hooks." -ForegroundColor Green
    }
}

function Fix-NodeDependencies {
    $scriptPath = Join-Path -Path $script:workspaceRoot -ChildPath "fix-node-deps.sh.bak"

    if (Test-Path $scriptPath) {
        Write-Host "Using fix-node-deps.sh.bak to fix Node.js dependencies..." -ForegroundColor Cyan

        # Check for bash
        if (Get-Command bash -ErrorAction SilentlyContinue) {
            # Execute with bash
            bash $scriptPath
        } else {
            # Direct implementation if bash isn't available
            Write-Host "Bash not found. Using direct PowerShell implementation..." -ForegroundColor Yellow

            # Back up package.json if it exists
            if (Test-Path (Join-Path -Path $script:workspaceRoot -ChildPath "package.json")) {
                Copy-Item -Path (Join-Path -Path $script:workspaceRoot -ChildPath "package.json") -Destination (Join-Path -Path $script:workspaceRoot -ChildPath "package.json.bak")

                # Fix chalk version
                $packageJson = Get-Content (Join-Path -Path $script:workspaceRoot -ChildPath "package.json") -Raw
                $packageJson = $packageJson -replace '"chalk": "\^[0-9.]*"', '"chalk": "^4.1.2"'
                $packageJson = $packageJson -replace '"type": "module"', ''
                $packageJson | Out-File -FilePath (Join-Path -Path $script:workspaceRoot -ChildPath "package.json") -Encoding utf8

                # Clean npm cache
                Remove-Item -Path (Join-Path -Path $script:workspaceRoot -ChildPath "node_modules") -Recurse -Force -ErrorAction SilentlyContinue
                Remove-Item -Path (Join-Path -Path $script:workspaceRoot -ChildPath "package-lock.json") -Force -ErrorAction SilentlyContinue

                # Install dependencies
                Push-Location $script:workspaceRoot
                npm install
                Pop-Location
            }
        }
    } else {
        # Direct implementation if the script isn't available
        Write-Host "Directly fixing Node.js dependencies..." -ForegroundColor Cyan

        # Back up package.json if it exists
        if (Test-Path (Join-Path -Path $script:workspaceRoot -ChildPath "package.json")) {
            Copy-Item -Path (Join-Path -Path $script:workspaceRoot -ChildPath "package.json") -Destination (Join-Path -Path $script:workspaceRoot -ChildPath "package.json.bak")

            # Fix chalk version
            $packageJson = Get-Content (Join-Path -Path $script:workspaceRoot -ChildPath "package.json") -Raw
            $packageJson = $packageJson -replace '"chalk": "\^[0-9.]*"', '"chalk": "^4.1.2"'
            $packageJson = $packageJson -replace '"type": "module"', ''
            $packageJson | Out-File -FilePath (Join-Path -Path $script:workspaceRoot -ChildPath "package.json") -Encoding utf8

            # Clean npm cache
            Remove-Item -Path (Join-Path -Path $script:workspaceRoot -ChildPath "node_modules") -Recurse -Force -ErrorAction SilentlyContinue
            Remove-Item -Path (Join-Path -Path $script:workspaceRoot -ChildPath "package-lock.json") -Force -ErrorAction SilentlyContinue

            # Install dependencies
            Push-Location $script:workspaceRoot
            npm install
            Pop-Location
        }
    }
}

function Invoke-SafeCommit {
    param (
        [string]$Message
    )
    
    if (-not $Message) {
        Write-Host "Error: Commit message is required." -ForegroundColor Red
        return $false
    }
    
    # Use command chaining for git operations
    $result = Invoke-CommandChain @(
        { git add .; $LASTEXITCODE -eq 0 },
        { git commit --no-verify -m $Message; $LASTEXITCODE -eq 0 }
    )
    
    if ($result) {
        Write-Host "Changes committed successfully!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "Commit failed." -ForegroundColor Red
        return $false
    }
}

function Restore-GitHooks {
    git config --local --unset core.hooksPath
    Write-Host "Git hooks restored!" -ForegroundColor Green
}

# Main CLI loop
function Start-SXS {
    if (-not $NoLogo) {
        Clear-Host
        Show-SXSHeader
    }

    # If Command parameter is provided, run it and exit
    if ($Command) {
        if ($CommandArgs.Count -gt 0) {
            # Combine command with args
            $fullCommand = "$Command $($CommandArgs -join ' ')"
            Invoke-TaskRunner $fullCommand
        } else {
            Invoke-TaskRunner $Command
        }
        return
    }

    # Interactive loop
    while ($true) {
        Write-Host "sxs>" -NoNewline -ForegroundColor Green
        $command = Read-Host " "

        if ([string]::IsNullOrEmpty($command)) {
            continue
        }

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
            default {
                Invoke-TaskRunner $command
            }
        }

        Write-Host "" # Add a blank line after each command
    }
}

# Start the CLI
Start-SXS
