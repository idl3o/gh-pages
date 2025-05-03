#!/usr/bin/env pwsh
# fix-emscripten.ps1
# Script to properly configure Emscripten for Red X builds
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

function Find-Command {
    param(
        [Parameter(Mandatory = $true)]
        [string]$CommandName
    )

    try {
        return Get-Command $CommandName -ErrorAction SilentlyContinue
    }
    catch {
        return $null
    }
}

function Find-NodeJS {
    Write-ColorMessage "Checking for Node.js installation..." $ColorInfo

    # Check if node is in PATH
    $nodeCommand = Find-Command "node"

    if ($nodeCommand) {
        $nodePath = $nodeCommand.Source
        Write-ColorMessage "Found Node.js in PATH: $nodePath" $ColorSuccess
        return $nodePath
    }

    # Check common installation locations
    Write-ColorMessage "Node.js not found in PATH. Checking common locations..." $ColorWarning

    $possiblePaths = @(
        "C:\Program Files\nodejs\node.exe",
        "C:\Program Files (x86)\nodejs\node.exe",
        "$env:ProgramFiles\nodejs\node.exe",
        "$env:ProgramFiles(x86)\nodejs\node.exe",
        "$env:USERPROFILE\AppData\Roaming\nvm\current\node.exe",
        "$env:USERPROFILE\scoop\apps\nodejs\current\node.exe",
        "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
    )

    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            Write-ColorMessage "Found Node.js at: $path" $ColorSuccess

            # Add to PATH
            $nodeDir = Split-Path -Parent $path
            $env:PATH = "$nodeDir;$env:PATH"

            return $path
        }
    }

    Write-ColorMessage "Node.js not found. Please install Node.js from https://nodejs.org/" $ColorError
    return $null
}

function Find-Python {
    Write-ColorMessage "Checking for Python installation..." $ColorInfo

    # Check if python is in PATH
    $pythonCommand = Find-Command "python"
    if (-not $pythonCommand) {
        $pythonCommand = Find-Command "python3"
    }

    if ($pythonCommand) {
        $pythonPath = $pythonCommand.Source
        Write-ColorMessage "Found Python in PATH: $pythonPath" $ColorSuccess
        return $pythonPath
    }

    # Check common installation locations
    Write-ColorMessage "Python not found in PATH. Checking common locations..." $ColorWarning

    $possiblePaths = @(
        "C:\Python39\python.exe",
        "C:\Python310\python.exe",
        "C:\Python311\python.exe",
        "C:\Python312\python.exe",
        "C:\Program Files\Python39\python.exe",
        "C:\Program Files\Python310\python.exe",
        "C:\Program Files\Python311\python.exe",
        "C:\Program Files\Python312\python.exe",
        "$env:USERPROFILE\AppData\Local\Programs\Python\Python39\python.exe",
        "$env:USERPROFILE\AppData\Local\Programs\Python\Python310\python.exe",
        "$env:USERPROFILE\AppData\Local\Programs\Python\Python311\python.exe",
        "$env:USERPROFILE\AppData\Local\Programs\Python\Python312\python.exe"
    )

    foreach ($path in $possiblePaths) {
        if (Test-Path $path) {
            Write-ColorMessage "Found Python at: $path" $ColorSuccess

            # Add to PATH
            $pythonDir = Split-Path -Parent $path
            $env:PATH = "$pythonDir;$env:PATH"

            return $path
        }
    }

    # Python is required for Emscripten, but we'll try to continue anyway
    Write-ColorMessage "Python not found. Emscripten may not work correctly." $ColorWarning
    return "python"
}

function Find-Java {
    Write-ColorMessage "Checking for Java installation..." $ColorInfo

    # Check if java is in PATH
    $javaCommand = Find-Command "java"

    if ($javaCommand) {
        $javaPath = $javaCommand.Source
        Write-ColorMessage "Found Java in PATH: $javaPath" $ColorSuccess
        return $javaPath
    }

    # Check common installation locations
    Write-ColorMessage "Java not found in PATH. Checking common locations..." $ColorWarning

    $possiblePaths = @(
        "C:\Program Files\Java\jdk*\bin\java.exe",
        "C:\Program Files\Java\jre*\bin\java.exe",
        "C:\Program Files (x86)\Java\jdk*\bin\java.exe",
        "C:\Program Files (x86)\Java\jre*\bin\java.exe"
    )

    foreach ($pattern in $possiblePaths) {
        $paths = Resolve-Path -Path $pattern -ErrorAction SilentlyContinue
        if ($paths) {
            $javaPath = $paths[0].Path
            Write-ColorMessage "Found Java at: $javaPath" $ColorSuccess

            # Add to PATH
            $javaDir = Split-Path -Parent $javaPath
            $env:PATH = "$javaDir;$env:PATH"

            return $javaPath
        }
    }

    # Java is optional for Emscripten, so we'll continue without it
    Write-ColorMessage "Java not found. Some Emscripten features may not work." $ColorWarning
    return "java"
}

function Check-GitAvailability {
    $gitCommand = Find-Command "git"

    if (-not $gitCommand) {
        Write-ColorMessage "Git is required but not found in PATH." $ColorError
        Write-ColorMessage "Please install Git from https://git-scm.com/downloads" $ColorInfo
        return $false
    }

    return $true
}

function Setup-Emscripten {
    # Check if emsdk directory exists
    if (Test-Path $EmsdkDir) {
        Write-ColorMessage "Emscripten SDK directory found at: $EmsdkDir" $ColorSuccess

        if (-not $Force) {
            Write-ColorMessage "Updating existing Emscripten SDK..." $ColorInfo
            Set-Location $EmsdkDir

            # Update emsdk
            ./emsdk.bat update
            if ($LASTEXITCODE -ne 0) {
                Write-ColorMessage "Failed to update Emscripten SDK. Proceeding with existing installation." $ColorWarning
            }
        }
        else {
            Write-ColorMessage "Force flag set. Reinstalling Emscripten SDK..." $ColorInfo
            Remove-Item -Recurse -Force $EmsdkDir
            Write-ColorMessage "Removed existing Emscripten SDK directory." $ColorInfo
        }
    }

    # Install emsdk if it doesn't exist or was removed due to Force flag
    if (-not (Test-Path $EmsdkDir)) {
        if (-not (Check-GitAvailability)) {
            return $false
        }

        Write-ColorMessage "Installing Emscripten SDK..." $ColorInfo
        Set-Location $ProjectDir

        git clone https://github.com/emscripten-core/emsdk.git
        if ($LASTEXITCODE -ne 0) {
            Write-ColorMessage "Failed to clone Emscripten SDK repository." $ColorError
            return $false
        }

        Set-Location $EmsdkDir
    }

    # Install the latest version
    Write-ColorMessage "Installing latest Emscripten SDK version..." $ColorInfo
    Set-Location $EmsdkDir

    ./emsdk.bat install latest
    if ($LASTEXITCODE -ne 0) {
        Write-ColorMessage "Failed to install latest Emscripten SDK." $ColorError
        return $false
    }

    # Activate the latest version
    Write-ColorMessage "Activating latest Emscripten SDK version..." $ColorInfo
    ./emsdk.bat activate latest
    if ($LASTEXITCODE -ne 0) {
        Write-ColorMessage "Failed to activate latest Emscripten SDK." $ColorError
        return $false
    }

    return $true
}

function Find-EmscriptenPaths {
    # Look for emcc (Emscripten compiler frontend)
    Write-ColorMessage "Looking for Emscripten compiler..." $ColorInfo

    # Possible locations for emcc based on emsdk structure
    $emccLocations = @(
        # New structure (newer versions)
        "$EmsdkDir\upstream\emscripten\emcc.bat",
        # Old structure (older versions)
        "$EmsdkDir\emscripten\emcc.bat"
    )

    $emccPath = $null
    foreach ($path in $emccLocations) {
        if (Test-Path $path) {
            $emccPath = $path
            break
        }
    }

    if (-not $emccPath) {
        Write-ColorMessage "Could not find emcc.bat in the Emscripten SDK." $ColorError
        return @{}
    }

    # Derive the Emscripten root directory from emcc path
    $emscriptenRoot = Split-Path -Parent $emccPath
    Write-ColorMessage "Found Emscripten root at: $emscriptenRoot" $ColorSuccess

    # Look for LLVM tools (clang)
    $llvmLocations = @(
        # New structure (newer versions)
        "$EmsdkDir\upstream\bin",
        # Old structure (older versions)
        "$EmsdkDir\clang\e$version\bin",
        "$EmsdkDir\node\$version\bin"
    )

    $llvmRoot = $null
    foreach ($path in $llvmLocations) {
        # Use wildcard to handle version directories
        $expandedPaths = Resolve-Path -Path "$path*" -ErrorAction SilentlyContinue
        if ($expandedPaths) {
            foreach ($expandedPath in $expandedPaths) {
                if (Test-Path "$($expandedPath.Path)\clang.exe") {
                    $llvmRoot = $expandedPath.Path
                    break
                }
            }
        }

        if ($llvmRoot) {
            break
        }
    }

    # Last resort - search for clang.exe in the entire emsdk directory
    if (-not $llvmRoot) {
        Write-ColorMessage "Searching entire emsdk directory for clang.exe..." $ColorWarning
        $clangFiles = Get-ChildItem -Path $EmsdkDir -Recurse -Filter "clang.exe" -ErrorAction SilentlyContinue
        if ($clangFiles) {
            $llvmRoot = Split-Path -Parent $clangFiles[0].FullName
            Write-ColorMessage "Found clang.exe at: $($clangFiles[0].FullName)" $ColorSuccess
        }
    }

    if (-not $llvmRoot) {
        Write-ColorMessage "Could not find LLVM tools (clang.exe) in the Emscripten SDK." $ColorError
        return @{}
    }

    Write-ColorMessage "Found LLVM root at: $llvmRoot" $ColorSuccess

    # Look for Binaryen (wasm-opt)
    $binrayenLocations = @(
        # New structure (newer versions)
        "$EmsdkDir\upstream\bin",
        # Old structure (older versions)
        "$EmsdkDir\binaryen\bin"
    )

    $binaryenRoot = $null
    foreach ($path in $binrayenLocations) {
        if (Test-Path "$path\wasm-opt.exe") {
            $binaryenRoot = $path
            break
        }
    }

    if (-not $binaryenRoot) {
        # Last resort - search for wasm-opt.exe in the entire emsdk directory
        $wasmOptFiles = Get-ChildItem -Path $EmsdkDir -Recurse -Filter "wasm-opt.exe" -ErrorAction SilentlyContinue
        if ($wasmOptFiles) {
            $binaryenRoot = Split-Path -Parent $wasmOptFiles[0].FullName
            Write-ColorMessage "Found wasm-opt.exe at: $($wasmOptFiles[0].FullName)" $ColorSuccess
        }
    }

    if (-not $binaryenRoot) {
        Write-ColorMessage "Could not find Binaryen tools (wasm-opt.exe) in the Emscripten SDK." $ColorWarning
        $binaryenRoot = $llvmRoot  # Fallback to LLVM root
    }
    else {
        Write-ColorMessage "Found Binaryen root at: $binaryenRoot" $ColorSuccess
    }

    # Return all paths as a hashtable
    return @{
        "EmscriptenRoot" = $emscriptenRoot
        "LLVMRoot" = $llvmRoot
        "BinaryenRoot" = $binaryenRoot
    }
}

function Create-EmscriptenConfig {
    param(
        [Parameter(Mandatory = $true)]
        [hashtable]$Paths,

        [Parameter(Mandatory = $true)]
        [string]$NodePath,

        [Parameter(Mandatory = $true)]
        [string]$PythonPath,

        [Parameter(Mandatory = $true)]
        [string]$JavaPath
    )

    # Create the config file with proper paths
    $emscriptenConfig = @"
# This file is automatically generated by fix-emscripten.ps1
# Last updated: $(Get-Date)
#
# This config file is used by the Emscripten compiler to locate
# the required tools for WebAssembly compilation.

import os

# The root of the Emscripten SDK
EMSCRIPTEN_ROOT = '$($Paths.EmscriptenRoot.Replace('\', '\\'))'

# The LLVM root directory containing clang/clang++
LLVM_ROOT = '$($Paths.LLVMRoot.Replace('\', '\\'))'

# The Binaryen root directory
BINARYEN_ROOT = '$($Paths.BinaryenRoot.Replace('\', '\\'))'

# Node.js executable
NODE_JS = '$($NodePath.Replace('\', '\\'))'

# Python executable
PYTHON = '$($PythonPath.Replace('\', '\\'))'

# Java executable (optional)
JAVA = '$($JavaPath.Replace('\', '\\'))'

# Compiler engine - we use Node.js
COMPILER_ENGINE = NODE_JS
JS_ENGINES = [NODE_JS]

# Optimize for size by default
EMSCRIPTEN_OPTIMIZATION_LEVEL = 3

# Additional settings can be added below:

# Temporarily allow old toolchain to avoid deprecation warnings
LLVM_TEMPORARILY_ALLOW_OLD_TOOLCHAIN = True
"@

    $configPath = "$env:USERPROFILE\.emscripten"
    Set-Content -Path $configPath -Value $emscriptenConfig -Force
    Write-ColorMessage "Created Emscripten configuration at: $configPath" $ColorSuccess

    # Also set the EM_CONFIG environment variable
    $env:EM_CONFIG = $configPath

    return $configPath
}

function Test-EmscriptenConfig {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ConfigPath,

        [Parameter(Mandatory = $true)]
        [hashtable]$Paths
    )

    Write-ColorMessage "Testing Emscripten configuration..." $ColorInfo

    # Test emcc
    $emccPath = Join-Path -Path $Paths.EmscriptenRoot -ChildPath "emcc.bat"

    if (-not (Test-Path $emccPath)) {
        Write-ColorMessage "Could not find emcc.bat at: $emccPath" $ColorError
        return $false
    }

    # Set environment variables for this session
    $env:EM_CONFIG = $ConfigPath

    # Test emcc version
    try {
        Write-ColorMessage "Testing emcc with version check..." $ColorInfo
        $output = & $emccPath --version 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-ColorMessage "emcc version check failed: $output" $ColorError
            return $false
        }

        Write-ColorMessage "emcc version check passed: $output" $ColorSuccess
    }
    catch {
        Write-ColorMessage "Exception running emcc: $_" $ColorError
        return $false
    }

    # Test simple compilation
    $testFolder = Join-Path -Path $env:TEMP -ChildPath "emscripten_test"
    New-Item -ItemType Directory -Path $testFolder -Force | Out-Null

    $testC = @"
#include <stdio.h>
int main() {
    printf("Hello, Emscripten!\n");
    return 0;
}
"@

    Set-Content -Path "$testFolder\test.c" -Value $testC -Force

    try {
        Write-ColorMessage "Testing simple compilation..." $ColorInfo
        $output = & $emccPath "$testFolder\test.c" -o "$testFolder\test.js" 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-ColorMessage "Simple compilation test failed: $output" $ColorError
            return $false
        }

        if (Test-Path "$testFolder\test.js") {
            Write-ColorMessage "Simple compilation test passed: Output file created successfully" $ColorSuccess
            return $true
        }
        else {
            Write-ColorMessage "Simple compilation test failed: Output file not created" $ColorError
            return $false
        }
    }
    catch {
        Write-ColorMessage "Exception during compilation test: $_" $ColorError
        return $false
    }
    finally {
        # Clean up test files
        Remove-Item -Recurse -Force $testFolder -ErrorAction SilentlyContinue
    }
}

# Main script execution
Write-ColorMessage "Emscripten Configuration Fix" $ColorInfo
Write-ColorMessage "=========================" $ColorInfo

# Find required tools
$nodePath = Find-NodeJS
if (-not $nodePath) {
    exit 1
}

$pythonPath = Find-Python
$javaPath = Find-Java

# Set up Emscripten SDK
$emsdkSetupSuccess = Setup-Emscripten
if (-not $emsdkSetupSuccess) {
    Write-ColorMessage "Failed to set up Emscripten SDK." $ColorError
    exit 1
}

# Find Emscripten paths
$emscriptenPaths = Find-EmscriptenPaths
if (-not $emscriptenPaths.EmscriptenRoot) {
    Write-ColorMessage "Failed to find necessary Emscripten components." $ColorError
    exit 1
}

# Create Emscripten configuration
$configPath = Create-EmscriptenConfig -Paths $emscriptenPaths -NodePath $nodePath -PythonPath $pythonPath -JavaPath $javaPath

# Test the configuration
$configTestSuccess = Test-EmscriptenConfig -ConfigPath $configPath -Paths $emscriptenPaths
if (-not $configTestSuccess) {
    Write-ColorMessage "Emscripten configuration test failed." $ColorError
    exit 1
}

Write-ColorMessage "Emscripten configuration completed successfully!" $ColorSuccess
Write-ColorMessage "You can now build Red X with 'make web' command" $ColorInfo
exit 0

