# Format-And-Lint.ps1
# Formats and lints code in the project

$ErrorActionPreference = "Stop"

# Script root directory
$scriptRoot = $PSScriptRoot

# Check if npm is available
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Error: npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Run Prettier to format code
Write-Host "Running Prettier to format code..." -ForegroundColor Cyan
npm run prettier
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Prettier formatting had issues" -ForegroundColor Yellow
} else {
    Write-Host "  √ Prettier formatting completed" -ForegroundColor Green
}

# Run ESLint to check JavaScript/TypeScript
Write-Host "Running ESLint to check JavaScript/TypeScript..." -ForegroundColor Cyan
npm run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: ESLint found issues" -ForegroundColor Yellow
} else {
    Write-Host "  √ ESLint checks passed" -ForegroundColor Green
}

# Run markdown lint checks
Write-Host "Running markdown lint checks..." -ForegroundColor Cyan
npm run lint:md
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Markdown linting found issues" -ForegroundColor Yellow
    
    # Try to fix common markdown issues
    Write-Host "Attempting to fix common markdown issues..." -ForegroundColor Cyan
    & "$scriptRoot\Fix-MarkdownLint.ps1"
} else {
    Write-Host "  √ Markdown lint checks passed" -ForegroundColor Green
}

Write-Host "Format and lint process completed!" -ForegroundColor Green
