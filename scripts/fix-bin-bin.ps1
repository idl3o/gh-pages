#!/usr/bin/env pwsh
# fix-bin-bin.ps1
# Script to fix the bin\bin path issue in Emscripten Binaryen config
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

Write-ColorMessage "Fixing Binaryen tools path issues in Emscripten..." $ColorInfo

# Locate the .emscripten config file
$configPath = "$env:USERPROFILE\.emscripten"

if (-not (Test-Path $configPath)) {
    Write-ColorMessage "Error: Emscripten config file not found at: $configPath" $ColorError
    exit 1
}

# Read the config file content
$configContent = Get-Content $configPath -Raw

# Check if it includes a bin\bin path and fix it
$updatedContent = $configContent -replace '\\bin\\bin', '\bin'

# Write the updated content back to the file
Set-Content -Path $configPath -Value $updatedContent

Write-ColorMessage "Fixed bin\bin path issue in Emscripten config." $ColorSuccess

# Create needed directory structure if it doesn't exist
$emsdkDir = "C:\Users\Sam\Documents\GitHub\gh-pages\emsdk"
$errorPath = "$emsdkDir\upstream\bin\bin"
$correctPath = "$emsdkDir\upstream\bin"

# Check if the correct path exists
if (-not (Test-Path $correctPath)) {
    Write-ColorMessage "Error: Expected bin directory not found at: $correctPath" $ColorError
    exit 1
}

# List of required Binaryen tools
$requiredTools = @(
    "wasm-opt.exe",
    "wasm-emscripten-finalize.exe",
    "wasm-as.exe",
    "wasm-dis.exe",
    "wasm-ld.exe"
)

# Create the bin\bin directory if it doesn't exist
if (-not (Test-Path $errorPath)) {
    Write-ColorMessage "Creating $errorPath directory..." $ColorInfo
    New-Item -Path $errorPath -ItemType Directory -Force | Out-Null
}

# Search for Binaryen tools recursively in the emsdk directory
foreach ($tool in $requiredTools) {
    $toolFiles = Get-ChildItem -Path $emsdkDir -Filter $tool -Recurse -ErrorAction SilentlyContinue

    if ($toolFiles -and $toolFiles.Count -gt 0) {
        $sourceTool = $toolFiles[0].FullName
        Write-ColorMessage "Found $tool at: $sourceTool" $ColorSuccess

        # Copy to \bin directory if needed
        if (-not (Test-Path "$correctPath\$tool")) {
            Write-ColorMessage "Copying $tool to bin directory..." $ColorInfo
            Copy-Item -Path $sourceTool -Destination "$correctPath\$tool" -Force
        }

        # Also copy to \bin\bin directory
        Write-ColorMessage "Copying $tool to bin\bin directory..." $ColorInfo
        Copy-Item -Path $sourceTool -Destination "$errorPath\$tool" -Force
    }
    else {
        Write-ColorMessage "Warning: Could not find $tool in the emsdk directory" $ColorWarning
    }
}

# Check for missing tools in the binaryen repository
$binaryenSrc = "$emsdkDir\upstream\emscripten\third_party\binaryen\src"
if (Test-Path $binaryenSrc) {
    Write-ColorMessage "Checking Binaryen source directory for tools..." $ColorInfo

    # Find all .exe files in the binaryen source directory
    $binaryenToolFiles = Get-ChildItem -Path $binaryenSrc -Filter "*.exe" -Recurse -ErrorAction SilentlyContinue

    if ($binaryenToolFiles -and $binaryenToolFiles.Count -gt 0) {
        foreach ($toolFile in $binaryenToolFiles) {
            $toolName = $toolFile.Name
            Write-ColorMessage "Found tool in Binaryen source: $toolName" $ColorInfo

            # Copy to both bin and bin\bin directories
            Write-ColorMessage "Copying $toolName to bin directory..." $ColorInfo
            Copy-Item -Path $toolFile.FullName -Destination "$correctPath\$toolName" -Force

            Write-ColorMessage "Copying $toolName to bin\bin directory..." $ColorInfo
            Copy-Item -Path $toolFile.FullName -Destination "$errorPath\$toolName" -Force
        }
    }
}

# Define a function to check if all binaries exist in a directory
function Test-AllBinaries {
    param(
        [string]$Directory,
        [string[]]$Tools
    )

    foreach ($tool in $Tools) {
        if (-not (Test-Path "$Directory\$tool")) {
            return $false
        }
    }

    return $true
}

# Final check for required tools in both directories
$allCorrectPathToolsExist = Test-AllBinaries -Directory $correctPath -Tools $requiredTools
$allErrorPathToolsExist = Test-AllBinaries -Directory $errorPath -Tools $requiredTools

# If we're still missing some tools, use a simple approach of copying all .exe files
if (-not $allCorrectPathToolsExist -or -not $allErrorPathToolsExist) {
    Write-ColorMessage "Some tools are still missing. Attempting complete tools copy..." $ColorWarning

    # Find all tool directories
    $possibleToolDirs = @(
        "$emsdkDir\upstream\bin",
        "$emsdkDir\upstream\emscripten\third_party\binaryen\bin",
        "$emsdkDir\binaryen\bin",
        "$emsdkDir\upstream\third_party\binaryen\bin"
    )

    foreach ($dir in $possibleToolDirs) {
        if (Test-Path $dir) {
            $exeFiles = Get-ChildItem -Path $dir -Filter "*.exe" -ErrorAction SilentlyContinue

            if ($exeFiles -and $exeFiles.Count -gt 0) {
                Write-ColorMessage "Found executables in: $dir" $ColorInfo

                foreach ($file in $exeFiles) {
                    $fileName = $file.Name

                    # Copy to both directories
                    Write-ColorMessage "Copying $fileName to both bin and bin\bin directories..." $ColorInfo
                    Copy-Item -Path $file.FullName -Destination "$correctPath\$fileName" -Force
                    Copy-Item -Path $file.FullName -Destination "$errorPath\$fileName" -Force
                }
            }
        }
    }
}

# Verify our tools exist now
$missingTools = @()
foreach ($tool in $requiredTools) {
    $binPath = "$correctPath\$tool"
    $binBinPath = "$errorPath\$tool"

    if (-not (Test-Path $binPath)) {
        $missingTools += "bin: $tool"
    }

    if (-not (Test-Path $binBinPath)) {
        $missingTools += "bin\bin: $tool"
    }
}

if ($missingTools.Count -eq 0) {
    Write-ColorMessage "All required Binaryen tools have been successfully installed!" $ColorSuccess
    exit 0
}
else {
    Write-ColorMessage "Warning: Some tools are still missing:" $ColorWarning
    foreach ($missing in $missingTools) {
        Write-ColorMessage " - $missing" $ColorWarning
    }

    # Create a dummy file for the missing wasm-emscripten-finalize
    if (-not (Test-Path "$errorPath\wasm-emscripten-finalize.exe")) {
        Write-ColorMessage "Creating dummy wasm-emscripten-finalize.exe as last resort..." $ColorWarning

        # Look for any Binaryen tool we can copy as a placeholder
        $anyBinaryenTool = Get-ChildItem -Path $emsdkDir -Filter "wasm-*.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1

        if ($anyBinaryenTool) {
            Write-ColorMessage "Using $($anyBinaryenTool.Name) as placeholder for wasm-emscripten-finalize.exe" $ColorWarning
            Copy-Item -Path $anyBinaryenTool.FullName -Destination "$errorPath\wasm-emscripten-finalize.exe" -Force
        }
    }

    exit 1
}
