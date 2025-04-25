# PowerShell script to handle native builds with MSYS2 in Windows
# This script abstracts the complex MSYS2 calling convention

param(
    [switch]$Clean = $false
)

$RedXPath = Join-Path -Path $PSScriptRoot -ChildPath "..\red_x"
$MSYS2Path = "C:\tools\msys64\msys2_shell.cmd"

if (-not (Test-Path $MSYS2Path)) {
    Write-Host "MSYS2 not found at $MSYS2Path" -ForegroundColor Red
    Write-Host "Please install MSYS2 or update this script with the correct path" -ForegroundColor Yellow
    exit 1
}

# Change to the red_x directory
Set-Location -Path $RedXPath

if ($Clean) {
    Write-Host "Cleaning Red X build files..." -ForegroundColor Cyan
    & $MSYS2Path -mingw64 -defterm -no-start -here -c "make clean"
} else {
    Write-Host "Building Red X native version..." -ForegroundColor Cyan
    & $MSYS2Path -mingw64 -defterm -no-start -here -c "make"

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Build completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Build failed with exit code $LASTEXITCODE" -ForegroundColor Red
    }
}
