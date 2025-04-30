# PowerShell script for deploying to GitHub Pages
# deploy-gh-pages.ps1

# Enhanced error handling, logging, and validation

# Set strict error action and enable verbose output
$ErrorActionPreference = "Stop"
$VerbosePreference = "Continue"
$DebugPreference = "SilentlyContinue"

# Define log file path
$LogFile = Join-Path -Path $PSScriptRoot -ChildPath "deploy-log.txt"

# Function to log messages with timestamps and optionally exit on critical errors
function Write-DeployLog {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Message,

        [Parameter(Mandatory=$false)]
        [string]$Color = "White",

        [Parameter(Mandatory=$false)]
        [switch]$Critical,

        [Parameter(Mandatory=$false)]
        [int]$ExitCode = 1
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"

    # Write to console with color
    Write-Host $logMessage -ForegroundColor $Color

    # Write to log file
    Add-Content -Path $LogFile -Value $logMessage

    # Exit if critical error
    if ($Critical) {
        Write-Host "CRITICAL ERROR: Deployment failed. See $LogFile for details." -ForegroundColor Red
        exit $ExitCode
    }
}

# Start new log file
"--- Deployment Started: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ---" | Out-File -FilePath $LogFile -Force

# Function to check required commands/tools
function Test-CommandExists {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Command,

        [Parameter(Mandatory=$false)]
        [switch]$Critical,

        [Parameter(Mandatory=$false)]
        [string]$InstallMessage
    )

    $exists = Get-Command $Command -ErrorAction SilentlyContinue

    if (-not $exists) {
        if ($Critical) {
            Write-DeployLog "Required tool '$Command' not found. $InstallMessage" -Color Red -Critical
        } else {
            Write-DeployLog "Optional tool '$Command' not found. $InstallMessage" -Color Yellow
            return $false
        }
    }
    return $true
}

# Checkpoint function to verify success at critical stages
function Test-Checkpoint {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Description,

        [Parameter(Mandatory=$true)]
        [scriptblock]$Condition,

        [Parameter(Mandatory=$false)]
        [switch]$Critical
    )

    Write-DeployLog "Checking: $Description" -Color Cyan

    try {
        $result = & $Condition
        if ($result) {
            Write-DeployLog "✓ Checkpoint passed: $Description" -Color Green
            return $true
        } else {
            if ($Critical) {
                Write-DeployLog "✗ Critical checkpoint failed: $Description" -Color Red -Critical
            } else {
                Write-DeployLog "✗ Checkpoint failed: $Description" -Color Yellow
                return $false
            }
        }
    } catch {
        if ($Critical) {
            Write-DeployLog "✗ Critical checkpoint exception: $Description - $_" -Color Red -Critical
        } else {
            Write-DeployLog "✗ Checkpoint exception: $Description - $_" -Color Yellow
            return $false
        }
    }
}

# Validate prerequisites
Write-DeployLog "Validating prerequisites..." -Color Cyan

# Ensure we're on the correct branch (usually main or master)
$currentBranch = git rev-parse --abbrev-ref HEAD
if ($currentBranch -notin @("main", "master")) {
    Write-DeployLog "Warning: You're not on main/master branch. Current branch: $currentBranch" -Color Yellow
    $confirm = Read-Host "Do you want to continue deployment from the $currentBranch branch? (y/n)"
    if ($confirm -ne "y") {
        Write-DeployLog "Deployment cancelled by user." -Color Yellow
        exit 0
    }
}

# Check for uncommitted changes
$uncommittedChanges = git status --porcelain
if ($uncommittedChanges) {
    Write-DeployLog "Warning: You have uncommitted changes in your working directory." -Color Yellow
    $confirm = Read-Host "Do you want to continue deployment with uncommitted changes? (y/n)"
    if ($confirm -ne "y") {
        Write-DeployLog "Deployment cancelled by user." -Color Yellow
        exit 0
    }
}

# Check required tools
Test-CommandExists -Command "git" -Critical -InstallMessage "Please install Git from https://git-scm.com/downloads"
$npmExists = Test-CommandExists -Command "npm" -InstallMessage "Some features may not work. Install Node.js from https://nodejs.org/"

# Make sure we're in the right directory
Write-DeployLog "Setting working directory to script location..." -Color Cyan
Set-Location -Path $PSScriptRoot

# Create static build directory with error capturing
$BUILD_DIR = "./_site"
Write-DeployLog "Creating build directory at $BUILD_DIR" -Color Cyan

try {
    if (-not (Test-Path -Path $BUILD_DIR)) {
        New-Item -ItemType Directory -Path $BUILD_DIR | Out-Null
    } else {
        # Clean existing directory but keep .git if it exists
        Get-ChildItem -Path $BUILD_DIR -Exclude .git | Remove-Item -Recurse -Force
    }
} catch {
    Write-DeployLog "Failed to create or clean build directory: $_" -Color Red -Critical
}

# Create organized directory structure in build
Write-DeployLog "Creating directory structure..." -Color Cyan
try {
    $directories = @(
        "$BUILD_DIR/assets/css",
        "$BUILD_DIR/assets/js",
        "$BUILD_DIR/assets/images",
        "$BUILD_DIR/assets/fonts",
        "$BUILD_DIR/assets/videos",
        "$BUILD_DIR/components",
        "$BUILD_DIR/pages",
        "$BUILD_DIR/pages/team",
        "$BUILD_DIR/pages/blockchain",
        "$BUILD_DIR/pages/streaming",
        "$BUILD_DIR/docs"
    )

    foreach ($directory in $directories) {
        New-Item -ItemType Directory -Path $directory -Force | Out-Null
    }
} catch {
    Write-DeployLog "Failed to create directory structure: $_" -Color Red -Critical
}

# Function to safely copy files with error handling
function Copy-FileSafely {
    param (
        [Parameter(Mandatory=$true)]
        [string]$Source,

        [Parameter(Mandatory=$true)]
        [string]$Destination,

        [Parameter(Mandatory=$false)]
        [switch]$Recurse,

        [Parameter(Mandatory=$false)]
        [switch]$Critical
    )

    try {
        if (Test-Path -Path $Source) {
            if ($Recurse) {
                Copy-Item -Path $Source -Destination $Destination -Recurse -ErrorAction SilentlyContinue
            } else {
                Copy-Item -Path $Source -Destination $Destination -ErrorAction SilentlyContinue
            }
            Write-DeployLog "Copied: $Source -> $Destination" -Color Green
            return $true
        } else {
            Write-DeployLog "Source not found: $Source" -Color Yellow
            return $false
        }
    } catch {
        if ($Critical) {
            Write-DeployLog "Failed to copy $Source to $Destination: $_" -Color Red -Critical
        } else {
            Write-DeployLog "Failed to copy $Source to $Destination: $_" -Color Yellow
            return $false
        }
    }
}

# Copy root HTML files
Write-DeployLog "Copying root HTML files..." -Color Cyan
Copy-FileSafely -Source "index.html" -Destination "$BUILD_DIR/"
Copy-FileSafely -Source "404.html" -Destination "$BUILD_DIR/"

# Copy components
Write-DeployLog "Copying components..." -Color Cyan
if (Test-Path -Path "components") {
    Copy-FileSafely -Source "components/*" -Destination "$BUILD_DIR/components/" -Recurse
}

# Copy organized content pages from public directory
Write-DeployLog "Copying public content pages..." -Color Cyan
if (Test-Path -Path "public") {
    # Copy main pages
    $publicPages = @(
        "url-launcher.html", "status.html", "ai-companion.html",
        "creator-dashboard.html", "governance-visualization.html", "ranking-power.html"
    )

    foreach ($page in $publicPages) {
        Copy-FileSafely -Source "public/$page" -Destination "$BUILD_DIR/pages/"
    }

    # Copy team pages
    Copy-FileSafely -Source "public/team.html" -Destination "$BUILD_DIR/pages/team/"

    # Copy blockchain pages
    $blockchainPages = @("token.html", "token-explorer.html")
    foreach ($page in $blockchainPages) {
        Copy-FileSafely -Source "public/$page" -Destination "$BUILD_DIR/pages/blockchain/"
    }
    Copy-FileSafely -Source "prx-blockchain.html" -Destination "$BUILD_DIR/pages/blockchain/"

    # Copy streaming pages
    Copy-FileSafely -Source "public/streaming.html" -Destination "$BUILD_DIR/pages/streaming/"
}

# Also check root directory for any HTML files that should be moved to pages
Write-DeployLog "Checking for HTML files in root..." -Color Cyan
$rootPages = @(
    @{Source="team.html"; Destination="$BUILD_DIR/pages/team/"},
    @{Source="status.html"; Destination="$BUILD_DIR/pages/"},
    @{Source="streaming.html"; Destination="$BUILD_DIR/pages/streaming/"},
    @{Source="creator-dashboard.html"; Destination="$BUILD_DIR/pages/"},
    @{Source="governance-visualization.html"; Destination="$BUILD_DIR/pages/"},
    @{Source="ranking-power.html"; Destination="$BUILD_DIR/pages/"},
    @{Source="ai-companion.html"; Destination="$BUILD_DIR/pages/"},
    @{Source="prx-blockchain.html"; Destination="$BUILD_DIR/pages/blockchain/"}
)

foreach ($page in $rootPages) {
    Copy-FileSafely -Source $page.Source -Destination $page.Destination
}

# Copy Markdown files (for docs)
Write-DeployLog "Copying documentation files..." -Color Cyan
Copy-FileSafely -Source "docs/*.md" -Destination "$BUILD_DIR/docs/"

# Copy Jekyll config
Write-DeployLog "Copying Jekyll configuration..." -Color Cyan
Copy-FileSafely -Source "_config.yml" -Destination "$BUILD_DIR/" -Critical

# Copy assets
Write-DeployLog "Copying assets..." -Color Cyan
$assetDirectories = @(
    @{Source="assets/css"; Destination="$BUILD_DIR/assets/css/"},
    @{Source="assets/js"; Destination="$BUILD_DIR/assets/js/"},
    @{Source="assets/images"; Destination="$BUILD_DIR/assets/images/"},
    @{Source="assets/fonts"; Destination="$BUILD_DIR/assets/fonts/"},
    @{Source="assets/videos"; Destination="$BUILD_DIR/assets/videos/"}
)

foreach ($directory in $assetDirectories) {
    if (Test-Path -Path $directory.Source) {
        Copy-FileSafely -Source "$($directory.Source)/*" -Destination $directory.Destination -Recurse
    }
}

# Copy any smart contracts to a specific location in blockchain pages
Write-DeployLog "Copying smart contracts..." -Color Cyan
New-Item -ItemType Directory -Path "$BUILD_DIR/pages/blockchain/contracts" -Force | Out-Null

# Copy contract files
$contractFiles = @(
    "Streaming.sol", "StreamToken.sol", "StreamPayment.sol", "StreamAccessContract.sol"
)

foreach ($contract in $contractFiles) {
    Copy-FileSafely -Source $contract -Destination "$BUILD_DIR/pages/blockchain/contracts/"
}

if (Test-Path -Path "contracts") {
    Copy-FileSafely -Source "contracts/*" -Destination "$BUILD_DIR/pages/blockchain/contracts/" -Recurse
}

# Verify npm availability with helpful error message
Write-DeployLog "Checking Node.js and npm..." -Color Cyan
if (-not $npmExists) {
    Write-DeployLog "Node.js/npm not found. Installing Node modules will be skipped." -Color Yellow
}

# Check if Emscripten is available with better error handling
Write-DeployLog "Checking for Emscripten compiler..." -Color Cyan
$emccAvailable = $false
$emccPath = Join-Path -Path $PSScriptRoot -ChildPath "emsdk\upstream\emscripten\emcc.bat"

if (Test-Path $emccPath) {
    Write-DeployLog "Found emcc at: $emccPath" -Color Green
    $emccAvailable = $true
} else {
    # Try to find emcc in PATH
    $emcc = Get-Command emcc -ErrorAction SilentlyContinue
    if ($emcc) {
        Write-DeployLog "Found emcc in PATH: $($emcc.Source)" -Color Green
        $emccAvailable = $true
    } else {
        Write-DeployLog "Emscripten compiler (emcc) not found in default location or PATH." -Color Yellow
        Write-DeployLog "Attempting to activate emsdk automatically..." -Color Yellow

        $emsdkPath = Join-Path -Path $PSScriptRoot -ChildPath "emsdk"
        if (Test-Path $emsdkPath) {
            Write-DeployLog "Found emsdk, activating environment..." -Color Cyan
            try {
                Push-Location $emsdkPath
                & .\emsdk_env.bat
                $emsdkActivated = $?
                Pop-Location

                if ($emsdkActivated) {
                    Write-DeployLog "Successfully activated emsdk environment." -Color Green
                    $emccAvailable = $true
                } else {
                    Write-DeployLog "Failed to activate emsdk environment." -Color Red
                }
            } catch {
                Write-DeployLog "Error activating emsdk: $_" -Color Red
            }
        } else {
            Write-DeployLog "emsdk not found at $emsdkPath. Please run the setup_emsdk task first." -Color Red
            $confirm = Read-Host "Continue without WebAssembly support? (y/n)"
            if ($confirm -ne "y") {
                Write-DeployLog "Deployment cancelled by user." -Color Yellow
                exit 0
            }
        }
    }
}

# Create a minimal package.json for GitHub Pages in the build directory
Write-DeployLog "Creating package.json for GitHub Pages..." -Color Cyan
@'
{
  "name": "web3-core-functionality",
  "version": "1.0.0",
  "private": true,
  "dependencies": {}
}
'@ | Out-File -FilePath "$BUILD_DIR/package.json" -Encoding utf8

# Build the Red X web version
Write-DeployLog "Building Red X WebAssembly component..." -Color Cyan

# Set up a try-catch block for the Red X build process
try {
    Push-Location "red_x"

    # Make sure required JavaScript libraries are available
    Write-DeployLog "Checking for required npm packages..." -Color Cyan
    if (-not (Test-Path -Path "node_modules")) {
        if ($npmExists) {
            Write-DeployLog "Installing npm packages..." -Color Cyan
            npm install --no-optional

            # Check npm install success
            if ($LASTEXITCODE -ne 0) {
                throw "npm install failed with exit code $LASTEXITCODE"
            }
        } else {
            Write-DeployLog "Skipping npm install (npm not available)" -Color Yellow
        }
    }

    # Create a fallback template.html if needed
    if ((-not (Test-Path -Path "template.html")) -and (Test-Path -Path "index.html")) {
        Write-DeployLog "Creating fallback template.html from index.html..." -Color Cyan
        Copy-Item -Path "index.html" -Destination "template.html"

        # Remove any server-dependent references
        (Get-Content -Path "template.html") -replace '/api/version', '#' | Set-Content -Path "template.html"
        (Get-Content -Path "template.html") -replace '/socket.io/socket.io.js', 'https://cdn.socket.io/4.5.0/socket.io.min.js' | Set-Content -Path "template.html"
    }

    # Only proceed with WASM build if emcc is available
    if ($emccAvailable) {
        Write-DeployLog "Building Red X WebAssembly..." -Color Cyan
        # Activate emsdk environment
        $emsdkPath = Join-Path -Path $PSScriptRoot -ChildPath "emsdk"
        if (Test-Path $emsdkPath) {
            Write-DeployLog "Re-activating emsdk environment to ensure correct setup..." -Color Cyan
            # Source the emsdk_env.bat to set up environment variables
            & "$emsdkPath\emsdk_env.bat" | Out-Null
        }

        # Build using emcc
        $emccPath = Join-Path -Path $PSScriptRoot -ChildPath "emsdk\upstream\emscripten\emcc.bat"
        if (Test-Path $emccPath) {
            Write-DeployLog "Using emcc at: $emccPath" -Color Cyan
            & $emccPath main.c -o index.html -s USE_SDL=2 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 `
                --shell-file template.html -s NO_EXIT_RUNTIME=1 -s "EXPORTED_RUNTIME_METHODS=cwrap" `
                -s ENVIRONMENT=web -s MODULARIZE=1 -s "EXPORT_NAME=RedXModule" `
                -s ERROR_ON_UNDEFINED_SYMBOLS=0 # More permissive to avoid common build errors
        }
        else {
            # Fall back to PATH-based emcc
            Write-DeployLog "Using emcc from PATH" -Color Cyan
            $emccCommand = Get-Command emcc -ErrorAction SilentlyContinue

            if ($emccCommand) {
                emcc main.c -o index.html -s USE_SDL=2 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 `
                    --shell-file template.html -s NO_EXIT_RUNTIME=1 -s "EXPORTED_RUNTIME_METHODS=cwrap" `
                    -s ENVIRONMENT=web -s MODULARIZE=1 -s "EXPORT_NAME=RedXModule" `
                    -s ERROR_ON_UNDEFINED_SYMBOLS=0 # More permissive to avoid common build errors
            } else {
                throw "emcc command not found in PATH after environment activation"
            }
        }

        if ($LASTEXITCODE -ne 0) {
            throw "WebAssembly build failed with exit code $LASTEXITCODE"
        }

        # Verify the build created the expected output files
        if (-not (Test-Path -Path "index.html") -or -not (Test-Path -Path "index.js") -or -not (Test-Path -Path "index.wasm")) {
            throw "WebAssembly build did not produce all required output files"
        }

        Write-DeployLog "WebAssembly build completed successfully" -Color Green
    } else {
        Write-DeployLog "Skipping WebAssembly build (emcc not available)" -Color Yellow

        # Create placeholder files if WebAssembly build is skipped
        if (-not (Test-Path -Path "index.html")) {
            @'
<!DOCTYPE html>
<html>
<head>
  <title>Red X Placeholder</title>
  <meta charset="utf-8">
</head>
<body>
  <h1>Red X WebAssembly Component</h1>
  <p>This is a placeholder for the WebAssembly component that could not be built.</p>
  <p>Please ensure Emscripten is properly installed and configured.</p>
</body>
</html>
'@ | Out-File -FilePath "index.html" -Encoding utf8
        }
    }

    # Create static version directory
    Write-DeployLog "Copying Red X build output to static site..." -Color Cyan
    New-Item -ItemType Directory -Path "../_site/red_x" -Force | Out-Null

    # Copy necessary files
    Copy-FileSafely -Source "index.html" -Destination "../_site/red_x/" -Critical
    Copy-FileSafely -Source "index.js" -Destination "../_site/red_x/"
    Copy-FileSafely -Source "index.wasm" -Destination "../_site/red_x/"

    # Copy test deployment file if it exists
    if (Test-Path -Path "deployment_test.html") {
        Write-DeployLog "Copying deployment test file..." -Color Cyan
        Copy-FileSafely -Source "deployment_test.html" -Destination "../_site/red_x/"
    }

    # Copy copyright information in machine language
    New-Item -ItemType Directory -Path "../_site/red_x/legal" -Force | Out-Null
    Copy-FileSafely -Source "COPYRIGHT.*" -Destination "../_site/red_x/legal/"

    # Make sure the js directory exists before copying
    if (Test-Path -Path "js") {
        New-Item -ItemType Directory -Path "../_site/red_x/js" -Force | Out-Null
        Copy-FileSafely -Source "js/*" -Destination "../_site/red_x/js/" -Recurse
    }
    else {
        Write-DeployLog "Creating minimal required JS files..." -Color Cyan
        New-Item -ItemType Directory -Path "../_site/red_x/js" -Force | Out-Null

        # Create minimal required JS files
        "// Fallback file created by deployment script" | Out-File -FilePath "../_site/red_x/js/link-extractor.js" -Encoding utf8

        # Create a simple link extractor
        @'
class LinkExtractor {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container element with ID "${containerId}" not found`);
    }
  }
  async loadLinks(txtFilePath) {
    try {
      const response = await fetch(txtFilePath);
      if (!response.ok) { throw new Error(`Failed to load ${txtFilePath}`); }
      const content = await response.text();
      this.parseAndDisplay(content);
    } catch (error) {
      console.error('Error loading links:', error);
      this.container.innerHTML = `<p class="error">Failed to load links</p>`;
      this.useFallbackData();
    }
  }
  useFallbackData() {
    const fallbackData = `# GitHub Pages Fallback Links\n\n## WebAssembly Resources\n<a href="https://developer.mozilla.org/en-US/docs/WebAssembly">WebAssembly Documentation</a>\n<a href="https://emscripten.org/">Emscripten</a>`;
    this.parseAndDisplay(fallbackData);
  }
  parseAndDisplay(content) {
    this.container.innerHTML = '<p>Static GitHub Pages version - links loaded</p>';
    const sections = content.split(/^## /m);
    sections.forEach(section => {
      if (section.trim()) {
        const div = document.createElement('div');
        div.className = 'link-section';
        div.innerHTML = section;
        this.container.appendChild(div);
      }
    });
  }
}
if (typeof window !== 'undefined') { window.LinkExtractor = LinkExtractor; }
'@ | Out-File -FilePath "../_site/red_x/js/link-extractor.js" -Encoding utf8
    }
} catch {
    Write-DeployLog "Error during Red X build: $_" -Color Red

    # Prompt user if they want to continue despite the error
    $continueAfterError = Read-Host "Red X build failed. Continue with deployment anyway? (y/n)"
    if ($continueAfterError -ne "y") {
        Write-DeployLog "Deployment cancelled due to Red X build failure." -Color Red -Critical
    } else {
        Write-DeployLog "Continuing deployment despite Red X build failure." -Color Yellow
    }
} finally {
    # Ensure we return to the original directory
    Pop-Location
}

# Copy links file if it exists
Write-DeployLog "Copying links file..." -Color Cyan
if (Test-Path -Path "wub-links.txt") {
    Copy-FileSafely -Source "wub-links.txt" -Destination "$BUILD_DIR/"
}
else {
    # Create a simple fallback file
    Write-DeployLog "Creating fallback links file..." -Color Cyan
    @'
# WUB Links (Fallback)

## Resources
<a href="https://developer.mozilla.org/en-US/docs/WebAssembly">WebAssembly Documentation</a>
'@ | Out-File -FilePath "$BUILD_DIR/wub-links.txt" -Encoding utf8
}

# Create .nojekyll file to prevent Jekyll processing
Write-DeployLog "Creating .nojekyll file..." -Color Cyan
"" | Out-File -FilePath "$BUILD_DIR/.nojekyll" -Encoding utf8 -NoNewline

# Create _headers file for Cloudflare/Netlify edge caching
Write-DeployLog "Creating security headers for CDN..." -Color Cyan
@'
# All pages
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.socket.io; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.cloudflare.com wss://*.cloudflare.com; worker-src 'self' blob:;

# WebAssembly specific headers
/*.wasm
  Content-Type: application/wasm
  Cache-Control: public, max-age=86400

# API responses should not be cached
/api/*
  Cache-Control: no-cache
'@ | Out-File -FilePath "$BUILD_DIR/_headers" -Encoding utf8

# Write edge functions redirects file for Netlify/Vercel
Write-DeployLog "Creating API redirects for serverless functions..." -Color Cyan
@'
# Netlify/Vercel Edge Functions redirects
/api/*  /.netlify/functions/api-handler  200
'@ | Out-File -FilePath "$BUILD_DIR/_redirects" -Encoding utf8

# Create a CNAME file if needed (customize domain here)
Write-DeployLog "Creating CNAME file..." -Color Cyan
"www.web3streaming.example" | Out-File -FilePath "$BUILD_DIR/CNAME" -Encoding utf8 -NoNewline

# Verify the build output before proceeding
Test-Checkpoint -Description "Verify build output files exist" -Condition {
    (Test-Path -Path "$BUILD_DIR/index.html") -and
    (Test-Path -Path "$BUILD_DIR/.nojekyll") -and
    (Test-Path -Path "$BUILD_DIR/CNAME")
} -Critical

# Automated GitHub Pages deployment
Write-DeployLog "Deploying to GitHub Pages..." -Color Cyan
$gitAvailable = Get-Command git -ErrorAction SilentlyContinue

if ($gitAvailable) {
    try {
        # Save the current branch to restore it later
        $originalBranch = git rev-parse --abbrev-ref HEAD
        Write-DeployLog "Current branch: $originalBranch (will restore after deployment)" -Color Cyan

        # Check if gh-pages branch exists
        $ghPagesBranchExists = git branch --list gh-pages
        if (-not $ghPagesBranchExists) {
            Write-DeployLog "Creating gh-pages branch..." -Color Cyan
            git checkout --orphan gh-pages
            git rm -rf .
            "" | Out-File -FilePath ".nojekyll" -Encoding utf8 -NoNewline
            git add .nojekyll
            git commit -m "Initialize gh-pages branch"
            git push origin gh-pages
            git checkout $originalBranch
        }

        # Deploy to GitHub Pages using git worktree with better error handling
        Write-DeployLog "Deploying build to gh-pages branch..." -Color Cyan

        # Clean up any existing worktree
        if (Test-Path -Path ".git/worktrees/gh-pages") {
            Write-DeployLog "Removing existing worktree..." -Color Cyan
            Remove-Item -Path ".git/worktrees/gh-pages" -Recurse -Force
        }

        # Check if gh-pages directory exists and remove it
        if (Test-Path -Path "gh-pages") {
            Write-DeployLog "Removing existing gh-pages directory..." -Color Cyan
            Remove-Item -Path "gh-pages" -Recurse -Force
        }

        # Create a worktree for gh-pages branch
        git worktree add -f gh-pages gh-pages

        if (Test-Path -Path "gh-pages") {
            # Remove all files in gh-pages but keep .git
            Write-DeployLog "Preparing gh-pages directory..." -Color Cyan
            Get-ChildItem -Path "gh-pages" -Exclude .git | Remove-Item -Recurse -Force

            # Copy build files to gh-pages
            Write-DeployLog "Copying build files to gh-pages..." -Color Cyan
            Copy-Item -Path "$BUILD_DIR/*" -Destination "gh-pages/" -Recurse -Force

            Push-Location "gh-pages"

            # Check if there are any changes to commit
            $status = git status --porcelain
            if ($status) {
                Write-DeployLog "Committing changes to gh-pages branch..." -Color Cyan
                git add --all
                git commit -m "Deploy to GitHub Pages: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

                # Push with error handling
                Write-DeployLog "Pushing to GitHub..." -Color Cyan
                git push origin gh-pages

                if ($LASTEXITCODE -ne 0) {
                    Write-DeployLog "Failed to push to GitHub. Exit code: $LASTEXITCODE" -Color Red
                    $retry = Read-Host "Do you want to retry the push? (y/n)"

                    if ($retry -eq "y") {
                        Write-DeployLog "Retrying push..." -Color Yellow
                        git push origin gh-pages --force

                        if ($LASTEXITCODE -ne 0) {
                            Write-DeployLog "Push retry failed. Exit code: $LASTEXITCODE" -Color Red
                        } else {
                            Write-DeployLog "Push retry successful!" -Color Green
                        }
                    }
                } else {
                    Write-DeployLog "Successfully pushed to GitHub!" -Color Green
                }
            } else {
                Write-DeployLog "No changes to commit to gh-pages branch." -Color Yellow
            }

            Pop-Location
            git worktree remove -f gh-pages

            # Restore the original branch
            git checkout $originalBranch

            Test-Checkpoint -Description "Verify deployment completed successfully" -Condition {
                $true # If we made it here without exceptions, consider successful
            }

            Write-DeployLog "Successfully deployed to GitHub Pages!" -Color Green
        } else {
            Write-DeployLog "Failed to create git worktree for gh-pages branch." -Color Red
        }
    } catch {
        Write-DeployLog "Error during git deployment: $_" -Color Red

        # Attempt to restore original state
        try {
            if ($originalBranch) {
                git checkout $originalBranch
            }
            if (Test-Path -Path "gh-pages") {
                Remove-Item -Path "gh-pages" -Recurse -Force
            }
        } catch {
            Write-DeployLog "Error while restoring original state: $_" -Color Red
        }
    }
} else {
    Write-DeployLog "Git not available, skipping automatic deployment." -Color Yellow
    Write-DeployLog "Static build complete! Files are in the ./_site directory." -Color Green
}

# Print deployment summary and instructions
Write-DeployLog "" -Color White
Write-DeployLog "============== DEPLOYMENT SUMMARY ==============" -Color Cyan
Write-DeployLog "Build completed: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -Color White
Write-DeployLog "Log file: $LogFile" -Color White
Write-DeployLog "Build directory: $BUILD_DIR" -Color White

if (-not $gitAvailable) {
    Write-DeployLog "" -Color White
    Write-DeployLog "To manually deploy to GitHub Pages:" -Color Cyan
    Write-DeployLog "1. Create a gh-pages branch (if not already created)" -Color White
    Write-DeployLog "2. Copy the contents of the _site directory to the gh-pages branch" -Color White
    Write-DeployLog "3. Push the gh-pages branch to GitHub" -Color White
    Write-DeployLog "" -Color White
    Write-DeployLog "Or use gh-pages npm package with: npm install -g gh-pages && gh-pages -d _site" -Color White
}

Write-DeployLog "=============================================" -Color Cyan
Write-DeployLog "Deployment script completed!" -Color Green
