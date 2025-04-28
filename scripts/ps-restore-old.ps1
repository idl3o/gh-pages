<#
.SYNOPSIS
    PowerShell script for restoring StreamChain platform backups
.DESCRIPTION
    Provides an interactive or command-line interface for restoring backups
.PARAMETER Backup
    Specific backup file to restore
.PARAMETER Latest
    Use this switch to restore the latest backup
.PARAMETER List
    Use this switch to list available backups
#>

param (
    [Parameter(Position=0)]
    [string]$Backup,

    [Parameter()]
    [switch]$Latest,

    [Parameter()]
    [switch]$List
)

# Set colors for terminal output
$Blue = [ConsoleColor]::Cyan
$Green = [ConsoleColor]::Green
$Red = [ConsoleColor]::Red
$Yellow = [ConsoleColor]::Yellow

# Banner
Write-Host "🔄 StreamChain Backup Restoration" -ForegroundColor $Blue
Write-Host "===============================" -ForegroundColor $Blue

# Check the backup directory
$backupDir = Join-Path -Path $PSScriptRoot -ChildPath ".." -Resolve | Join-Path -ChildPath "backups"
if (-not (Test-Path -Path $backupDir)) {
    Write-Host "✗ No backups directory found." -ForegroundColor $Red
    exit 1
}

# List available backups if requested
if ($List) {
    Write-Host "Available backups:" -ForegroundColor $Blue
    npm run restore:list
    exit 0
}

# Restore latest backup if requested
if ($Latest) {
    Write-Host "Restoring from latest backups..." -ForegroundColor $Blue
    try {
        npm run restore:latest
        Write-Host "`n✓ Restore from latest backups completed successfully!" -ForegroundColor $Green
    } catch {
        Write-Host "`n✗ Restore failed: $_" -ForegroundColor $Red
        exit 1
    }
    exit 0
}

# Restore specific backup if provided
if ($Backup) {
    Write-Host "Restoring from backup: $Backup" -ForegroundColor $Blue
    try {
        npm run restore -- $Backup
        Write-Host "`n✓ Restore completed successfully!" -ForegroundColor $Green
    } catch {
        Write-Host "`n✗ Restore failed: $_" -ForegroundColor $Red
        exit 1
    }
    exit 0
}

# Interactive mode if no parameters provided
Write-Host "Available backups:" -ForegroundColor $Blue
npm run restore:list

$selectedBackup = Read-Host "`nEnter backup name to restore (or press Enter to cancel)"

if ([string]::IsNullOrWhiteSpace($selectedBackup)) {
    Write-Host "Restore cancelled." -ForegroundColor $Yellow
    exit 0
}

Write-Host "Restoring from backup: $selectedBackup" -ForegroundColor $Blue
try {
    npm run restore -- $selectedBackup
    Write-Host "`n✓ Restore completed successfully!" -ForegroundColor $Green
} catch {
    Write-Host "`n✗ Restore failed: $_" -ForegroundColor $Red
    exit 1
}
