#!/usr/bin/env pwsh
# fix-binaryen.ps1
# Script to fix Binaryen installation for Emscripten WebAssembly compilation
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
$ProjectDir = $ScriptDir
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

function Fix-BinaryenPath {
    # Check the .emscripten config file
    $configPath = "$env:USERPROFILE\.emscripten"

    if (Test-Path $configPath) {
        Write-ColorMessage "Found Emscripten config at: $configPath" $ColorSuccess

        # Read the config file
        $configContent = Get-Content $configPath -Raw

        # Check for BINARYEN_ROOT value
        if ($configContent -match "BINARYEN_ROOT\s*=\s*['`"]([^'`"]+)['`"]") {
            $currentBinaryenPath = $Matches[1]
            Write-ColorMessage "Current BINARYEN_ROOT setting: $currentBinaryenPath" $ColorInfo

            # Check if the Binaryen path exists
            if (-not (Test-Path $currentBinaryenPath)) {
                Write-ColorMessage "The configured Binaryen path does not exist: $currentBinaryenPath" $ColorWarning

                # Try to find binaryen in the emsdk directory
                $possiblePaths = @(
                    "$EmsdkDir\upstream\bin",
                    "$EmsdkDir\binaryen",
                    "$EmsdkDir\binaryen\bin"
                )

                $binaryenFound = $false

                foreach ($path in $possiblePaths) {
                    if (Test-Path $path) {
                        if (Test-Path "$path\wasm-opt.exe" -or Test-Path "$path\bin\wasm-opt.exe") {
                            $binaryenFound = $true
                            $newBinaryenPath = $path
                            break
                        }
                    }
                }

                if ($binaryenFound) {
                    Write-ColorMessage "Found Binaryen at: $newBinaryenPath" $ColorSuccess

                    # Update the config file with the correct path
                    $updatedConfig = $configContent -replace "(BINARYEN_ROOT\s*=\s*)['`"]([^'`"]+)['`"]", "`$1'$($newBinaryenPath.Replace('\', '\\'))'"
                    Set-Content -Path $configPath -Value $updatedConfig

                    Write-ColorMessage "Updated BINARYEN_ROOT in Emscripten config." $ColorSuccess
                }
                else {
                    # Try to search for wasm-opt.exe recursively
                    Write-ColorMessage "Searching for wasm-opt.exe in emsdk directory..." $ColorInfo

                    $wasmOptFiles = Get-ChildItem -Path $EmsdkDir -Filter "wasm-opt.exe" -Recurse -ErrorAction SilentlyContinue

                    if ($wasmOptFiles -and $wasmOptFiles.Count -gt 0) {
                        $wasmOptPath = $wasmOptFiles[0].FullName
                        $newBinaryenPath = Split-Path -Parent $wasmOptPath

                        Write-ColorMessage "Found wasm-opt.exe at: $wasmOptPath" $ColorSuccess

                        # Update the config file with the correct path
                        $updatedConfig = $configContent -replace "(BINARYEN_ROOT\s*=\s*)['`"]([^'`"]+)['`"]", "`$1'$($newBinaryenPath.Replace('\', '\\'))'"
                        Set-Content -Path $configPath -Value $updatedConfig

                        Write-ColorMessage "Updated BINARYEN_ROOT in Emscripten config." $ColorSuccess
                    }
                    else {
                        Write-ColorMessage "Could not find wasm-opt.exe in the Emscripten SDK." $ColorError
                        return $false
                    }
                }
            }
            else {
                # The path exists, but check if there's a bin subdirectory with wasm-opt.exe
                if (Test-Path "$currentBinaryenPath\bin\wasm-opt.exe" -and -not (Test-Path "$currentBinaryenPath\wasm-opt.exe")) {
                    Write-ColorMessage "Found wasm-opt.exe in bin subdirectory, updating config..." $ColorInfo

                    # Update the config file with the bin subdirectory
                    $binPath = "$currentBinaryenPath\bin"
                    $updatedConfig = $configContent -replace "(BINARYEN_ROOT\s*=\s*)['`"]([^'`"]+)['`"]", "`$1'$($binPath.Replace('\', '\\'))'"
                    Set-Content -Path $configPath -Value $updatedConfig

                    Write-ColorMessage "Updated BINARYEN_ROOT in Emscripten config to point to bin subdirectory." $ColorSuccess
                }
                else {
                    if (Test-Path "$currentBinaryenPath\wasm-opt.exe") {
                        Write-ColorMessage "Binaryen path is valid and contains wasm-opt.exe" $ColorSuccess
                    }
                    else {
                        Write-ColorMessage "The configured Binaryen path does not contain wasm-opt.exe: $currentBinaryenPath" $ColorError
                        return $false
                    }
                }
            }
        }
        else {
            Write-ColorMessage "Could not find BINARYEN_ROOT in Emscripten config." $ColorError
            return $false
        }

        return $true
    }
    else {
        Write-ColorMessage "Emscripten config file not found at: $configPath" $ColorError
        return $false
    }
}

function Reinstall-Binaryen {
    Write-ColorMessage "Reinstalling Binaryen with emsdk..." $ColorInfo

    # Navigate to emsdk directory
    Set-Location $EmsdkDir

    # Ensure Git is available
    try {
        $gitVersion = git --version
        Write-ColorMessage "Git available: $gitVersion" $ColorSuccess
    }
    catch {
        Write-ColorMessage "Git is required but not found. Please install Git." $ColorError
        return $false
    }

    # Update emsdk
    Write-ColorMessage "Updating emsdk..." $ColorInfo
    & ./emsdk.bat update

    # Install binaryen specifically
    Write-ColorMessage "Installing binaryen via emsdk..." $ColorInfo
    & ./emsdk.bat install binaryen-main-64bit

    if ($LASTEXITCODE -ne 0) {
        Write-ColorMessage "Failed to install binaryen." $ColorError
        return $false
    }

    # Try one more path - upstream/third_party/binaryen
    $thirdPartyBinaryen = "$EmsdkDir\upstream\third_party\binaryen\bin"
    if (Test-Path "$thirdPartyBinaryen\wasm-opt.exe") {
        Write-ColorMessage "Found wasm-opt.exe in third_party/binaryen" $ColorSuccess

        # Update the config file with this path
        $configPath = "$env:USERPROFILE\.emscripten"
        $configContent = Get-Content $configPath -Raw

        $updatedConfig = $configContent -replace "(BINARYEN_ROOT\s*=\s*)['`"]([^'`"]+)['`"]", "`$1'$($thirdPartyBinaryen.Replace('\', '\\'))'"
        Set-Content -Path $configPath -Value $updatedConfig

        Write-ColorMessage "Updated BINARYEN_ROOT in Emscripten config to point to third_party/binaryen/bin." $ColorSuccess
    }

    # Fix the config file path
    return (Fix-BinaryenPath)
}

function Create-SymlinkFix {
    $configPath = "$env:USERPROFILE\.emscripten"

    if (Test-Path $configPath) {
        $configContent = Get-Content $configPath -Raw

        if ($configContent -match "BINARYEN_ROOT\s*=\s*['`"]([^'`"]+)['`"]") {
            $currentBinaryenPath = $Matches[1]

            # Check if the path includes a double 'bin\bin' which is the problem in the error
            if ($currentBinaryenPath -match "bin\\bin$") {
                Write-ColorMessage "Detected 'bin\bin' in Binaryen path, fixing..." $ColorInfo

                $correctedPath = $currentBinaryenPath -replace "bin\\bin$", "bin"

                $updatedConfig = $configContent -replace "(BINARYEN_ROOT\s*=\s*)['`"]([^'`"]+)['`"]", "`$1'$($correctedPath.Replace('\', '\\'))'"
                Set-Content -Path $configPath -Value $updatedConfig

                Write-ColorMessage "Fixed double 'bin\bin' issue in BINARYEN_ROOT path." $ColorSuccess
                return $true
            }
        }
    }

    # Create a fix for the specific path in the error message
    $errorPath = "C:\Users\Sam\Documents\GitHub\gh-pages\emsdk\upstream\bin\bin\wasm-opt.exe"
    $correctPath = "C:\Users\Sam\Documents\GitHub\gh-pages\emsdk\upstream\bin\wasm-opt.exe"

    # Check if the correct path exists
    if (Test-Path $correctPath) {
        Write-ColorMessage "Found wasm-opt.exe at the correct location: $correctPath" $ColorSuccess
        return $true
    }

    # If the parent directory of the error path exists
    $errorParentDir = Split-Path -Parent $errorPath
    $correctParentDir = Split-Path -Parent $correctPath

    if (-not (Test-Path $correctParentDir)) {
        Write-ColorMessage "Parent directory for correct path does not exist: $correctParentDir" $ColorError
        return $false
    }

    # Try to find wasm-opt.exe in any location
    $wasmOptFiles = Get-ChildItem -Path $EmsdkDir -Filter "wasm-opt.exe" -Recurse -ErrorAction SilentlyContinue

    if ($wasmOptFiles -and $wasmOptFiles.Count -gt 0) {
        $sourceWasmOpt = $wasmOptFiles[0].FullName
        Write-ColorMessage "Found wasm-opt.exe at: $sourceWasmOpt" $ColorSuccess

        try {
            # Create the directory if it doesn't exist
            if (-not (Test-Path $correctParentDir)) {
                New-Item -Path $correctParentDir -ItemType Directory -Force | Out-Null
            }

            # Copy the file to the correct location
            Copy-Item -Path $sourceWasmOpt -Destination $correctPath -Force

            Write-ColorMessage "Copied wasm-opt.exe to the correct location: $correctPath" $ColorSuccess
            return $true
        }
        catch {
            Write-ColorMessage "Error copying wasm-opt.exe: $_" $ColorError
            return $false
        }
    }

    Write-ColorMessage "Could not find wasm-opt.exe to copy." $ColorError
    return $false
}

# Main script execution
Write-ColorMessage "Binaryen Fix for Emscripten" $ColorSuccess
Write-ColorMessage "==========================" $ColorSuccess

# Check if emsdk directory exists
if (-not (Test-Path $EmsdkDir)) {
    Write-ColorMessage "Emscripten SDK not found at: $EmsdkDir" $ColorError
    Write-ColorMessage "Please run setup-emsdk.ps1 first to install Emscripten SDK." $ColorInfo
    exit 1
}

# Activate the Emscripten environment
$emsdkEnvScript = Join-Path -Path $EmsdkDir -ChildPath "emsdk_env.ps1"
if (Test-Path $emsdkEnvScript) {
    Write-ColorMessage "Activating Emscripten environment..." $ColorInfo
    & $emsdkEnvScript
}

# Try to fix the Binaryen path in the Emscripten config
if (-not (Fix-BinaryenPath)) {
    Write-ColorMessage "Failed to fix Binaryen path in config. Attempting reinstallation..." $ColorWarning

    if (-not (Reinstall-Binaryen)) {
        Write-ColorMessage "Failed to reinstall Binaryen. Attempting symbolic link fix..." $ColorWarning

        if (-not (Create-SymlinkFix)) {
            Write-ColorMessage "All fixes failed. Manual intervention required." $ColorError
            exit 1
        }
    }
}

# Verify wasm-opt.exe is available and works
$configPath = "$env:USERPROFILE\.emscripten"
if (Test-Path $configPath) {
    $configContent = Get-Content $configPath -Raw
    if ($configContent -match "BINARYEN_ROOT\s*=\s*['`"]([^'`"]+)['`"]") {
        $binaryenPath = $Matches[1]
        $wasmOptPath = "$binaryenPath\wasm-opt.exe"

        if (Test-Path $wasmOptPath) {
            Write-ColorMessage "Testing wasm-opt.exe at: $wasmOptPath" $ColorInfo

            try {
                $output = & $wasmOptPath --version 2>&1
                Write-ColorMessage "wasm-opt.exe works! Version: $output" $ColorSuccess
                Write-ColorMessage "Binaryen has been successfully fixed!" $ColorSuccess

                # Update the EM_CONFIG environment variable
                $env:EM_CONFIG = $configPath
                Write-ColorMessage "Set EM_CONFIG to: $configPath" $ColorInfo

                exit 0
            }
            catch {
                Write-ColorMessage "wasm-opt.exe found but failed to execute: $_" $ColorError
            }
        }
        else {
            Write-ColorMessage "wasm-opt.exe not found at expected path: $wasmOptPath" $ColorError
        }
    }
}

Write-ColorMessage "Unable to verify wasm-opt.exe. Try running 'make web' again." $ColorWarning
exit 1

