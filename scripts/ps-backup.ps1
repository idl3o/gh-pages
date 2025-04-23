<#
.SYNOPSIS
    PowerShell script for backing up StreamChain platform
.DESCRIPTION
    Performs backup operations with a PowerShell-friendly interface
.PARAMETER Target
    Backup target (site, docs, config, all)
#>

param (
    [Parameter(Position=0)]
    [ValidateSet("site", "docs", "config", "all")]
    [string]$Target = "all"
)

# Set colors for terminal output
$Blue = [ConsoleColor]::Cyan
$Green = [ConsoleColor]::Green
$Red = [ConsoleColor]::Red
$Yellow = [ConsoleColor]::Yellow

# Banner
Write-Host "🔄 StreamChain Backup System" -ForegroundColor $Blue
Write-Host "=============================" -ForegroundColor $Blue

# Create the backup directory if it doesn't exist
$backupDir = Join-Path -Path $PSScriptRoot -ChildPath ".." -Resolve | Join-Path -ChildPath "backups"
if (-not (Test-Path -Path $backupDir)) {
    Write-Host "Creating backup directory..." -ForegroundColor $Blue
    New-Item -ItemType Directory -Path $backupDir | Out-Null
    Write-Host "✓ Backup directory created at: $backupDir" -ForegroundColor $Green
}

# Run the appropriate backup command
Write-Host "Starting backup for target: $Target" -ForegroundColor $Blue

try {
    switch ($Target) {
        "site" {
            npm run backup:site
        }
        "docs" {
            npm run backup:docs
        }
        "config" {
            # Use Node.js backup manager with config target
            node (Join-Path -Path $PSScriptRoot -ChildPath "backup-manager.js") --target=config
        }
        "all" {
            npm run backup:all
        }
    }

    Write-Host "`n✓ Backup completed successfully!" -ForegroundColor $Green
} catch {
    Write-Host "`n✗ Backup failed: $_" -ForegroundColor $Red
    exit 1
}

# Show available backups
Write-Host "`nAvailable backups:" -ForegroundColor $Blue
npm run restore:list

Write-Host "`nTo restore a backup, use: npm run ps:restore" -ForegroundColor $Yellow
