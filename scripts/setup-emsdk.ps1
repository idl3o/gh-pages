# setup-emsdk.ps1
# Script to download, install, and configure Emscripten SDK for WebAssembly development

$ErrorActionPreference = "Stop"
$emsdkDir = "emsdk"
$emsdkPath = Join-Path -Path $PSScriptRoot -ChildPath $emsdkDir

# Create a function to display status messages
function Write-Status {
    param (
        [string]$Message
    )
    Write-Host "🚀 $Message" -ForegroundColor Cyan
}

# Check if emsdk directory already exists
if (Test-Path -Path $emsdkPath) {
    Write-Status "Emscripten SDK directory already exists at: $emsdkPath"
    Write-Status "Updating existing installation..."

    Push-Location $emsdkPath
    # Update the emsdk
    Write-Status "Pulling latest changes from emsdk repository..."
    git pull
} else {
    # Clone the emsdk repo
    Write-Status "Cloning Emscripten SDK repository..."
    git clone https://github.com/emscripten-core/emsdk.git $emsdkPath

    Push-Location $emsdkPath
}

# Install the latest SDK tools
Write-Status "Installing the latest SDK tools (this may take several minutes)..."
.\emsdk.bat install latest

# Make the latest SDK active
Write-Status "Activating the latest SDK..."
.\emsdk.bat activate latest

# Setup environment variables
Write-Status "Setting up environment variables..."
.\emsdk_env.bat

# Verify the installation
Write-Status "Verifying the installation..."
$emccVersion = & emcc --version
if ($LASTEXITCODE -eq 0) {
    Write-Status "Emscripten Compiler (emcc) version: $emccVersion"
    Write-Status "✅ Emscripten SDK has been successfully installed and configured!"
    Write-Status "You can now use 'make_web' task in VS Code to build the web version of your project."
} else {
    Write-Error "Failed to run emcc. Please make sure the installation completed successfully."
}

# Pop back to original directory
Pop-Location

Write-Status "To use emscripten in a new terminal session, you need to run the following command:"
Write-Host "    $emsdkPath\emsdk_env.bat" -ForegroundColor Yellow
Write-Status "You might want to add this to your PowerShell profile for convenience."
