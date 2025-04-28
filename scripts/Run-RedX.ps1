## Run-RedX.ps1
## PowerShell script to run Project RED X in various modes with complete native functionality
## Created: April 25, 2025

# Error handling
$ErrorActionPreference = "Stop"

# Script parameters in standard format for VSCode compatibility
param(
    [string]
    [ValidateSet("web", "native", "server", "dev", "afk", "build")]
    $Mode = "web",

    [switch]
    $NoWindow,

    [int]
    $Port = 8080,

    [switch]
    $Verbose
)

# Define color codes for console output
$colorInfo = "Cyan"
$colorSuccess = "Green"
$colorWarning = "Yellow"
$colorError = "Red"

# Script directory
$scriptDir = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$projectDir = Split-Path -Parent -Path $scriptDir

# Add a function to navigate to the correct directory
function Set-WorkingDirectory {
    # Current location
    $currentLocation = Get-Location
    $scriptPath = $MyInvocation.MyCommand.Path

    Write-Host "Current location: $currentLocation" -ForegroundColor $colorInfo
    Write-Host "Script path: $scriptPath" -ForegroundColor $colorInfo

    # Check if we're in the gh-pages directory
    if ($currentLocation.Path -eq $projectDir) {
        # We're in the root directory, change to red_x subdirectory
        Write-Host "Changing directory to: $scriptDir" -ForegroundColor $colorWarning
        Set-Location -Path $scriptDir
        return $true
    }
    # Check if the script exists in the current location
    elseif (-not (Test-Path -Path ".\Run-RedX.ps1") -and -not (Test-Path -Path "$currentLocation\red_x\Run-RedX.ps1")) {
        # Try to find the script
        if (Test-Path -Path "$projectDir\red_x\Run-RedX.ps1") {
            # Found in the expected location
            Write-Host "Changing directory to: $scriptDir" -ForegroundColor $colorWarning
            Set-Location -Path $scriptDir
            return $true
        }
        else {
            # Search for the script
            Write-Host "Searching for Run-RedX.ps1..." -ForegroundColor $colorWarning
            $possiblePaths = Get-ChildItem -Path $env:USERPROFILE -Recurse -Filter "Run-RedX.ps1" -ErrorAction SilentlyContinue | Where-Object { $_.FullName -like "*red_x*" }

            if ($possiblePaths.Count -gt 0) {
                $foundPath = $possiblePaths[0].Directory.FullName
                Write-Host "Found script at: $foundPath" -ForegroundColor $colorSuccess
                Set-Location -Path $foundPath
                return $true
            }
            else {
                Write-Host "Could not locate the script. Please run this script from the red_x directory." -ForegroundColor $colorError
                return $false
            }
        }
    }
    # Already in the correct directory
    else {
        Write-Host "Already in the correct directory." -ForegroundColor $colorSuccess
        return $true
    }
}

# Check and set correct working directory before proceeding
if (-not (Set-WorkingDirectory)) {
    Write-Host "Error: Could not set correct working directory. The script should be run from the red_x directory." -ForegroundColor $colorError
    Write-Host "Please use: cd c:\Users\Sam\Documents\GitHub\gh-pages\red_x" -ForegroundColor $colorInfo
    Write-Host "Then run: .\Run-RedX.ps1 -Mode build -Verbose" -ForegroundColor $colorInfo
    exit 1
}

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

function Test-BuildTools {
    Write-StatusMessage "Checking build environment..." $colorInfo

    $buildTools = @{
        "gcc" = $false
        "make" = $false
        "msys2" = $false
        "mingw" = $false
    }

    # Check if gcc exists in path
    if (Get-Command gcc -ErrorAction SilentlyContinue) {
        $gccVersion = & gcc --version | Select-Object -First 1
        $buildTools["gcc"] = $true
        Write-StatusMessage "Found GCC: $gccVersion" $colorInfo
    }

    # Check if make exists in path
    if (Get-Command make -ErrorAction SilentlyContinue) {
        $makeVersion = & make --version | Select-Object -First 1
        $buildTools["make"] = $true
        Write-StatusMessage "Found Make: $makeVersion" $colorInfo
    }

    # Check for MSYS2
    if (Test-Path -Path "C:\tools\msys64\msys2_shell.cmd") {
        $buildTools["msys2"] = $true
        Write-StatusMessage "Found MSYS2 environment" $colorInfo
    }

    # Check for MinGW
    $mingwPaths = @(
        "C:\ProgramData\mingw64\mingw64\bin",
        "C:\mingw64\bin",
        "C:\mingw\bin",
        "${env:ProgramFiles}\mingw-w64\x86_64-8.1.0-posix-seh-rt_v6-rev0\mingw64\bin"
    )

    foreach ($path in $mingwPaths) {
        if (Test-Path -Path "$path\gcc.exe") {
            $buildTools["mingw"] = $true
            Write-StatusMessage "Found MinGW at: $path" $colorInfo

            # Add to path if not already in path
            if ($env:Path -notlike "*$path*") {
                $env:Path = "$path;$env:Path"
                Write-StatusMessage "Added MinGW to PATH" $colorInfo
            }
            break
        }
    }

    # Summary of build environment
    $availableTools = $buildTools.Keys | Where-Object { $buildTools[$_] -eq $true }
    if ($availableTools.Count -gt 0) {
        Write-StatusMessage "Available build tools: $($availableTools -join ', ')" $colorSuccess
        return $true
    }
    else {
        Write-StatusMessage "No build tools found in PATH" $colorWarning
        return $false
    }
}

# Add a comprehensive pre-build check function
function Test-BuildEnvironment {
    [CmdletBinding()]
    param()

    $checksOk = $true
    $issues = @()

    Write-StatusMessage "Performing pre-build environment checks..." $colorInfo
    Write-StatusMessage "========================================" $colorInfo

    # Check 1: Verify admin rights
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        $issues += "Admin Rights: Script is not running with administrator privileges"
        $checksOk = $false
        Write-StatusMessage "❌ Script is not running with administrator privileges" $colorError
    } else {
        Write-StatusMessage "✅ Script is running with administrator privileges" $colorSuccess
    }

    # Check 2: Verify existence of main.c in current directory
    if (-not (Test-Path -Path "$scriptDir\main.c")) {
        $issues += "Source Code: main.c not found in the current directory"
        $checksOk = $false
        Write-StatusMessage "❌ main.c not found in $scriptDir" $colorError
    } else {
        Write-StatusMessage "✅ main.c found" $colorSuccess
    }

    # Check 3: Verify PATH is not too long (Windows limit is ~8192 chars)
    if ($env:Path.Length -gt 7000) {
        $issues += "PATH Variable: System PATH variable is excessively long (${$env:Path.Length} characters)"
        $checksOk = $false
        Write-StatusMessage "⚠️ System PATH variable is excessively long (${$env:Path.Length} characters)" $colorWarning
    } else {
        Write-StatusMessage "✅ PATH variable length is acceptable" $colorSuccess
    }

    # Check 4: Check for build tools directly
    $tools = @{
        "gcc" = (Get-Command gcc -ErrorAction SilentlyContinue) -ne $null
        "make" = (Get-Command make -ErrorAction SilentlyContinue) -ne $null
        "cl" = (Get-Command cl -ErrorAction SilentlyContinue) -ne $null  # Microsoft C/C++ compiler
        "7z" = (Get-Command 7z -ErrorAction SilentlyContinue) -ne $null
    }

    $toolsFound = $tools.GetEnumerator() | Where-Object { $_.Value -eq $true } | ForEach-Object { $_.Key }
    if ($toolsFound.Count -eq 0) {
        $issues += "Build Tools: No suitable compilers found (gcc, make, or cl)"
        $checksOk = $false
        Write-StatusMessage "❌ No suitable compilers found in PATH" $colorError
    } else {
        Write-StatusMessage "✅ Found tools: $($toolsFound -join ', ')" $colorSuccess
    }

    # Check 5: Check disk space
    $drive = (Get-Item $scriptDir).PSDrive.Name
    $freeSpace = (Get-PSDrive $drive).Free / 1GB  # Free space in GB
    if ($freeSpace -lt 1) {
        $issues += "Disk Space: Less than 1 GB free on drive $drive"
        $checksOk = $false
        Write-StatusMessage "❌ Low disk space on drive $drive. Only $([math]::Round($freeSpace, 2)) GB available" $colorError
    } else {
        Write-StatusMessage "✅ Sufficient disk space ($([math]::Round($freeSpace, 2)) GB available)" $colorSuccess
    }

    # Check 6: Check for SDL2 if main.c references it
    if (Test-Path -Path "$scriptDir\main.c") {
        $mainContent = Get-Content -Path "$scriptDir\main.c" -Raw
        if ($mainContent -match "SDL") {
            $sdlFound = $false

            # Check for SDL2 in common locations
            $sdlPaths = @(
                "C:\SDL2\lib",
                "C:\Program Files\SDL2\lib",
                "C:\Program Files (x86)\SDL2\lib",
                "$env:USERPROFILE\SDL2\lib"
            )

            foreach ($path in $sdlPaths) {
                if (Test-Path -Path $path) {
                    $sdlFound = $true
                    break
                }
            }

            # Also check if SDL2 is in PATH
            if ((Test-Path -Path "C:\Program Files\mingw64\bin\SDL2.dll") -or
                (Get-Command sdl2-config -ErrorAction SilentlyContinue)) {
                $sdlFound = $true
            }

            if (-not $sdlFound) {
                $issues += "Dependencies: SDL2 appears to be used but not found"
                Write-StatusMessage "⚠️ SDL2 appears to be required but not found in standard locations" $colorWarning
            } else {
                Write-StatusMessage "✅ SDL2 dependency appears to be available" $colorSuccess
            }
        }
    }

    # Check 7: Check for write permissions in output directory
    try {
        $testFile = "$scriptDir\write_test.tmp"
        Set-Content -Path $testFile -Value "Write test" -ErrorAction Stop
        Remove-Item -Path $testFile -Force -ErrorAction Stop
        Write-StatusMessage "✅ Write permissions verified in $scriptDir" $colorSuccess
    } catch {
        $issues += "Permissions: Cannot write to output directory"
        $checksOk = $false
        Write-StatusMessage "❌ Cannot write to output directory: $_" $colorError
    }

    # Check 8: Check for excessively long path names
    if ($scriptDir.Length -gt 200) {
        $issues += "Path Length: Script path is excessively long"
        Write-StatusMessage "⚠️ Script path is very long ($($scriptDir.Length) characters), which might cause issues" $colorWarning
    } else {
        Write-StatusMessage "✅ Script path length is acceptable" $colorSuccess
    }

    # Check 9: Check for pending Windows updates that might interfere
    try {
        $updateSession = New-Object -ComObject Microsoft.Update.Session
        $updateSearcher = $updateSession.CreateUpdateSearcher()
        $pendingUpdates = $updateSearcher.Search("IsInstalled=0").Updates.Count

        if ($pendingUpdates -gt 10) {
            Write-StatusMessage "⚠️ $pendingUpdates pending Windows updates detected - may affect system stability" $colorWarning
        } else {
            Write-StatusMessage "✅ Windows Update status looks good" $colorSuccess
        }
    } catch {
        Write-StatusMessage "⚠️ Could not check Windows Update status" $colorWarning
    }

    # Summary
    Write-StatusMessage "========================================" $colorInfo
    if ($checksOk) {
        Write-StatusMessage "✅ Pre-build checks passed. Environment appears ready for building." $colorSuccess
        return $true
    } else {
        Write-StatusMessage "❌ Issues detected that may cause build failure:" $colorError
        foreach ($issue in $issues) {
            Write-StatusMessage "   - $issue" $colorError
        }

        $confirmation = Read-Host "Issues were found that might cause the build to fail. Continue anyway? (Y/N)"
        return ($confirmation.ToUpper() -eq 'Y')
    }
}

function Build-Executable {
    Write-StatusMessage "Building RED X executable..." $colorInfo

    # Run comprehensive environment checks
    $checksPassed = Test-BuildEnvironment
    if (-not $checksPassed) {
        Write-StatusMessage "Build aborted due to pre-build check failures." $colorError
        return $false
    }

    # First check for build tools
    $buildToolsAvailable = Test-BuildTools

    if (-not $buildToolsAvailable) {
        Write-StatusMessage "No C compiler found. Installing MinGW toolchain..." $colorWarning

        # Create temporary directory for downloading
        $tempDir = Join-Path -Path $env:TEMP -ChildPath "mingw-install"
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

        # Download MinGW installer
        $installerPath = Join-Path -Path $tempDir -ChildPath "mingw-setup.exe"
        Write-StatusMessage "Downloading MinGW installer..." $colorInfo
        Invoke-WebRequest -Uri "https://sourceforge.net/projects/mingw-w64/files/Toolchains%20targetting%20Win64/Personal%20Builds/mingw-builds/8.1.0/threads-posix/seh/x86_64-8.1.0-release-posix-seh-rt_v6-rev0.7z/download" -OutFile "$tempDir\mingw.7z" -UseBasicParsing

        # Check if 7zip is available
        if (-not (Get-Command 7z -ErrorAction SilentlyContinue)) {
            Write-StatusMessage "7zip not found. Installing..." $colorWarning
            # Use PowerShell's Expand-Archive as a fallback
            $mingwPath = "C:\mingw64"

            # Create directory if it doesn't exist
            if (-not (Test-Path -Path $mingwPath)) {
                New-Item -ItemType Directory -Path $mingwPath -Force | Out-Null
            }

            # Extract using .NET
            Add-Type -AssemblyName System.IO.Compression.FileSystem
            Write-StatusMessage "Extracting MinGW to $mingwPath..." $colorInfo
            [System.IO.Compression.ZipFile]::ExtractToDirectory("$tempDir\mingw.7z", $mingwPath)
        }
        else {
            # Use 7zip to extract
            Write-StatusMessage "Extracting MinGW..." $colorInfo
            & 7z x "$tempDir\mingw.7z" -o"C:\" -y
        }

        # Add to PATH
        $mingwBinPath = "C:\mingw64\bin"
        if (Test-Path -Path $mingwBinPath) {
            $env:Path = "$mingwBinPath;$env:Path"
            Write-StatusMessage "Added MinGW to PATH: $mingwBinPath" $colorSuccess

            # Persist PATH for this session
            [Environment]::SetEnvironmentVariable("Path", $env:Path, [EnvironmentVariableTarget]::Process)

            # Check if install was successful
            if (Get-Command gcc -ErrorAction SilentlyContinue) {
                $gccVersion = & gcc --version | Select-Object -First 1
                Write-StatusMessage "MinGW installation successful: $gccVersion" $colorSuccess
                $buildToolsAvailable = $true
            }
            else {
                Write-StatusMessage "MinGW installation failed - gcc not found in PATH." $colorError
            }
        }
        else {
            Write-StatusMessage "MinGW installation failed - directory not found." $colorError
        }
    }

    # Now build the executable
    if ($buildToolsAvailable) {
        Write-StatusMessage "Building executable using available tools..." $colorInfo

        # Determine source files
        $sourceFiles = Get-ChildItem -Path $scriptDir -Filter "*.c" | ForEach-Object { $_.FullName }
        if ($sourceFiles.Count -eq 0) {
            Write-StatusMessage "No source files (*.c) found in $scriptDir" $colorError
            return $false
        }

        Write-StatusMessage "Found source files: $($sourceFiles.Count) .c files" $colorInfo

        # Build with whatever tools we have
        Push-Location $scriptDir
        try {
            # First try make if available
            if (Get-Command make -ErrorAction SilentlyContinue) {
                Write-StatusMessage "Building with make..." $colorInfo
                & make
                if ($LASTEXITCODE -eq 0) {
                    Write-StatusMessage "Build with make successful!" $colorSuccess
                    $buildSuccess = $true
                }
                else {
                    Write-StatusMessage "Build with make failed. Trying direct gcc compilation..." $colorWarning
                }
            }

            # If make failed or not available, try direct gcc
            if ((-not (Get-Command make -ErrorAction SilentlyContinue)) -or $LASTEXITCODE -ne 0) {
                Write-StatusMessage "Building with gcc directly..." $colorInfo

                # Look for SDL2 if needed
                $sdlFlags = ""
                if ((Get-Content -Path $sourceFiles) -match "SDL") {
                    Write-StatusMessage "SDL usage detected, adding SDL flags" $colorInfo
                    $sdlFlags = "-lSDL2 -lSDL2main"
                }

                # Compile all source files
                $outputExe = Join-Path -Path $scriptDir -ChildPath "red_x.exe"
                & gcc -o $outputExe $sourceFiles -lm $sdlFlags

                if ($LASTEXITCODE -eq 0) {
                    Write-StatusMessage "Build with gcc successful!" $colorSuccess
                    $buildSuccess = $true
                }
                else {
                    Write-StatusMessage "Build with gcc failed." $colorError
                    $buildSuccess = $false
                }
            }
        }
        finally {
            Pop-Location
        }

        # Check for native executable
        $nativeBuildSuccess = (Test-Path -Path "$scriptDir\red_x.exe") -or (Test-Path -Path "$scriptDir\red_x")

        if ($nativeBuildSuccess) {
            Write-StatusMessage "RED X executable build completed!" $colorSuccess
            Write-StatusMessage "Executable location: $scriptDir\red_x.exe" $colorSuccess
            return $true
        }
        else {
            Write-StatusMessage "RED X executable build failed. No executable found." $colorError
            return $false
        }
    }
    else {
        Write-StatusMessage "Failed to set up build environment." $colorError
        return $false
    }
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
    Write-StatusMessage "Launching $nativeExe..." $colorInfo

    if ($NoWindow) {
        # Run in current PowerShell window
        & $nativeExe
    }
    else {
        # Open in a new PowerShell window with custom title
        $scriptBlock = {
            param($exePath, $currentDir)
            Set-Location $currentDir
            $host.ui.RawUI.WindowTitle = "RED X Native Application"
            & $exePath
            Write-Host "`nPress Enter to exit..." -ForegroundColor Cyan
            Read-Host | Out-Null
        }

        Start-Process powershell -ArgumentList "-NoProfile", "-ExecutionPolicy", "Bypass",
            "-Command", "& {$scriptBlock} '$nativeExe' '$scriptDir'"
    }

    if ($NoWindow -and $LASTEXITCODE -ne 0) {
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

        "build" {
            Build-Executable
        }
    }

    Write-StatusMessage "Project RED X successfully launched in $Mode mode." $colorSuccess
}
catch {
    Write-StatusMessage "Error: $_" $colorError
    exit 1
}






