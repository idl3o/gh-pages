## Run-RedX.ps1
## PowerShell script to run Project RED X in various modes with complete native functionality
## Created: April 25, 2025

# Error handling
$ErrorActionPreference = "Stop"

# Script parameters
param (
    [Parameter(Mandatory = $false)]
    [ValidateSet("web", "native", "server", "dev", "afk")]
    [string]$Mode = "web",

    [Parameter(Mandatory = $false)]
    [switch]$NoWindow = $false,

    [Parameter(Mandatory = $false)]
    [int]$Port = 8080,

    [Parameter(Mandatory = $false)]
    [switch]$Verbose = $false
)

# Define color codes for console output
$colorInfo = "Cyan"
$colorSuccess = "Green"
$colorWarning = "Yellow"
$colorError = "Red"

# Script directory
$scriptDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$projectDir = Split-Path -Parent -Path $scriptDir

# Functions
function Write-StatusMessage {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Message,

        [Parameter(Mandatory = $false)]
        [string]$Color = "White",

        [Parameter(Mandatory = $false)]
        [switch]$NoNewLine = $false
    )

    if ($Verbose -or $Color -eq $colorError -or $Color -eq $colorWarning) {
        Write-Host $Message -ForegroundColor $Color -NoNewline:$NoNewLine
    }
}

function Test-EmscriptenSetup {
    $emsdkDir = Join-Path -Path $projectDir -ChildPath "emsdk"

    if (-not (Test-Path -Path $emsdkDir)) {
        Write-StatusMessage "Emscripten SDK not found. Setting it up now..." $colorWarning
        & "$projectDir\setup-emsdk.ps1"
        if ($LASTEXITCODE -ne 0) {
            Write-StatusMessage "Failed to set up Emscripten SDK." $colorError
            return $false
        }
    }

    return $true
}

function Build-WebVersion {
    Write-StatusMessage "Building web version..." $colorInfo

    # Activate Emscripten environment
    $emsdkDir = Join-Path -Path $projectDir -ChildPath "emsdk"
    & "$emsdkDir\emsdk_env.bat" | Out-Null

    # Change to red_x directory and run make web
    Push-Location $scriptDir
    $makeResult = $null

    try {
        # Try using native make command first
        $makeResult = & make web 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to build web version using native make"
        }
    }
    catch {
        # Fall back to emcmake if native make fails
        Write-StatusMessage "Attempting with emcmake..." $colorWarning

        # First ensure we have a template.html
        if (-not (Test-Path -Path "template.html")) {
            if (Test-Path -Path "index.html") {
                Copy-Item -Path "index.html" -Destination "template.html"
                # Remove any server-dependent references
                (Get-Content -Path "template.html") -replace '/api/version', '#' | Set-Content -Path "template.html"
                (Get-Content -Path "template.html") -replace '/socket.io/socket.io.js', 'https://cdn.socket.io/4.5.0/socket.io.min.js' | Set-Content -Path "template.html"
            }
            else {
                Write-StatusMessage "No template.html or index.html found for building." $colorError
                return $false
            }
        }

        # Use emcc directly for building
        $emccPath = Join-Path -Path $projectDir -ChildPath "emsdk\upstream\emscripten\emcc.bat"
        & $emccPath main.c -o index.html -s USE_SDL=2 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 `
            --shell-file template.html -s NO_EXIT_RUNTIME=1 -s "EXPORTED_RUNTIME_METHODS=cwrap" `
            -s ENVIRONMENT=web -s MODULARIZE=1 -s "EXPORT_NAME=RedXModule"

        if ($LASTEXITCODE -ne 0) {
            Write-StatusMessage "Build failed with emcc." $colorError
            return $false
        }
    }
    finally {
        Pop-Location
    }

    # Verify build artifacts exist
    $buildSuccess = (Test-Path -Path "$scriptDir\index.html") -and
                   (Test-Path -Path "$scriptDir\index.js") -and
                   (Test-Path -Path "$scriptDir\index.wasm")

    if ($buildSuccess) {
        Write-StatusMessage "Web build completed successfully!" $colorSuccess
    }
    else {
        Write-StatusMessage "Web build failed - artifacts not found." $colorError
    }

    return $buildSuccess
}

function Build-NativeVersion {
    Write-StatusMessage "Building native version..." $colorInfo

    # Check if MSYS2 exists
    $msys2Path = "C:\tools\msys64\msys2_shell.cmd"
    if (-not (Test-Path -Path $msys2Path)) {
        Write-StatusMessage "MSYS2 not found at $msys2Path" $colorError

        # Try native Windows build with MinGW if available
        $mingwPath = "C:\ProgramData\mingw64\mingw64\bin"
        if (Test-Path -Path $mingwPath) {
            Write-StatusMessage "Attempting build with MinGW..." $colorWarning
            $env:Path = "$mingwPath;$env:Path"

            Push-Location $scriptDir
            try {
                & gcc -o red_x.exe main.c -lSDL2 -lm
                if ($LASTEXITCODE -ne 0) {
                    throw "Failed to build native version using MinGW"
                }
            }
            catch {
                Write-StatusMessage "Native build failed. Error: $_" $colorError
                Pop-Location
                return $false
            }
            Pop-Location
        }
        else {
            # Create placeholder native executable
            Write-StatusMessage "MinGW not found. Creating placeholder for native version." $colorWarning
            Set-Content -Path "$scriptDir\red_x.placeholder" -Value "This is a placeholder for the native build."
            return $false
        }
    }
    else {
        # Use MSYS2 to build
        Write-StatusMessage "Building with MSYS2..." $colorInfo
        & $msys2Path -mingw64 -defterm -no-start -here -c "cd '$($scriptDir -replace '\\', '/')' && make"

        if ($LASTEXITCODE -ne 0) {
            Write-StatusMessage "Native build with MSYS2 failed." $colorError
            return $false
        }
    }

    # Check for native executable
    $nativeBuildSuccess = (Test-Path -Path "$scriptDir\red_x.exe") -or (Test-Path -Path "$scriptDir\red_x")

    if ($nativeBuildSuccess) {
        Write-StatusMessage "Native build completed successfully!" $colorSuccess
    }
    else {
        Write-StatusMessage "Native build failed - executable not found." $colorError
    }

    return $nativeBuildSuccess
}

function Start-WebServer {
    param (
        [int]$Port = 8080,
        [string]$Mode = "normal" # 'normal' or 'afk'
    )

    Write-StatusMessage "Starting web server on port $Port..." $colorInfo

    # Check if Node.js is installed
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-StatusMessage "Node.js not found. Please install Node.js to run the web server." $colorError
        return $false
    }

    # Check if server.js exists
    if (-not (Test-Path -Path "$scriptDir\server.js")) {
        Write-StatusMessage "server.js not found." $colorError
        return $false
    }

    # Configure AFK mode if requested
    if ($Mode -eq "afk") {
        $env:RED_X_MODE = "afk"
        $env:RED_X_TITLE = "AFK Downloader Hub"
        $env:RED_X_STARTUP_PAGE = "afk-downloader.html"
    }
    else {
        $env:RED_X_MODE = "normal"
        $env:RED_X_TITLE = "Project RED X"
        $env:RED_X_STARTUP_PAGE = "index.html"
    }

    # Set port environment variable
    $env:PORT = $Port

    # Start web server
    Push-Location $scriptDir

    if ($NoWindow) {
        # Start without opening a new window
        $serverProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -PassThru -WindowStyle Hidden
    }
    else {
        # Start in new window
        Start-Process -FilePath "powershell" -ArgumentList "-Command", "cd '$scriptDir'; `$host.ui.RawUI.WindowTitle = 'RED X Server'; node server.js; Read-Host 'Press Enter to exit'"
    }

    Pop-Location

    # Wait a bit for server to start
    Start-Sleep -Seconds 2

    # Launch browser
    $url = "http://localhost:${Port}/${env:RED_X_STARTUP_PAGE}"
    Write-StatusMessage "Opening browser at $url" $colorSuccess
    Start-Process $url

    if (-not $NoWindow) {
        return $true
    }
    else {
        # Return the process object for later termination
        return $serverProcess
    }
}

function Run-NativeExecutable {
    Write-StatusMessage "Running native executable..." $colorInfo

    # Check if native executable exists
    $nativeExe = $null
    if (Test-Path -Path "$scriptDir\red_x.exe") {
        $nativeExe = "$scriptDir\red_x.exe"
    }
    elseif (Test-Path -Path "$scriptDir\red_x") {
        $nativeExe = "$scriptDir\red_x"
    }
    elseif (Test-Path -Path "$scriptDir\red_x.bat") {
        $nativeExe = "$scriptDir\red_x.bat"
    }
    else {
        Write-StatusMessage "Native executable not found." $colorError
        return $false
    }

    # Execute the native program
    & $nativeExe

    if ($LASTEXITCODE -ne 0) {
        Write-StatusMessage "Native execution failed with exit code $LASTEXITCODE." $colorError
        return $false
    }

    return $true
}

function Start-DevEnvironment {
    Write-StatusMessage "Starting development environment..." $colorInfo

    # Check if nodemon is installed
    if (-not (Get-Command npx -ErrorAction SilentlyContinue)) {
        Write-StatusMessage "NPX not found. Installing nodemon..." $colorWarning
        Push-Location $scriptDir
        npm install --save-dev nodemon
        Pop-Location
    }

    # Create nodemon config if it doesn't exist
    $nodemonConfig = "$scriptDir\nodemon.json"
    if (-not (Test-Path $nodemonConfig)) {
        $config = @{
            "watch" = @("*.js", "*.html", "*.css")
            "ext" = "js,html,css"
            "ignore" = @("*.wasm", "node_modules/*")
            "delay" = "1000"
        } | ConvertTo-Json

        Set-Content -Path $nodemonConfig -Value $config
    }

    # Start nodemon for hot reloading
    Push-Location $scriptDir
    $process = Start-Process -FilePath "npx" -ArgumentList "nodemon server.js" -PassThru
    Pop-Location

    # Return the process object
    return $process
}

function Run-AfkDownloadingHub {
    Write-StatusMessage "Starting AFK Downloading Hub..." $colorInfo

    # Start the server with the AFK mode
    $serverProcess = Start-WebServer -Port $Port -Mode "afk"

    return $serverProcess
}

# Main execution
Write-StatusMessage "Project RED X Runner" $colorInfo
Write-StatusMessage "=====================" $colorInfo
Write-StatusMessage "Mode: $Mode" $colorInfo
Write-StatusMessage "Port: $Port" $colorInfo
Write-StatusMessage "NoWindow: $NoWindow" $colorInfo
Write-StatusMessage "Verbose: $Verbose" $colorInfo
Write-StatusMessage "" $colorInfo

try {
    switch ($Mode) {
        "web" {
            if (-not (Test-Path -Path "$scriptDir\index.html") -or -not (Test-Path -Path "$scriptDir\index.js") -or -not (Test-Path -Path "$scriptDir\index.wasm")) {
                Write-StatusMessage "Web version not found or incomplete. Building..." $colorWarning
                if (Test-EmscriptenSetup) {
                    $buildResult = Build-WebVersion
                    if (-not $buildResult) {
                        throw "Failed to build web version."
                    }
                }
                else {
                    throw "Emscripten setup failed."
                }
            }

            Start-WebServer -Port $Port -Mode "normal"
        }

        "native" {
            if (-not (Test-Path -Path "$scriptDir\red_x.exe") -and -not (Test-Path -Path "$scriptDir\red_x") -and -not (Test-Path -Path "$scriptDir\red_x.bat")) {
                Write-StatusMessage "Native version not found. Building..." $colorWarning
                $buildResult = Build-NativeVersion
                if (-not $buildResult) {
                    Write-StatusMessage "Native build failed. Falling back to web version." $colorWarning
                    $Mode = "web"
                    if (Test-EmscriptenSetup) {
                        Build-WebVersion | Out-Null
                    }
                    Start-WebServer -Port $Port -Mode "normal"
                    break
                }
            }

            Run-NativeExecutable
        }

        "server" {
            Start-WebServer -Port $Port -Mode "normal"
        }

        "dev" {
            Start-DevEnvironment
        }

        "afk" {
            Run-AfkDownloadingHub
        }
    }

    Write-StatusMessage "Project RED X successfully launched in $Mode mode." $colorSuccess
}
catch {
    Write-StatusMessage "Error: $_" $colorError
    exit 1
}
