<#
.SYNOPSIS
    PowerShell script for deploying the StreamChain platform
.DESCRIPTION
    Handles deployment operations with options for backup and deployment target
.PARAMETER Target
    Deployment target (full, docs, dashboard)
.PARAMETER Backup
    Create backup before deploying
#>

param (
    [Parameter(Position=0)]
    [ValidateSet("full", "docs", "dashboard")]
    [string]$Target = "full",

    [Parameter()]
    [switch]$Backup
)

# Set colors for terminal output
$Blue = [ConsoleColor]::Cyan
$Green = [ConsoleColor]::Green
$Red = [ConsoleColor]::Red
$Yellow = [ConsoleColor]::Yellow

# Banner
Write-Host "🚀 StreamChain Deployment" -ForegroundColor $Blue
Write-Host "======================" -ForegroundColor $Blue

# Create backup if requested
if ($Backup) {
    Write-Host "Creating backup before deployment..." -ForegroundColor $Blue
    try {
        npm run backup:all
        Write-Host "✓ Backup created successfully" -ForegroundColor $Green
    } catch {
        Write-Host "⚠️ Backup failed but continuing with deployment: $_" -ForegroundColor $Yellow
    }
}

# Run the appropriate deploy command
Write-Host "Starting deployment for target: $Target" -ForegroundColor $Blue

try {
    switch ($Target) {
        "full" {
            npm run docs:deploy
            npm run dashboard:build
        }
        "docs" {
            npm run docs:deploy
        }
        "dashboard" {
            npm run dashboard:build
        }
    }

    Write-Host "`n✓ Deployment completed successfully!" -ForegroundColor $Green

    # Check for .nojekyll file
    $nojekyllPath = Join-Path -Path $PSScriptRoot -ChildPath ".." -Resolve | Join-Path -ChildPath ".nojekyll"
    if (-not (Test-Path -Path $nojekyllPath)) {
        Write-Host "Creating .nojekyll file for GitHub Pages..." -ForegroundColor $Blue
        New-Item -ItemType File -Path $nojekyllPath -Force | Out-Null
        Write-Host "✓ .nojekyll file created" -ForegroundColor $Green
    }

    Write-Host "`nTo view your site, check the GitHub Pages section in your repository settings." -ForegroundColor $Yellow

    switch ($Target) {
        "dashboard" {
            Write-Host "`nDashboard URL: https://yourusername.github.io/gh-pages/creator-dashboard.html" -ForegroundColor $Yellow
        }
    }
} catch {
    Write-Host "`n✗ Deployment failed: $_" -ForegroundColor $Red
    exit 1
}
