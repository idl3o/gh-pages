# PowerShell script to download sample videos for testing
# These are royalty-free videos from Pexels

$videoDirectory = "public\assets\videos"
$thumbnailDirectory = "public\assets\thumbnails"

# Create directories if they don't exist
if (-not (Test-Path -Path $videoDirectory)) {
    New-Item -Path $videoDirectory -ItemType Directory -Force
    Write-Host "Created directory: $videoDirectory"
}

if (-not (Test-Path -Path $thumbnailDirectory)) {
    New-Item -Path $thumbnailDirectory -ItemType Directory -Force
    Write-Host "Created directory: $thumbnailDirectory"
}

# List of videos to download (royalty-free videos)
$videos = @(
    @{
        Name = "blockchain-animation";
        Url = "https://dl.pexels.com/videos/18284327/pexels-the-den-18284327.mp4";
        Thumbnail = "https://images.pexels.com/videos/18284327/pexels-photo-18284327.jpeg";
    },
    @{
        Name = "crypto-market";
        Url = "https://dl.pexels.com/videos/7887520/pexels-alesia-kozik-7887520.mp4";
        Thumbnail = "https://images.pexels.com/videos/7887520/pexels-photo-7887520.jpeg";
    },
    @{
        Name = "digital-world";
        Url = "https://dl.pexels.com/videos/3130284/pexels-moving-pictures-3130284.mp4";
        Thumbnail = "https://images.pexels.com/videos/3130284/pexels-photo-3130284.jpeg";
    },
    @{
        Name = "tech-code";
        Url = "https://dl.pexels.com/videos/5377864/pexels-karolina-grabowska-5377864.mp4";
        Thumbnail = "https://images.pexels.com/videos/5377864/pexels-photo-5377864.jpeg";
    }
)

# Download each video and its thumbnail
foreach ($video in $videos) {
    $videoPath = Join-Path -Path $videoDirectory -ChildPath "$($video.Name).mp4"
    $thumbnailPath = Join-Path -Path $thumbnailDirectory -ChildPath "$($video.Name).jpg"
    
    if (-not (Test-Path -Path $videoPath)) {
        Write-Host "Downloading video: $($video.Name)..."
        try {
            Invoke-WebRequest -Uri $video.Url -OutFile $videoPath
            Write-Host "Downloaded video to: $videoPath"
        } catch {
            Write-Host "Failed to download video: $($video.Name). Error: $_"
        }
    } else {
        Write-Host "Video already exists: $videoPath"
    }
    
    if (-not (Test-Path -Path $thumbnailPath)) {
        Write-Host "Downloading thumbnail: $($video.Name)..."
        try {
            Invoke-WebRequest -Uri $video.Thumbnail -OutFile $thumbnailPath
            Write-Host "Downloaded thumbnail to: $thumbnailPath"
        } catch {
            Write-Host "Failed to download thumbnail: $($video.Name). Error: $_"
        }
    } else {
        Write-Host "Thumbnail already exists: $thumbnailPath"
    }
}

Write-Host "All downloads completed!"