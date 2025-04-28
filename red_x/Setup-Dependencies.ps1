#requires -Version 5.0
<#
.SYNOPSIS
    Sets up development dependencies for RED X native development.
.DESCRIPTION
    This script checks for and installs the required dependencies for native development
    of the RED X blockchain visualization component, including SDL2 and its dependencies.
.EXAMPLE
    .\Setup-Dependencies.ps1
#>

param (
    [switch]$ForceInstall
)

$scriptPath = $PSScriptRoot
$depsPath = Join-Path -Path $scriptPath -ChildPath "deps"

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

function Test-WSL {
    try {
        $wsltestResult = wsl --list --quiet
        return ($LASTEXITCODE -eq 0)
    }
    catch {
        return $false
    }
}

function Install-MSYS2Dependencies {
    Write-Host "Installing RED X dependencies using MSYS2..." -ForegroundColor Cyan

    # Run the MSYS2 shell and install packages
    & C:\tools\msys64\msys2_shell.cmd -mingw64 -defterm -no-start -here -c `
        "pacman --noconfirm -Syu && pacman --noconfirm -S mingw-w64-x86_64-toolchain mingw-w64-x86_64-make mingw-w64-x86_64-gcc mingw-w64-x86_64-SDL2 mingw-w64-x86_64-SDL2_image"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dependencies successfully installed!" -ForegroundColor Green
        return $true
    }
    else {
        Write-Error "Failed to install dependencies using MSYS2"
        return $false
    }
}

function Install-WSLDependencies {
    Write-Host "Installing RED X dependencies using WSL..." -ForegroundColor Cyan

    # Update repositories and install build tools and SDL2
    wsl --distribution Ubuntu bash -c "sudo apt update && sudo apt install -y build-essential gcc make libsdl2-dev libsdl2-image-dev"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dependencies successfully installed in WSL!" -ForegroundColor Green
        return $true
    }
    else {
        Write-Error "Failed to install dependencies in WSL"
        return $false
    }
}

function Install-WindowsDependencies {
    Write-Host "Installing RED X dependencies for Windows native compilation..." -ForegroundColor Cyan

    # Create deps directory if it doesn't exist
    if (-not (Test-Path $depsPath)) {
        New-Item -Path $depsPath -ItemType Directory -Force | Out-Null
    }

    # We'll use Chocolatey to install dependencies if available
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-Host "Chocolatey not found. Installing Chocolatey..." -ForegroundColor Yellow
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
    }

    # Install required packages via Chocolatey
    Write-Host "Installing required packages via Chocolatey..." -ForegroundColor Yellow
    choco install -y mingw
    choco install -y make

    # Download SDL2 development libraries for Windows
    $sdl2Version = "2.28.5"
    $sdl2Url = "https://github.com/libsdl-org/SDL/releases/download/release-$sdl2Version/SDL2-devel-$sdl2Version-mingw.zip"
    $sdl2ZipPath = Join-Path -Path $depsPath -ChildPath "SDL2.zip"
    $sdl2ExtractPath = Join-Path -Path $depsPath -ChildPath "SDL2"

    Write-Host "Downloading SDL2 development libraries..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $sdl2Url -OutFile $sdl2ZipPath

    # Extract SDL2
    Write-Host "Extracting SDL2 libraries..." -ForegroundColor Yellow
    Expand-Archive -Path $sdl2ZipPath -DestinationPath $sdl2ExtractPath -Force

    # Copy libraries to the appropriate locations
    $mingwPath = "C:\ProgramData\chocolatey\lib\mingw\tools\install\mingw64"
    Write-Host "Copying SDL2 libraries to MinGW directories..." -ForegroundColor Yellow

    # Find the extracted SDL directory
    $sdl2Dir = Get-ChildItem -Path $sdl2ExtractPath -Filter "SDL2-*" -Directory | Select-Object -First 1

    if ($sdl2Dir) {
        # Copy include files
        Copy-Item -Path "$($sdl2Dir.FullName)\x86_64-w64-mingw32\include\SDL2\*" -Destination "$mingwPath\include\SDL2\" -Force -Recurse

        # Copy lib files
        Copy-Item -Path "$($sdl2Dir.FullName)\x86_64-w64-mingw32\lib\*" -Destination "$mingwPath\lib\" -Force -Recurse

        # Copy bin files
        Copy-Item -Path "$($sdl2Dir.FullName)\x86_64-w64-mingw32\bin\*.dll" -Destination "$mingwPath\bin\" -Force

        # Copy SDL2 DLL to the RED X directory
        Copy-Item -Path "$($sdl2Dir.FullName)\x86_64-w64-mingw32\bin\SDL2.dll" -Destination $scriptPath -Force
    }
    else {
        Write-Error "Could not find extracted SDL2 directory"
        return $false
    }

    # Modify the Makefile to use the correct SDL paths for Windows
    $makefilePath = Join-Path -Path $scriptPath -ChildPath "Makefile"
    $makefileContent = Get-Content -Path $makefilePath -Raw

    # Adjust the Makefile for Windows paths
    $modifiedMakefile = $makefileContent -replace "LDFLAGS = \`sdl2-config --libs\`", "LDFLAGS = -L$mingwPath\lib -lSDL2 -lSDL2main"

    # Save the modified Makefile
    $modifiedMakefile | Set-Content -Path "$makefilePath.win" -Force
    Write-Host "Created Windows-specific Makefile at $makefilePath.win" -ForegroundColor Green

    Write-Host "Dependencies installation completed!" -ForegroundColor Green
    return $true
}

# Main script execution
Write-Host "RED X Dependencies Setup" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

# Check for build environment and install dependencies
if (Test-MSYS2) {
    Write-Host "MSYS2 detected." -ForegroundColor Green
    Install-MSYS2Dependencies
}
elseif (Test-WSL) {
    Write-Host "WSL detected." -ForegroundColor Green
    Install-WSLDependencies
}
else {
    Write-Host "No MSYS2 or WSL detected, attempting to set up native Windows build environment." -ForegroundColor Yellow
    Install-WindowsDependencies
}

# Copy DLLs to the RED X directory if they exist
if (Test-Path "C:\tools\msys64\mingw64\bin\SDL2.dll") {
    Write-Host "Copying SDL2.dll to RED X directory..." -ForegroundColor Cyan
    Copy-Item -Path "C:\tools\msys64\mingw64\bin\SDL2.dll" -Destination $scriptPath -Force
}

Write-Host "RED X dependency setup complete!" -ForegroundColor Green
Write-Host "You can now build RED X natively using the 'RED X: Build Native' task." -ForegroundColor Green
