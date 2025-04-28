param (
    [Parameter()]
    [string]$Duration = "30",
    [Parameter()]
    [string]$Resolution = "1920x1080",
    [Parameter()]
    [string]$FileName = "web3-demo-video.mp4",
    [Parameter()]
    [string]$Theme = "blockchain", # Options: blockchain, token, smart-contract
    [Parameter()]
    [switch]$IncludeCodeDemo = $false,
    [Parameter()]
    [switch]$IncludeLogo = $true
)

$outputPath = Join-Path -Path $PSScriptRoot -ChildPath $FileName

Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║            WEB3 DEMO VIDEO CREATOR             ║" -ForegroundColor Cyan
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

# Create assets directory if it doesn't exist
$assetsDir = Join-Path -Path $PSScriptRoot -ChildPath "assets"
$tempDir = Join-Path -Path $assetsDir -ChildPath "temp"

if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir | Out-Null
}

if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

# Define theme-specific settings
$bgColor = "0x1a1a2e"
$accentColor = "0x4e9fff"
$textColor = "white"
$codeSnippet = ""
$logoText = "Web3 Core"

switch ($Theme) {
    "blockchain" {
        $bgColor = "0x1a1a2e"
        $accentColor = "0x4e9fff"
        $overlayText = "Blockchain Technology Demo"
        $codeSnippet = "class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return SHA256(
      this.index +
      this.previousHash +
      this.timestamp +
      JSON.stringify(this.data)
    ).toString();
  }
}"
    }
    "token" {
        $bgColor = "0x2a1a3e"
        $accentColor = "0x9c4eff"
        $overlayText = "Token Implementation Demo"
        $codeSnippet = "contract ERC20Token {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    event Transfer(
        address indexed from,
        address indexed to,
        uint256 value
    );

    function transfer(address to, uint256 value)
        public returns (bool success) {
        require(balanceOf[msg.sender] >= value);
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
}"
    }
    "smart-contract" {
        $bgColor = "0x1a3e2a"
        $accentColor = "0x4eff9c"
        $overlayText = "Smart Contract Demo"
        $codeSnippet = "pragma solidity ^0.8.0;

contract StreamPayment {
    address payable public recipient;
    uint public startTime;
    uint public endTime;
    uint public totalAmount;
    uint public withdrawnAmount;

    constructor(
        address payable _recipient,
        uint _duration
    ) payable {
        recipient = _recipient;
        startTime = block.timestamp;
        endTime = startTime + _duration;
        totalAmount = msg.value;
    }

    function withdraw() external {
        require(msg.sender == recipient,
            'Only recipient can withdraw');

        uint availableAmount =
            calculateAvailableAmount() - withdrawnAmount;

        withdrawnAmount += availableAmount;
        recipient.transfer(availableAmount);
    }

    function calculateAvailableAmount()
        public view returns (uint) {
        if (block.timestamp >= endTime) {
            return totalAmount;
        }
        return totalAmount *
            (block.timestamp - startTime) /
            (endTime - startTime);
    }
}"
    }
}

Write-Host "Generating Web3 demo video with the following settings:" -ForegroundColor Green
Write-Host "- Theme: $Theme" -ForegroundColor Green
Write-Host "- Duration: $Duration seconds" -ForegroundColor Green
Write-Host "- Resolution: $Resolution" -ForegroundColor Green
Write-Host "- Include Code Demo: $IncludeCodeDemo" -ForegroundColor Green
Write-Host "- Include Logo: $IncludeLogo" -ForegroundColor Green
Write-Host "- Output: $outputPath" -ForegroundColor Green

# Create temporary files for the composition
$currentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$headerText = "Web3 Core Functionality - $overlayText"
$footerText = "Created: $currentDate"

# Generate complex background
$bgFile = Join-Path -Path $tempDir -ChildPath "bg.mp4"
$bgFilterComplex = "[0:v]drawbox=w=iw:h=ih:color=$($bgColor):t=fill,format=yuv420p[bg];"

$animDuration = [int]$Duration
if ($animDuration -lt 5) { $animDuration = 5 }

# Generate animations based on theme
$animationFilter = ""
switch ($Theme) {
    "blockchain" {
        $animationFilter = "
        [bg][1:v]overlay=x='if(ld(0), if(lt(ld(1),0), 0, ld(1)), st(0,1); st(1, sw-tw))':(H-h)/2:format=auto,
        drawtext=fontfile=Arial:text='$headerText':fontcolor=$textColor:fontsize=(h/15):x=(w-text_w)/2:y=h/8:box=1:boxcolor=$($accentColor)@0.5:boxborderw=5,
        drawtext=fontfile=Arial:text='$footerText':fontcolor=$textColor:fontsize=(h/25):x=(w-text_w)/2:y=h-h/8:box=1:boxcolor=$($accentColor)@0.5:boxborderw=3"
    }
    "token" {
        $animationFilter = "
        [bg][1:v]overlay=x='if(ld(0), if(lt(ld(1),0), 0, ld(1)), st(0,1); st(1, sw-tw))':(H-h)/2:format=auto,
        drawtext=fontfile=Arial:text='$headerText':fontcolor=$textColor:fontsize=(h/15):x=(w-text_w)/2:y=h/8:box=1:boxcolor=$($accentColor)@0.5:boxborderw=5,
        drawtext=fontfile=Arial:text='$footerText':fontcolor=$textColor:fontsize=(h/25):x=(w-text_w)/2:y=h-h/8:box=1:boxcolor=$($accentColor)@0.5:boxborderw=3"
    }
    "smart-contract" {
        $animationFilter = "
        [bg][1:v]overlay=x='if(ld(0), if(lt(ld(1),0), 0, ld(1)), st(0,1); st(1, sw-tw))':(H-h)/2:format=auto,
        drawtext=fontfile=Arial:text='$headerText':fontcolor=$textColor:fontsize=(h/15):x=(w-text_w)/2:y=h/8:box=1:boxcolor=$($accentColor)@0.5:boxborderw=5,
        drawtext=fontfile=Arial:text='$footerText':fontcolor=$textColor:fontsize=(h/25):x=(w-text_w)/2:y=h-h/8:box=1:boxcolor=$($accentColor)@0.5:boxborderw=3"
    }
}

# Include code if requested
if ($IncludeCodeDemo) {
    # Create a temporary file with code
    $codeFile = Join-Path -Path $tempDir -ChildPath "code.txt"
    $codeSnippet | Out-File -FilePath $codeFile -Encoding utf8

    $lineHeight = 18
    $fontSize = 16
    $codeX = "w/2-w/3"
    $codeY = "h/2-h/4"
    $codeWidth = "w/1.5"
    $codeHeight = "h/2"

    $animationFilter += ",
    drawbox=x=$codeX:y=$codeY:w=$codeWidth:h=$codeHeight:color=black@0.8:t=fill,
    drawtext=fontfile=Consolas:textfile=$codeFile:fontcolor=lightgreen:fontsize=$fontSize:x=$codeX+20:y=$codeY+20:line_spacing=$lineHeight"
}

# Generate final composition
Write-Host "Creating background and animations..." -ForegroundColor Cyan

# Generate blockchain animation using a testsrc and overlays
$animFile = Join-Path -Path $tempDir -ChildPath "anim.mp4"
$animArgs = @(
    "-y",
    "-f", "lavfi",
    "-i", "nullsrc=size=$Resolution:duration=$Duration:rate=30",
    "-f", "lavfi",
    "-i", "mandelbrot=size=$Resolution:rate=30:start_scale=3:end_scale=0.3:end_pts=$Duration",
    "-filter_complex", $bgFilterComplex + $animationFilter,
    "-c:v", "libx264",
    "-preset", "fast",
    "-pix_fmt", "yuv420p",
    "-movflags", "+faststart",
    $outputPath
)

Write-Host "Rendering final video..." -ForegroundColor Cyan
Start-Process -FilePath $ffmpegCmd -ArgumentList $animArgs -NoNewWindow -Wait

# Clean up temp files
Write-Host "Cleaning up temporary files..." -ForegroundColor Cyan
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}

if (Test-Path $outputPath) {
    $fileSize = (Get-Item $outputPath).Length / 1MB
    Write-Host "Web3 demo video successfully created at: $outputPath" -ForegroundColor Green
    Write-Host "File size: $([Math]::Round($fileSize, 2)) MB" -ForegroundColor Green
} else {
    Write-Host "Failed to create demo video." -ForegroundColor Red
}
