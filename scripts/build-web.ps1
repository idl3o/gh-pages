# build-web.ps1
# This script properly initializes the Emscripten SDK environment and builds the web version of the project

param$VerboseParam
)

# Define color codes
$ColorInfo = @{ ForegroundColor = 'Cyan' }
$ColorSuccess = @{ ForegroundColor = 'Green' }
$ColorWarning = @{ ForegroundColor = 'Yellow' }
$ColorError = @{ ForegroundColor = 'Red' }

# Get script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir

function Write-StatusMessage {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,

        [Parameter(Mandatory = $false)]
        [hashtable]$Color = $ColorInfo,

        [Parameter(Mandatory = $false)]
        [switch]$NoNewLine
    )

    if ($Verbose -or $Color -eq $ColorError -or $Color -eq $ColorWarning) {
        if ($NoNewLine) {
            Write-Host $Message @Color -NoNewline
        }
        else {
            Write-Host $Message @Color
        }
    }
}

function Test-EmscriptenSetup {
    $emsdkDir = Join-Path -Path $ProjectDir -ChildPath "emsdk"

    if (-not (Test-Path $emsdkDir)) {
        Write-StatusMessage "Emscripten SDK not found. Setting it up now..." $ColorWarning

        $setupScript = Join-Path -Path $ProjectDir -ChildPath "setup-emsdk.ps1"
        if (Test-Path $setupScript) {
            & $setupScript
        }
        else {
            # Fallback to directly installing emsdk
            Set-Location $ProjectDir
            git clone https://github.com/emscripten-core/emsdk.git
            Set-Location emsdk
            ./emsdk install latest
            ./emsdk activate latest
        }

        if ($LASTEXITCODE -ne 0) {
            Write-StatusMessage "Failed to set up Emscripten SDK." $ColorError
            return $false
        }
    }

    return $true
}

function Ensure-NodeJs {
    Write-StatusMessage "Checking for Node.js installation..."

    # Check if we have a .node_path file from fix-node-detection.ps1
    $nodePathFile = Join-Path -Path $ScriptDir -ChildPath ".node_path"
    if (Test-Path $nodePathFile) {
        $nodePath = Get-Content $nodePathFile -Raw
        if (Test-Path $nodePath) {
            Write-StatusMessage "Using Node.js path from .node_path file: $nodePath" $ColorSuccess
            $nodeDir = Split-Path -Parent $nodePath
            $env:PATH = "$nodeDir;$env:PATH"
            $env:NODE_JS = $nodePath

            # Verify node works by checking version
            try {
                $nodeVersion = & $nodePath -v
                Write-StatusMessage "Using Node.js version $nodeVersion" $ColorSuccess
                return
            }
            catch {
                Write-StatusMessage "Node.js found but not working properly. Continuing with standard detection..." $ColorWarning
            }
        }
    }

    # Standard detection if .node_path doesn't exist or doesn't work
    # Check if node is in PATH
    $nodeInPath = $null
    try {
        $nodeInPath = Get-Command "node" -ErrorAction SilentlyContinue
    }
    catch {
        $nodeInPath = $null
    }

    if ($nodeInPath -eq $null) {
        Write-StatusMessage "Node.js not found in PATH. Checking common installation locations..." $ColorWarning

        # Common Node.js installation paths
        $possiblePaths = @(
            "C:\Program Files\nodejs",
            "C:\Program Files (x86)\nodejs",
            "$env:APPDATA\npm",
            "$env:ProgramFiles\nodejs",
            "$env:ProgramFiles(x86)\nodejs",
            "$env:USERPROFILE\AppData\Roaming\nvm\current"
        )

        $nodePath = $null
        foreach ($path in $possiblePaths) {
            if (Test-Path "$path\node.exe") {
                $nodePath = $path
                break
            }
        }

        if ($nodePath -ne $null) {
            Write-StatusMessage "Node.js found at $nodePath, adding to PATH for this session..." $ColorSuccess
            $env:PATH = "$nodePath;$env:PATH"
        }
        else {
            Write-StatusMessage "Node.js not found. Please install Node.js and try again." $ColorError
            Write-StatusMessage "Download from: https://nodejs.org/en/download/" $ColorInfo
            Write-StatusMessage "Or run fix-node-detection.ps1 to configure it manually." $ColorInfo
            exit 1
        }
    }
    else {
        Write-StatusMessage "Node.js found at $($nodeInPath.Source)" $ColorSuccess
    }

    # Verify node works by checking version
    try {
        $nodeVersion = node -v
        Write-StatusMessage "Using Node.js version $nodeVersion" $ColorSuccess

        # Set NODE_JS environment variable for Emscripten
        $env:NODE_JS = $nodeInPath.Source
        Write-StatusMessage "Set NODE_JS environment variable to $($env:NODE_JS)" $ColorInfo
    }
    catch {
        Write-StatusMessage "Node.js found but not working properly. Please check installation." $ColorError
        Write-StatusMessage "Try running fix-node-detection.ps1 to configure it manually." $ColorInfo
        exit 1
    }
}

function Build-WebVersion {
    Write-StatusMessage "Building web version..." $ColorInfo

    # Activate Emscripten environment
    $emsdkDir = Join-Path -Path $ProjectDir -ChildPath "emsdk"
    $emsdkEnv = Join-Path -Path $emsdkDir -ChildPath "emsdk_env.ps1"

    if (Test-Path $emsdkEnv) {
        # Source the Emscripten environment
        Write-StatusMessage "Activating Emscripten environment..." $ColorInfo
        & $emsdkEnv | Out-Null
    }
    else {
        Write-StatusMessage "Emscripten environment script not found at: $emsdkEnv" $ColorError
        return $false
    }

    # Change to red_x directory and run make web
    Set-Location -Path $ScriptDir
    $makeResult = $true

    # Check for Emscripten configs and use the correct one
    $configPaths = @(
        "$env:USERPROFILE\.emscripten",
        "$env:USERPROFILE\.emscripten_config"
    )

    $configFound = $false
    foreach ($configPath in $configPaths) {
        if (Test-Path $configPath) {
            Write-StatusMessage "Using Emscripten config: $configPath" $ColorInfo
            $env:EM_CONFIG = $configPath
            $configFound = $true
            break
        }
    }

    if (-not $configFound) {
        Write-StatusMessage "No Emscripten config found. Try running fix-clang-manually.ps1 first." $ColorWarning
    }

    # Add LLVM bin directory to PATH to ensure clang is available
    $llvmBinDir = Join-Path -Path $emsdkDir -ChildPath "upstream\bin"
    if (Test-Path $llvmBinDir) {
        Write-StatusMessage "Adding LLVM bin directory to PATH: $llvmBinDir" $ColorInfo
        $env:PATH = "$llvmBinDir;$env:PATH"
    }

    # Try using native make command
    Write-StatusMessage "Running make web command..." $ColorInfo
    try {
        $output = & make web 2>&1
        $makeResult = ($LASTEXITCODE -eq 0)

        # If there are any warnings or errors, display them
        if ($output -match "warning:|error:") {
            Write-StatusMessage "Build completed with warnings or errors:" $ColorWarning
            $output | ForEach-Object { Write-StatusMessage $_ $ColorWarning }
        }
    }
    catch {
        $makeResult = $false
        Write-StatusMessage "Exception during make web: $_" $ColorError
    }

    if (-not $makeResult) {
        Write-StatusMessage "Attempting with direct emcc command..." $ColorWarning

        # First ensure we have a template.html
        if (-not (Test-Path "template.html")) {
            if (Test-Path "index.html") {
                Copy-Item "index.html" "template.html"
                # Remove any server-dependent references - PowerShell version of sed
                (Get-Content "template.html") -replace '/api/version', '#' | Set-Content "template.html"
                (Get-Content "template.html") -replace '/socket.io/socket.io.js', 'https://cdn.socket.io/4.5.0/socket.io.min.js' | Set-Content "template.html"
            }
            else {
                Write-StatusMessage "No template.html or index.html found for building." $ColorError
                return $false
            }
        }

        # Try to locate emcc.py directly
        $emccFiles = Get-ChildItem -Path $emsdkDir -Filter "emcc.py" -Recurse -ErrorAction SilentlyContinue
        $emccPyPath = $null
        if ($emccFiles -and $emccFiles.Count -gt 0) {
            $emccPyPath = $emccFiles[0].FullName
            Write-StatusMessage "Found emcc.py at: $emccPyPath" $ColorSuccess

            # Also try to find a Python executable
            $pythonPath = $null
            $pythonFiles = Get-ChildItem -Path $emsdkDir -Filter "python.exe" -Recurse -ErrorAction SilentlyContinue
            if ($pythonFiles -and $pythonFiles.Count -gt 0) {
                $pythonPath = $pythonFiles[0].FullName
                Write-StatusMessage "Using Python from emsdk: $pythonPath" $ColorSuccess
            } else {
                try {
                    $pythonCmd = Get-Command "python" -ErrorAction SilentlyContinue
                    if ($pythonCmd) {
                        $pythonPath = $pythonCmd.Source
                        Write-StatusMessage "Using system Python: $pythonPath" $ColorSuccess
                    } else {
                        Write-StatusMessage "Python not found, using 'python' command" $ColorWarning
                        $pythonPath = "python"
                    }
                } catch {
                    Write-StatusMessage "Python not found, using 'python' command" $ColorWarning
                    $pythonPath = "python"
                }
            }

            # Try building using Python + emcc.py directly
            try {
                Write-StatusMessage "Running emcc.py directly through Python..." $ColorInfo
                & $pythonPath $emccPyPath main.c font_atlas.c -o index.html -s USE_SDL=2 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 `
                  --shell-file template.html -s NO_EXIT_RUNTIME=1 -s "EXPORTED_RUNTIME_METHODS=cwrap" `
                  -s ENVIRONMENT=web -s MODULARIZE=1 -s "EXPORT_NAME=RedXModule" -lm
                $makeResult = ($LASTEXITCODE -eq 0)
            } catch {
                Write-StatusMessage "Failed to run emcc.py directly: $_" $ColorError
                $makeResult = $false
            }
        } else {
            # Use emcc directly for building (standard approach)
            $emccCmd = "emcc main.c font_atlas.c -o index.html -s USE_SDL=2 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 " +
                     "--shell-file template.html -s NO_EXIT_RUNTIME=1 -s EXPORTED_RUNTIME_METHODS=cwrap " +
                     "-s ENVIRONMENT=web -s MODULARIZE=1 -s EXPORT_NAME=RedXModule -lm"

            try {
                Write-StatusMessage "Running direct emcc command: $emccCmd" $ColorInfo
                Invoke-Expression $emccCmd
                $makeResult = ($LASTEXITCODE -eq 0)
            }
            catch {
                Write-StatusMessage "Build failed with emcc: $_" $ColorError
                return $false
            }
        }

        if (-not $makeResult) {
            Write-StatusMessage "Build failed with emcc." $ColorError
            return $false
        }
    }

    # Verify build artifacts exist
    $buildSuccess = $false
    if ((Test-Path "index.html") -and (Test-Path "index.js") -and (Test-Path "index.wasm")) {
        $buildSuccess = $true
    }

    if ($buildSuccess) {
        Write-StatusMessage "Web build completed successfully!" $ColorSuccess
    }
    else {
        Write-StatusMessage "Web build failed - artifacts not found." $ColorError
    }

    return $buildSuccess
}

# Main script execution
Write-StatusMessage "Project RED X Web Build" $ColorInfo
Write-StatusMessage "======================" $ColorInfo

# Ensure Node.js is available and in PATH
Ensure-NodeJs

# Check Emscripten setup
if (-not (Test-EmscriptenSetup)) {
    Write-StatusMessage "Emscripten setup failed." $ColorError
    exit 1
}

# Build web version
if (-not (Build-WebVersion)) {
    Write-StatusMessage "Web build process failed." $ColorError
    exit 1
}

Write-StatusMessage "RED X web build process completed successfully!" $ColorSuccess
exit 0

