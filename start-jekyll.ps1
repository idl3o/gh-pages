# start-jekyll.ps1
# Script to start Jekyll with the correct Ruby environment and better error handling

# Set error action preference to stop on any error
$ErrorActionPreference = "Stop"

Write-Host "===== Starting Jekyll Development Server =====" -ForegroundColor Green

# Set Ruby environment
$env:PATH = 'C:\Ruby27-x64\bin;' + $env:PATH

# Check Ruby environment
$rubyVersion = ruby -v
$bundlerVersion = bundle -v

Write-Host "Ruby: $rubyVersion" -ForegroundColor Yellow
Write-Host "Bundler: $bundlerVersion" -ForegroundColor Yellow

# Install dependencies if needed
if (-not (Test-Path -Path "Gemfile.lock")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    bundle install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Bundle install failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
}

# Start Jekyll server
Write-Host "Starting Jekyll server..." -ForegroundColor Green
Write-Host "Site will be available at http://localhost:4000/" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow

bundle exec jekyll serve --livereload --incremental
