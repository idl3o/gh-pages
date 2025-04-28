#!/usr/bin/env pwsh
# fix-clang-manually.ps1
# Script to manually download and set up clang for Emscripten
# Created: April 28, 2025

param$VerboseParam,
    [switch]$Force
)

# Define color codes
$ColorInfo = @{ ForegroundColor = 'Cyan' }
$ColorSuccess = @{ ForegroundColor = 'Green' }
$ColorWarning = @{ ForegroundColor = 'Yellow' }
$ColorError = @{ ForegroundColor = 'Red' }

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$EmsdkDir = Join-Path -Path $ProjectDir -ChildPath "emsdk"

# Use emsdk itself to install clang rather than downloading separately
function Write-ColorMessage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,

        [Parameter(Mandatory = $false)]
        [hashtable]$Color = $ColorInfo
    )

    Write-Host $Message @Color
}

function Update-EmsdkAndForceInstall {
    Write-ColorMessage "Using emsdk to install LLVM/Clang..." $ColorInfo

    # Navigate to emsdk directory
    Set-Location $EmsdkDir

    # Update emsdk
    Write-ColorMessage "Updating emsdk..." $ColorInfo
    & ./emsdk.bat update

    # Install a specific version of Emscripten with LLVM (a version known to be stable)
    Write-ColorMessage "Installing Emscripten 3.1.46 (includes LLVM)..." $ColorInfo
    & ./emsdk.bat install 3.1.46

    # Activate this version
    Write-ColorMessage "Activating Emscripten 3.1.46..." $ColorInfo
    & ./emsdk.bat activate 3.1.46

    # Generate the config file to set up paths
    Write-ColorMessage "Generating Emscripten config..." $ColorInfo
    & ./emsdk.bat construct_env

    # Return success if all commands succeeded
    return ($LASTEXITCODE -eq 0)
}

function Find-EmscriptenPaths {
    Write-ColorMessage "Locating Emscripten components..." $ColorInfo

    # Try to find the actual emscripten directory - it might be in different locations
    $emscriptenDirectories = @(
        "$EmsdkDir\upstream\emscripten",
        "$EmsdkDir\emscripten"
    )

    $emscriptenRoot = $null
    foreach ($dir in $emscriptenDirectories) {
        if (Test-Path "$dir\emcc.py") {
            $emscriptenRoot = $dir
            Write-ColorMessage "Found emscripten root at: $emscriptenRoot" $ColorSuccess
            break
        }
    }

    if (-not $emscriptenRoot) {
        # Search for emcc.py directly
        $emccPyFiles = Get-ChildItem -Path $EmsdkDir -Filter "emcc.py" -Recurse -ErrorAction SilentlyContinue
        if ($emccPyFiles -and $emccPyFiles.Count -gt 0) {
            $emscriptenRoot = Split-Path -Parent $emccPyFiles[0].FullName
            Write-ColorMessage "Found emcc.py at: $($emccPyFiles[0].FullName)" $ColorSuccess
        } else {
            Write-ColorMessage "Failed to find emcc.py. Cannot continue." $ColorError
            return @{}
        }
    }

    # Find clang executable
    $clangFiles = Get-ChildItem -Path $EmsdkDir -Filter "clang.exe" -Recurse -ErrorAction SilentlyContinue
    if ($clangFiles -and $clangFiles.Count -gt 0) {
        $clangPath = $clangFiles[0].FullName
        $llvmRoot = Split-Path -Parent $clangPath
        Write-ColorMessage "Found clang.exe at: $clangPath" $ColorSuccess
    } else {
        Write-ColorMessage "Failed to find clang.exe. Cannot continue." $ColorError
        return @{}
    }

    # Find wasm-opt.exe for Binaryen
    $wasmOptFiles = Get-ChildItem -Path $EmsdkDir -Filter "wasm-opt.exe" -Recurse -ErrorAction SilentlyContinue
    if ($wasmOptFiles -and $wasmOptFiles.Count -gt 0) {
        $wasmOptPath = $wasmOptFiles[0].FullName
        $binaryenRoot = Split-Path -Parent $wasmOptPath
        Write-ColorMessage "Found wasm-opt.exe at: $wasmOptPath" $ColorSuccess
    } else {
        # If not found, use LLVM dir as fallback for binaryen root
        $binaryenRoot = $llvmRoot
        Write-ColorMessage "wasm-opt.exe not found, using LLVM dir as Binaryen root." $ColorWarning
    }

    # Find Node.js from emsdk installation
    $nodePath = $null
    $nodeFiles = Get-ChildItem -Path $EmsdkDir -Filter "node.exe" -Recurse -ErrorAction SilentlyContinue
    if ($nodeFiles -and $nodeFiles.Count -gt 0) {
        $nodePath = $nodeFiles[0].FullName
        Write-ColorMessage "Found node.exe at: $nodePath" $ColorSuccess
    } else {
        $nodePath = Get-NodePath
        if ($nodePath -eq "node") {
            Write-ColorMessage "Node.js not found in emsdk, using system Node.js if available." $ColorWarning
        } else {
            Write-ColorMessage "Using system Node.js at: $nodePath" $ColorInfo
        }
    }

    # Find Python from emsdk installation
    $pythonPath = $null
    $pythonFiles = Get-ChildItem -Path $EmsdkDir -Filter "python.exe" -Recurse -ErrorAction SilentlyContinue
    if ($pythonFiles -and $pythonFiles.Count -gt 0) {
        $pythonPath = $pythonFiles[0].FullName
        Write-ColorMessage "Found python.exe at: $pythonPath" $ColorSuccess
    } else {
        # Try to find in system
        try {
            $pythonCmd = Get-Command "python" -ErrorAction SilentlyContinue
            if ($pythonCmd) {
                $pythonPath = $pythonCmd.Source
                Write-ColorMessage "Using system Python at: $pythonPath" $ColorInfo
            } else {
                Write-ColorMessage "Python not found, using default 'python' command." $ColorWarning
                $pythonPath = "python"
            }
        } catch {
            Write-ColorMessage "Python not found, using default 'python' command." $ColorWarning
            $pythonPath = "python"
        }
    }

    # Return a hashtable with the paths
    return @{
        "EmscriptenRoot" = $emscriptenRoot
        "LLVMRoot" = $llvmRoot
        "BinaryenRoot" = $binaryenRoot
        "NodePath" = $nodePath
        "PythonPath" = $pythonPath
    }
}

function Get-NodePath {
    # Check if node is in PATH
    try {
        $nodeCommand = Get-Command "node" -ErrorAction SilentlyContinue
        if ($nodeCommand) {
            return $nodeCommand.Source
        }
    } catch {
        # Continue to other checks
    }

    # Check common locations
    $possiblePaths = @(
        "C:\Program Files\nodejs\node.exe",
        "C:\Program Files (x86)\nodejs\node.exe",
        "$env:ProgramFiles\nodejs\node.exe",
        "$env:ProgramFiles(x86)\nodejs\node.exe",
        "$env:USERPROFILE\AppData\Roaming\nvm\current\node.exe"
    )

    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            return $path
        }
    }

    # Return default
    return "node"
}

function Update-EmscriptenConfig {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Paths
    )

    $configPath = "$env:USERPROFILE\.emscripten"

    # Create config if it doesn't exist
    $configContent = @"
# This file is automatically generated by fix-clang-manually.ps1
# Last updated: $(Get-Date)

import os

# The root of the Emscripten SDK
EMSCRIPTEN_ROOT = '$($Paths.EmscriptenRoot.Replace('\', '\\'))'

# The LLVM root directory containing clang/clang++
LLVM_ROOT = '$($Paths.LLVMRoot.Replace('\', '\\'))'

# The Binaryen root directory
BINARYEN_ROOT = '$($Paths.BinaryenRoot.Replace('\', '\\'))'

# Node.js executable
NODE_JS = '$($Paths.NodePath.Replace('\', '\\'))'

# Python executable
PYTHON = '$($Paths.PythonPath.Replace('\', '\\'))'

# Java executable (optional)
JAVA = 'java'

# Compiler engine (Node.js)
COMPILER_ENGINE = NODE_JS
JS_ENGINES = [NODE_JS]

# Additional settings
EMSCRIPTEN_TEMP_DIR = 'C:\\\\Windows\\\\Temp'
CACHE = os.path.expanduser('~\\.emscripten_cache')

# Allow old toolchain
LLVM_TEMPORARILY_ALLOW_OLD_TOOLCHAIN = True
"@
    Set-Content -Path $configPath -Value $configContent -Force
    Write-ColorMessage "Created Emscripten configuration at: $configPath" $ColorSuccess

    # Set environment variable to use this config
    $env:EM_CONFIG = $configPath
    Write-ColorMessage "Set EM_CONFIG environment variable to: $configPath" $ColorInfo

    return $true
}

function Test-EmccConfiguration {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Paths
    )

    Write-ColorMessage "Testing emcc configuration..." $ColorInfo

    # Build the emcc path based on the emscripten root
    $emccPath = Join-Path -Path $Paths.EmscriptenRoot -ChildPath "emcc.py"
    if (-not (Test-Path $emccPath)) {
        Write-ColorMessage "Could not find emcc.py at: $emccPath" $ColorError
        return $false
    }

    # Test emcc
    try {
        $env:EM_CONFIG = "$env:USERPROFILE\.emscripten"
        $output = & $Paths.PythonPath $emccPath --version

        if ($LASTEXITCODE -eq 0) {
            Write-ColorMessage "emcc test successful: $output" $ColorSuccess
            return $true
        } else {
            Write-ColorMessage "emcc test failed with exit code: $LASTEXITCODE" $ColorError
            Write-ColorMessage "Output: $output" $ColorWarning
            return $false
        }
    }
    catch {
        Write-ColorMessage "Error testing emcc: $_" $ColorError
        return $false
    }
}

function Create-TestEmccBatch {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Paths
    )

    $batchPath = Join-Path -Path $ScriptDir -ChildPath "run-emcc.bat"
    $batchContent = @"
@echo off
:: This batch file is automatically generated by fix-clang-manually.ps1
:: It provides a correct way to invoke emcc from the command line

set EM_CONFIG=$env:USERPROFILE\.emscripten
set PATH=$($Paths.LLVMRoot);%PATH%
set PYTHON_PATH=$($Paths.PythonPath)
set EMSCRIPTEN_ROOT=$($Paths.EmscriptenRoot)

echo Running emcc with proper environment...
"%PYTHON_PATH%" "%EMSCRIPTEN_ROOT%\emcc.py" %*
"@
    Set-Content -Path $batchPath -Value $batchContent -Force
    Write-ColorMessage "Created emcc batch file at: $batchPath" $ColorSuccess

    return $batchPath
}

# Main script execution
Write-ColorMessage "Emscripten and LLVM/Clang Configuration" $ColorSuccess
Write-ColorMessage "=====================================" $ColorSuccess

# Verify Emscripten SDK exists
if (-not (Test-Path $EmsdkDir)) {
    Write-ColorMessage "Emscripten SDK directory not found at: $EmsdkDir" $ColorError

    # Try to create the emsdk directory and clone the repository
    Write-ColorMessage "Attempting to install Emscripten SDK..." $ColorWarning

    # Create the emsdk directory
    New-Item -ItemType Directory -Path $EmsdkDir -Force | Out-Null

    # Clone emsdk repository
    Set-Location $ProjectDir
    & git clone https://github.com/emscripten-core/emsdk.git

    if ($LASTEXITCODE -ne 0) {
        Write-ColorMessage "Failed to clone emsdk repository. Please run setup-emsdk.ps1 first." $ColorError
        exit 1
    }
}

# Update emsdk and install required components
if (-not (Update-EmsdkAndForceInstall)) {
    Write-ColorMessage "Failed to update and install Emscripten and LLVM/Clang." $ColorError
    exit 1
}

# Find the paths to Emscripten components
$emscriptenPaths = Find-EmscriptenPaths
if (-not $emscriptenPaths.ContainsKey("EmscriptenRoot")) {
    Write-ColorMessage "Failed to locate Emscripten components." $ColorError
    exit 1
}

# Update the Emscripten configuration file
if (-not (Update-EmscriptenConfig -Paths $emscriptenPaths)) {
    Write-ColorMessage "Failed to update Emscripten configuration." $ColorError
    exit 1
}

# Test the Emscripten configuration
if (-not (Test-EmccConfiguration -Paths $emscriptenPaths)) {
    Write-ColorMessage "Emscripten configuration test failed." $ColorError
    Write-ColorMessage "Creating a batch file to help run emcc correctly..." $ColorInfo
    $batchPath = Create-TestEmccBatch -Paths $emscriptenPaths
    Write-ColorMessage "You can use $batchPath to run emcc commands." $ColorInfo
    exit 1
}

Write-ColorMessage "Emscripten and LLVM/Clang have been successfully configured!" $ColorSuccess
Write-ColorMessage "You can now build the Red X web version with 'make web' command." $ColorInfo
Write-ColorMessage "Try running the VS Code task 'make_web' to build the web version." $ColorInfo
exit 0

