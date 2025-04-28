#!/usr/bin/env pwsh
# run-emcc.ps1
# Script to properly activate Emscripten environment and run emcc commands

# Add -s WASM=0 to the arguments to compile to JavaScript instead of WebAssembly
# This bypasses the need for the Binaryen optimizer

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
        [hashtable]$Color = $ColorInfo
    )

    Write-Host $Message @Color
}

# Check if emsdk directory exists
if (-not (Test-Path $EmsdkDir)) {
    Write-ColorMessage "Emscripten SDK not found at: $EmsdkDir" $ColorError
    Write-ColorMessage "Please run fix-clang-manually.ps1 first to set up Emscripten" $ColorInfo
    exit 1
}

# Activate Emscripten environment
Write-ColorMessage "Activating Emscripten environment..." $ColorInfo
$emsdkEnv = Join-Path -Path $EmsdkDir -ChildPath "emsdk_env.ps1"
if (Test-Path $emsdkEnv) {
    & $emsdkEnv | Out-Null
}
else {
    Write-ColorMessage "Emscripten environment script not found at: $emsdkEnv" $ColorError
    exit 1
}

# Check for Emscripten configs and use the correct one
$configPaths = @(
    "$env:USERPROFILE\.emscripten",
    "$env:USERPROFILE\.emscripten_config"
)

$configFound = $false
foreach ($configPath in $configPaths) {
    if (Test-Path $configPath) {
        Write-ColorMessage "Using Emscripten config: $configPath" $ColorInfo
        $env:EM_CONFIG = $configPath
        $configFound = $true
        break
    }
}

# Add LLVM bin directory to PATH to ensure clang is available
$llvmBinDir = Join-Path -Path $EmsdkDir -ChildPath "upstream\bin"
if (Test-Path $llvmBinDir) {
    Write-ColorMessage "Adding LLVM bin directory to PATH: $llvmBinDir" $ColorInfo
    $env:PATH = "$llvmBinDir;$env:PATH"
}

# Force JS output mode to avoid needing binaryen
$newArgs = @("-s", "WASM=0") + $args

# Try to locate emcc.py directly
$emccFiles = Get-ChildItem -Path $EmsdkDir -Filter "emcc.py" -Recurse -ErrorAction SilentlyContinue
if ($emccFiles -and $emccFiles.Count -gt 0) {
    $emccPyPath = $emccFiles[0].FullName
    Write-ColorMessage "Found emcc.py at: $emccPyPath" $ColorSuccess

    # Find Python executable
    $pythonPath = $null
    $pythonFiles = Get-ChildItem -Path $EmsdkDir -Filter "python.exe" -Recurse -ErrorAction SilentlyContinue
    if ($pythonFiles -and $pythonFiles.Count -gt 0) {
        $pythonPath = $pythonFiles[0].FullName
        Write-ColorMessage "Using Python from emsdk: $pythonPath" $ColorSuccess
    }
    else {
        try {
            $pythonCmd = Get-Command "python" -ErrorAction SilentlyContinue
            if ($pythonCmd) {
                $pythonPath = $pythonCmd.Source
                Write-ColorMessage "Using system Python: $pythonPath" $ColorSuccess
            }
            else {
                Write-ColorMessage "Python not found, using 'python' command" $ColorWarning
                $pythonPath = "python"
            }
        }
        catch {
            Write-ColorMessage "Python not found, using 'python' command" $ColorWarning
            $pythonPath = "python"
        }
    }

    # Show command we're running
    Write-ColorMessage "Running emcc command: $pythonPath $emccPyPath $newArgs" $ColorInfo

    # Run the emcc command via Python
    & $pythonPath $emccPyPath $newArgs
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne 0) {
        Write-ColorMessage "emcc command failed with exit code: $exitCode" $ColorError
        exit $exitCode
    }
    else {
        Write-ColorMessage "emcc command completed successfully!" $ColorSuccess
    }
}
else {
    Write-ColorMessage "Could not find emcc.py in the Emscripten SDK" $ColorError
    exit 1
}
