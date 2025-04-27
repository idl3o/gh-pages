# build-web.ps1
# This script properly initializes the Emscripten SDK environment and builds the web version of the project

$ErrorActionPreference = "Stop"
$rootDir = Split-Path -Parent $PSScriptRoot
$emsdkDir = Join-Path -Path $rootDir -ChildPath "emsdk"

# Function to display status messages
function Write-Status {
    param (
        [string]$Message,
        [string]$Color = "Cyan"
    )
    Write-Host "🚀 $Message" -ForegroundColor $Color
}

# Check if emsdk exists
if (-not (Test-Path -Path $emsdkDir)) {
    Write-Status "Emscripten SDK not found. Setting it up first..." "Yellow"
    $setupScript = Join-Path -Path $rootDir -ChildPath "setup-emsdk.ps1"

    if (Test-Path -Path $setupScript) {
        & $setupScript

        if ($LASTEXITCODE -ne 0) {
            Write-Status "Failed to set up Emscripten SDK. Please check the error messages above." "Red"
            exit 1
        }
    }
    else {
        Write-Status "setup-emsdk.ps1 not found. Cannot set up Emscripten SDK." "Red"
        exit 1
    }
}

# Initialize Emscripten environment
Write-Status "Initializing Emscripten environment..."
$emsdkEnvScript = Join-Path -Path $emsdkDir -ChildPath "emsdk_env.bat"

if (-not (Test-Path -Path $emsdkEnvScript)) {
    Write-Status "Emscripten environment script not found at: $emsdkEnvScript" "Red"
    exit 1
}

# Execute the emsdk_env.bat script and capture its environment changes
Write-Status "Sourcing Emscripten environment from: $emsdkEnvScript"
$envSetup = cmd.exe /c "`"$emsdkEnvScript`" && set"

# Apply the environment changes to this PowerShell session
foreach ($line in $envSetup) {
    if ($line -match '(.+?)=(.*)') {
        $name = $matches[1]
        $value = $matches[2]
        # Skip some environment variables that don't need to be changed
        if ($name -notmatch '^(PROMPT|CMDEXTVERSION|CMDCMDLINE)$') {
            [System.Environment]::SetEnvironmentVariable($name, $value)
        }
    }
}

# Verify emcc is available now
$emcc = Get-Command emcc -ErrorAction SilentlyContinue
if (-not $emcc) {
    Write-Status "Failed to initialize Emscripten environment. 'emcc' command not found." "Red"
    Write-Status "Try running the following command manually and then retry:" "Yellow"
    Write-Status "$emsdkEnvScript" "Yellow"
    exit 1
}

# Build the web version
Write-Status "Building web version with Emscripten..." "Green"
Push-Location $PSScriptRoot
try {
    # Use make for the actual build
    $output = & make web 2>&1

    if ($LASTEXITCODE -ne 0) {
        Write-Status "Build failed with exit code: $LASTEXITCODE" "Red"
        Write-Status "$output" "Red"
        exit $LASTEXITCODE
    }

    # Verify build artifacts
    if (Test-Path -Path "index.html" -and Test-Path -Path "index.js" -and Test-Path -Path "index.wasm") {
        Write-Status "Build completed successfully! Web artifacts created:" "Green"
        Write-Status "- index.html" "Green"
        Write-Status "- index.js" "Green"
        Write-Status "- index.wasm" "Green"
    }
    else {
        Write-Status "Build completed but some expected files are missing." "Yellow"
    }
}
finally {
    Pop-Location
}
