# Invoke-RedX.ps1
# Natural language interface for the RED X project
# Created: April 26, 2025

param(
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string[]]$CommandText
)

function Show-CommandHeader {
    Write-Host "`n===========================================" -ForegroundColor Cyan
    Write-Host "       RED X Natural Language CLI" -ForegroundColor Cyan
    Write-Host "===========================================" -ForegroundColor Cyan
    Write-Host "Type your commands in plain English or use traditional CLI syntax." -ForegroundColor Gray
    Write-Host "Examples:" -ForegroundColor Gray
    Write-Host "  - 'build the web version'" -ForegroundColor Gray
    Write-Host "  - 'start the server on port 3000'" -ForegroundColor Gray
    Write-Host "  - 'help me with deployment options'" -ForegroundColor Gray
    Write-Host "  - Type 'exit' to quit" -ForegroundColor Gray
    Write-Host "===========================================`n" -ForegroundColor Cyan
}

function Invoke-SxSCommand {
    param(
        [Parameter(Mandatory=$true)]
        [string]$Command
    )

    if ([string]::IsNullOrWhiteSpace($Command)) {
        return
    }

    if ($Command -eq "exit" -or $Command -eq "quit") {
        Write-Host "Exiting RED X CLI..." -ForegroundColor Yellow
        exit
    }

    try {
        # Get the directory of the current script
        $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

        # Verify the script directory exists
        if (-not (Test-Path $scriptDir)) {
            Write-Error "Could not determine script directory path."
            return
        }

        # Navigate to script directory
        Set-Location $scriptDir

        # Ensure node is available
        $nodePath = Get-Command node -ErrorAction SilentlyContinue
        if (-not $nodePath) {
            Write-Error "Node.js not found. Please install Node.js to use the RED X CLI."
            return
        }

        # Construct and validate CLI path
        $cliPath = Join-Path -Path $scriptDir -ChildPath "sxs-cli.js"
        if (-not (Test-Path $cliPath)) {
            # Try looking in the sxs-core directory
            $cliPath = Join-Path -Path $scriptDir -ChildPath "sxs-core\sxs-cli.js"

            # If still not found, try one directory up
            if (-not (Test-Path $cliPath)) {
                $parentDir = Split-Path -Parent $scriptDir
                $cliPath = Join-Path -Path $parentDir -ChildPath "sxs-cli.js"

                if (-not (Test-Path $cliPath)) {
                    Write-Error "Could not locate sxs-cli.js in expected locations."
                    return
                }
            }
        }

        # Execute the command through the SxS CLI
        Write-Host "Executing command using: $cliPath" -ForegroundColor DarkGray

        # Split the command into arguments
        $commandArgs = $Command -split ' '

        # Call node with the CLI path and all command arguments
        & node $cliPath $commandArgs
    }
    catch {
        Write-Error "Error executing command: $_"
    }
}

# Main execution flow
if ($CommandText -and $CommandText.Count -gt 0) {
    # If command provided as argument, execute it directly
    $fullCommand = $CommandText -join " "
    Invoke-SxSCommand -Command $fullCommand
}
else {
    # Interactive mode
    Show-CommandHeader

    while ($true) {
        Write-Host "> " -ForegroundColor Green -NoNewline
        $userInput = Read-Host

        if (-not [string]::IsNullOrWhiteSpace($userInput)) {
            Invoke-SxSCommand -Command $userInput
        }
    }
}
