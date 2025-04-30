# start-jekyll.ps1
# Script to start Jekyll with the correct Ruby environment and better error handling

# Set Ruby 2.7.7 in the path
$env:PATH = "C:\Ruby27-x64\bin;" + $env:PATH

# Show current Ruby version
Write-Host "Using Ruby: " -NoNewline -ForegroundColor Cyan
ruby -v
Write-Host "Using Bundler: " -NoNewline -ForegroundColor Cyan
bundle -v
Write-Host "Using Jekyll: " -NoNewline -ForegroundColor Cyan
bundle exec jekyll -v
Write-Host ""

# Check if port 4000 is in use
$portInUse = $false
try {
    $testConnection = New-Object System.Net.Sockets.TcpClient("localhost", 4000)
    if ($testConnection.Connected) {
        $portInUse = $true
        $testConnection.Close()
    }
} catch {
    $portInUse = $false
}

if ($portInUse) {
    Write-Host "WARNING: Port 4000 is already in use. Jekyll may fail to start." -ForegroundColor Yellow
    Write-Host "You may need to find and stop the process that's using port 4000 first." -ForegroundColor Yellow
    Write-Host "Attempting to kill the process..." -ForegroundColor Yellow

    # Kill any processes using port 4000
    $processesUsingPort = netstat -ano | findstr :4000
    if ($processesUsingPort) {
        $processesUsingPort | ForEach-Object {
            $processInfo = $_ -split '\s+'
            if ($processInfo.Count -ge 5) {
                $pid = $processInfo[4]
                Write-Host "Stopping process with PID $pid that's using port 4000..." -ForegroundColor Yellow
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# Create a simple test HTML file to verify Jekyll server
$testHtml = @"
<!DOCTYPE html>
<html>
<head>
    <title>Jekyll Test Page</title>
    <meta charset="utf-8">
</head>
<body>
    <h1>Jekyll Test Page</h1>
    <p>This page confirms that Jekyll is working correctly.</p>
    <p>Current time: {{ site.time | date_to_string }}</p>
</body>
</html>
"@

# Create a test page directory if it doesn't exist
if (-not (Test-Path -Path "_test")) {
    New-Item -ItemType Directory -Path "_test" | Out-Null
}
$testHtml | Out-File -FilePath "_test/index.html" -Encoding utf8

# Create a minimal _config.yml if it doesn't exist
if (-not (Test-Path -Path "_config.yml")) {
    @"
# Minimal Jekyll Config for testing
title: Jekyll Test Site
baseurl: ""
url: "http://localhost:4000"
exclude: ["emsdk", "node_modules", "vendor"]
"@ | Out-File -FilePath "_config.yml" -Encoding utf8
}

# Verify that the site directory structure is correct
if (-not (Test-Path -Path "_layouts")) {
    New-Item -ItemType Directory -Path "_layouts" | Out-Null
    @"
<!DOCTYPE html>
<html>
<head>
    <title>{{ page.title }}</title>
</head>
<body>
{{ content }}
</body>
</html>
"@ | Out-File -FilePath "_layouts/default.html" -Encoding utf8
}

if (-not (Test-Path -Path "_includes")) {
    New-Item -ItemType Directory -Path "_includes" | Out-Null
}

# Serve the Jekyll site with explicit parameters and error handling
Write-Host "Starting Jekyll server..." -ForegroundColor Green
Write-Host "Your site will be available at http://localhost:4000" -ForegroundColor Yellow
Write-Host "Test page URL: http://localhost:4000/_test/" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Try using a different host binding approach
try {
    # Start Jekyll with verbose output and explicit IP binding
    bundle exec jekyll serve --watch --trace --host=0.0.0.0
}
catch {
    Write-Host "ERROR: Jekyll server failed to start!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Attempting alternative Jekyll command..." -ForegroundColor Yellow

    # Try an alternative approach by using the built-in webrick server
    bundle exec jekyll serve --force_polling --no-watch --host=localhost
}
