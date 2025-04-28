#requires -Version 5.0
<#
.SYNOPSIS
    Native development script for the RED X blockchain visualization tool.
.DESCRIPTION
    This script facilitates native development of the RED X component directly within VS Code.
    It handles building, running, and debugging the native RED X application.
.PARAMETER Build
    Builds the RED X application natively.
.PARAMETER Run
    Runs the RED X application natively after building.
.PARAMETER Clean
    Cleans the build artifacts.
.PARAMETER DebugMode
    Runs the RED X application with debugging enabled.
.PARAMETER BuildAndRun
    Builds and then runs the RED X application natively.
.EXAMPLE
    .\Develop-Native.ps1 -BuildAndRun
#>

[CmdletBinding(DefaultParameterSetName = "BuildAndRun")]
param(
    [Parameter(ParameterSetName = "Build")]
    [switch]$Build,

    [Parameter(ParameterSetName = "Run")]
    [switch]$Run,

    [Parameter(ParameterSetName = "Clean")]
    [switch]$Clean,

    [Parameter(ParameterSetName = "Debug")]
    [switch]$DebugMode,

    [Parameter(ParameterSetName = "BuildAndRun")]
    [switch]$BuildAndRun
)

# Configuration
$scriptPath = $PSScriptRoot
$redXPath = $scriptPath
$redXExe = Join-Path -Path $redXPath -ChildPath "red_x.exe"
$redXUnix = Join-Path -Path $redXPath -ChildPath "red_x"
$makefilePath = Join-Path -Path $redXPath -ChildPath "Makefile"

# Check if MSYS2 is available
function Test-MSYS2 {
    try {
        $msys2Path = "C:\tools\msys64\msys2_shell.cmd"
        if (Test-Path $msys2Path) {
            return $true
        }
        return $false
    }
    catch {
        return $false
    }
}

# Check if WSL is available
function Test-WSL {
    try {
        $wsltestResult = wsl --list --quiet
        return ($LASTEXITCODE -eq 0)
    }
    catch {
        return $false
    }
}

# Build function
function Invoke-Build {
    Write-Host "Building RED X natively..." -ForegroundColor Cyan

    # Check if we have the Makefile
    if (-not (Test-Path $makefilePath)) {
        Write-Error "Makefile not found at $makefilePath"
        return $false
    }

    # Try building with MSYS2 first
    if (Test-MSYS2) {
        Write-Host "Building with MSYS2..." -ForegroundColor Green
        & C:\tools\msys64\msys2_shell.cmd -mingw64 -defterm -no-start -here -c "cd '$redXPath' && make"
    }
    # If MSYS2 is not available, try WSL
    elseif (Test-WSL) {
        Write-Host "Building with WSL..." -ForegroundColor Green
        $wslPath = wsl wslpath "'$redXPath'"
        wsl --distribution Ubuntu bash -c "cd $wslPath && make"
    }
    # Fall back to native PowerShell Make if available
    else {
        Write-Host "Building with native tools..." -ForegroundColor Yellow
        try {
            Push-Location $redXPath
            & make
        }
        catch {
            Write-Error "Failed to build RED X: $_"
            return $false
        }
        finally {
            Pop-Location
        }
    }

    # Check if build was successful
    if ((Test-Path $redXExe) -or (Test-Path $redXUnix)) {
        Write-Host "Build completed successfully!" -ForegroundColor Green
        return $true
    }
    else {
        Write-Error "Build failed - executable not found"
        return $false
    }
}

# Clean function
function Invoke-Clean {
    Write-Host "Cleaning RED X build artifacts..." -ForegroundColor Cyan

    if (Test-MSYS2) {
        & C:\tools\msys64\msys2_shell.cmd -mingw64 -defterm -no-start -here -c "cd '$redXPath' && make clean"
    }
    elseif (Test-WSL) {
        $wslPath = wsl wslpath "'$redXPath'"
        wsl --distribution Ubuntu bash -c "cd $wslPath && make clean"
    }
    else {
        try {
            Push-Location $redXPath
            & make clean
        }
        catch {
            Write-Error "Failed to clean: $_"
            return $false
        }
        finally {
            Pop-Location
        }
    }

    # Remove executables if they exist
    if (Test-Path $redXExe) {
        Remove-Item $redXExe -Force
    }

    if (Test-Path $redXUnix) {
        Remove-Item $redXUnix -Force
    }

    Write-Host "Clean completed!" -ForegroundColor Green
    return $true
}

# Run function
function Invoke-Run {
    Write-Host "Running RED X natively..." -ForegroundColor Cyan

    if (Test-Path $redXExe) {
        Start-Process -FilePath $redXExe -NoNewWindow -Wait
        return $true
    }
    elseif (Test-Path $redXUnix) {
        if (Test-WSL) {
            $wslPath = wsl wslpath "'$redXUnix'"
            wsl --distribution Ubuntu bash -c "cd $(Split-Path $wslPath) && chmod +x $(Split-Path -Leaf $wslPath) && ./$(Split-Path -Leaf $wslPath)"
            return $true
        }
        else {
            Write-Error "Cannot run Unix executable on this system without WSL"
            return $false
        }
    }
    else {
        Write-Error "RED X executable not found. Please build it first."
        return $false
    }
}

# Debug function
function Invoke-Debug {
    Write-Host "Starting RED X in debug mode..." -ForegroundColor Cyan

    if (Test-Path $redXExe) {
        # Set environment variable for debug mode
        $env:RED_X_DEBUG = "1"

        # Run with additional debug output
        Start-Process -FilePath $redXExe -ArgumentList "--debug" -NoNewWindow -Wait

        # Clear environment variable
        $env:RED_X_DEBUG = $null
        return $true
    }
    else {
        Write-Error "RED X executable not found. Please build it first."
        return $false
    }
}

# Main execution logic
$result = $true

if ($Clean) {
    $result = Invoke-Clean
}
elseif ($Build) {
    $result = Invoke-Build
}
elseif ($Run) {
    $result = Invoke-Run
}
elseif ($DebugMode) {
    $result = Invoke-Debug
}
elseif ($BuildAndRun -or (!$Build -and !$Run -and !$Clean -and !$DebugMode)) {
    # Default behavior is build and run
    $buildResult = Invoke-Build
    if ($buildResult) {
        $result = Invoke-Run
    }
    else {
        $result = $false
    }
}

if ($result) {
    exit 0
}
else {
    exit 1
}
