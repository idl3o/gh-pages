#!/usr/bin/env pwsh
# fix-node-detection.ps1
# Helper script to fix Node.js detection issues with Emscripten
# Created: April 28, 2025

# Define color codes
$ColorInfo = @{ ForegroundColor = 'Cyan' }
$ColorSuccess = @{ ForegroundColor = 'Green' }
$ColorWarning = @{ ForegroundColor = 'Yellow' }
$ColorError = @{ ForegroundColor = 'Red' }

function Write-ColorMessage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,

        [Parameter(Mandatory = $false)]
        [hashtable]$Color = $ColorInfo
    )

    Write-Host $Message @Color
}

# Check if node is in PATH
$nodeExePath = $null
try {
    $nodeCommand = Get-Command "node" -ErrorAction SilentlyContinue
    if ($nodeCommand) {
        $nodeExePath = $nodeCommand.Source
        Write-ColorMessage "Node.js found at: $nodeExePath" $ColorSuccess
    }
}
catch {
    Write-ColorMessage "Error checking for Node.js in PATH" $ColorWarning
}

# If not found in PATH, check common locations
if (-not $nodeExePath) {
    Write-ColorMessage "Node.js not found in PATH. Checking common locations..." $ColorWarning

    $possiblePaths = @(
        "C:\Program Files\nodejs\node.exe",
        "C:\Program Files (x86)\nodejs\node.exe",
        "$env:APPDATA\npm\node.exe",
        "$env:ProgramFiles\nodejs\node.exe",
        "$env:ProgramFiles(x86)\nodejs\node.exe",
        "$env:USERPROFILE\AppData\Roaming\nvm\current\node.exe"
    )

    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            $nodeExePath = $path
            Write-ColorMessage "Node.js found at: $nodeExePath" $ColorSuccess

            # Add directory to PATH
            $nodePath = Split-Path -Parent $nodeExePath
            $env:PATH = "$nodePath;$env:PATH"
            Write-ColorMessage "Added to PATH: $nodePath" $ColorSuccess
            break
        }
    }
}

# If still not found, ask user to install Node.js
if (-not $nodeExePath) {
    Write-ColorMessage "Node.js not found on this system." $ColorError
    Write-ColorMessage "Please install Node.js from https://nodejs.org/" $ColorInfo
    Write-ColorMessage "After installation, restart your computer or terminal and try again." $ColorInfo
    exit 1
}

# Create a .emscripten_config file with correct Node.js path
$emscriptenConfigPath = "$env:USERPROFILE\.emscripten_config"
$emscriptenConfig = @"
import os
NODE_JS = '$($nodeExePath.Replace('\', '\\'))'
PYTHON = os.path.expanduser(os.getenv('PYTHON', 'python'))
JAVA = 'java'
"@

Write-ColorMessage "Creating Emscripten config with Node.js path..." $ColorInfo
Set-Content -Path $emscriptenConfigPath -Value $emscriptenConfig -Force
Write-ColorMessage "Created config at: $emscriptenConfigPath" $ColorSuccess

# Set environment variables
$env:NODE_JS = $nodeExePath
$env:EM_CONFIG = $emscriptenConfigPath

# Output status
Write-ColorMessage "Node.js configuration completed successfully!" $ColorSuccess
Write-ColorMessage "NODE_JS = $env:NODE_JS" $ColorInfo
Write-ColorMessage "EM_CONFIG = $env:EM_CONFIG" $ColorInfo

# Create a .node_path file for the build script to use
$nodePathFile = Join-Path (Split-Path -Parent $MyInvocation.MyCommand.Path) ".node_path"
Set-Content -Path $nodePathFile -Value $nodeExePath -Force
Write-ColorMessage "Created .node_path file at: $nodePathFile" $ColorSuccess

exit 0
