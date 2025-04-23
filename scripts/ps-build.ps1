<#
.SYNOPSIS
    PowerShell script for building the StreamChain platform
.DESCRIPTION
    Provides a PowerShell-friendly interface for building the platform
.PARAMETER Type
    Build type (full, static, jekyll, github)
#>

param (
    [Parameter(Position=0)]
    [ValidateSet("full", "static", "jekyll", "github")]
    [string]$Type = "full"
)

# Set colors for terminal output
$Blue = [ConsoleColor]::Cyan
$Green = [ConsoleColor]::Green
$Red = [ConsoleColor]::Red
$Yellow = [ConsoleColor]::Yellow

# Banner
Write-Host "🔨 SxS Build System" -ForegroundColor $Blue
Write-Host "==================" -ForegroundColor $Blue

# Check for Ruby if needed
if ($Type -eq "jekyll") {
    Write-Host "Checking for Ruby installation..." -ForegroundColor $Blue
    $rubyAvailable = $false

    try {
        $rubyVersion = ruby -v
        Write-Host "✓ Ruby found: $rubyVersion" -ForegroundColor $Green
        $rubyAvailable = $true
    } catch {
        Write-Host "✗ Ruby not found or not available in PATH" -ForegroundColor $Red
        Write-Host "Jekyll build will likely fail. Consider using 'static' build instead." -ForegroundColor $Yellow
    }
}

# Run the appropriate build command
Write-Host "Starting $Type build..." -ForegroundColor $Blue

try {
    switch ($Type) {
        "full" {
            npm run build
        }
        "static" {
            npm run build:static
        }
        "jekyll" {
            npm run build:jekyll
        }
        "github" {
            npm run build:github
        }
    }

    Write-Host "`n✓ Build completed successfully!" -ForegroundColor $Green

    # Create .nojekyll file if it doesn't exist
    $nojekyllPath = Join-Path -Path $PSScriptRoot -ChildPath ".." -Resolve | Join-Path -ChildPath ".nojekyll"
    if (-not (Test-Path -Path $nojekyllPath)) {
        Write-Host "Creating .nojekyll file for GitHub Pages..." -ForegroundColor $Blue
        New-Item -ItemType File -Path $nojekyllPath -Force | Out-Null
        Write-Host "✓ .nojekyll file created" -ForegroundColor $Green
    }
} catch {
    Write-Host "`n✗ Build failed: $_" -ForegroundColor $Red
    exit 1
}

Write-Host "`nYou can also use: sxs build" -ForegroundColor $Yellow
