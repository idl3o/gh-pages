# start-jekyll.ps1
# Script to start Jekyll with the correct Ruby environment and better error handling

# Set error action preference to stop on any error
$ErrorActionPreference = "Stop"

Write-Host "===== Starting Jekyll Server =====" -ForegroundColor Green

# Check if Ruby is available in the PATH
try {
    # Add Ruby to PATH if needed
    $env:PATH = "C:\Ruby27-x64\bin;" + $env:PATH
    $rubyVersion = ruby -v
    Write-Host "Using Ruby: $rubyVersion" -ForegroundColor Blue
} catch {
    Write-Host "Error: Ruby is not installed or not in the PATH" -ForegroundColor Red
    Write-Host "Please install Ruby or make sure it's in your PATH" -ForegroundColor Red
    exit 1
}

# Check bundler
try {
    $bundlerVersion = bundle -v
    Write-Host "Using Bundler: $bundlerVersion" -ForegroundColor Blue
} catch {
    Write-Host "Installing Bundler..." -ForegroundColor Yellow
    gem install bundler
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install Bundler" -ForegroundColor Red
        exit 1
    }
}

# Install dependencies if needed
if (-not (Test-Path -Path "Gemfile.lock")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    bundle install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Bundle install failed!" -ForegroundColor Red
        exit 1
    }
}

# Start Jekyll
Write-Host "Starting Jekyll server..." -ForegroundColor Green
Write-Host "The documentation site will be available at http://localhost:4000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

# Set environment for Jekyll development
$env:JEKYLL_ENV = "development"

# Start Jekyll server
bundle exec jekyll serve --livereload

# Check for errors
if ($LASTEXITCODE -ne 0) {
    Write-Host "Jekyll encountered an error" -ForegroundColor Red
    exit $LASTEXITCODE
}
