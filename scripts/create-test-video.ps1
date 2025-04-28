param (
    [Parameter()]
    [string]$Duration = "10",
    [Parameter()]
    [string]$Resolution = "1280x720",
    [Parameter()]
    [string]$FileName = "test-video.mp4"
)

$outputPath = Join-Path -Path $PSScriptRoot -ChildPath $FileName

Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║              TEST VIDEO GENERATOR              ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Cyan

# Check if FFmpeg is installed
$ffmpegExists = $null
try {
    $ffmpegExists = Get-Command "ffmpeg" -ErrorAction SilentlyContinue
} catch {
    $ffmpegExists = $null
}

if (-not $ffmpegExists) {
    Write-Host "FFmpeg is not installed or not in PATH. Attempting to download a portable version..." -ForegroundColor Yellow

    # Create temp directory for FFmpeg
    $tempDir = Join-Path -Path $env:TEMP -ChildPath "ffmpeg-temp"
    if (-not (Test-Path $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir | Out-Null
    }

    # Download FFmpeg zip file
    $ffmpegZip = Join-Path -Path $tempDir -ChildPath "ffmpeg.zip"
    $ffmpegUrl = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"

    Write-Host "Downloading FFmpeg from $ffmpegUrl..." -ForegroundColor Cyan

    try {
        Invoke-WebRequest -Uri $ffmpegUrl -OutFile $ffmpegZip
    } catch {
        Write-Host "Failed to download FFmpeg. Please install FFmpeg manually and add it to your PATH." -ForegroundColor Red
        Write-Host "Download from: https://ffmpeg.org/download.html" -ForegroundColor Yellow
        exit 1
    }

    # Extract FFmpeg
    Write-Host "Extracting FFmpeg..." -ForegroundColor Cyan
    Expand-Archive -Path $ffmpegZip -DestinationPath $tempDir -Force

    # Find ffmpeg.exe in the extracted files
    $ffmpegExe = Get-ChildItem -Path $tempDir -Recurse -Filter "ffmpeg.exe" | Select-Object -First 1 -ExpandProperty FullName

    if (-not $ffmpegExe) {
        Write-Host "Could not find ffmpeg.exe in the extracted files. Please install FFmpeg manually." -ForegroundColor Red
        exit 1
    }

    $ffmpegCmd = $ffmpegExe
} else {
    $ffmpegCmd = "ffmpeg"
}

# Create test video
Write-Host "Generating test video with the following settings:" -ForegroundColor Green
Write-Host "- Duration: $Duration seconds" -ForegroundColor Green
Write-Host "- Resolution: $Resolution" -ForegroundColor Green
Write-Host "- Output: $outputPath" -ForegroundColor Green

$currentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$text = "Web3 Core Functionality Test Video`nCreated: $currentDate"

# Generate a test video with a gradient background and project name/date text overlay
$ffmpegArgs = @(
    "-y",
    "-f", "lavfi",
    "-i", "testsrc=duration=$Duration:size=$Resolution:rate=30",
    "-vf", "drawtext=fontfile=Arial:text='$text':fontcolor=white:fontsize=36:box=1:boxcolor=black@0.5:x=(w-text_w)/2:y=(h-text_h)/2",
    "-c:v", "libx264",
    "-preset", "fast",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    $outputPath
)

Write-Host "Running FFmpeg command..." -ForegroundColor Cyan
Start-Process -FilePath $ffmpegCmd -ArgumentList $ffmpegArgs -NoNewWindow -Wait

if (Test-Path $outputPath) {
    $fileSize = (Get-Item $outputPath).Length / 1MB
    Write-Host "Test video successfully created at: $outputPath" -ForegroundColor Green
    Write-Host "File size: $([Math]::Round($fileSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "Failed to create test video." -ForegroundColor Red
}
