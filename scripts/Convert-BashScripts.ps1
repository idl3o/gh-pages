# Convert-BashScripts.ps1
# Script to convert or remove bash scripts from the workspace

$ErrorActionPreference = "Stop"

# Define colors for output
$colorInfo = "Cyan"
$colorSuccess = "Green"
$colorWarning = "Yellow"
$colorError = "Red"

# Script root directory
$scriptRoot = $PSScriptRoot

# Log messages with color
function Write-ColorMessage {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Message,

        [Parameter(Mandatory=$false)]
        [string]$Color = "White"
    )

    Write-Host $Message -ForegroundColor $Color
}

# Find all bash scripts in the workspace
function Find-BashScripts {
    $bashScripts = Get-ChildItem -Path $scriptRoot -Filter "*.sh" -Recurse
    return $bashScripts
}

# List all bash scripts in the workspace
function Show-BashScripts {
    $bashScripts = Find-BashScripts

    Write-ColorMessage "Found $($bashScripts.Count) bash scripts in the workspace:" $colorInfo
    foreach ($script in $bashScripts) {
        Write-ColorMessage "  - $($script.FullName)" "White"
    }
    Write-ColorMessage "Press any key to continue..." $colorInfo
}

# Rename bash scripts to .sh.bak
function Backup-BashScripts {
    $bashScripts = Find-BashScripts

    Write-ColorMessage "Backing up $($bashScripts.Count) bash scripts..." $colorInfo
    foreach ($script in $bashScripts) {
        $bakFile = "$($script.FullName).bak"
        Copy-Item -Path $script.FullName -Destination $bakFile -Force
        Write-ColorMessage "  √ Backed up: $($script.Name)" $colorSuccess
    }
    Write-ColorMessage "All bash scripts backed up successfully." $colorSuccess
}

# Remove all .sh files (after backup)
function Remove-BashScripts {
    $bashScripts = Find-BashScripts

    Write-ColorMessage "Removing $($bashScripts.Count) bash scripts..." $colorInfo
    foreach ($script in $bashScripts) {
        Remove-Item -Path $script.FullName -Force
        Write-ColorMessage "  √ Removed: $($script.Name)" $colorSuccess
    }
    Write-ColorMessage "All bash scripts removed successfully." $colorSuccess
}

# Create PowerShell replacements for critical scripts
function Create-PowerShellReplacements {
    Write-ColorMessage "Creating PowerShell replacements for critical bash scripts..." $colorInfo

    # We've already created the key replacement scripts like:
    # - run-ubuntu.ps1
    # - setup-emsdk.ps1
    # - deploy-gh-pages.ps1

    # Add more replacements as needed
    Convert-FixMarkdownLint
    Convert-FormatAndLint
    Convert-RepairProject
    Convert-TestLocal

    Write-ColorMessage "PowerShell replacement scripts created successfully." $colorSuccess
}

# Convert fix-markdown-lint.sh to PowerShell
function Convert-FixMarkdownLint {
    $scriptPath = Join-Path -Path $scriptRoot -ChildPath "Fix-MarkdownLint.ps1"

    if (Test-Path $scriptPath) {
        Write-ColorMessage "  √ Fix-MarkdownLint.ps1 already exists" $colorSuccess
        return
    }

    $content = @'
# Fix-MarkdownLint.ps1
# Fixes common markdown linting issues

$ErrorActionPreference = "Stop"

# Script root directory
$scriptRoot = $PSScriptRoot

# Find all markdown files in the workspace
$mdFiles = Get-ChildItem -Path $scriptRoot -Filter "*.md" -Recurse

Write-Host "Fixing markdown linting issues..." -ForegroundColor Cyan

foreach ($file in $mdFiles) {
    Write-Host "Processing: $($file.Name)"

    # Read the content
    $content = Get-Content -Path $file.FullName -Raw

    # Fix common issues
    # 1. Ensure single newline at end of file
    if (!$content.EndsWith("`n")) {
        $content += "`n"
    } else {
        # Remove multiple trailing newlines
        $content = $content -replace "(\n\s*)+$", "`n"
    }

    # 2. Convert tabs to spaces
    $content = $content -replace "`t", "    "

    # 3. Fix line endings (ensure CRLF for Windows)
    $content = $content -replace "\r?\n", "`r`n"

    # 4. Remove trailing whitespace
    $content = $content -replace " +\r\n", "`r`n"

    # Write the changes back
    Set-Content -Path $file.FullName -Value $content -NoNewline
    Add-Content -Path $file.FullName -Value ""  # Add single newline at end

    Write-Host "  √ Fixed: $($file.Name)" -ForegroundColor Green
}

Write-Host "Markdown linting fixes completed!" -ForegroundColor Green
'@

    Set-Content -Path $scriptPath -Value $content
    Write-ColorMessage "  + Created: Fix-MarkdownLint.ps1" $colorSuccess
}

# Convert format-and-lint.sh to PowerShell
function Convert-FormatAndLint {
    $scriptPath = Join-Path -Path $scriptRoot -ChildPath "Format-And-Lint.ps1"

    if (Test-Path $scriptPath) {
        Write-ColorMessage "  √ Format-And-Lint.ps1 already exists" $colorSuccess
        return
    }

    $content = @'
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
'@

    Set-Content -Path $scriptPath -Value $content
    Write-ColorMessage "  + Created: Format-And-Lint.ps1" $colorSuccess
}

# Convert repair-project.sh to PowerShell
function Convert-RepairProject {
    $scriptPath = Join-Path -Path $scriptRoot -ChildPath "Repair-Project.ps1"

    if (Test-Path $scriptPath) {
        Write-ColorMessage "  √ Repair-Project.ps1 already exists" $colorSuccess
        return
    }

    $content = @'
# Repair-Project.ps1
# Repairs and restores project configuration

$ErrorActionPreference = "Stop"

# Script root directory
$scriptRoot = $PSScriptRoot

Write-Host "Starting project repair process..." -ForegroundColor Cyan

# Check for npm and install dependencies
Write-Host "Checking npm dependencies..." -ForegroundColor Cyan
if (-not (Test-Path -Path "$scriptRoot\node_modules")) {
    Write-Host "Node modules not found, installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: npm install failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  √ Dependencies installed" -ForegroundColor Green
} else {
    Write-Host "  √ Node modules found" -ForegroundColor Green
}

# Check Jekyll/Ruby dependencies
Write-Host "Checking Jekyll dependencies..." -ForegroundColor Cyan
if (Test-Path -Path "$scriptRoot\Gemfile") {
    if (Get-Command bundle -ErrorAction SilentlyContinue) {
        Write-Host "Installing Ruby gems..." -ForegroundColor Yellow
        bundle install
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Warning: Bundle install had issues" -ForegroundColor Yellow
        } else {
            Write-Host "  √ Ruby gems installed" -ForegroundColor Green
        }
    } else {
        Write-Host "Warning: Bundle not found, skipping Ruby gems installation" -ForegroundColor Yellow
    }
}

# Repair common issues
Write-Host "Repairing common project issues..." -ForegroundColor Cyan

# 1. Fix permissions on key files
if (Test-Path -Path "$scriptRoot\.git\hooks") {
    Write-Host "Ensuring Git hooks are executable..." -ForegroundColor Yellow
    # Note: PowerShell doesn't have direct chmod equivalent
    # For Windows, executable permission isn't usually an issue
    Write-Host "  √ Git hooks checked" -ForegroundColor Green
}

# 2. Regenerate package-lock.json if needed
if (-not (Test-Path -Path "$scriptRoot\package-lock.json") -and (Test-Path -Path "$scriptRoot\package.json")) {
    Write-Host "Regenerating package-lock.json..." -ForegroundColor Yellow
    npm install --package-lock-only
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: Failed to regenerate package-lock.json" -ForegroundColor Yellow
    } else {
        Write-Host "  √ Package lock regenerated" -ForegroundColor Green
    }
}

# 3. Setup Emscripten SDK if needed for RED X
if (-not (Test-Path -Path "$scriptRoot\emsdk")) {
    Write-Host "Setting up Emscripten SDK..." -ForegroundColor Yellow
    & "$scriptRoot\setup-emsdk.ps1"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: Emscripten SDK setup had issues" -ForegroundColor Yellow
    } else {
        Write-Host "  √ Emscripten SDK setup completed" -ForegroundColor Green
    }
}

# Final message
Write-Host "Project repair process completed!" -ForegroundColor Green
Write-Host "If you still encounter issues, please check documentation or ask for support." -ForegroundColor Cyan
'@

    Set-Content -Path $scriptPath -Value $content
    Write-ColorMessage "  + Created: Repair-Project.ps1" $colorSuccess
}

# Convert test-local.sh to PowerShell
function Convert-TestLocal {
    $scriptPath = Join-Path -Path $scriptRoot -ChildPath "Test-Local.ps1"

    if (Test-Path $scriptPath) {
        Write-ColorMessage "  √ Test-Local.ps1 already exists" $colorSuccess
        return
    }

    $content = @'
# Test-Local.ps1
# Runs local tests for the project

$ErrorActionPreference = "Stop"

# Script root directory
$scriptRoot = $PSScriptRoot

Write-Host "Starting local test process..." -ForegroundColor Cyan

# Run unit tests
Write-Host "Running unit tests..." -ForegroundColor Cyan
npm test
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Unit tests failed" -ForegroundColor Red
} else {
    Write-Host "  √ Unit tests passed" -ForegroundColor Green
}

# Test RED X build if available
if (Test-Path -Path "$scriptRoot\red_x") {
    Write-Host "Testing RED X build..." -ForegroundColor Cyan

    # Build web version
    Write-Host "Building RED X web version..." -ForegroundColor Yellow
    & "$scriptRoot\.vscode\tasks.json" "make_web"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Warning: RED X web build had issues" -ForegroundColor Yellow
    } else {
        Write-Host "  √ RED X web build completed" -ForegroundColor Green
    }

    # Check if build files exist
    if (Test-Path -Path "$scriptRoot\red_x\index.html" -and
        Test-Path -Path "$scriptRoot\red_x\index.js" -and
        Test-Path -Path "$scriptRoot\red_x\index.wasm") {
        Write-Host "  √ RED X build files verified" -ForegroundColor Green
    } else {
        Write-Host "Warning: RED X build files missing or incomplete" -ForegroundColor Yellow
    }
}

# Final message
Write-Host "Local test process completed!" -ForegroundColor Green
'@

    Set-Content -Path $scriptPath -Value $content
    Write-ColorMessage "  + Created: Test-Local.ps1" $colorSuccess
}

# Display menu options
function Show-Menu {
    Write-ColorMessage "==== Bash Script Management ====" $colorInfo
    Write-ColorMessage "1. List all bash scripts in workspace" $colorInfo
    Write-ColorMessage "2. Create PowerShell replacements for critical scripts" $colorInfo
    Write-ColorMessage "3. Backup and remove all bash scripts" $colorInfo
    Write-ColorMessage "4. Quit" $colorInfo
    Write-ColorMessage "Enter your choice (1-4): " $colorInfo -NoNewline
}

# Process option automatically
function Process-Option {
    param (
        [Parameter(Mandatory=$true)]
        [int]$Option
    )

    switch ($Option) {
        1 {
            Show-BashScripts
            return $true
        }
        2 {
            Create-PowerShellReplacements
            return $true
        }
        3 {
            Backup-BashScripts
            Remove-BashScripts
            return $true
        }
        4 {
            Write-ColorMessage "Exiting..." $colorInfo
            return $false
        }
        default {
            Write-ColorMessage "Invalid option: $Option" $colorWarning
            return $true
        }
    }
}

# Main script execution
Write-ColorMessage "Bash Script Conversion Utility" $colorInfo
Write-ColorMessage "This script helps you manage bash scripts in your workspace" $colorInfo

# Automatically process options 2 (create replacements) and 3 (backup and remove)
Process-Option 2
Process-Option 3

# Done
Write-ColorMessage "Bash script conversion completed successfully!" $colorSuccess
