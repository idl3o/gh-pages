# Project RED X - Ruby Setup Script
# This script checks for and installs Ruby and required gems for Jekyll processing

param (
    [switch]$Install,
    [switch]$SkipGemInstall,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
if ($Verbose) {
    $VerbosePreference = "Continue"
}

# Helper function for colored output
function Write-ColorOutput {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Message,

        [Parameter(Mandatory = $false)]
        [string]$ForegroundColor = "White"
    )

    Write-Host $Message -ForegroundColor $ForegroundColor
}

function Test-RubyInstallation {
    try {
        $rubyVersion = (ruby -v) 2>&1
        if ($rubyVersion -match "ruby \d+\.\d+\.\d+") {
            Write-ColorOutput "Ruby is installed: $rubyVersion" "Green"
            return $true
        }
    }
    catch {
        Write-ColorOutput "Ruby is not installed or not in PATH" "Yellow"
        return $false
    }
    return $false
}

function Install-Ruby {
    Write-ColorOutput "Installing Ruby..." "Cyan"

    $rubyInstallerUrl = "https://github.com/oneclick/rubyinstaller2/releases/download/RubyInstaller-3.2.2-1/rubyinstaller-devkit-3.2.2-1-x64.exe"
    $installerPath = Join-Path $env:TEMP "rubyinstaller.exe"

    try {
        # Download the installer
        Write-ColorOutput "Downloading Ruby installer from $rubyInstallerUrl..." "Cyan"
        Invoke-WebRequest -Uri $rubyInstallerUrl -OutFile $installerPath

        # Run the installer
        Write-ColorOutput "Running Ruby installer..." "Cyan"
        Start-Process -FilePath $installerPath -ArgumentList '/silent', '/tasks=modpath' -Wait

        # Clean up
        Remove-Item $installerPath

        # Verify installation
        if (Test-RubyInstallation) {
            Write-ColorOutput "Ruby installed successfully!" "Green"
            return $true
        }
        else {
            Write-ColorOutput "Ruby installation completed but Ruby is not in PATH. Please restart your terminal and try again." "Yellow"
            return $false
        }
    }
    catch {
        Write-ColorOutput "Failed to install Ruby: $_" "Red"
        return $false
    }
}

function Test-GemInstallation {
    param (
        [string]$GemName
    )

    try {
        $output = (gem list -i "^$GemName$") 2>&1
        return ($output -match "true")
    }
    catch {
        return $false
    }
}

function Install-RequiredGems {
    Write-ColorOutput "Installing required gems..." "Cyan"

    $requiredGems = @("bundler", "jekyll", "webrick", "rouge", "sassc")
    $allInstalled = $true

    foreach ($gem in $requiredGems) {
        if (-not (Test-GemInstallation -GemName $gem)) {
            Write-ColorOutput "Installing gem: $gem..." "Cyan"
            try {
                $output = (gem install $gem) 2>&1
                if (Test-GemInstallation -GemName $gem) {
                    Write-ColorOutput "Installed $gem successfully" "Green"
                }
                else {
                    Write-ColorOutput "Failed to install $gem" "Red"
                    $allInstalled = $false
                }
            }
            catch {
                Write-ColorOutput "Error installing $gem: $_" "Red"
                $allInstalled = $false
            }
        }
        else {
            Write-ColorOutput "Gem $gem is already installed" "Green"
        }
    }

    return $allInstalled
}

function Update-Gemfile {
    param (
        [string]$ProjectRoot
    )

    $gemfilePath = Join-Path $ProjectRoot "Gemfile"

    if (-not (Test-Path $gemfilePath)) {
        Write-ColorOutput "Creating Gemfile..." "Cyan"

        $gemfileContent = @"
source 'https://rubygems.org'

# Jekyll and related dependencies
gem "jekyll", "~> 4.3.2"
gem "webrick", "~> 1.8"  # Required for Ruby 3.0+

# Jekyll plugins
group :jekyll_plugins do
  gem "jekyll-feed", "~> 0.17"
  gem "jekyll-seo-tag", "~> 2.8"
  gem "jekyll-sitemap", "~> 1.4"
  gem "jekyll-remote-theme", "~> 0.4.3"
end

# Windows and JRuby does not include zoneinfo files
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", "~> 2.0"
  gem "tzinfo-data"
end

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]

# Lock sass converters to avoid compatibility issues
gem "jekyll-sass-converter", "~> 3.0"
gem "sass-embedded", "~> 1.62"
"@

        Set-Content -Path $gemfilePath -Value $gemfileContent
        Write-ColorOutput "Created Gemfile at $gemfilePath" "Green"
        return $true
    }
    else {
        Write-ColorOutput "Gemfile already exists at $gemfilePath" "Green"
        return $true
    }
}

function Install-BundleDependencies {
    param (
        [string]$ProjectRoot
    )

    $gemfilePath = Join-Path $ProjectRoot "Gemfile"

    if (-not (Test-Path $gemfilePath)) {
        Write-ColorOutput "Gemfile not found at $gemfilePath" "Red"
        return $false
    }

    try {
        Write-ColorOutput "Installing bundle dependencies..." "Cyan"
        Push-Location $ProjectRoot

        # Ensure bundler is installed
        if (-not (Test-GemInstallation -GemName "bundler")) {
            Write-ColorOutput "Installing bundler..." "Cyan"
            gem install bundler
        }

        # Install dependencies
        bundle install
        $success = $LASTEXITCODE -eq 0

        Pop-Location

        if ($success) {
            Write-ColorOutput "Bundle dependencies installed successfully" "Green"
        }
        else {
            Write-ColorOutput "Failed to install bundle dependencies" "Red"
        }

        return $success
    }
    catch {
        if ($null -ne (Get-Location)) {
            Pop-Location
        }
        Write-ColorOutput "Error installing bundle dependencies: $_" "Red"
        return $false
    }
}

# Main script execution flow
Write-ColorOutput "Project RED X - Ruby Setup" "Cyan"
Write-ColorOutput "=========================" "Cyan"

# Check if Ruby is installed
$rubyInstalled = Test-RubyInstallation

# Install Ruby if requested or not installed
if (-not $rubyInstalled -and $Install) {
    $rubyInstalled = Install-Ruby

    if (-not $rubyInstalled) {
        Write-ColorOutput "Ruby installation failed. Please install Ruby manually." "Red"
        exit 1
    }
}

# Stop here if Ruby is not installed and installation was not requested
if (-not $rubyInstalled -and -not $Install) {
    Write-ColorOutput "Ruby is not installed. Run this script with -Install to install Ruby." "Yellow"
    exit 1
}

# Install gems if requested
if (-not $SkipGemInstall) {
    $gemsInstalled = Install-RequiredGems

    if (-not $gemsInstalled) {
        Write-ColorOutput "Failed to install all required gems. Some functionality may be limited." "Yellow"
    }
}

# Update Gemfile
$projectRoot = Split-Path -Parent $PSCommandPath
$gemfileUpdated = Update-Gemfile -ProjectRoot $projectRoot

if (-not $gemfileUpdated) {
    Write-ColorOutput "Failed to update Gemfile" "Red"
    exit 1
}

# Install bundle dependencies
$bundleInstalled = Install-BundleDependencies -ProjectRoot $projectRoot

if (-not $bundleInstalled) {
    Write-ColorOutput "Failed to install bundle dependencies" "Red"
    exit 1
}

Write-ColorOutput "Ruby setup completed successfully!" "Green"
