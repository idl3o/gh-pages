param (
    [Parameter()]
    [string]$Command = "help",
    [Parameter()]
    [string]$Branch = "",
    [Parameter()]
    [string]$Message = ""
)

$MAIN_BRANCH = "001"
$DOCS_BRANCH = "temp-check-actions"
$CONFIG_FILE = ".branch-config.json"

function Show-Header {
    Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║         BRANCH MANAGEMENT SYSTEM V1.0          ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Cyan
}

function Get-BranchInfo {
    $currentBranch = git branch --show-current
    Write-Host "Current branch: " -NoNewline
    Write-Host $currentBranch -ForegroundColor Green

    # Show last commit on current branch
    Write-Host "`nLast commit on current branch:"
    git log -1 --pretty=format:"%h - %s (%cr) <%an>" --abbrev-commit

    # Show status
    Write-Host "`nBranch status:"
    git status --short
}

function Switch-Branch {
    param (
        [string]$targetBranch
    )

    $currentBranch = git branch --show-current

    # Check if we need to stash changes
    $hasChanges = git status --porcelain
    $stashed = $false

    if ($hasChanges) {
        Write-Host "Stashing changes before switching..." -ForegroundColor Yellow
        git stash push -m "Auto-stash before switching to $targetBranch"
        $stashed = $true
    }

    # Switch to target branch
    Write-Host "Switching to $targetBranch..." -ForegroundColor Cyan
    git checkout $targetBranch

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to switch to branch $targetBranch" -ForegroundColor Red
        return
    }

    Write-Host "Successfully switched to branch: $targetBranch" -ForegroundColor Green

    # Check if we need to apply the stash
    if ($stashed) {
        $shouldApply = Read-Host "Apply stashed changes to this branch? (y/n)"
        if ($shouldApply -eq "y") {
            git stash apply
            Write-Host "Applied stashed changes" -ForegroundColor Green
        }
    }

    # Load branch-specific config if it exists
    Load-BranchConfig
}

function New-Feature {
    param (
        [string]$featureName
    )

    $currentBranch = git branch --show-current
    $baseBranch = ""

    if ($currentBranch -eq $MAIN_BRANCH) {
        $baseBranch = $MAIN_BRANCH
        $branchType = "feature"
    } elseif ($currentBranch -eq $DOCS_BRANCH) {
        $baseBranch = $DOCS_BRANCH
        $branchType = "docs"
    } else {
        Write-Host "Please switch to either main branch ($MAIN_BRANCH) or docs branch ($DOCS_BRANCH) first" -ForegroundColor Red
        return
    }

    $newBranchName = "$branchType/$featureName"

    # Create and switch to new branch
    Write-Host "Creating new branch '$newBranchName' based on '$baseBranch'..." -ForegroundColor Cyan
    git checkout -b $newBranchName

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully created and switched to branch: $newBranchName" -ForegroundColor Green
    } else {
        Write-Host "Failed to create branch" -ForegroundColor Red
    }
}

function Sync-Branches {
    $currentBranch = git branch --show-current

    # Fetch latest from remote
    Write-Host "Fetching latest changes..." -ForegroundColor Cyan
    git fetch origin

    # Update main development branch
    Write-Host "`nUpdating $MAIN_BRANCH..." -ForegroundColor Cyan
    git checkout $MAIN_BRANCH
    git pull origin $MAIN_BRANCH

    # Update documentation branch
    Write-Host "`nUpdating $DOCS_BRANCH..." -ForegroundColor Cyan
    git checkout $DOCS_BRANCH
    git pull origin $DOCS_BRANCH

    # Return to original branch
    Write-Host "`nReturning to $currentBranch..." -ForegroundColor Cyan
    git checkout $currentBranch

    Write-Host "`nAll branches synchronized!" -ForegroundColor Green
}

function Quick-Commit {
    param (
        [string]$commitMessage
    )

    if ([string]::IsNullOrWhiteSpace($commitMessage)) {
        $commitMessage = Read-Host "Enter commit message"
    }

    $currentBranch = git branch --show-current

    # Add all changes
    git add .

    # Commit changes
    git commit -m "$commitMessage"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Successfully committed changes with message: '$commitMessage'" -ForegroundColor Green

        $shouldPush = Read-Host "Push changes to remote? (y/n)"
        if ($shouldPush -eq "y") {
            git push origin $currentBranch
            if ($LASTEXITCODE -eq 0) {
                Write-Host "Successfully pushed changes to origin/$currentBranch" -ForegroundColor Green
            } else {
                Write-Host "Failed to push changes" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "Failed to commit changes" -ForegroundColor Red
    }
}

function Save-BranchConfig {
    param (
        [string]$key,
        [string]$value
    )

    $currentBranch = git branch --show-current

    # Create or load existing config
    if (Test-Path $CONFIG_FILE) {
        $config = Get-Content $CONFIG_FILE | ConvertFrom-Json
    } else {
        $config = @{}
    }

    # Initialize branch config if it doesn't exist
    if (-not $config.$currentBranch) {
        $config | Add-Member -MemberType NoteProperty -Name $currentBranch -Value @{}
    }

    # Add or update the key-value pair
    $branchConfig = $config.$currentBranch
    $branchConfig | Add-Member -MemberType NoteProperty -Name $key -Value $value -Force

    # Save the updated config
    $config | ConvertTo-Json -Depth 10 | Set-Content $CONFIG_FILE

    Write-Host "Saved configuration for branch '$currentBranch': $key = $value" -ForegroundColor Green
}

function Load-BranchConfig {
    $currentBranch = git branch --show-current

    if (Test-Path $CONFIG_FILE) {
        $config = Get-Content $CONFIG_FILE | ConvertFrom-Json

        if ($config.$currentBranch) {
            Write-Host "`nBranch-specific configuration:" -ForegroundColor Cyan
            $branchConfig = $config.$currentBranch
            $branchConfig.PSObject.Properties | ForEach-Object {
                Write-Host "$($_.Name): $($_.Value)"
            }
            Write-Host ""
        }
    }
}

function Show-Help {
    Write-Host "Branch Management System - Usage:" -ForegroundColor Cyan
    Write-Host "--------------------------------"
    Write-Host ".\branch-manager.ps1 [command] [arguments]`n"

    Write-Host "Available Commands:" -ForegroundColor Yellow
    Write-Host "  info                          Show information about current branch"
    Write-Host "  switch [branch]               Switch to specified branch"
    Write-Host "  new [feature-name]            Create new feature branch from current branch"
    Write-Host "  sync                          Synchronize all main branches with remote"
    Write-Host "  commit [message]              Commit all changes with specified message"
    Write-Host "  config [key] [value]          Set branch-specific configuration"
    Write-Host "  help                          Show this help"

    Write-Host "`nMain Branches:" -ForegroundColor Yellow
    Write-Host "  $MAIN_BRANCH                      Main development branch"
    Write-Host "  $DOCS_BRANCH        Documentation branch"

    Write-Host "`nExamples:" -ForegroundColor Yellow
    Write-Host "  .\branch-manager.ps1 switch $MAIN_BRANCH"
    Write-Host "  .\branch-manager.ps1 new login-feature"
    Write-Host "  .\branch-manager.ps1 commit ""Fix authentication bug"""
}

# Main script execution
Show-Header

switch ($Command.ToLower()) {
    "info" {
        Get-BranchInfo
    }
    "switch" {
        if ([string]::IsNullOrWhiteSpace($Branch)) {
            Write-Host "Please specify a branch name" -ForegroundColor Red
            break
        }
        Switch-Branch -targetBranch $Branch
    }
    "new" {
        if ([string]::IsNullOrWhiteSpace($Branch)) {
            Write-Host "Please specify a feature name" -ForegroundColor Red
            break
        }
        New-Feature -featureName $Branch
    }
    "sync" {
        Sync-Branches
    }
    "commit" {
        Quick-Commit -commitMessage $Message
    }
    "config" {
        if ([string]::IsNullOrWhiteSpace($Branch) -or [string]::IsNullOrWhiteSpace($Message)) {
            Write-Host "Please specify both key and value" -ForegroundColor Red
            break
        }
        Save-BranchConfig -key $Branch -value $Message
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "Unknown command: $Command" -ForegroundColor Red
        Show-Help
    }
}
