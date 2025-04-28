#!/usr/bin/env pwsh
# fix-emscripten-llvm.ps1
# Script to fix Emscripten LLVM path configuration issues
# Created: April 28, 2025

# Define color codes
$ColorInfo = @{ ForegroundColor = 'Cyan' }
$ColorSuccess = @{ ForegroundColor = 'Green' }
$ColorWarning = @{ ForegroundColor = 'Yellow' }
$ColorError = @{ ForegroundColor = 'Red' }

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$EmsdkDir = Join-Path -Path $ProjectDir -ChildPath "emsdk"

function Write-ColorMessage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,

        [Parameter(Mandatory = $false)]
        [hashtable]$Color = $ColorInfo,

        [Parameter(Mandatory = $false)]
        [switch]$NoNewLine
    )

    if ($NoNewLine) {
        Write-Host $Message @Color -NoNewline
    }
    else {
        Write-Host $Message @Color
    }
}

Write-ColorMessage "Emscripten LLVM Configuration Fix" $ColorSuccess
Write-ColorMessage "=============================" $ColorSuccess

# Check for Node.js
Write-ColorMessage "Checking Node.js..." $ColorInfo
try {
    $nodeCommand = Get-Command "node" -ErrorAction SilentlyContinue
    if ($nodeCommand) {
        $nodePath = $nodeCommand.Source
        Write-ColorMessage "Node.js found at: $nodePath" $ColorSuccess
        # Set NODE_JS environment variable for Emscripten
        $env:NODE_JS = $nodePath
    } else {
        Write-ColorMessage "Node.js not found in PATH." $ColorWarning
    }
} catch {
    Write-ColorMessage "Error checking for Node.js: $_" $ColorWarning
}

# Check that emsdk directory exists
if (-not (Test-Path $EmsdkDir)) {
    Write-ColorMessage "Emscripten SDK not found at: $EmsdkDir" $ColorError
    Write-ColorMessage "Please run setup-emsdk.ps1 first to install Emscripten SDK." $ColorInfo
    exit 1
}

# Find all possible locations for clang.exe
Write-ColorMessage "Looking for clang.exe in the Emscripten SDK..." $ColorInfo
$clangExeFiles = Get-ChildItem -Path $EmsdkDir -Filter "clang.exe" -Recurse -ErrorAction SilentlyContinue

if ($clangExeFiles -and $clangExeFiles.Count -gt 0) {
    # Found clang.exe, use the first one found
    $clangPath = $clangExeFiles[0].FullName
    $llvmRoot = Split-Path -Parent $clangPath
    Write-ColorMessage "Found clang.exe at: $clangPath" $ColorSuccess
} else {
    # If clang.exe not found, try to download/install it
    Write-ColorMessage "clang.exe not found. Reinstalling LLVM tools..." $ColorWarning

    # Go to emsdk directory
    Set-Location $EmsdkDir

    # Run emsdk update
    Write-ColorMessage "Updating Emscripten SDK..." $ColorInfo
    ./emsdk.bat update

    # Run emsdk install to ensure LLVM is installed
    Write-ColorMessage "Installing latest Emscripten SDK with LLVM..." $ColorInfo
    ./emsdk.bat install latest

    # Activate latest version
    Write-ColorMessage "Activating latest Emscripten SDK..." $ColorInfo
    ./emsdk.bat activate latest

    # Check again for clang.exe
    $clangExeFiles = Get-ChildItem -Path $EmsdkDir -Filter "clang.exe" -Recurse -ErrorAction SilentlyContinue

    if ($clangExeFiles -and $clangExeFiles.Count -gt 0) {
        $clangPath = $clangExeFiles[0].FullName
        $llvmRoot = Split-Path -Parent $clangPath
        Write-ColorMessage "Now found clang.exe at: $clangPath" $ColorSuccess
    } else {
        Write-ColorMessage "Failed to find clang.exe even after reinstall. Manual intervention required." $ColorError
        exit 1
    }
}

# Find emscripten root directory
$emccFiles = Get-ChildItem -Path $EmsdkDir -Filter "emcc.bat" -Recurse -ErrorAction SilentlyContinue
if ($emccFiles -and $emccFiles.Count -gt 0) {
    $emccPath = $emccFiles[0].FullName
    $emscriptenRoot = Split-Path -Parent $emccPath
    Write-ColorMessage "Found emcc.bat at: $emccPath" $ColorSuccess
} else {
    Write-ColorMessage "Failed to find emcc.bat. Cannot continue." $ColorError
    exit 1
}

# Find python
$pythonInPath = Get-Command "python" -ErrorAction SilentlyContinue
$pythonPath = if ($pythonInPath) { $pythonInPath.Source } else { "python" }

# Create/update the .emscripten config file
$configFile = "$env:USERPROFILE\.emscripten"
$configContent = @"
import os

# The LLVM root directory (contains bin/clang)
LLVM_ROOT = '$($llvmRoot.Replace('\', '\\'))'

# Directory of the Emscripten SDK
EMSCRIPTEN_ROOT = '$($emscriptenRoot.Replace('\', '\\'))'

# Node.js executable (for JavaScript interpretation)
NODE_JS = '$($env:NODE_JS.Replace('\', '\\'))'

# Python executable
PYTHON = '$($pythonPath.Replace('\', '\\'))'

# Java executable (optional)
JAVA = 'java'

# Required for optimizer
BINARYEN_ROOT = '$($EmsdkDir.Replace('\', '\\'))\\upstream\\bin'

# Compiler engine
COMPILER_ENGINE = NODE_JS
JS_ENGINES = [NODE_JS]

# Temporarily allow old toolchain
LLVM_TEMPORARILY_ALLOW_OLD_TOOLCHAIN = True
"@

Write-ColorMessage "Creating/updating Emscripten configuration file..." $ColorInfo
Set-Content -Path $configFile -Value $configContent -Force

# Set the EM_CONFIG environment variable
$env:EM_CONFIG = $configFile
Write-ColorMessage "Set EM_CONFIG environment variable to: $configFile" $ColorSuccess

# Create a .emscripten_llvm file to store the LLVM path for future use
$llvmInfoFile = Join-Path -Path $ScriptDir -ChildPath ".emscripten_llvm"
Set-Content -Path $llvmInfoFile -Value $llvmRoot -Force

# Test the emcc command
Write-ColorMessage "Testing emcc configuration..." $ColorInfo
try {
    Set-Location $ScriptDir
    $env:PATH = "$llvmRoot;$env:PATH"
    $output = & $emccPath --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-ColorMessage "Emscripten test successful: $output" $ColorSuccess
        Write-ColorMessage "LLVM and Emscripten are now properly configured!" $ColorSuccess
        Write-ColorMessage "You can now run 'make web' or the VS Code task to build the web version." $ColorInfo
    } else {
        Write-ColorMessage "Emscripten test failed with exit code: $LASTEXITCODE" $ColorError
        Write-ColorMessage "Output: $output" $ColorError
        exit 1
    }
} catch {
    Write-ColorMessage "Error testing emcc: $_" $ColorError
    exit 1
}

exit 0
