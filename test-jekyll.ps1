# Project RED X - Jekyll Testing Script
# This script tests Jekyll functionality and checks for common issues

param (
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"
if ($Verbose) {
    $VerbosePreference = "Continue"
}

# Helper function for colored output
function Write-ColorOutput {
    param (
        [Parameter(Mandatory = $true)]
        [string]$Message,

        [Parameter(Mandatory = $false)]
        [string]$ForegroundColor = "White"
    )

    Write-Host $Message -ForegroundColor $ForegroundColor
}

function Test-Command {
    param (
        [string]$Command,
        [string]$Arguments = "",
        [string]$Description
    )

    Write-ColorOutput "Testing: $Description..." "Cyan"

    try {
        if ($Arguments) {
            $output = Invoke-Expression -Command "$Command $Arguments" 2>&1
        }
        else {
            $output = Invoke-Expression -Command $Command 2>&1
        }

        Write-ColorOutput "✓ Success: $Description" "Green"
        return @{
            Success = $true
            Output  = $output
        }
    }
    catch {
        Write-ColorOutput "✗ Failed: $Description" "Red"
        Write-ColorOutput "$($_.Exception.Message)" "Yellow"
        return @{
            Success = $false
            Error   = $_.Exception.Message
        }
    }
}

function Test-JekyllProject {
    param (
        [string]$ProjectRoot
    )

    Write-ColorOutput "Testing Jekyll project at $ProjectRoot" "Cyan"

    $tests = @()

    # Test 1: Check if _config.yml exists
    $configYml = Join-Path $ProjectRoot "_config.yml"
    if (Test-Path $configYml) {
        Write-ColorOutput "✓ _config.yml found" "Green"
        $tests += @{
            Name    = "Config File"
            Success = $true
            Message = "_config.yml found"
        }
    }
    else {
        Write-ColorOutput "✗ _config.yml not found" "Red"
        $tests += @{
            Name    = "Config File"
            Success = $false
            Message = "_config.yml not found. This is required for Jekyll."
        }
    }

    # Test 2: Check if Gemfile exists
    $gemfile = Join-Path $ProjectRoot "Gemfile"
    if (Test-Path $gemfile) {
        Write-ColorOutput "✓ Gemfile found" "Green"
        $tests += @{
            Name    = "Gemfile"
            Success = $true
            Message = "Gemfile found"
        }
    }
    else {
        Write-ColorOutput "✗ Gemfile not found" "Red"
        $tests += @{
            Name    = "Gemfile"
            Success = $false
            Message = "Gemfile not found. This is required for Jekyll dependencies."
        }
    }

    # Test 3: Check basic project structure
    $layoutsDir = Join-Path $ProjectRoot "_layouts"
    $postsDir = Join-Path $ProjectRoot "_posts"
    $includesDir = Join-Path $ProjectRoot "_includes"

    $projectStructure = @{
        "_layouts"  = Test-Path $layoutsDir
        "_posts"    = Test-Path $postsDir
        "_includes" = Test-Path $includesDir
    }

    $missingDirs = $projectStructure.GetEnumerator() | Where-Object { -not $_.Value } | ForEach-Object { $_.Key }

    if ($missingDirs.Count -eq 0) {
        Write-ColorOutput "✓ Basic Jekyll directory structure found" "Green"
        $tests += @{
            Name    = "Directory Structure"
            Success = $true
            Message = "Basic Jekyll directory structure found"
        }
    }
    else {
        Write-ColorOutput "⚠ Some recommended Jekyll directories are missing: $($missingDirs -join ', ')" "Yellow"
        $tests += @{
            Name    = "Directory Structure"
            Success = $true # Not critical, just a warning
            Message = "Some recommended Jekyll directories are missing: $($missingDirs -join ', ')"
            Warning = $true
        }
    }

    # Return the test results
    return @{
        Tests     = $tests
        AllPassed = ($tests | Where-Object { -not $_.Success }).Count -eq 0
    }
}

# Main execution
Write-ColorOutput "PROJECT RED X - JEKYLL TESTING" "Cyan"
Write-ColorOutput "=============================" "Cyan"

# Test Ruby availability
$rubyTest = Test-Command -Command "ruby" -Arguments "-v" -Description "Ruby availability"

if (-not $rubyTest.Success) {
    Write-ColorOutput "Ruby is not available. Please install Ruby before continuing." "Red"
    exit 1
}

Write-ColorOutput "Ruby version: $($rubyTest.Output)" "Green"

# Test Bundler availability
$bundlerTest = Test-Command -Command "bundle" -Arguments "-v" -Description "Bundler availability"

if (-not $bundlerTest.Success) {
    Write-ColorOutput "Bundler is not available. Installing..." "Yellow"
    $installBundler = Test-Command -Command "gem" -Arguments "install bundler" -Description "Installing Bundler"

    if (-not $installBundler.Success) {
        Write-ColorOutput "Failed to install Bundler. Please install it manually: gem install bundler" "Red"
        exit 1
    }
}

# Test Jekyll availability
$jekyllTest = Test-Command -Command "bundle" -Arguments "exec jekyll -v" -Description "Jekyll availability"

if (-not $jekyllTest.Success) {
    Write-ColorOutput "Jekyll is not available through Bundler. Checking if it's installed globally..." "Yellow"

    $globalJekyllTest = Test-Command -Command "jekyll" -Arguments "-v" -Description "Global Jekyll installation"

    if (-not $globalJekyllTest.Success) {
        Write-ColorOutput "Jekyll is not installed. Installing..." "Yellow"
        $installJekyll = Test-Command -Command "gem" -Arguments "install jekyll" -Description "Installing Jekyll"

        if (-not $installJekyll.Success) {
            Write-ColorOutput "Failed to install Jekyll. Please install it manually: gem install jekyll" "Red"
            exit 1
        }
    }
}

# Test the project structure
$projectRoot = Split-Path -Parent $PSCommandPath
$projectTests = Test-JekyllProject -ProjectRoot $projectRoot

# Try running Jekyll build
Write-ColorOutput "`nTesting Jekyll build..." "Cyan"

Push-Location $projectRoot
try {
    $buildTest = Test-Command -Command "bundle" -Arguments "exec jekyll build --trace" -Description "Jekyll build process"

    if ($buildTest.Success) {
        Write-ColorOutput "`nJekyll build successful!" "Green"
    }
    else {
        Write-ColorOutput "`nJekyll build failed. See error above for details." "Red"
    }
}
finally {
    Pop-Location
}

# Summary
Write-ColorOutput "`nTEST SUMMARY" "Cyan"
Write-ColorOutput "===========" "Cyan"

foreach ($test in $projectTests.Tests) {
    if ($test.Success -and -not $test.Warning) {
        Write-ColorOutput "✓ $($test.Name): $($test.Message)" "Green"
    }
    elseif ($test.Warning) {
        Write-ColorOutput "⚠ $($test.Name): $($test.Message)" "Yellow"
    }
    else {
        Write-ColorOutput "✗ $($test.Name): $($test.Message)" "Red"
    }
}

if ($buildTest.Success) {
    Write-ColorOutput "✓ Jekyll Build: Success" "Green"
}
else {
    Write-ColorOutput "✗ Jekyll Build: Failed" "Red"
}

# Final result
if ($projectTests.AllPassed -and $buildTest.Success) {
    Write-ColorOutput "`nALL TESTS PASSED! Jekyll is correctly set up and working." "Green"
    exit 0
}
elseif ($projectTests.AllPassed -and -not $buildTest.Success) {
    Write-ColorOutput "`nBASIC SETUP OKAY BUT BUILD FAILED. Check the build errors above." "Yellow"
    exit 1
}
else {
    Write-ColorOutput "`nSETUP ISSUES DETECTED. Please address the issues above." "Red"
    exit 1
}
